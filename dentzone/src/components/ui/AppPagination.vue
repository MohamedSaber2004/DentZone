<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../../i18n'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    totalItems: number
    pageSize?: number
  }>(),
  {
    pageSize: 15,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', page: number): void
  (e: 'change', page: number): void
}>()

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalItems / props.pageSize))
})

const currentPage = computed(() => {
  return Math.min(Math.max(1, props.modelValue), totalPages.value)
})

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (currentPage.value - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  return Math.min(currentPage.value * props.pageSize, props.totalItems)
})

const visiblePages = computed<(number | string)[]>(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  } else if (current >= total - 3) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push('...')
    pages.push(current - 1)
    pages.push(current)
    pages.push(current + 1)
    pages.push('...')
    pages.push(total)
  }

  return pages
})

const setPage = (page: number | string) => {
  if (typeof page !== 'number') return
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  emit('update:modelValue', page)
  emit('change', page)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="app-pagination" role="navigation" :aria-label="t('catalog.catalog')">
    <div class="app-pagination__controls">
      <!-- Previous Button -->
      <button
        type="button"
        class="app-pagination__btn app-pagination__btn--nav"
        :disabled="currentPage === 1"
        :aria-label="t('home.previousPage')"
        @click="setPage(currentPage - 1)"
      >
        <AppIcon name="chevron-right" :size="15" />
        <span>{{ t('home.previousPage') }}</span>
      </button>

      <!-- Numbered Pages -->
      <div class="app-pagination__pages">
        <template v-for="(page, idx) in visiblePages" :key="idx">
          <span v-if="page === '...'" class="app-pagination__dots" aria-hidden="true">...</span>
          <button
            v-else
            type="button"
            class="app-pagination__page-btn"
            :class="{ 'app-pagination__page-btn--active': page === currentPage }"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="setPage(page)"
          >
            {{ page }}
          </button>
        </template>
      </div>

      <!-- Next Button -->
      <button
        type="button"
        class="app-pagination__btn app-pagination__btn--nav"
        :disabled="currentPage === totalPages"
        :aria-label="t('home.nextPage')"
        @click="setPage(currentPage + 1)"
      >
        <span>{{ t('home.nextPage') }}</span>
        <AppIcon name="chevron-left" :size="15" />
      </button>
    </div>

    <!-- Items Range and Page Info -->
    <div class="app-pagination__summary">
      <span class="app-pagination__info">
        {{ t('home.pageOf', { current: currentPage, total: totalPages }) }}
      </span>
      <span v-if="totalItems > 0" class="app-pagination__range">
        ({{ startItem }}–{{ endItem }} / {{ totalItems }})
      </span>
    </div>
  </nav>
</template>

<style scoped>
.app-pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--dz-border);
}

.app-pagination__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.app-pagination__pages {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.app-pagination__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.15rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-ink);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    opacity 0.2s;
}

.app-pagination__btn:hover:not(:disabled) {
  border-color: var(--dz-primary);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.app-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-pagination__page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.35rem;
  height: 2.35rem;
  padding: 0 0.4rem;
  border-radius: var(--dz-radius-md);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-ink);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.app-pagination__page-btn:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.app-pagination__page-btn--active {
  border-color: var(--dz-primary);
  background: var(--dz-primary);
  color: var(--dz-on-primary) !important;
  font-weight: 700;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--dz-primary) 35%, transparent);
}

.app-pagination__dots {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 2.35rem;
  color: var(--dz-muted);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.app-pagination__summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.app-pagination__range {
  opacity: 0.85;
}

html[dir='rtl'] .app-pagination__btn svg {
  transform: scaleX(-1);
}

@media (max-width: 560px) {
  .app-pagination__btn span {
    display: none;
  }

  .app-pagination__btn {
    padding: 0.55rem;
    min-width: 2.35rem;
    justify-content: center;
  }
}
</style>
