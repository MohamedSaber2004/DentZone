<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n'
import ProductCard from '../components/products/ProductCard.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AppPagination from '../components/ui/AppPagination.vue'
import type { ProviderProductDto } from '../domain/models/product'

const route = useRoute()
const router = useRouter()
const { productRepository, cartService, wishlistService } = services

const PAGE_SIZE = 15

const allProducts = ref<ProviderProductDto[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const selectedProvider = ref(typeof route.query.provider === 'string' ? route.query.provider : '')
const currentPage = ref(1)

const hasQuery = computed(() => search.value.trim().length > 0)
const hasFilters = computed(() => hasQuery.value || selectedProvider.value !== '')

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[Ø£Ø¥Ø¢]/g, 'Ø§')
    .replace(/Ø©/g, 'Ù‡')
    .replace(/Ù‰/g, 'ÙŠ')
    .trim()
}

// Available suppliers extracted from all loaded products
const availableProviders = computed(() => {
  const map = new Map<string, string>()
  for (const p of allProducts.value) {
    if (p.inventoryUserId && p.inventoryUserName) {
      map.set(p.inventoryUserId, p.inventoryUserName)
    } else if (p.inventoryUserName) {
      map.set(p.inventoryUserName, p.inventoryUserName)
    }
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const filteredProducts = computed(() => {
  let list = allProducts.value

  // Filter by selected provider dropdown if active
  const provider = selectedProvider.value.trim()
  if (provider) {
    list = list.filter((p) => p.inventoryUserId === provider || p.inventoryUserName === provider)
  }

  // Filter by search query (name, code, description, and provider/supplier name)
  const q = normalizeText(search.value)
  if (q) {
    list = list.filter((p) => {
      const fields = [
        p.productName,
        p.productArabicName,
        p.description,
        p.arabicDescription,
        p.preef,
        p.arabicPreef,
        p.productCode,
        p.inventoryUserName,
      ]
        .filter(Boolean)
        .map((f) => normalizeText(String(f)))

      return fields.some((f) => f.includes(q))
    })
  }

  return list
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredProducts.value.slice(start, start + PAGE_SIZE)
})

const loadFavorites = async () => {
  await wishlistService.refresh()
}

const toggleFavorite = (product: ProviderProductDto) => {
  void wishlistService.toggle({
    productId: product.productId,
    productPriceId: product.productPriceId,
    inventoryUserId: product.inventoryUserId,
    name: product.productName,
  })
}

const addToCart = (product: ProviderProductDto) => {
  void cartService.add({
    productId: product.productId,
    inventoryId: product.inventoryUserId,
    quantity: 1,
    name: product.productName,
    stockQuantity: product.stockQuantity,
    maxQuantity: product.maxQuantity,
  })
}

const loadProducts = async () => {
  loading.value = true
  error.value = false
  try {
    const list = await productRepository.searchProducts({})
    allProducts.value = list
  } catch {
    allProducts.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  currentPage.value = 1
  updateRouteQuery()
}

const onProviderChange = () => {
  currentPage.value = 1
  updateRouteQuery()
}

const clearSearch = () => {
  search.value = ''
  selectedProvider.value = ''
  currentPage.value = 1
  updateRouteQuery()
}

const updateRouteQuery = () => {
  const query: Record<string, string> = {}
  if (search.value.trim()) {
    query.search = search.value.trim()
  }
  if (selectedProvider.value) {
    query.provider = selectedProvider.value
  }
  if (currentPage.value > 1) {
    query.page = String(currentPage.value)
  }
  void router.replace({ query })
}

const onPageChange = () => {
  updateRouteQuery()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  if (typeof route.query.page === 'string') {
    const p = parseInt(route.query.page, 10)
    if (!isNaN(p) && p >= 1) currentPage.value = p
  }
  void loadProducts()
  void loadFavorites()
})

watch(
  () => [route.query.search, route.query.provider] as const,
  ([newSearch, newProvider]) => {
    const s = typeof newSearch === 'string' ? newSearch : ''
    const p = typeof newProvider === 'string' ? newProvider : ''
    if (s !== search.value || p !== selectedProvider.value) {
      search.value = s
      selectedProvider.value = p
      currentPage.value = 1
    }
  },
)

watch(currentPage, () => {
  updateRouteQuery()
})
</script>

<template>
  <div class="container page">
    <div class="page__head">
      <div>
        <h1 class="page__title">{{ t('home.allProductsTitle') }}</h1>
        <p class="page__subtitle">{{ t('home.allProductsSubtitle') }}</p>
      </div>
      <span v-if="!loading && !error && filteredProducts.length" class="page__count">
        {{ t('products.count', { count: filteredProducts.length }) }}
      </span>
    </div>

    <!-- Search & Provider Filters Bar -->
    <div class="page__filters">
      <div class="page__search">
        <span class="page__search-icon">
          <AppIcon name="search" :size="18" />
        </span>
        <input
          v-model="search"
          class="page__search-input"
          type="search"
          :placeholder="t('home.searchProductsPlaceholder')"
          :aria-label="t('home.searchProductsPlaceholder')"
          @input="onSearchInput"
        />
        <button
          v-if="hasQuery"
          type="button"
          class="page__search-clear"
          :aria-label="t('products.clearSearch')"
          @click="search = ''; onSearchInput()"
        >
          <AppIcon name="close" :size="15" />
        </button>
      </div>

      <!-- Supplier Dropdown Filter -->
      <div v-if="availableProviders.length" class="page__select-wrap">
        <span class="page__select-icon"><AppIcon name="store" :size="16" /></span>
        <select
          v-model="selectedProvider"
          class="page__select"
          :aria-label="t('home.filterByProvider')"
          @change="onProviderChange"
        >
          <option value="">{{ t('home.allProvidersOption') }}</option>
          <option
            v-for="provider in availableProviders"
            :key="provider.id"
            :value="provider.id"
          >
            {{ provider.name }}
          </option>
        </select>
      </div>

      <button
        v-if="hasFilters"
        type="button"
        class="page__clear-btn"
        @click="clearSearch"
      >
        <AppIcon name="refresh" :size="14" />
        {{ t('catalog.all') }}
      </button>
    </div>

    <!-- Loading Skeleton Grid -->
    <div v-if="loading" class="page__grid" role="status" :aria-label="t('common.loading')">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <span class="skeleton skeleton-card__media" />
        <span class="skeleton skeleton-card__line skeleton-card__line--wide" />
        <span class="skeleton skeleton-card__line" />
        <span class="skeleton skeleton-card__line skeleton-card__line--short" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="page__state" role="alert">
      <span class="page__state-icon"><AppIcon name="alert-circle" :size="32" /></span>
      <h2 class="page__state-title">{{ t('categories.errorTitle') }}</h2>
      <p class="page__state-desc">{{ t('categories.errorDescription') }}</p>
      <AppButton variant="primary" @click="loadProducts">
        <AppIcon name="refresh" :size="15" />
        {{ t('categories.retry') }}
      </AppButton>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProducts.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="search" :size="32" /></span>
      <h2 class="page__state-title">
        {{ hasFilters ? t('products.noResultsTitle', { query: search.trim() || selectedProvider }) : t('home.noPaginatedProducts') }}
      </h2>
      <p class="page__state-desc">
        {{ hasFilters ? t('products.noResultsDescription') : t('home.noPaginatedProductsDesc') }}
      </p>
      <AppButton v-if="hasFilters" variant="secondary" @click="clearSearch">
        {{ t('products.clearSearch') }}
      </AppButton>
    </div>

    <!-- 15-Product Frontend Paginated Grid -->
    <div v-else class="page__grid">
      <ProductCard
        v-for="product in paginatedProducts"
        :key="product.productPriceId || product.productId"
        :product="product"
        :favorite="wishlistService.isFavorite(product.productId, product.productPriceId)"
        :favorite-busy="wishlistService.busyIds.value.has(product.productId)"
        :details-to="{
          name: 'product-details',
          params: { inventoryUserId: product.inventoryUserId || 'default', productId: product.productId },
          query: { supplier: product.inventoryUserName || undefined },
        }"
        @toggle-favorite="toggleFavorite"
        @add-to-cart="addToCart"
      />
    </div>

    <!-- Frontend Pagination Component (Page Size: 15) -->
    <AppPagination
      v-if="!loading && !error && filteredProducts.length > PAGE_SIZE"
      v-model="currentPage"
      :total-items="filteredProducts.length"
      :page-size="PAGE_SIZE"
      @change="onPageChange"
    />
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

.page__filters {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.page__search {
  flex: 1 1 280px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
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
  justify-content: center;
  color: var(--dz-muted);
  flex-shrink: 0;
}

.page__search-input {
  flex: 1;
  min-width: 0;
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
  width: 1.85rem;
  height: 1.85rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.page__search-clear:hover {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.page__select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  padding: 0.45rem 1rem;
  min-width: 200px;
  transition: border-color 0.2s;
}

.page__select-wrap:focus-within {
  border-color: var(--dz-primary);
}

.page__select-icon {
  display: flex;
  align-items: center;
  color: var(--dz-primary);
  margin-inline-end: 0.5rem;
  flex-shrink: 0;
}

.page__select {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dz-ink);
  outline: none;
  cursor: pointer;
}

.page__clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-primary-strong);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.page__clear-btn:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-soft);
}

.page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
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
  height: 9rem;
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

.skeleton-card__line--short {
  width: 40%;
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

  .page__filters {
    gap: 0.65rem;
    margin-bottom: 1.5rem;
  }

  .page__search {
    flex: 1 1 100%;
  }

  .page__select-wrap {
    flex: 1 1 100%;
    min-width: 0;
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
