import { ref } from 'vue'
import type { Category } from '../domain/models/category'
import type { Product, ProductQuery } from '../domain/models/product'
import type { Vendor } from '../domain/models/vendor'
import type { CatalogRepository } from '../domain/ports/catalog-repository'
import { InMemoryCatalogRepository } from '../data/repositories/in-memory-catalog.repository'

export class CatalogService {
  private repository: CatalogRepository

  readonly categories = ref<Category[]>([])
  readonly vendors = ref<Vendor[]>([])
  readonly featuredProducts = ref<Product[]>([])
  readonly bestsellers = ref<Product[]>([])

  constructor(repository: CatalogRepository = new InMemoryCatalogRepository()) {
    this.repository = repository
  }

  async init(): Promise<void> {
    const [categories, vendors, featured, bestsellers] = await Promise.all([
      this.repository.listCategories(),
      this.repository.listVendors(),
      this.repository.getFeaturedProducts(4),
      this.repository.getBestsellers(4),
    ])
    this.categories.value = categories
    this.vendors.value = vendors
    this.featuredProducts.value = featured
    this.bestsellers.value = bestsellers
  }

  async getProducts(query?: ProductQuery): Promise<Product[]> {
    return this.repository.listProducts(query)
  }

  async getVendorsByCategory(categoryId?: string): Promise<Vendor[]> {
    return this.repository.listVendors(categoryId)
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    return this.repository.getVendorBySlug(slug)
  }

  async getProductsByVendor(vendorId: string, query?: ProductQuery): Promise<Product[]> {
    return this.repository.getProductsByVendor(vendorId, query)
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return this.repository.getProductBySlug(slug)
  }

  async getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    return this.repository.getRelatedProducts(product, limit)
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.value.find((category) => category.id === id)
  }
}

export const catalogService = new CatalogService()