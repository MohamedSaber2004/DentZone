<script setup lang="ts">
import { services } from '../../di/container'
import { computed, onMounted, onUnmounted, ref } from 'vue'
const { cartService, wishlistService, authService } = services
import { useRoute, useRouter } from 'vue-router'
import { t, toggleLocale } from '../../i18n'
import { theme, toggleTheme } from '../../application/theme.service'
import SearchField from '../ui/SearchField.vue'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  query?: string
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  submit: []
}>()

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const isAuthenticated = computed(() => authService.isAuthenticated)
const user = computed(() => authService.user.value)

const userInitials = computed(() => {
  const u = user.value
  if (!u) return 'DZ'
  return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase()
})

const navItems = computed(() => [
  { label: t('nav.home'), to: '/' },
  { label: t('nav.shop'), to: '/catalog' },
  { label: t('nav.whitening'), to: '/catalog?category=whitening' },
  { label: t('nav.brushes'), to: '/catalog?category=toothbrushes' },
])

const searchPlaceholder = computed(() => t('nav.searchPlaceholder'))
const switchLangLabel = computed(() => t('nav.switchLang'))
const themeLabel = computed(() => t('nav.toggleTheme'))

const isNavActive = (to: string) => {
  const [path, queryString] = to.split('?')
  if (route.path !== path) return false
  const targetQuery = new URLSearchParams(queryString ?? '')
  const entries = Array.from(targetQuery.entries())
  if (entries.length === 0) {
    return route.query.category == null
  }
  return entries.every(([key, value]) => String(route.query[key] ?? '') === value)
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const onClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    closeUserMenu()
  }
}

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeUserMenu()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onEscape)
})

const logout = () => {
  closeUserMenu()
  void authService.logout()
  void router.push('/')
}

const ordersLink = () => {
  closeUserMenu()
  void router.push('/orders')
}
</script>

<template>
  <header class="app-header">
    <div class="container app-header__inner">
      <RouterLink to="/" class="app-header__brand">
        <span class="app-header__logo">
          <AppIcon name="tooth" :size="22" />
        </span>
        <span class="app-header__wordmark">Dent<span>Zone</span></span>
      </RouterLink>

      <nav class="app-header__nav" :class="{ 'app-header__nav--open': menuOpen }" aria-label="Main navigation">
        <div class="app-header__nav-search">
          <SearchField
            class="app-header__search"
            :model-value="props.query ?? ''"
            :placeholder="searchPlaceholder"
            @update:model-value="emit('update:query', $event)"
            @submit="emit('submit')"
          />
        </div>
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="app-header__link"
          :class="{ 'app-header__link--active': isNavActive(item.to) }"
          :aria-current="isNavActive(item.to) ? 'page' : undefined"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="app-header__actions">
        <SearchField
          class="app-header__search"
          :model-value="props.query ?? ''"
          :placeholder="searchPlaceholder"
          @update:model-value="emit('update:query', $event)"
          @submit="emit('submit')"
        />
        <button class="app-header__lang" type="button" :aria-label="switchLangLabel" @click="toggleLocale">
          <AppIcon name="globe" :size="16" />
          <span class="app-header__lang-text">{{ switchLangLabel }}</span>
        </button>
        <button class="app-header__theme" type="button" :aria-label="themeLabel" @click="toggleTheme">
          <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
        </button>
        <RouterLink v-if="isAuthenticated" to="/wishlist" class="app-header__wishlist" :aria-label="t('nav.wishlist')">
          <AppIcon name="heart" :size="18" />
          <span v-if="wishlistService.count.value > 0" class="app-header__cart-count">
            {{ wishlistService.count.value > 99 ? '99+' : wishlistService.count.value }}
          </span>
        </RouterLink>
        <RouterLink to="/cart" class="app-header__cart" :aria-label="t('nav.cart')">
          <AppIcon name="cart" :size="20" />
          <span v-if="cartService.itemCount.value > 0" class="app-header__cart-count">
            {{ cartService.itemCount.value > 99 ? '99+' : cartService.itemCount.value }}
          </span>
        </RouterLink>

        <RouterLink v-if="!isAuthenticated" to="/auth/login" class="app-header__login">
          <AppIcon name="user" :size="16" />
          <span class="app-header__login-text">{{ t('nav.login') }}</span>
        </RouterLink>

        <div v-else ref="userMenuRef" class="app-header__user">
          <button
            type="button"
            class="app-header__avatar"
            :class="{ 'app-header__avatar--open': userMenuOpen }"
            :style="{ '--tint': user?.tint ?? '' }"
            :aria-label="t('profile.title')"
            :aria-expanded="userMenuOpen"
            @click="toggleUserMenu"
          >
            {{ userInitials }}
          </button>
          <div v-if="userMenuOpen" class="app-header__dropdown">
            <div class="app-header__dropdown-head">
              <span class="app-header__dropdown-avatar" :style="{ '--tint': user?.tint ?? '' }">
                {{ userInitials }}
              </span>
              <div>
                <p class="app-header__dropdown-name">{{ user?.firstName }} {{ user?.lastName }}</p>
                <p class="app-header__dropdown-email">{{ user?.email }}</p>
              </div>
            </div>
            <RouterLink to="/profile" class="app-header__dropdown-link" @click="closeUserMenu">
              <AppIcon name="user" :size="16" />
              {{ t('nav.profile') }}
            </RouterLink>
            <RouterLink to="/wishlist" class="app-header__dropdown-link" @click="closeUserMenu">
              <AppIcon name="heart" :size="16" />
              {{ t('nav.wishlist') }}
            </RouterLink>
            <button type="button" class="app-header__dropdown-link" @click="ordersLink">
              <AppIcon name="box" :size="16" />
              {{ t('nav.myOrders') }}
            </button>
            <div class="app-header__dropdown-sep" role="separator"></div>
            <button type="button" class="app-header__dropdown-link app-header__dropdown-link--danger" @click="logout">
              <AppIcon name="logout" :size="16" />
              {{ t('nav.logout') }}
            </button>
          </div>
        </div>

        <button class="app-header__menu" type="button" :aria-label="t('nav.toggleMenu')" @click="toggleMenu">
          <AppIcon name="menu" :size="24" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
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
  gap: 1.25rem;
  height: 100%;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.app-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: var(--dz-radius);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-primary);
}

