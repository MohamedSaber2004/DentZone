import { computed, reactive, ref, watch } from 'vue'
import type { Product } from '../domain/models/product'
import type { WishlistRepository } from '../domain/ports/wishlist-repository'
import type { AuthService } from './auth.service'
import type { CatalogService } from './catalog.service'

const STORAGE_KEY = 'dentzone.wishlist.v1'

const loadPersistedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export class WishlistService {
  private readonly wishlistRepository: WishlistRepository
  private readonly authService: AuthService
  private readonly catalogService: CatalogService

  private localIds = reactive<string[]>(loadPersistedIds())

  readonly items = ref<Product[]>([])
  readonly loading = ref(false)

  readonly idSet = computed<Set<string>>(() => {
    const set = new Set<string>()
    for (const item of this.items.value) {
      set.add(item.id)
    }
    if (!this.authed) {
      for (const id of this.localIds) {
        set.add(id)
      }
    }
    return set
  })

  readonly count = computed<number>(() => this.idSet.value.size)

  private get authed(): boolean {
    return this.authService.isAuthenticated
  }

  constructor(wishlistRepository: WishlistRepository, authService: AuthService, catalogService: CatalogService) {
    this.wishlistRepository = wishlistRepository
    this.authService = authService
    this.catalogService = catalogService

    watch(
      this.localIds,
      (ids) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
      },
      { deep: true },
    )

    watch(
      () => this.authService.user.value,
      () => {
        void this.refresh()
      },
      { immediate: true },
    )
  }

  has(productId: string): boolean {
    return this.idSet.value.has(productId)
  }

  async refresh(): Promise<void> {
    if (this.authed) {
      this.loading.value = true
      try {
        const fetched = await this.wishlistRepository.get()
        this.items.value = Array.isArray(fetched) ? fetched : []
      } catch {
        this.items.value = []
      } finally {
        this.loading.value = false
      }
      return
    }

    this.loading.value = true
    try {
      if (this.localIds.length === 0) {
        this.items.value = []
        return
      }
      const products = await this.catalogService.getAllProducts()
      const byId = new Map(products.map((product) => [product.id, product]))
      this.items.value = this.localIds.flatMap((id) => {
        const product = byId.get(id)
        return product ? [product] : []
      })
    } catch {
      this.items.value = []
    } finally {
      this.loading.value = false
    }
  }

  async toggle(product: Product): Promise<boolean> {
    const present = this.has(product.id)

    if (this.authed) {
      if (present) {
        await this.wishlistRepository.remove(product.id)
        this.items.value = this.items.value.filter((item) => item.id !== product.id)
      } else {
        await this.wishlistRepository.add(product.id)
        this.items.value = [product, ...this.items.value.filter((item) => item.id !== product.id)]
      }
      return !present
    }

    const index = this.localIds.indexOf(product.id)
    if (index !== -1) {
      this.localIds.splice(index, 1)
      this.items.value = this.items.value.filter((item) => item.id !== product.id)
    } else {
      this.localIds.unshift(product.id)
      this.items.value = [product, ...this.items.value.filter((item) => item.id !== product.id)]
    }
    return !present
  }

  async remove(productId: string): Promise<void> {
    if (this.authed) {
      await this.wishlistRepository.remove(productId)
      this.items.value = this.items.value.filter((item) => item.id !== productId)
      return
    }

    const index = this.localIds.indexOf(productId)
    if (index !== -1) {
      this.localIds.splice(index, 1)
    }
    this.items.value = this.items.value.filter((item) => item.id !== productId)
  }

  async clear(): Promise<void> {
    if (this.authed) {
      await this.wishlistRepository.clear()
      this.items.value = []
      return
    }
    this.localIds.splice(0, this.localIds.length)
    this.items.value = []
  }
}