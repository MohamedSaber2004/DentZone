<script setup lang="ts">
import type { Product } from '../../domain/models/product'
import ProductCard from './ProductCard.vue'

defineProps<{
  products: Product[]
}>()
</script>

<template>
  <div class="product-grid">
    <ProductCard
      v-for="(product, index) in products"
      :key="product.id"
      :product="product"
      class="product-grid__item"
      :style="{ animationDelay: `${Math.min(index, 8) * 55}ms` }"
    />
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}

.product-grid__item {
  animation: product-grid-in 0.45s ease both;
}

@keyframes product-grid-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-grid__item {
    animation: none;
  }
}

@media (max-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.9rem;
  }
}
</style>