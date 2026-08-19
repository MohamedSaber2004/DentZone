import type { CategoryDto, InventoryDto } from '../models/category'

export interface CategoryRepository {
  getCategories(lang: number): Promise<CategoryDto[]>
  getInventoriesByCategory(catId: string): Promise<InventoryDto[]>
}