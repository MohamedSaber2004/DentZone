<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { locale, t } from '../i18n'
import { addressRepository, cartService, orderRepository, authService, homeRepository } from '../di/container'
import { API_LANG } from '../config/api.config'
import AppIcon from '../components/ui/AppIcon.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import CheckoutAuthModal from '../components/checkout/CheckoutAuthModal.vue'
import type { AddressDto, AreaDto } from '../domain/models/auth'
import type { DeliveryTimeSlotDto } from '../domain/models/order'

const router = useRouter()

const loadError = ref(false)
const pageLoading = ref(true)
const addresses = ref<AddressDto[]>([])
const areas = ref<AreaDto[]>([])
const addressesLoading = ref(authService.isAuthenticated)
const addressesError = ref(false)

const selectedAddressId = ref('')
const shippingFee = ref<number | null>(null)
const feesLoading = ref(false)
const feesError = ref(false)

const showAddressForm = ref(false)
const addressLine = ref('')
const areaId = ref('')
const floorNum = ref('')
const apartmentNum = ref('')
const addressFormError = ref('')
const addressSaving = ref(false)

const couponCode = ref('')
const couponBusy = ref(false)
const couponError = ref('')
const couponApplied = ref<{ code: string; discount: number } | null>(null)

const deliveryDay = ref<number | null>(null)
const slots = ref<DeliveryTimeSlotDto[]>([])
const slotsLoading = ref(false)
const slotsError = ref(false)
const selectedSlotId = ref('')

const FRIDAY = 5
const CLOSING_MINUTES = 18 * 60

const parseTimeToMinutes = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '')
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

const note = ref('')
const placing = ref(false)
const placed = ref(false)
const orderNumber = ref<string | null>(null)

const cart = computed(() => cartService.cart.value)
const itemsCount = computed(() => cart.value?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0)
const productsCost = computed(() => Math.ceil(cart.value?.totalAmountCart ?? 0))
const discount = computed(() => Math.ceil(couponApplied.value?.discount ?? 0))
const total = computed(() =>
  Math.ceil(
    Math.max(0, productsCost.value - discount.value) +
      (shippingFee.value !== null ? Math.ceil(shippingFee.value) : 0),
  ),
)

const showAuthModal = ref(false)
const isAuth = computed(() => authService.isAuthenticated)

const isGuestAddressValid = computed(
  () => !!addressLine.value.trim() && !!areaId.value,
)

const availableSlots = computed(() => {
  if (!deliveryDay.value) return []
  const now = new Date()
  const isToday = deliveryDay.value === 1
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return slots.value.filter((slot) => {
    const from = parseTimeToMinutes(slot.from)
    const to = parseTimeToMinutes(slot.to)
    if (from === null || to === null || to > CLOSING_MINUTES) return false
    if (!isToday) return true
    if (slot.isNow) return to > nowMinutes
    return from > nowMinutes
  })
})

const selectedSlot = computed(
  () => availableSlots.value.find((slot) => slot.id === selectedSlotId.value) ?? null,
)

const canConfirm = computed(() => {
  if (placing.value) return false
  if (!deliveryDay.value || !selectedSlot.value) return false
  if (isAuth.value) {
    return !!selectedAddressId.value
  }
  return isGuestAddressValid.value
})

watch(areaId, (id) => {
  if (!isAuth.value) {
    if (!id) {
      shippingFee.value = null
      return
    }
    const area = areas.value.find((a) => a.id === Number(id))
    shippingFee.value = area ? area.shippingCosts : 0
  }
})

const formatPrice = (value: number) =>
  Math.ceil(value).toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 })

const dateLabel = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const vendorsAvailability = ref<Map<string, boolean>>(new Map())

const loadVendorsStatus = async () => {
  try {
    const lang = locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH
    const providers = await homeRepository.getAllProviders(lang)
    const map = new Map<string, boolean>()
    for (const p of providers) {
      if (p.id) {
        map.set(p.id, p.isAvailableNow)
      }
    }
    vendorsAvailability.value = map
  } catch {
    // Ignore error
  }
}

watch(locale, () => {
  void loadVendorsStatus()
})

const isAnyVendorUnavailable = computed(() => {
  // 1. Check cart-level availability flag
  if (cart.value && cart.value.isAvailableNow === false) {
    return true
  }

  // 2. Check each cart item's flags
  const items = cart.value?.items ?? []
  for (const item of items) {
    if (item.isAvailableNow === false) {
      return true
    }
    const rawItem = item as unknown as { isAvailable?: boolean }
    if (rawItem.isAvailable === false) {
      return true
    }
    const invUser = item.inventoryUser as unknown as
      | { isAvailableNow?: boolean; isAvailable?: boolean; isActive?: boolean }
      | undefined
    if (invUser?.isAvailableNow === false || invUser?.isAvailable === false || invUser?.isActive === false) {
      return true
    }

    // 3. Check against loaded vendor availability map
    const vendorId = item.inventoryUserId || item.inventoryUser?.id
    if (vendorId && vendorsAvailability.value.has(vendorId)) {
      if (vendorsAvailability.value.get(vendorId) === false) {
        return true
      }
    }
  }

  return false
})

