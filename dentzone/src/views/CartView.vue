<script setup lang="ts">
import { cartService } from '../application/cart.service'
import { toastService } from '../application/toast.service'
import { formatPrice, t } from '../i18n'
import ProductImage from '../components/ui/ProductImage.vue'
import QuantityStepper from '../components/ui/QuantityStepper.vue'
import AppButton from '../components/ui/AppButton.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import OrderSummary from '../components/store/OrderSummary.vue'

const removeLine = (productId: string, name: string) => {
  cartService.remove(productId)
  toastService.info(t('cart.removedToast', { name }))
}

const setQuantity = (productId: string, quantity: number) => {
  cartService.setQuantity(productId, quantity)
}
</script>

<template>
  <div class="container page">
    <h1 class="cart__title">{{ t('cart.title') }}</h1>

    <EmptyState
      v-if="cartService.lines.value.length === 0"
      emoji="🛒"
      :title="t('cart.emptyTitle')"
      :description="t('cart.emptyDescription')"
    >
      <template #action>
        <RouterLink to="/catalog">
          <AppButton size="lg">{{ t('cart.browseProducts') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>

    <div v-else class="cart__layout">
      <section class="cart__items">
        <ul class="cart__list">
          <li v-for="line in cartService.lines.value" :key="line.product.id" class="cart__line">
            <RouterLink :to="`/product/${line.product.slug}`" class="cart__thumb">
              <ProductImage :product="line.product" size="sm" />
            </RouterLink>

            <div class="cart__info">
              <RouterLink :to="`/product/${line.product.slug}`" class="cart__name">
                {{ line.product.name }}
              </RouterLink>
              <span class="cart__unit">
                {{ t('cart.each', { price: formatPrice(line.product.price) }) }}
                <span v-if="line.product.compareAtPrice" class="cart__compare">
                  <s>{{ formatPrice(line.product.compareAtPrice) }}</s>
                </span>
              </span>
              <button class="cart__remove" type="button" @click="removeLine(line.product.id, line.product.name)">
                <AppIcon name="trash" :size="14" />
                {{ t('cart.remove') }}
              </button>
            </div>

            <div class="cart__controls">
              <QuantityStepper
                :model-value="line.quantity"
                :max="Math.max(1, line.product.stockQuantity)"
                size="sm"
                @update:model-value="setQuantity(line.product.id, $event)"
              />
              <span class="cart__subtotal">{{ formatPrice(line.product.price * line.quantity) }}</span>
            </div>
          </li>
        </ul>
      </section>

      <aside class="cart__summary">
        <OrderSummary
          :subtotal="cartService.subtotal.value"
          :discount="cartService.discount.value"
          :shipping="cartService.shipping.value"
          :tax="cartService.tax.value"
          :total="cartService.total.value"
          :show-shipping-note="true"
        />
        <RouterLink to="/checkout" class="cart__checkout">
          <AppButton size="lg" block>{{ t('cart.proceedToCheckout') }}</AppButton>
        </RouterLink>
        <RouterLink to="/catalog" class="cart__continue">{{ t('cart.continueShopping') }}</RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.cart__title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.cart__layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 2rem;
  align-items: start;
}

.cart__list {
  display: flex;
  flex-direction: column;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
}

.cart__line {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
}

.cart__line + .cart__line {
  border-top: 1px solid var(--dz-border);
}

.cart__thumb {
  flex-shrink: 0;
}

.cart__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.cart__name {
  font-weight: 600;
  font-size: 0.95rem;
}

.cart__name:hover {
  color: var(--dz-primary-strong);
}

.cart__unit {
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.cart__compare {
  color: var(--dz-muted);
  margin-left: 0.25rem;
}

.cart__remove {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  align-self: flex-start;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dz-danger);
}

.cart__remove:hover {
  text-decoration: underline;
}

.cart__controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  flex-shrink: 0;
}

.cart__subtotal {
  font-weight: 700;
  font-size: 0.95rem;
}

.cart__summary {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  position: sticky;
  top: calc(var(--dz-header-height) + 1rem);
}

.cart__continue {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.cart__continue:hover {
  color: var(--dz-primary-strong);
}

@media (max-width: 900px) {
  .cart__layout {
    grid-template-columns: 1fr;
  }

  .cart__summary {
    position: static;
  }
}

@media (max-width: 560px) {
  .cart__line {
    flex-wrap: wrap;
  }

  .cart__controls {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}
</style>