<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { locale, t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'
import AppButton from '../ui/AppButton.vue'
import type { StoreOption } from '../../views/ProductDetailsView.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    stores: StoreOption[]
    selectedId: string
    productName?: string
  }>(),
  {
    productName: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', inventoryUserId: string): void
}>()

const searchQuery = ref('')
const filterInStockOnly = ref(false)
const filterFlashSaleOnly = ref(false)
const sortBy = ref<'price-asc' | 'price-desc' | 'stock-desc' | 'discount-desc'>('price-asc')
const currentPage = ref(1)
const pageSize = 8
const modalRef = ref<HTMLDivElement | null>(null)

// Find the store with the lowest price among in-stock stores
const bestPriceStoreId = computed(() => {
  const inStock = props.stores.filter((s) => s.stockQuantity > 0 && s.effectiveSalesPrice > 0)
  if (!inStock.length) return ''
  const sorted = [...inStock].sort((a, b) => a.effectiveSalesPrice - b.effectiveSalesPrice)
  return sorted[0]?.inventoryUserId || ''
})

const filteredAndSortedStores = computed(() => {
  let list = [...props.stores]

  // Search filter
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter((s) => s.inventoryUserName.toLowerCase().includes(query))
  }

  // Stock filter
  if (filterInStockOnly.value) {
    list = list.filter((s) => s.stockQuantity > 0)
  }

  // Flash sale filter
  if (filterFlashSaleOnly.value) {
    list = list.filter((s) => s.isFlashSaleActive)
  }

  // Sorting
  list.sort((a, b) => {
    switch (sortBy.value) {
      case 'price-asc':
        return a.effectiveSalesPrice - b.effectiveSalesPrice
      case 'price-desc':
        return b.effectiveSalesPrice - a.effectiveSalesPrice
      case 'stock-desc':
        return b.stockQuantity - a.stockQuantity
      case 'discount-desc':
        return (b.discountRate || 0) - (a.discountRate || 0)
      default:
        return 0
    }
  })

  return list
})

const totalPages = computed(() => Math.ceil(filteredAndSortedStores.value.length / pageSize) || 1)

const paginatedStores = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredAndSortedStores.value.slice(start, start + pageSize)
})

watch(
  () => [searchQuery.value, filterInStockOnly.value, filterFlashSaleOnly.value, sortBy.value],
  () => {
    currentPage.value = 1
  },
)

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      await nextTick()
      modalRef.value?.focus()
    } else {
      document.body.style.overflow = ''
    }
  },
)

const close = () => {
  emit('update:modelValue', false)
}

const selectStore = (id: string) => {
  emit('select', id)
  close()
}

