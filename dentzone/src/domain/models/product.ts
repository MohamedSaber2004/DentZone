import type { CategoryDto } from './category'

export interface ProductPriceDto {
  id: string
  productId: string
  productName: string
  productArabicName: string | null
  preef: string
  arabicPreef: string | null
  description: string | null
  arabicDescription: string | null
  createdAt: string
  updatedAt: string
  categoryName: string | null
  purchasePrice: number
  salesPrice: number
  flashSaleFromDate: string | null
  flashSaleToDate: string | null
  priceBeforeFlashSale: number | null
  priceAfterFlashSale: number | null
  isFlashSaleActive: boolean
  effectiveSalesPrice: number
  creationDate: string
  inventoryUserId: string
  inventoryUserName: string | null
  stockQuantity: number
  discountRate: number
  maxQuantity: number
  productCode: string
  revenuePercentage: number
}

export interface ProductInventoryDto {
  inventoryUserId: string
  salesPrice: number
  flashSaleFromDate: string | null
  flashSaleToDate: string | null
  priceBeforeFlashSale: number | null
  priceAfterFlashSale: number | null
  isFlashSaleActive: boolean
  effectiveSalesPrice: number
  discountRate: number
  stockQuantity: number
  inventoryName: string
}

export interface ProductDetailDto {
  id: string
  productId: string
  categoryId: string
  productName: string
  productArabicName: string
  preef: string
  arabicPreef: string | null
  description: string
  brandName: string | null
  arabicDescription: string | null
  createdAt: string
  updatedAt: string
  category: CategoryDto | null
  prices: ProductPriceDto[]
  inventories: ProductInventoryDto[]
  inventoryUserId: string
  images: string[]
  productCode: number
  isPopular: boolean
  orderNum: number | null
  revenuePercentage: number
  tagName: string
}

export interface ProviderProductDto {
  id: string
  productId: string
  productPriceId: string
  productName: string
  productArabicName: string
  preef: string
  arabicPreef: string | null
  description: string
  arabicDescription: string | null
  createdAt: string
  updatedAt: string
  categoryName: string | null
  purchasePrice: number
  salesPrice: number
  flashSaleFromDate: string | null
  flashSaleToDate: string | null
  priceBeforeFlashSale: number
  priceAfterFlashSale: number | null
  isFlashSaleActive: boolean
  effectiveSalesPrice: number
  creationDate: string
  inventoryUserId: string
  inventoryUserName: string | null
  stockQuantity: number
  discountRate: number
  maxQuantity: number
  productCode: string
  revenuePercentage: number
  images: string[]
  isFavorite?: boolean
}

export interface FavoriteProductDto {
  productId: string
  productPriceId: string
  inventoryId: string
  productName: string
  arabicName: string
  description: string
  arabicDescription: string
  preef: string
  arabicPreef: string
  images: string[]
  discountRate: number
  salesPrice: number
  flashSaleFromDate: string | null
  flashSaleToDate: string | null
  priceBeforeFlashSale: number | null
  priceAfterFlashSale: number | null
  isFlashSaleActive: boolean
  effectiveSalesPrice: number | null
  stockQuantity: number
  productCode: number
  isFavorite: boolean
}

export interface PopularProductDto {
  productId: string
  productPriceId: string
  inventoryId: string
  inventoryName: string | null
  productName: string
  arabicName: string
  description: string
  arabicDescription: string
  preef: string
  arabicPreef: string
  images: string[]
  discountRate: number
  salesPrice: number
  flashSaleFromDate: string | null
  flashSaleToDate: string | null
  priceBeforeFlashSale: number | null
  priceAfterFlashSale: number | null
  isFlashSaleActive: boolean
  effectiveSalesPrice: number | null
  stockQuantity: number
  productCode: number
  isFavorite: boolean
  isPupolar?: boolean
  isPopular?: boolean
}