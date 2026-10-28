<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { locale, t } from '../i18n'
import { cartService, orderRepository } from '../di/container'
import { resolveMediaUrl } from '../utils/media'
import { inventoryRoute, productRoute } from '../utils/route-crypto'
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

interface ProviderGroup {
  inventoryUserId: string
  supplierName: string
  supplierPhoto: string | null
  items: CartLine[]
  subtotal: number
  totalItems: number
}

const loadError = ref(false)
const loading = ref(!cartService.cart.value)
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
    supplier: (item.inventoryUser?.fullName || item.inventoryUser?.userName || '').trim() || t('home.singleProvider'),
    unitPrice: item.productPrice.effectiveSalesPrice,
    lineTotal: item.totalAmount,
    quantity: item.quantity,
    stockQuantity: item.productPrice.stockQuantity,
    maxQuantity: item.productPrice.maxQuantity,
  }))
})

const providerGroups = computed<ProviderGroup[]>(() => {
  const cart = cartService.cart.value
  if (!cart || !cart.items || cart.items.length === 0) return []

  const groupsMap = new Map<string, ProviderGroup>()

  for (const item of cart.items) {
    const invId = item.inventoryUserId || item.inventoryUser?.id || 'default'
    const sName =
      (item.inventoryUser?.fullName || item.inventoryUser?.userName || '').trim() ||
      t('home.singleProvider')
    const sPhoto = item.inventoryUser?.photo || null

    if (!groupsMap.has(invId)) {
      groupsMap.set(invId, {
        inventoryUserId: invId,
        supplierName: sName,
        supplierPhoto: sPhoto,
        items: [],
        subtotal: 0,
        totalItems: 0,
      })
    }

    const group = groupsMap.get(invId)!
    const line: CartLine = {
      key: `${item.productId}:${invId}`,
      productId: item.productId,
      inventoryId: invId,
      name: localizedName(item.product.name, item.product.arabicName),
      image: item.product.productImage,
      supplier: sName,
      unitPrice: item.productPrice.effectiveSalesPrice,
      lineTotal: item.totalAmount,
      quantity: item.quantity,
      stockQuantity: item.productPrice.stockQuantity,
      maxQuantity: item.productPrice.maxQuantity,
    }

    group.items.push(line)
    group.subtotal += line.lineTotal
    group.totalItems += line.quantity
  }

  return Array.from(groupsMap.values())
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
  Math.ceil(value).toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 })

const minOrderLimit = ref<number | null>(null)
const minOrderLoading = ref(true)

const loadOrderLimits = async () => {
  minOrderLoading.value = true
  try {
    const limits = await orderRepository.getOrderLimits()
    if (limits && limits.length > 0 && limits[0]) {
      const raw = limits[0]
      const val = Number(raw.minimumorder ?? (raw as unknown as { minimumOrder?: number }).minimumOrder ?? 0)
      if (val > 0) {
        minOrderLimit.value = val
      }
    }
  } catch {
    // Graceful fallback if endpoint is unavailable
  } finally {
    minOrderLoading.value = false
  }
}

const hasMinOrder = computed(() => minOrderLimit.value !== null && minOrderLimit.value > 0)

const currentCartAmount = computed(() => Math.ceil(subtotal.value))

const minOrderProgress = computed(() => {
  if (!hasMinOrder.value || !minOrderLimit.value) return 100
  const pct = Math.round((currentCartAmount.value / minOrderLimit.value) * 100)
  return Math.min(100, Math.max(0, pct))
})

const minOrderRemaining = computed(() => {
  if (!hasMinOrder.value || !minOrderLimit.value) return 0
  return Math.max(0, minOrderLimit.value - currentCartAmount.value)
})

const isMinOrderReached = computed(() => {
  if (!hasMinOrder.value) return true
  return currentCartAmount.value >= (minOrderLimit.value ?? 0)
})

