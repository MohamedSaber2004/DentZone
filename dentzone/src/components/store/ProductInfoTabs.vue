<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Product } from '../../domain/models/product'
import { categoryName, t } from '../../i18n'
import AppIcon, { type IconName } from '../ui/AppIcon.vue'
import ReviewsSection from './ReviewsSection.vue'

type TabId = 'details' | 'shipping' | 'reviews'

const props = defineProps<{
  product: Product
}>()

const activeTab = ref<TabId>('details')

const tabKey = computed(() => `${props.product.id}-${activeTab.value}`)

watch(
  () => props.product.id,
  () => {
    activeTab.value = 'details'
  },
)

const tabs = computed<{ id: TabId; label: string }[]>(() => [
  { id: 'details', label: t('product.detailsTab') },
  { id: 'shipping', label: t('product.shippingTab') },
  { id: 'reviews', label: t('product.reviewsTab') },
])

const sku = computed(() => `DZ-${props.product.id.toUpperCase().replace(/^P-/, '')}`)

const specs = computed(() => [
  { label: t('product.specBrand'), value: props.product.brand },
  { label: t('product.specCategory'), value: categoryName(props.product.categoryId) },
  { label: t('product.specSku'), value: sku.value },
  {
    label: t('product.specAvailability'),
    value: props.product.inStock ? t('product.specInStock') : t('product.specOutOfStock'),
    tone: props.product.inStock ? 'success' : 'danger',
  },
] satisfies { label: string; value: string; tone?: string }[])

const shippingItems = computed<{ icon: IconName; title: string; description: string }[]>(() => [
  { icon: 'clock', title: t('product.shippingDelivery'), description: t('product.shippingDeliveryDesc') },
  { icon: 'refresh', title: t('product.shippingReturns'), description: t('product.shippingReturnsDesc') },
  { icon: 'box', title: t('product.shippingPackaging'), description: t('product.shippingPackagingDesc') },
  { icon: 'credit-card', title: t('product.shippingPayment'), description: t('product.shippingPaymentDesc') },
])
</script>

<template>
  <div class="product-tabs">
    <div class="product-tabs__bar" role="tablist" aria-label="Product information">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="product-tabs__tab"
        :class="{ 'product-tabs__tab--active': activeTab === tab.id }"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="product-tabs__panel" :key="tabKey">
      <section v-if="activeTab === 'details'" class="product-tabs__details">
        <div class="product-tabs__block">
          <h3 class="product-tabs__heading">{{ t('product.keyFeatures') }}</h3>
          <ul class="product-tabs__features">
            <li v-for="feature in product.features" :key="feature" class="product-tabs__feature">
              <AppIcon name="check" :size="16" class="product-tabs__feature-check" />
              {{ feature }}
            </li>
          </ul>
        </div>

        <div class="product-tabs__block">
          <h3 class="product-tabs__heading">{{ t('product.specsTitle') }}</h3>
          <dl class="product-tabs__specs">
            <div v-for="spec in specs" :key="spec.label" class="product-tabs__spec">
              <dt>{{ spec.label }}</dt>
              <dd :class="{ 'product-tabs__spec--success': spec.tone === 'success', 'product-tabs__spec--danger': spec.tone === 'danger' }">
                {{ spec.value }}
              </dd>
            </div>
          </dl>
        </div>

        <p class="product-tabs__description">{{ product.description }}</p>
      </section>

      <section v-else-if="activeTab === 'shipping'" class="product-tabs__shipping">
        <div v-for="item in shippingItems" :key="item.title" class="product-tabs__shipping-item">
          <span class="product-tabs__shipping-icon">
            <AppIcon :name="item.icon" :size="20" />
          </span>
          <div>
            <h4 class="product-tabs__shipping-title">{{ item.title }}</h4>
            <p class="product-tabs__shipping-desc">{{ item.description }}</p>
          </div>
        </div>
      </section>

      <section v-else class="product-tabs__reviews">
        <ReviewsSection :product="product" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.product-tabs {
  margin-top: 3.5rem;
}

.product-tabs__bar {
  display: flex;
  gap: 0.35rem;
  border-bottom: 1px solid var(--dz-border);
  overflow-x: auto;
  scrollbar-width: none;
}

.product-tabs__bar::-webkit-scrollbar {
  display: none;
}

.product-tabs__tab {
  position: relative;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dz-muted);
  white-space: nowrap;
  transition: color 0.2s;
}

.product-tabs__tab:hover {
  color: var(--dz-ink);
}

.product-tabs__tab--active {
  color: var(--dz-primary-strong);
}

.product-tabs__tab--active::after {
  content: '';
  position: absolute;
  inset-inline: 0.75rem;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--dz-primary);
}

.product-tabs__panel {
  padding-top: 1.75rem;
  animation: product-tabs-in 0.25s ease both;
}

@keyframes product-tabs-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-tabs__panel {
    animation: none;
  }
}

.product-tabs__details {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

.product-tabs__block {
  padding: 1.4rem 1.5rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
}

.product-tabs__heading {
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.product-tabs__features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.product-tabs__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: var(--dz-ink-soft);
}

.product-tabs__feature-check {
  color: var(--dz-primary);
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.product-tabs__specs {
  display: flex;
  flex-direction: column;
}

.product-tabs__spec {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px dashed var(--dz-border);
  font-size: 0.88rem;
}

.product-tabs__spec:last-child {
  border-bottom: none;
}

.product-tabs__spec dt {
  color: var(--dz-muted);
}

.product-tabs__spec dd {
  font-weight: 600;
  color: var(--dz-ink);
  text-align: end;
}

.product-tabs__spec--success {
  color: var(--dz-success) !important;
}

.product-tabs__spec--danger {
  color: var(--dz-danger) !important;
}

.product-tabs__description {
  grid-column: 1 / -1;
  color: var(--dz-ink-soft);
  line-height: 1.7;
  font-size: 0.95rem;
}

.product-tabs__shipping {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.1rem;
}

.product-tabs__shipping-item {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.3rem 1.4rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
}

.product-tabs__shipping-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-soft);
  color: var(--dz-primary);
}

.product-tabs__shipping-title {
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.product-tabs__shipping-desc {
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--dz-ink-soft);
}

@media (max-width: 900px) {
  .product-tabs__details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .product-tabs__features {
    grid-template-columns: 1fr;
  }

  .product-tabs__shipping {
    grid-template-columns: 1fr;
  }
}
</style>