import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { services } from '../di/container'
import { t, type MessageKey } from '../i18n'

declare module 'vue-router' {
  interface RouteMeta {
    /** i18n key used for the document title + screen-reader announcements */
    titleKey?: MessageKey
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.loginTitle' },
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.forgotTitle' },
    },
    {
      path: '/auth/verify-otp',
      name: 'verify-otp',
      component: () => import('../views/VerifyOtpView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.verifyTitle' },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.resetTitle' },
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
      meta: { titleKey: 'categories.title' },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/AllProductsView.vue'),
      meta: { titleKey: 'products.title' },
    },
    {
      path: '/vendors',
      name: 'vendors',
      component: () => import('../views/VendorsView.vue'),
      meta: { titleKey: 'home.shopByVendor' },
    },
    {
      path: '/categories/:catId',
      name: 'category-inventories',
      component: () => import('../views/CategoryInventoriesView.vue'),
      meta: { titleKey: 'nav.categories' },
    },
    {
      path: '/categories/inventory/:inventoryUserId',
      name: 'inventory-products',
      component: () => import('../views/InventoryProductsView.vue'),
      meta: { titleKey: 'nav.categories' },
    },
    {
      path: '/categories/inventory/:inventoryUserId/product/:productId',
      name: 'product-details',
      component: () => import('../views/ProductDetailsView.vue'),
      meta: { requiresAuth: true, titleKey: 'product.viewProduct' },
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: () => import('../views/PrivacyPolicyView.vue'),
      meta: { titleKey: 'policy.title' },
    },
    {
      path: '/terms-and-conditions',
      name: 'terms-conditions',
      component: () => import('../views/TermsConditionsView.vue'),
      meta: { titleKey: 'terms.title' },
    },
    {
      path: '/refund-policy',
      name: 'refund-policy',
      component: () => import('../views/RefundPolicyView.vue'),
      meta: { titleKey: 'refund.title' },
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: () => import('../views/WishlistView.vue'),
      meta: { requiresAuth: true, titleKey: 'wishlist.title' },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
      meta: { requiresAuth: true, titleKey: 'cart.title' },
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
      meta: { requiresAuth: true, titleKey: 'checkout.title' },
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue'),
      meta: { requiresAuth: true, titleKey: 'orders.title' },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue'),
      meta: { requiresAuth: true, titleKey: 'notifications.title' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true, titleKey: 'profile.title' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const authService = services.authService
  if (to.meta.guestOnly && authService.isAuthenticated) {
    return { name: 'home' }
  }
  if (to.meta.requiresAuth && !authService.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

let announcer: HTMLElement | null = null

// Screen readers don't announce SPA route changes on their own —
// keep document.title in sync and announce the new page politely.
router.afterEach((to) => {
  const pageTitle = to.meta.titleKey ? t(to.meta.titleKey) : ''
  const fullTitle = pageTitle ? `${pageTitle} · DentZone` : 'DentZone'
  document.title = fullTitle

  if (typeof document === 'undefined') return
  if (!announcer) {
    announcer = document.createElement('div')
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', 'polite')
    announcer.className = 'visually-hidden'
    document.body.appendChild(announcer)
  }
  announcer.textContent = ''
  window.setTimeout(() => {
    if (announcer) announcer.textContent = fullTitle
  }, 100)
})

export default router