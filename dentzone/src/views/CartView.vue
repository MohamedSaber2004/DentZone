<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { locale, t } from '../i18n'
import { cartService } from '../di/container'
import { resolveMediaUrl } from '../utils/media'
import AppIcon from '../components/ui/AppIcon.vue'
import AppButton from '../components/ui/AppButton.vue'

interface CartLine {
  key: string
  productId: string
  inventoryId: string
  name: string
  image: string
  supplier: string
  unitPrice: number
  lineTotal: number
  quantity: number
  stockQuantity: number
  maxQuantity: number
}

const loadError = ref(false)
const busyKeys = ref<Set<string>>(new Set())

const localizedName = (name: string, arabicName?: string) =>
  locale.value === 'ar' && arabicName ? arabicName : name

const lines = computed<CartLine[]>(() => {
  const cart = cartService.cart.value
  if (!cart) return []
  return cart.items.map((item) => ({
    key: `${item.productId}:${item.inventoryUserId}`,
    productId: item.productId,
    inventoryId: item.inventoryUserId,
    name: localizedName(item.product.name, item.product.arabicName),
    image: item.product.productImage,
    supplier: item.inventoryUser.fullName,
    unitPrice: item.productPrice.effectiveSalesPrice,
    lineTotal: item.totalAmount,
    quantity: item.quantity,
    stockQuantity: item.productPrice.stockQuantity,
    maxQuantity: item.productPrice.maxQuantity,
  }))
})

const subtotal = computed(() => lines.value.reduce((acc, line) => acc + line.lineTotal, 0))
const total = computed(() => cartService.total.value)

const quantityLimit = (line: CartLine) =>
  Math.min(
    line.stockQuantity > 0 ? line.stockQuantity : Number.POSITIVE_INFINITY,
    line.maxQuantity > 0 ? line.maxQuantity : Number.POSITIVE_INFINITY,
  )

const outOfStock = (line: CartLine) => line.stockQuantity <= 0
const atLimit = (line: CartLine) => !outOfStock(line) && line.quantity >= quantityLimit(line) && Number.isFinite(quantityLimit(line))

const plusDisabled = (line: CartLine) => line.quantity >= quantityLimit(line)
const minusDisabled = (line: CartLine) => line.quantity <= 1

const setBusy = (key: string, busy: boolean) => {
  const next = new Set(busyKeys.value)
  if (busy) next.add(key)
  else next.delete(key)
  busyKeys.value = next
}

const changeQuantity = async (line: CartLine, delta: number) => {
  const next = line.quantity + delta
  if (next < 1 || next > quantityLimit(line) || busyKeys.value.has(line.key)) return
  setBusy(line.key, true)
  try {
    await cartService.updateQuantity({
      productId: line.productId,
      inventoryId: line.inventoryId,
      quantity: next,
      name: line.name,
    })
  } finally {
    setBusy(line.key, false)
  }
}

const remove = async (line: CartLine) => {
  if (busyKeys.value.has(line.key)) return
  setBusy(line.key, true)
  try {
    await cartService.remove({
      productId: line.productId,
      inventoryId: line.inventoryId,
      name: line.name,
    })
  } finally {
    setBusy(line.key, false)
  }
}

const formatPrice = (value: number) =>
  value.toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 })

const load = async () => {
  loadError.value = false
  loadError.value = !(await cartService.refresh())
}

onMounted(load)
</script>

