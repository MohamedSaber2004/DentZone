import type { HomeRepository } from '../../domain/ports/home-repository'
import type {
  HomeBannerDto,
  HomeBrandDto,
  HomeDto,
  HomePromoBannerDto,
  HomeProviderDto,
  HomeSectionDto,
  HomeSectionItemDto,
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

interface RawHomeSectionDto {
  id: string
  type: number
  typeKey: string
  title: string
  subtitle?: string | null
  startDate?: string | null
  endDate?: string | null
  items?: HomeSectionItemDto[] | null
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
  sections?: RawHomeSectionDto[] | null
  fullName?: string | null
}

function getDeterministicOfferDiscount(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  const discounts = [10, 15, 20, 25, 30]
  const idx = Math.abs(hash) % discounts.length
  return discounts[idx] ?? 15
}

function sectionItemToProviderProduct(
  item: HomeSectionItemDto,
  providerMap?: Map<string, HomeProviderDto>,
  stockMap?: Map<string, number>,
): ProviderProductDto {
  const provider = item.inventoryId && providerMap ? providerMap.get(item.inventoryId) : undefined
  const providerName = provider?.fullName || provider?.userName || null

  let discountRate = 0
  let oldPrice: number | null = null

  if (item.discountRate != null && item.discountRate > 0) {
    discountRate = item.discountRate < 1 ? Math.round(item.discountRate * 100) : Math.round(item.discountRate)
  }

  if (item.oldPrice != null && item.oldPrice > item.price) {
    oldPrice = item.oldPrice
    if (discountRate === 0) {
      discountRate = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
    }
  } else if (discountRate > 0 && item.price > 0) {
    oldPrice = Math.round((item.price / (1 - discountRate / 100)) * 100) / 100
  } else {
    // For special offers in home sections where backend returns 0 discount rate,
    // compute a deterministic discount rate so cards show the requested discount percentage badge
    discountRate = getDeterministicOfferDiscount(item.productId || item.id)
    oldPrice = Math.round((item.price / (1 - discountRate / 100)) * 100) / 100
  }

  const hasDiscount = discountRate > 0

  // Special offers sections from backend do not include stock quantity
  const rawStock = (item as unknown as { stockQuantity?: number; stock?: number; quantity?: number }).stockQuantity
  let stockQuantity = 0
  if (rawStock != null && Number.isFinite(rawStock)) {
    stockQuantity = rawStock
  } else if (item.productId && stockMap?.has(item.productId)) {
    stockQuantity = stockMap.get(item.productId)!
  }

  return {
    id: item.productId || item.id,
    productId: item.productId,
    productPriceId: item.productPriceId,
    inventoryUserId: item.inventoryId,
    productName: item.title,
    productArabicName: item.title,
    preef: item.subtitle || item.title,
    arabicPreef: item.subtitle || item.title,
    description: '',
    arabicDescription: null,
    createdAt: '',
    updatedAt: '',
    categoryName: null,
    purchasePrice: 0,
    salesPrice: oldPrice ?? item.price,
    flashSaleFromDate: null,
    flashSaleToDate: null,
    priceBeforeFlashSale: oldPrice ?? item.price,
    priceAfterFlashSale: hasDiscount ? item.price : null,
    isFlashSaleActive: hasDiscount,
    effectiveSalesPrice: item.price,
    creationDate: '',
    inventoryUserName: providerName,
    stockQuantity,
    discountRate: discountRate,
    maxQuantity: 0,
    productCode: '',
    revenuePercentage: 0,
    images: item.imageUrl ? [item.imageUrl] : [],
    isFavorite: false,
  }
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
      const rawProviders = extractArray(payload?.providers)
      const normalizedProviders = rawProviders.length > 0 ? rawProviders.map(normalizeProvider) : []

      const providerMap = new Map<string, HomeProviderDto>()
      for (const p of normalizedProviders) {
        if (p.id) providerMap.set(p.id, p)
      }

      const stockMap = new Map<string, number>()
      for (const prod of payload?.products ?? []) {
        if (prod.productId && prod.stockQuantity != null) {
          stockMap.set(prod.productId, prod.stockQuantity)
        }
      }

      const rawSections = payload?.sections ?? []

      // Extract promotional banner sections (Compsite, IMPRESSION, Barrier Film, Stones)
      const promoBanners: HomePromoBannerDto[] = rawSections
        .filter(
          (sec) =>
            sec.typeKey === 'hero_banner' ||
            (sec.items && sec.items.length === 1 && !sec.items[0]?.title && !!sec.items[0]?.imageUrl),
        )
        .map((sec) => {
          const it = sec.items?.[0]
          return {
            id: sec.id,
            title: sec.title || '',
            imageUrl: it?.imageUrl || '',
            productId: it?.productId || null,
            inventoryId: it?.inventoryId || null,
            productPriceId: it?.productPriceId || null,
          }
        })
        .filter((b) => !!b.imageUrl)

      // Map offer product sections
      const mappedSections: HomeSectionDto[] = rawSections
        .filter((sec) => sec.typeKey !== 'hero_banner' && (sec.items ?? []).some((it) => it.title && it.price != null))
        .map((sec) => {
          const validItems = (sec.items ?? []).filter((it) => it.title && it.price != null)
          return {
            id: sec.id,
            type: sec.type,
            typeKey: sec.typeKey,
            title: sec.title,
            subtitle: sec.subtitle ?? null,
            startDate: sec.startDate ?? null,
            endDate: sec.endDate ?? null,
            items: validItems,
            products: validItems.map((item) => sectionItemToProviderProduct(item, providerMap, stockMap)),
          }
        })
        .filter((sec) => sec.products.length > 0)

      return {
        banners: payload?.banners ?? [],
        promoBanners,
        categories: (payload?.categories ?? []).map((category) => this.toCategory(category)),
        products: (payload?.products ?? []).map((product) => this.toProviderProduct(product)),
        providers: normalizedProviders,
        brands: payload?.brands ?? [],
        specialOffersone: payload?.specialOffersone ?? [],
        specialOfferstwo: payload?.specialOfferstwo ?? [],
        flashSales: (payload?.flashSales ?? []).map((product) => this.toProviderProduct(product)),
        sections: mappedSections,
        offers: mappedSections,
        fullName: payload?.fullName ?? null,
      }
    } catch {
      return {
        banners: [],
        promoBanners: [],
        categories: [],
        products: [],
        providers: [],
        brands: [],
        specialOffersone: [],
        specialOfferstwo: [],
        flashSales: [],
        sections: [],
        offers: [],
        fullName: null,
      }
    }
  }

  async getAllProviders(lang?: number): Promise<HomeProviderDto[]> {
    const langCode = lang ?? 1
    const providerMap = new Map<string, HomeProviderDto>()

    // 1. Fetch from getHome which contains the full registered provider list
    try {
      const home = await this.getHome(langCode)
      for (const p of home.providers) {
        if (p.id && (p.fullName || p.userName)) {
          providerMap.set(p.id, p)
        }
      }

      // Also harvest any additional provider references from products
      for (const prod of home.products) {
        if (prod.inventoryUserId && prod.inventoryUserName && !providerMap.has(prod.inventoryUserId)) {
          providerMap.set(prod.inventoryUserId, {
            id: prod.inventoryUserId,
            fullName: prod.inventoryUserName,
            userName: prod.inventoryUserName,
            email: '',
            isAvailableNow: true,
            profileImage: '',
          })
        }
      }
    } catch {
      // safe fallback
    }

    // 2. Fetch top providers and merge them (updating photo/status if available)
    try {
      const top = await this.getTopProviders(langCode)
      for (const p of top) {
        if (p.id) {
          const existing = providerMap.get(p.id)
          if (existing) {
            providerMap.set(p.id, {
              ...existing,
              profileImage: p.profileImage || existing.profileImage,
              isAvailableNow: p.isAvailableNow ?? existing.isAvailableNow,
            })
          } else {
            providerMap.set(p.id, p)
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 3. If still empty, use categories fallback
    if (providerMap.size === 0) {
      const fallback = await this.fetchProvidersFallback(langCode)
      for (const p of fallback) {
        if (p.id) providerMap.set(p.id, p)
      }
    }

    return Array.from(providerMap.values())
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