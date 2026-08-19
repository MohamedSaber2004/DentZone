<script setup lang="ts">
import { services } from '../../di/container'
import { computed } from 'vue'
const { catalogService } = services
import { formatPrice, t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  subtotal: number
  discount?: number
  shipping: number
  tax: number
  total: number
  showShippingNote?: boolean
}>()

const threshold = computed(() => catalogService.settings.value.freeShippingThreshold)

const remainingForFreeShipping = computed(() => Math.max(0, threshold.value - props.subtotal))
const freeShippingProgress = computed(() => Math.min(100, Math.round((props.subtotal / threshold.value) * 100)))
const freeShippingUnlocked = computed(() => remainingForFreeShipping.value === 0)
const taxRate = Math.round(catalogService.settings.value.taxRate * 100)
</script>

<template>
  <div class="order-summary">
    <div v-if="showShippingNote" class="order-summary__progress">
      <div v-if="!freeShippingUnlocked" class="order-summary__progress-label">
        <AppIcon name="truck" :size="16" />
        <span>
          {{ t('summary.addMoreForFreeShipping', { amount: formatPrice(remainingForFreeShipping) }) }}
        </span>
      </div>
      <div v-else class="order-summary__progress-label order-summary__progress-label--done">
        <AppIcon name="check" :size="16" />
        <span>{{ t('summary.freeShippingUnlocked') }}</span>
      </div>
      <div class="order-summary__progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="freeShippingProgress">
        <div class="order-summary__progress-fill" :style="{ width: `${freeShippingProgress}%` }" />
      </div>
    </div>

    <dl class="order-summary__rows">
      <div class="order-summary__row">
        <dt>{{ t('summary.subtotal') }}</dt>
        <dd>{{ formatPrice(subtotal) }}</dd>
      </div>
      <div v-if="discount && discount > 0" class="order-summary__row order-summary__row--discount">
        <dt>{{ t('summary.discount') }}</dt>
        <dd>-{{ formatPrice(discount) }}</dd>
      </div>
      <div class="order-summary__row">
        <dt>{{ t('summary.shipping') }}</dt>
        <dd>{{ shipping === 0 ? t('summary.free') : formatPrice(shipping) }}</dd>
      </div>
      <div class="order-summary__row">
        <dt>{{ t('summary.tax', { rate: taxRate }) }}</dt>
        <dd>{{ formatPrice(tax) }}</dd>
      </div>
    </dl>

    <div class="order-summary__total">
      <span>{{ t('summary.total') }}</span>
      <strong>{{ formatPrice(total) }}</strong>
    </div>
  </div>
</template>

<style scoped>
.order-summary {
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  padding: 1.25rem;
}

.order-summary__progress {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--dz-border);
}

.order-summary__progress-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: var(--dz-ink-soft);
  margin-bottom: 0.55rem;
}

.order-summary__progress-label svg {
  color: var(--dz-primary);
  flex-shrink: 0;
}

.order-summary__progress-label--done {
  color: var(--dz-success);
}

.order-summary__progress-label--done svg {
  color: var(--dz-success);
}

.order-summary__progress-label strong {
  color: var(--dz-ink);
}

.order-summary__progress-track {
  height: 8px;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-faint);
  overflow: hidden;
}

.order-summary__progress-fill {
  height: 100%;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary);
  transition: width 0.4s ease;
}

.order-summary__rows {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.order-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--dz-ink-soft);
}

.order-summary__row--discount dd {
  color: var(--dz-success);
  font-weight: 600;
}

.order-summary__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--dz-border);
  font-weight: 700;
  font-size: 1.05rem;
}

.order-summary__total strong {
  font-size: 1.25rem;
  color: var(--dz-primary-strong);
}
</style>