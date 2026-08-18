import { computed, reactive, watch } from 'vue'
import type { CartLine, CartSummary } from '../domain/models/cart'
import type { Product } from '../domain/models/product'
import { catalogService } from './catalog.service'

const STORAGE_KEY = 'dentzone.cart.v1'

interface CartState {
  lines: CartLine[]
}

const loadPersistedLines = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    return parsed.flatMap((line) => {
      if (!line?.product?.id) return []
      return [{ product: line.product, quantity: Math.max(1, line.quantity) }]
    })
  } catch {
    return []
  }
}

export class CartService {
  private state = reactive<CartState>({ lines: loadPersistedLines() })

  readonly lines = computed<CartLine[]>(() => this.state.lines)

  readonly itemCount = computed<number>(() =>
    this.state.lines.reduce((total, line) => total + line.quantity, 0),
  )

  readonly subtotal = computed<number>(() =>
    this.state.lines.reduce((total, line) => total + line.product.price * line.quantity, 0),
  )

  readonly discount = computed<number>(() =>
    this.state.lines.reduce((total, line) => {
      const compareAt = line.product.compareAtPrice
      return total + (compareAt ? (compareAt - line.product.price) * line.quantity : 0)
    }, 0),
  )

  readonly shipping = computed<number>(() => {
    if (this.state.lines.length === 0) return 0
    const settings = catalogService.settings.value
    return this.subtotal.value >= settings.freeShippingThreshold ? 0 : settings.shippingCost
  })

  readonly tax = computed<number>(() => (this.subtotal.value - this.discount.value) * catalogService.settings.value.taxRate)

  readonly total = computed<number>(() =>
    Math.max(0, this.subtotal.value - this.discount.value + this.shipping.value + this.tax.value),
  )

  readonly summary = computed<CartSummary>(() => ({
    lines: this.state.lines,
    itemCount: this.itemCount.value,
    subtotal: this.subtotal.value,
    discount: this.discount.value,
    shipping: this.shipping.value,
    tax: this.tax.value,
    total: this.total.value,
  }))

  constructor() {
    watch(
      this.lines,
      (lines) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
      },
      { deep: true },
    )
  }

  hydrate(products: Product[]): void {
    const current = new Map(products.map((product) => [product.id, product]))
    this.state.lines = this.state.lines.flatMap((line) => {
      const product = current.get(line.product.id)
      if (!product || !product.inStock) return []
      return [{ product, quantity: Math.min(line.quantity, Math.max(1, product.stockQuantity)) }]
    })
  }

  add(product: Product, quantity = 1): void {
    const existing = this.state.lines.find((line) => line.product.id === product.id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, Math.max(1, product.stockQuantity))
    } else {
      this.state.lines.push({ product, quantity: Math.min(quantity, Math.max(1, product.stockQuantity)) })
    }
  }

  setQuantity(productId: string, quantity: number): void {
    const line = this.state.lines.find((entry) => entry.product.id === productId)
    if (!line) return
    if (quantity <= 0) {
      this.remove(productId)
      return
    }
    line.quantity = Math.min(quantity, Math.max(1, line.product.stockQuantity))
  }

  remove(productId: string): void {
    this.state.lines = this.state.lines.filter((line) => line.product.id !== productId)
  }

  clear(): void {
    this.state.lines = []
  }
}

export const cartService = new CartService()
