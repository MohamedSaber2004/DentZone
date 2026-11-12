<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { services } from '../di/container'
import { t } from '../i18n'
import AppIcon from '../components/ui/AppIcon.vue'
import OffersHub from '../components/offers/OffersHub.vue'

const { homeService } = services

const products = computed(() => homeService.offerProducts.value)
const suppliers = computed(() => homeService.providers.value)
const headline = computed(() => homeService.headline.value || t('offers.title'))
const loading = computed(() => homeService.loading.value && products.value.length === 0)

onMounted(() => {
  void homeService.ensureLoaded()
})

const retry = () => {
  void homeService.refresh()
}
</script>

<template>
  <div class="container page">
    <div class="page__head">
      <div>
        <h1 class="page__title">{{ headline }}</h1>
        <p class="page__subtitle">{{ t('offers.subtitle') }}</p>
      </div>
      <span v-if="!loading && products.length > 0" class="page__count">
        {{ t('offers.count', { count: products.length }) }}
      </span>
    </div>

    <div v-if="loading" class="offers-page__grid" role="status" :aria-label="t('common.loading')">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <span class="skeleton skeleton-card__media" />
        <span class="skeleton skeleton-card__line skeleton-card__line--wide" />
        <span class="skeleton skeleton-card__line" />
        <span class="skeleton skeleton-card__line skeleton-card__line--short" />
      </div>
    </div>

    <OffersHub
      v-else-if="products.length > 0"
      mode="page"
      :products="products"
      :suppliers="suppliers"
      :headline="headline"
    />

    <div v-else class="page__state">
      <span class="page__state-icon"><AppIcon name="sparkles" :size="30" /></span>
      <h2 class="page__state-title">{{ t('offers.emptyTitle') }}</h2>
      <p class="page__state-desc">{{ t('offers.emptyDesc') }}</p>
      <button type="button" class="page__state-action" @click="retry">
        <AppIcon name="refresh" :size="15" />
        {{ t('offers.retry') }}
      </button>
    </div>

    <div v-if="products.length > 0" class="offers-page__footer">
      <RouterLink to="/products" class="offers-page__browse">
        {{ t('offers.browseCatalog') }}
        <AppIcon name="arrow-right" :size="15" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
}

.page__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.6rem, 3.4vw, 2.15rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.page__subtitle {
  margin-top: 0.45rem;
  font-size: 0.95rem;
  color: var(--dz-muted);
  max-width: 68ch;
}

.page__count {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.offers-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.1rem;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  padding-bottom: 1.1rem;
  overflow: hidden;
}

.skeleton {
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-card__media {
  aspect-ratio: 1 / 1;
  width: 100%;
  border-radius: 0;
}

.skeleton-card__line {
  height: 0.8rem;
  width: 60%;
  margin-inline: 1.1rem;
}

.skeleton-card__line--wide {
  width: 85%;
  height: 1rem;
}

.skeleton-card__line--short {
  width: 40%;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}

.page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3.5rem 1.5rem;
  border: 1px dashed var(--dz-border-strong);
  border-radius: var(--dz-radius-lg);
  text-align: center;
}

.page__state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.4rem;
}

.page__state-title {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.page__state-desc {
  font-size: 0.9rem;
  color: var(--dz-muted);
  max-width: 46ch;
}

.page__state-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.9rem;
  padding: 0.55rem 1.2rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  color: var(--dz-primary-strong);
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.page__state-action:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
}

.offers-page__footer {
  display: flex;
  justify-content: center;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--dz-border);
}

.offers-page__browse {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  text-decoration: none;
}

.offers-page__browse:hover svg {
  transform: translateX(3px);
}

.offers-page__browse svg {
  transition: transform 0.2s;
}

html[dir='rtl'] .offers-page__browse svg {
  transform: scaleX(-1);
}

html[dir='rtl'] .offers-page__browse:hover svg {
  transform: scaleX(-1) translateX(-3px);
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}

@media (max-width: 900px) {
  .offers-page__grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 600px) {
  .offers-page__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 360px) {
  .offers-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
