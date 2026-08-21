<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { locale, t } from '../i18n'
import { API_LANG } from '../config/api.config'
import ProductCard from '../components/products/ProductCard.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AppPagination from '../components/ui/AppPagination.vue'
import type { CategoryDto } from '../domain/models/category'
import type { ProviderProductDto } from '../domain/models/product'

const route = useRoute()
const router = useRouter()
const { productRepository, categoryRepository, authService, cartService } = services

const PAGE_SIZE = 15

const inventoryId = () => (typeof route.params.inventoryUserId === 'string' ? route.params.inventoryUserId : '')
const supplierName = () => (typeof route.query.supplier === 'string' ? route.query.supplier : '')

const allProducts = ref<ProviderProductDto[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const currentPage = ref(1)
const favoriteIds = ref<Set<string>>(new Set())
const favoriteBusyIds = ref<Set<string>>(new Set())

const categories = ref<CategoryDto[]>([])
const selectedCategory = ref(typeof route.query.cat === 'string' ? route.query.cat : '')

const hasQuery = computed(() => search.value.trim().length > 0)

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

const filteredProducts = computed(() => {
  const q = normalizeText(search.value)
  if (!q) return allProducts.value
  return allProducts.value.filter((p) => {
    const fields = [
      p.productName,
      p.productArabicName,
      p.description,
      p.arabicDescription,
      p.preef,
      p.arabicPreef,
      p.productCode,
      p.categoryName,
      p.inventoryUserName,
    ]
      .filter(Boolean)
      .map((f) => normalizeText(String(f)))

    return fields.some((f) => f.includes(q))
  })
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredProducts.value.slice(start, start + PAGE_SIZE)
})

const loadFavorites = async () => {
  if (!authService.isAuthenticated) return
  try {
    const list = await productRepository.getMyFavorites()
    favoriteIds.value = new Set(list.map((p) => p.productPriceId))
  } catch {
    // Favorites are a secondary enhancement; a failed load keeps cards un-favorited.
  }
}

const toggleFavorite = async (product: ProviderProductDto) => {
  const user = authService.user.value
  if (!user) {
    void router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (favoriteBusyIds.value.has(product.productPriceId)) return
  const wasFavorite = favoriteIds.value.has(product.productPriceId)
  favoriteBusyIds.value = new Set(favoriteBusyIds.value).add(product.productPriceId)
  const next = new Set(favoriteIds.value)
  if (wasFavorite) {
    next.delete(product.productPriceId)
  } else {
    next.add(product.productPriceId)
  }
  favoriteIds.value = next
  try {
    await productRepository.toggleFavorite(user.id, product.productId, product.productPriceId)
  } catch {
    const restored = new Set(favoriteIds.value)
    if (wasFavorite) {
      restored.add(product.productPriceId)
    } else {
      restored.delete(product.productPriceId)
    }
    favoriteIds.value = restored
  } finally {
    const busy = new Set(favoriteBusyIds.value)
    busy.delete(product.productPriceId)
    favoriteBusyIds.value = busy
  }
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

const backToInventories = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  const catId = typeof route.query.cat === 'string' ? route.query.cat : ''
  const name = typeof route.query.name === 'string' ? route.query.name : ''
  if (catId) {
    void router.push({ name: 'category-inventories', params: { catId }, query: name ? { name } : {} })
  } else {
    void router.push({ name: 'categories' })
  }
}

const load = async () => {
  loading.value = true
  error.value = false
  try {
    const result = await productRepository.searchProducts({
      inventoryId: inventoryId(),
      catId: selectedCategory.value || undefined,
    })
    allProducts.value = result
  } catch {
    allProducts.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  currentPage.value = 1
}

const submitSearch = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

const clearSearch = () => {
  search.value = ''
  currentPage.value = 1
}

const onPageChange = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const categoryName = (category: CategoryDto) => {
  if (locale.value === 'ar') return category.arabicName || category.name
  return category.name
}

const loadCategories = async () => {
  try {
    categories.value = await categoryRepository.getCategories(locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH)
  } catch {
    categories.value = []
  }
}

const selectCategory = (id: string) => {
  if (selectedCategory.value === id) return
  selectedCategory.value = id
  currentPage.value = 1
  const query = { ...route.query }
  if (id) {
    query.cat = id
    query.inventoryId = inventoryId()
  } else {
    delete query.cat
    delete query.inventoryId
  }
  void router.replace({ query })
  void load()
}

onMounted(() => {
  selectedCategory.value = typeof route.query.cat === 'string' ? route.query.cat : ''
  void loadCategories()
  void load()
  void loadFavorites()
})

watch(
  () => route.params.inventoryUserId,
  () => {
    search.value = ''
    selectedCategory.value = ''
    currentPage.value = 1
    void load()
  },
)
</script>

<template>
  <div class="container page">
    <button type="button" class="page__back" @click="backToInventories">
      <AppIcon name="arrow-left" :size="15" />
      {{ t('categories.backToInventories') }}
    </button>

    <div class="page__head">
      <div>
        <h1 class="page__title">{{ supplierName() || t('products.title') }}</h1>
        <p class="page__subtitle">{{ t('products.subtitle') }}</p>
      </div>
      <span v-if="!loading && !error && filteredProducts.length" class="page__count">
        {{ t('products.count', { count: filteredProducts.length }) }}
      </span>
    </div>

    <form class="page__search" role="search" @submit.prevent="submitSearch">
      <span class="page__search-icon">
        <AppIcon name="search" :size="17" />
      </span>
      <input
        v-model="search"
        class="page__search-input"
        type="search"
        :placeholder="t('products.searchPlaceholder')"
        :aria-label="t('products.searchPlaceholder')"
        @input="onSearchInput"
      />
      <button
        v-if="hasQuery"
        type="button"
        class="page__search-clear"
        :aria-label="t('products.clearSearch')"
        @click="clearSearch"
      >
        <AppIcon name="close" :size="15" />
      </button>
      <AppButton type="submit" size="md">
        {{ t('products.search') }}
      </AppButton>
    </form>

    <div v-if="categories.length" class="page__cats" role="group" :aria-label="t('products.categoriesFilter')">
      <button
        type="button"
        class="cat-chip"
        :class="{ 'cat-chip--active': selectedCategory === '' }"
        :aria-pressed="selectedCategory === ''"
        @click="selectCategory('')"
      >
        {{ t('catalog.all') }}
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="cat-chip"
        :class="{ 'cat-chip--active': selectedCategory === category.id }"
        :aria-pressed="selectedCategory === category.id"
        @click="selectCategory(category.id)"
      >
        {{ categoryName(category) }}
      </button>
    </div>

    <div v-if="loading" class="page__grid" aria-label="Loading">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <span class="skeleton skeleton-card__media" />
        <span class="skeleton skeleton-card__line skeleton-card__line--wide" />
        <span class="skeleton skeleton-card__line" />
        <span class="skeleton skeleton-card__line skeleton-card__line--short" />
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

    <div v-else-if="filteredProducts.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="search" :size="30" /></span>
      <h2 class="page__state-title">
        {{ hasQuery ? t('products.noResultsTitle', { query: search.trim() }) : t('products.emptyTitle') }}
      </h2>
      <p class="page__state-desc">
        {{ hasQuery ? t('products.noResultsDescription') : t('products.emptyDescription') }}
      </p>
      <AppButton v-if="hasQuery" variant="secondary" @click="clearSearch">
        {{ t('products.clearSearch') }}
      </AppButton>
    </div>

    <div v-else class="page__grid">
      <ProductCard
        v-for="product in paginatedProducts"
        :key="product.productPriceId || product.productId"
        :product="product"
        :favorite="favoriteIds.has(product.productPriceId)"
        :favorite-busy="favoriteBusyIds.has(product.productPriceId)"
        :details-to="{
          name: 'product-details',
          params: { inventoryUserId: inventoryId(), productId: product.productId },
          query: { supplier: supplierName(), cat: route.query.cat, name: route.query.name },
        }"
        @toggle-favorite="toggleFavorite"
        @add-to-cart="addToCart"
      />
    </div>

    <!-- Frontend Pagination (Page size: 15) -->
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
  margin-bottom: 1.5rem;
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
  padding: 0.45rem;
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
  width: 2.2rem;
  color: var(--dz-muted);
  flex-shrink: 0;
}

.page__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
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
  width: 2rem;
  height: 2rem;
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

.page__cats {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.page__cats::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  flex-shrink: 0;
  padding: 0.45rem 1rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  color: var(--dz-ink-soft);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
}

.cat-chip:hover {
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
}

.cat-chip--active {
  border-color: var(--dz-primary);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
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
    padding-block: 1.5rem 3.5rem;
  }

  .page__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.65rem;
    margin-bottom: 1.25rem;
  }

  .page__search {
    flex-wrap: wrap;
    border-radius: var(--dz-radius-lg);
    padding: 0.65rem;
  }

  .page__search-input {
    min-width: 140px;
  }

  .page__search :deep(.app-button) {
    width: 100%;
    justify-content: center;
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