const deliveryDayOptions = computed(() => {
  const options: { value: number; label: string; sub: string }[] = []

  // If vendor is unavailable, ignore today (offset: 0) and directly start from tomorrow (offset: 1)
  const allowedOffsets = isAnyVendorUnavailable.value ? [1] : [0, 1]

  for (const offset of allowedOffsets) {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    if (date.getDay() === FRIDAY) {
      date.setDate(date.getDate() + 1)
      options.push({
        value: offset + 2,
        label: t('checkout.tomorrow'),
        sub: dateLabel(offset + 1),
      })
      continue
    }
    options.push({
      value: offset + 1,
      label: offset === 0 ? t('checkout.today') : t('checkout.tomorrow'),
      sub: dateLabel(offset),
    })
  }
  return options
})

watch(
  deliveryDayOptions,
  (options) => {
    if (options.length === 0) {
      deliveryDay.value = null
      return
    }
    if (!deliveryDay.value || !options.some((option) => option.value === deliveryDay.value)) {
      deliveryDay.value = options[0]?.value ?? null
    }
  },
  { immediate: true },
)

const loadAddresses = async () => {
  addressesLoading.value = true
  addressesError.value = false
  try {
    addresses.value = await addressRepository.getUserAddresses()
  } catch {
    addressesError.value = true
  } finally {
    addressesLoading.value = false
  }
}

const startAddAddress = () => {
  addressLine.value = ''
  areaId.value = ''
  floorNum.value = ''
  apartmentNum.value = ''
  addressFormError.value = ''
  showAddressForm.value = true
}

const cancelAddressForm = () => {
  showAddressForm.value = false
}

const saveAddress = async () => {
  addressFormError.value = ''
  const user = authService.user.value
  const line = addressLine.value.trim()
  if (!line) {
    addressFormError.value = t('profile.errAddressLine')
    return
  }
  addressSaving.value = true
  try {
    await addressRepository.insertAddress({
      userId: user?.id ?? '',
      addressLine: line,
      areaId: areaId.value ? Number(areaId.value) : null,
      floorNum: floorNum.value.trim() === '' ? null : Number(floorNum.value),
      apartmentNum: apartmentNum.value.trim() === '' ? null : Number(apartmentNum.value),
    })
    showAddressForm.value = false
    await loadAddresses()
    const added = addresses.value[addresses.value.length - 1]
    if (added) await selectAddress(added.id)
  } catch {
    addressFormError.value = t('common.networkError')
  } finally {
    addressSaving.value = false
  }
}

const selectAddress = async (id: string) => {
  selectedAddressId.value = id
  shippingFee.value = null
  feesError.value = false
  feesLoading.value = true
  try {
    shippingFee.value = await orderRepository.getShippingFees(id)
  } catch {
    feesError.value = true
  } finally {
    feesLoading.value = false
  }
}

const applyCoupon = async () => {
  const code = couponCode.value.trim()
  if (!code || couponBusy.value) return
  couponBusy.value = true
  couponError.value = ''
  try {
    const response = await orderRepository.applyCoupon({ code, amount: productsCost.value })
    const parsed = parseCouponDiscount(response)
    if (parsed === null) throw new Error('Unrecognized coupon response')
    couponApplied.value = { code, discount: parsed }
    couponCode.value = ''
  } catch {
    couponError.value = t('checkout.couponError')
  } finally {
    couponBusy.value = false
  }
}

const removeCoupon = () => {
  couponApplied.value = null
  couponError.value = ''
}

const parseCouponDiscount = (response: unknown): number | null => {
  if (typeof response === 'number' && Number.isFinite(response)) return response
  if (typeof response === 'string' && response.trim() !== '' && Number.isFinite(Number(response))) {
    return Number(response)
  }
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>
    for (const key of ['discountAmount', 'discountValue', 'discount', 'amount']) {
      const value = record[key]
      if (typeof value === 'number' && Number.isFinite(value)) return value
    }
  }
  return null
}

const loadSlots = async (day: number) => {
  selectedSlotId.value = ''
  slots.value = []
  slotsError.value = false
  slotsLoading.value = true
  try {
    slots.value = await orderRepository.getDeliveryTimeSlots(day)
  } catch {
    slotsError.value = true
  } finally {
    slotsLoading.value = false
  }
}

