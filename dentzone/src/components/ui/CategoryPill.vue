<script setup lang="ts">
import type { Category } from '../../domain/models/category'

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
</script>

<template>
  <button
    class="category-pill"
    :class="[`category-pill--${variant}`, { 'category-pill--active': active }]"
    type="button"
    @click="emit('select', category)"
  >
    <span class="category-pill__emoji" :style="{ '--tint': category.tint }">{{ category.emoji }}</span>
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
  color: var(--dz-white);
}

.category-pill__emoji {
  font-size: 1rem;
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

.category-pill--card .category-pill__emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
  border-radius: var(--dz-radius);
  background: color-mix(in srgb, var(--tint) 14%, white);
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
  font-size: 0.95rem;
  font-weight: 700;
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
</style>