export type AdvertisementTheme = 'dark' | 'gold' | 'light'

export interface Advertisement {
  id: string
  title: string
  description?: string
  image: string
  mobileImage?: string
  ctaLabel?: string
  ctaTo?: string
  eyebrow?: string
  theme?: AdvertisementTheme
}

export interface Advertisements {
  hero: Advertisement | undefined
  secondary: Advertisement[]
}
