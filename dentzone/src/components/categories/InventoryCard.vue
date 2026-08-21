<script setup lang="ts">
import type { InventoryDto } from '../../domain/models/category'
import { t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    inventory: InventoryDto
    categoryId?: string
    categoryName?: string
  }>(),
  { categoryId: '', categoryName: '' },
)

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

const linkTo = () => {
  const query: Record<string, string> = { supplier: props.inventory.fullName }
  if (props.categoryName) query.name = props.categoryName
  if (props.categoryId) query.cat = props.categoryId
  return { name: 'inventory-products', params: { inventoryUserId: props.inventory.inventoryId }, query }
}</script>

<template>
  <RouterLink :to="linkTo()" class="inventory-card">
    <span class="inventory-card__avatar">
      <AppIcon v-if="!initials(inventory.fullName)" name="store" :size="22" />
      <template v-else>{{ initials(inventory.fullName) }}</template>
    </span>

    <div class="inventory-card__body">
      <div class="inventory-card__head">
        <h3 class="inventory-card__name">{{ inventory.fullName }}</h3>
        <span
          class="inventory-card__badge"
          :class="inventory.isAvailableNow ? 'inventory-card__badge--on' : 'inventory-card__badge--off'"
        >
          <AppIcon name="check" :size="12" />
          {{ inventory.isAvailableNow ? t('categories.available') : t('categories.notAvailable') }}
        </span>
      </div>

      <ul class="inventory-card__meta">
        <li v-if="inventory.addresses">
          <AppIcon name="map-pin" :size="14" />
          <span>{{ inventory.addresses }}</span>
        </li>
        <li v-if="inventory.phoneNumber">
          <AppIcon name="phone" :size="14" />
          <span dir="ltr">{{ inventory.phoneNumber }}</span>
        </li>
        <li v-if="inventory.email">
          <AppIcon name="mail" :size="14" />
          <span dir="ltr">{{ inventory.email }}</span>
        </li>
      </ul>
    </div>

    <span class="inventory-card__arrow">
      <AppIcon name="chevron-right" :size="18" />
    </span>
  </RouterLink>
</template>

<style scoped>
.inventory-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.2rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.inventory-card:hover {
  transform: translateY(-2px);
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow);
}

.inventory-card:focus-visible {
  outline: none;
  box-shadow: var(--dz-ring);
}

.inventory-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-family: var(--dz-font-display);
  font-size: 0.95rem;
  font-weight: 700;
}

.inventory-card__body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.inventory-card__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.inventory-card__name {
  font-family: var(--dz-font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.inventory-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: var(--dz-radius-full);
  font-size: 0.7rem;
  font-weight: 700;
}

.inventory-card__badge--on {
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.inventory-card__badge--off {
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
}

.inventory-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inventory-card__meta li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: var(--dz-muted);
  min-width: 0;
}

.inventory-card__meta li svg {
  color: var(--dz-primary);
  flex-shrink: 0;
}

.inventory-card__meta li span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inventory-card__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
}

html[dir='rtl'] .inventory-card__arrow svg {
  transform: scaleX(-1);
}

@media (max-width: 560px) {
  .inventory-card {
    padding: 0.85rem 0.95rem;
    gap: 0.75rem;
  }

  .inventory-card__avatar {
    width: 2.6rem;
    height: 2.6rem;
    font-size: 0.85rem;
  }

  .inventory-card__name {
    font-size: 0.92rem;
  }

  .inventory-card__arrow {
    width: 1.85rem;
    height: 1.85rem;
  }
}
</style>