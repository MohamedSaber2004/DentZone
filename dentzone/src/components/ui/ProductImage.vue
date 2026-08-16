<script setup lang="ts">
import type { ProductBadge } from '../../domain/models/product'
import AppBadge from './AppBadge.vue'

export interface ImageSource {
  name: string
  image: string
  badge?: ProductBadge
}

withDefaults(
  defineProps<{
    product: ImageSource
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'md' },
)

const badgeText: Record<string, string> = {
  new: 'New',
  bestseller: 'Bestseller',
  sale: 'Sale',
  eco: 'Eco',
}
</script>

<template>
  <div class="product-image" :class="`product-image--${size}`">
    <img
      class="product-image__img"
      :src="product.image"
      :alt="product.name"
      loading="lazy"
      decoding="async"
    />
    <AppBadge v-if="product.badge" class="product-image__badge" tone="warning">
      {{ badgeText[product.badge] }}
    </AppBadge>
  </div>
</template>

<style scoped>
.product-image {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--dz-radius);
  overflow: hidden;
  background: var(--dz-surface-soft);
}

.product-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-image__badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  z-index: 1;
  box-shadow: var(--dz-shadow-sm);
}

.product-image--sm {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--dz-radius-sm);
}

.product-image--md {
  width: 100%;
  aspect-ratio: 4 / 3;
}

.product-image--lg {
  width: 100%;
  aspect-ratio: 1 / 1;
}

.product-image--xl {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--dz-radius-lg);
}
</style>