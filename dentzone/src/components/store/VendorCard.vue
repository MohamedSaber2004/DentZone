<script setup lang="ts">
import { computed } from 'vue'
import type { Vendor } from '../../domain/models/vendor'
import { t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  vendor: Vendor
}>()

const productLabel = computed(() =>
  t('vendors.productCount', { count: props.vendor.productCount }),
)
</script>

<template>
  <RouterLink :to="`/vendor/${vendor.slug}`" class="vendor-card">
    <div class="vendor-card__top">
      <span class="vendor-card__logo" :style="{ '--tint': vendor.tint }">{{ vendor.emoji }}</span>
      <span v-if="vendor.verified" class="vendor-card__verified" :title="t('vendors.verified')">
        <AppIcon name="check-circle" :size="14" />
      </span>
    </div>
    <h3 class="vendor-card__name">{{ vendor.name }}</h3>
    <p class="vendor-card__tagline">{{ vendor.tagline }}</p>
    <p class="vendor-card__description">{{ vendor.description }}</p>
    <div class="vendor-card__footer">
      <span class="vendor-card__rating">
        <span class="vendor-card__stars">★</span>
        {{ vendor.rating.toFixed(1) }}
        <span class="vendor-card__reviews">({{ vendor.reviewCount }})</span>
      </span>
      <span class="vendor-card__count">
        <AppIcon name="box" :size="14" />
        {{ productLabel }}
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.vendor-card {
  display: flex;
  flex-direction: column;
  padding: 1.35rem 1.25rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}

.vendor-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--dz-shadow);
  border-color: var(--dz-primary-soft);
}

.vendor-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.vendor-card__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  font-size: 1.6rem;
  border-radius: var(--dz-radius);
  background: color-mix(in srgb, var(--tint) 14%, white);
}

.vendor-card__verified {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.vendor-card__name {
  font-size: 1.05rem;
}

.vendor-card__tagline {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
}

.vendor-card__description {
  margin-top: 0.5rem;
  font-size: 0.82rem;
  color: var(--dz-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vendor-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--dz-border);
}

.vendor-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-ink);
}

.vendor-card__stars {
  color: var(--dz-star);
}

.vendor-card__reviews {
  font-weight: 500;
  color: var(--dz-muted);
}

.vendor-card__count {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.vendor-card__count svg {
  color: var(--dz-primary);
}
</style>