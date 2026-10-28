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

export interface HomeSectionItemDto {
  id: string
  kind: number
  title: string
  subtitle: string | null
  price: number
  oldPrice: number | null
  discountRate: number
  imageUrl: string
  linkUrl: string | null
  productPriceId: string
  linkSectionId: string | null
  productId: string
  inventoryId: string
  categoryId: string | null
  brandId: string | null
}

export interface HomeSectionDto {
  id: string
  type: number
  typeKey: string
  title: string
  subtitle: string | null
  startDate: string | null
  endDate: string | null
  items: HomeSectionItemDto[]
  products: ProviderProductDto[]
}

export interface HomePromoBannerDto {
  id: string
  title: string
  imageUrl: string
  productId: string | null
  inventoryId: string | null
  productPriceId: string | null
}

export interface HomeDto {
  banners: HomeBannerDto[]
  promoBanners: HomePromoBannerDto[]
  categories: CategoryDto[]
  products: ProviderProductDto[]
  providers: HomeProviderDto[]
  brands: HomeBrandDto[]
  specialOffersone: SpecialOfferDto[]
  specialOfferstwo: SpecialOfferDto[]
  flashSales: ProviderProductDto[]
  sections: HomeSectionDto[]
  offers: HomeSectionDto[]
  fullName: string | null
}