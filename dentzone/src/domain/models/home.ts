import type { CategoryDto } from './category'
import type { ProviderProductDto } from './product'
import type { SpecialOfferDto } from './special-offer'

export interface HomeBannerDto {
  id: string
  imageName: string
  link: string
  order: number
}

export interface HomeProviderDto {
  id: string
  fullName: string
  userName: string
  email: string
  isAvailableNow: boolean
  profileImage: string
}

export interface HomeBrandDto {
  id: number
  name: string
  arName: string
  imagePath: string | null
  isPopular: boolean
}

export interface HomeDto {
  banners: HomeBannerDto[]
  categories: CategoryDto[]
  products: ProviderProductDto[]
  providers: HomeProviderDto[]
  brands: HomeBrandDto[]
  specialOffersone: SpecialOfferDto[]
  specialOfferstwo: SpecialOfferDto[]
  flashSales: ProviderProductDto[]
  fullName: string | null
}