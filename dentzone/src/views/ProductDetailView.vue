<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { catalogService } from '../application/catalog.service'
import { cartService } from '../application/cart.service'
import { toastService } from '../application/toast.service'
import { wishlistService } from '../application/wishlist.service'
import { formatPrice, t } from '../i18n'
import type { Product } from '../domain/models/product'
import type { Vendor } from '../domain/models/vendor'
import ProductImage from '../components/ui/ProductImage.vue'
import PriceTag from '../components/ui/PriceTag.vue'
import RatingStars from '../components/ui/RatingStars.vue'
import AppBadge from '../components/ui/AppBadge.vue'
import QuantityStepper from '../components/ui/QuantityStepper.vue'
import AppButton from '../components/ui/AppButton.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import SectionHeader from '../components/ui/SectionHeader.vue'
import ProductGrid from '../components/store/ProductGrid.vue'
import ProductInfoTabs from '../components/store/ProductInfoTabs.vue'
import EmptyState from '../components/ui/EmptyState.vue'

const route = useRoute()

const product = ref<Product | undefined>()
const relatedProducts = ref<Product[]>([])
const vendorProducts = ref<Product[]>([])
const vendor = ref<Vendor | undefined>()
const quantity = ref(1)
const loading = ref(true)
const added = ref(false)

const wished = computed(() => (product.value ? wishlistService.has(product.value.id) : false))

const toggleWishlist = async () => {
  if (!product.value) return
  try {
    const addedToWishlist = await wishlistService.toggle(product.value)
    toastService[addedToWishlist ? 'success' : 'info'](
      addedToWishlist
        ? t('wishlist.addedToast', { name: product.value.name })
        : t('wishlist.removedToast', { name: product.value.name }),
    )
  } catch {
    toastService.error(t('wishlist.errorToast'))
  }
}

const loadProduct = async (slug: string) => {
  loading.value = true
  product.value = await catalogService.getProductBySlug(slug)
  relatedProducts.value = []
  vendorProducts.value = []
  vendor.value = undefined
  if (product.value) {
    const [related, fromVendor, vendorData] = await Promise.all([
      catalogService.getRelatedProducts(product.value),
      catalogService.getProductsByVendor(product.value.vendorSlug),
      catalogService.getVendorBySlug(product.value.vendorSlug),
    ])
    relatedProducts.value = related
    vendorProducts.value = fromVendor.filter((candidate) => candidate.id !== product.value?.id).slice(0, 4)
    vendor.value = vendorData
    quantity.value = 1
  }
  loading.value = false
}

onMounted(() => {
  void loadProduct(String(route.params.slug ?? ''))
})

watch(
  () => route.params.slug,
  (slug) => {
    void loadProduct(String(slug ?? ''))
  },
)

const addToCart = () => {
  if (!product.value) return
  if (!product.value.inStock) {
    toastService.error(t('product.outOfStockToast', { name: product.value.name }))
    return
  }
  cartService.add(product.value, quantity.value)
  added.value = true
  toastService.success(t('product.addToastQty', { count: quantity.value, name: product.value.name }))
  setTimeout(() => {
    added.value = false
  }, 1400)
}
</script>

