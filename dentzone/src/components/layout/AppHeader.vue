<script setup lang="ts">
import { services } from '../../di/container'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
const { authService, cartService, notificationRepository } = services
import { useRouter } from 'vue-router'
import { t, locale, setLocale } from '../../i18n'
import { theme, toggleTheme } from '../../application/theme.service'
import { resolveMediaUrl } from '../../utils/media'
import AppIcon from '../ui/AppIcon.vue'

const router = useRouter()
const headerSearch = ref('')
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const userMenuButtonRef = ref<HTMLElement | null>(null)
const mobileMenuRef = ref<HTMLElement | null>(null)
const mobileMenuButtonRef = ref<HTMLElement | null>(null)
const avatarImageFailed = ref(false)
const unreadNotifCount = ref(0)

const onHeaderSearch = () => {
  const q = headerSearch.value.trim()
  if (q) {
    void router.push({ name: 'products', query: { search: q } })
  } else {
    void router.push({ name: 'products' })
  }
  headerSearch.value = ''
  closeMobileMenu()
}

const isAuthenticated = computed(() => authService.isAuthenticated)
const user = computed(() => authService.user.value)
const cartCount = computed(() => cartService.count.value)

const loadNotifCount = async () => {
  if (!authService.isAuthenticated || !user.value?.id) {
    unreadNotifCount.value = 0
    return
  }
  try {
    const list = await notificationRepository.getUserNotifications(user.value.id)
    unreadNotifCount.value = list.filter((n) => n.status === 0).length
  } catch {
    unreadNotifCount.value = 0
  }
}

const userImage = computed(() => resolveMediaUrl(user.value?.profileImage))

watch(userImage, () => {
  avatarImageFailed.value = false
})

const themeLabel = computed(() => t('nav.toggleTheme'))
const nextLocaleLabel = computed(() => t('nav.toggleLanguage'))

const toggleLocale = () => {
  setLocale(locale.value === 'en' ? 'ar' : 'en')
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const onClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (!target || !document.contains(target)) return

  if (userMenuOpen.value && userMenuRef.value && !userMenuRef.value.contains(target)) {
    closeUserMenu()
  }
  if (
    mobileMenuOpen.value &&
    mobileMenuRef.value &&
    !mobileMenuRef.value.contains(target) &&
    (!mobileMenuButtonRef.value || !mobileMenuButtonRef.value.contains(target))
  ) {
    closeMobileMenu()
  }
}

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (userMenuOpen.value && userMenuButtonRef.value) {
      userMenuButtonRef.value.focus()
    }
    if (mobileMenuOpen.value && mobileMenuButtonRef.value) {
      mobileMenuButtonRef.value.focus()
    }
    closeUserMenu()
    closeMobileMenu()
  }
}

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    closeMobileMenu()
    closeUserMenu()
  },
)

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onEscape)
  if (isAuthenticated.value) {
    void loadNotifCount()
  }
})

watch(
  () => [isAuthenticated.value, user.value?.id] as const,
  ([authed, id]) => {
    if (authed && id) {
      void loadNotifCount()
    } else {
      unreadNotifCount.value = 0
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onEscape)
})

const logout = () => {
  closeUserMenu()
  void authService.logout()
  void router.push('/')
}
</script>

