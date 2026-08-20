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
  areaId: number | null
  area?: {
    id: number
    name: string
  } | null
}

export interface AreaDto {
  id: number
  name: string
  shippingCosts: number
  cityId: number
}

export interface CreateAddressDto {
  userId: string
  addressLine: string
  latitude?: number | null
  longitude?: number | null
  floorNum?: number | null
  apartmentNum?: number | null
  areaId?: number | null
}

export interface UpdateAddressDto {
  addressLine: string
}

export interface UserProfileDto {
  id: string
  fullName: string
  userName: string | null
  email: string
  phoneNumber: string | null
  isPopular: boolean | null
  orderNum: number | null
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  fcmToken: string | null
  profileImage: string | null
  addresses: AddressDto[]
  roles: UserRoleDto[]
}

export interface UserRoleDto {
  id: string
  name: string
}