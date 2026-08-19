import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { services } from '../di/container'

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
      meta: { guestOnly: true },
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/auth/verify-otp',
      name: 'verify-otp',
      component: () => import('../views/VerifyOtpView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
    },
    {
      path: '/categories/:catId',
      name: 'category-inventories',
      component: () => import('../views/CategoryInventoriesView.vue'),
    },
    {
      path: '/categories/inventory/:inventoryUserId',
      name: 'inventory-products',
      component: () => import('../views/InventoryProductsView.vue'),
    },
    {
      path: '/categories/inventory/:inventoryUserId/product/:productId',
      name: 'product-details',
      component: () => import('../views/ProductDetailsView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
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

export default router