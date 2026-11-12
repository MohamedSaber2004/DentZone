<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { services } from '../../di/container'
import { t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'
import AppPagination from '../ui/AppPagination.vue'
import ProductCard from '../products/ProductCard.vue'
import type { HomeProviderDto } from '../../domain/models/home'
import type { ProviderProductDto } from '../../domain/models/product'
import { productRoute } from '../../utils/route-crypto'
import { resolveMediaUrl } from '../../utils/media'

type SortKey = 'default' | 'price-asc' | 'price-desc'

const ALL_SUPPLIERS = 'all'
const PAGE_SIZE = 15

const props = withDefaults(
  defineProps<{
    products: ProviderProductDto[]
    suppliers: HomeProviderDto[]
    headline: string
    mode?: 'preview' | 'page'
    previewLimit?: number
  }>(),
  { mode: 'preview', previewLimit: 12 },
)

const { cartService, wishlistService } = services

const supplierId = ref<string>(ALL_SUPPLIERS)
const search = ref('')
const sortBy = ref<SortKey>('default')
const page = ref(1)

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

const supplierMap = computed(() => {
  const map = new Map<string, HomeProviderDto>()
  for (const supplier of props.suppliers) {
    if (supplier.id) map.set(supplier.id, supplier)
  }
  return map
})

const supplierNameOf = (product: ProviderProductDto): string => {
  const known = supplierMap.value.get(product.inventoryUserId)
  return (known?.fullName || known?.userName || product.inventoryUserName || '').trim()
}

const supplierTabs = computed(() => {
  const tabs: { id: string; name: string; image: string; count: number }[] = []
  const index = new Map<string, number>()

  for (const product of props.products) {
    const id = product.inventoryUserId
    const name = supplierNameOf(product)
    if (!id || !name) continue
    const existing = index.get(id)
    if (existing === undefined) {
      index.set(id, tabs.length)
      tabs.push({ id, name, image: supplierMap.value.get(id)?.profileImage ?? '', count: 1 })
    } else {
      const tab = tabs[existing]!
      tab.count++
      if (!tab.image) tab.image = supplierMap.value.get(id)?.profileImage ?? ''
    }
  }

  return tabs
})

const showSupplierTabs = computed(() => supplierTabs.value.length > 1)

watch(supplierTabs, (tabs) => {
  if (supplierId.value !== ALL_SUPPLIERS && !tabs.some((tab) => tab.id === supplierId.value)) {
    supplierId.value = ALL_SUPPLIERS
  }
})

const supplierCount = computed(() => supplierTabs.value.length)

const searchMatches = (product: ProviderProductDto, query: string): boolean => {
  const fields = [
    product.productName,
    product.productArabicName,
    product.preef,
    product.arabicPreef,
    product.productCode,
    supplierNameOf(product),
  ]
  return fields.some((field) => field && normalizeText(String(field)).includes(query))
}

const filteredProducts = computed<ProviderProductDto[]>(() => {
  const query = normalizeText(search.value)
  let list = props.products

  if (supplierId.value !== ALL_SUPPLIERS) {
    list = list.filter((product) => product.inventoryUserId === supplierId.value)
  }
  if (query) {
    list = list.filter((product) => searchMatches(product, query))
  }

  if (sortBy.value === 'price-asc') {
    return [...list].sort((a, b) => a.effectiveSalesPrice - b.effectiveSalesPrice)
  }
  if (sortBy.value === 'price-desc') {
    return [...list].sort((a, b) => b.effectiveSalesPrice - a.effectiveSalesPrice)
  }
  return list
})

const hasActiveFilters = computed(() => search.value.trim().length > 0 || supplierId.value !== ALL_SUPPLIERS)

const pageCount = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / PAGE_SIZE)))

const visibleProducts = computed<ProviderProductDto[]>(() => {
  if (props.mode === 'page') {
    const start = (page.value - 1) * PAGE_SIZE
    return filteredProducts.value.slice(start, start + PAGE_SIZE)
  }
  return filteredProducts.value.slice(0, props.previewLimit)
})

