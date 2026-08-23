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
  saveFcmToken: `${base}/Users/save-fcm-token`,
  getTopProviders: `${base}/Users/get-top-providers`,
} as const

export const CATEGORY_ROUTES = {
  all: (lang: number) => `${base}/Categories?lang=${lang}`,
  inventoriesByCategory: (catId: string) => `${base}/Categories/inventories-bycategory/${catId}`,
} as const

export const PRODUCT_ROUTES = {
  searchProductCategory: (params: { catId?: string; inventoryId?: string; search?: string; pageNumber?: number; pageSize?: number }) => {
    const query = new URLSearchParams()
    if (params.catId) query.set('catId', params.catId)
    if (params.inventoryId) query.set('inventoryId', params.inventoryId)
    if (params.search) query.set('search', params.search)
    if (params.pageNumber) query.set('pageNumber', String(params.pageNumber))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    const suffix = query.toString()
    return `${base}/Products/search-product-category${suffix ? `?${suffix}` : ''}`
  },
  /** Product search: optionally accepts search, page, pageSize */
  searchProduct: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize))
    const suffix = query.toString()
    return `${base}/Products/search-product${suffix ? `?${suffix}` : ''}`
  },
  byId: (id: string, lang: number) => `${base}/Products/${id}?lang=${lang}`,
  pricesByProduct: (productId: string) => `${base}/ProductPrices/by-product/${productId}`,
  toggleFavorite: (userId: string, productId: string, productPriceId: string) => {
    const query = new URLSearchParams({ userId, productId, productPriceId })
    return `${base}/Products/toggle-Favorite?${query.toString()}`
  },
  myFavorites: `${base}/Products/get-myFav-products`,
  popularProducts: `${base}/Products/popularproducts`,
} as const

export const POLICY_ROUTES = {
  getPolicy: (lang: number) => `${base}/Policy/get-policy?lang=${lang}`,
} as const

export const REFUND_POLICY_ROUTES = {
  getRefundPolicy: (lang: number) => `${base}/RefundPolicy/get-refundpolicy?lang=${lang}`,
} as const

export const TERMS_ROUTES = {
  getTerms: (lang: number) => `${base}/TermsAndConditions/get-terms?lang=${lang}`,
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

export const HOME_ROUTES = {
  getHome: (lang: number) => `${base}/Home/GetHomeProduct?lang=${lang}`,
} as const

export const SPECIAL_OFFERS_ROUTES = {
  offers: `${base}/SpecialOffers/get-offers`,
} as const

export const CART_ROUTES = {
  getCart: (userId: string) => `${base}/Carts/${userId}`,
  addToCart: `${base}/Carts/AddToCart`,
  updateQuantity: `${base}/Carts/UpdateCartQuantity`,
  removeFromCart: `${base}/Carts/RemoveFromCart`,
} as const

export const ORDER_ROUTES = {
  deliveryTimeSlots: (day: number) => `${base}/DeliveryTimeSlots?day=${day}`,
  applyCoupon: `${base}/Coupons/apply`,
  shippingFees: (addressId: string) => `${base}/Address/GetShippingFess/${addressId}`,
  create: `${base}/Orders`,
  myOrders: (status?: number) => `${base}/Orders/my-orders${status !== undefined ? `?status=${status}` : ''}`,
} as const

export const NOTIFICATION_ROUTES = {
  byUserId: (userId: string) => `${base}/Notifacations/${userId}`,
} as const