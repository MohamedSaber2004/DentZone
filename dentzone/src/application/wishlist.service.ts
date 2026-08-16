import { computed, reactive, watch } from 'vue'
import type { Product } from '../domain/models/product'
import { products } from '../data/mocks/catalog.data'

const STORAGE_KEY = 'dentzone.wishlist.v1'

const loadPersistedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return parsed.filter((id) => typeof id === 'string' && products.some((product) => product.id === id))
  } catch {
    return []
  }
}

export class WishlistService {
  private state = reactive<{ ids: string[] }>({ ids: loadPersistedIds() })

  readonly items = computed<Product[]>(() =>
    this.state.ids
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product)),
  )

  readonly count = computed<number>(() => this.state.ids.length)

  constructor() {
    watch(
      () => this.state.ids,
      (ids) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
      },
      { deep: true },
    )
  }

  has(productId: string): boolean {
    return this.state.ids.includes(productId)
  }

  toggle(product: Product): boolean {
    const index = this.state.ids.indexOf(product.id)
    if (index !== -1) {
      this.state.ids.splice(index, 1)
      return false
    }
    this.state.ids.push(product.id)
    return true
  }

  remove(productId: string): void {
    this.state.ids = this.state.ids.filter((id) => id !== productId)
  }

  clear(): void {
    this.state.ids = []
  }
}

export const wishlistService = new WishlistService()