<script setup lang="ts">
import type { Advertisement } from '../../domain/models/advertisement'
import PromotionalBanner from './PromotionalBanner.vue'

defineProps<{
  advertisements: Advertisement[]
}>()
</script>

<template>
  <div v-if="advertisements.length" class="promo-grid">
    <PromotionalBanner
      v-for="advertisement in advertisements"
      :key="advertisement.id"
      :advertisement="advertisement"
    />
  </div>
</template>

<style scoped>
.promo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

@media (max-width: 800px) {
  .promo-grid {
    grid-template-columns: 1fr;
  }
}
</style>