watch([search, supplierId, sortBy], () => {
  page.value = 1
})

watch(
  () => props.products,
  () => {
    page.value = 1
  },
)

const suppliersByProduct = computed(() => {
  const map = new Map<string, Set<string>>()
  for (const product of props.products) {
    const key = product.productId || product.productName
    if (!key) continue
    if (!map.has(key)) map.set(key, new Set())
    map.get(key)!.add(product.inventoryUserId || supplierNameOf(product) || 'default')
  }
  return map
})

const providerCountOf = (product: ProviderProductDto): number => {
  const key = product.productId || product.productName
  return suppliersByProduct.value.get(key)?.size ?? 1
}

const detailsTo = (product: ProviderProductDto) =>
  productRoute(product.productId, product.inventoryUserId, {
    supplier: supplierNameOf(product) || undefined,
  })

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
    inventoryId: product.inventoryUserId || 'default',
    quantity: 1,
    name: product.productName,
    arabicName: product.productArabicName,
    image: product.images?.[0],
    supplier: product.inventoryUserName,
    salesPrice: product.effectiveSalesPrice,
    stockQuantity: product.stockQuantity,
    maxQuantity: product.maxQuantity,
  })
}

const clearFilters = () => {
  search.value = ''
  supplierId.value = ALL_SUPPLIERS
  sortBy.value = 'default'
  page.value = 1
}

const favoriteBusy = computed(() => wishlistService.busyIds.value)
</script>

