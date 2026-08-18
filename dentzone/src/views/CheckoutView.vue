<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { cartService } from '../application/cart.service'
import { orderService } from '../application/order.service'
import { toastService } from '../application/toast.service'
import { authService } from '../application/auth.service'
import { t } from '../i18n'
import AppInput from '../components/ui/AppInput.vue'
import AppButton from '../components/ui/AppButton.vue'
import OrderSummary from '../components/store/OrderSummary.vue'
import OrderLinesList from '../components/store/OrderLinesList.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppIcon from '../components/ui/AppIcon.vue'

const router = useRouter()

const isAuthenticated = computed(() => authService.isAuthenticated)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
})

const errors = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
})

const submitting = ref(false)

onMounted(() => {
  const user = authService.user.value
  if (user) {
    if (!form.name) form.name = `${user.firstName} ${user.lastName}`.trim()
    if (!form.email) form.email = user.email
    if (!form.phone && user.phone) form.phone = user.phone
  }
})

const validate = (): boolean => {
  errors.name = form.name.trim().length < 3 ? t('checkout.errName') : ''
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : t('checkout.errEmail')
  errors.phone = form.phone.trim().length >= 7 ? '' : t('checkout.errPhone')
  errors.address = form.address.trim().length < 5 ? t('checkout.errAddress') : ''
  errors.city = form.city.trim().length < 2 ? t('checkout.errCity') : ''
  return Object.values(errors).every((error) => error === '')
}

