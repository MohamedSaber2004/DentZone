<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { orderService } from '../application/order.service'
import { locale, t, type MessageKey } from '../i18n'
import type { Order, OrderStatus } from '../domain/models/order'
import AppButton from '../components/ui/AppButton.vue'
import AppBadge from '../components/ui/AppBadge.vue'
import OrderSummary from '../components/store/OrderSummary.vue'
import OrderLinesList, { type OrderLineView } from '../components/store/OrderLinesList.vue'
import EmptyState from '../components/ui/EmptyState.vue'

const route = useRoute()

const order = ref<Order | undefined>()

const orderId = computed(() => String(route.params.id ?? ''))

const loadOrder = () => {
  order.value = orderService.getOrderById(orderId.value)
}

onMounted(loadOrder)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const statusKey = (status: OrderStatus): MessageKey =>
  `confirmation.status${status.charAt(0).toUpperCase()}${status.slice(1)}` as MessageKey

const statusLabel = (status: OrderStatus): string => t(statusKey(status))

const linesAsOrderLines = (order: Order): OrderLineView[] =>
  order.lines.map((line) => ({
    product: {
      name: line.name,
      price: line.price,
      image: line.image,
    },
    quantity: line.quantity,
  }))
</script>

<template>
  <div class="container page">
    <EmptyState
      v-if="!order"
      emoji="🧾"
      title="Order not found"
      description="We couldn't find this order. Orders are stored locally in this browser."
    >
      <template #action>
        <RouterLink to="/catalog">
          <AppButton>Continue shopping</AppButton>
        </RouterLink>
      </template>
    </EmptyState>

    <template v-else>
      <div class="confirm">
        <span class="confirm__icon">✅</span>
        <h1 class="confirm__title">Thank you, {{ order.customer.name.split(' ')[0] }}!</h1>
        <p class="confirm__subtitle">
          Your order <strong>{{ order.id }}</strong> has been placed successfully.
          <br />
          A confirmation email is on its way to <strong>{{ order.customer.email }}</strong>.
        </p>
        <AppBadge tone="success" size="md" class="confirm__status">{{ statusLabel(order.status) }}</AppBadge>
      </div>

      <section class="confirm__details">
        <div class="confirm__card">
          <h2 class="confirm__heading">Order details</h2>
          <OrderLinesList :lines="linesAsOrderLines(order)" />
        </div>

        <div class="confirm__card">
          <h2 class="confirm__heading">Summary</h2>
          <OrderSummary
            :subtotal="order.totals.subtotal"
            :discount="order.totals.discount"
            :shipping="order.totals.shipping"
            :tax="order.totals.tax"
            :total="order.totals.total"
          />
        </div>

        <div class="confirm__card">
          <h2 class="confirm__heading">Shipping to</h2>
          <p class="confirm__customer-name">{{ order.customer.name }}</p>
          <p class="confirm__customer-line">{{ order.customer.address }}</p>
          <p class="confirm__customer-line">{{ order.customer.city }}</p>
          <p class="confirm__customer-line">{{ order.customer.phone }}</p>
        </div>
      </section>

      <div class="confirm__meta">
        <span class="confirm__meta-item">Placed on {{ formatDate(order.createdAt) }}</span>
        <span class="confirm__meta-item">Order ID: {{ order.id }}</span>
      </div>

      <div class="confirm__actions">
        <RouterLink to="/catalog">
          <AppButton size="lg">Continue shopping</AppButton>
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem 2rem;
}

.confirm__icon {
  font-size: 3.5rem;
}

.confirm__title {
  font-size: 1.9rem;
  margin-top: 1rem;
}

.confirm__subtitle {
  margin-top: 0.6rem;
  color: var(--dz-ink-soft);
}

.confirm__status {
  margin-top: 1.25rem;
}

.confirm__details {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.25rem;
  align-items: start;
  margin-top: 2rem;
}

.confirm__card {
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  padding: 1.5rem;
}

.confirm__heading {
  font-size: 1.05rem;
  margin-bottom: 1.1rem;
}

.confirm__customer-name {
  font-weight: 700;
}

.confirm__customer-line {
  color: var(--dz-ink-soft);
  font-size: 0.9rem;
}

.confirm__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-top: 1.25rem;
  color: var(--dz-muted);
  font-size: 0.82rem;
}

.confirm__actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

@media (max-width: 800px) {
  .confirm__details {
    grid-template-columns: 1fr;
  }
}
</style>
