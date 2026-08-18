import { ref } from 'vue'
import type { Category } from '../domain/models/category'
import type { Product, ProductQuery } from '../domain/models/product'
import type { Vendor } from '../domain/models/vendor'
import type { Review } from '../domain/models/review'
import type { Advertisements } from '../domain/models/advertisement'
import type { CatalogSettings } from '../domain/models/catalog-settings'
import type { CatalogRepository } from '../domain/ports/catalog-repository'
import { ApiCatalogRepository } from '../data/repositories/api-catalog.repository'

const DEFAULT_SETTINGS: CatalogSettings = {
  currency: 'USD',
  shippingCost: 6.99,
  freeShippingThreshold: 50,
  taxRate: 0.08,
}

export class CatalogService {
  private repository: CatalogRepository

  readonly categories = ref<Category[]>([])
  readonly vendors = ref<Vendor[]>([])
  readonly featuredProducts = ref<Product[]>([])
  readonly bestsellers = ref<Product[]>([])
  readonly settings = ref<CatalogSettings>({ ...DEFAULT_SETTINGS })
  readonly initialized = ref(false)

  private productsCache = new Map<string, Product>()

  constructor(repository: CatalogRepository = new ApiCatalogRepository()) {
    this.repository = repository
  }

  async init(): Promise<void> {
    try {
      const [categories, vendors, featured, bestsellers, settings] = await Promise.allSettled([
        this.repository.listCategories(),
        this.repository.listVendors(),
        this.repository.getFeaturedProducts(4),
        this.repository.getBestsellers(4),
        this.repository.getSettings(),
      ])
      if (categories.status === 'fulfilled') this.categories.value = categories.value
      if (vendors.status === 'fulfilled') this.vendors.value = vendors.value
      if (featured.status === 'fulfilled') this.featuredProducts.value = featured.value
      if (bestsellers.status === 'fulfilled') this.bestsellers.value = bestsellers.value
      if (settings.status === 'fulfilled') this.settings.value = settings.value
    } finally {
      this.initialized.value = true
    }
  }

  async getProducts(query?: ProductQuery): Promise<Product[]> {
    const products = await this.repository.listProducts(query)
    for (const product of products) this.productsCache.set(product.id, product)
    return products
  }

  async getAllProducts(): Promise<Product[]> {
    const products = await this.repository.listProducts()
    for (const product of products) this.productsCache.set(product.id, product)
    return products
  }

  async getVendorsByCategory(categorySlug?: string): Promise<Vendor[]> {
    return this.repository.listVendors(categorySlug)
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    return this.repository.getVendorBySlug(slug)
  }

  async getProductsByVendor(vendorSlug: string, query?: ProductQuery): Promise<Product[]> {
    const products = await this.repository.getProductsByVendor(vendorSlug, query)
    for (const product of products) this.productsCache.set(product.id, product)
    return products
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const product = await this.repository.getProductBySlug(slug)
    if (product) this.productsCache.set(product.id, product)
    return product
  }

  async getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    return this.repository.getRelatedProducts(product, limit)
  }

  async getReviews(productId: string): Promise<Review[]> {
    return this.repository.getReviews(productId)
  }

  async getAdvertisements(): Promise<Advertisements> {
    return this.repository.getAdvertisements()
  }

  async refreshProduct(productId: string): Promise<Product | undefined> {
    const cached = this.productsCache.get(productId)
    if (!cached) return undefined
    return this.getProductBySlug(cached.slug)
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.value.find((category) => category.id === id)
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.value.find((category) => category.slug === slug)
  }

  getVendorById(id: string): Vendor | undefined {
    return this.vendors.value.find((vendor) => vendor.id === id)
  }
}

export const catalogService = new CatalogService()
