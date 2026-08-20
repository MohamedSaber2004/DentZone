<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { locale, t } from '../i18n'
import { API_LANG } from '../config/api.config'
import { ApiError } from '../infrastructure/http/api-error'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import type { ProductDetailDto, ProductPriceDto } from '../domain/models/product'

const route = useRoute()
const router = useRouter()
const { productRepository, policyRepository, authService, cartService } = services

const productId = () => (typeof route.params.productId === 'string' ? route.params.productId : '')
const inventoryUserId = () =>
  typeof route.params.inventoryUserId === 'string' ? route.params.inventoryUserId : ''

const lang = computed(() => (locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH))

const detail = ref<ProductDetailDto | null>(null)
const loading = ref(true)
const error = ref(false)
const activeImage = ref(0)
const imageFailed = ref(false)

const backToProducts = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
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
  favorite.value = false
  quantity.value = 1
  try {
    detail.value = await productRepository.getProductById(productId(), lang.value)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      void router.push({ name: 'login', query: { redirect: route.fullPath } })
      return
    }
    error.value = true
  } finally {
    loading.value = false
  }
  void seedFavorite()
}

const seedFavorite = async () => {
  if (!authService.user.value) return
  const price = currentPrice.value
  if (!price) return
  try {
    const list = await productRepository.getMyFavorites()
    favorite.value = list.some((p) => p.productId === price.productId && p.productPriceId === price.id)
  } catch {
    // Favorites are a secondary enhancement; a failed load keeps the heart un-favorited.
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

const formatPrice = (value: number | null | undefined) =>
  value == null ? '' : value.toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 })

const onImageError = () => {
  imageFailed.value = true
}

const onThumbnailError = (index: number) => {
  if (index === activeImage.value) imageFailed.value = true
}

const activeTab = ref<'description' | 'refund'>('description')
const refundHtml = ref('')
const refundLoading = ref(false)
const refundFailed = ref(false)
const refundLoadedLocale = ref('')
const refundFrameRef = ref<HTMLIFrameElement | null>(null)
const favorite = ref(false)
const favoriteBusy = ref(false)
const quantity = ref(1)

const cartLimit = computed(() => {
  const price = currentPrice.value
  if (!price) return 1
  const stock = price.stockQuantity > 0 ? price.stockQuantity : Number.POSITIVE_INFINITY
  const max = price.maxQuantity > 0 ? price.maxQuantity : Number.POSITIVE_INFINITY
  const limit = Math.min(stock, max)
  return Number.isFinite(limit) ? limit : 1
})

const decrementQty = () => {
  if (quantity.value > 1) quantity.value -= 1
}

const incrementQty = () => {
  if (quantity.value < cartLimit.value) quantity.value += 1
}

const addToCart = () => {
  const d = detail.value
  const price = currentPrice.value
  if (!d || !price || price.stockQuantity <= 0) return
  void cartService.add({
    productId: price.productId,
    inventoryId: price.inventoryUserId,
    quantity: quantity.value,
    name: d.productName,
    stockQuantity: price.stockQuantity,
    maxQuantity: price.maxQuantity,
  })
}

const toggleFavorite = async () => {
  const user = authService.user.value
  const price = currentPrice.value
  if (!user || !price || favoriteBusy.value) return
  favoriteBusy.value = true
  const previous = favorite.value
  favorite.value = !previous
  try {
    await productRepository.toggleFavorite(user.id, price.productId, price.id)
  } catch {
    favorite.value = previous
  } finally {
    favoriteBusy.value = false
  }
}

const fetchRefundPolicy = (lang: number): Promise<string> => policyRepository.getRefundPolicy(lang)

const openRefundTab = async () => {
  activeTab.value = 'refund'
  if (refundLoadedLocale.value === locale.value && !refundFailed.value) return
  refundLoading.value = true
  refundFailed.value = false
  try {
    try {
      refundHtml.value = await fetchRefundPolicy(locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH)
    } catch {
      refundHtml.value = await fetchRefundPolicy(API_LANG.ARABIC)
    }
    refundLoadedLocale.value = locale.value
  } catch {
    refundFailed.value = true
  } finally {
    refundLoading.value = false
  }
}

const resizeRefundFrame = () => {
  const frame = refundFrameRef.value
  const doc = frame?.contentDocument
  if (frame && doc) {
    const height = Math.max(doc.body?.scrollHeight ?? 0, doc.documentElement?.scrollHeight ?? 0)
    frame.style.height = `${Math.max(height, 320)}px`
  }
}

