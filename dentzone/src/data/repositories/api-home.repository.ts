import type { HomeRepository } from '../../domain/ports/home-repository'
import type {
  HomeBannerDto,
  HomeBrandDto,
  HomeDto,
  HomeProviderDto,
} from '../../domain/models/home'
import type { CategoryDto } from '../../domain/models/category'
import type { ProviderProductDto } from '../../domain/models/product'
import type { SpecialOfferDto } from '../../domain/models/special-offer'
import { CATEGORY_ROUTES, HOME_ROUTES, USER_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'
import type { InventoryDto } from '../../domain/models/category'

interface RawHomeCategoryDto {
  id: string
  name: string
  arabicName: string
  imageFile: string
}

interface RawHomeProductDto {
  productId: string
  productPriceId: string
  productName: string
  arabicProductName: string
  image: string
  description: string
  arabicDescription: string
  preef: string
  arabicPreef: string
  stockQuantity: number
  salesPrice: number
  discountRate: number
  inventoryUserId: string
  isFavorite: boolean
}

interface RawHomePayload {
  banners?: HomeBannerDto[] | null
  categories?: RawHomeCategoryDto[] | null
  products?: RawHomeProductDto[] | null
  providers?: HomeProviderDto[] | null
  brands?: HomeBrandDto[] | null
  specialOffersone?: SpecialOfferDto[] | null
  specialOfferstwo?: SpecialOfferDto[] | null
  flashSales?: RawHomeProductDto[] | null
  fullName?: string | null
}

interface RawProviderItem {
  id?: string
  Id?: string
  userId?: string
  UserId?: string
  inventoryId?: string
  InventoryId?: string
  inventoryUserId?: string
  InventoryUserId?: string

  fullName?: string
  FullName?: string
  name?: string
  Name?: string
  userName?: string
  UserName?: string

  email?: string
  Email?: string

  isAvailableNow?: boolean
  IsAvailableNow?: boolean
  isAvailable?: boolean
  IsAvailable?: boolean
  isActive?: boolean
  IsActive?: boolean
  status?: number | string | null

  profileImage?: string | null
  ProfileImage?: string | null
  image?: string | null
  Image?: string | null
  imagePath?: string | null
  ImagePath?: string | null
  imageFile?: string | null
  ImageFile?: string | null
  avatar?: string | null
  Avatar?: string | null
  [key: string]: unknown
}

function extractArray(payload: unknown): RawProviderItem[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload as RawProviderItem[]
  if (typeof payload === 'object') {
    const p = payload as Record<string, unknown>
    if (Array.isArray(p.data)) return p.data as RawProviderItem[]
    if (Array.isArray(p.result)) return p.result as RawProviderItem[]
    if (Array.isArray(p.items)) return p.items as RawProviderItem[]
    if (Array.isArray(p.$values)) return p.$values as RawProviderItem[]
    if (Array.isArray(p.providers)) return p.providers as RawProviderItem[]
    if (Array.isArray(p.users)) return p.users as RawProviderItem[]
    if (Array.isArray(p.value)) return p.value as RawProviderItem[]
  }
  return []
}

function normalizeProvider(item: RawProviderItem): HomeProviderDto {
  const id = String(
    item.id ||
      item.Id ||
      item.userId ||
      item.UserId ||
      item.inventoryId ||
      item.InventoryId ||
      item.inventoryUserId ||
      item.InventoryUserId ||
      '',
  ).trim()

  const fullName = String(
    item.fullName ||
      item.FullName ||
      item.name ||
      item.Name ||
      item.userName ||
      item.UserName ||
      'Supplier',
  ).trim()

  const userName = String(
    item.userName ||
      item.UserName ||
      item.fullName ||
      item.FullName ||
      item.name ||
      item.Name ||
      '',
  ).trim()

  const email = String(item.email || item.Email || '').trim()

  const isAvailableNow = Boolean(
    item.isAvailableNow ??
      item.IsAvailableNow ??
      item.isAvailable ??
      item.IsAvailable ??
      item.isActive ??
      item.IsActive ??
      (typeof item.status === 'number' ? item.status === 1 : undefined) ??
      true,
  )

  const profileImage = String(
    item.profileImage ||
      item.ProfileImage ||
      item.image ||
      item.Image ||
      item.imagePath ||
      item.ImagePath ||
      item.imageFile ||
      item.ImageFile ||
      item.avatar ||
      item.Avatar ||
      '',
  ).trim()

  return {
    id,
    fullName,
    userName,
    email,
    isAvailableNow,
    profileImage,
  }
}

function extractProductImages(raw: Record<string, unknown>): string[] {
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    return raw.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
  }
  if (typeof raw.images === 'string' && raw.images.trim()) {
    return raw.images.split(',').map((s) => s.trim()).filter(Boolean)
  }
  for (const key of ['image', 'imagePath', 'imageFile', 'profileImage']) {
    if (typeof raw[key] === 'string' && (raw[key] as string).trim()) {
      return [(raw[key] as string).trim()]
    }
  }
  return []
}

