import type { CategoryRepository } from '../../domain/ports/category-repository'
import type { CategoryDto, InventoryDto } from '../../domain/models/category'
import { CATEGORY_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiCategoryRepository implements CategoryRepository {
  constructor(private readonly http: HttpClient) {}

  getCategories(lang: number): Promise<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(CATEGORY_ROUTES.all(lang), { showFeedback: false })
  }

  getInventoriesByCategory(catId: string): Promise<InventoryDto[]> {
    return this.http.get<InventoryDto[]>(CATEGORY_ROUTES.inventoriesByCategory(catId), { showFeedback: false })
  }
}