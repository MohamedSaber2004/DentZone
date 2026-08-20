import { computed, ref, watch } from 'vue'
import type { AuthService } from './auth.service'
import type { CartRepository } from '../domain/ports/cart-repository'
import type { AddToCartInput, CartDto } from '../domain/models/cart'
import { toastService } from '../infrastructure/feedback/toast.service'
import { t } from '../i18n'
import router from '../router'

const clampQuantity = (quantity: number, stockQuantity: number, maxQuantity: number): number => {
  const upper = Math.min(stockQuantity > 0 ? stockQuantity : Number.POSITIVE_INFINITY, maxQuantity > 0 ? maxQuantity : Number.POSITIVE_INFINITY)
  return Math.min(Math.max(1, quantity), Number.isFinite(upper) ? upper : quantity)
}

export class CartService {
  readonly cart = ref<CartDto | null>(null)
  readonly syncing = ref(false)

  private readonly cartRepository: CartRepository
  private readonly authService: AuthService

  constructor(cartRepository: CartRepository, authService: AuthService) {
    this.cartRepository = cartRepository
    this.authService = authService
    watch(
      () => this.authService.user.value,
      async (user, previous) => {
        if (user && !previous) {
          await this.refresh()
        } else if (!user && previous) {
          this.cart.value = null
        }
      },
    )
  }

  readonly count = computed(() => this.cart.value?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0)

  readonly total = computed(() => this.cart.value?.totalAmountCart ?? 0)

  async init(): Promise<void> {
    if (!this.authService.isAuthenticated) return
    await this.refresh()
  }

  async add(input: AddToCartInput): Promise<boolean> {
    const user = this.authService.user.value
    if (!user) return false
    try {
      await this.cartRepository.addToCart({
        userId: user.id,
        inventoryId: input.inventoryId,
        productId: input.productId,
        quantity: clampQuantity(input.quantity, input.stockQuantity, input.maxQuantity),
      })
      toastService.success(t('product.addToast', { name: input.name }), {
        action: { label: t('cart.viewCart'), onClick: () => void router.push({ name: 'cart' }) },
      })
      await this.refresh()
      return true
    } catch {
      toastService.error(t('cart.errorToast'))
      return false
    }
  }

  async updateQuantity(input: { productId: string; inventoryId: string; quantity: number; name: string }): Promise<boolean> {
    const user = this.authService.user.value
    if (!user) return false
    try {
      await this.cartRepository.updateQuantity({
        userId: user.id,
        productId: input.productId,
        inventoryId: input.inventoryId,
        quantity: input.quantity,
      })
      await this.refresh()
      return true
    } catch {
      toastService.error(t('cart.errorToast'))
      return false
    }
  }

  async remove(input: { productId: string; inventoryId: string; name: string }): Promise<boolean> {
    const user = this.authService.user.value
    if (!user) return false
    try {
      await this.cartRepository.removeFromCart({ userId: user.id, productId: input.productId })
      toastService.success(t('cart.removedToast', { name: input.name }))
      await this.refresh()
      return true
    } catch {
      toastService.error(t('cart.errorToast'))
      return false
    }
  }

  async refresh(): Promise<boolean> {
    const user = this.authService.user.value
    if (!user) return false
    try {
      this.cart.value = await this.cartRepository.getCart(user.id)
      return true
    } catch {
      this.cart.value = null
      return false
    }
  }

  clear(): void {
    this.cart.value = null
  }
}