import { computed, reactive, ref, watch } from 'vue'
import type { Product } from '../domain/models/product'
import { authService } from './auth.service'
import { catalogService } from './catalog.service'
import { http } from './http.client'

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
  private localIds = reactive<string[]>(loadPersistedIds())

  readonly items = ref<Product[]>([])

  readonly loading = ref(false)

  private idSet = new Set<string>(this.localIds)

  readonly count = computed<number>(() => this.idSet.size)

  private get authed(): boolean {
    return authService.isAuthenticated
  }

  constructor() {
    watch(
      this.localIds,
      (ids) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
        this.idSet = new Set(ids)
      },
      { deep: true },
    )
    watch(
      () => authService.user.value,
      () => {
        void this.refresh()
      },
    )
  }

  has(productId: string): boolean {
    return this.idSet.has(productId)
  }

  async refresh(): Promise<void> {
    if (this.authed) {
      this.loading.value = true
      try {
        this.items.value = await http.get<Product[]>('/api/v1/wishlist')
        this.idSet = new Set(this.items.value.map((product) => product.id))
      } catch {
        this.items.value = []
      } finally {
        this.loading.value = false
      }
      return
    }

    const products = await catalogService.getProducts()
    const byId = new Map(products.map((product) => [product.id, product]))
    this.items.value = this.localIds.flatMap((id) => {
      const product = byId.get(id)
      return product ? [product] : []
    })
    this.idSet = new Set(this.localIds)
  }

  async toggle(product: Product): Promise<boolean> {
    const present = this.has(product.id)

    if (this.authed) {
      if (present) {
        await http.del(`/api/v1/wishlist/${encodeURIComponent(product.id)}`)
        this.idSet.delete(product.id)
        this.items.value = this.items.value.filter((item) => item.id !== product.id)
      } else {
        await http.post(`/api/v1/wishlist/${encodeURIComponent(product.id)}`)
        this.idSet.add(product.id)
        this.items.value = [product, ...this.items.value.filter((item) => item.id !== product.id)]
      }
      return !present
    }

    const index = this.localIds.indexOf(product.id)
    if (index !== -1) {
      this.localIds.splice(index, 1)
    } else {
      this.localIds.push(product.id)
    }
    this.idSet = new Set(this.localIds)
    return !present
  }

  async remove(productId: string): Promise<void> {
    if (this.authed) {
      await http.del(`/api/v1/wishlist/${encodeURIComponent(productId)}`)
      this.idSet.delete(productId)
      this.items.value = this.items.value.filter((item) => item.id !== productId)
      return
    }
    this.localIds = this.localIds.filter((id) => id !== productId)
  }

  async clear(): Promise<void> {
    if (this.authed) {
      await http.del('/api/v1/wishlist')
      this.idSet.clear()
      this.items.value = []
      return
    }
    this.localIds = []
  }
}

export const wishlistService = new WishlistService()
