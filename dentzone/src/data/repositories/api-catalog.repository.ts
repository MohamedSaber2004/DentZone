import type { CatalogRepository } from '../../domain/ports/catalog-repository'
import type { Category } from '../../domain/models/category'
import type { Product, ProductQuery } from '../../domain/models/product'
import type { Vendor } from '../../domain/models/vendor'
import type { Review } from '../../domain/models/review'
import type { Advertisement, Advertisements, AdvertisementTheme } from '../../domain/models/advertisement'
import type { CatalogSettings } from '../../domain/models/catalog-settings'
import { CATALOG_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'
import { ApiError } from '../../infrastructure/http/api-error'

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
  constructor(private readonly http: HttpClient) {}

  async listCategories(): Promise<Category[]> {
    return this.http.get<Category[]>(CATALOG_ROUTES.categories)
  }

  async listProducts(query?: ProductQuery): Promise<Product[]> {
    return this.http.get<Product[]>(
      `${CATALOG_ROUTES.products}${toQuery({
        categorySlug: query?.categorySlug,
        search: query?.search,
        sort: query?.sort,
      })}`,
    )
  }

  async listVendors(categorySlug?: string): Promise<Vendor[]> {
    return this.http.get<Vendor[]>(`${CATALOG_ROUTES.vendors}${toQuery({ categorySlug })}`)
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    try {
      return await this.http.get<Vendor>(CATALOG_ROUTES.vendorBySlug(slug))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined
      throw err
    }
  }

  async getProductsByVendor(vendorSlug: string, query?: ProductQuery): Promise<Product[]> {
    return this.http.get<Product[]>(
      `${CATALOG_ROUTES.vendorProducts(vendorSlug)}${toQuery({
        categorySlug: query?.categorySlug,
        search: query?.search,
        sort: query?.sort,
      })}`,
    )
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    try {
      return await this.http.get<Product>(CATALOG_ROUTES.productBySlug(slug))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined
      throw err
    }
  }

  async getRelatedProducts(product: Product, limit: number): Promise<Product[]> {
    return this.http.get<Product[]>(
      `${CATALOG_ROUTES.relatedProducts(product.slug)}${toQuery({ limit })}`,
    )
  }

  async getFeaturedProducts(limit: number): Promise<Product[]> {
    return this.http.get<Product[]>(`${CATALOG_ROUTES.products}${toQuery({ featured: true, limit })}`)
  }

  async getBestsellers(limit: number): Promise<Product[]> {
    return this.http.get<Product[]>(`${CATALOG_ROUTES.products}${toQuery({ bestseller: true, limit })}`)
  }

  async getReviews(productId: string): Promise<Review[]> {
    return this.http.get<Review[]>(CATALOG_ROUTES.reviews(productId))
  }

  async getAdvertisements(): Promise<Advertisements> {
    const data = await this.http.get<{
      hero: Advertisement | null
      secondary: Advertisement[]
    }>(CATALOG_ROUTES.advertisements)
    return {
      hero: data.hero ? { ...data.hero, theme: asTheme(data.hero.theme) } : undefined,
      secondary: data.secondary.map((ad) => ({ ...ad, theme: asTheme(ad.theme) })),
    }
  }

  async getSettings(): Promise<CatalogSettings> {
    return this.http.get<CatalogSettings>(CATALOG_ROUTES.settings)
  }
}