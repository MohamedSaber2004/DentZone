<script setup lang="ts">
import { services } from '../../di/container'
import { computed, onMounted, onUnmounted, ref } from 'vue'
const { authService } = services
import { useRouter } from 'vue-router'
import { t, locale, setLocale } from '../../i18n'
import { theme, toggleTheme } from '../../application/theme.service'
import AppIcon from '../ui/AppIcon.vue'

const router = useRouter()
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const mobileMenuRef = ref<HTMLElement | null>(null)
const mobileMenuButtonRef = ref<HTMLElement | null>(null)

const isAuthenticated = computed(() => authService.isAuthenticated)
const user = computed(() => authService.user.value)

const userInitials = computed(() => {
  const u = user.value
  if (!u) return 'DZ'
  return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase()
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
  if (userMenuRef.value && !userMenuRef.value.contains(target)) closeUserMenu()
  if (
    mobileMenuRef.value &&
    mobileMenuButtonRef.value &&
    !mobileMenuRef.value.contains(target) &&
    !mobileMenuButtonRef.value.contains(target)
  ) {
    closeMobileMenu()
  }
}

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeUserMenu()
    closeMobileMenu()
  }
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

      <nav class="app-header__nav" aria-label="Main">
        <RouterLink to="/" class="app-header__nav-link" exact-active-class="app-header__nav-link--active">
          <AppIcon name="home" :size="16" />
          {{ t('nav.home') }}
        </RouterLink>
        <RouterLink
          to="/categories"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          <AppIcon name="box" :size="16" />
          {{ t('nav.categories') }}
        </RouterLink>
        <RouterLink
          to="/privacy-policy"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          <AppIcon name="shield-check" :size="16" />
          {{ t('nav.privacyPolicy') }}
        </RouterLink>
      </nav>

      <div class="app-header__actions">
        <button class="app-header__theme" type="button" :aria-label="nextLocaleLabel" @click="toggleLocale">
          <span class="app-header__lang-code">{{ locale === 'en' ? 'ع' : 'EN' }}</span>
        </button>
        <button class="app-header__theme" type="button" :aria-label="themeLabel" @click="toggleTheme">
          <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
        </button>

        <button
          ref="mobileMenuButtonRef"
          class="app-header__menu"
          type="button"
          :aria-label="mobileMenuOpen ? t('nav.closeMenu') : t('nav.toggleMenu')"
          :aria-expanded="mobileMenuOpen"
          @click="toggleMobileMenu"
        >
          <AppIcon :name="mobileMenuOpen ? 'close' : 'menu'" :size="18" />
        </button>

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
              {{ t('profile.title') }}
            </RouterLink>
            <button type="button" class="app-header__dropdown-link app-header__dropdown-link--danger" @click="logout">
              <AppIcon name="logout" :size="16" />
              {{ t('nav.logout') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <nav v-if="mobileMenuOpen" ref="mobileMenuRef" class="app-header__panel" aria-label="Mobile">
      <div class="container app-header__panel-inner">
        <RouterLink to="/" class="app-header__panel-link" exact-active-class="app-header__nav-link--active" @click="closeMobileMenu">
          <AppIcon name="home" :size="17" />
          {{ t('nav.home') }}
        </RouterLink>
        <RouterLink
          to="/categories"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="box" :size="17" />
          {{ t('nav.categories') }}
        </RouterLink>
        <RouterLink
          to="/privacy-policy"
          class="app-header__panel-link"
          active-class="app-header__nav-link--active"
          @click="closeMobileMenu"
        >
          <AppIcon name="shield-check" :size="17" />
          {{ t('nav.privacyPolicy') }}
        </RouterLink>
      </div>
    </nav>
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

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.app-header__dropdown-link--danger {
  color: var(--dz-danger);
}

.app-header__dropdown-link--danger:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.app-header__menu {
  display: none;
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

.app-header__menu:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-header__panel {
  position: absolute;
  top: 100%;
  inset-inline: 0;
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
  padding-block: 0.6rem 0.9rem;
}

.app-header__panel-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.8rem 0.9rem;
  margin-inline: -0.5rem;
  border-radius: var(--dz-radius-lg);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
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

@media (max-width: 760px) {
  .app-header__inner {
    gap: 0.85rem;
  }

  .app-header__actions {
    gap: 0.4rem;
  }

  .app-header__nav {
    display: none;
  }

  .app-header__menu {
    display: flex;
  }

  .app-header__login-text {
    display: none;
  }

  .app-header__login {
    width: 2.45rem;
    padding: 0;
    justify-content: center;
  }

  .app-header__dropdown {
    width: min(250px, calc(100vw - 2rem));
  }
}

@media (max-width: 400px) {
  .app-header__brand {
    gap: 0.5rem;
  }

  .app-header__wordmark {
    font-size: 1.05rem;
  }

  .app-header__logo {
    width: 2.1rem;
    height: 2.1rem;
  }

  .app-header__theme,
  .app-header__menu {
    width: 2.4rem;
    height: 2.4rem;
  }

  .app-header__avatar {
    width: 2.4rem;
    height: 2.4rem;
  }
}
</style>