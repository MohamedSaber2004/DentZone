export interface LoginResponseDto {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  addresses: AddressDto[]
  token: string
  hasDetails: boolean
  message: string | null
  role: string
}

export interface AddressDto {
  id: string
  userId: string
  addressLine: string
  latitude: number | null
  longitude: number | null
  floorNum: number | null
  apartmentNum: number | null
}

export interface UserProfileDto {
  id: string
  fullName: string
  email: string
  birthDate: string | null
  profilePictureName: string | null
  language: string
  userType: number
  ordersCount?: number
}