const load = async () => {
  if (!cartService.cart.value) loading.value = true
  loadError.value = false
  try {
    const ok = await cartService.refresh()
    loadError.value = !ok
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const router = useRouter()

const onProceedToCheckout = () => {
  if (!isMinOrderReached.value) return
  void router.push('/checkout')
}

onMounted(() => {
  void load()
  void loadOrderLimits()
})
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

    <div v-if="loading" class="cart__layout" role="status" :aria-label="t('common.loading')">
      <div class="cart__groups">
        <div v-for="g in 2" :key="g" class="cart__group cart__group--skeleton">
          <div class="cart__group-header">
            <div class="cart__group-provider">
              <span class="skeleton cart__skeleton-icon" />
              <div class="cart__skeleton-col">
                <span class="skeleton cart__skeleton-line cart__skeleton-line--title" />
                <span class="skeleton cart__skeleton-line cart__skeleton-line--sub" />
              </div>
            </div>
          </div>

          <ul class="cart__list">
            <li v-for="i in 2" :key="i" class="cart__item cart__item--skeleton">
              <span class="skeleton cart__skeleton-thumb" />
              <div class="cart__info">
                <span class="skeleton cart__skeleton-line cart__skeleton-line--name" />
                <span class="skeleton cart__skeleton-line cart__skeleton-line--sub" />
                <span class="skeleton cart__skeleton-line cart__skeleton-line--price" />
              </div>
              <span class="skeleton cart__skeleton-stepper" />
              <span class="skeleton cart__skeleton-total" />
            </li>
          </ul>
        </div>
      </div>

      <aside class="cart__summary cart__summary--skeleton">
        <span class="skeleton cart__skeleton-line cart__skeleton-line--sum-title" />
        <div class="cart__skeleton-summary-row">
          <span class="skeleton cart__skeleton-line cart__skeleton-line--sub" />
          <span class="skeleton cart__skeleton-line cart__skeleton-line--val" />
        </div>
        <div class="cart__skeleton-summary-row">
          <span class="skeleton cart__skeleton-line cart__skeleton-line--sub" />
          <span class="skeleton cart__skeleton-line cart__skeleton-line--val" />
        </div>
        <div class="cart__skeleton-summary-row">
          <span class="skeleton cart__skeleton-line cart__skeleton-line--sub" />
          <span class="skeleton cart__skeleton-line cart__skeleton-line--val" />
        </div>
        <span class="skeleton cart__skeleton-btn" />
      </aside>
    </div>

    <div v-else-if="loadError" class="page__state" role="alert">
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
      <div class="cart__groups">
        <!-- Minimum Order Banner (Prominent progress & alert above cart items) -->
        <div
          v-if="hasMinOrder && lines.length"
          class="cart__min-order-banner"
          :class="{ 'cart__min-order-banner--reached': isMinOrderReached }"
          role="status"
          :aria-live="'polite'"
        >
          <div class="cart__min-order-header">
            <div class="cart__min-order-title-group">
              <span class="cart__min-order-icon">
                <AppIcon :name="isMinOrderReached ? 'check-circle' : 'shield-check'" :size="20" />
              </span>
              <div>
                <h3 class="cart__min-order-heading">
                  {{ isMinOrderReached ? t('cart.minOrderReached') : t('cart.minOrderNotice', { amount: formatPrice(minOrderLimit!), currency: t('products.currency') }) }}
                </h3>
                <p class="cart__min-order-desc">
                  <template v-if="!isMinOrderReached">
                    {{ t('cart.minOrderRemaining', { amount: formatPrice(minOrderRemaining), currency: t('products.currency') }) }}
                  </template>
                  <template v-else>
                    {{ t('cart.minOrderRequirementNote', { amount: formatPrice(minOrderLimit!), currency: t('products.currency') }) }}
                  </template>
                </p>
              </div>
            </div>
            <span class="cart__min-order-badge">
              {{ minOrderProgress }}%
            </span>
          </div>

          <div
            class="cart__min-order-track"
            role="progressbar"
            :aria-valuenow="minOrderProgress"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="cart__min-order-bar"
              :style="{ width: `${minOrderProgress}%` }"
            />
          </div>
        </div>

        <div
          v-for="group in providerGroups"
          :key="group.inventoryUserId"
          class="cart__group"
        >
          <div class="cart__group-header">
            <div class="cart__group-provider">
              <span class="cart__group-icon">
                <AppIcon name="store" :size="18" />
              </span>
              <div class="cart__group-info">
                <h2 class="cart__group-name">{{ group.supplierName }}</h2>
                <span class="cart__group-count">
                  {{ t('summary.items', { count: group.totalItems }) }}
                </span>
              </div>
            </div>
            <RouterLink
              v-if="group.inventoryUserId && group.inventoryUserId !== 'default'"
              :to="inventoryRoute(group.inventoryUserId, { supplier: group.supplierName })"
              class="cart__group-link"
            >
              {{ t('cart.viewProviderStore') }}
              <AppIcon name="arrow-right" :size="13" />
            </RouterLink>
          </div>

          <ul class="cart__list">
            <li
              v-for="line in group.items"
              :key="line.key"
              class="cart__item"
              :class="{ 'cart__item--busy': busyKeys.has(line.key) }"
            >
              <RouterLink
                :to="productRoute(line.productId, line.inventoryId, { supplier: line.supplier })"
                class="cart__media"
              >
                <img v-if="line.image" :src="resolveMediaUrl(line.image)" :alt="line.name" />
                <span v-else class="cart__placeholder"><AppIcon name="package" :size="22" /></span>
              </RouterLink>

              <div class="cart__info">
                <RouterLink
                  :to="productRoute(line.productId, line.inventoryId, { supplier: line.supplier })"
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

          <div class="cart__group-footer">
            <span class="cart__group-footer-label">
              {{ t('cart.providerTotal', { name: group.supplierName }) }}:
            </span>
            <strong class="cart__group-footer-val">
              {{ formatPrice(Math.ceil(group.subtotal)) }} {{ t('products.currency') }}
            </strong>
          </div>
        </div>
      </div>

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

        <div
          v-if="hasMinOrder"
          class="cart__summary-min-order"
          :class="{ 'cart__summary-min-order--reached': isMinOrderReached }"
        >
          <div class="cart__summary-min-order-info">
            <span class="cart__summary-min-order-label">
              <AppIcon :name="isMinOrderReached ? 'check-circle' : 'shield-check'" :size="15" />
              {{ t('cart.minOrderTitle') }}
            </span>
            <strong class="cart__summary-min-order-val">
              {{ formatPrice(minOrderLimit!) }} {{ t('products.currency') }}
            </strong>
          </div>

          <div class="cart__min-order-track cart__min-order-track--sm">
            <div
              class="cart__min-order-bar"
              :style="{ width: `${minOrderProgress}%` }"
            />
          </div>

          <span v-if="!isMinOrderReached" class="cart__summary-min-order-hint">
            {{ t('cart.minOrderShortNotice', { amount: formatPrice(minOrderRemaining), currency: t('products.currency') }) }}
          </span>
          <span v-else class="cart__summary-min-order-hint cart__summary-min-order-hint--success">
            {{ t('cart.minOrderReached') }}
          </span>
        </div>

        <div class="cart__checkout-link">
          <AppButton
            variant="primary"
            class="cart__checkout"
            :disabled="!isMinOrderReached"
            @click="onProceedToCheckout"
          >
            {{ t('cart.proceedToCheckout') }}
            <AppIcon name="arrow-right" :size="15" />
          </AppButton>
          <p v-if="!isMinOrderReached && hasMinOrder" class="cart__checkout-disabled-hint">
            <AppIcon name="alert-circle" :size="13" />
            {{ t('cart.minOrderRequirementNote', { amount: formatPrice(minOrderLimit!), currency: t('products.currency') }) }}
          </p>
        </div>
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

.skeleton {
  background: var(--dz-surface-soft);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
  border-radius: var(--dz-radius);
  display: block;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

.cart__skeleton-icon {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: var(--dz-radius-md);
  flex-shrink: 0;
}

.cart__skeleton-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 140px;
}

.cart__skeleton-thumb {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: var(--dz-radius-md);
  flex-shrink: 0;
}

.cart__item--skeleton {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.cart__skeleton-stepper {
  width: 6.5rem;
  height: 2.2rem;
  border-radius: var(--dz-radius-full);
  flex-shrink: 0;
}

.cart__skeleton-total {
  width: 4rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.cart__skeleton-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.cart__skeleton-btn {
  height: 2.85rem;
  width: 100%;
  border-radius: var(--dz-radius-full);
  margin-top: 0.5rem;
}

.cart__skeleton-line {
  height: 0.85rem;
}

.cart__skeleton-line--title {
  width: 65%;
  height: 1rem;
}

.cart__skeleton-line--sum-title {
  width: 45%;
  height: 1.25rem;
  margin-bottom: 0.5rem;
}

.cart__skeleton-line--name {
  width: 80%;
  height: 1rem;
  margin-bottom: 0.35rem;
}

.cart__skeleton-line--sub {
  width: 45%;
  height: 0.75rem;
}

.cart__skeleton-line--price {
  width: 30%;
  height: 0.75rem;
  margin-top: 0.35rem;
}

.cart__skeleton-line--val {
  width: 25%;
  height: 0.85rem;
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

.cart__groups {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart__group {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.25rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-xl);
  background: var(--dz-surface);
  box-shadow: var(--dz-shadow-xs);
}

.cart__group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px dashed var(--dz-border);
}

.cart__group-provider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cart__group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  flex-shrink: 0;
}

.cart__group-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.cart__group-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--dz-ink);
  margin: 0;
  line-height: 1.25;
}

.cart__group-count {
  font-size: 0.78rem;
  color: var(--dz-muted);
  font-weight: 500;
}

.cart__group-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
  padding: 0.35rem 0.7rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  transition: all 0.2s ease;
}

