<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    price: number
    compareAtPrice?: number
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const formattedPrice = computed(() => formatter.format(props.price))
const formattedCompareAt = computed(() => (props.compareAtPrice ? formatter.format(props.compareAtPrice) : ''))
const savingsPercent = computed(() =>
  props.compareAtPrice ? Math.round(((props.compareAtPrice - props.price) / props.compareAtPrice) * 100) : 0,
)
</script>

<template>
  <div class="price-tag" :class="`price-tag--${size}`">
    <span class="price-tag__current">{{ formattedPrice }}</span>
    <span v-if="compareAtPrice" class="price-tag__compare">{{ formattedCompareAt }}</span>
    <span v-if="compareAtPrice" class="price-tag__savings">-{{ savingsPercent }}%</span>
  </div>
</template>

<style scoped>
.price-tag {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.price-tag__current {
  font-family: var(--dz-font-mono);
  font-weight: 600;
  color: var(--dz-ink);
  letter-spacing: -0.01em;
}

.price-tag--sm .price-tag__current {
  font-size: 0.9rem;
}

.price-tag--md .price-tag__current {
  font-size: 1.05rem;
}

.price-tag--lg .price-tag__current {
  font-size: 1.5rem;
}

.price-tag__compare {
  color: var(--dz-muted);
  text-decoration: line-through;
}

.price-tag--sm .price-tag__compare {
  font-size: 0.78rem;
}

.price-tag--md .price-tag__compare,
.price-tag--lg .price-tag__compare {
  font-size: 0.9rem;
}

.price-tag__savings {
  font-family: var(--dz-font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--dz-gold-strong);
  background: var(--dz-gold-soft);
  padding: 0.1rem 0.45rem;
  border-radius: var(--dz-radius-full);
}
</style>