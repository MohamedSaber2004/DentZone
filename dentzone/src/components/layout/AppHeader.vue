<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { cartService } from '../../application/cart.service'
import { wishlistService } from '../../application/wishlist.service'
import { t, toggleLocale } from '../../i18n'
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
const menuOpen = ref(false)

const navItems = computed(() => [
  { label: t('nav.home'), to: '/' },
  { label: t('nav.shop'), to: '/catalog' },
  { label: t('nav.whitening'), to: '/catalog?category=cat-whitening' },
  { label: t('nav.brushes'), to: '/catalog?category=cat-toothbrushes' },
])

const searchPlaceholder = computed(() => t('nav.searchPlaceholder'))
const switchLangLabel = computed(() => t('nav.switchLang'))

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
          {{ switchLangLabel }}
        </button>
        <RouterLink to="/wishlist" class="app-header__wishlist" :aria-label="t('nav.wishlist')">
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
  background: rgb(255 255 255 / 0.92);
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
  gap: 0.6rem;
  flex-shrink: 0;
}

.app-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: var(--dz-radius);
  background: var(--dz-gradient);
  color: var(--dz-white);
  box-shadow: var(--dz-shadow-primary);
}

.app-header__wordmark {
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.app-header__wordmark span {
  color: var(--dz-primary);
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  gap: 0.6rem;
}

.app-header__search {
  width: 230px;
}

.app-header__cart {
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

.app-header__wishlist:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
  transform: translateY(-1px);
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
  font-weight: 700;
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

.app-header__cart:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-header__cart-count {
  position: absolute;
  top: -5px;
  right: -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.28rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-gradient);
  color: var(--dz-white);
  font-size: 0.66rem;
  font-weight: 700;
  box-shadow: var(--dz-shadow-sm);
}

.app-header__menu {
  display: none;
  color: var(--dz-ink-soft);
}

@media (max-width: 900px) {
  .app-header__search {
    display: none;
  }

  .app-header__menu {
    display: flex;
  }

  .app-header__nav {
    position: absolute;
    top: var(--dz-header-height);
    left: 0;
    right: 0;
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
</style>