.cart__group-link:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.cart__group-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: var(--dz-radius-md);
  background: var(--dz-surface-soft);
  margin-top: 0.25rem;
}

.cart__group-footer-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.cart__group-footer-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--dz-primary-strong);
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

/* Minimum Order Banner (Prominent notification & progress bar above cart items) */
.cart__min-order-banner {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem 1.35rem;
  border-radius: var(--dz-radius-lg);
  border: 1px solid color-mix(in srgb, var(--dz-gold) 35%, var(--dz-border));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--dz-gold-soft) 35%, var(--dz-surface)) 0%,
    var(--dz-surface) 100%
  );
  box-shadow: var(--dz-shadow-xs);
  transition: all 0.3s ease;
}

.cart__min-order-banner--reached {
  border-color: color-mix(in srgb, var(--dz-success) 35%, var(--dz-border));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--dz-success-soft) 40%, var(--dz-surface)) 0%,
    var(--dz-surface) 100%
  );
}

.cart__min-order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cart__min-order-title-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.cart__min-order-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-gold-soft);
  color: var(--dz-gold-strong);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.cart__min-order-banner--reached .cart__min-order-icon {
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.cart__min-order-heading {
  font-family: var(--dz-font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--dz-ink);
  margin: 0;
  line-height: 1.3;
}

.cart__min-order-desc {
  font-size: 0.84rem;
  color: var(--dz-ink-soft);
  margin-top: 0.2rem;
  line-height: 1.4;
}

.cart__min-order-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.65rem;
  border-radius: var(--dz-radius-full);
  font-size: 0.82rem;
  font-weight: 700;
  background: var(--dz-gold-soft);
  color: var(--dz-gold-strong);
  flex-shrink: 0;
}

