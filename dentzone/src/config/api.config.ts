export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '')

export const API_LANG = {
  ARABIC: 1,
  ENGLISH: 2,
} as const

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
  changePassword: `${base}/Users/ChangePassword`,
  delete: (userId: string) => `${base}/Users/delete-user/${userId}`,
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
  byId: (id: string, lang: number) => `${base}/Products/${id}?lang=${lang}`,
} as const

export const POLICY_ROUTES = {
  getPolicy: (lang: number) => `${base}/Policy/get-policy?lang=${lang}`,
} as const

export const REFUND_POLICY_ROUTES = {
  getRefundPolicy: (lang: number) => `${base}/RefundPolicy/get-refundpolicy?lang=${lang}`,
} as const

export const ADDRESS_ROUTES = {
  userAddresses: `${base}/Address/get-user-Addresses`,
  insert: `${base}/Address/insert-address`,
  update: (id: string) => `${base}/Address/update-address/${id}`,
  delete: (id: string) => `${base}/Address/delete-address/${id}`,
} as const

export const AREA_ROUTES = {
  allAreas: `${base}/Area/all-areies`,
} as const

export const SPECIAL_OFFERS_ROUTES = {
  offers: `${base}/SpecialOffers/get-offers`,
} as const