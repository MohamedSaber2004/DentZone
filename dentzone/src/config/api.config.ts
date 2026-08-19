export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '')

const V1 = '/api/v1'

export const AUTH_ROUTES = {
  login: `${V1}/auth/login`,
  refreshToken: `${V1}/auth/refresh-token`,
  logout: `${V1}/auth/logout`,
  forgotPassword: `${V1}/auth/forgot-password`,
  verifyOtp: `${V1}/auth/verify-otp`,
  resetPassword: `${V1}/auth/reset-password`,
  profile: `${V1}/auth/profile`,
  changePassword: `${V1}/auth/change-password`,
} as const

export const CATALOG_ROUTES = {
  categories: `${V1}/catalog/categories`,
  products: `${V1}/catalog/products`,
  productBySlug: (slug: string) => `${V1}/catalog/products/${encodeURIComponent(slug)}`,
  relatedProducts: (slug: string) => `${V1}/catalog/products/${encodeURIComponent(slug)}/related`,
  vendors: `${V1}/catalog/vendors`,
  vendorBySlug: (slug: string) => `${V1}/catalog/vendors/${encodeURIComponent(slug)}`,
  vendorProducts: (slug: string) => `${V1}/catalog/vendors/${encodeURIComponent(slug)}/products`,
  reviews: (productId: string) => `${V1}/catalog/reviews/${encodeURIComponent(productId)}`,
  advertisements: `${V1}/catalog/advertisements`,
  settings: `${V1}/catalog/settings`,
} as const

export const WISHLIST_ROUTES = {
  base: `${V1}/wishlist`,
  item: (productId: string) => `${V1}/wishlist/${encodeURIComponent(productId)}`,
} as const

export const ORDER_ROUTES = {
  base: `${V1}/orders`,
  byId: (id: string) => `${V1}/orders/${encodeURIComponent(id)}`,
} as const

export const API_ROUTES = {
  auth: AUTH_ROUTES,
  catalog: CATALOG_ROUTES,
  wishlist: WISHLIST_ROUTES,
  orders: ORDER_ROUTES,
} as const