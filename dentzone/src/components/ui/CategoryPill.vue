<script setup lang="ts">
import type { Category } from '../../domain/models/category'
import AppIcon, { type IconName } from './AppIcon.vue'

withDefaults(
  defineProps<{
    category: Category
    active?: boolean
    variant?: 'chip' | 'card'
  }>(),
  { active: false, variant: 'chip' },
)

const emit = defineEmits<{
  select: [category: Category]
}>()

const categoryIcons: Record<string, IconName> = {
  '': 'store',
  'cat-toothbrushes': 'brush',
  'cat-toothpaste': 'tube',
  'cat-mouthwash': 'droplet',
  'cat-floss': 'floss',
  'cat-whitening': 'sparkles',
  'cat-accessories': 'box',
}
</script>

<template>
  <button
    class="category-pill"
    :class="[`category-pill--${variant}`, { 'category-pill--active': active }]"
    type="button"
    @click="emit('select', category)"
  >
    <span class="category-pill__icon" :style="{ '--tint': category.tint }">
      <AppIcon :name="categoryIcons[category.id] ?? 'box'" :size="variant === 'card' ? 20 : 15" />
    </span>
    <span class="category-pill__label">
      <span class="category-pill__name">{{ category.name }}</span>
      <span v-if="variant === 'card'" class="category-pill__description">{{ category.description }}</span>
    </span>
  </button>
</template>

<style scoped>
.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s,
    transform 0.15s,
    box-shadow 0.2s;
  white-space: nowrap;
}

.category-pill:hover {
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.category-pill--active {
  background: var(--dz-primary);
  border-color: var(--dz-primary);
  color: var(--dz-on-primary);
}

.category-pill--active .category-pill__name {
  color: var(--dz-on-primary);
}

.category-pill--active .category-pill__icon {
  color: var(--dz-on-primary);
}

.category-pill__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: color-mix(in srgb, var(--tint) 14%, var(--dz-surface-soft));
  color: var(--dz-primary);
}

.category-pill--card {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 1.4rem 1.25rem;
  border-radius: var(--dz-radius-lg);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  text-align: left;
  white-space: normal;
  width: 100%;
}

.category-pill--card:hover {
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow);
}

.category-pill--card.category-pill--active {
  background: var(--dz-surface);
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow);
}

.category-pill--card .category-pill__icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--dz-radius);
  color: var(--dz-primary);
}

.category-pill--card.category-pill--active .category-pill__name {
  color: var(--dz-primary-strong);
}

.category-pill__label {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.category-pill__name {
  font-family: var(--dz-font-display);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.category-pill--card.category-pill--active .category-pill__name {
  color: var(--dz-primary-strong);
}

.category-pill__description {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--dz-muted);
  line-height: 1.45;
}

html[dir='rtl'] .category-pill--card {
  text-align: right;
}
</style>
