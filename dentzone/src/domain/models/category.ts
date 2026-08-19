export const categoryImageUrl = (imageName: string): string =>
  imageName.startsWith('http://') ? imageName.replace('http://', 'https://') : imageName

export interface CategoryDto {
  id: string
  name: string
  pref: string
  description: string
  companyPercentage: number | null
  orderNum: number
  arabicName: string
  imageName: string
}

export interface InventoryDto {
  inventoryId: string
  fullName: string
  email: string
  addresses: string
  phoneNumber: string
  isAvailableNow: boolean
}