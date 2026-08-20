<script setup lang="ts">
import type { ProviderProductDto } from '../../domain/models/product'
import { locale, t } from '../../i18n'
import { ref } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
import { authService } from '../../di/container'

import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  product: ProviderProductDto
  detailsTo?: RouteLocationRaw
  favorite?: boolean
  favoriteBusy?: boolean
  providerCount?: number
}>()

const emit = defineEmits<{
  (e: 'toggle-favorite', product: ProviderProductDto): void
  (e: 'add-to-cart', product: ProviderProductDto): void
}>()

const imageFailed = ref(false)

const onImageError = () => {
  imageFailed.value = true
}

const displayName = (product: ProviderProductDto) =>
  locale.value === 'ar' ? product.productArabicName || product.productName : product.productName || product.preef

const displayCode = (product: ProviderProductDto) => product.productCode

const formatPrice = (value: number) => value.toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 })
</script>

<template>
  <article class="product-card">
    <div class="product-card__media">
      <RouterLink v-if="detailsTo" :to="detailsTo" class="product-card__media-link">
        <img
          v-if="product.images?.length && !imageFailed"
          :src="product.images[0]"
          :alt="displayName(product)"
          loading="lazy"
          @error="onImageError"
        />
        <span v-else class="product-card__placeholder">
          <AppIcon name="package" :size="34" />
        </span>
      </RouterLink>
      <template v-else>
        <img
          v-if="product.images?.length && !imageFailed"
          :src="product.images[0]"
          :alt="displayName(product)"
          loading="lazy"
          @error="onImageError"
        />
        <span v-else class="product-card__placeholder">
          <AppIcon name="package" :size="34" />
        </span>
      </template>

      <div class="product-card__media-actions">
        <button
          v-if="favorite !== undefined"
          type="button"
          class="product-card__favorite"
          :class="{ 'product-card__favorite--active': favorite }"
          :aria-label="t('nav.wishlist')"
          :aria-pressed="favorite"
          :disabled="favoriteBusy"
          @click.stop="emit('toggle-favorite', product)"
        >
          <AppIcon name="heart" :size="16" />
        </button>
        <button
          v-if="authService.isAuthenticated"
          type="button"
          class="product-card__cart"
          :aria-label="t('product.addToCart')"
          :disabled="product.stockQuantity <= 0"
          @click.stop="emit('add-to-cart', product)"
        >
          <AppIcon name="cart" :size="16" />
        </button>
        <RouterLink
          v-if="detailsTo"
          :to="detailsTo"
          class="product-card__details"
          :aria-label="t('products.details.title')"
        >
          <AppIcon name="eye" :size="15" />
        </RouterLink>
      </div>
      <span v-if="product.isFlashSaleActive" class="product-card__sale">
        {{ t('products.sale') }}
      </span>
    </div>

    <div class="product-card__body">
      <RouterLink v-if="detailsTo" :to="detailsTo" class="product-card__name-link">
        <h3 class="product-card__name">{{ displayName(product) }}</h3>
      </RouterLink>
      <h3 v-else class="product-card__name">{{ displayName(product) }}</h3>

      <p v-if="displayCode(product)" class="product-card__code">{{ t('products.code') }}: {{ displayCode(product) }}</p>

      <div v-if="providerCount || product.inventoryUserName" class="product-card__provider">
        <AppIcon name="store" :size="13" />
        <span>{{ providerCount && providerCount > 1 ? t('home.availableFromProviders', { count: providerCount }) : (product.inventoryUserName || t('home.singleProvider')) }}</span>
      </div>

      <div class="product-card__price-row">
        <span
          v-if="product.isFlashSaleActive"
          class="product-card__price-old"
        >
          {{ formatPrice(product.priceBeforeFlashSale) }}
        </span>
        <strong class="product-card__price">{{ formatPrice(product.effectiveSalesPrice) }}</strong>
        <span class="product-card__currency">{{ t('products.currency') }}</span>
      </div>

      <div class="product-card__meta">
        <span v-if="product.stockQuantity > 0" class="product-card__stock">
          <AppIcon name="check" :size="13" />
          {{ t('products.inStock', { count: product.stockQuantity }) }}
        </span>
        <span v-else class="product-card__stock product-card__stock--out">
          {{ t('products.outOfStock') }}
        </span>
        <span v-if="product.maxQuantity > 0" class="product-card__max">
          {{ t('products.maxPerOrder', { count: product.maxQuantity }) }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  overflow: hidden;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-3px);
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow);
}

.product-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 9rem;
  background:
    radial-gradient(12rem 8rem at 50% 115%, var(--dz-primary-soft) 0%, transparent 70%),
    var(--dz-surface-soft);
}

.product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  color: var(--dz-primary);
  box-shadow: var(--dz-shadow-sm);
}

.product-card__sale {
  position: absolute;
  top: 0.7rem;
  inset-inline-start: 0.7rem;
  padding: 0.25rem 0.65rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger);
  color: var(--dz-white);
  font-size: 0.7rem;
  font-weight: 700;
}

.product-card__media-actions {
  position: absolute;
  top: 0.7rem;
  inset-inline-end: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  z-index: 2;
}

.product-card__details,
.product-card__favorite,
.product-card__cart {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: var(--dz-radius-full);
  background: rgb(255 255 255 / 0.85);
  color: var(--dz-ink-soft);
  box-shadow: var(--dz-shadow-sm);
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.product-card__favorite,
.product-card__cart {
  border: none;
  cursor: pointer;
}

.product-card__details:hover {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  transform: translateY(-1px);
}

.product-card__favorite:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
  transform: translateY(-1px);
}

.product-card__cart:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.product-card__favorite--active {
  background: var(--dz-danger);
  color: var(--dz-white);
}

.product-card__favorite:disabled,
.product-card__cart:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.product-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem 1.1rem 1.15rem;
  flex: 1;
}

.product-card__name {
  font-family: var(--dz-font-display);
  font-size: 0.98rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dz-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.5em;
}

.product-card__code {
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  color: var(--dz-muted);
}

.product-card__media-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.product-card__name-link {
  text-decoration: none;
  color: inherit;
}

.product-card__name-link:hover .product-card__name {
  color: var(--dz-primary);
}

.product-card__provider {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.73rem;
  font-weight: 600;
  width: fit-content;
}

.product-card__provider svg {
  color: currentColor;
  flex-shrink: 0;
}

.product-card__price-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.product-card__price {
  font-family: var(--dz-font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  letter-spacing: -0.01em;
}

.product-card__currency {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.product-card__price-old {
  font-size: 0.85rem;
  color: var(--dz-muted);
  text-decoration: line-through;
}

.product-card__meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--dz-border);
}

.product-card__stock {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--dz-success);
}

.product-card__stock--out {
  color: var(--dz-danger);
}

.product-card__max {
  font-size: 0.75rem;
  color: var(--dz-muted);
}
</style>