const placeOrder = async () => {
  if (submitting.value) return
  if (!validate()) {
    toastService.error(t('checkout.errFixFields'))
    return
  }
  submitting.value = true
  try {
    const order = await orderService.placeOrder({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      notes: form.notes.trim() || undefined,
    })
    toastService.success(t('checkout.orderPlaced', { id: order.orderNumber }))
    void router.push({ path: `/order/${order.id}` })
  } catch {
    toastService.error(t('checkout.orderFailed'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container page">
    <h1 class="checkout__title">{{ t('checkout.title') }}</h1>

    <nav class="steps" :aria-label="t('checkout.progressAria')">
      <RouterLink to="/cart" class="steps__item">
        <span class="steps__dot"><AppIcon name="check" :size="13" /></span>
        <span class="steps__label">{{ t('checkout.stepCart') }}</span>
      </RouterLink>
      <span class="steps__bar" />
      <span class="steps__item steps__item--current">
        <span class="steps__dot">2</span>
        <span class="steps__label">{{ t('checkout.stepCheckout') }}</span>
      </span>
      <span class="steps__bar" />
      <span class="steps__item">
        <span class="steps__dot">3</span>
        <span class="steps__label">{{ t('checkout.stepConfirmation') }}</span>
      </span>
    </nav>

    <EmptyState
      v-if="!isAuthenticated"
      icon="user"
      :title="t('checkout.signInRequired')"
      :description="t('checkout.signInDescription')"
    >
      <template #action>
        <RouterLink to="/auth/login" :query="{ redirect: '/checkout' }">
          <AppButton><AppIcon name="user" :size="16" /> {{ t('checkout.signIn') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="cartService.lines.value.length === 0"
      icon="cart"
      :title="t('checkout.nothingToCheckout')"
      :description="t('checkout.emptyDescription')"
    >
      <template #action>
        <RouterLink to="/catalog">
          <AppButton>{{ t('cart.browseProducts') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>

    <div v-else class="checkout__layout">
      <form class="checkout__form" novalidate @submit.prevent="placeOrder">
        <section class="checkout__section">
          <h2 class="checkout__heading">{{ t('checkout.contactDetails') }}</h2>
          <div class="checkout__grid">
            <AppInput v-model="form.name" :label="t('checkout.fullName')" :placeholder="t('checkout.namePlaceholder')" required :error="errors.name" autocomplete="name" class="checkout__full" />
            <AppInput v-model="form.email" :label="t('checkout.emailAddress')" type="email" :placeholder="t('checkout.emailPlaceholder')" required :error="errors.email" autocomplete="email" class="checkout__full" />
            <AppInput v-model="form.phone" :label="t('checkout.phoneNumber')" type="tel" :placeholder="t('checkout.phonePlaceholder')" required :error="errors.phone" autocomplete="tel" class="checkout__full" />
          </div>
        </section>

        <section class="checkout__section">
          <h2 class="checkout__heading">{{ t('checkout.shippingAddress') }}</h2>
          <div class="checkout__grid">
            <AppInput v-model="form.address" :label="t('checkout.streetAddress')" :placeholder="t('checkout.addressPlaceholder')" required :error="errors.address" autocomplete="street-address" class="checkout__full" />
            <AppInput v-model="form.city" :label="t('checkout.city')" :placeholder="t('checkout.cityPlaceholder')" required :error="errors.city" autocomplete="address-level2" />
            <AppInput v-model="form.notes" :label="t('checkout.orderNotes')" :placeholder="t('checkout.notesPlaceholder')" />
          </div>
        </section>

        <section class="checkout__section">
          <h2 class="checkout__heading">{{ t('checkout.payment') }}</h2>
          <p class="checkout__payment-note">
            {{ t('checkout.paymentNote') }}
          </p>
        </section>
      </form>

      <aside class="checkout__summary">
        <h2 class="checkout__heading">{{ t('checkout.orderSummary') }}</h2>
        <div class="checkout__lines">
          <OrderLinesList :lines="cartService.lines.value" />
        </div>
        <OrderSummary
          :subtotal="cartService.subtotal.value"
          :discount="cartService.discount.value"
          :shipping="cartService.shipping.value"
          :tax="cartService.tax.value"
          :total="cartService.total.value"
        />
        <AppButton size="lg" block :disabled="submitting" @click="placeOrder">
          {{ submitting ? t('checkout.placingOrder') : t('checkout.placeOrder') }}
        </AppButton>
        <RouterLink to="/cart" class="checkout__back">{{ t('checkout.backToCart') }}</RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.checkout__title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.steps {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.steps__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.steps__item--current {
  color: var(--dz-ink);
}

.steps__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border-strong);
  font-size: 0.75rem;
  font-weight: 700;
}

.steps__item:first-child .steps__dot {
  background: var(--dz-primary);
  border-color: transparent;
  color: var(--dz-on-primary);
}

.steps__item--current .steps__dot {
  background: var(--dz-primary);
  border-color: var(--dz-primary);
  color: var(--dz-white);
  box-shadow: var(--dz-ring);
}

.steps__bar {
  flex: 1;
  max-width: 90px;
  height: 2px;
  background: var(--dz-border);
  border-radius: var(--dz-radius-full);
}

.checkout__layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  align-items: start;
}

.checkout__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.checkout__section {
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  padding: 1.5rem;
}

.checkout__heading {
  font-size: 1.05rem;
  margin-bottom: 1rem;
}

.checkout__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkout__full {
  grid-column: 1 / -1;
}

.checkout__payment-note {
  font-size: 0.85rem;
  color: var(--dz-muted);
  background: var(--dz-primary-faint);
  padding: 0.8rem 1rem;
  border-radius: var(--dz-radius-sm);
}

.checkout__summary {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  padding: 1.5rem;
  position: sticky;
  top: calc(var(--dz-header-height) + 1rem);
}

.checkout__lines {
  border-bottom: 1px solid var(--dz-border);
  padding-bottom: 1rem;
}

.checkout__back {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.checkout__back:hover {
  color: var(--dz-primary-strong);
}

@media (max-width: 900px) {
  .checkout__layout {
    grid-template-columns: 1fr;
  }

  .checkout__summary {
    position: static;
  }
}

@media (max-width: 560px) {
  .checkout__grid {
    grid-template-columns: 1fr;
  }

  .checkout__full {
    grid-column: auto;
  }
}
</style>