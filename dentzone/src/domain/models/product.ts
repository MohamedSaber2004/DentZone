export type ProductBadge = 'new' | 'bestseller' | 'sale' | 'eco'

export interface Product {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  categoryId: string
  vendorId: string
  brand: string
  price: number
  compareAtPrice?: number
  rating: number
  reviewCount: number
  inStock: boolean
  stockQuantity: number
  image: string
  badge?: ProductBadge
  isFeatured: boolean
  isBestseller: boolean
  features: string[]
}

export interface ProductQuery {
  categoryId?: string
  search?: string
  sort?: ProductSort
}

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'