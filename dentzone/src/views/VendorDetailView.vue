<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogService } from '../application/catalog.service'
import type { Product, ProductSort } from '../domain/models/product'
import type { Vendor } from '../domain/models/vendor'
import { t } from '../i18n'
import ProductGrid from '../components/store/ProductGrid.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AppButton from '../components/ui/AppButton.vue'
import SectionHeader from '../components/ui/SectionHeader.vue'
import AppSelect, { type SelectOption } from '../components/ui/AppSelect.vue'

const SORT_VALUES: ProductSort[] = ['featured', 'price-asc', 'price-desc', 'rating', 'newest']

const route = useRoute()
const router = useRouter()

const vendor = ref<Vendor | undefined>()
const allProducts = ref<Product[]>([])
const products = ref<Product[]>([])
const loading = ref(true)

const activeCategory = computed(() => (typeof route.query.category === 'string' ? route.query.category : ''))
const sort = computed<ProductSort>(() => {
  const raw = typeof route.query.sort === 'string' ? route.query.sort : ''
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : 'featured'
})

const sortOptions = computed<SelectOption[]>(() => [
  { value: 'featured', label: t('catalog.sortFeatured') },
  { value: 'price-asc', label: t('catalog.sortPriceAsc') },
  { value: 'price-desc', label: t('catalog.sortPriceDesc') },
  { value: 'rating', label: t('catalog.sortTopRated') },
  { value: 'newest', label: t('catalog.sortNewest') },
])

const productLabel = computed(() => t('vendors.productCount', { count: products.value.length }))

const categoriesOfVendor = computed(() => {
  const slugs = [...new Set(allProducts.value.map((product) => product.categorySlug))]
  return slugs.map((slug) => ({
    slug,
    name: catalogService.getCategoryBySlug(slug)?.name ?? slug,
  }))
})

const loadVendor = async (slug: string) => {
  loading.value = true
  vendor.value = await catalogService.getVendorBySlug(slug)
  if (vendor.value) {
    allProducts.value = await catalogService.getProductsByVendor(vendor.value.slug)
    products.value = await catalogService.getProductsByVendor(vendor.value.slug, {
      categorySlug: activeCategory.value || undefined,
      sort: sort.value,
    })
  } else {
    allProducts.value = []
    products.value = []
  }
  loading.value = false
}

const reloadProducts = async () => {
  if (!vendor.value) return
  loading.value = true
  products.value = await catalogService.getProductsByVendor(vendor.value.slug, {
    categorySlug: activeCategory.value || undefined,
    sort: sort.value,
  })
  loading.value = false
}

onMounted(() => {
  void loadVendor(String(route.params.slug ?? ''))
})

watch(
  () => route.params.slug,
  (slug) => {
    void loadVendor(String(slug ?? ''))
  },
)

watch([activeCategory, sort], () => {
  void reloadProducts()
})

const selectCategory = (categorySlug: string) => {
  const query: Record<string, string> = {}
  if (categorySlug) query.category = categorySlug
  if (sort.value !== 'featured') query.sort = sort.value
  void router.replace({ path: `/vendor/${route.params.slug}`, query })
}

const onSortChange = (value: string) => {
  const parsed = SORT_VALUES.includes(value as ProductSort) ? (value as ProductSort) : 'featured'
  const query: Record<string, string> = {}
  if (activeCategory.value) query.category = activeCategory.value
  if (parsed !== 'featured') query.sort = parsed
  void router.replace({ path: `/vendor/${route.params.slug}`, query })
}

const showAllProducts = () => {
  selectCategory('')
}
</script>