<template>
  <div class="offers-hub" :class="{ 'offers-hub--page': mode === 'page' }">
    <div v-if="mode === 'preview'" class="offers-hub__head">
      <div class="offers-hub__title-wrap">
        <span class="offers-hub__badge">
          <AppIcon name="sparkles" :size="15" />
          {{ t('offers.badge') }}
        </span>
        <h2 class="offers-hub__title">{{ headline }}</h2>
        <p class="offers-hub__subtitle">{{ t('offers.subtitle') }}</p>
      </div>
      <div class="offers-hub__stat">
        <AppIcon name="flame" :size="16" />
        <span>{{ t('offers.count', { count: products.length }) }}</span>
      </div>
    </div>

    <div v-else class="offers-hub__toolbar">
      <div class="offers-hub__search">
        <span class="offers-hub__search-icon">
          <AppIcon name="search" :size="18" />
        </span>
        <input
          v-model="search"
          class="offers-hub__search-input"
          type="search"
          :placeholder="t('offers.searchPlaceholder')"
          :aria-label="t('offers.searchPlaceholder')"
        />
        <button
          v-if="search.trim()"
          type="button"
          class="offers-hub__search-clear"
          :aria-label="t('products.clearSearch')"
          @click="search = ''"
        >
          <AppIcon name="close" :size="15" />
        </button>
      </div>

      <div class="offers-hub__select-wrap">
        <span class="offers-hub__select-icon"><AppIcon name="trending-up" :size="16" /></span>
        <label class="offers-hub__select-label" for="offers-sort">{{ t('catalog.sortBy') }}</label>
        <select id="offers-sort" v-model="sortBy" class="offers-hub__select">
          <option value="default">{{ t('catalog.sortFeatured') }}</option>
          <option value="price-asc">{{ t('catalog.sortPriceAsc') }}</option>
          <option value="price-desc">{{ t('catalog.sortPriceDesc') }}</option>
        </select>
      </div>

      <span v-if="hasActiveFilters" class="offers-hub__stat offers-hub__stat--inline">
        <AppIcon name="flame" :size="16" />
        <span>{{ t('offers.count', { count: filteredProducts.length }) }}</span>
      </span>
    </div>

    <div
      v-if="showSupplierTabs"
      class="offers-hub__filter-bar"
      role="tablist"
      :aria-label="t('home.filterByProvider')"
    >
      <button
        type="button"
        class="offers-hub__filter-pill"
        :class="{ 'offers-hub__filter-pill--active': supplierId === ALL_SUPPLIERS }"
        role="tab"
        :aria-selected="supplierId === ALL_SUPPLIERS"
        @click="supplierId = ALL_SUPPLIERS"
      >
        <span class="offers-hub__pill-icon"><AppIcon name="sparkles" :size="13" /></span>
        <span class="offers-hub__pill-name">{{ t('home.allProvidersOption') }}</span>
        <span class="offers-hub__pill-count">{{ products.length }}</span>
      </button>

      <button
        v-for="tab in supplierTabs"
        :key="tab.id"
        type="button"
        class="offers-hub__filter-pill"
        :class="{ 'offers-hub__filter-pill--active': supplierId === tab.id }"
        role="tab"
        :aria-selected="supplierId === tab.id"
        @click="supplierId = tab.id"
      >
        <img
          v-if="tab.image"
          :src="resolveMediaUrl(tab.image)"
          :alt="tab.name"
          class="offers-hub__pill-avatar"
          loading="lazy"
        />
        <span v-else class="offers-hub__pill-icon"><AppIcon name="store" :size="13" /></span>
        <span class="offers-hub__pill-name">{{ tab.name }}</span>
        <span class="offers-hub__pill-count">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="visibleProducts.length > 0" class="offers-hub__grid">
      <ProductCard
        v-for="product in visibleProducts"
        :key="product.productPriceId || product.productId"
        :product="product"
        :favorite="wishlistService.isFavorite(product.productId, product.productPriceId)"
        :favorite-busy="favoriteBusy.has(product.productId)"
        :details-to="detailsTo(product)"
        :provider-count="providerCountOf(product)"
        hide-stock
        @toggle-favorite="toggleFavorite"
        @add-to-cart="addToCart"
      />
    </div>

    <div v-else class="offers-hub__empty">
      <span class="offers-hub__empty-icon"><AppIcon name="search" :size="24" /></span>
      <strong>{{ t('offers.noResultsTitle') }}</strong>
      <span>{{ t('offers.noResultsDesc') }}</span>
      <button type="button" class="offers-hub__clear" @click="clearFilters">
        <AppIcon name="refresh" :size="14" />
        {{ t('catalog.clearFilters') }}
      </button>
    </div>

    <div v-if="mode === 'page' && pageCount > 1" class="offers-hub__pagination">
      <AppPagination v-model="page" :total-items="filteredProducts.length" :page-size="PAGE_SIZE" />
    </div>

    <div v-if="mode === 'page' && supplierCount > 0" class="offers-hub__meta">
      <span>
        <AppIcon name="store" :size="14" />
        {{ t('offers.supplierCount', { count: supplierCount }) }}
      </span>
      <button v-if="hasActiveFilters" type="button" class="offers-hub__clear" @click="clearFilters">
        <AppIcon name="refresh" :size="14" />
        {{ t('catalog.clearFilters') }}
      </button>
    </div>

    <div v-if="mode === 'preview'" class="offers-hub__footer">
      <RouterLink :to="{ name: 'offers' }" class="offers-hub__cta">
        <span>{{ t('offers.viewAll') }}</span>
        <AppIcon name="arrow-right" :size="15" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.offers-hub__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.offers-hub__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: var(--dz-radius-full);
  background: linear-gradient(135deg, rgb(247 147 59 / 0.15) 0%, rgb(13 148 136 / 0.15) 100%);
  color: var(--dz-primary-strong);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
  border: 1px solid rgb(13 148 136 / 0.2);
}

.offers-hub__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.offers-hub__subtitle {
  margin-top: 0.4rem;
  font-size: 0.95rem;
  color: var(--dz-muted);
  max-width: 65ch;
}

.offers-hub__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow-sm);
  color: var(--dz-danger);
  font-size: 0.88rem;
  font-weight: 700;
}

.offers-hub__toolbar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.offers-hub__search {
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

.offers-hub__search:focus-within {
  border-color: var(--dz-primary);
  box-shadow: var(--dz-ring);
}

.offers-hub__search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dz-muted);
  flex-shrink: 0;
}

.offers-hub__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 0.92rem;
  color: var(--dz-ink);
  outline: none;
}

