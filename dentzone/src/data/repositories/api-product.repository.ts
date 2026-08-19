import type { ProductRepository, SearchProductsParams } from '../../domain/ports/product-repository'
import type { ProviderProductDto } from '../../domain/models/product'
import { PRODUCT_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiProductRepository implements ProductRepository {
  constructor(private readonly http: HttpClient) {}

  searchProducts(params: SearchProductsParams): Promise<ProviderProductDto[]> {
    return this.http.get<ProviderProductDto[]>(PRODUCT_ROUTES.searchProductCategory(params), {
      showFeedback: false,
    })
  }
}