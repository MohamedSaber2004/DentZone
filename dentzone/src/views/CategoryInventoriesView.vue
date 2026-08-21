<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n'
import InventoryCard from '../components/categories/InventoryCard.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import type { InventoryDto } from '../domain/models/category'

const route = useRoute()
const router = useRouter()
const { categoryRepository } = services

const catId = () => (typeof route.params.catId === 'string' ? route.params.catId : '')
const categoryName = () => (typeof route.query.name === 'string' ? route.query.name : '')

const inventories = ref<InventoryDto[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref('')
const availabilityFilter = ref<'all' | 'available' | 'unavailable'>('all')

const hasActiveFilter = computed(
  () => search.value.trim().length > 0 || availabilityFilter.value !== 'all',
)

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

const filteredInventories = computed(() => {
  let list = inventories.value

  if (availabilityFilter.value === 'available') {
    list = list.filter((inv) => inv.isAvailableNow)
  } else if (availabilityFilter.value === 'unavailable') {
    list = list.filter((inv) => !inv.isAvailableNow)
  }

  const q = normalizeText(search.value)
  if (q) {
    list = list.filter((inv) => {
      const fields = [
        inv.fullName,
        inv.addresses,
        inv.email,
        inv.phoneNumber,
      ]
        .filter(Boolean)
        .map((f) => normalizeText(String(f)))

      return fields.some((f) => f.includes(q))
    })
  }

  return list
})

const clearFilters = () => {
  search.value = ''
  availabilityFilter.value = 'all'
}

const load = async () => {
  loading.value = true
  error.value = false
  try {
    inventories.value = await categoryRepository.getInventoriesByCategory(catId())
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.catId, load)
</script>

<template>
  <div class="container page">
    <button type="button" class="page__back" @click="router.push({ name: 'categories' })">
      <AppIcon name="arrow-left" :size="15" />
      {{ t('categories.backToCategories') }}
    </button>

    <div class="page__head">
      <div>
        <h1 class="page__title">{{ categoryName() || t('categories.inventoriesTitle') }}</h1>
        <p class="page__subtitle">{{ t('categories.inventoriesSubtitle') }}</p>
      </div>
      <span v-if="!loading && !error && filteredInventories.length" class="page__count">
        {{ t('categories.inventoriesCount', { count: filteredInventories.length }) }}
      </span>
    </div>

    <!-- Search input -->
    <form v-if="!loading && !error && inventories.length > 0" class="page__search" role="search" @submit.prevent>
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
      <button v-if="search.trim()" type="button" class="page__search-clear" :aria-label="t('products.clearSearch')" @click="search = ''">
        <AppIcon name="close" :size="15" />
      </button>
    </form>

    <!-- Availability Filter Tabs -->
    <div v-if="!loading && !error && inventories.length > 0" class="page__filters" role="group">
      <button
        type="button"
        class="filter-chip"
        :class="{ 'filter-chip--active': availabilityFilter === 'all' }"
        :aria-pressed="availabilityFilter === 'all'"
        @click="availabilityFilter = 'all'"
      >
        {{ t('catalog.all') }}
      </button>
      <button
        type="button"
        class="filter-chip"
        :class="{ 'filter-chip--active': availabilityFilter === 'available' }"
        :aria-pressed="availabilityFilter === 'available'"
        @click="availabilityFilter = 'available'"
      >
        <span class="filter-chip__dot filter-chip__dot--on" aria-hidden="true" />
        {{ t('categories.available') }}
      </button>
      <button
        type="button"
        class="filter-chip"
        :class="{ 'filter-chip--active': availabilityFilter === 'unavailable' }"
        :aria-pressed="availabilityFilter === 'unavailable'"
        @click="availabilityFilter = 'unavailable'"
      >
        <span class="filter-chip__dot filter-chip__dot--off" aria-hidden="true" />
        {{ t('categories.notAvailable') }}
      </button>
    </div>

    <div v-if="loading" class="page__list" aria-label="Loading">
      <div v-for="i in 4" :key="i" class="skeleton-card">
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

    <div v-else-if="inventories.length === 0 || filteredInventories.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="store" :size="30" /></span>
      <h2 class="page__state-title">{{ t('categories.noInventoriesTitle') }}</h2>
      <p class="page__state-desc">{{ t('categories.noInventoriesDescription') }}</p>
      <AppButton v-if="hasActiveFilter" variant="secondary" @click="clearFilters">
        {{ t('products.clearSearch') }}
      </AppButton>
    </div>

    <div v-else class="page__list">
      <InventoryCard
        v-for="inventory in filteredInventories"
        :key="inventory.inventoryId"
        :inventory="inventory"
        :category-id="catId()"
        :category-name="categoryName()"
      />
    </div>
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

.page__back svg {
  color: currentcolor;
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
  gap: 0.6rem;
  margin-bottom: 1rem;
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

.page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.95rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.filter-chip:hover {
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
}

.filter-chip--active {
  background: var(--dz-primary-faint);
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
  font-weight: 700;
}

.filter-chip__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: var(--dz-radius-full);
}

.filter-chip__dot--on {
  background: var(--dz-success);
}

.filter-chip__dot--off {
  background: var(--dz-muted);
}

.page__list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
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
  border-radius: var(--dz-radius);
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

  .page__filters {
    gap: 0.4rem;
  }

  .filter-chip {
    padding: 0.4rem 0.8rem;
    font-size: 0.78rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>