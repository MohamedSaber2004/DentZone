import type { ProductRepository, SearchProductsParams } from '../../domain/ports/product-repository'
import type {
  FavoriteProductDto,
  PopularProductDto,
  ProductDetailDto,
  ProductInventoryDto,
  ProductPriceDto,
  ProductPriceOptionDto,
  ProviderProductDto,
} from '../../domain/models/product'
import { PRODUCT_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export interface SearchProductItemDto {
  productId: string
  productPriceId: string
  productName: string
  arabicName: string
  description: string
  arabicDescription: string
  preef: string
  arabicPreef: string
  images: string[]
  inventoryId: string
  inventoryName: string
  discountRate: number
  salesPrice: number
  flashSaleFromDate: string | null
  flashSaleToDate: string | null
  priceBeforeFlashSale: number
  priceAfterFlashSale: number | null
  isFlashSaleActive: boolean
  effectiveSalesPrice: number
  stockQuantity: number
  productCode: number
  isFavorite: boolean
  isPupolar: boolean
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

const EMPTY_GUID = /^0{8}-0{4}-0{4}-0{4}-0{12}$/i

function extractProductItems(raw: unknown): SearchProductItemDto[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as SearchProductItemDto[]
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as SearchProductItemDto[]
    if (Array.isArray(obj.$values)) return obj.$values as SearchProductItemDto[]
    if (Array.isArray(obj.data)) return obj.data as SearchProductItemDto[]
    if (Array.isArray(obj.result)) return obj.result as SearchProductItemDto[]
    if (Array.isArray(obj.products)) return obj.products as SearchProductItemDto[]
    if (Array.isArray(obj.value)) return obj.value as SearchProductItemDto[]
  }
  return []
}

function extractImages(raw: Record<string, unknown>): string[] {
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

function normalizeProductDetail(rawInput: unknown): ProductDetailDto {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new Error('Invalid product detail payload')
  }
  const root =
    (rawInput as Record<string, unknown>).data ||
    (rawInput as Record<string, unknown>).result ||
    rawInput
  const raw = root as Record<string, unknown>

  const rawPrices = extractProductItems((raw.prices || raw.Prices || raw.productPrices || raw.ProductPrices) as unknown)
  const rawInventories = extractProductItems((raw.inventories || raw.Inventories) as unknown)

  // Map to collect all provider names by inventoryUserId
  const providerNames = new Map<string, string>()

  for (const item of rawInventories) {
    const inv = item as unknown as Record<string, unknown>
    const id = String(
      inv.inventoryUserId ||
        inv.InventoryUserId ||
        inv.userId ||
        inv.UserId ||
        inv.inventoryId ||
        inv.InventoryId ||
        '',
    ).trim()
    const name = String(
      inv.inventoryName ||
        inv.InventoryName ||
        inv.inventoryUserName ||
        inv.InventoryUserName ||
        inv.providerName ||
        inv.ProviderName ||
        inv.vendorName ||
        inv.VendorName ||
        inv.userName ||
        inv.UserName ||
        inv.fullName ||
        inv.FullName ||
        inv.storeName ||
        inv.StoreName ||
        inv.name ||
        inv.Name ||
        '',
    ).trim()
    if (id && name) providerNames.set(id, name)
  }

  for (const item of rawPrices) {
    const p = item as unknown as Record<string, unknown>
    const id = String(
      p.inventoryUserId ||
        p.InventoryUserId ||
        p.inventoryId ||
        p.InventoryId ||
        p.userId ||
        p.UserId ||
        '',
    ).trim()
    const invUser = (p.inventoryUser || p.InventoryUser || p.user || p.User) as
      | Record<string, unknown>
      | undefined
    const name = String(
      p.inventoryUserName ||
        p.InventoryUserName ||
        p.inventoryName ||
        p.InventoryName ||
        p.providerName ||
        p.ProviderName ||
        p.vendorName ||
        p.VendorName ||
        p.userName ||
        p.UserName ||
        p.fullName ||
        p.FullName ||
        p.storeName ||
        p.StoreName ||
        invUser?.fullName ||
        invUser?.FullName ||
        invUser?.userName ||
        invUser?.UserName ||
        '',
    ).trim()
    if (id && name) providerNames.set(id, name)
  }

  const prices: ProductPriceDto[] = rawPrices.map((item) => {
    const p = item as unknown as Record<string, unknown>
    const id = String(p.id || p.Id || p.productPriceId || p.ProductPriceId || '')
    const invId = String(
      p.inventoryUserId ||
        p.InventoryUserId ||
        p.inventoryId ||
        p.InventoryId ||
        p.userId ||
        p.UserId ||
        '',
    ).trim()
    const invUser = (p.inventoryUser || p.InventoryUser || p.user || p.User) as
      | Record<string, unknown>
      | undefined
    const directName = String(
      p.inventoryUserName ||
        p.InventoryUserName ||
        p.inventoryName ||
        p.InventoryName ||
        p.providerName ||
        p.ProviderName ||
        p.vendorName ||
        p.VendorName ||
        p.userName ||
        p.UserName ||
        p.fullName ||
        p.FullName ||
        p.storeName ||
        p.StoreName ||
        invUser?.fullName ||
        invUser?.FullName ||
        invUser?.userName ||
        invUser?.UserName ||
        '',
    ).trim()

    const resolvedName = directName || (invId ? providerNames.get(invId) : null) || null
    const salesPrice = Number(p.salesPrice ?? p.SalesPrice ?? 0)
    const effPrice = Number(p.effectiveSalesPrice ?? p.EffectiveSalesPrice ?? salesPrice)

    return {
      id,
      productId: String(p.productId || p.ProductId || raw.id || raw.productId || ''),
      productName: String(p.productName || p.ProductName || raw.productName || ''),
      productArabicName:
        (p.productArabicName as string) ||
        (p.ProductArabicName as string) ||
        (p.arabicName as string) ||
        (p.ArabicName as string) ||
        null,
      preef: String(p.preef || p.Preef || raw.preef || ''),
      arabicPreef: (p.arabicPreef as string) || (p.ArabicPreef as string) || null,
      description: (p.description as string) || (p.Description as string) || null,
      arabicDescription:
        (p.arabicDescription as string) || (p.ArabicDescription as string) || null,
      createdAt: String(p.createdAt || p.CreatedAt || ''),
      updatedAt: String(p.updatedAt || p.UpdatedAt || ''),
      categoryName: (p.categoryName as string) || (p.CategoryName as string) || null,
      purchasePrice: Number(p.purchasePrice ?? p.PurchasePrice ?? 0),
      salesPrice,
      flashSaleFromDate:
        (p.flashSaleFromDate as string) || (p.FlashSaleFromDate as string) || null,
      flashSaleToDate:
        (p.flashSaleToDate as string) || (p.FlashSaleToDate as string) || null,
      priceBeforeFlashSale:
        (p.priceBeforeFlashSale as number) ?? (p.PriceBeforeFlashSale as number) ?? null,
      priceAfterFlashSale:
        (p.priceAfterFlashSale as number) ?? (p.PriceAfterFlashSale as number) ?? null,
      isFlashSaleActive: Boolean(p.isFlashSaleActive ?? p.IsFlashSaleActive ?? false),
      effectiveSalesPrice: effPrice > 0 ? effPrice : salesPrice,
      creationDate: String(p.creationDate || p.CreationDate || ''),
      inventoryUserId: invId,
      inventoryUserName: resolvedName,
      stockQuantity: Number(p.stockQuantity ?? p.StockQuantity ?? 0),
      discountRate: Number(p.discountRate ?? p.DiscountRate ?? 0),
      maxQuantity: Number(p.maxQuantity ?? p.MaxQuantity ?? 0),
      productCode: String(p.productCode || p.ProductCode || raw.productCode || ''),
      revenuePercentage: Number(p.revenuePercentage ?? p.RevenuePercentage ?? 0),
    }
  })

  const inventories: ProductInventoryDto[] = rawInventories.map((item) => {
    const inv = item as unknown as Record<string, unknown>
    const invId = String(
      inv.inventoryUserId ||
        inv.InventoryUserId ||
        inv.userId ||
        inv.UserId ||
        inv.inventoryId ||
        inv.InventoryId ||
        '',
    ).trim()
    const directName = String(
      inv.inventoryName ||
        inv.InventoryName ||
        inv.inventoryUserName ||
        inv.InventoryUserName ||
        inv.providerName ||
        inv.ProviderName ||
        inv.vendorName ||
        inv.VendorName ||
        inv.userName ||
        inv.UserName ||
        inv.fullName ||
        inv.FullName ||
        inv.storeName ||
        inv.StoreName ||
        inv.name ||
        inv.Name ||
        '',
    ).trim()

    const resolvedName = directName || (invId ? providerNames.get(invId) : '') || ''
    const salesPrice = Number(inv.salesPrice ?? inv.SalesPrice ?? 0)
    const effPrice = Number(inv.effectiveSalesPrice ?? inv.EffectiveSalesPrice ?? salesPrice)

    return {
      inventoryUserId: invId,
      salesPrice,
      flashSaleFromDate:
        (inv.flashSaleFromDate as string) || (inv.FlashSaleFromDate as string) || null,
      flashSaleToDate:
        (inv.flashSaleToDate as string) || (inv.FlashSaleToDate as string) || null,
      priceBeforeFlashSale:
        (inv.priceBeforeFlashSale as number) ?? (inv.PriceBeforeFlashSale as number) ?? null,
      priceAfterFlashSale:
        (inv.priceAfterFlashSale as number) ?? (inv.PriceAfterFlashSale as number) ?? null,
      isFlashSaleActive: Boolean(inv.isFlashSaleActive ?? inv.IsFlashSaleActive ?? false),
      effectiveSalesPrice: effPrice > 0 ? effPrice : salesPrice,
      discountRate: Number(inv.discountRate ?? inv.DiscountRate ?? 0),
      stockQuantity: Number(inv.stockQuantity ?? inv.StockQuantity ?? 0),
      inventoryName: resolvedName,
    }
  })

  return {
    id: String(raw.id || raw.Id || raw.productId || raw.ProductId || ''),
    productId: String(raw.productId || raw.ProductId || raw.id || raw.Id || ''),
    categoryId: String(raw.categoryId || raw.CategoryId || ''),
    productName: String(raw.productName || raw.ProductName || ''),
    productArabicName: String(
      raw.productArabicName || raw.ProductArabicName || raw.arabicName || raw.ArabicName || '',
    ),
    preef: String(raw.preef || raw.Preef || ''),
    arabicPreef: (raw.arabicPreef as string) || (raw.ArabicPreef as string) || null,
    description: String(raw.description || raw.Description || ''),
    brandName: (raw.brandName as string) || (raw.BrandName as string) || null,
    arabicDescription: (raw.arabicDescription as string) || (raw.ArabicDescription as string) || null,
    createdAt: String(raw.createdAt || raw.CreatedAt || ''),
    updatedAt: String(raw.updatedAt || raw.UpdatedAt || ''),
    category: ((raw.category || raw.Category || null) as unknown) as any,
    prices,
    inventories,
    inventoryUserId: String(
      raw.inventoryUserId || raw.InventoryUserId || prices[0]?.inventoryUserId || '',
    ),
    images: extractImages(raw),
    productCode: Number(raw.productCode || raw.ProductCode || 0),
    isPopular: Boolean(raw.isPopular ?? raw.IsPopular ?? false),
    orderNum: raw.orderNum !== null && raw.orderNum !== undefined ? Number(raw.orderNum) : null,
    revenuePercentage: Number(raw.revenuePercentage ?? raw.RevenuePercentage ?? 0),
    tagName: String(raw.tagName || raw.TagName || ''),
  }
}

export class ApiProductRepository implements ProductRepository {
  constructor(private readonly http: HttpClient) {}

  /**
   * Paginated search using /api/Products/search-product.
   * page is 0-indexed; pageSize=15. Returns items for the page and
   * a hasNextPage flag (true when the backend returned a full page).
   */
  async searchProductPaginated(params: {
    search?: string
    page: number
    pageSize: number
  }): Promise<{ items: ProviderProductDto[]; hasNextPage: boolean }> {
    try {
      const raw = await this.http.get<unknown>(PRODUCT_ROUTES.searchProduct(params), {
        showFeedback: false,
      })
      const items = extractProductItems(raw)
      const mapped = items.map((p) => this.toProviderProduct(p))
      return { items: mapped, hasNextPage: items.length === params.pageSize }
    } catch {
      return { items: [], hasNextPage: false }
    }
  }

  async searchProducts(params: SearchProductsParams = {}): Promise<ProviderProductDto[]> {
    const query = params.search?.trim()
    const isVendorOrCategoryScoped = Boolean(params.inventoryId || params.catId)

    if (isVendorOrCategoryScoped) {
      // 1. Try search-product-category with vendor/cat filters
      try {
        const raw = await this.http.get<unknown>(PRODUCT_ROUTES.searchProductCategory(params), {
          showFeedback: false,
        })
        const items = extractProductItems(raw)
        if (items.length > 0) {
          let mapped = items.map((p) => this.toProviderProduct(p))
          if (params.inventoryId) {
            mapped = mapped.filter((p) => !p.inventoryUserId || p.inventoryUserId === params.inventoryId)
          }
          return query ? this.filterLocally(mapped, query) : mapped
        }
      } catch {
        // Fallback below
      }

      // 2. Try search-product-category without search query to get all vendor/cat products, then filter locally
      if (query) {
        try {
          const allRaw = await this.http.get<unknown>(
            PRODUCT_ROUTES.searchProductCategory({ ...params, search: undefined }),
            { showFeedback: false },
          )
          const items = extractProductItems(allRaw)
          if (items.length > 0) {
            let mapped = items.map((p) => this.toProviderProduct(p))
            if (params.inventoryId) {
              mapped = mapped.filter((p) => !p.inventoryUserId || p.inventoryUserId === params.inventoryId)
            }
            return this.filterLocally(mapped, query)
          }
        } catch {
          // Fallback below
        }
      }

      // 3. Fallback: fetch general products and filter by vendor inventoryId
      if (params.inventoryId) {
        try {
          const allRaw = await this.http.get<unknown>(
            PRODUCT_ROUTES.searchProduct({ search: undefined }),
            { showFeedback: false },
          )
          const items = extractProductItems(allRaw)
          if (items.length > 0) {
            let mapped = items.map((p) => this.toProviderProduct(p))
            mapped = mapped.filter((p) => p.inventoryUserId === params.inventoryId)
            return query ? this.filterLocally(mapped, query) : mapped
          }
        } catch {
          return []
        }
      }

      return []
    }

    // Global search across all products/vendors:
    // 1. Try /api/Products/search-product
    try {
      const raw = await this.http.get<unknown>(PRODUCT_ROUTES.searchProduct({ search: query }), {
        showFeedback: false,
      })
      const items = extractProductItems(raw)
      if (items.length > 0) {
        const mapped = items.map((p) => this.toProviderProduct(p))
        return query ? this.filterLocally(mapped, query) : mapped
      }
    } catch {
      // Continue to category endpoint
    }

    // 2. Try /api/Products/search-product-category
    try {
      const raw = await this.http.get<unknown>(PRODUCT_ROUTES.searchProductCategory(params), {
        showFeedback: false,
      })
      const items = extractProductItems(raw)
      if (items.length > 0) {
        const mapped = items.map((p) => this.toProviderProduct(p))
        return query ? this.filterLocally(mapped, query) : mapped
      }
    } catch {
      // Continue
    }

    // 3. If query was supplied and returned 0 results, try fetching all without query and filter locally
    if (query) {
      try {
        const allRaw = await this.http.get<unknown>(
          PRODUCT_ROUTES.searchProduct({ search: undefined }),
          { showFeedback: false },
        )
        const items = extractProductItems(allRaw)
        if (items.length > 0) {
          const mapped = items.map((p) => this.toProviderProduct(p))
          return this.filterLocally(mapped, query)
        }
      } catch {
        // Fallback to category endpoint without search
        try {
          const allRaw = await this.http.get<unknown>(
            PRODUCT_ROUTES.searchProductCategory({ ...params, search: undefined }),
            { showFeedback: false },
          )
          const items = extractProductItems(allRaw)
          const mapped = items.map((p) => this.toProviderProduct(p))
          return this.filterLocally(mapped, query)
        } catch {
          return []
        }
      }
    }

    return []
  }

  private filterLocally(products: ProviderProductDto[], query: string): ProviderProductDto[] {
    const q = normalizeSearchText(query)
    if (!q) return products
    return products.filter((p) => {
      const fields = [
        p.productName,
        p.productArabicName,
        p.description,
        p.arabicDescription,
        p.preef,
        p.arabicPreef,
        p.productCode,
        p.categoryName,
        p.inventoryUserName,
      ]
        .filter(Boolean)
        .map((f) => normalizeSearchText(String(f)))

      return fields.some((f) => f.includes(q))
    })
  }

  private toProviderProduct(p: SearchProductItemDto | FavoriteProductDto | PopularProductDto): ProviderProductDto {
    const raw = p as unknown as Record<string, unknown>
    const invId = (typeof raw.inventoryId === 'string' ? raw.inventoryId : '') || (typeof raw.inventoryUserId === 'string' ? raw.inventoryUserId : '')
    const invName = (typeof raw.inventoryName === 'string' ? raw.inventoryName : null) || (typeof raw.inventoryUserName === 'string' ? raw.inventoryUserName : null)
    const catName = typeof raw.categoryName === 'string' ? raw.categoryName : null

    return {
      id: p.productId,
      productId: p.productId,
      productPriceId: p.productPriceId,
      inventoryUserId: invId,
      productName: p.productName,
      productArabicName: p.arabicName,
      preef: p.preef,
      arabicPreef: p.arabicPreef,
      description: p.description ?? '',
      arabicDescription: p.arabicDescription,
      createdAt: '',
      updatedAt: '',
      categoryName: catName,
      purchasePrice: 0,
      salesPrice: p.salesPrice,
      flashSaleFromDate: p.flashSaleFromDate,
      flashSaleToDate: p.flashSaleToDate,
      priceBeforeFlashSale: p.priceBeforeFlashSale ?? 0,
      priceAfterFlashSale: p.priceAfterFlashSale,
      isFlashSaleActive: p.isFlashSaleActive,
      effectiveSalesPrice: p.effectiveSalesPrice ?? p.salesPrice,
      creationDate: '',
      inventoryUserName: invName,
      stockQuantity: p.stockQuantity,
      discountRate: p.discountRate,
      maxQuantity: 0,
      productCode: String(p.productCode),
      revenuePercentage: 0,
      images: extractImages(raw),
      isFavorite: p.isFavorite,
    }
  }

  async getProductById(id: string, lang: number): Promise<ProductDetailDto> {
    const raw = await this.http.get<unknown>(PRODUCT_ROUTES.byId(id, lang), {
      showFeedback: false,
    })
    return normalizeProductDetail(raw)
  }

  async getPricesByProduct(productId: string): Promise<ProductPriceOptionDto[]> {
    const rows = await this.http.get<unknown[]>(PRODUCT_ROUTES.pricesByProduct(productId), {
      showFeedback: false,
    })
    if (!Array.isArray(rows)) return []
    const options: ProductPriceOptionDto[] = []
    for (const row of rows) {
      const raw = row as Record<string, unknown>
      const priceId =
        (typeof raw.productPriceId === 'string' && raw.productPriceId) ||
        (typeof raw.id === 'string' && raw.id) ||
        ''
      if (!priceId || EMPTY_GUID.test(priceId)) continue
      options.push({
        productPriceId: priceId,
        salesPrice: typeof raw.salesPrice === 'number' ? raw.salesPrice : 0,
        effectiveSalesPrice: typeof raw.effectiveSalesPrice === 'number' ? raw.effectiveSalesPrice : 0,
        stockQuantity: typeof raw.stockQuantity === 'number' ? raw.stockQuantity : 0,
        inventoryUserId: typeof raw.inventoryUserId === 'string' ? raw.inventoryUserId : '',
      })
    }
    return options
  }

  toggleFavorite(userId: string, productId: string, productPriceId: string): Promise<unknown> {
    return this.http.post<unknown>(PRODUCT_ROUTES.toggleFavorite(userId, productId, productPriceId))
  }

  async getMyFavorites(): Promise<ProviderProductDto[]> {
    const favorites = await this.http.get<FavoriteProductDto[]>(PRODUCT_ROUTES.myFavorites, {
      showFeedback: false,
    })
    return favorites.map((f) => this.toProviderProduct(f))
  }

  async getPopularProducts(): Promise<ProviderProductDto[]> {
    try {
      const items = await this.http.get<PopularProductDto[]>(PRODUCT_ROUTES.popularProducts, {
        showFeedback: false,
      })
      if (!Array.isArray(items)) {
        return []
      }
      return items.map((p) => this.toProviderProduct(p))
    } catch {
      return []
    }
  }
}