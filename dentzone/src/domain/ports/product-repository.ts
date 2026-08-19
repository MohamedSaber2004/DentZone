import type { ProductDetailDto, ProviderProductDto } from '../models/product'

export interface SearchProductsParams {
  catId?: string
  inventoryId?: string
  search?: string
}

export interface ProductRepository {
  searchProducts(params: SearchProductsParams): Promise<ProviderProductDto[]>
  getProductById(id: string, lang: number): Promise<ProductDetailDto>
}