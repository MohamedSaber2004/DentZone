import type { CatalogRepository } from '../../domain/ports/catalog-repository'
import type { Category } from '../../domain/models/category'
import type { Product, ProductQuery } from '../../domain/models/product'
import type { Vendor } from '../../domain/models/vendor'
import type { Review } from '../../domain/models/review'
import type { Advertisement, Advertisements, AdvertisementTheme } from '../../domain/models/advertisement'
import type { CatalogSettings } from '../../domain/models/catalog-settings'
import { ApiError, http } from '../../application/http.client'

const toQuery = (params: Record<string, string | number | boolean | undefined>): string => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}

const asTheme = (theme: string | undefined): AdvertisementTheme | undefined =>
  theme === 'dark' || theme === 'gold' || theme === 'light' ? theme : undefined

export class ApiCatalogRepository implements CatalogRepository {
  async listCategories(): Promise<Category[]> {
    return http.get<Category[]>('/api/v1/catalog/categories')
  }

  async listProducts(query?: ProductQuery): Promise<Product[]> {
    return http.get<Product[]>(
      `/api/v1/catalog/products${toQuery({
        categorySlug: query?.categorySlug,
        search: query?.search,
        sort: query?.sort,
      })}`,
    )
  }

  async listVendors(categorySlug?: string): Promise<Vendor[]> {
    return http.get<Vendor[]>(`/api/v1/catalog/vendors${toQuery({ categorySlug })}`)
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    try {
      return await http.get<Vendor>(`/api/v1/catalog/vendors/${encodeURIComponent(slug)}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined
      throw err
    }
  }

  async getProductsByVendor(vendorSlug: string, query?: ProductQuery): Promise<Product[]> {
    return http.get<Product[]>(
      `/api/v1/catalog/vendors/${encodeURIComponent(vendorSlug)}/products${toQuery({
        categorySlug: query?.categorySlug,
        search: query?.search,
        sort: query?.sort,
      })}`,
    )
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    try {
      return await http.get<Product>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined
      throw err
    }
  }

  async getRelatedProducts(product: Product, limit: number): Promise<Product[]> {
    return http.get<Product[]>(
      `/api/v1/catalog/products/${encodeURIComponent(product.slug)}/related${toQuery({ limit })}`,
    )
  }

  async getFeaturedProducts(limit: number): Promise<Product[]> {
    return http.get<Product[]>(`/api/v1/catalog/products${toQuery({ featured: true, limit })}`)
  }

  async getBestsellers(limit: number): Promise<Product[]> {
    return http.get<Product[]>(`/api/v1/catalog/products${toQuery({ bestseller: true, limit })}`)
  }

  async getReviews(productId: string): Promise<Review[]> {
    return http.get<Review[]>(`/api/v1/catalog/reviews/${encodeURIComponent(productId)}`)
  }

  async getAdvertisements(): Promise<Advertisements> {
    const data = await http.get<{
      hero: Advertisement | null
      secondary: Advertisement[]
    }>('/api/v1/catalog/advertisements')
    return {
      hero: data.hero ? { ...data.hero, theme: asTheme(data.hero.theme) } : undefined,
      secondary: data.secondary.map((ad) => ({ ...ad, theme: asTheme(ad.theme) })),
    }
  }

  async getSettings(): Promise<CatalogSettings> {
    return http.get<CatalogSettings>('/api/v1/catalog/settings')
  }
}
