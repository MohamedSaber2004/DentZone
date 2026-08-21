<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { services } from '../di/container'
import { t } from '../i18n'
import { OrderStatus } from '../domain/models/order'
import type { GroupedOrderDto } from '../domain/models/order'
import AppIcon from '../components/ui/AppIcon.vue'
import AppButton from '../components/ui/AppButton.vue'

const { orderRepository } = services

const orders = ref<GroupedOrderDto[]>([])
const loading = ref(true)
const error = ref(false)
const activeStatus = ref<number | undefined>(undefined)

const statusFilters: { label: () => string; value: number | undefined }[] = [
  { label: () => t('orders.filterAll'), value: undefined },
  { label: () => t('orders.filterPending'), value: OrderStatus.Pending },
  { label: () => t('orders.filterApproved'), value: OrderStatus.Approved },
  { label: () => t('orders.filterPrepared'), value: OrderStatus.Prepared },
  { label: () => t('orders.filterShipped'), value: OrderStatus.Shipped },
  { label: () => t('orders.filterDelivered'), value: OrderStatus.Delivered },
  { label: () => t('orders.filterCompleted'), value: OrderStatus.Completed },
  { label: () => t('orders.filterRejected'), value: OrderStatus.Rejected },
  { label: () => t('orders.filterCancelled'), value: OrderStatus.Cancel },
]