<template>
  <div class="container page">
    <div v-if="loading && !vendor" class="vendor__loading" role="status">
      <SkeletonLoader variant="detail" :count="1" />
    </div>

    <EmptyState
      v-else-if="!vendor"
      icon="store"
      :title="t('vendors.notFoundTitle')"
      :description="t('vendors.notFoundDescription')"
    >
      <template #action>
        <RouterLink to="/vendors">
          <AppButton>{{ t('vendors.backToAll') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>

    <template v-else>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <RouterLink to="/" class="breadcrumb__link">{{ t('nav.home') }}</RouterLink>
        <AppIcon name="chevron-right" :size="14" class="breadcrumb__sep" />
        <RouterLink to="/vendors" class="breadcrumb__link">{{ t('vendors.allTitle') }}</RouterLink>
        <AppIcon name="chevron-right" :size="14" class="breadcrumb__sep" />
        <span class="breadcrumb__current">{{ vendor.name }}</span>
      </nav>

      <section class="vendor__header">
        <span class="vendor__logo" :style="{ '--tint': vendor.tint }" aria-hidden="true">
          {{ vendor.name.charAt(0).toUpperCase() }}
        </span>
        <div class="vendor__info">
          <div class="vendor__title-row">
            <h1 class="vendor__name">{{ vendor.name }}</h1>
            <span v-if="vendor.verified" class="vendor__verified">
              <AppIcon name="check-circle" :size="15" />
              {{ t('vendors.verified') }}
            </span>
          </div>
          <p class="vendor__tagline">{{ vendor.tagline }}</p>
          <div class="vendor__meta">
            <span class="vendor__rating">
              <span class="vendor__stars">★</span>
              {{ vendor.rating.toFixed(1) }}
              <span class="vendor__reviews">({{ vendor.reviewCount }} {{ t('vendors.reviews') }})</span>
            </span>
            <span class="vendor__count">
              <AppIcon name="box" :size="15" />
              {{ productLabel }}
            </span>
          </div>
          <p class="vendor__description">{{ vendor.description }}</p>
        </div>
      </section>

      <section class="vendor__products">
        <SectionHeader
          :title="
            activeCategory
              ? catalogService.getCategoryBySlug(activeCategory)?.name ?? activeCategory
              : t('vendors.productsTitle', { name: vendor.name })
          "
          :subtitle="productLabel"
        />

        <div class="vendor__toolbar">
          <div class="vendor__pills" role="tablist" aria-label="Categories">
            <button
              type="button"
              class="vendor__pill"
              :class="{ 'vendor__pill--active': !activeCategory }"
              :aria-pressed="!activeCategory"
              @click="selectCategory('')"
            >
              {{ t('vendors.all') }}
            </button>
            <button
              v-for="category in categoriesOfVendor"
              :key="category.slug"
              type="button"
              class="vendor__pill"
              :class="{ 'vendor__pill--active': activeCategory === category.slug }"
              :aria-pressed="activeCategory === category.slug"
              @click="selectCategory(category.slug)"
            >
              {{ category.name }}
            </button>
          </div>

          <AppSelect :model-value="sort" :options="sortOptions" :placeholder="t('catalog.sortBy')" class="vendor__sort" @update:model-value="onSortChange" />
        </div>

        <div v-if="loading" class="vendor__loading" role="status">
          <SkeletonLoader variant="grid" :count="4" />
        </div>

        <ProductGrid v-else-if="products.length" :products="products" />

        <EmptyState
          v-else
          icon="search"
          :title="t('vendors.emptyFilteredTitle')"
          :description="t('vendors.emptyFilteredDescription', { name: vendor.name })"
        >
          <template #action>
            <AppButton @click="showAllProducts">{{ t('vendors.showAllProducts') }}</AppButton>
          </template>
        </EmptyState>
      </section>
    </template>
  </div>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  color: var(--dz-muted);
}

.breadcrumb__link:hover {
  color: var(--dz-primary-strong);
}

.breadcrumb__current {
  color: var(--dz-ink-soft);
  font-weight: 600;
}

.vendor__loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.vendor__header {
  display: flex;
  gap: 1.75rem;
  padding: 2rem;
  margin-bottom: 3rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-sm);
}

.vendor__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5.5rem;
  height: 5.5rem;
  flex-shrink: 0;
  font-family: var(--dz-font-display);
  font-size: 2.3rem;
  font-weight: 700;
  color: color-mix(in srgb, var(--tint) 78%, var(--dz-ink));
  border-radius: var(--dz-radius-lg);
  background: color-mix(in srgb, var(--tint) 14%, var(--dz-surface-soft));
  border: 1px solid color-mix(in srgb, var(--tint) 22%, var(--dz-border));
}

.vendor__info {
  flex: 1;
  min-width: 0;
}

.vendor__title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.vendor__name {
  font-size: 1.8rem;
}

.vendor__verified {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.7rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-success-soft);
  color: var(--dz-success);
  font-size: 0.75rem;
  font-weight: 700;
}

.vendor__tagline {
  margin-top: 0.2rem;
  color: var(--dz-primary-strong);
  font-weight: 600;
}

.vendor__meta {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.75rem;
}

.vendor__rating {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--dz-ink);
}

.vendor__stars {
  color: var(--dz-star);
}

.vendor__reviews {
  font-weight: 500;
  color: var(--dz-muted);
}

.vendor__count {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.vendor__count svg {
  color: var(--dz-primary);
}

.vendor__description {
  margin-top: 0.85rem;
  max-width: 640px;
  color: var(--dz-ink-soft);
  line-height: 1.6;
}

.vendor__products {
  margin-top: 1rem;
}

.vendor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.vendor__pills {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  flex: 1;
  min-width: 0;
  scrollbar-width: none;
}

.vendor__pills::-webkit-scrollbar {
  display: none;
}

.vendor__pill {
  padding: 0.45rem 1rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  white-space: nowrap;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.vendor__pill:hover {
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
  background: var(--dz-primary-faint);
}

.vendor__pill--active {
  border-color: var(--dz-primary);
  background: var(--dz-primary);
  color: var(--dz-white);
}

.vendor__pill--active:hover {
  background: var(--dz-primary);
  color: var(--dz-white);
}

.vendor__sort {
  width: 210px;
}

@media (max-width: 640px) {
  .vendor__header {
    flex-direction: column;
    padding: 1.5rem;
  }

  .vendor__name {
    font-size: 1.4rem;
  }

  .vendor__sort {
    width: 100%;
  }
}
</style>