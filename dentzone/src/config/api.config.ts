export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '')

const base = '/api'

export const AUTH_ROUTES = {
  login: `${base}/Users/login`,
  loginGuest: `${base}/Users/login-guest`,
  refreshToken: `${base}/auth/refresh-token`,
  logout: `${base}/auth/logout`,
  forgotPassword: `${base}/auth/forgot-password`,
  verifyOtp: `${base}/auth/verify-otp`,
  resetPassword: `${base}/auth/reset-password`,
  profile: `${base}/auth/profile`,
  changePassword: `${base}/auth/change-password`,
} as const

export const CATALOG_ROUTES = {
  categories: `${base}/catalog/categories`,
  products: `${base}/catalog/products`,
  productBySlug: (slug: string) => `${base}/catalog/products/${encodeURIComponent(slug)}`,
  relatedProducts: (slug: string) => `${base}/catalog/products/${encodeURIComponent(slug)}/related`,
  vendors: `${base}/catalog/vendors`,
  vendorBySlug: (slug: string) => `${base}/catalog/vendors/${encodeURIComponent(slug)}`,
  vendorProducts: (slug: string) => `${base}/catalog/vendors/${encodeURIComponent(slug)}/products`,
  reviews: (productId: string) => `${base}/catalog/reviews/${encodeURIComponent(productId)}`,
  advertisements: `${base}/catalog/advertisements`,
  settings: `${base}/catalog/settings`,
} as const

export const WISHLIST_ROUTES = {
  base: `${base}/wishlist`,
  item: (productId: string) => `${base}/wishlist/${encodeURIComponent(productId)}`,
} as const

export const ORDER_ROUTES = {
  base: `${base}/orders`,
  byId: (id: string) => `${base}/orders/${encodeURIComponent(id)}`,
} as const

export const API_ROUTES = {
  auth: AUTH_ROUTES,
  catalog: CATALOG_ROUTES,
  wishlist: WISHLIST_ROUTES,
  orders: ORDER_ROUTES,
} as const