watch(locale, () => {
  refundLoadedLocale.value = ''
  if (activeTab.value === 'refund') void openRefundTab()
})

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
            <button
              type="button"
              class="detail__favorite"
              :class="{ 'detail__favorite--active': favorite }"
              :aria-pressed="favorite"
              :aria-label="t('nav.wishlist')"
              :disabled="favoriteBusy || !currentPrice"
              @click="toggleFavorite"
            >
              <AppIcon name="heart" :size="19" />
            </button>
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

          <div class="detail__buy">
            <div class="detail__stepper" role="group" :aria-label="t('product.addToCart')">
              <button
                type="button"
                class="detail__stepper-btn"
                :disabled="quantity <= 1 || (currentPrice && currentPrice.stockQuantity <= 0) || !currentPrice"
                :aria-label="t('cart.title')"
                @click="decrementQty"
              >
                <AppIcon name="minus" :size="14" />
              </button>
              <span class="detail__stepper-value">{{ quantity }}</span>
              <button
                type="button"
                class="detail__stepper-btn"
                :disabled="quantity >= cartLimit || (currentPrice && currentPrice.stockQuantity <= 0) || !currentPrice"
                :aria-label="t('cart.title')"
                @click="incrementQty"
              >
                <AppIcon name="plus" :size="14" />
              </button>
            </div>
            <AppButton
              variant="primary"
              class="detail__add"
              :disabled="!currentPrice || currentPrice.stockQuantity <= 0"
              @click="addToCart"
            >
              <AppIcon name="cart" :size="16" />
              {{ t('product.addToCart') }}
            </AppButton>
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
        </div>
      </div>

      <div v-if="displayDescription" class="detail__tabs">
        <div class="detail__tabs-bar" role="tablist">
          <button
            v-if="displayDescription"
            type="button"
            role="tab"
            class="detail__tab"
            :class="{ 'detail__tab--active': activeTab === 'description' }"
            :aria-selected="activeTab === 'description'"
            @click="activeTab = 'description'"
          >
            {{ t('products.details.description') }}
          </button>
          <button
            type="button"
            role="tab"
            class="detail__tab"
            :class="{ 'detail__tab--active': activeTab === 'refund' }"
            :aria-selected="activeTab === 'refund'"
            @click="openRefundTab"
          >
            {{ t('products.details.refundPolicy') }}
          </button>
        </div>

        <div v-if="activeTab === 'description' && displayDescription" class="detail__tab-panel">
          <p class="detail__description-text">{{ displayDescription }}</p>
        </div>

        <div v-else-if="activeTab === 'refund'" class="detail__tab-panel">
          <div v-if="refundLoading" class="detail__refund-skeleton" aria-label="Loading">
            <span class="detail__skeleton-line" />
            <span class="detail__skeleton-line" />
            <span class="detail__skeleton-line detail__skeleton-line--short" />
            <span class="detail__skeleton-line" />
          </div>
          <div v-else-if="refundFailed" class="detail__refund-error">
            <span class="detail__refund-error-icon"><AppIcon name="alert-circle" :size="20" /></span>
            <p>{{ t('policy.errorTitle') }}</p>
            <AppButton variant="primary" @click="openRefundTab">
              <AppIcon name="refresh" :size="14" />
              {{ t('categories.retry') }}
            </AppButton>
          </div>
          <iframe
            v-else-if="refundHtml"
            ref="refundFrameRef"
            class="detail__refund-frame"
            sandbox="allow-same-origin"
            :srcdoc="refundHtml"
            :title="t('products.details.refundPolicy')"
            @load="resizeRefundFrame"
          />
        </div>
      </div>
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

.detail__favorite {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  margin-inline-start: auto;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  color: var(--dz-muted);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s,
    transform 0.15s;
}

.detail__favorite:hover {
  border-color: var(--dz-danger);
  color: var(--dz-danger);
  transform: translateY(-1px);
}

.detail__favorite--active {
  background: var(--dz-danger-soft);
  border-color: var(--dz-danger);
  color: var(--dz-danger);
}

.detail__favorite:disabled {
  opacity: 0.6;
  cursor: wait;
  transform: none;
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

.detail__buy {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.detail__stepper {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  padding: 0.25rem;
  background: var(--dz-surface);
}

.detail__stepper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.detail__stepper-btn:hover:not(:disabled) {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.detail__stepper-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.detail__stepper-value {
  min-width: 1.8rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.95rem;
}

.detail__add {
  min-width: 11rem;
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

.detail__tabs {
  margin-top: 2.5rem;
}

.detail__tabs-bar {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--dz-border);
  margin-bottom: 1.25rem;
}

.detail__tab {
  padding: 0.65rem 1.1rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-muted);
  transition:
    color 0.2s,
    border-color 0.2s;
}

.detail__tab:hover {
  color: var(--dz-primary-strong);
}

.detail__tab--active {
  color: var(--dz-primary-strong);
  border-bottom-color: var(--dz-primary);
}

.detail__tab-panel {
  min-width: 0;
}

.detail__description-text {
  font-size: 0.92rem;
  line-height: 1.75;
  color: var(--dz-ink-soft);
  white-space: pre-line;
  width: 100%;
}

.detail__refund-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.5rem 0 1rem;
}

.detail__skeleton-line {
  height: 0.9rem;
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.detail__skeleton-line--short {
  width: 65%;
}

.detail__refund-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--dz-muted);
}

.detail__refund-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
  margin-bottom: 0.25rem;
}

.detail__refund-frame {
  display: block;
  width: 100%;
  height: 320px;
  border: 0;
  border-radius: var(--dz-radius);
  background: #fff;
  color-scheme: light;
  overflow: hidden;
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