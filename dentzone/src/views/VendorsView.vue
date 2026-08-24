<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { t, locale } from '../i18n'
import { API_LANG } from '../config/api.config'
import { resolveMediaUrl } from '../utils/media'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AppPagination from '../components/ui/AppPagination.vue'
import type { HomeProviderDto } from '../domain/models/home'

const router = useRouter()
const { homeRepository } = services

const providers = ref<HomeProviderDto[]>([])
const loading = ref(true)
const error = ref(false)

/* --- Local search + pagination (20 per page) --- */
const PAGE_SIZE = 20
const search = ref('')
const page = ref(1)

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

const filteredProviders = computed(() => {
  const q = normalizeText(search.value)
  if (!q) return providers.value
  return providers.value.filter((provider) => {
    const fields = [provider.fullName, provider.userName, provider.email]
      .filter(Boolean)
      .map((f) => normalizeText(String(f)))
    return fields.some((f) => f.includes(q))
  })
})

const pagedProviders = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredProviders.value.slice(start, start + PAGE_SIZE)
})

watch(search, () => {
  page.value = 1
})

const hasQuery = computed(() => search.value.trim().length > 0)

const clearSearch = () => {
  search.value = ''
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

const failedImages = ref<Set<string>>(new Set())

import { inventoryRoute } from '../utils/route-crypto'

const linkTo = (provider: HomeProviderDto) =>
  inventoryRoute(provider.id, { supplier: provider.fullName })

const load = async () => {
  loading.value = true
  error.value = false
  try {
    const lang = locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH
    const all = await homeRepository.getAllProviders(lang)
    providers.value = all
    page.value = 1
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
watch(locale, () => {
  void load()
})
</script>

<template>
  <div class="container page">
    <button type="button" class="page__back" @click="router.back()">
      <AppIcon name="arrow-left" :size="15" />
      {{ t('common.back') }}
    </button>

    <div class="page__head">
      <div>
        <h1 class="page__title">{{ t('home.shopByVendor') }}</h1>
        <p class="page__subtitle">{{ t('home.vendorSubtitle') }}</p>
      </div>
      <span v-if="!loading && !error && providers.length" class="page__count">
        {{ t('categories.inventoriesCount', { count: hasQuery ? filteredProviders.length : providers.length }) }}
      </span>
    </div>

    <form v-if="!loading && !error && providers.length > 0" class="page__search" role="search" @submit.prevent>
      <span class="page__search-icon">
        <AppIcon name="search" :size="17" />
      </span>
      <input
        v-model="search"
        class="page__search-input"
        type="search"
        :placeholder="t('products.searchPlaceholder')"
        :aria-label="t('products.searchPlaceholder')"
      />
      <button
        v-if="search.trim()"
        type="button"
        class="page__search-clear"
        :aria-label="t('products.clearSearch')"
        @click="clearSearch"
      >
        <AppIcon name="close" :size="14" />
      </button>
    </form>

    <div v-if="loading" class="vendors__grid" role="status" :aria-label="t('common.loading')">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <span class="skeleton skeleton-card__avatar" />
        <div class="skeleton-card__lines">
          <span class="skeleton skeleton-card__line skeleton-card__line--wide" />
          <span class="skeleton skeleton-card__line" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="page__state" role="alert">
      <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
      <h2 class="page__state-title">{{ t('categories.errorTitle') }}</h2>
      <p class="page__state-desc">{{ t('categories.errorDescription') }}</p>
      <AppButton variant="primary" @click="load">
        <AppIcon name="refresh" :size="15" />
        {{ t('categories.retry') }}
      </AppButton>
    </div>

    <div v-else-if="providers.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="store" :size="30" /></span>
      <h2 class="page__state-title">{{ t('categories.emptyTitle') }}</h2>
      <p class="page__state-desc">{{ t('categories.emptyDescription') }}</p>
    </div>

    <div v-else-if="filteredProviders.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="search" :size="30" /></span>
      <h2 class="page__state-title">{{ t('products.noResultsTitle', { query: search.trim() }) }}</h2>
      <p class="page__state-desc">{{ t('home.vendorSubtitle') }}</p>
      <AppButton variant="secondary" size="sm" @click="clearSearch">
        <AppIcon name="close" :size="13" />
        {{ t('products.clearSearch') }}
      </AppButton>
    </div>

    <template v-else>
      <div class="vendors__grid">
        <RouterLink v-for="provider in pagedProviders" :key="provider.id" :to="linkTo(provider)" class="vendor-card">
          <span class="vendor-card__avatar">
            <img
              v-if="provider.profileImage && !failedImages.has(provider.id)"
              :src="resolveMediaUrl(provider.profileImage)"
              :alt="provider.fullName"
              loading="lazy"
              @error="failedImages.add(provider.id)"
            />
            <template v-else>{{ initials(provider.fullName) || '—' }}</template>
          </span>
          <span class="vendor-card__meta">
            <strong class="vendor-card__name">{{ provider.fullName }}</strong>
            <span
              class="vendor-card__status"
              :class="provider.isAvailableNow ? 'vendor-card__status--on' : 'vendor-card__status--off'"
            >
              <span class="vendor-card__dot" aria-hidden="true" />
              {{ t(provider.isAvailableNow ? 'categories.available' : 'categories.notAvailable') }}
            </span>
          </span>
          <span class="vendor-card__arrow">
            <AppIcon name="chevron-right" :size="16" />
          </span>
        </RouterLink>
      </div>

      <AppPagination
        v-model="page"
        :total-items="filteredProviders.length"
        :page-size="PAGE_SIZE"
      />
    </template>
  </div>
</template>

<style scoped>
.page {
  padding-block: 2rem 4rem;
}

.page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.page__back:hover {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

html[dir='rtl'] .page__back svg {
  transform: scaleX(-1);
}

.page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.page__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.6rem, 3.5vw, 2.1rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.page__subtitle {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.page__count {
  flex-shrink: 0;
  padding: 0.35rem 0.9rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.8rem;
  font-weight: 700;
}

.page__search {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 1.5rem;
  padding: 0.6rem 0.9rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.page__search:focus-within {
  border-color: var(--dz-primary);
  box-shadow: var(--dz-ring);
}

.page__search-icon {
  display: flex;
  align-items: center;
  color: var(--dz-muted);
}

.page__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: var(--dz-ink);
  outline: none;
}

.page__search-input::placeholder {
  color: var(--dz-muted);
}

.page__search-input::-webkit-search-cancel-button {
  display: none;
}

.page__search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.page__search-clear:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.vendors__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.85rem;
}

.vendor-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.05rem 1.15rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  text-decoration: none;
  color: inherit;
  min-width: 0;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.vendor-card:hover {
  transform: translateY(-2px);
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow);
}

.vendor-card:focus-visible {
  outline: none;
  box-shadow: var(--dz-ring);
}

.vendor-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  overflow: hidden;
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-family: var(--dz-font-display);
  font-size: 0.95rem;
  font-weight: 700;
}

.vendor-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vendor-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  flex: 1;
}

.vendor-card__name {
  font-family: var(--dz-font-display);
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--dz-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vendor-card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  font-weight: 600;
}

.vendor-card__status--on {
  color: var(--dz-success);
}

.vendor-card__status--off {
  color: var(--dz-muted);
}

.vendor-card__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--dz-radius-full);
  background: currentColor;
}

.vendor-card__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
}

html[dir='rtl'] .vendor-card__arrow svg {
  transform: scaleX(-1);
}

.page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 4rem 1rem;
  text-align: center;
}

.page__state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.4rem;
}

.page__state-title {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 600;
}

.page__state-desc {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 34ch;
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  padding: 1.1rem 1.2rem;
}

.skeleton {
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-card__avatar {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
}

.skeleton-card__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-card__line {
  height: 0.8rem;
  width: 40%;
}

.skeleton-card__line--wide {
  width: 70%;
  height: 1rem;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}

@media (max-width: 600px) {
  .page {
    padding-block: 1.5rem 3.5rem;
  }

  .page__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.65rem;
    margin-bottom: 1.25rem;
  }

  .vendors__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
