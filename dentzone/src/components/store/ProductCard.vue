<script setup lang="ts">
import { services } from '../../di/container'
import { computed, ref } from 'vue'
const { cartService, wishlistService } = services
import { useRouter } from 'vue-router'
import type { Product } from '../../domain/models/product'
import { toastService } from '../../infrastructure/feedback/toast.service'
import { t } from '../../i18n'
import ProductImage from '../ui/ProductImage.vue'
import PriceTag from '../ui/PriceTag.vue'
import RatingStars from '../ui/RatingStars.vue'
import AppBadge from '../ui/AppBadge.vue'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  product: Product
}>()

const router = useRouter()

const added = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined

const wished = computed(() => wishlistService.has(props.product.id))

const addToCart = () => {
  if (!props.product.inStock) {
    toastService.error(t('product.outOfStockToast', { name: props.product.name }))
    return
  }
  cartService.add(props.product)
  added.value = true
  toastService.success(t('product.addToast', { name: props.product.name }))
  if (addedTimer) clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    added.value = false
  }, 1200)
}

const toggleWishlist = async () => {
  try {
    const addedToWishlist = await wishlistService.toggle(props.product)
    toastService[addedToWishlist ? 'success' : 'info'](
      addedToWishlist
        ? t('wishlist.addedToast', { name: props.product.name })
        : t('wishlist.removedToast', { name: props.product.name }),
    )
  } catch {
    toastService.error(t('wishlist.errorToast'))
  }
}

const viewProduct = () => {
  void router.push(`/product/${props.product.slug}`)
}
</script>

<template>
  <article class="product-card">
    <div class="product-card__media">
      <ProductImage :product="product" size="md" class="product-card__image" />
      <div class="product-card__overlay" aria-hidden="true">
        <button
          class="product-card__action"
          type="button"
          :aria-label="t('product.viewProduct')"
          :title="t('product.viewProduct')"
          @click="viewProduct"
        >
          <AppIcon name="eye" :size="16" />
        </button>
        <button
          class="product-card__action"
          :class="{ 'product-card__action--active': wished }"
          type="button"
          :aria-label="`Add ${product.name} to wishlist`"
          :title="`Add ${product.name} to wishlist`"
          @click="toggleWishlist"
        >
          <AppIcon name="heart" :size="16" :filled="wished" />
        </button>
      </div>
      <button
        class="product-card__add"
        :class="{ 'product-card__add--added': added }"
        type="button"
        :disabled="added"
        :aria-label="`Add ${product.name} to cart`"
        @click="addToCart"
      >
        <AppIcon v-if="added" name="check" :size="16" />
        <AppIcon v-else name="plus" :size="18" />
      </button>
    </div>

    <div class="product-card__body">
      <div class="product-card__top">
        <AppBadge v-if="!product.inStock" tone="neutral">{{ t('product.outOfStock') }}</AppBadge>
        <span class="product-card__brand">{{ product.brand }}</span>
      </div>

      <h3 class="product-card__name">{{ product.name }}</h3>

      <RatingStars :rating="product.rating" :review-count="product.reviewCount" size="sm" />

      <div class="product-card__footer">
        <PriceTag :price="product.price" :compare-at-price="product.compareAtPrice" size="sm" />
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
  border-radius: var(--dz-radius);
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--dz-shadow);
  border-color: var(--dz-border-strong);
}

.product-card__media {
  position: relative;
}

.product-card__image :deep(.product-image__img) {
  transition: transform 0.35s ease;
}

.product-card:hover .product-card__image :deep(.product-image__img) {
  transform: scale(1.07);
}

.product-card__overlay {
  position: absolute;
  top: 0.6rem;
  inset-inline: 0.6rem;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 0.2s,
    transform 0.2s;
  pointer-events: none;
}

.product-card__overlay .product-card__action {
  pointer-events: auto;
}

.product-card:hover .product-card__overlay,
.product-card:focus-within .product-card__overlay {
  opacity: 1;
  transform: translateY(0);
}

.product-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow-sm);
  color: var(--dz-ink-soft);
  transition:
    transform 0.15s,
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;
}

.product-card__action:hover {
  transform: scale(1.08);
  color: var(--dz-primary-strong);
  border-color: var(--dz-primary);
}

.product-card__action--active {
  color: var(--dz-danger);
  border-color: var(--dz-danger-soft);
  background: var(--dz-danger-soft);
}

.product-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.9rem 1rem 1.05rem;
  flex: 1;
}

.product-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.product-card__brand {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dz-muted);
}

.product-card__name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dz-ink);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 0.4rem;
}

.product-card__add {
  position: absolute;
  inset-inline-end: 0.8rem;
  bottom: 0.8rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-primary);
  transition:
    transform 0.15s,
    box-shadow 0.2s,
    background-color 0.2s;
}

.product-card__add:hover:not(:disabled) {
  transform: scale(1.1);
  background: var(--dz-primary-strong);
  box-shadow: 0 10px 24px rgb(14 43 58 / 0.35);
}

.product-card__add--added {
  background: var(--dz-success);
  box-shadow: 0 8px 22px rgb(22 163 74 / 0.4);
}

.product-card__add:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

@media (hover: none) {
  .product-card__overlay {
    opacity: 1;
    transform: none;
  }
}
</style>