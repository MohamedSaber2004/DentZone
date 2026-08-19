import type { Product } from '../models/product'

export interface WishlistRepository {
  get(): Promise<Product[]>
  add(productId: string): Promise<void>
  remove(productId: string): Promise<void>
  clear(): Promise<void>
}