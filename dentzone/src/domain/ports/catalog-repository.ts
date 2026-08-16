import type { Product, ProductQuery } from '../models/product'
import type { Category } from '../models/category'
import type { Vendor } from '../models/vendor'

export interface CatalogRepository {
  listCategories(): Promise<Category[]>
  listProducts(query?: ProductQuery): Promise<Product[]>
  listVendors(categoryId?: string): Promise<Vendor[]>
  getVendorBySlug(slug: string): Promise<Vendor | undefined>
  getProductsByVendor(vendorId: string, query?: ProductQuery): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | undefined>
  getRelatedProducts(product: Product, limit: number): Promise<Product[]>
  getFeaturedProducts(limit: number): Promise<Product[]>
  getBestsellers(limit: number): Promise<Product[]>
}