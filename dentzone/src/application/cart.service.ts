import { computed, ref, watch } from 'vue'
import type { AuthService } from './auth.service'
import type { CartRepository } from '../domain/ports/cart-repository'
import type { AddToCartInput, CartDto, GuestCartItem } from '../domain/models/cart'
import { toastService } from '../infrastructure/feedback/toast.service'
import { t } from '../i18n'
import router from '../router'

const GUEST_CART_KEY = 'dentzone_guest_cart'

const clampQuantity = (quantity: number, stockQuantity: number, maxQuantity: number): number => {
  const upper = Math.min(
    stockQuantity > 0 ? stockQuantity : Number.POSITIVE_INFINITY,
    maxQuantity > 0 ? maxQuantity : Number.POSITIVE_INFINITY,
  )
  return Math.min(Math.max(1, quantity), Number.isFinite(upper) ? upper : quantity)
}

const readGuestCart = (): GuestCartItem[] => {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeGuestCart = (items: GuestCartItem[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(GUEST_CART_KEY)
    } else {
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
    }
  } catch {
    // Ignore storage errors in private browsing or quota limits
  }
}

const createSyntheticCart = (items: GuestCartItem[]): CartDto => {
  const totalAmountCart = items.reduce((sum, item) => sum + (item.salesPrice * item.quantity), 0)
  return {
    id: 0,
    userId: 'guest',
    totalAmountCart,
    isAvailableNow: true,
    isFlashSale: false,
    items: items.map((item, index) => ({
      id: index + 1,
      productId: item.productId,
      quantity: item.quantity,
      totalAmount: item.salesPrice * item.quantity,
      productPriceId: '',
      status: 1,
      inventoryUserId: item.inventoryId,
      isAvailableNow: true,
      product: {
        id: item.productId,
        name: item.name,
        arabicName: item.arabicName || item.name,
        preef: '',
        description: '',
        productImage: item.image || '',
      },
      productPrice: {
        id: '',
        productId: item.productId,
        purchasePrice: item.salesPrice,
        salesPrice: item.salesPrice,
        flashSaleFromDate: null,
        flashSaleToDate: null,
        priceBeforeFlashSale: item.salesPrice,
        priceAfterFlashSale: null,
        isFlashSaleActive: false,
        effectiveSalesPrice: item.salesPrice,
        creationDate: '',
        inventoryUserId: item.inventoryId,
        stockQuantity: item.stockQuantity,
        maxQuantity: item.maxQuantity,
      },
      inventoryUser: {
        id: item.inventoryId,
        fullName: item.supplier || '',
        userName: item.supplier || '',
        photo: null,
        isActive: true,
        minOrder: null,
      },
    })),
  }
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
          await this.syncGuestCartToServer()
          await this.refresh()
        } else if (!user && previous) {
          this.cart.value = createSyntheticCart(readGuestCart())
        }
      },
    )
  }

  readonly count = computed(() => this.cart.value?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0)

  readonly total = computed(() => this.cart.value?.totalAmountCart ?? 0)

  async init(): Promise<void> {
    if (this.authService.isAuthenticated) {
      await this.syncGuestCartToServer()
      await this.refresh()
    } else {
      this.cart.value = createSyntheticCart(readGuestCart())
    }
  }

  async add(input: AddToCartInput): Promise<boolean> {
    const user = this.authService.user.value
    const clampedQty = clampQuantity(input.quantity, input.stockQuantity, input.maxQuantity)

    if (!user) {
      const items = readGuestCart()
      const existingIndex = items.findIndex(
        (i) => i.productId === input.productId && i.inventoryId === input.inventoryId,
      )
      if (existingIndex >= 0) {
        const item = items[existingIndex]!
        const nextQty = clampQuantity(item.quantity + clampedQty, input.stockQuantity, input.maxQuantity)
        items[existingIndex] = {
          ...item,
          quantity: nextQty,
          name: input.name || item.name,
          arabicName: input.arabicName || item.arabicName,
          image: input.image || item.image,
          supplier: input.supplier || item.supplier,
          salesPrice: input.salesPrice ?? item.salesPrice,
          stockQuantity: input.stockQuantity,
          maxQuantity: input.maxQuantity,
        }
      } else {
        items.push({
          productId: input.productId,
          inventoryId: input.inventoryId,
          quantity: clampedQty,
          name: input.name,
          arabicName: input.arabicName,
          image: input.image,
          supplier: input.supplier,
          salesPrice: input.salesPrice ?? 0,
          stockQuantity: input.stockQuantity,
          maxQuantity: input.maxQuantity,
        })
      }
      writeGuestCart(items)
      this.cart.value = createSyntheticCart(items)
      toastService.success(t('product.addToast', { name: input.name }), {
        action: { label: t('cart.viewCart'), onClick: () => void router.push({ name: 'cart' }) },
      })
      return true
    }

    try {
      await this.cartRepository.addToCart({
        userId: user.id,
        inventoryId: input.inventoryId,
        productId: input.productId,
        quantity: clampedQty,
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
    if (!user) {
      const items = readGuestCart()
      const existing = items.find((i) => i.productId === input.productId && i.inventoryId === input.inventoryId)
      if (existing) {
        existing.quantity = clampQuantity(input.quantity, existing.stockQuantity, existing.maxQuantity)
        writeGuestCart(items)
        this.cart.value = createSyntheticCart(items)
        return true
      }
      return false
    }

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
    if (!user) {
      let items = readGuestCart()
      items = items.filter((i) => !(i.productId === input.productId && i.inventoryId === input.inventoryId))
      writeGuestCart(items)
      this.cart.value = createSyntheticCart(items)
      toastService.success(t('cart.removedToast', { name: input.name }))
      return true
    }

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
    if (!user) {
      this.cart.value = createSyntheticCart(readGuestCart())
      return true
    }
    try {
      this.cart.value = await this.cartRepository.getCart(user.id)
      return true
    } catch {
      this.cart.value = null
      return false
    }
  }

  async syncGuestCartToServer(): Promise<void> {
    const user = this.authService.user.value
    if (!user) return
    const guestItems = readGuestCart()
    if (!guestItems.length) return

    this.syncing.value = true
    try {
      const remaining: GuestCartItem[] = []
      for (const item of guestItems) {
        try {
          await this.cartRepository.addToCart({
            userId: user.id,
            inventoryId: item.inventoryId,
            productId: item.productId,
            quantity: clampQuantity(item.quantity, item.stockQuantity, item.maxQuantity),
          })
        } catch {
          remaining.push(item)
        }
      }
      writeGuestCart(remaining)
      await this.refresh()
    } finally {
      this.syncing.value = false
    }
  }

  clear(): void {
    writeGuestCart([])
    this.cart.value = null
  }
}