const formatPrice = (val: number): string => {
  return Number.isFinite(val) ? val.toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0'
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    e.preventDefault()
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="provider-modal">
      <div
        v-if="modelValue"
        class="provider-backdrop"
        @click.self="close"
        @keydown="onKeydown"
      >
        <div
          ref="modalRef"
          class="provider-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="t('home.availableFromProviders', { count: stores.length })"
          tabindex="-1"
        >
          <!-- Header -->
          <header class="provider-modal__head">
            <div class="provider-modal__title-box">
              <div class="provider-modal__icon-wrap">
                <AppIcon name="store" :size="20" />
              </div>
              <div>
                <h3 class="provider-modal__title">
                  {{ t('home.availableFromProviders', { count: stores.length }) }}
                </h3>
                <p v-if="productName" class="provider-modal__subtitle">
                  {{ productName }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="provider-modal__close"
              :aria-label="locale === 'ar' ? 'إغلاق' : 'Close'"
              @click="close"
            >
              <AppIcon name="close" :size="20" />
            </button>
          </header>

          <!-- Search & Filter Controls -->
          <div class="provider-modal__controls">
            <!-- Search bar -->
            <div class="provider-modal__search-wrap">
              <AppIcon name="search" :size="16" class="provider-modal__search-icon" />
              <input
                v-model="searchQuery"
                type="search"
                class="provider-modal__search"
                :placeholder="locale === 'ar' ? 'ابحث باسم المورد أو المتجر...' : 'Search by provider name...'"
                :aria-label="locale === 'ar' ? 'البحث عن مورد' : 'Search provider'"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="provider-modal__search-clear"
                @click="searchQuery = ''"
              >
                <AppIcon name="close" :size="14" />
              </button>
            </div>

            <!-- Sort and Filter Pills -->
            <div class="provider-modal__filters-bar">
              <div class="provider-modal__pills">
                <button
                  type="button"
                  class="provider-modal__pill"
                  :class="{ 'provider-modal__pill--active': !filterInStockOnly && !filterFlashSaleOnly }"
                  @click="filterInStockOnly = false; filterFlashSaleOnly = false"
                >
                  {{ locale === 'ar' ? 'الكل' : 'All' }}
                  <span class="provider-modal__pill-count">{{ stores.length }}</span>
                </button>

                <button
                  type="button"
                  class="provider-modal__pill"
                  :class="{ 'provider-modal__pill--active': filterInStockOnly }"
                  @click="filterInStockOnly = !filterInStockOnly"
                >
                  <AppIcon name="check" :size="13" />
                  {{ locale === 'ar' ? 'متوفر في المخزون' : 'In Stock' }}
                </button>

                <button
                  type="button"
                  class="provider-modal__pill"
                  :class="{ 'provider-modal__pill--active': filterFlashSaleOnly }"
                  @click="filterFlashSaleOnly = !filterFlashSaleOnly"
                >
                  <AppIcon name="flame" :size="13" />
                  {{ locale === 'ar' ? 'عروض خاصة' : 'Flash Deals' }}
                </button>
              </div>

              <!-- Sort dropdown -->
              <div class="provider-modal__sort-wrap">
                <label class="provider-modal__sort-label">
                  <AppIcon name="trending-up" :size="14" />
                  <span>{{ locale === 'ar' ? 'ترتيب:' : 'Sort:' }}</span>
                </label>
                <select v-model="sortBy" class="provider-modal__sort-select">
                  <option value="price-asc">{{ locale === 'ar' ? 'الأقل سعراً' : 'Lowest Price' }}</option>
                  <option value="price-desc">{{ locale === 'ar' ? 'الأعلى سعراً' : 'Highest Price' }}</option>
                  <option value="stock-desc">{{ locale === 'ar' ? 'الأكثر توفراً' : 'Highest Stock' }}</option>
                  <option value="discount-desc">{{ locale === 'ar' ? 'أعلى خصم' : 'Biggest Discount' }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Providers Body List -->
          <div class="provider-modal__body">
            <div v-if="filteredAndSortedStores.length === 0" class="provider-modal__empty">
              <span class="provider-modal__empty-icon">
                <AppIcon name="store" :size="32" />
              </span>
              <p class="provider-modal__empty-title">
                {{ locale === 'ar' ? 'لا يوجد موردين مطابقين لبحثك' : 'No matching providers found' }}
              </p>
              <p class="provider-modal__empty-desc">
                {{ locale === 'ar' ? 'جرّب تغيير كلمات البحث أو إلغاء فلاتر التصفية.' : 'Try adjusting your search query or removing filters.' }}
              </p>
            </div>

            <div v-else class="provider-modal__list">
              <article
                v-for="store in paginatedStores"
                :key="store.inventoryUserId"
                class="provider-card"
                :class="{
                  'provider-card--active': store.inventoryUserId === selectedId,
                  'provider-card--best': store.inventoryUserId === bestPriceStoreId,
                  'provider-card--out': store.stockQuantity <= 0,
                }"
                @click="selectStore(store.inventoryUserId)"
              >
                <!-- Card Left: Store info -->
                <div class="provider-card__info">
                  <div class="provider-card__head">
                    <span class="provider-card__avatar">
                      <AppIcon name="store" :size="16" />
                    </span>
                    <div>
                      <h4 class="provider-card__name">{{ store.inventoryUserName }}</h4>
                      <div class="provider-card__badges">
                        <span
                          v-if="store.inventoryUserId === bestPriceStoreId"
                          class="provider-card__tag provider-card__tag--best"
                        >
                          <AppIcon name="sparkles" :size="12" />
                          {{ locale === 'ar' ? 'أفضل سعر' : 'Best Price' }}
                        </span>
                        <span
                          v-if="store.isFlashSaleActive"
                          class="provider-card__tag provider-card__tag--deal"
                        >
                          <AppIcon name="flame" :size="12" />
                          {{ locale === 'ar' ? `خصم ${store.discountRate || 0}%` : `${store.discountRate || 0}% OFF` }}
                        </span>
                        <span
                          class="provider-card__tag"
                          :class="store.stockQuantity > 0 ? 'provider-card__tag--in' : 'provider-card__tag--out'"
                        >
                          {{ store.stockQuantity > 0 ? t('products.inStock', { count: store.stockQuantity }) : t('products.outOfStock') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Card Right: Price & Selection -->
                <div class="provider-card__action-col">
                  <div class="provider-card__price-box">
                    <span
                      v-if="store.isFlashSaleActive && store.priceBeforeFlashSale"
                      class="provider-card__old-price"
                    >
                      {{ formatPrice(store.priceBeforeFlashSale) }}
                    </span>
                    <span class="provider-card__price">
                      {{ formatPrice(store.effectiveSalesPrice) }}
                      <small class="provider-card__currency">{{ t('products.currency') }}</small>
                    </span>
                  </div>

                  <button
                    type="button"
                    class="provider-card__select-btn"
                    :class="{ 'provider-card__select-btn--active': store.inventoryUserId === selectedId }"
                    :aria-label="store.inventoryUserId === selectedId ? (locale === 'ar' ? 'المورد المختار حالياً' : 'Selected Provider') : (locale === 'ar' ? 'اختيار هذا المورد' : 'Select Provider')"
                    @click.stop="selectStore(store.inventoryUserId)"
                  >
                    <AppIcon v-if="store.inventoryUserId === selectedId" name="check" :size="16" />
                    <span>{{ store.inventoryUserId === selectedId ? (locale === 'ar' ? 'المختار' : 'Selected') : (locale === 'ar' ? 'اختيار العرض' : 'Select Offer') }}</span>
                  </button>
                </div>
              </article>
            </div>
          </div>

          <!-- Pagination Footer -->
          <footer v-if="totalPages > 1" class="provider-modal__foot">
            <span class="provider-modal__count">
              {{ locale === 'ar' ? `عرض ${paginatedStores.length} من أصل ${filteredAndSortedStores.length} مورد` : `Showing ${paginatedStores.length} of ${filteredAndSortedStores.length} providers` }}
            </span>

            <div class="provider-modal__pagination">
              <button
                type="button"
                class="provider-modal__page-btn"
                :disabled="currentPage <= 1"
                :aria-label="locale === 'ar' ? 'الصفحة السابقة' : 'Previous page'"
                @click="currentPage--"
              >
                <AppIcon name="chevron-left" :size="16" />
              </button>

              <span class="provider-modal__page-indicator">
                {{ currentPage }} / {{ totalPages }}
              </span>

              <button
                type="button"
                class="provider-modal__page-btn"
                :disabled="currentPage >= totalPages"
                :aria-label="locale === 'ar' ? 'الصفحة التالية' : 'Next page'"
                @click="currentPage++"
              >
                <AppIcon name="chevron-right" :size="16" />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.provider-backdrop {
  position: fixed;
  inset: 0;
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(2, 6, 23, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.provider-modal {
  display: flex;
  flex-direction: column;
  width: min(720px, 100%);
  max-height: min(88vh, 760px);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-lg);
  overflow: hidden;
  outline: none;
}

/* Head */
.provider-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--dz-border);
  background: var(--dz-surface-soft);
}

.provider-modal__title-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.provider-modal__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-soft);
  color: var(--dz-primary);
  flex-shrink: 0;
}

.provider-modal__title {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--dz-ink);
  line-height: 1.2;
}

