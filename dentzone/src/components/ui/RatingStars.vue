<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    rating: number
    reviewCount?: number
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

type StarFill = 'full' | 'partial' | 'empty'

const starFills = computed<StarFill[]>(() =>
  Array.from({ length: 5 }, (_, index) => {
    const fill = Math.min(1, Math.max(0, props.rating - index))
    if (fill >= 1) return 'full'
    if (fill > 0) return 'partial'
    return 'empty'
  }),
)

const partialPercent = computed(() => {
  const remainder = props.rating - Math.floor(props.rating)
  return `${Math.round(remainder * 100)}%`
})
</script>

<template>
  <div class="rating-stars" :class="`rating-stars--${size}`" :aria-label="`Rated ${rating} out of 5`">
    <div class="rating-stars__row">
      <span
        v-for="(fill, index) in starFills"
        :key="index"
        class="rating-stars__star"
        :class="[`rating-stars__star--${fill}`, { 'rating-stars__star--partial': fill === 'partial' }]"
        :style="fill === 'partial' ? { '--fill': partialPercent } : undefined"
      >
        ★
      </span>
    </div>
    <span v-if="reviewCount !== undefined" class="rating-stars__count">({{ reviewCount.toLocaleString() }})</span>
  </div>
</template>

<style scoped>
.rating-stars {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.rating-stars__row {
  display: inline-flex;
  gap: 2px;
}

.rating-stars__star {
  color: var(--dz-star-track);
}

.rating-stars__star--full {
  color: var(--dz-star);
}

.rating-stars__star--partial {
  background: linear-gradient(90deg, var(--dz-star) var(--fill), var(--dz-star-track) var(--fill));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.rating-stars--sm .rating-stars__star {
  font-size: 0.8rem;
}

.rating-stars--md .rating-stars__star {
  font-size: 0.95rem;
}

.rating-stars__count {
  color: var(--dz-muted);
  font-size: 0.8rem;
}
</style>