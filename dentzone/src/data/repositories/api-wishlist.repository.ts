import type { WishlistRepository } from '../../domain/ports/wishlist-repository'
import type { Product } from '../../domain/models/product'
import { WISHLIST_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiWishlistRepository implements WishlistRepository {
  constructor(private readonly http: HttpClient) {}

  get(): Promise<Product[]> {
    return this.http.get<Product[]>(WISHLIST_ROUTES.base)
  }

  add(productId: string): Promise<void> {
    return this.http.post<void>(WISHLIST_ROUTES.item(productId), undefined, { showFeedback: false })
  }

  remove(productId: string): Promise<void> {
    return this.http.del<void>(WISHLIST_ROUTES.item(productId), { showFeedback: false })
  }

  clear(): Promise<void> {
    return this.http.del<void>(WISHLIST_ROUTES.base)
  }
}