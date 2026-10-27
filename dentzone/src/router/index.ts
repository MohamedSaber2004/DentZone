import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { services } from '../di/container'
import { onLocaleChange, t, type MessageKey } from '../i18n'
import { applySeo, homeJsonLd } from '../utils/seo'
import { requestTracker } from '../application/request.tracker'

declare module 'vue-router' {
  interface RouteMeta {
    /** i18n key used for the document title + screen-reader announcements */
    titleKey?: MessageKey
    /** i18n key used for the meta description */
    descriptionKey?: MessageKey
    /** Robots directive for routes that must not be indexed */
    robots?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { titleKey: 'seo.homeTitle', descriptionKey: 'seo.homeDescription' },
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.loginTitle', robots: 'noindex, nofollow' },
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.registerTitle', robots: 'noindex, nofollow' },
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.forgotTitle', robots: 'noindex, nofollow' },
    },
    {
      path: '/auth/verify-otp',
      name: 'verify-otp',
      component: () => import('../views/VerifyOtpView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.verifyTitle', robots: 'noindex, nofollow' },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { guestOnly: true, titleKey: 'auth.resetTitle', robots: 'noindex, nofollow' },
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
      meta: { titleKey: 'seo.categoriesTitle', descriptionKey: 'seo.categoriesDescription' },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/AllProductsView.vue'),
      meta: { titleKey: 'seo.productsTitle', descriptionKey: 'seo.productsDescription' },
    },
    {
      path: '/vendors',
      name: 'vendors',
      component: () => import('../views/VendorsView.vue'),
      meta: { titleKey: 'seo.vendorsTitle', descriptionKey: 'seo.vendorsDescription' },
    },
    {
      path: '/categories/:catId',
      name: 'category-inventories',
      component: () => import('../views/CategoryInventoriesView.vue'),
      meta: { titleKey: 'seo.categoryTitle', descriptionKey: 'seo.categoryDescription' },
    },
    {
      path: '/categories/inventory/:inventoryUserId',
      name: 'inventory-products',
      component: () => import('../views/InventoryProductsView.vue'),
      meta: { titleKey: 'seo.inventoryTitle', descriptionKey: 'seo.inventoryDescription' },
    },
    {
      path: '/categories/inventory/:inventoryUserId/product/:productId',
      name: 'product-details',
      component: () => import('../views/ProductDetailsView.vue'),
      meta: { titleKey: 'product.viewProduct', descriptionKey: 'seo.productDescription' },
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      alias: ['/privacy'],
      component: () => import('../views/PrivacyPolicyView.vue'),
      meta: { titleKey: 'policy.title', descriptionKey: 'seo.privacyDescription' },
    },
    {
      path: '/terms-and-conditions',
      name: 'terms-conditions',
      alias: ['/terms', '/terms-conditions'],
      component: () => import('../views/TermsConditionsView.vue'),
      meta: { titleKey: 'terms.title', descriptionKey: 'seo.termsDescription' },
    },
    {
      path: '/refund-policy',
      name: 'refund-policy',
      alias: ['/return-policy', '/returns', '/returns-policy'],
      component: () => import('../views/RefundPolicyView.vue'),
      meta: { titleKey: 'refund.title', descriptionKey: 'seo.refundDescription' },
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: () => import('../views/WishlistView.vue'),
      meta: { requiresAuth: true, titleKey: 'wishlist.title', robots: 'noindex, nofollow' },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
      meta: { titleKey: 'cart.title', robots: 'noindex, nofollow' },
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
      meta: { titleKey: 'checkout.title', robots: 'noindex, nofollow' },
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('../views/OrdersView.vue'),
      meta: { requiresAuth: true, titleKey: 'orders.title', robots: 'noindex, nofollow' },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue'),
      meta: { requiresAuth: true, titleKey: 'notifications.title', robots: 'noindex, nofollow' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true, titleKey: 'profile.title', robots: 'noindex, nofollow' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  requestTracker.begin()
  const { authService, cartService } = services
  if (to.meta.guestOnly && authService.isAuthenticated) {
    requestTracker.settle()
    return { name: 'home' }
  }
  if (to.meta.requiresAuth && !authService.isAuthenticated) {
    requestTracker.settle()
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'checkout' && cartService.count.value === 0) {
    requestTracker.settle()
    return { name: 'cart' }
  }
  return true
})

const pageTitleFor = (to: RouteLocationNormalized): string =>
  to.meta.titleKey ? t(to.meta.titleKey) : ''

const canonicalPathFor = (to: RouteLocationNormalized): string => {
  if (!to.name) return to.path
  try {
    // Resolves aliases to their primary path so duplicate URLs share one canonical.
    return router.resolve({ name: to.name as string, params: to.params }).path
  } catch {
    return to.path
  }
}

const applyRouteSeo = (to: RouteLocationNormalized): void => {
  applySeo({
    title: pageTitleFor(to),
    description: to.meta.descriptionKey ? t(to.meta.descriptionKey) : '',
    canonicalPath: canonicalPathFor(to),
    robots: to.meta.robots,
    jsonLd: to.name === 'home' ? homeJsonLd() : undefined,
  })
}

onLocaleChange(() => {
  const current = router.currentRoute.value
  if (current.name) applyRouteSeo(current)
})

let announcer: HTMLElement | null = null

// Screen readers don't announce SPA route changes on their own —
// keep document.title in sync and announce the new page politely.
router.afterEach((to) => {
  requestTracker.settle()
  applyRouteSeo(to)

  const pageTitle = pageTitleFor(to)
  const fullTitle = pageTitle ? `${pageTitle} · DentZone` : 'DentZone'

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'page_view',
    page_path: to.fullPath,
    page_title: fullTitle,
    page_location: window.location.href,
  })

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

router.onError(() => {
  requestTracker.settle()
})

export default router