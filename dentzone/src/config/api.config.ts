export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '')

const base = '/api'

export const AUTH_ROUTES = {
  login: `${base}/Users/login`,
} as const

export const PASSWORD_ROUTES = {
  forgot: `${base}/Users/forget-password`,
  verifyOtp: `${base}/Users/verify-otp`,
  reset: `${base}/Users/reset-password`,
  resendOtp: `${base}/Users/resend-otp`,
} as const

export const USER_ROUTES = {
  profile: (userId: string) => `${base}/Users/user/${userId}`,
  update: (userId: string) => `${base}/Users/${userId}`,
} as const

export const CATEGORY_ROUTES = {
  all: (lang: number) => `${base}/Categories?lang=${lang}`,
  inventoriesByCategory: (catId: string) => `${base}/Categories/inventories-bycategory/${catId}`,
} as const

export const PRODUCT_ROUTES = {
  searchProductCategory: (params: { catId?: string; inventoryId?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params.catId) query.set('catId', params.catId)
    if (params.inventoryId) query.set('inventoryId', params.inventoryId)
    if (params.search) query.set('search', params.search)
    const suffix = query.toString()
    return `${base}/Products/search-product-category${suffix ? `?${suffix}` : ''}`
  },
} as const