watch(
  deliveryDay,
  (day) => {
    if (!day) return
    void loadSlots(day)
  },
  { immediate: true },
)

const confirmOrder = async () => {
  if (!canConfirm.value) return
  if (!isAuth.value) {
    showAuthModal.value = true
    return
  }
  await executeOrderPlacement(selectedAddressId.value)
}

const onAuthModalSuccess = async () => {
  showAuthModal.value = false
  placing.value = true
  try {
    // 1. Sync guest cart to server
    await cartService.syncGuestCartToServer()
    await cartService.refresh()

    // 2. Save the guest address to user account if needed
    const user = authService.user.value
    await loadAddresses()
    let targetAddressId = selectedAddressId.value

    if (!targetAddressId && addressLine.value.trim()) {
      const existingMatch = addresses.value.find(
        (a) => a.addressLine.trim().toLowerCase() === addressLine.value.trim().toLowerCase(),
      )
      if (existingMatch) {
        targetAddressId = existingMatch.id
      } else {
        await addressRepository.insertAddress({
          userId: user?.id ?? '',
          addressLine: addressLine.value.trim(),
          areaId: areaId.value ? Number(areaId.value) : null,
          floorNum: floorNum.value.trim() === '' ? null : Number(floorNum.value),
          apartmentNum: apartmentNum.value.trim() === '' ? null : Number(apartmentNum.value),
        })
        await loadAddresses()
        const added = addresses.value[addresses.value.length - 1]
        if (added) targetAddressId = added.id
      }
    }

    if (!targetAddressId && addresses.value.length > 0) {
      targetAddressId = addresses.value[0]?.id ?? ''
    }

    if (!targetAddressId) {
      throw new Error('Failed to create or resolve address')
    }

    await executeOrderPlacement(targetAddressId)
  } catch {
    placing.value = false
  }
}

const executeOrderPlacement = async (targetAddressId: string) => {
  placing.value = true
  try {
    const response = await orderRepository.createOrder({
      addresssId: targetAddressId,
      deliveryDate: deliveryDay.value as number,
      orderNote: note.value.trim() || undefined,
      deliveryTimeSlotId: selectedSlotId.value,
      couponCode: couponApplied.value?.code,
    })
    orderNumber.value = parseOrderNumber(response)
    cartService.clear()
    placed.value = true
    window.scrollTo({ top: 0 })
  } catch {
    // The HTTP client already surfaces the failure feedback.
  } finally {
    placing.value = false
  }
}

const parseOrderNumber = (response: unknown): string | null => {
  if (typeof response === 'string' && response.trim() !== '') return response.trim()
  if (typeof response === 'number' && Number.isFinite(response)) return String(response)
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>
    const value = record.orderNumber ?? record.orderNum ?? record.id
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return null
}

