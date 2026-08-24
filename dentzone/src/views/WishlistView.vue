<script setup lang="ts">
import { services } from '../di/container'
import { onMounted, ref } from 'vue'
import { t } from '../i18n'
import { ApiError } from '../infrastructure/http/api-error'
import { useRouter } from 'vue-router'
import AppIcon from '../components/ui/AppIcon.vue'
import AppButton from '../components/ui/AppButton.vue'
import ProductCard from '../components/products/ProductCard.vue'
import type { ProviderProductDto } from '../domain/models/product'

const router = useRouter()
const { productRepository, cartService, wishlistService } = services

const products = ref<ProviderProductDto[]>([])
const loading = ref(true)
const error = ref(false)

const load = async () => {
  loading.value = true
  error.value = false
  try {
    products.value = await productRepository.getMyFavorites()
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      void router.push({ name: 'login', query: { redirect: '/wishlist' } })
      return
    }
    error.value = true
  } finally {
    loading.value = false
  }
}

import { productRoute } from '../utils/route-crypto'

const detailsTo = (product: ProviderProductDto) =>
  productRoute(product.productId, product.inventoryUserId, {
    supplier: product.inventoryUserName || undefined,
  })

const remove = async (product: ProviderProductDto) => {
  const removed = await wishlistService.toggle({
    productId: product.productId,
    productPriceId: product.productPriceId,
    name: product.productName,
  })
  if (!removed) return
  products.value = products.value.filter((p) => p.productPriceId !== product.productPriceId)
}

const addToCart = (product: ProviderProductDto) => {
  void cartService.add({
    productId: product.productId,
    inventoryId: product.inventoryUserId,
    quantity: 1,
    name: product.productName,
    stockQuantity: product.stockQuantity,
    maxQuantity: product.maxQuantity,
  })
}

onMounted(load)
</script>

<template>
  <div class="container page">
    <div class="page__head">
      <div>
        <h1 class="page__title">{{ t('wishlist.title') }}</h1>
        <p v-if="products.length" class="page__count">
          {{ t('wishlist.count', { count: products.length }) }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="wishlist__grid" role="status" :aria-label="t('common.loading')">
      <div v-for="i in 8" :key="i" class="wishlist__skeleton">
        <span class="wishlist__skeleton-media" />
        <span class="wishlist__skeleton-line wishlist__skeleton-line--wide" />
        <span class="wishlist__skeleton-line" />
      </div>
    </div>

    <div v-else-if="error" class="page__state" role="alert">
      <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
      <h2 class="page__state-title">{{ t('wishlist.title') }}</h2>
      <p class="page__state-desc">{{ t('wishlist.errorToast') }}</p>
      <AppButton variant="primary" @click="load">
        <AppIcon name="refresh" :size="15" />
        {{ t('categories.retry') }}
      </AppButton>
    </div>

    <div v-else-if="products.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="heart" :size="30" /></span>
      <h2 class="page__state-title">{{ t('wishlist.emptyTitle') }}</h2>
      <p class="page__state-desc">{{ t('wishlist.emptyDescription') }}</p>
      <RouterLink to="/categories">
        <AppButton variant="primary">
          {{ t('wishlist.browseProducts') }}
          <AppIcon name="arrow-right" :size="15" />
        </AppButton>
      </RouterLink>
    </div>

    <div v-else class="wishlist__grid">
      <ProductCard
        v-for="product in products"
        :key="product.productPriceId"
        :product="product"
        :favorite="true"
        :favorite-busy="wishlistService.busyIds.value.has(product.productId)"
        :details-to="detailsTo(product)"
        @toggle-favorite="remove"
        @add-to-cart="addToCart"
      />
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

.wishlist__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.25rem;
}

.wishlist__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-radius: var(--dz-radius-lg);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  padding: 0.9rem;
}

.wishlist__skeleton-media {
  aspect-ratio: 1 / 1;
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  animation: wishlist-pulse 1.4s ease-in-out infinite;
}

.wishlist__skeleton-line {
  height: 0.85rem;
  width: 60%;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-surface-soft);
  animation: wishlist-pulse 1.4s ease-in-out infinite;
}

.wishlist__skeleton-line--wide {
  width: 90%;
}

@keyframes wishlist-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}

@media (max-width: 768px) {
  .wishlist__grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 600px) {
  .page {
    padding-block: 1.5rem 3.5rem;
  }

  .page__head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.65rem;
    margin-bottom: 1.25rem;
  }

  .wishlist__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 360px) {
  .wishlist__grid {
    grid-template-columns: 1fr;
  }
}
</style>