.provider-modal__subtitle {
  font-size: 0.82rem;
  color: var(--dz-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
  margin-top: 0.2rem;
}

.provider-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-muted);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.provider-modal__close:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
  transform: scale(1.05);
}

.provider-modal__close:focus-visible {
  outline: 3px solid var(--dz-primary);
  outline-offset: 2px;
}

/* Controls */
.provider-modal__controls {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--dz-border);
  background: var(--dz-surface);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.provider-modal__search-wrap {
  position: relative;
  width: 100%;
}

.provider-modal__search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-start: 1rem;
  color: var(--dz-muted);
  pointer-events: none;
}

.provider-modal__search {
  width: 100%;
  height: 2.75rem;
  padding-inline: 2.75rem 2.25rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink);
  font-size: 0.9rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.provider-modal__search:focus {
  outline: none;
  border-color: var(--dz-primary);
  box-shadow: 0 0 0 3px var(--dz-primary-soft);
}

.provider-modal__search-clear {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-end: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--dz-radius-full);
  border: none;
  background: var(--dz-border);
  color: var(--dz-ink-soft);
  cursor: pointer;
}

.provider-modal__filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.provider-modal__pills {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.provider-modal__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.provider-modal__pill:hover {
  border-color: var(--dz-primary);
  color: var(--dz-primary);
}

.provider-modal__pill--active {
  background: var(--dz-primary-soft);
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
}

.provider-modal__pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem 0.4rem;
  border-radius: var(--dz-radius-full);
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.75rem;
}

