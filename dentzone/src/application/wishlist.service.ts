import { ref, watch } from 'vue'
import type { AuthService } from './auth.service'
import type { ProductRepository } from '../domain/ports/product-repository'
import { toastService } from '../infrastructure/feedback/toast.service'
import { ApiError } from '../infrastructure/http/api-error'
import { API_LANG } from '../config/api.config'
import { locale, t } from '../i18n'
import router from '../router'

export interface WishlistToggleInput {
  productId: string
  productPriceId: string
  /** Supplier of the card being toggled — used to pick the matching price row. */
  inventoryUserId?: string
  name: string
}

/** All-zero GUID — some catalog endpoints return this instead of a real price id. */
const EMPTY_GUID = /^0{8}-0{4}-0{4}-0{4}-0{12}$/i

/**
 * Shared wishlist state + toggle flow.
 * Keeps one authoritative set of favorite ids across the whole app,
 * updates optimistically and reports success/failure via localized toasts.
 */
export class WishlistService {
  readonly favoriteIds = ref<Set<string>>(new Set())
  readonly busyIds = ref<Set<string>>(new Set())
  /** Number of saved products — drives the header badge. */
  readonly count = ref(0)

  private loaded = false
  private readonly resolvedPriceIds = new Map<string, string>()

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly authService: AuthService,
  ) {
    watch(
      () => this.authService.user.value,
      async (user, previous) => {
        if (user && !previous) {
          await this.refresh(true)
        } else if (!user && previous) {
          this.favoriteIds.value = new Set()
          this.count.value = 0
          this.loaded = false
        }
      },
    )
  }

  /**
   * Favorites are tracked by BOTH ids (productId + productPriceId) because
   * catalog endpoints only provide an all-zero price id while the server
   * list returns real ones — checking either keeps hearts in sync everywhere.
   */
  isFavorite(...ids: string[]): boolean {
    return ids.some((id) => id && this.favoriteIds.value.has(id))
  }

  /** Merge server-reported favorite flags into the shared set (no fetch). */
  mergeFavorites(productPriceIds: string[]): void {
    if (productPriceIds.length === 0) return
    const next = new Set(this.favoriteIds.value)
    let changed = false
    for (const id of productPriceIds) {
      if (id && !EMPTY_GUID.test(id) && !next.has(id)) {
        next.add(id)
        changed = true
      }
    }
    if (changed) this.favoriteIds.value = next
  }

  async refresh(force = false): Promise<void> {
    const user = this.authService.user.value
    if (!user || (this.loaded && !force)) return
    try {
      const list = await this.productRepository.getMyFavorites()
      const next = new Set<string>()
      for (const item of list) {
        if (item.productPriceId && !EMPTY_GUID.test(item.productPriceId)) next.add(item.productPriceId)
        if (item.productId) next.add(item.productId)
      }
      this.favoriteIds.value = next
      this.count.value = list.length
      this.loaded = true
    } catch {
      // Favorites are a secondary enhancement; keep whatever state we have.
    }
  }

  /**
   * Catalog endpoints (search-product / search-product-category / popularproducts)
   * return an all-zero productPriceId, which the backend rejects. Resolve the
   * real per-supplier price id via /api/ProductPrices/by-product/{productId}
   * and cache it per product.
   */
  private async resolvePriceId(productId: string, inventoryUserId?: string): Promise<string> {
    const cached = this.resolvedPriceIds.get(productId)
    if (cached) return cached

    const prices = await this.productRepository.getPricesByProduct(productId)
    const usable = prices.length > 0 ? prices : await this.resolvePriceIdFromDetail(productId)
    const pick =
      (inventoryUserId ? usable.find((p) => p.inventoryUserId === inventoryUserId && p.effectiveSalesPrice > 0) : undefined) ??
      (inventoryUserId ? usable.find((p) => p.inventoryUserId === inventoryUserId) : undefined) ??
      usable.find((p) => p.effectiveSalesPrice > 0) ??
      usable[0]
    if (!pick?.productPriceId || EMPTY_GUID.test(pick.productPriceId)) {
      throw new ApiError(0, 'No purchasable price found for this product')
    }
    this.resolvedPriceIds.set(productId, pick.productPriceId)
    return pick.productPriceId
  }

  /** Fallback when the by-product endpoint returns nothing usable. */
  private async resolvePriceIdFromDetail(
    productId: string,
  ): Promise<{ productPriceId: string; effectiveSalesPrice: number; inventoryUserId: string }[]> {
    const lang = locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH
    const detail = await this.productRepository.getProductById(productId, lang)
    return (detail.prices ?? [])
      .filter((p) => p.id && !EMPTY_GUID.test(p.id))
      .map((p) => ({
        productPriceId: p.id,
        effectiveSalesPrice: p.effectiveSalesPrice,
        inventoryUserId: p.inventoryUserId,
      }))
  }

  /**
   * Optimistically toggles a favorite, shows a localized toast on the outcome
   * and reverts the heart if the request fails.
   */
  async toggle(input: WishlistToggleInput): Promise<boolean> {
    const user = this.authService.user.value
    if (!user) {
      toastService.info(t('wishlist.loginToast'))
      void router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
      return false
    }
    // Busy is keyed by productId — catalog items all share the same zero price id,
    // so keying by price id would wrongly disable unrelated cards mid-request.
    if (this.busyIds.value.has(input.productId)) return false

    this.busyIds.value = new Set(this.busyIds.value).add(input.productId)
    const wasFavorite = this.isFavorite(input.productId, input.productPriceId)

    const optimistic = new Set(this.favoriteIds.value)
    if (wasFavorite) {
      optimistic.delete(input.productId)
      optimistic.delete(input.productPriceId)
      const resolved = this.resolvedPriceIds.get(input.productId)
      if (resolved) optimistic.delete(resolved)
    } else {
      optimistic.add(input.productId)
      if (input.productPriceId && !EMPTY_GUID.test(input.productPriceId)) optimistic.add(input.productPriceId)
    }
    this.favoriteIds.value = optimistic
    this.count.value = Math.max(0, this.count.value + (wasFavorite ? -1 : 1))

    try {
      const priceId =
        input.productPriceId && !EMPTY_GUID.test(input.productPriceId)
          ? input.productPriceId
          : await this.resolvePriceId(input.productId, input.inventoryUserId)
      await this.productRepository.toggleFavorite(user.id, input.productId, priceId)
      // Track the resolved id so future heart-state lookups match the server list.
      const settled = new Set(this.favoriteIds.value)
      if (wasFavorite) settled.delete(priceId)
      else settled.add(priceId)
      this.favoriteIds.value = settled
      toastService.success(
        t(wasFavorite ? 'wishlist.removedToast' : 'wishlist.addedToast', { name: input.name }),
        wasFavorite
          ? undefined
          : {
              action: {
                label: t('wishlist.viewWishlist'),
                onClick: () => void router.push({ name: 'wishlist' }),
              },
            },
      )
      return true
    } catch (err) {
      const reverted = new Set(this.favoriteIds.value)
      if (wasFavorite) {
        reverted.add(input.productId)
        if (input.productPriceId && !EMPTY_GUID.test(input.productPriceId)) reverted.add(input.productPriceId)
      } else {
        reverted.delete(input.productId)
        reverted.delete(input.productPriceId)
      }
      this.favoriteIds.value = reverted
      this.count.value = Math.max(0, this.count.value + (wasFavorite ? 1 : -1))
      toastService.error(
        err instanceof ApiError && err.status === 403
          ? t('wishlist.forbiddenToast')
          : t('wishlist.errorToast'),
      )
      return false
    } finally {
      const busy = new Set(this.busyIds.value)
      busy.delete(input.productId)
      this.busyIds.value = busy
    }
  }
}
