export interface CartProductDto {
  id: string
  name: string
  preef: string
  description: string
  arabicName: string
  productImage: string
}

export interface CartProductPriceDto {
  id: string
  productId: string
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
  stockQuantity: number
  maxQuantity: number
}

export interface CartInventoryUserDto {
  id: string
  fullName: string
  photo: string | null
  isActive: boolean
  userName: string
  minOrder: number | null
}

export interface CartItemDto {
  id: number
  productId: string
  product: CartProductDto
  quantity: number
  totalAmount: number
  productPriceId: string
  status: number
  productPrice: CartProductPriceDto
  inventoryUserId: string
  inventoryUser: CartInventoryUserDto
  isAvailableNow: boolean
}

export interface CartDto {
  id: number
  userId: string
  totalAmountCart: number
  isAvailableNow: boolean
  isFlashSale: boolean
  items: CartItemDto[]
}

export interface AddToCartRequestDto {
  userId: string | null
  inventoryId: string
  productId: string
  quantity: number
}

export interface UpdateCartQuantityRequestDto {
  userId: string | null
  productId: string
  inventoryId: string
  quantity: number
}

export interface RemoveFromCartRequestDto {
  userId: string | null
  productId: string
}

export interface AddToCartInput {
  productId: string
  inventoryId: string
  quantity: number
  name: string
  stockQuantity: number
  maxQuantity: number
}