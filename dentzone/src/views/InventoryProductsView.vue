<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n'
import ProductCard from '../components/products/ProductCard.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import type { ProviderProductDto } from '../domain/models/product'

const route = useRoute()
const router = useRouter()
const { productRepository } = services

const inventoryId = () => (typeof route.params.inventoryUserId === 'string' ? route.params.inventoryUserId : '')
const supplierName = () => (typeof route.query.supplier === 'string' ? route.query.supplier : '')

const products = ref<ProviderProductDto[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref('')

const hasQuery = computed(() => search.value.trim().length > 0)

const backToInventories = () => {
  const catId = typeof route.query.cat === 'string' ? route.query.cat : ''
  const name = typeof route.query.name === 'string' ? route.query.name : ''
  void router.push({ name: 'category-inventories', params: { catId }, query: name ? { name } : {} })
}

const load = async () => {
  loading.value = true
  error.value = false
  try {
    const catId = typeof route.query.cat === 'string' ? route.query.cat : undefined
    products.value = await productRepository.searchProducts({
      inventoryId: inventoryId(),
      catId,
      search: search.value.trim() || undefined,
    })
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const submitSearch = () => {
  void load()
}

const clearSearch = () => {
  search.value = ''
  void load()
}

onMounted(load)
watch(() => route.params.inventoryUserId, () => {
  search.value = ''
  void load()
})
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
      <span v-if="!loading && !error && products.length" class="page__count">
        {{ t('products.count', { count: products.length }) }}
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
      />
      <button v-if="hasQuery" type="button" class="page__search-clear" :aria-label="t('products.clearSearch')" @click="clearSearch">
        <AppIcon name="close" :size="15" />
      </button>
      <AppButton type="submit" size="md">
        {{ t('products.search') }}
      </AppButton>
    </form>

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

    <div v-else-if="products.length === 0" class="page__state">
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
        v-for="product in products"
        :key="product.productId"
        :product="product"
        :details-to="{
          name: 'product-details',
          params: { inventoryUserId: inventoryId(), productId: product.productId },
          query: { supplier: supplierName(), cat: route.query.cat, name: route.query.name },
        }"
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

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>