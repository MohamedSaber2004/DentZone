<script setup lang="ts">
import { services } from '../di/container'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n'
import InventoryCard from '../components/categories/InventoryCard.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import type { InventoryDto } from '../domain/models/category'

const route = useRoute()
const router = useRouter()
const { categoryRepository } = services

const catId = () => (typeof route.params.catId === 'string' ? route.params.catId : '')
const categoryName = () => (typeof route.query.name === 'string' ? route.query.name : '')

const inventories = ref<InventoryDto[]>([])
const loading = ref(true)
const error = ref(false)

const load = async () => {
  loading.value = true
  error.value = false
  try {
    inventories.value = await categoryRepository.getInventoriesByCategory(catId())
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.catId, load)
</script>

<template>
  <div class="container page">
    <button type="button" class="page__back" @click="router.push({ name: 'categories' })">
      <AppIcon name="arrow-left" :size="15" />
      {{ t('categories.backToCategories') }}
    </button>

    <div class="page__head">
      <div>
        <h1 class="page__title">{{ categoryName() || t('categories.inventoriesTitle') }}</h1>
        <p class="page__subtitle">{{ t('categories.inventoriesSubtitle') }}</p>
      </div>
      <span v-if="!loading && !error && inventories.length" class="page__count">
        {{ t('categories.inventoriesCount', { count: inventories.length }) }}
      </span>
    </div>

    <div v-if="loading" class="page__list" aria-label="Loading">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <span class="skeleton skeleton-card__avatar" />
        <div class="skeleton-card__lines">
          <span class="skeleton skeleton-card__line skeleton-card__line--wide" />
          <span class="skeleton skeleton-card__line" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="page__state" role="alert">
      <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
      <h2 class="page__state-title">{{ t('categories.errorTitle') }}</h2>
      <p class="page__state-desc">{{ t('categories.errorDescription') }}</p>
      <AppButton variant="primary" @click="load">
        <AppIcon name="refresh" :size="15" />
        {{ t('categories.retry') }}
      </AppButton>
    </div>

    <div v-else-if="inventories.length === 0" class="page__state">
      <span class="page__state-icon"><AppIcon name="store" :size="30" /></span>
      <h2 class="page__state-title">{{ t('categories.noInventoriesTitle') }}</h2>
      <p class="page__state-desc">{{ t('categories.noInventoriesDescription') }}</p>
    </div>

    <div v-else class="page__list">
      <InventoryCard
        v-for="inventory in inventories"
        :key="inventory.inventoryId"
        :inventory="inventory"
        :category-id="catId()"
        :category-name="categoryName()"
      />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding-block: 2rem 4rem;
}

.page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.page__back:hover {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.page__back svg {
  color: currentcolor;
}

html[dir='rtl'] .page__back svg {
  transform: scaleX(-1);
}

.page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.page__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.6rem, 3.5vw, 2.1rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.page__subtitle {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.page__count {
  flex-shrink: 0;
  padding: 0.35rem 0.9rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.8rem;
  font-weight: 700;
}

.page__list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
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
  max-width: 34ch;
}

.page__state .app-button {
  margin-top: 0.8rem;
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  padding: 1.1rem 1.2rem;
}

.skeleton {
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-card__avatar {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
}

.skeleton-card__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-card__line {
  height: 0.8rem;
  width: 40%;
}

.skeleton-card__line--wide {
  width: 70%;
  height: 1rem;
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

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>