.cart__min-order-banner--reached .cart__min-order-badge {
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.cart__min-order-track {
  width: 100%;
  height: 8px;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  overflow: hidden;
  border: 1px solid var(--dz-border);
}

.cart__min-order-track--sm {
  height: 6px;
  margin-block: 0.2rem;
}

.cart__min-order-bar {
  height: 100%;
  border-radius: var(--dz-radius-full);
  background: linear-gradient(90deg, var(--dz-gold), #f59e0b);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.cart__min-order-banner--reached .cart__min-order-bar,
.cart__summary-min-order--reached .cart__min-order-bar {
  background: linear-gradient(90deg, #10b981, #059669);
}

/* Minimum Order Inside Cart Summary Sidebar */
.cart__summary-min-order {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.85rem;
  border-radius: var(--dz-radius);
  background: color-mix(in srgb, var(--dz-gold-soft) 30%, var(--dz-surface));
  border: 1px dashed color-mix(in srgb, var(--dz-gold) 35%, var(--dz-border));
  margin-top: 0.4rem;
}

.cart__summary-min-order--reached {
  background: color-mix(in srgb, var(--dz-success-soft) 35%, var(--dz-surface));
  border-color: color-mix(in srgb, var(--dz-success) 35%, var(--dz-border));
}

.cart__summary-min-order-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.84rem;
}

.cart__summary-min-order-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.cart__summary-min-order-val {
  font-weight: 700;
  color: var(--dz-gold-strong);
}

.cart__summary-min-order--reached .cart__summary-min-order-val {
  color: var(--dz-success);
}

.cart__summary-min-order-hint {
  font-size: 0.78rem;
  color: var(--dz-gold-strong);
  font-weight: 600;
  line-height: 1.35;
}

.cart__summary-min-order-hint--success {
  color: var(--dz-success);
}

.cart__checkout-disabled-hint {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  color: var(--dz-warning);
  margin-top: 0.45rem;
  line-height: 1.35;
}
</style>