const load = async () => {
  loading.value = true
  error.value = false
  try {
    orders.value = await orderRepository.getMyOrders(activeStatus.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const selectFilter = async (value: number | undefined) => {
  if (activeStatus.value === value) return
  activeStatus.value = value
  await load()
}

const statusLabel = (status: OrderStatus): string => {
  const map: Record<OrderStatus, string> = {
    [OrderStatus.Pending]: t('orders.statusPending'),
    [OrderStatus.Approved]: t('orders.statusApproved'),
    [OrderStatus.Rejected]: t('orders.statusRejected'),
    [OrderStatus.Prepared]: t('orders.statusPrepared'),
    [OrderStatus.Shipped]: t('orders.statusShipped'),
    [OrderStatus.Delivered]: t('orders.statusDelivered'),
    [OrderStatus.Completed]: t('orders.statusCompleted'),
    [OrderStatus.ReAssignTo]: t('orders.statusReAssign'),
    [OrderStatus.Refund]: t('orders.statusRefund'),
    [OrderStatus.Cancel]: t('orders.statusCancelled'),
  }
  return map[status] ?? String(status)
}

const statusVariant = (status: OrderStatus): string => {
  if (status === OrderStatus.Completed || status === OrderStatus.Delivered) return 'success'
  if (status === OrderStatus.Rejected || status === OrderStatus.Cancel) return 'danger'
  if (status === OrderStatus.Shipped || status === OrderStatus.Approved) return 'primary'
  if (status === OrderStatus.Refund) return 'warning'
  return 'neutral'
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

onMounted(load)
</script>

<template>
  <div class="orders-page">
    <div class="container">
      <div class="orders-page__header">
        <div>
          <h1 class="orders-page__title">{{ t('orders.title') }}</h1>
          <p class="orders-page__subtitle">{{ t('orders.subtitle') }}</p>
        </div>
      </div>

      <div class="orders-page__filters" role="tablist" :aria-label="t('orders.title')">
        <button
          v-for="filter in statusFilters"
          :key="String(filter.value)"
          type="button"
          role="tab"
          class="orders-page__filter"
          :class="{ 'orders-page__filter--active': activeStatus === filter.value }"
          :aria-selected="activeStatus === filter.value"
          @click="selectFilter(filter.value)"
        >
          {{ filter.label() }}
        </button>
      </div>

      <div v-if="loading" class="orders-page__list">
        <div v-for="i in 3" :key="i" class="order-card order-card--skeleton">
          <div class="order-card__skeleton-head" />
          <div class="order-card__skeleton-body">
            <div class="order-card__skeleton-line order-card__skeleton-line--wide" />
            <div class="order-card__skeleton-line" />
            <div class="order-card__skeleton-line order-card__skeleton-line--short" />
          </div>
        </div>
      </div>

      <div v-else-if="error" class="orders-page__state orders-page__state--error" role="alert">
        <span class="orders-page__state-icon">
          <AppIcon name="alert-circle" :size="28" />
        </span>
        <strong>{{ t('orders.error') }}</strong>
        <AppButton variant="outline" size="sm" @click="load">
          <AppIcon name="refresh" :size="14" />
          {{ t('orders.retry') }}
        </AppButton>
      </div>

      <div v-else-if="orders.length === 0" class="orders-page__state">
        <span class="orders-page__state-icon orders-page__state-icon--neutral">
          <AppIcon name="box" :size="28" />
        </span>
        <strong>{{ t('orders.empty') }}</strong>
        <p>{{ t('orders.emptyDesc') }}</p>
      </div>

      <div v-else class="orders-page__list">
        <article v-for="group in orders" :key="group.orderNumber" class="order-card">
          <div class="order-card__head">
            <div class="order-card__head-info">
              <span class="order-card__number">{{ t('orders.orderNumber') }}{{ group.orderNumber }}</span>
              <span
                class="order-card__badge"
                :class="`order-card__badge--${statusVariant(group.status)}`"
              >
                {{ statusLabel(group.status) }}
              </span>
            </div>
            <div class="order-card__meta">
              <span v-if="group.doctorName" class="order-card__meta-item">
                <AppIcon name="user" :size="13" />
                {{ group.doctorName }}
              </span>
              <span v-if="group.phoneNumber" class="order-card__meta-item">
                <AppIcon name="phone" :size="13" />
                {{ group.phoneNumber }}
              </span>
            </div>
          </div>

          <div v-for="order in group.orders" :key="order.id" class="order-card__suborder">
            <div v-if="order.inventoryName" class="order-card__inventory">
              <AppIcon name="store" :size="14" />
              {{ order.inventoryName }}
            </div>
            <ul class="order-card__items">
              <li v-for="item in order.items" :key="item.productPriceId" class="order-card__item">
                <span class="order-card__item-name">{{ item.productName }}</span>
                <span class="order-card__item-detail">
                  {{ item.quantity }} &times; {{ formatCurrency(item.unitPrice) }}
                </span>
              </li>
            </ul>
          </div>

          <div class="order-card__summary">
            <div class="order-card__summary-row">
              <span>{{ t('orders.total') }}</span>
              <span>{{ formatCurrency(group.totalAmountOrder) }}</span>
            </div>
            <div v-if="group.coupon > 0" class="order-card__summary-row order-card__summary-row--discount">
              <span>{{ t('orders.discount') }}</span>
              <span>-{{ formatCurrency(group.coupon) }}</span>
            </div>
            <div v-if="group.shippingFees > 0" class="order-card__summary-row">
              <span>{{ t('orders.shipping') }}</span>
              <span>{{ formatCurrency(group.shippingFees) }}</span>
            </div>
            <div class="order-card__summary-row order-card__summary-row--total">
              <span>{{ t('orders.totalAfter') }}</span>
              <span>{{ formatCurrency(group.totalAmountOrderAfter) }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  min-height: 70vh;
  padding: 3rem var(--dz-gutter) 4rem;
  background: var(--dz-paper);
}

.orders-page__header {
  margin-bottom: 2rem;
}

.orders-page__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--dz-ink);
}

.orders-page__subtitle {
  margin-top: 0.35rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.orders-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 1.75rem;
}

.orders-page__filter {
  padding: 0.4rem 0.9rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.orders-page__filter:hover {
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
}

.orders-page__filter--active {
  background: var(--dz-primary-faint);
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
}

.orders-page__list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.orders-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 4rem 1.5rem;
  text-align: center;
}

.orders-page__state strong {
  font-family: var(--dz-font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--dz-ink);
}

.orders-page__state p {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 40ch;
}

.orders-page__state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.25rem;
}

.orders-page__state--error .orders-page__state-icon {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.order-card {
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  overflow: hidden;
}

.order-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem 0.85rem;
  border-bottom: 1px solid var(--dz-border);
}

.order-card__head-info {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.order-card__number {
  font-family: var(--dz-font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--dz-ink);
}

.order-card__meta {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.order-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.order-card__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: var(--dz-radius-full);
  font-size: 0.74rem;
  font-weight: 700;
}

.order-card__badge--success {
  background: color-mix(in srgb, var(--dz-success) 12%, transparent);
  color: var(--dz-success);
}

.order-card__badge--danger {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.order-card__badge--primary {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.order-card__badge--warning {
  background: color-mix(in srgb, var(--dz-gold) 14%, transparent);
  color: var(--dz-gold-strong);
}

.order-card__badge--neutral {
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
}

.order-card__suborder {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--dz-border);
}

.order-card__suborder:last-of-type {
  border-bottom: none;
}

.order-card__inventory {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  margin-bottom: 0.65rem;
}

.order-card__items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.order-card__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.order-card__item-name {
  font-size: 0.87rem;
  color: var(--dz-ink);
  font-weight: 500;
}

.order-card__item-detail {
  font-size: 0.82rem;
  color: var(--dz-muted);
  white-space: nowrap;
}

.order-card__summary {
  padding: 0.85rem 1.25rem;
  background: var(--dz-surface-soft);
  border-top: 1px solid var(--dz-border);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.order-card__summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--dz-ink-soft);
}

.order-card__summary-row--discount {
  color: var(--dz-success);
}

.order-card__summary-row--total {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--dz-ink);
  padding-top: 0.4rem;
  border-top: 1px solid var(--dz-border);
  margin-top: 0.2rem;
}

.order-card--skeleton {
  pointer-events: none;
}

.order-card__skeleton-head {
  height: 3.5rem;
  background: var(--dz-surface-soft);
  animation: orders-pulse 1.4s ease-in-out infinite;
}

.order-card__skeleton-body {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.order-card__skeleton-line {
  height: 0.75rem;
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: orders-pulse 1.4s ease-in-out infinite;
  width: 60%;
}

.order-card__skeleton-line--wide {
  width: 80%;
}

.order-card__skeleton-line--short {
  width: 40%;
}

@keyframes orders-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

@media (max-width: 560px) {
  .orders-page {
    padding: 1.75rem var(--dz-gutter) 3rem;
  }

  .orders-page__header {
    margin-bottom: 1.25rem;
  }

  .orders-page__filters {
    gap: 0.35rem;
    margin-bottom: 1.25rem;
  }

  .orders-page__filter {
    padding: 0.35rem 0.75rem;
    font-size: 0.76rem;
  }

  .order-card__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.85rem 1rem;
  }

  .order-card__suborder {
    padding: 0.75rem 1rem;
  }

  .order-card__summary {
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 360px) {
  .order-card__item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .order-card__skeleton-head,
  .order-card__skeleton-line {
    animation: none;
  }
}
</style>
