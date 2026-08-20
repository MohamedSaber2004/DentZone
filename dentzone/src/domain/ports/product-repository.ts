import type { ProductDetailDto, ProviderProductDto } from '../models/product'

export interface SearchProductsParams {
  catId?: string
  inventoryId?: string
  search?: string
  pageNumber?: number
  pageSize?: number
}

export interface PaginatedProductsResult {
  items: ProviderProductDto[]
  hasNextPage: boolean
}

export interface ProductRepository {
  searchProducts(params: SearchProductsParams): Promise<ProviderProductDto[]>
  searchProductPaginated(params: {
    search?: string
    page: number
    pageSize: number
  }): Promise<PaginatedProductsResult>
  getProductById(id: string, lang: number): Promise<ProductDetailDto>
  toggleFavorite(userId: string, productId: string, productPriceId: string): Promise<unknown>
  getMyFavorites(): Promise<ProviderProductDto[]>
  getPopularProducts(): Promise<ProviderProductDto[]>
}