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
}