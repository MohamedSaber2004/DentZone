<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { locale, t } from '../i18n'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import type { ProductDetailDto, ProductPriceDto } from '../domain/models/product'

const route = useRoute()
const router = useRouter()
const { productRepository } = services

const productId = () => (typeof route.params.productId === 'string' ? route.params.productId : '')
const inventoryUserId = () =>
  typeof route.params.inventoryUserId === 'string' ? route.params.inventoryUserId : ''

const lang = computed(() => (locale.value === 'ar' ? 1 : 0))

const detail = ref<ProductDetailDto | null>(null)
const loading = ref(true)
const error = ref(false)
const activeImage = ref(0)
const imageFailed = ref(false)

const backToProducts = () => {
  const cat = typeof route.query.cat === 'string' ? route.query.cat : undefined
  const name = typeof route.query.name === 'string' ? route.query.name : undefined
  const supplier = typeof route.query.supplier === 'string' ? route.query.supplier : undefined
  void router.push({
    name: 'inventory-products',
    params: { inventoryUserId: inventoryUserId() },
    query: { cat, name, supplier },
  })
}

const load = async () => {
  loading.value = true
  error.value = false
  detail.value = null
  activeImage.value = 0
  imageFailed.value = false
  try {
    detail.value = await productRepository.getProductById(productId(), lang.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const displayName = computed(() => {
  const d = detail.value
  if (!d) return ''
  return locale.value === 'ar' ? d.productArabicName || d.productName : d.productName || d.preef
})

const displayDescription = computed(() => {
  const d = detail.value
  if (!d) return ''
  return locale.value === 'ar' ? d.arabicDescription || d.description : d.description
})

const displayCategory = computed(() => {
  const c = detail.value?.category
  if (!c) return ''
  return locale.value === 'ar' ? c.arabicName || c.name : c.name || c.pref
})

const currentPrice = computed<ProductPriceDto | null>(() => {
  const d = detail.value
  if (!d) return null
  return (
    d.prices.find((p) => p.inventoryUserId === inventoryUserId()) ??
    d.prices.find((p) => p.effectiveSalesPrice > 0) ??
    d.prices[0] ??
    null
  )
})

const otherVendors = computed(() => {
  const d = detail.value
  if (!d) return []
  return d.inventories.filter(
    (v) => v.inventoryUserId !== inventoryUserId() && (v.effectiveSalesPrice > 0 || v.stockQuantity > 0),
  )
})

const formatPrice = (value: number | null | undefined) =>
  value == null ? '' : value.toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 })

const onImageError = () => {
  imageFailed.value = true
}

const onThumbnailError = (index: number) => {
  if (index === activeImage.value) imageFailed.value = true
}

onMounted(load)
watch(() => route.params.productId, () => {
  void load()
})
</script>

<template>
  <div class="container page">
    <button type="button" class="page__back" @click="backToProducts">
      <AppIcon name="arrow-left" :size="15" />
      {{ t('products.details.back') }}
    </button>

    <div v-if="loading" class="page__loading" aria-label="Loading">
      <div class="skeleton skeleton-detail skeleton-detail--media" />
      <div class="skeleton-detail__lines">
        <span class="skeleton skeleton-detail__line skeleton-detail__line--wide" />
        <span class="skeleton skeleton-detail__line" />
        <span class="skeleton skeleton-detail__line skeleton-detail__line--short" />
        <span class="skeleton skeleton-detail__line skeleton-detail__line--wide" />
      </div>
    </div>

    <div v-else-if="error" class="page__state" role="alert">
      <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
      <h2 class="page__state-title">{{ t('products.details.notFound') }}</h2>
      <p class="page__state-desc">{{ t('products.details.notFoundDescription') }}</p>
      <AppButton variant="primary" @click="load">
        <AppIcon name="refresh" :size="15" />
        {{ t('categories.retry') }}
      </AppButton>
    </div>

    <template v-else-if="detail">
      <div class="detail">
        <div class="detail__media">
          <img
            v-if="detail.images.length && !imageFailed"
            :src="detail.images[activeImage]"
            :alt="displayName"
            class="detail__main"
            @error="onImageError"
          />
          <span v-else class="detail__placeholder">
            <AppIcon name="package" :size="44" />
          </span>
          <div v-if="detail.images.length > 1" class="detail__thumbs">
            <button
              v-for="(image, index) in detail.images"
              :key="image"
              type="button"
              class="detail__thumb"
              :class="{ 'detail__thumb--active': index === activeImage && !imageFailed }"
              :aria-label="t('products.details.title')"
              @click="activeImage = index; imageFailed = false"
            >
              <img :src="image" :alt="''" @error="onThumbnailError(index)" />
            </button>
          </div>
        </div>

        <div class="detail__info">
          <h1 class="detail__name">{{ displayName }}</h1>

          <p class="detail__code">
            {{ t('products.code') }}: {{ detail.productCode }}
          </p>

          <div class="detail__price-row">
            <span v-if="currentPrice?.isFlashSaleActive && currentPrice.priceBeforeFlashSale" class="detail__price-old">
              {{ formatPrice(currentPrice.priceBeforeFlashSale) }}
            </span>
            <strong class="detail__price">{{ formatPrice(currentPrice?.effectiveSalesPrice) }}</strong>
            <span class="detail__currency">{{ t('products.currency') }}</span>
            <span v-if="currentPrice?.isFlashSaleActive" class="detail__sale">{{ t('products.sale') }}</span>
          </div>

          <div class="detail__meta">
            <span v-if="currentPrice && currentPrice.stockQuantity > 0" class="detail__stock">
              <AppIcon name="check" :size="14" />
              {{ t('products.inStock', { count: currentPrice.stockQuantity }) }}
            </span>
            <span v-else class="detail__stock detail__stock--out">
              {{ t('products.outOfStock') }}
            </span>
            <span v-if="currentPrice && currentPrice.maxQuantity > 0" class="detail__max">
              {{ t('products.maxPerOrder', { count: currentPrice.maxQuantity }) }}
            </span>
          </div>

          <dl class="detail__facts">
            <div v-if="displayCategory" class="detail__fact">
              <dt>{{ t('products.details.category') }}</dt>
              <dd>{{ displayCategory }}</dd>
            </div>
            <div v-if="detail.brandName" class="detail__fact">
              <dt>{{ t('products.details.brand') }}</dt>
              <dd>{{ detail.brandName }}</dd>
            </div>
            <div class="detail__fact">
              <dt>{{ t('products.details.availability') }}</dt>
              <dd>
                <span v-if="currentPrice && currentPrice.stockQuantity > 0" class="detail__availability detail__availability--yes">
                  {{ t('products.details.availableNow') }}
                </span>
                <span v-else class="detail__availability detail__availability--no">
                  {{ t('products.details.unavailable') }}
                </span>
              </dd>
            </div>
          </dl>

          <div v-if="otherVendors.length" class="detail__vendors">
            <p class="detail__vendors-title">{{ t('products.details.otherVendors') }}</p>
            <ul class="detail__vendors-list">
              <li v-for="vendor in otherVendors" :key="vendor.inventoryUserId" class="detail__vendors-item">
                <span class="detail__vendors-name">{{ vendor.inventoryName }}</span>
                <span class="detail__vendors-price">{{ formatPrice(vendor.effectiveSalesPrice) }} {{ t('products.currency') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section v-if="displayDescription" class="detail__description">
        <h2 class="detail__description-title">{{ t('products.details.description') }}</h2>
        <p class="detail__description-text">{{ displayDescription }}</p>
      </section>
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

.page__back svg {
  color: currentcolor;
}

html[dir='rtl'] .page__back svg {
  transform: scaleX(-1);
}

.page__loading {
  display: grid;
  grid-template-columns: minmax(0, 22rem) 1fr;
  gap: 2rem;
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

.skeleton {
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-detail--media {
  aspect-ratio: 1;
  border-radius: var(--dz-radius-lg);
}

.skeleton-detail__lines {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.skeleton-detail__line {
  height: 0.9rem;
  width: 70%;
}

.skeleton-detail__line--wide {
  height: 1.2rem;
  width: 100%;
}

.skeleton-detail__line--short {
  width: 45%;
}

.detail {
  display: grid;
  grid-template-columns: minmax(0, 22rem) 1fr;
  gap: 2rem;
  align-items: start;
}

.detail__media {
  position: relative;
  background:
    radial-gradient(14rem 10rem at 50% 115%, var(--dz-primary-soft) 0%, transparent 70%),
    var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  overflow: hidden;
}

.detail__main {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  display: block;
}

.detail__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  color: var(--dz-border-strong);
}

.detail__thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem;
  border-top: 1px solid var(--dz-border);
  background: var(--dz-surface);
}

.detail__thumb {
  width: 3.4rem;
  height: 3.4rem;
  padding: 0;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.detail__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail__thumb--active {
  border-color: var(--dz-primary);
  box-shadow: var(--dz-ring);
}

.detail__info {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 0;
}

.detail__name {
  font-family: var(--dz-font-display);
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.detail__code {
  font-family: var(--dz-font-mono);
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.detail__price-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.detail__price {
  font-family: var(--dz-font-display);
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  letter-spacing: -0.01em;
}

.detail__currency {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.detail__price-old {
  font-size: 1rem;
  color: var(--dz-muted);
  text-decoration: line-through;
}

.detail__sale {
  padding: 0.25rem 0.65rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger);
  color: var(--dz-white);
  font-size: 0.72rem;
  font-weight: 700;
}

.detail__meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.detail__stock {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-success);
}

.detail__stock--out {
  color: var(--dz-danger);
}

.detail__max {
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.detail__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.6rem;
  margin-top: 0.6rem;
  padding: 0.9rem 1rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
}

.detail__fact dt {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dz-muted);
}

.detail__fact dd {
  margin-top: 0.25rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.detail__availability {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.detail__availability--yes {
  color: var(--dz-success);
}

.detail__availability--no {
  color: var(--dz-danger);
}

.detail__vendors {
  margin-top: 0.6rem;
}

.detail__vendors-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-muted);
  margin-bottom: 0.5rem;
}

.detail__vendors-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.detail__vendors-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.55rem 0.9rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
}

.detail__vendors-name {
  font-size: 0.85rem;
  font-weight: 600;
}

.detail__vendors-price {
  font-family: var(--dz-font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.detail__description {
  margin-top: 2.5rem;
}

.detail__description-title {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.detail__description-text {
  font-size: 0.92rem;
  line-height: 1.75;
  color: var(--dz-ink-soft);
  white-space: pre-line;
  max-width: 75ch;
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

@media (max-width: 720px) {
  .detail,
  .page__loading {
    grid-template-columns: 1fr;
  }
}
</style>