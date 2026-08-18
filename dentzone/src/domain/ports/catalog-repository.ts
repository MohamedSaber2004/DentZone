import type { Product, ProductQuery } from '../models/product'
import type { Category } from '../models/category'
import type { Vendor } from '../models/vendor'
import type { Review } from '../models/review'
import type { Advertisements } from '../models/advertisement'
import type { CatalogSettings } from '../models/catalog-settings'

export interface CatalogRepository {
  listCategories(): Promise<Category[]>
  listProducts(query?: ProductQuery): Promise<Product[]>
  listVendors(categorySlug?: string): Promise<Vendor[]>
  getVendorBySlug(slug: string): Promise<Vendor | undefined>
  getProductsByVendor(vendorSlug: string, query?: ProductQuery): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | undefined>
  getRelatedProducts(product: Product, limit: number): Promise<Product[]>
  getFeaturedProducts(limit: number): Promise<Product[]>
  getBestsellers(limit: number): Promise<Product[]>
  getReviews(productId: string): Promise<Review[]>
  getAdvertisements(): Promise<Advertisements>
  getSettings(): Promise<CatalogSettings>
}