<template>
  <div class="container page">
    <div v-if="loading" class="detail__loading" role="status">
      <SkeletonLoader variant="detail" :count="1" />
    </div>

    <EmptyState
      v-else-if="!product"
      icon="eye"
      :title="t('product.notFoundTitle')"
      :description="t('product.notFoundDescription')"
    >
      <template #action>
        <RouterLink to="/catalog">
          <AppButton>{{ t('product.backToCatalog') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>

    <template v-else>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <RouterLink to="/" class="breadcrumb__link">{{ t('nav.home') }}</RouterLink>
        <AppIcon name="chevron-right" :size="14" class="breadcrumb__sep" />
        <RouterLink to="/catalog" class="breadcrumb__link">{{ t('product.shop') }}</RouterLink>
        <AppIcon name="chevron-right" :size="14" class="breadcrumb__sep" />
        <span class="breadcrumb__current">{{ product.name }}</span>
      </nav>

      <section class="detail">
        <div class="detail__media">
          <ProductImage :product="product" size="xl" class="detail__image" />
          <span v-if="product.inStock" class="detail__stock-chip">
            <AppIcon name="box" :size="14" />
            {{ t('product.inStock', { count: product.stockQuantity }) }}
          </span>
        </div>

        <div class="detail__info">
          <div class="detail__meta">
            <span class="detail__brand">{{ product.brand }}</span>
            <AppBadge v-if="product.badge" tone="warning">{{ product.badge }}</AppBadge>
            <AppBadge v-if="!product.inStock" tone="neutral">{{ t('product.outOfStock') }}</AppBadge>
          </div>

          <h1 class="detail__title">{{ product.name }}</h1>
          <p class="detail__tagline">{{ product.tagline }}</p>

          <RatingStars :rating="product.rating" :review-count="product.reviewCount" size="md" />

          <PriceTag :price="product.price" :compare-at-price="product.compareAtPrice" size="lg" class="detail__price" />

          <p class="detail__description">{{ product.description }}</p>

          <div class="detail__buy">
            <QuantityStepper v-model="quantity" :max="Math.max(1, product.stockQuantity)" />
            <button
              class="detail__wishlist"
              :class="{ 'detail__wishlist--active': wished }"
              type="button"
              :aria-label="`${wished ? 'Remove' : 'Add'} ${product.name} ${wished ? 'from' : 'to'} wishlist`"
              :title="`${wished ? 'Remove' : 'Add'} ${product.name} ${wished ? 'from' : 'to'} wishlist`"
              @click="toggleWishlist"
            >
              <AppIcon name="heart" :size="20" :filled="wished" />
            </button>
            <AppButton size="lg" :block="true" @click="addToCart">
              <AppIcon v-if="added" name="check" :size="18" />
              {{ added ? t('product.addedToCart') : product.inStock ? t('product.addToCart') : t('product.outOfStock') }}
            </AppButton>
          </div>

          <p class="detail__stock" :class="{ 'detail__stock--low': product.inStock && product.stockQuantity <= 10 }">
            {{ product.inStock ? t('product.inStockShips', { count: product.stockQuantity }) : t('product.backInStockSoon') }}
          </p>

          <ul class="detail__trust">
            <li>
              <AppIcon name="truck" :size="16" />
              {{ t('product.freeShippingOver', { amount: formatPrice(catalogService.settings.value.freeShippingThreshold) }) }}
            </li>
            <li>
              <AppIcon name="refresh" :size="16" />
              {{ t('product.easyReturns') }}
            </li>
            <li>
              <AppIcon name="shield-check" :size="16" />
              {{ t('product.warranty') }}
            </li>
          </ul>
        </div>
      </section>

      <ProductInfoTabs :product="product" />

      <section v-if="vendor && vendorProducts.length" class="detail__section">
        <SectionHeader :title="t('product.moreFromVendor', { name: vendor.name })" :subtitle="t('product.moreFromVendorSubtitle')">
          <template #action>
            <RouterLink :to="`/vendor/${vendor.slug}`" class="section-link">
              {{ vendor.name }}
              <AppIcon name="arrow-right" :size="15" />
            </RouterLink>
          </template>
        </SectionHeader>
        <ProductGrid :products="vendorProducts" />
      </section>

      <section class="detail__related">
        <SectionHeader :title="t('product.relatedTitle')" :subtitle="t('product.relatedSubtitle')">
          <template #action>
            <RouterLink to="/catalog" class="section-link">
              <AppIcon name="arrow-right" :size="15" />
              {{ t('product.browseAll') }}
            </RouterLink>
          </template>
        </SectionHeader>
        <ProductGrid :products="relatedProducts" />
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

.detail {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 2.5rem;
  align-items: start;
}

.detail__media {
  position: relative;
}

.detail__image {
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow);
}

.detail__stock-chip {
  position: absolute;
  inset-inline-end: 0.9rem;
  bottom: 0.9rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow-sm);
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--dz-success);
}

.detail__info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 801px) {
  .detail__info {
    position: sticky;
    top: calc(var(--dz-header-height) + 1.25rem);
  }
}

.detail__meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.detail__brand {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dz-muted);
}

.detail__title {
  font-size: 2rem;
}

.detail__tagline {
  color: var(--dz-ink-soft);
  font-size: 1.05rem;
  margin-top: -0.5rem;
}

.detail__description {
  color: var(--dz-ink-soft);
}

.detail__buy {
  display: flex;
  align-items: stretch;
  gap: 0.9rem;
  margin-top: 0.5rem;
}

.detail__buy :deep(.quantity-stepper) {
  flex-shrink: 0;
}

.detail__wishlist {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  color: var(--dz-ink-soft);
  transition:
    transform 0.15s,
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;
}

.detail__wishlist:hover {
  transform: scale(1.06);
  color: var(--dz-primary-strong);
  border-color: var(--dz-primary);
}

.detail__wishlist--active {
  color: var(--dz-danger);
  border-color: var(--dz-danger-soft);
  background: var(--dz-danger-soft);
}

.detail__stock {
  font-size: 0.82rem;
  color: var(--dz-success);
  font-weight: 600;
}

.detail__stock--low {
  color: var(--dz-warning);
}

.detail__trust {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--dz-border);
}

.detail__trust li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.detail__trust svg {
  color: var(--dz-primary);
  flex-shrink: 0;
}

.detail__section {
  margin-top: 4rem;
}

.detail__related {
  margin-top: 4rem;
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
  white-space: nowrap;
}

.section-link:hover {
  text-decoration: underline;
}

.detail__loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

@media (max-width: 800px) {
  .detail {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .detail__title {
    font-size: 1.6rem;
  }

  .detail__trust {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>