.app-header__wordmark {
  font-family: var(--dz-font-display);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.app-header__wordmark span {
  color: var(--dz-gold-strong);
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.app-header__nav-search {
  display: none;
}

.app-header__search {
  width: 230px;
}

.app-header__link {
  padding: 0.5rem 0.9rem;
  border-radius: var(--dz-radius-full);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  transition:
    color 0.2s,
    background-color 0.2s;
}

.app-header__link:hover {
  color: var(--dz-primary-strong);
  background: var(--dz-primary-faint);
}

.app-header__link--active {
  color: var(--dz-primary-strong);
  background: var(--dz-primary-soft);
  font-weight: 700;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.app-header__cart,
.app-header__wishlist {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.7rem;
  height: 2.7rem;
  border-radius: var(--dz-radius);
  color: var(--dz-ink-soft);
  background: var(--dz-surface-soft);
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.app-header__cart:hover,
.app-header__wishlist:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-header__cart-count {
  position: absolute;
  top: -5px;
  inset-inline-end: -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.28rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-gold);
  color: var(--dz-on-gold);
  font-family: var(--dz-font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  box-shadow: var(--dz-shadow-sm);
}

.app-header__lang {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.app-header__lang:hover {
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
  background: var(--dz-primary-faint);
}

.app-header__lang svg {
  color: var(--dz-primary);
}

.app-header__theme {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.7rem;
  height: 2.7rem;
  border-radius: var(--dz-radius);
  color: var(--dz-ink-soft);
  background: var(--dz-surface-soft);
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.app-header__theme:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-header__login {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-primary);
  background: var(--dz-surface);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  white-space: nowrap;
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
}

.app-header__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.7rem;
  height: 2.7rem;
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

.app-header__dropdown {
  position: absolute;
  top: calc(100% + 0.6rem);
  inset-inline-end: 0;
  width: 250px;
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

.app-header__dropdown-link svg {
  color: var(--dz-primary);
  flex-shrink: 0;
}

.app-header__dropdown-link--danger {
  color: var(--dz-danger);
}

.app-header__dropdown-link--danger:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.app-header__dropdown-link--danger svg {
  color: var(--dz-danger);
}

.app-header__dropdown-sep {
  height: 1px;
  background: var(--dz-border);
  margin: 0.3rem 0.4rem;
}

.app-header__menu {
  display: none;
  color: var(--dz-ink-soft);
}

@media (max-width: 900px) {
  .app-header__search {
    display: none;
  }

  .app-header__nav-search {
    display: block;
    margin-bottom: 0.5rem;
  }

  .app-header__nav-search .app-header__search {
    display: block;
    width: 100%;
  }

  .app-header__menu {
    display: flex;
  }

  .app-header__nav {
    position: absolute;
    top: var(--dz-header-height);
    inset-inline: 0;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    padding: 1rem var(--dz-gutter);
    background: var(--dz-surface);
    border-bottom: 1px solid var(--dz-border);
    box-shadow: var(--dz-shadow);
  }

  .app-header__nav--open {
    display: flex;
  }

  .app-header__link {
    padding: 0.7rem 1rem;
  }
}

@media (max-width: 560px) {
  .app-header__lang-text {
    display: none;
  }

  .app-header__login-text {
    display: none;
  }

  .app-header__login {
    width: 2.7rem;
    padding: 0;
    justify-content: center;
  }

  .app-header__lang {
    width: 2.7rem;
    padding: 0;
    justify-content: center;
  }

  .app-header__wordmark {
    font-size: 1.15rem;
  }
}
</style>