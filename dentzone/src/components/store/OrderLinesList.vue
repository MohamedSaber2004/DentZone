<script setup lang="ts">
import ProductImage from '../ui/ProductImage.vue'
import PriceTag from '../ui/PriceTag.vue'

export interface OrderLineView {
  product: {
    name: string
    brand?: string
    price: number
    image: string
  }
  quantity: number
}

defineProps<{
  lines: OrderLineView[]
}>()
</script>

<template>
  <ul class="order-lines">
    <li v-for="line in lines" :key="line.product.name" class="order-lines__line">
      <ProductImage :product="line.product" size="sm" />
      <div class="order-lines__info">
        <span class="order-lines__name">{{ line.product.name }}</span>
        <span class="order-lines__meta">
          {{ line.product.brand ? `${line.product.brand} · ` : '' }}Qty {{ line.quantity }}
        </span>
      </div>
      <PriceTag :price="line.product.price * line.quantity" size="sm" class="order-lines__price" />
    </li>
  </ul>
</template>

<style scoped>
.order-lines {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.order-lines__line {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.order-lines__info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.order-lines__name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-lines__meta {
  font-size: 0.78rem;
  color: var(--dz-muted);
}

.order-lines__price {
  flex-shrink: 0;
}
</style>