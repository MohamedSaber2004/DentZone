<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref } from 'vue'
import { t, locale } from '../i18n'
import { API_LANG } from '../config/api.config'
import { categoryRoute } from '../utils/route-crypto'
import CategoryCard from '../components/categories/CategoryCard.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import type { CategoryDto } from '../domain/models/category'

const { categoryRepository } = services

const categories = ref<CategoryDto[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref('')

const lang = computed(() => (locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH))

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

const filteredCategories = computed(() => {
  const q = normalizeSearchText(search.value)
  if (!q) return categories.value
  return categories.value.filter((c) => {
    const name = normalizeSearchText(c.name || '')
    const arName = normalizeSearchText(c.arabicName || '')
    return name.includes(q) || arName.includes(q)
  })
})

const load = async () => {
  loading.value = true
  error.value = false
  try {
    categories.value = await categoryRepository.getCategories(lang.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="container page">
    <div class="page__head">
      <div>
        <h1 class="page__title">{{ t('categories.title') }}</h1>
        <p class="page__subtitle">{{ t('categories.subtitle') }}</p>
      </div>
      <span v-if="!loading && !error && filteredCategories.length" class="page__count">
        {{ t('categories.count', { count: filteredCategories.length }) }}
      </span>
    </div>

    <form v-if="!loading && !error && categories.length > 0" class="page__search" role="search" @submit.prevent>
      <span class="page__search-icon">
        <AppIcon name="search" :size="17" />
      </span>
      <input
        v-model="search"
        class="page__search-input"
        type="search"
        :placeholder="t('nav.searchPlaceholder')"
        :aria-label="t('nav.searchPlaceholder')"
      />
      <button v-if="search.trim()" type="button" class="page__search-clear" :aria-label="t('products.clearSearch')" @click="search = ''">
        <AppIcon name="close" :size="15" />
      </button>
    </form>

    <div v-if="loading" class="page__grid" role="status" :aria-label="t('common.loading')">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <span class="skeleton skeleton-card__media" />
        <span class="skeleton skeleton-card__line skeleton-card__line--wide" />
        <span class="skeleton skeleton-card__line" />
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

    <div v-else-if="categories.length === 0 || filteredCategories.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="box" :size="30" /></span>
      <h2 class="page__state-title">{{ t('categories.emptyTitle') }}</h2>
      <p class="page__state-desc">{{ t('categories.emptyDescription') }}</p>
      <AppButton v-if="search.trim()" variant="secondary" @click="search = ''">
        {{ t('products.clearSearch') }}
      </AppButton>
    </div>

    <div v-else class="page__grid">
      <CategoryCard
        v-for="category in filteredCategories"
        :key="category.id"
        :category="category"
        :to="categoryRoute(category.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding-block: 2.5rem 4rem;
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
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  padding: 0.45rem 0.85rem;
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
  border: none;
  background: transparent;
  font-size: 0.92rem;
  color: var(--dz-ink);
  outline: none;
}

.page__search-input::placeholder {
  color: var(--dz-muted);
}

.page__search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.page__search-clear:hover {
  background: var(--dz-border);
  color: var(--dz-ink);
}

.page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
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

.page__state .app-button {
  margin-top: 0.8rem;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  padding-bottom: 1.1rem;
  overflow: hidden;
}

.skeleton {
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-card__media {
  aspect-ratio: 4 / 3;
  width: 100%;
  border-radius: 0;
}

.skeleton-card__line {
  height: 0.8rem;
  width: 60%;
  margin-inline: 1.1rem;
}

.skeleton-card__line--wide {
  width: 85%;
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

@media (max-width: 768px) {
  .page__grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 600px) {
  .page {
    padding-block: 1.75rem 3.5rem;
  }

  .page__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.65rem;
    margin-bottom: 1.25rem;
  }

  .page__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 360px) {
  .page__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>