.provider-modal__sort-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-inline-start: auto;
}

.provider-modal__sort-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--dz-muted);
  font-weight: 600;
}

.provider-modal__sort-select {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  color: var(--dz-ink);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.provider-modal__sort-select:focus {
  outline: none;
  border-color: var(--dz-primary);
}

/* Body */
.provider-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  min-height: 280px;
}

.provider-modal__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Provider Card */
.provider-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--dz-radius);
  border: 1.5px solid var(--dz-border);
  background: var(--dz-surface);
  cursor: pointer;
  transition:
    transform 0.15s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.provider-card:hover {
  transform: translateY(-2px);
  border-color: var(--dz-primary);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.provider-card--active {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
  box-shadow: 0 0 0 2px var(--dz-primary-soft);
}

.provider-card--best {
  border-color: var(--dz-gold);
}

.provider-card--out {
  opacity: 0.65;
}

.provider-card__info {
  min-width: 0;
  flex: 1;
}

.provider-card__head {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.provider-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-primary);
  flex-shrink: 0;
  border: 1px solid var(--dz-border);
}

.provider-card__name {
  font-family: var(--dz-font-display);
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--dz-ink);
  margin-bottom: 0.35rem;
}

.provider-card__badges {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.provider-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--dz-radius-full);
  font-size: 0.74rem;
  font-weight: 700;
}

.provider-card__tag--best {
  background: var(--dz-gold-soft);
  color: var(--dz-gold-strong);
}

.provider-card__tag--deal {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.provider-card__tag--in {
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.provider-card__tag--out {
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
}

.provider-card__action-col {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-shrink: 0;
}

.provider-card__price-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.provider-card__old-price {
  font-size: 0.8rem;
  text-decoration: line-through;
  color: var(--dz-muted);
}

.provider-card__price {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--dz-primary-strong);
  white-space: nowrap;
}

.provider-card__currency {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-muted);
  margin-inline-start: 0.2rem;
}

.provider-card__select-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: var(--dz-radius);
  border: 1px solid var(--dz-primary);
  background: var(--dz-surface);
  color: var(--dz-primary);
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.provider-card__select-btn:hover {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  transform: translateY(-1px);
}

.provider-card__select-btn--active {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
}

/* Empty State */
.provider-modal__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.provider-modal__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.75rem;
}

.provider-modal__empty-title {
  font-family: var(--dz-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--dz-ink);
}

.provider-modal__empty-desc {
  font-size: 0.84rem;
  color: var(--dz-muted);
  margin-top: 0.25rem;
}

/* Footer Pagination */
.provider-modal__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.5rem;
  border-top: 1px solid var(--dz-border);
  background: var(--dz-surface-soft);
}

.provider-modal__count {
  font-size: 0.82rem;
  color: var(--dz-muted);
  font-weight: 600;
}

.provider-modal__pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.provider-modal__page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--dz-radius);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-ink);
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.provider-modal__page-btn:hover:not(:disabled) {
  border-color: var(--dz-primary);
  color: var(--dz-primary);
}

.provider-modal__page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.provider-modal__page-indicator {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--dz-ink);
  padding: 0 0.4rem;
}

/* Transitions */
.provider-modal-enter-active,
.provider-modal-leave-active {
  transition: opacity 0.25s ease;
}

.provider-modal-enter-active .provider-modal,
.provider-modal-leave-active .provider-modal {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.provider-modal-enter-from,
.provider-modal-leave-to {
  opacity: 0;
}

.provider-modal-enter-from .provider-modal,
.provider-modal-leave-to .provider-modal {
  transform: scale(0.95) translateY(12px);
  opacity: 0;
}

/* Responsive (Mobile Bottom Sheet Style) */
@media (max-width: 640px) {
  .provider-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .provider-modal {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    max-height: 90vh;
  }

  .provider-modal__head {
    padding: 1rem;
  }

  .provider-modal__controls {
    padding: 0.75rem 1rem;
  }

  .provider-modal__body {
    padding: 0.75rem 1rem;
  }

  .provider-card {
    flex-direction: column;
    align-items: stretch;
    padding: 0.85rem;
    gap: 0.75rem;
  }

  .provider-card__action-col {
    justify-content: space-between;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--dz-border);
  }

  .provider-card__price-box {
    align-items: flex-start;
  }

  .provider-modal__foot {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
}
</style>
