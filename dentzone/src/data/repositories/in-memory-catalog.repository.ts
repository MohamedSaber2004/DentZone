import type { CatalogRepository } from '../../domain/ports/catalog-repository'
import type { Product, ProductQuery, ProductSort } from '../../domain/models/product'
import type { Category } from '../../domain/models/category'
import type { Vendor } from '../../domain/models/vendor'
import { categories, products, vendors } from '../mocks/catalog.data'

const delay = () => new Promise((resolve) => setTimeout(resolve, 120))

const sorters: Record<ProductSort, (a: Product, b: Product) => number> = {
  featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => Number(Boolean(b.badge === 'new')) - Number(Boolean(a.badge === 'new')),
}

export class InMemoryCatalogRepository implements CatalogRepository {
  async listCategories(): Promise<Category[]> {
    await delay()
    return categories.map((category) => ({
      ...category,
    }))
  }

  async listProducts(query: ProductQuery = {}): Promise<Product[]> {
    await delay()
    let result = [...products]

    if (query.categoryId) {
      result = result.filter((product) => product.categoryId === query.categoryId)
    }

    if (query.search) {
      const term = query.search.trim().toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.tagline.toLowerCase().includes(term) ||
          product.brand.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term),
      )
    }

    if (query.sort) {
      result = result.sort(sorters[query.sort])
    }

    return result
  }

  async listVendors(categoryId?: string): Promise<Vendor[]> {
    await delay()
    const withCounts = vendors.map((vendor) => ({
      ...vendor,
      productCount: products.filter((product) => product.vendorId === vendor.id).length,
    }))
    if (!categoryId) return withCounts
    const productVendorIds = new Set(
      products.filter((product) => product.categoryId === categoryId).map((product) => product.vendorId),
    )
    return withCounts.filter((vendor) => productVendorIds.has(vendor.id))
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    await delay()
    const vendor = vendors.find((entry) => entry.slug === slug)
    if (!vendor) return undefined
    return {
      ...vendor,
      productCount: products.filter((product) => product.vendorId === vendor.id).length,
    }
  }

  async getProductsByVendor(vendorId: string, query: ProductQuery = {}): Promise<Product[]> {
    await delay()
    let result = products.filter((product) => product.vendorId === vendorId)

    if (query.categoryId) {
      result = result.filter((product) => product.categoryId === query.categoryId)
    }

    if (query.search) {
      const term = query.search.trim().toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.tagline.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term),
      )
    }

    if (query.sort) {
      result = result.sort(sorters[query.sort])
    }

    return result
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    await delay()
    return products.find((product) => product.slug === slug)
  }

  async getRelatedProducts(product: Product, limit: number): Promise<Product[]> {
    await delay()
    return products
      .filter((candidate) => candidate.id !== product.id)
      .sort((a, b) => {
        const sameCategory = Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId)
        return sameCategory || b.rating - a.rating
      })
      .slice(0, limit)
  }

  async getFeaturedProducts(limit: number): Promise<Product[]> {
    await delay()
    return products.filter((product) => product.isFeatured).slice(0, limit)
  }

  async getBestsellers(limit: number): Promise<Product[]> {
    await delay()
    return products.filter((product) => product.isBestseller).slice(0, limit)
  }
}