<template>
  <div class="container page">
    <div class="page__head">
      <div>
        <h1 class="page__title">{{ t('cart.title') }}</h1>
        <p v-if="lines.length" class="page__count">
          {{ t('cart.count', { count: lines.length }) }}
        </p>
      </div>
    </div>

    <div v-if="loadError" class="page__state" role="alert">
      <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
      <h2 class="page__state-title">{{ t('cart.title') }}</h2>
      <p class="page__state-desc">{{ t('cart.errorToast') }}</p>
      <AppButton variant="primary" @click="load">
        <AppIcon name="refresh" :size="15" />
        {{ t('categories.retry') }}
      </AppButton>
    </div>

    <div v-else-if="lines.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="cart" :size="30" /></span>
      <h2 class="page__state-title">{{ t('cart.emptyTitle') }}</h2>
      <p class="page__state-desc">{{ t('cart.emptyDescription') }}</p>
      <RouterLink to="/categories">
        <AppButton variant="primary">
          {{ t('cart.browseProducts') }}
          <AppIcon name="arrow-right" :size="15" />
        </AppButton>
      </RouterLink>
    </div>

    <div v-else class="cart__layout">
      <ul class="cart__list">
        <li v-for="line in lines" :key="line.key" class="cart__item" :class="{ 'cart__item--busy': busyKeys.has(line.key) }">
          <RouterLink
            :to="{
              name: 'product-details',
              params: { inventoryUserId: line.inventoryId, productId: line.productId },
            }"
            class="cart__media"
          >
            <img v-if="line.image" :src="resolveMediaUrl(line.image)" :alt="line.name" />
            <span v-else class="cart__placeholder"><AppIcon name="package" :size="22" /></span>
          </RouterLink>

          <div class="cart__info">
            <RouterLink
              :to="{
                name: 'product-details',
                params: { inventoryUserId: line.inventoryId, productId: line.productId },
              }"
              class="cart__name"
            >
              {{ line.name }}
            </RouterLink>
            <p v-if="line.supplier" class="cart__supplier">
              {{ line.supplier }}
            </p>
            <p v-if="outOfStock(line)" class="cart__out">
              {{ t('cart.outOfStock') }}
            </p>
            <p v-else-if="atLimit(line)" class="cart__limit">
              {{ t('cart.maxHint', { count: quantityLimit(line) }) }}
            </p>
            <p class="cart__unit">
              {{ t('cart.each', { price: `${formatPrice(line.unitPrice)} ${t('products.currency')}` }) }}
            </p>
          </div>

          <div class="cart__stepper" role="group" :aria-label="line.name">
            <button
              type="button"
              class="cart__stepper-btn"
              :disabled="minusDisabled(line) || busyKeys.has(line.key)"
              :aria-label="t('cart.remove')"
              @click="changeQuantity(line, -1)"
            >
              <AppIcon name="minus" :size="14" />
            </button>
            <span class="cart__stepper-value">{{ line.quantity }}</span>
            <button
              type="button"
              class="cart__stepper-btn"
              :disabled="plusDisabled(line) || busyKeys.has(line.key)"
              :aria-label="t('cart.title')"
              @click="changeQuantity(line, 1)"
            >
              <AppIcon name="plus" :size="14" />
            </button>
          </div>

          <div class="cart__line-total">
            {{ formatPrice(line.lineTotal) }}
            <span class="cart__line-currency">{{ t('products.currency') }}</span>
          </div>

          <button
            type="button"
            class="cart__remove"
            :disabled="busyKeys.has(line.key)"
            :aria-label="t('cart.remove')"
            @click="remove(line)"
          >
            <AppIcon name="trash" :size="16" />
          </button>
        </li>
      </ul>

      <aside class="cart__summary">
        <h2 class="cart__summary-title">{{ t('summary.total') }}</h2>
        <div class="cart__summary-row">
          <span>{{ t('summary.items', { count: lines.length }) }}</span>
          <strong>{{ lines.length }}</strong>
        </div>
        <div class="cart__summary-row">
          <span>{{ t('summary.subtotal') }}</span>
          <strong>{{ formatPrice(Math.ceil(subtotal)) }} {{ t('products.currency') }}</strong>
        </div>
        <div class="cart__summary-row cart__summary-row--total">
          <span>{{ t('summary.total') }}</span>
          <strong>{{ formatPrice(Math.ceil(total)) }} {{ t('products.currency') }}</strong>
        </div>
        <RouterLink to="/checkout" class="cart__checkout-link">
          <AppButton variant="primary" class="cart__checkout">
            {{ t('cart.proceedToCheckout') }}
            <AppIcon name="arrow-right" :size="15" />
          </AppButton>
        </RouterLink>
        <RouterLink to="/categories" class="cart__continue">
          <AppIcon name="arrow-left" :size="15" />
          {{ t('cart.continueShopping') }}
        </RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.page__count {
  margin-top: 0.35rem;
  font-size: 0.88rem;
  color: var(--dz-muted);
}

