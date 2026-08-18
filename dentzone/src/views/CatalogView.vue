<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogService } from '../application/catalog.service'
import type { Product, ProductSort } from '../domain/models/product'
import { t } from '../i18n'
import SectionHeader from '../components/ui/SectionHeader.vue'
import CategoryPill from '../components/ui/CategoryPill.vue'
import ProductGrid from '../components/store/ProductGrid.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import AppSelect, { type SelectOption } from '../components/ui/AppSelect.vue'
import SearchField from '../components/ui/SearchField.vue'

const route = useRoute()
const router = useRouter()

const products = ref<Product[]>([])
const loading = ref(true)

const activeCategory = computed(() => (typeof route.query.category === 'string' ? route.query.category : ''))
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const sort = ref<ProductSort>('featured')

const sortOptions = computed<SelectOption[]>(() => [
  { value: 'featured', label: t('catalog.sortFeatured') },
  { value: 'price-asc', label: t('catalog.sortPriceAsc') },
  { value: 'price-desc', label: t('catalog.sortPriceDesc') },
  { value: 'rating', label: t('catalog.sortTopRated') },
  { value: 'newest', label: t('catalog.sortNewest') },
])

const pageTitle = computed(() =>
  activeCategory.value
    ? catalogService.getCategoryBySlug(activeCategory.value)?.name ?? t('catalog.shopAllProducts')
    : t('catalog.shopAllProducts'),
)

const pageSubtitle = computed(() => t('catalog.productsAvailable', { count: filteredCount.value }))

const loadProducts = async () => {
  loading.value = true
  products.value = await catalogService.getProducts({
    categorySlug: activeCategory.value || undefined,
    search: searchQuery.value || undefined,
    sort: sort.value,
  })
  loading.value = false
}

onMounted(() => {
  void loadProducts()
})

watch([activeCategory, sort], () => {
  void loadProducts()
})

const selectCategory = (categorySlug: string) => {
  void router.push({
    path: '/catalog',
    query: categorySlug
      ? { category: categorySlug, ...(searchQuery.value ? { q: searchQuery.value } : {}) }
      : searchQuery.value
        ? { q: searchQuery.value }
        : {},
  })
}

const onSearchSubmit = () => {
  void router.push({
    path: '/catalog',
    query: {
      ...(activeCategory.value ? { category: activeCategory.value } : {}),
      ...(searchQuery.value ? { q: searchQuery.value } : {}),
    },
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  void router.push({ path: '/catalog' })
}

const filteredCount = computed(() => products.value.length)
</script>

<template>
  <div class="container page">
    <SectionHeader :title="pageTitle" :subtitle="pageSubtitle">
      <template #action>
        <SearchField
          v-model="searchQuery"
          :placeholder="t('catalog.searchPlaceholder')"
          class="catalog__search"
          @submit="onSearchSubmit"
        />
      </template>
    </SectionHeader>

    <div class="catalog__toolbar">
      <div class="catalog__pills">
        <CategoryPill
          :key="'all'"
          :category="{ id: '', name: t('catalog.all'), slug: 'all', description: '', emoji: '🛍️', tint: '' }"
          :active="!activeCategory"
          @select="selectCategory('')"
        />
        <CategoryPill
          v-for="category in catalogService.categories.value"
          :key="category.id"
          :category="category"
          :active="activeCategory === category.slug"
          @select="selectCategory(category.slug)"
        />
      </div>

      <AppSelect v-model="sort" :options="sortOptions" :placeholder="t('catalog.sortBy')" />
    </div>

    <SkeletonLoader v-if="loading" variant="grid" :count="8" class="catalog__skeleton" role="status" />

    <ProductGrid v-else-if="filteredCount > 0" :products="products" />

    <EmptyState
      v-else
      icon="search"
      :title="t('catalog.noProductsTitle')"
      :description="t('catalog.noProductsDescription')"
    >
      <template #action>
        <AppButton @click="clearFilters">{{ t('catalog.clearFilters') }}</AppButton>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.catalog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.catalog__pills {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  flex: 1;
  min-width: 0;
  scrollbar-width: none;
}

.catalog__pills::-webkit-scrollbar {
  display: none;
}

.catalog__search {
  width: 240px;
}

.catalog__skeleton {
  padding-top: 0.25rem;
}

@media (max-width: 640px) {
  .catalog__search {
    width: 100%;
  }
}
</style>