.offers-hub__search-input::placeholder {
  color: var(--dz-muted);
}

.offers-hub__search-clear {
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

.offers-hub__search-clear:hover {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.offers-hub__select-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  padding: 0.45rem 1rem;
  min-width: 220px;
  transition: border-color 0.2s;
}

.offers-hub__select-wrap:focus-within {
  border-color: var(--dz-primary);
}

.offers-hub__select-icon {
  display: flex;
  align-items: center;
  color: var(--dz-primary);
  flex-shrink: 0;
}

.offers-hub__select-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--dz-muted);
  white-space: nowrap;
}

.offers-hub__select {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dz-ink);
  outline: none;
  cursor: pointer;
}

.offers-hub__stat--inline {
  color: var(--dz-primary-strong);
  font-size: 0.82rem;
  padding: 0.5rem 0.95rem;
}

.offers-hub__filter-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  overflow-x: auto;
  padding: 0.35rem 0.25rem 1.25rem;
  margin-bottom: 1.75rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.offers-hub__filter-bar::-webkit-scrollbar {
  height: 4px;
}

.offers-hub__filter-bar::-webkit-scrollbar-thumb {
  background: var(--dz-border);
  border-radius: 4px;
}

.offers-hub__filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 1rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  border: 1.5px solid var(--dz-border);
  color: var(--dz-ink);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: var(--dz-shadow-sm);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.offers-hub__filter-pill:hover {
  border-color: var(--dz-primary);
  background: var(--dz-surface-soft);
  transform: translateY(-2px);
  box-shadow: var(--dz-shadow);
}

.offers-hub__filter-pill--active {
  background: linear-gradient(135deg, var(--dz-primary) 0%, var(--dz-primary-strong) 100%) !important;
  color: var(--dz-on-primary) !important;
  border-color: transparent !important;
  box-shadow: 0 4px 14px rgb(13 148 136 / 0.35);
  transform: translateY(-2px);
}

.offers-hub__pill-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-primary);
}

.offers-hub__filter-pill--active .offers-hub__pill-icon {
  background: rgb(255 255 255 / 0.25);
  color: var(--dz-white);
}

.offers-hub__pill-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--dz-radius-full);
  object-fit: cover;
  background: #fff;
  border: 1px solid var(--dz-border);
}

.offers-hub__pill-name {
  line-height: 1;
}

.offers-hub__pill-count {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
}

.offers-hub__filter-pill--active .offers-hub__pill-count {
  background: rgb(255 255 255 / 0.25);
  color: var(--dz-white);
}

.offers-hub__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.1rem;
}

.offers-hub__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--dz-border-strong);
  border-radius: var(--dz-radius-lg);
  text-align: center;
}

.offers-hub__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.4rem;
}

.offers-hub__empty strong {
  font-family: var(--dz-font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.offers-hub__empty > span:last-of-type {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 38ch;
}

.offers-hub__clear {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.75rem;
  padding: 0.5rem 1.05rem;
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

.offers-hub__clear:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
}

.offers-hub__pagination {
  margin-top: 2rem;
}

.offers-hub__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.offers-hub__meta > span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.offers-hub__meta .offers-hub__clear {
  margin-top: 0;
}

.offers-hub__footer {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.offers-hub__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.75rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  text-decoration: none;
  box-shadow: var(--dz-shadow-sm);
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s,
    transform 0.15s;
}

.offers-hub__cta:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
  transform: translateY(-1px);
}

.offers-hub__cta svg {
  transition: transform 0.2s;
}

.offers-hub__cta:hover svg {
  transform: translateX(3px);
}

html[dir='rtl'] .offers-hub__cta svg {
  transform: scaleX(-1);
}

html[dir='rtl'] .offers-hub__cta:hover svg {
  transform: scaleX(-1) translateX(-3px);
}

@media (max-width: 900px) {
  .offers-hub__grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 600px) {
  .offers-hub__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .offers-hub__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 360px) {
  .offers-hub__grid {
    grid-template-columns: 1fr;
  }
}
</style>