.page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 4rem 1rem;
  text-align: center;
}

.page__state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.4rem;
}

.page__state-title {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 600;
}

.page__state-desc {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 40ch;
}

.cart__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.5rem;
  align-items: start;
}

.cart__list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  list-style: none;
}

.cart__item {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
}

.cart__media {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: var(--dz-radius);
  overflow: hidden;
  background: var(--dz-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  flex-shrink: 0;
}

.cart__media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.cart__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--dz-muted);
}

.cart__info {
  min-width: 0;
}

.cart__name {
  display: block;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--dz-ink);
  line-height: 1.35;
}

.cart__name:hover {
  color: var(--dz-primary-strong);
}

.cart__supplier {
  margin-top: 0.25rem;
  font-size: 0.78rem;
  color: var(--dz-muted);
}

.cart__unit {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--dz-ink-soft);
}

.cart__out {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--dz-danger);
}

.cart__limit {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
}

.cart__item--busy {
  opacity: 0.55;
  pointer-events: none;
}

.cart__stepper {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  padding: 0.2rem;
}

.cart__stepper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.cart__stepper-btn:hover:not(:disabled) {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.cart__stepper-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cart__stepper-value {
  min-width: 1.6rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.cart__line-total {
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
}

.cart__line-currency {
  font-size: 0.75rem;
  color: var(--dz-muted);
  font-weight: 500;
  margin-inline-start: 0.15rem;
}

.cart__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.cart__remove:hover:not(:disabled) {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.cart__remove:disabled {
  opacity: 0.5;
  cursor: wait;
}

.cart__summary {
  position: sticky;
  top: calc(var(--dz-header-height) + 1rem);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.2rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
}

.cart__summary-title {
  font-family: var(--dz-font-display);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.cart__summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--dz-ink-soft);
}

.cart__summary-row--total {
  padding-top: 0.7rem;
  border-top: 1px solid var(--dz-border);
  font-size: 1rem;
  color: var(--dz-ink);
}

.cart__summary-row--total strong {
  font-size: 1.15rem;
  color: var(--dz-primary-strong);
}

.cart__checkout-link {
  margin-top: 0.7rem;
  display: block;
}

.cart__checkout {
  width: 100%;
}

.cart__continue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.cart__continue:hover {
  color: var(--dz-primary-strong);
}

@media (max-width: 820px) {
  .page {
    padding-block: 1.5rem 3.5rem;
  }

  .cart__layout {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .cart__summary {
    position: static;
  }
}

@media (max-width: 600px) {
  .cart__item {
    grid-template-columns: 4.25rem minmax(0, 1fr) auto;
    gap: 0.65rem;
    padding: 0.75rem;
  }

  .cart__media {
    width: 4.25rem;
    height: 4.25rem;
  }

  .cart__name {
    font-size: 0.88rem;
  }

  .cart__line-total {
    grid-column: 2 / 3;
  }

  .cart__remove {
    grid-column: 3 / 4;
    grid-row: 1 / 2;
    align-self: flex-start;
  }

  .cart__stepper {
    grid-column: 3 / 4;
    grid-row: 2 / 3;
  }
}

@media (max-width: 380px) {
  .cart__item {
    grid-template-columns: 3.5rem minmax(0, 1fr) auto;
    gap: 0.5rem;
    padding: 0.6rem;
  }

  .cart__media {
    width: 3.5rem;
    height: 3.5rem;
  }

  .cart__stepper-btn {
    width: 1.65rem;
    height: 1.65rem;
  }

  .cart__stepper-value {
    min-width: 1.3rem;
    font-size: 0.82rem;
  }
}
</style>