const load = async () => {
  pageLoading.value = true
  loadError.value = false
  try {
    const ok = await cartService.refresh()
    if (!ok || !cartService.cart.value || cartService.cart.value.items.length === 0) {
      void router.replace({ name: 'cart' })
      return
    }

    void loadVendorsStatus()
    try {
      const limits = await orderRepository.getOrderLimits()
      if (limits && limits.length > 0 && limits[0]) {
        const raw = limits[0]
        const minOrder = Number(raw.minimumorder ?? (raw as unknown as { minimumOrder?: number }).minimumOrder ?? 0)
        if (minOrder > 0 && Math.ceil(cartService.cart.value.totalAmountCart ?? 0) < minOrder) {
          void router.replace({ name: 'cart' })
          return
        }
      }
    } catch {
      // Graceful ignore
    }
    const areaPromise = addressRepository.getAllAreas()
      .then((items: AreaDto[]) => (areas.value = items))
      .catch(() => undefined)

    if (authService.isAuthenticated) {
      await Promise.all([loadAddresses(), areaPromise])
    } else {
      addressesLoading.value = false
      await areaPromise
    }
  } catch {
    loadError.value = true
  } finally {
    pageLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="container page">
    <div v-if="placed" class="checkout__success">
      <span class="checkout__success-icon"><AppIcon name="check-circle" :size="34" /></span>
      <h1 class="checkout__success-title">{{ t('checkout.successTitle') }}</h1>
      <p v-if="orderNumber" class="checkout__success-num">
        {{ t('checkout.orderNumber') }}: <strong dir="ltr">{{ orderNumber }}</strong>
      </p>
      <p class="checkout__success-desc">{{ t('checkout.successDesc') }}</p>
      <div class="checkout__success-actions">
        <RouterLink to="/categories">
          <AppButton variant="primary">
            {{ t('checkout.continueShopping') }}
            <AppIcon name="arrow-right" :size="15" />
          </AppButton>
        </RouterLink>
        <RouterLink to="/">
          <AppButton variant="ghost">{{ t('checkout.backHome') }}</AppButton>
        </RouterLink>
      </div>
    </div>

    <template v-else>
      <div class="page__head">
        <div>
          <h1 class="page__title">{{ t('checkout.title') }}</h1>
          <p v-if="itemsCount" class="page__count">
            {{ t('cart.count', { count: itemsCount }) }}
          </p>
        </div>
        <RouterLink to="/cart" class="checkout__back">
          <AppIcon name="arrow-left" :size="15" />
          {{ t('cart.title') }}
        </RouterLink>
      </div>

      <div v-if="pageLoading" class="checkout__layout" role="status" :aria-label="t('common.loading')">
        <div class="checkout__steps">
          <section v-for="s in 3" :key="s" class="checkout__step checkout__step--skeleton">
            <div class="checkout__step-title">
              <span class="skeleton checkout__skeleton-num" />
              <span class="skeleton checkout__skeleton-line checkout__skeleton-line--title" />
            </div>
            <div class="checkout__skeleton-step-body">
              <span class="skeleton checkout__skeleton-input" />
              <div class="checkout__skeleton-row">
                <span class="skeleton checkout__skeleton-input" />
                <span class="skeleton checkout__skeleton-input" />
              </div>
            </div>
          </section>
        </div>

        <aside class="checkout__summary checkout__summary--skeleton">
          <span class="skeleton checkout__skeleton-line checkout__skeleton-line--sum-title" />
          <div class="checkout__skeleton-row-between">
            <span class="skeleton checkout__skeleton-line checkout__skeleton-line--sub" />
            <span class="skeleton checkout__skeleton-line checkout__skeleton-line--val" />
          </div>
          <div class="checkout__skeleton-row-between">
            <span class="skeleton checkout__skeleton-line checkout__skeleton-line--sub" />
            <span class="skeleton checkout__skeleton-line checkout__skeleton-line--val" />
          </div>
          <div class="checkout__skeleton-row-between">
            <span class="skeleton checkout__skeleton-line checkout__skeleton-line--sub" />
            <span class="skeleton checkout__skeleton-line checkout__skeleton-line--val" />
          </div>
          <span class="skeleton checkout__skeleton-btn" />
        </aside>
      </div>

      <div v-else-if="loadError" class="page__state" role="alert">
        <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
        <h2 class="page__state-title">{{ t('checkout.title') }}</h2>
        <p class="page__state-desc">{{ t('checkout.loadError') }}</p>
        <AppButton variant="primary" @click="load">
          <AppIcon name="refresh" :size="15" />
          {{ t('categories.retry') }}
        </AppButton>
      </div>

      <div v-else class="checkout__layout">
        <div class="checkout__steps">
          <section class="checkout__step">
            <h2 class="checkout__step-title">
              <span class="checkout__step-num">1</span>
              {{ isAuth ? t('checkout.stepAddress') : t('checkout.guestAddressTitle') }}
            </h2>

            <!-- GUEST ADDRESS FORM -->
            <div v-if="!isAuth" class="checkout__guest-address-form">
              <AppInput v-model="addressLine" :label="t('profile.addressLine')" required />
              <div class="checkout__field">
                <label class="app-input__label">{{ t('profile.area') }}</label>
                <select v-model="areaId" class="checkout__select">
                  <option value="">{{ t('profile.selectArea') }}</option>
                  <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
                </select>
              </div>
              <div class="checkout__address-form-row">
                <AppInput v-model="floorNum" :label="t('profile.floor')" type="text" inputmode="numeric" />
                <AppInput v-model="apartmentNum" :label="t('profile.apartment')" type="text" inputmode="numeric" />
              </div>
            </div>

            <!-- AUTHENTICATED USER ADDRESSES -->
            <template v-else>
              <div v-if="addressesLoading" class="checkout__state-row">
                <AppIcon name="refresh" :size="17" class="checkout__spinner" />
                <span>{{ t('common.loading') }}</span>
              </div>

              <div v-else-if="addressesError" class="checkout__state-row" role="alert">
                <AppIcon name="alert-circle" :size="16" />
                <span>{{ t('checkout.addressesError') }}</span>
                <button type="button" class="checkout__retry" @click="loadAddresses">
                  <AppIcon name="refresh" :size="13" />
                  {{ t('categories.retry') }}
                </button>
              </div>

              <template v-else>
              <p v-if="addresses.length === 0" class="checkout__empty">
                {{ t('checkout.noAddresses') }}
              </p>

              <div v-else class="checkout__addresses">
                <label
                  v-for="address in addresses"
                  :key="address.id"
                  class="checkout__address"
                  :class="{ 'checkout__address--selected': selectedAddressId === address.id }"
                >
                  <input
                    type="radio"
                    name="checkout-address"
                    class="checkout__radio"
                    :value="address.id"
                    :checked="selectedAddressId === address.id"
                    @change="selectAddress(address.id)"
                  />
                  <AppIcon name="map-pin" :size="16" class="checkout__address-icon" />
                  <span class="checkout__address-body">
                    <span class="checkout__address-line" dir="auto">{{ address.addressLine }}</span>
                    <span class="checkout__address-meta">
                      {{ address.area?.name ?? '—' }}
                      <template v-if="address.floorNum != null"> · {{ t('profile.floor') }}: {{ address.floorNum }}</template>
                      <template v-if="address.apartmentNum != null"> · {{ t('profile.apartment') }}: {{ address.apartmentNum }}</template>
                    </span>
                  </span>
                  <span v-if="feesLoading && selectedAddressId === address.id" class="checkout__fees-loading">
                    <AppIcon name="refresh" :size="13" class="checkout__spinner" />
                  </span>
                </label>
              </div>

              <button v-if="!showAddressForm" type="button" class="checkout__add-address" @click="startAddAddress">
                <AppIcon name="plus" :size="14" />
                {{ t('checkout.addAddress') }}
              </button>

              <form v-if="showAddressForm" class="checkout__address-form" novalidate @submit.prevent="saveAddress">
                <AppInput v-model="addressLine" :label="t('profile.addressLine')" required />
                <div class="checkout__field">
                  <label class="app-input__label">{{ t('profile.area') }}</label>
                  <select v-model="areaId" class="checkout__select">
                    <option value="">{{ t('profile.selectArea') }}</option>
                    <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
                  </select>
                </div>
                <div class="checkout__address-form-row">
                  <AppInput v-model="floorNum" :label="t('profile.floor')" type="text" inputmode="numeric" />
                  <AppInput v-model="apartmentNum" :label="t('profile.apartment')" type="text" inputmode="numeric" />
                </div>
                <p v-if="addressFormError" class="checkout__error" role="alert">
                  <AppIcon name="alert-circle" :size="16" />
                  {{ addressFormError }}
                </p>
                <div class="checkout__address-form-actions">
                  <AppButton type="submit" variant="primary" :disabled="addressSaving">
                    <AppIcon v-if="addressSaving" name="refresh" :size="16" class="checkout__spinner" />
                    {{ t('checkout.addAddress') }}
                  </AppButton>
                  <AppButton type="button" variant="ghost" :disabled="addressSaving" @click="cancelAddressForm">
                    {{ t('profile.cancel') }}
                  </AppButton>
                </div>
              </form>
            </template>
          </template>
        </section>

          <section class="checkout__step">
            <h2 class="checkout__step-title">
              <span class="checkout__step-num">2</span>
              {{ t('checkout.stepPayment') }}
            </h2>
            <label class="checkout__payment checkout__payment--selected">
              <input type="radio" name="checkout-payment" class="checkout__radio" checked />
              <AppIcon name="banknote" :size="18" class="checkout__payment-icon" />
              <span class="checkout__payment-body">
                <span class="checkout__payment-title">{{ t('checkout.cashOnDelivery') }}</span>
                <span class="checkout__payment-desc">{{ t('checkout.cashOnDeliveryDesc') }}</span>
              </span>
            </label>
            <p class="checkout__cod-note">
              <AppIcon name="alert-circle" :size="15" />
              {{ t('checkout.codNote') }}
            </p>
          </section>

          <section class="checkout__step">
            <h2 class="checkout__step-title">
              <span class="checkout__step-num">3</span>
              {{ t('checkout.stepCoupon') }}
            </h2>

            <div v-if="couponApplied" class="checkout__coupon-applied">
              <AppIcon name="check-circle" :size="16" />
              <span class="checkout__coupon-applied-text">
                {{ t('checkout.couponApplied', { code: couponApplied.code, discount: `${formatPrice(couponApplied.discount)} ${t('products.currency')}` }) }}
              </span>
              <button type="button" class="checkout__coupon-remove" :aria-label="t('checkout.removeCoupon')" @click="removeCoupon">
                <AppIcon name="close" :size="13" />
              </button>
            </div>

            <form v-else class="checkout__coupon" novalidate @submit.prevent="applyCoupon">
              <input
                v-model="couponCode"
                type="text"
                class="checkout__coupon-input"
                :placeholder="t('checkout.couponPlaceholder')"
                :disabled="couponBusy"
              />
              <AppButton type="submit" variant="primary" :disabled="couponBusy || !couponCode.trim()">
                <AppIcon v-if="couponBusy" name="refresh" :size="15" class="checkout__spinner" />
                {{ t('checkout.apply') }}
              </AppButton>
            </form>
            <p v-if="couponError" class="checkout__error" role="alert">
              <AppIcon name="alert-circle" :size="16" />
              {{ couponError }}
            </p>
          </section>

          <section class="checkout__step">
            <h2 class="checkout__step-title">
              <span class="checkout__step-num">4</span>
              {{ t('checkout.stepDeliveryTime') }}
            </h2>
            <div v-if="isAnyVendorUnavailable" class="checkout__vendor-notice">
              <AppIcon name="clock" :size="16" />
              <span>
                {{ locale === 'ar' ? 'المورد غير متاح حالياً للتوصيل اليوم، موعد التوصيل المتاح غداً مباشرة.' : 'The supplier is not available for today delivery; delivery is scheduled for tomorrow.' }}
              </span>
            </div>

            <div
              class="checkout__days"
              :class="{ 'checkout__days--single': deliveryDayOptions.length === 1 }"
            >
              <button
                v-for="option in deliveryDayOptions"
                :key="option.value"
                type="button"
                class="checkout__day"
                :class="{ 'checkout__day--selected': deliveryDay === option.value }"
                @click="deliveryDay = option.value"
              >
                <strong>{{ option.label }}</strong>
                <span>{{ option.sub }}</span>
              </button>
            </div>

            <p class="checkout__delivery-policy">
              <AppIcon name="alert-circle" :size="15" />
              {{ t('checkout.deliveryPolicy') }}
            </p>

            <div v-if="slotsLoading" class="checkout__state-row">
              <AppIcon name="refresh" :size="17" class="checkout__spinner" />
              <span>{{ t('common.loading') }}</span>
            </div>

            <div v-else-if="slotsError" class="checkout__state-row" role="alert">
              <AppIcon name="alert-circle" :size="16" />
              <span>{{ t('checkout.slotsError') }}</span>
              <button type="button" class="checkout__retry" @click="deliveryDay ? loadSlots(deliveryDay) : undefined">
                <AppIcon name="refresh" :size="13" />
                {{ t('categories.retry') }}
              </button>
            </div>

            <div v-else-if="deliveryDay && availableSlots.length === 0" class="checkout__empty">
              {{ t('checkout.noSlots') }}
            </div>

            <div v-else-if="deliveryDay" class="checkout__slots">
              <button
                v-for="slot in availableSlots"
                :key="slot.id"
                type="button"
                class="checkout__slot"
                :class="{ 'checkout__slot--selected': selectedSlotId === slot.id }"
                @click="selectedSlotId = slot.id"
              >
                <span class="checkout__slot-name">{{ slot.name }}</span>
                <span v-if="slot.isNow" class="checkout__slot-now">{{ t('checkout.slotNow') }}</span>
              </button>
            </div>
          </section>

          <section class="checkout__step">
            <h2 class="checkout__step-title">
              <span class="checkout__step-num">5</span>
              {{ t('checkout.stepNote') }}
            </h2>
            <textarea
              v-model="note"
              class="checkout__note"
              rows="3"
              :placeholder="t('checkout.notePlaceholder')"
            ></textarea>
          </section>
        </div>

        <aside class="checkout__summary">
          <h2 class="checkout__summary-title">{{ t('summary.total') }}</h2>
          <div class="checkout__summary-row">
            <span>{{ t('summary.items', { count: itemsCount }) }}</span>
            <strong>{{ formatPrice(productsCost) }} {{ t('products.currency') }}</strong>
          </div>
          <div class="checkout__summary-row checkout__summary-row--discount">
            <span>{{ t('summary.discount') }}</span>
            <strong>{{ discount > 0 ? '-' : '' }}{{ formatPrice(discount) }} {{ t('products.currency') }}</strong>
          </div>
          <div class="checkout__summary-row">
            <span>{{ t('checkout.deliveryFees') }}</span>
            <strong v-if="feesLoading"><span class="skeleton checkout__fees-skeleton" /></strong>
            <strong v-else-if="shippingFee !== null">{{ formatPrice(shippingFee) }} {{ t('products.currency') }}</strong>
            <strong v-else class="checkout__summary-muted">{{ t('checkout.selectAddressForFees') }}</strong>
          </div>
          <div class="checkout__summary-row checkout__summary-row--total">
            <span>{{ t('summary.total') }}</span>
            <strong>{{ formatPrice(total) }} {{ t('products.currency') }}</strong>
          </div>
          <AppButton
            variant="primary"
            class="checkout__confirm"
            :disabled="!canConfirm"
            @click="confirmOrder"
          >
            <AppIcon v-if="placing" name="refresh" :size="16" class="checkout__spinner" />
            {{ placing ? t('checkout.placing') : t('checkout.confirm') }}
          </AppButton>
          <p v-if="!canConfirm && !placing" class="checkout__confirm-hint">
            {{ t('checkout.missingSelection') }}
          </p>
        </aside>
      </div>
    </template>

    <CheckoutAuthModal
      :is-open="showAuthModal"
      :area-id="areaId ? Number(areaId) : undefined"
      :address-line="addressLine.trim() || undefined"
      @close="showAuthModal = false"
      @success="onAuthModalSuccess"
    />
  </div>
</template>

<style scoped>
.checkout__guest-address-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
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

.checkout__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  white-space: nowrap;
}

.checkout__back:hover {
  color: var(--dz-primary-strong);
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

.checkout__skeleton-num {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: var(--dz-radius-full);
  flex-shrink: 0;
}

.checkout__skeleton-step-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1rem;
}

.checkout__skeleton-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.checkout__skeleton-input {
  height: 2.6rem;
  width: 100%;
  border-radius: var(--dz-radius-md);
}

.checkout__skeleton-row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.checkout__skeleton-btn {
  height: 2.85rem;
  width: 100%;
  border-radius: var(--dz-radius-full);
  margin-top: 0.75rem;
}

.checkout__skeleton-line {
  height: 0.85rem;
}

.checkout__skeleton-line--title {
  width: 35%;
  height: 1.1rem;
}

.checkout__skeleton-line--sum-title {
  width: 45%;
  height: 1.2rem;
  margin-bottom: 0.5rem;
}

.checkout__skeleton-line--sub {
  width: 35%;
  height: 0.8rem;
}

.checkout__skeleton-line--val {
  width: 25%;
  height: 0.85rem;
}

.checkout__fees-skeleton {
  display: inline-block;
  width: 3.5rem;
  height: 0.95rem;
  vertical-align: middle;
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

.checkout__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.5rem;
  align-items: start;
}

.checkout__steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkout__step {
  padding: 1.2rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
}

.checkout__step-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--dz-font-display);
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.checkout__step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.85rem;
  font-weight: 700;
}