<template>
  <header class="app-header">
    <div class="container app-header__inner">
      <RouterLink to="/" class="app-header__brand">
        <img src="/denta-logo.png" alt="DentZone" class="app-header__logo-img" />
        <span class="app-header__wordmark">Dent<span>Zone</span></span>
      </RouterLink>

      <nav class="app-header__nav" :aria-label="t('nav.navigation')">
        <RouterLink to="/" class="app-header__nav-link" exact-active-class="app-header__nav-link--active">
          <AppIcon name="home" :size="16" />
          {{ t('nav.home') }}
        </RouterLink>
        <RouterLink
          to="/products"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          <AppIcon name="box" :size="16" />
          {{ t('nav.allProducts') }}
        </RouterLink>
        <RouterLink
          to="/categories"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          <AppIcon name="store" :size="16" />
          {{ t('nav.categories') }}
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          to="/wishlist"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          <AppIcon name="heart" :size="16" />
          {{ t('nav.wishlist') }}
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          to="/orders"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          <AppIcon name="box" :size="16" />
          {{ t('nav.myOrders') }}
        </RouterLink>
      </nav>

      <form class="app-header__search" role="search" @submit.prevent="onHeaderSearch">
        <span class="app-header__search-icon"><AppIcon name="search" :size="15" /></span>
        <input
          v-model="headerSearch"
          type="search"
          class="app-header__search-input"
          :placeholder="t('nav.searchPlaceholder')"
          :aria-label="t('nav.searchPlaceholder')"
        />
      </form>

      <div class="app-header__actions">
        <button class="app-header__theme" type="button" :aria-label="nextLocaleLabel" @click="toggleLocale">
          <span class="app-header__lang-code">{{ locale === 'en' ? 'ع' : 'EN' }}</span>
        </button>
        <button class="app-header__theme" type="button" :aria-label="themeLabel" @click="toggleTheme">
          <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
        </button>

        <RouterLink
          v-if="isAuthenticated"
          to="/notifications"
          class="app-header__cart"
          :aria-label="unreadNotifCount > 0 ? `${t('notifications.title')} (${unreadNotifCount})` : t('notifications.title')"
        >
          <AppIcon name="bell" :size="17" />
          <span v-if="unreadNotifCount > 0" :key="unreadNotifCount" class="app-header__cart-badge">{{ unreadNotifCount }}</span>
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          to="/cart"
          class="app-header__cart"
          :aria-label="cartCount > 0 ? `${t('cart.title')} (${cartCount})` : t('cart.title')"
        >
          <AppIcon name="cart" :size="17" />
          <span v-if="cartCount > 0" :key="cartCount" class="app-header__cart-badge">{{ cartCount }}</span>
        </RouterLink>

        <RouterLink v-if="!isAuthenticated" to="/auth/login" class="app-header__login">
          <AppIcon name="user" :size="16" />
          <span class="app-header__login-text">{{ t('nav.login') }}</span>
        </RouterLink>

        <div v-else ref="userMenuRef" class="app-header__user">
          <button
            ref="userMenuButtonRef"
            type="button"
            class="app-header__avatar"
            :class="{ 'app-header__avatar--open': userMenuOpen }"
            :style="{ '--tint': user?.tint ?? '' }"
            :aria-label="t('nav.userMenu')"
            :aria-expanded="userMenuOpen"
            aria-haspopup="true"
            @click.stop="toggleUserMenu"
          >
            <img
              v-if="userImage && !avatarImageFailed"
              :src="userImage"
              alt=""
              class="app-header__avatar-img"
              @error="avatarImageFailed = true"
            />
            <AppIcon v-else name="user" :size="18" />
          </button>
          <div v-if="userMenuOpen" class="app-header__dropdown" @click.stop>
            <div class="app-header__dropdown-head">
              <span class="app-header__dropdown-avatar" :style="{ '--tint': user?.tint ?? '' }">
                <img
                  v-if="userImage && !avatarImageFailed"
                  :src="userImage"
                  alt=""
                  class="app-header__avatar-img"
                  @error="avatarImageFailed = true"
                />
                <AppIcon v-else name="user" :size="16" />
              </span>
              <div>
                <p class="app-header__dropdown-name">{{ user?.firstName }} {{ user?.lastName }}</p>
                <p class="app-header__dropdown-email">{{ user?.email }}</p>
              </div>
            </div>
            <RouterLink to="/profile" class="app-header__dropdown-link" @click="closeUserMenu">
              <AppIcon name="user" :size="16" />
              {{ t('profile.title') }}
            </RouterLink>
            <RouterLink to="/wishlist" class="app-header__dropdown-link" @click="closeUserMenu">
              <AppIcon name="heart" :size="16" />
              {{ t('nav.wishlist') }}
            </RouterLink>
            <RouterLink to="/orders" class="app-header__dropdown-link" @click="closeUserMenu">
              <AppIcon name="box" :size="16" />
              {{ t('nav.myOrders') }}
            </RouterLink>
            <RouterLink to="/notifications" class="app-header__dropdown-link" @click="closeUserMenu">
              <AppIcon name="bell" :size="16" />
              {{ t('nav.notifications') }}
            </RouterLink>

            <div class="app-header__dropdown-divider" />

            <button type="button" class="app-header__dropdown-link" @click="toggleLocale">
              <span class="app-header__dropdown-lang-icon">{{ locale === 'en' ? 'ع' : 'EN' }}</span>
              <span>{{ locale === 'en' ? 'العربية' : 'English' }}</span>
            </button>
            <button type="button" class="app-header__dropdown-link" @click="toggleTheme">
              <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
              <span>{{ theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode') }}</span>
            </button>

            <div class="app-header__dropdown-divider" />

            <button type="button" class="app-header__dropdown-link app-header__dropdown-link--danger" @click="logout">
              <AppIcon name="logout" :size="16" />
              {{ t('nav.logout') }}
            </button>
          </div>
        </div>

        <button
          ref="mobileMenuButtonRef"
          class="app-header__menu"
          type="button"
          :aria-label="mobileMenuOpen ? t('nav.closeMenu') : t('nav.toggleMenu')"
          :aria-expanded="mobileMenuOpen"
          aria-haspopup="true"
          aria-controls="mobile-menu"
          @click.stop="toggleMobileMenu"
        >
          <AppIcon :name="mobileMenuOpen ? 'close' : 'menu'" :size="18" />
        </button>
      </div>
    </div>

    <nav v-if="mobileMenuOpen" id="mobile-menu" ref="mobileMenuRef" class="app-header__panel" :aria-label="t('nav.navigation')">
      <div class="container app-header__panel-inner">
        <RouterLink to="/" class="app-header__panel-link" exact-active-class="app-header__nav-link--active" @click="closeMobileMenu">
          <AppIcon name="home" :size="17" />
          {{ t('nav.home') }}
        </RouterLink>
        <RouterLink
          to="/products"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="box" :size="17" />
          {{ t('nav.allProducts') }}
        </RouterLink>
        <RouterLink
          to="/categories"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="store" :size="17" />
          {{ t('nav.categories') }}
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          to="/wishlist"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="heart" :size="17" />
          {{ t('nav.wishlist') }}
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          to="/orders"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="box" :size="17" />
          {{ t('nav.myOrders') }}
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          to="/notifications"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="bell" :size="17" />
          {{ t('nav.notifications') }}
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          to="/cart"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="cart" :size="17" />
          {{ t('cart.title') }}
        </RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          to="/profile"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="user" :size="17" />
          {{ t('profile.title') }}
        </RouterLink>
        <RouterLink
          v-if="!isAuthenticated"
          to="/auth/login"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="user" :size="17" />
          {{ t('nav.login') }}
        </RouterLink>

        <div class="app-header__panel-divider" />

        <button type="button" class="app-header__panel-link" @click="toggleLocale">
          <span class="app-header__dropdown-lang-icon">{{ locale === 'en' ? 'ع' : 'EN' }}</span>
          <span>{{ locale === 'en' ? 'العربية' : 'English' }}</span>
        </button>
        <button type="button" class="app-header__panel-link" @click="toggleTheme">
          <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
          <span>{{ theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode') }}</span>
        </button>

        <template v-if="isAuthenticated">
          <div class="app-header__panel-divider" />
          <button type="button" class="app-header__panel-link app-header__panel-link--danger" @click="logout">
            <AppIcon name="logout" :size="17" />
            {{ t('nav.logout') }}
          </button>
        </template>
      </div>
    </nav>
  </header>
</template>


<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  height: var(--dz-header-height);
  background: var(--dz-header-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--dz-border);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 100%;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 1;
  min-width: 0;
  transition: opacity 0.15s ease;
}

.app-header__brand:hover {
  opacity: 0.92;
}

.app-header__logo-img {
  display: block;
  width: 3.35rem;
  height: 3.35rem;
  border-radius: var(--dz-radius-md);
  object-fit: contain;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.12);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.app-header__brand:hover .app-header__logo-img {
  transform: scale(1.05);
}

.app-header__wordmark {
  font-family: var(--dz-font-display);
  font-size: 1.52rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
  white-space: nowrap;
  min-width: 0;
}

.app-header__wordmark span {
  color: var(--dz-gold-strong);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
  min-width: 0;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.app-header__nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: var(--dz-radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  white-space: nowrap;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.app-header__nav-link:hover {
  background: var(--dz-surface-soft);
  color: var(--dz-primary-strong);
}

.app-header__nav-link--active {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
  font-weight: 700;
}

.app-header__search {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.38rem 0.85rem;
  background: var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  min-width: 140px;
  max-width: 220px;
  flex: 1 1 auto;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
}

.app-header__search:focus-within {
  border-color: var(--dz-primary);
  background: var(--dz-surface);
  box-shadow: var(--dz-ring);
}

.app-header__search-icon {
  display: flex;
  align-items: center;
  color: var(--dz-muted);
  flex-shrink: 0;
}

.app-header__search-input {
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--dz-ink);
  outline: none;
}

.app-header__search-input::placeholder {
  color: var(--dz-muted);
}

.app-header__theme {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.65rem;
  height: 2.65rem;
  flex-shrink: 0;
  box-sizing: border-box;
  border-radius: var(--dz-radius);
  color: var(--dz-ink-soft);
  background: var(--dz-surface-soft);
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.app-header__lang-code {
  font-family: var(--dz-font-display);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.app-header__theme:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-header__cart {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.65rem;
  height: 2.65rem;
  flex-shrink: 0;
  box-sizing: border-box;
  border-radius: var(--dz-radius);
  color: var(--dz-ink-soft);
  background: var(--dz-surface-soft);
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.app-header__cart:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-header__cart-badge {
  position: absolute;
  top: -0.3rem;
  inset-inline-end: -0.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding-inline: 0.3rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger);
  color: var(--dz-white);
  font-size: 0.68rem;
  font-weight: 700;
  box-shadow: 0 0 0 2px var(--dz-header-bg);
  animation: app-header-badge-pop 0.3s ease;
}

@keyframes app-header-badge-pop {
  0% {
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

.app-header__login {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 2.65rem;
  padding: 0 1rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-primary);
  background: var(--dz-surface);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  white-space: nowrap;
  flex-shrink: 0;
  box-sizing: border-box;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.app-header__login:hover {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
}

.app-header__user {
  position: relative;
  flex-shrink: 0;
}

.app-header__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.65rem;
  height: 2.65rem;
  flex-shrink: 0;
  box-sizing: border-box;
  border-radius: var(--dz-radius-full);
  background: color-mix(in srgb, var(--tint) 16%, var(--dz-surface-soft));
  border: 1px solid color-mix(in srgb, var(--tint) 26%, var(--dz-border));
  color: color-mix(in srgb, var(--tint) 80%, var(--dz-ink));
  font-family: var(--dz-font-display);
  font-size: 0.85rem;
  font-weight: 700;
  transition:
    transform 0.15s,
    border-color 0.2s,
    background-color 0.2s;
}

.app-header__avatar:hover,
.app-header__avatar--open {
  border-color: var(--dz-primary);
  background: color-mix(in srgb, var(--tint) 22%, var(--dz-surface-soft));
}

.app-header__avatar-img {
  width: 100%;
  height: 100%;
  border-radius: var(--dz-radius-full);
  object-fit: cover;
}

.app-header__dropdown {
  position: absolute;
  top: calc(100% + 0.6rem);
  inset-inline-end: 0;
  width: 250px;
  max-width: calc(100vw - 1.5rem);
  box-sizing: border-box;
  padding: 0.6rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow);
  z-index: 60;
}

.app-header__dropdown-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.6rem 0.85rem;
  border-bottom: 1px solid var(--dz-border);
  margin-bottom: 0.45rem;
}

.app-header__dropdown-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: color-mix(in srgb, var(--tint) 16%, var(--dz-surface-soft));
  border: 1px solid color-mix(in srgb, var(--tint) 26%, var(--dz-border));
  color: color-mix(in srgb, var(--tint) 80%, var(--dz-ink));
  font-family: var(--dz-font-display);
  font-size: 0.75rem;
  font-weight: 700;
}

.app-header__dropdown-name {
  font-size: 0.9rem;
  font-weight: 700;
}

.app-header__dropdown-email {
  font-size: 0.75rem;
  color: var(--dz-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__dropdown-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.7rem;
  border-radius: var(--dz-radius);
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  text-align: start;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.app-header__dropdown-link:hover {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.app-header__dropdown-link--danger {
  color: var(--dz-danger);
}

.app-header__dropdown-link--danger:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.app-header__dropdown-divider {
  height: 1px;
  background: var(--dz-border);
  margin: 0.35rem 0.2rem;
}

.app-header__panel-divider {
  height: 1px;
  background: var(--dz-border);
  margin: 0.5rem 0.5rem;
}

.app-header__dropdown-lang-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-surface-soft);
  color: var(--dz-primary-strong);
  font-family: var(--dz-font-display);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
}

.app-header__menu {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.65rem;
  height: 2.65rem;
  flex-shrink: 0;
  box-sizing: border-box;
  border-radius: var(--dz-radius);
  color: var(--dz-ink-soft);
  background: var(--dz-surface-soft);
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.app-header__menu:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-header__panel {
  position: absolute;
  top: 100%;
  inset-inline: 0;
  width: 100%;
  max-height: calc(100dvh - var(--dz-header-height));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  background: var(--dz-header-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow);
  animation: header-panel-in 0.22s ease;
}

.app-header__panel-inner {
  display: flex;
  flex-direction: column;
  padding-block: 0.75rem 1rem;
  width: 100%;
  box-sizing: border-box;
}

.app-header__panel-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  margin-inline: 0;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--dz-radius);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  text-align: start;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.app-header__panel-link:hover {
  background: var(--dz-surface-soft);
  color: var(--dz-primary-strong);
}

.app-header__panel-link--active {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
  font-weight: 700;
}

.app-header__panel-link--danger {
  color: var(--dz-danger);
}

.app-header__panel-link--danger:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

@keyframes header-panel-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* ── Tablets (≤ 900px): collapse nav to panel, search stays in topbar ─ */
@media (max-width: 900px) {
  .app-header__search {
    display: flex;
    min-width: 0;
    max-width: none;
    padding: 0.35rem 0.75rem;
  }

  .app-header__nav {
    display: none;
  }

  .app-header__menu {
    display: flex;
  }
}

/* ── Mobile (≤ 768px): clean topbar, hide redundant switches ──────── */
@media (max-width: 768px) {
  .app-header__inner {
    gap: 0.5rem;
  }

  .app-header__actions {
    gap: 0.35rem;
  }

  /* Lang and theme toggles are in the mobile panel drawer */
  .app-header__actions .app-header__theme {
    display: none;
  }

  .app-header__login-text {
    display: none;
  }

  .app-header__login {
    width: 2.35rem;
    height: 2.35rem;
    padding: 0;
    border-radius: var(--dz-radius);
    justify-content: center;
  }

  .app-header__cart,
  .app-header__menu,
  .app-header__avatar {
    width: 2.35rem;
    height: 2.35rem;
  }

  .app-header__brand {
    gap: 0.55rem;
  }

  .app-header__logo-img {
    width: 2.85rem;
    height: 2.85rem;
  }

  .app-header__wordmark {
    font-size: 1.35rem;
  }

  .app-header__dropdown {
    width: min(260px, calc(100vw - 1.5rem));
  }
}

/* ── Small phones (≤ 480px) ───────────────────────────────────────── */
@media (max-width: 480px) {
  .app-header__inner {
    gap: 0.45rem;
  }

  .app-header__actions {
    gap: 0.25rem;
  }

  .app-header__cart,
  .app-header__menu,
  .app-header__avatar,
  .app-header__login {
    width: 2.15rem;
    height: 2.15rem;
  }

  .app-header__brand {
    gap: 0.45rem;
  }

  .app-header__logo-img {
    width: 2.5rem;
    height: 2.5rem;
  }

  .app-header__wordmark {
    display: none;
  }

  .app-header__cart-badge {
    font-size: 0.62rem;
    min-width: 1.05rem;
    height: 1.05rem;
    top: -0.25rem;
    inset-inline-end: -0.25rem;
  }
}

/* ── Extra-small phones / Redmi (≤ 360px) ─────────────────────────── */
@media (max-width: 360px) {
  .app-header__inner {
    gap: 0.35rem;
  }

  .app-header__actions {
    gap: 0.2rem;
  }

  .app-header__brand {
    gap: 0.35rem;
  }

  .app-header__logo-img {
    width: 2.2rem;
    height: 2.2rem;
  }

  .app-header__cart,
  .app-header__menu,
  .app-header__avatar,
  .app-header__login {
    width: 1.95rem;
    height: 1.95rem;
  }

  .app-header__dropdown {
    width: calc(100vw - 1rem);
    inset-inline-end: -0.25rem;
  }
}
</style>