export class ApiHomeRepository implements HomeRepository {
  constructor(private readonly http: HttpClient) {}

  async getTopProviders(lang?: number): Promise<HomeProviderDto[]> {
    try {
      const raw = await this.http.get<unknown>(USER_ROUTES.getTopProviders, { showFeedback: false })
      const arr = extractArray(raw)
      if (arr.length > 0) {
        const mapped = arr.map(normalizeProvider).filter((p) => p.id && p.fullName)
        if (mapped.length > 0) return mapped
      }
    } catch {
      // fall through to backend-derived fallback
    }
    return this.fetchProvidersFallback(lang ?? 1)
  }

  async getHome(lang: number): Promise<HomeDto> {
    try {
      const payload = await this.http.get<RawHomePayload>(HOME_ROUTES.getHome(lang), { showFeedback: false })

      return {
        banners: payload?.banners ?? [],
        categories: (payload?.categories ?? []).map((category) => this.toCategory(category)),
        products: (payload?.products ?? []).map((product) => this.toProviderProduct(product)),
        providers: payload?.providers ?? [],
        brands: payload?.brands ?? [],
        specialOffersone: payload?.specialOffersone ?? [],
        specialOfferstwo: payload?.specialOfferstwo ?? [],
        flashSales: (payload?.flashSales ?? []).map((product) => this.toProviderProduct(product)),
        fullName: payload?.fullName ?? null,
      }
    } catch {
      return {
        banners: [],
        categories: [],
        products: [],
        providers: [],
        brands: [],
        specialOffersone: [],
        specialOfferstwo: [],
        flashSales: [],
        fullName: null,
      }
    }
  }

  private async fetchProvidersFallback(lang: number): Promise<HomeProviderDto[]> {
    try {
      const categories = await this.http.get<{ id: string }[]>(CATEGORY_ROUTES.all(lang), { showFeedback: false })
      const providerMap = new Map<string, HomeProviderDto>()
      const sampleCategories = (categories ?? []).slice(0, 5)
      const results = await Promise.allSettled(
        sampleCategories.map((c) =>
          this.http.get<InventoryDto[]>(CATEGORY_ROUTES.inventoriesByCategory(c.id), { showFeedback: false }),
        ),
      )
      for (const res of results) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          for (const inv of res.value) {
            if (inv.inventoryId && !providerMap.has(inv.inventoryId)) {
              providerMap.set(inv.inventoryId, {
                id: inv.inventoryId,
                fullName: inv.fullName,
                userName: inv.fullName,
                email: inv.email,
                isAvailableNow: !!inv.isAvailableNow,
                profileImage: '',
              })
            }
          }
        }
      }
      return Array.from(providerMap.values())
    } catch {
      return []
    }
  }

  private toCategory(category: RawHomeCategoryDto): CategoryDto {
    const rawCat = category as unknown as Record<string, string>
    return {
      id: category.id,
      name: category.name,
      pref: category.name,
      description: '',
      companyPercentage: null,
      orderNum: 0,
      arabicName: category.arabicName,
      imageName: category.imageFile || rawCat.image || rawCat.imageName || rawCat.imagePath || '',
    }
  }

  private toProviderProduct(product: RawHomeProductDto): ProviderProductDto {
    return {
      id: product.productId,
      productId: product.productId,
      productPriceId: product.productPriceId,
      inventoryUserId: product.inventoryUserId,
      productName: product.productName,
      productArabicName: product.arabicProductName,
      preef: product.preef,
      arabicPreef: product.arabicPreef,
      description: product.description ?? '',
      arabicDescription: product.arabicDescription ?? null,
      createdAt: '',
      updatedAt: '',
      categoryName: null,
      purchasePrice: 0,
      salesPrice: product.salesPrice,
      flashSaleFromDate: null,
      flashSaleToDate: null,
      priceBeforeFlashSale: 0,
      priceAfterFlashSale: null,
      isFlashSaleActive: false,
      effectiveSalesPrice: product.salesPrice,
      creationDate: '',
      inventoryUserName: null,
      stockQuantity: product.stockQuantity,
      discountRate: product.discountRate,
      maxQuantity: 0,
      productCode: '',
      revenuePercentage: 0,
      images: extractProductImages(product as unknown as Record<string, unknown>),
      isFavorite: product.isFavorite,
    }
  }
}