.checkout__state-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: var(--dz-muted);
}

.checkout__retry {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.checkout__empty {
  font-size: 0.88rem;
  color: var(--dz-muted);
}

.checkout__spinner {
  animation: checkout-spin 0.9s linear infinite;
}

@keyframes checkout-spin {
  to {
    transform: rotate(360deg);
  }
}

.checkout__addresses {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.checkout__address {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.8rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.checkout__address:hover {
  border-color: var(--dz-primary);
}

.checkout__address--selected {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
}

.checkout__radio {
  accent-color: var(--dz-primary);
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.checkout__address-icon {
  color: var(--dz-muted);
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.checkout__address--selected .checkout__address-icon {
  color: var(--dz-primary-strong);
}

.checkout__address-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkout__address-line {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.35;
}

.checkout__address-meta {
  font-size: 0.78rem;
  color: var(--dz-muted);
}

.checkout__fees-loading {
  display: flex;
  align-items: center;
  color: var(--dz-primary-strong);
}

.checkout__add-address {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.checkout__address-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 0.9rem;
  padding: 1rem;
  border: 1px dashed var(--dz-border-strong);
  border-radius: var(--dz-radius);
}

.checkout__address-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.checkout__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.checkout__select {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  font-size: 0.9rem;
  color: var(--dz-ink);
  transition: border-color 0.18s ease;
}

.checkout__select:focus {
  outline: none;
  border-color: var(--dz-primary);
}

.checkout__address-form-actions {
  display: flex;
  gap: 0.6rem;
}

.checkout__error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--dz-danger);
}

.checkout__payment {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.9rem;
  border: 1px solid var(--dz-primary);
  border-radius: var(--dz-radius);
  background: var(--dz-primary-faint);
  cursor: default;
}

.checkout__payment-icon {
  color: var(--dz-primary-strong);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.checkout__payment-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.checkout__payment-title {
  font-size: 0.92rem;
  font-weight: 700;
}

.checkout__payment-desc {
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.checkout__cod-note {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 0.7rem;
  padding: 0.7rem 0.85rem;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
  font-size: 0.8rem;
  line-height: 1.5;
}

.checkout__coupon-applied {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: var(--dz-radius);
  background: var(--dz-success-soft);
  color: var(--dz-success);
  font-size: 0.88rem;
}

.checkout__coupon-applied-text {
  flex: 1;
  font-weight: 600;
}

.checkout__coupon-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  color: var(--dz-success);
  flex-shrink: 0;
}

.checkout__coupon-remove:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.checkout__coupon {
  display: flex;
  gap: 0.6rem;
}

.checkout__coupon-input {
  flex: 1;
  min-width: 0;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  font-size: 0.9rem;
  color: var(--dz-ink);
  text-transform: uppercase;
  transition: border-color 0.18s ease;
}

.checkout__coupon-input:focus {
  outline: none;
  border-color: var(--dz-primary);
}

.checkout__vendor-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  margin-bottom: 0.85rem;
  border-radius: var(--dz-radius-md, 0.5rem);
  background: rgba(247, 147, 59, 0.1);
  border: 1px solid rgba(247, 147, 59, 0.3);
  color: var(--dz-gold-dark, #b45309);
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.4;
}

.checkout__vendor-notice svg {
  flex-shrink: 0;
  color: var(--dz-gold, #f7931b);
}

.checkout__days {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.checkout__days--single {
  grid-template-columns: 1fr;
}

.checkout__delivery-policy {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
  color: var(--dz-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.checkout__delivery-policy svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: var(--dz-primary);
}

.checkout__day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.8rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  cursor: pointer;
  text-align: start;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.checkout__day:hover {
  border-color: var(--dz-primary);
}

.checkout__day--selected {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
}

.checkout__day strong {
  font-size: 0.9rem;
  color: var(--dz-ink);
}

.checkout__day span {
  font-size: 0.78rem;
  color: var(--dz-muted);
}

.checkout__slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.6rem;
}

.checkout__slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.checkout__slot:hover {
  border-color: var(--dz-primary);
}

.checkout__slot--selected {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
}

.checkout__slot-name {
  font-size: 0.85rem;
  font-weight: 600;
}

.checkout__slot-now {
  flex-shrink: 0;
  padding: 0.15rem 0.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-success-soft);
  color: var(--dz-success);
  font-size: 0.68rem;
  font-weight: 700;
}

.checkout__note {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--dz-ink);
  resize: vertical;
  transition: border-color 0.18s ease;
}

.checkout__note:focus {
  outline: none;
  border-color: var(--dz-primary);
}

.checkout__summary {
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

.checkout__summary-title {
  font-family: var(--dz-font-display);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.checkout__summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--dz-ink-soft);
}

.checkout__summary-row strong {
  color: var(--dz-ink);
  font-weight: 700;
  white-space: nowrap;
}

.checkout__summary-row--discount strong {
  color: var(--dz-success);
}

.checkout__summary-muted {
  font-size: 0.78rem;
  font-weight: 500 !important;
  color: var(--dz-muted) !important;
}

.checkout__summary-row--total {
  padding-top: 0.7rem;
  border-top: 1px solid var(--dz-border);
  font-size: 1rem;
  color: var(--dz-ink);
}

.checkout__summary-row--total strong {
  font-size: 1.15rem;
  color: var(--dz-primary-strong);
}

.checkout__confirm {
  margin-top: 0.7rem;
  width: 100%;
}

.checkout__confirm-hint {
  font-size: 0.78rem;
  color: var(--dz-muted);
  text-align: center;
}

.checkout__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 5rem 1rem;
  text-align: center;
}

.checkout__success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-success-soft);
  color: var(--dz-success);
  margin-bottom: 0.4rem;
}

.checkout__success-title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.4rem, 3vw, 1.8rem);
  font-weight: 600;
}

.checkout__success-num {
  font-size: 0.95rem;
  color: var(--dz-ink-soft);
}

.checkout__success-num strong {
  color: var(--dz-primary-strong);
}

.checkout__success-desc {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 44ch;
}

.checkout__success-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.6rem;
}

@media (max-width: 900px) {
  .page {
    padding-block: 1.5rem 3.5rem;
  }

  .checkout__layout {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .checkout__summary {
    position: static;
  }
}

@media (max-width: 560px) {
  .page__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.65rem;
    margin-bottom: 1.25rem;
  }

  .checkout__step {
    padding: 0.95rem;
  }

  .checkout__days {
    grid-template-columns: 1fr;
  }

  .checkout__slots {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .checkout__address-form-row {
    grid-template-columns: 1fr;
  }

  .checkout__coupon {
    flex-direction: column;
  }

  .checkout__coupon :deep(.app-button) {
    width: 100%;
    justify-content: center;
  }

  .checkout__success-actions {
    flex-direction: column;
    width: 100%;
    max-width: 260px;
  }
}
</style>