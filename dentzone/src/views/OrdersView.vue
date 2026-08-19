<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted } from 'vue'
const { orderService, authService } = services
import { formatPrice, locale, t, type MessageKey } from '../i18n'
import type { OrderStatus } from '../domain/models/order'
import SectionHeader from '../components/ui/SectionHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import AppBadge from '../components/ui/AppBadge.vue'
import AppIcon from '../components/ui/AppIcon.vue'

const orders = computed(() => orderService.orders.value)
const loading = computed(() => orderService.loading.value)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const statusKey = (status: OrderStatus): MessageKey =>
  `confirmation.status${status.charAt(0).toUpperCase()}${status.slice(1)}` as MessageKey

const statusTone = (status: OrderStatus): 'success' | 'primary' | 'warning' | 'neutral' => {
  switch (status) {
    case 'confirmed':
      return 'primary'
    case 'processing':
      return 'warning'
    case 'shipped':
      return 'success'
    case 'delivered':
      return 'success'
  }
}

onMounted(async () => {
  if (!authService.isAuthenticated) return
  try {
    await orderService.fetchOrders()
  } catch {
    // Handled gracefully in orderService
  }
})
</script>

<template>
  <div class="container page">
    <SectionHeader :title="t('orders.title')" :subtitle="t('orders.subtitle', { count: orders.length })" />

    <div v-if="loading" class="orders__loading" role="status">
      <SkeletonLoader variant="rows" :count="3" />
    </div>

    <EmptyState
      v-else-if="orders.length === 0"
      icon="box"
      :title="t('orders.emptyTitle')"
      :description="t('orders.emptyDescription')"
    >
      <template #action>
        <RouterLink to="/catalog">
          <AppButton>{{ t('orders.browseProducts') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>

    <ul v-else class="orders__list">
      <li v-for="order in orders" :key="order.id" class="orders__item">
        <RouterLink :to="`/order/${order.id}`" class="orders__link">
          <div class="orders__head">
            <div class="orders__identity">
              <span class="orders__number">{{ order.orderNumber }}</span>
              <span class="orders__date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <AppBadge :tone="statusTone(order.status)" size="md">{{ t(statusKey(order.status)) }}</AppBadge>
          </div>
          <div class="orders__foot">
            <span class="orders__count">
              <AppIcon name="box" :size="15" />
              {{ t('orders.itemsCount', { count: order.lines.reduce((sum, line) => sum + line.quantity, 0) }) }}
            </span>
            <span class="orders__total">{{ formatPrice(order.totals.total) }}</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.orders__loading {
  padding-top: 0.25rem;
}

.orders__list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.orders__item {
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.orders__item:hover {
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow-sm);
}

.orders__link {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.15rem 1.4rem;
}

.orders__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.orders__identity {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.orders__number {
  font-family: var(--dz-font-mono);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--dz-primary-strong);
}

.orders__date {
  font-size: 0.82rem;
  color: var(--dz-muted);
}

.orders__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.orders__count {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.orders__count svg {
  color: var(--dz-primary);
}

.orders__total {
  font-family: var(--dz-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--dz-ink);
}
</style>