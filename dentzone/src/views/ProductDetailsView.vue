<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { locale, t } from '../i18n'
import { API_LANG } from '../config/api.config'
import { ApiError } from '../infrastructure/http/api-error'
import { resolveMediaUrl } from '../utils/media'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import ImageLightboxModal from '../components/ui/ImageLightboxModal.vue'
import ProviderSelectorModal from '../components/products/ProviderSelectorModal.vue'
import ProductCard from '../components/products/ProductCard.vue'
import type { ProductDetailDto, ProductPriceDto, ProviderProductDto } from '../domain/models/product'

import { decryptId, inventoryRoute, productRoute } from '../utils/route-crypto'

const route = useRoute()
const router = useRouter()
const { productRepository, policyRepository, cartService, wishlistService, homeRepository } = services

const rawProductId = () => (typeof route.params.productId === 'string' ? route.params.productId : '')
const rawInventoryUserId = () =>
  typeof route.params.inventoryUserId === 'string' ? route.params.inventoryUserId : ''

const productId = () => decryptId(rawProductId())
const inventoryUserId = () => decryptId(rawInventoryUserId())

const lang = computed(() => (locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH))

const detail = ref<ProductDetailDto | null>(null)
const loading = ref(true)
const error = ref(false)
const activeImage = ref(0)
const imageFailed = ref(false)
const showLightbox = ref(false)
const showProviderModal = ref(false)
const selectedInventoryUserId = ref<string>('')
const relatedProducts = ref<ProviderProductDto[]>([])
const relatedLoading = ref(false)
const providerNameMap = ref<Map<string, string>>(new Map())

const openLightbox = (index?: number) => {
  if (typeof index === 'number') {
    activeImage.value = index
  }
  showLightbox.value = true
}

export interface StoreOption {
  inventoryUserId: string
  inventoryUserName: string
  salesPrice: number
  effectiveSalesPrice: number
  stockQuantity: number
  isFlashSaleActive: boolean
  priceBeforeFlashSale: number | null
  discountRate: number
  priceId: string
}

const resolveStoreName = (id: string, directName?: string | null, index = 0): string => {
  const direct = (directName || '').trim()
  const genericAr = 'متوفر لدى مورد معتمد'
  const genericEn = 'Available from verified supplier'
  if (direct && direct !== genericAr && direct !== genericEn) {
    return direct
  }
  if (id && providerNameMap.value.has(id)) {
    return providerNameMap.value.get(id)!
  }
  if (typeof route.query.supplier === 'string' && route.query.supplier.trim()) {
    return route.query.supplier.trim()
  }
  return locale.value === 'ar' ? `مورد معتمد #${index + 1}` : `Verified Supplier #${index + 1}`
}

const availableStores = computed<StoreOption[]>(() => {
  const d = detail.value
  if (!d) return []
  const list: StoreOption[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < (d.prices || []).length; i++) {
    const p = d.prices[i]!
    if (!p.inventoryUserId || seenIds.has(p.inventoryUserId)) continue
    seenIds.add(p.inventoryUserId)
    list.push({
      inventoryUserId: p.inventoryUserId,
      inventoryUserName: resolveStoreName(p.inventoryUserId, p.inventoryUserName, list.length),
      salesPrice: p.salesPrice,
      effectiveSalesPrice: p.effectiveSalesPrice > 0 ? p.effectiveSalesPrice : p.salesPrice,
      stockQuantity: p.stockQuantity,
      isFlashSaleActive: !!p.isFlashSaleActive,
      priceBeforeFlashSale: p.priceBeforeFlashSale,
      discountRate: p.discountRate,
      priceId: p.id,
    })
  }

  for (let i = 0; i < (d.inventories || []).length; i++) {
    const inv = d.inventories[i]!
    if (!inv.inventoryUserId || seenIds.has(inv.inventoryUserId)) continue
    seenIds.add(inv.inventoryUserId)
    list.push({
      inventoryUserId: inv.inventoryUserId,
      inventoryUserName: resolveStoreName(inv.inventoryUserId, inv.inventoryName, list.length),
      salesPrice: inv.salesPrice,
      effectiveSalesPrice: inv.effectiveSalesPrice > 0 ? inv.effectiveSalesPrice : inv.salesPrice,
      stockQuantity: inv.stockQuantity,
      isFlashSaleActive: !!inv.isFlashSaleActive,
      priceBeforeFlashSale: inv.priceBeforeFlashSale,
      discountRate: inv.discountRate,
      priceId: '',
    })
  }

  return list
})

const bestPriceStoreId = computed(() => {
  const inStock = availableStores.value.filter((s) => s.stockQuantity > 0 && s.effectiveSalesPrice > 0)
  if (!inStock.length) return ''
  const sorted = [...inStock].sort((a, b) => a.effectiveSalesPrice - b.effectiveSalesPrice)
  return sorted[0]?.inventoryUserId || ''
})

const displayedStores = computed(() => {
  const all = availableStores.value
  if (all.length <= 3) return all
  const top = all.slice(0, 3)
  if (selectedInventoryUserId.value && !top.some((s) => s.inventoryUserId === selectedInventoryUserId.value)) {
    const selected = all.find((s) => s.inventoryUserId === selectedInventoryUserId.value)
    if (selected) return [selected, top[0], top[1]].filter(Boolean) as StoreOption[]
  }
  return top
})

const currentStoreName = computed(() => {
  const genericAr = 'متوفر لدى مورد معتمد'
  const genericEn = 'Available from verified supplier'
  const isMeaningful = (str?: string | null): str is string => {
    const s = (str || '').trim()
    return s.length > 0 && s !== genericAr && s !== genericEn
  }

  const store = availableStores.value.find((s) => s.inventoryUserId === selectedInventoryUserId.value)
  if (store && isMeaningful(store.inventoryUserName)) return store.inventoryUserName

  const priceMatch = detail.value?.prices?.find((p) => p.inventoryUserId === selectedInventoryUserId.value)
  if (priceMatch && isMeaningful(priceMatch.inventoryUserName)) return priceMatch.inventoryUserName

  const invMatch = detail.value?.inventories?.find((i) => i.inventoryUserId === selectedInventoryUserId.value)
  if (invMatch && isMeaningful(invMatch.inventoryName)) return invMatch.inventoryName

  if (selectedInventoryUserId.value && providerNameMap.value.has(selectedInventoryUserId.value)) {
    return providerNameMap.value.get(selectedInventoryUserId.value)!
  }

  if (typeof route.query.supplier === 'string' && isMeaningful(route.query.supplier)) {
    return route.query.supplier.trim()
  }

  const first = availableStores.value[0]
  if (first && isMeaningful(first.inventoryUserName)) return first.inventoryUserName

  const p0 = detail.value?.prices?.[0]?.inventoryUserName
  if (isMeaningful(p0)) return p0

  const i0 = detail.value?.inventories?.[0]?.inventoryName
  if (isMeaningful(i0)) return i0

  return t('home.singleProvider')
})

const backToProducts = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  const cat = typeof route.query.cat === 'string' ? route.query.cat : undefined
  const name = typeof route.query.name === 'string' ? route.query.name : undefined
  const supplier = typeof route.query.supplier === 'string' ? route.query.supplier : undefined
  void router.push({
    name: 'inventory-products',
    params: { inventoryUserId: inventoryUserId() },
    query: { cat, name, supplier },
  })
}

const loadRelated = async (categoryId?: string) => {
  if (!categoryId) return
  relatedLoading.value = true
  try {
    const list = await productRepository.searchProducts({ catId: categoryId })
    relatedProducts.value = list.filter((p) => p.productId !== productId()).slice(0, 5)
    if (relatedProducts.value.length === 0) {
      const popular = await productRepository.getPopularProducts()
      relatedProducts.value = popular.filter((p) => p.productId !== productId()).slice(0, 5)
    }
  } catch {
    relatedProducts.value = []
  } finally {
    relatedLoading.value = false
  }
}

const loadProviderNames = async () => {
  if (providerNameMap.value.size > 0) return
  try {
    const providers = await homeRepository.getTopProviders(lang.value)
    for (const p of providers) {
      if (p.id) {
        const name = (p.fullName || p.userName || '').trim()
        if (name) providerNameMap.value.set(p.id, name)
      }
    }
  } catch {
    // silent fallback
  }
}

const load = async () => {
  loading.value = true
  error.value = false
  detail.value = null
  activeImage.value = 0
  imageFailed.value = false
  quantity.value = 1
  void loadProviderNames()
  try {
    const data = await productRepository.getProductById(productId(), lang.value)
    detail.value = data

    const paramId = inventoryUserId()
    if (paramId && paramId !== 'default' && (data.prices || []).some((p) => p.inventoryUserId === paramId)) {
      selectedInventoryUserId.value = paramId
    } else {
      const inStock = (data.prices || []).find((p) => p.stockQuantity > 0)
      selectedInventoryUserId.value =
        inStock?.inventoryUserId || data.prices[0]?.inventoryUserId || data.inventoryUserId || ''
    }

    if (data.categoryId) {
      void loadRelated(data.categoryId)
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      void router.push({ name: 'login', query: { redirect: route.fullPath } })
      return
    }
    error.value = true
  } finally {
    loading.value = false
  }
  void wishlistService.refresh()
}

const displayName = computed(() => {
  const d = detail.value
  if (!d) return ''
  return locale.value === 'ar' ? d.productArabicName || d.productName : d.productName || d.preef
})

const displayDescription = computed(() => {
  const d = detail.value
  if (!d) return ''
  return locale.value === 'ar' ? d.arabicDescription || d.description : d.description
})

const displayCategory = computed(() => {
  const c = detail.value?.category
  if (!c) return ''
  return locale.value === 'ar' ? c.arabicName || c.name : c.name || c.pref
})

const currentPrice = computed<ProductPriceDto | null>(() => {
  const d = detail.value
  if (!d || !d.prices || d.prices.length === 0) return null
  const chosenId = selectedInventoryUserId.value || inventoryUserId()
  if (chosenId && chosenId !== 'default') {
    const match = d.prices.find((p) => p.inventoryUserId === chosenId)
    if (match) return match
  }
  return (
    d.prices.find((p) => p.stockQuantity > 0) ??
    d.prices.find((p) => p.effectiveSalesPrice > 0) ??
    d.prices[0] ??
    null
  )
})

const formatPrice = (value: number | null | undefined) =>
  value == null ? '' : value.toLocaleString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 })

const onImageError = () => {
  imageFailed.value = true
}

const onThumbnailError = (index: number) => {
  if (index === activeImage.value) imageFailed.value = true
}

const activeTab = ref<'description' | 'refund'>('description')
const refundHtml = ref('')
const refundLoading = ref(false)
const refundFailed = ref(false)
const refundLoadedLocale = ref('')
const refundFrameRef = ref<HTMLIFrameElement | null>(null)
const favorite = computed(() => {
  const price = currentPrice.value
  return price ? wishlistService.isFavorite(price.productId, price.id) : false
})
const favoriteBusy = computed(() => {
  const price = currentPrice.value
  return price ? wishlistService.busyIds.value.has(price.productId) : false
})
const quantity = ref(1)

const cartLimit = computed(() => {
  const price = currentPrice.value
  if (!price) return 1
  const stock = price.stockQuantity > 0 ? price.stockQuantity : Number.POSITIVE_INFINITY
  const max = price.maxQuantity > 0 ? price.maxQuantity : Number.POSITIVE_INFINITY
  const limit = Math.min(stock, max)
  return Number.isFinite(limit) ? limit : 1
})

const decrementQty = () => {
  if (quantity.value > 1) quantity.value -= 1
}

const incrementQty = () => {
  if (quantity.value < cartLimit.value) quantity.value += 1
}

const addToCart = () => {
  const d = detail.value
  const price = currentPrice.value
  const invId = selectedInventoryUserId.value || price?.inventoryUserId || d?.inventoryUserId
  if (!d || !price || !invId || invId === 'default' || price.stockQuantity <= 0) return
  void cartService.add({
    productId: price.productId || d.productId,
    inventoryId: invId,
    quantity: quantity.value,
    name: displayName.value || d.productName,
    stockQuantity: price.stockQuantity,
    maxQuantity: price.maxQuantity,
  })
}

const toggleFavorite = () => {
  const price = currentPrice.value
  if (!price) return
  void wishlistService.toggle({
    productId: price.productId,
    productPriceId: price.id,
    inventoryUserId: detail.value?.inventoryUserId || price.inventoryUserId,
    name: displayName.value || detail.value?.productName || '',
  })
}

const addRelatedToCart = (product: ProviderProductDto) => {
  if (!product.inventoryUserId || product.inventoryUserId === 'default') {
    void router.push({
      name: 'product-details',
      params: { inventoryUserId: product.inventoryUserId || 'default', productId: product.productId },
      query: { supplier: product.inventoryUserName || undefined },
    })
    return
  }
  void cartService.add({
    productId: product.productId,
    inventoryId: product.inventoryUserId,
    quantity: 1,
    name: product.productName,
    stockQuantity: product.stockQuantity,
    maxQuantity: product.maxQuantity,
  })
}

const toggleRelatedFavorite = (product: ProviderProductDto) => {
  void wishlistService.toggle({
    productId: product.productId,
    productPriceId: product.productPriceId,
    inventoryUserId: product.inventoryUserId,
    name: product.productName,
  })
}

const fetchRefundPolicy = (lang: number): Promise<string> => policyRepository.getRefundPolicy(lang)

const openRefundTab = async () => {
  activeTab.value = 'refund'
  if (refundLoadedLocale.value === locale.value && !refundFailed.value) return
  refundLoading.value = true
  refundFailed.value = false
  try {
    try {
      refundHtml.value = await fetchRefundPolicy(locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH)
    } catch {
      refundHtml.value = await fetchRefundPolicy(API_LANG.ARABIC)
    }
    refundLoadedLocale.value = locale.value
  } catch {
    refundFailed.value = true
  } finally {
    refundLoading.value = false
  }
}

const resizeRefundFrame = () => {
  const frame = refundFrameRef.value
  const doc = frame?.contentDocument
  if (frame && doc) {
    const height = Math.max(doc.body?.scrollHeight ?? 0, doc.documentElement?.scrollHeight ?? 0)
    frame.style.height = `${Math.max(height, 320)}px`
  }
}

watch(locale, () => {
  refundLoadedLocale.value = ''
  if (activeTab.value === 'refund') void openRefundTab()
})

onMounted(load)
watch(() => route.params.productId, () => {
  void load()
})
</script>

<template>
  <div class="container page">
    <button type="button" class="page__back" @click="backToProducts">
      <AppIcon name="arrow-left" :size="15" />
      {{ t('products.details.back') }}
    </button>

    <div v-if="loading" class="page__loading" role="status" :aria-label="t('common.loading')">
      <div class="skeleton skeleton-detail skeleton-detail--media" />
      <div class="skeleton-detail__lines">
        <span class="skeleton skeleton-detail__line skeleton-detail__line--wide" />
        <span class="skeleton skeleton-detail__line" />
        <span class="skeleton skeleton-detail__line skeleton-detail__line--short" />
        <span class="skeleton skeleton-detail__line skeleton-detail__line--wide" />
      </div>
    </div>

    <div v-else-if="error" class="page__state" role="alert">
      <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
      <h2 class="page__state-title">{{ t('products.details.notFound') }}</h2>
      <p class="page__state-desc">{{ t('products.details.notFoundDescription') }}</p>
      <AppButton variant="primary" @click="load">
        <AppIcon name="refresh" :size="15" />
        {{ t('categories.retry') }}
      </AppButton>
    </div>

    <template v-else-if="detail">
      <div class="detail">
        <div class="detail__media">
          <div
            class="detail__main-wrap"
            :class="{ 'detail__main-wrap--clickable': detail.images.length && !imageFailed }"
            @click="openLightbox()"
          >
            <img
              v-if="detail.images.length && !imageFailed"
              :src="resolveMediaUrl(detail.images[activeImage])"
              :alt="displayName"
              class="detail__main"
              @error="onImageError"
            />
            <span v-else class="detail__placeholder">
              <AppIcon name="package" :size="44" />
            </span>
            <button
              v-if="detail.images.length && !imageFailed"
              type="button"
              class="detail__zoom-btn"
              :aria-label="t('products.viewImage', { n: activeImage + 1 })"
              :title="t('products.viewImage', { n: activeImage + 1 })"
              @click.stop="openLightbox()"
            >
              <AppIcon name="zoom-in" :size="16" />
            </button>
          </div>
          <div v-if="detail.images.length > 1" class="detail__thumbs">
            <button
              v-for="(image, index) in detail.images"
              :key="image"
              type="button"
              class="detail__thumb"
              :class="{ 'detail__thumb--active': index === activeImage && !imageFailed }"
              :aria-label="t('products.viewImage', { n: index + 1 })"
              :aria-current="activeImage === index && !imageFailed ? 'true' : undefined"
              @click="activeImage = index; imageFailed = false"
            >
              <img :src="resolveMediaUrl(image)" :alt="''" @error="onThumbnailError(index)" />
            </button>
          </div>
        </div>

        <div class="detail__info">
          <h1 class="detail__name">{{ displayName }}</h1>

          <div class="detail__subhead">
            <p class="detail__code">
              {{ t('products.code') }}: {{ detail.productCode }}
            </p>
            <div v-if="currentStoreName" class="detail__provider-tag">
              <AppIcon name="store" :size="13" />
              <span class="detail__provider-tag-label">{{ locale === 'ar' ? 'المورد:' : 'Supplier:' }}</span>
              <strong class="detail__provider-tag-name">{{ currentStoreName }}</strong>
            </div>
          </div>

          <!-- Available Stores / Providers Selector -->
          <div v-if="availableStores.length > 1" class="detail__stores">
            <div class="detail__stores-head">
              <div class="detail__stores-head-title">
                <AppIcon name="store" :size="15" />
                <span class="detail__stores-title">{{ t('home.availableFromProviders', { count: availableStores.length }) }}</span>
              </div>
              <button
                v-if="availableStores.length > 3"
                type="button"
                class="detail__stores-all-btn"
                :aria-label="locale === 'ar' ? `مقارنة كل العروض (${availableStores.length})` : `Compare all (${availableStores.length}) offers`"
                @click="showProviderModal = true"
              >
                <AppIcon name="sparkles" :size="13" />
                <span>{{ locale === 'ar' ? `مقارنة الكل (${availableStores.length})` : `Compare All (${availableStores.length})` }}</span>
              </button>
            </div>

            <div class="detail__stores-grid">
              <button
                v-for="store in displayedStores"
                :key="store.inventoryUserId"
                type="button"
                class="detail__store-card"
                :class="{
                  'detail__store-card--active': store.inventoryUserId === selectedInventoryUserId,
                  'detail__store-card--best': store.inventoryUserId === bestPriceStoreId,
                }"
                @click="selectedInventoryUserId = store.inventoryUserId"
              >
                <div class="detail__store-top">
                  <span class="detail__store-radio" />
                  <strong class="detail__store-name">{{ store.inventoryUserName }}</strong>
                  <span
                    v-if="store.inventoryUserId === bestPriceStoreId"
                    class="detail__store-tag-best"
                  >
                    {{ locale === 'ar' ? 'أفضل سعر' : 'Best Price' }}
                  </span>
                </div>
                <div class="detail__store-bottom">
                  <div class="detail__store-pricing">
                    <span v-if="store.isFlashSaleActive && store.priceBeforeFlashSale" class="detail__store-old">
                      {{ formatPrice(store.priceBeforeFlashSale) }}
                    </span>
                    <span class="detail__store-price">{{ formatPrice(store.effectiveSalesPrice) }} {{ t('products.currency') }}</span>
                  </div>
                  <span
                    class="detail__store-badge"
                    :class="store.stockQuantity > 0 ? 'detail__store-badge--in' : 'detail__store-badge--out'"
                  >
                    {{ store.stockQuantity > 0 ? t('products.inStock', { count: store.stockQuantity }) : t('products.outOfStock') }}
                  </span>
                </div>
              </button>
            </div>

            <!-- "Explore more providers" banner when > 3 stores -->
            <button
              v-if="availableStores.length > 3"
              type="button"
              class="detail__stores-explore"
              @click="showProviderModal = true"
            >
              <div class="detail__stores-explore-left">
                <span class="detail__stores-explore-icon">
                  <AppIcon name="store" :size="16" />
                </span>
                <div class="detail__stores-explore-text">
                  <strong class="detail__stores-explore-title">
                    {{ locale === 'ar' ? `يوجد +${availableStores.length - 3} عروض وموردين آخرين لهذا المنتج` : `+${availableStores.length - 3} more sellers & offers available` }}
                  </strong>
                  <p class="detail__stores-explore-desc">
                    {{ locale === 'ar' ? 'قارن الأسعار وتوفر المخزون واختر العرض الأنسب لك' : 'Compare lowest prices, stock and choose best offer' }}
                  </p>
                </div>
              </div>
              <span class="detail__stores-explore-action">
                <span>{{ locale === 'ar' ? 'عرض ومقارنة الكل' : 'Compare All' }}</span>
                <AppIcon name="chevron-left" :size="14" />
              </span>
            </button>
          </div>
          <!-- Single Provider Banner -->
          <div v-else-if="currentStoreName" class="detail__single-store">
            <div class="detail__single-store-icon">
              <AppIcon name="store" :size="17" />
            </div>
            <div class="detail__single-store-info">
              <span class="detail__single-store-label">{{ locale === 'ar' ? 'المورد المعتمد' : 'Verified Supplier' }}</span>
              <strong class="detail__single-store-name">{{ currentStoreName }}</strong>
            </div>
          </div>

          <div class="detail__price-row">
            <span v-if="currentPrice?.isFlashSaleActive && currentPrice.priceBeforeFlashSale" class="detail__price-old">
              {{ formatPrice(currentPrice.priceBeforeFlashSale) }}
            </span>
            <strong class="detail__price">{{ formatPrice(currentPrice?.effectiveSalesPrice) }}</strong>
            <span class="detail__currency">{{ t('products.currency') }}</span>
            <span v-if="currentPrice?.isFlashSaleActive" class="detail__sale">{{ t('products.sale') }}</span>
            <button
              type="button"
              class="detail__favorite"
              :class="{ 'detail__favorite--active': favorite }"
              :aria-pressed="favorite"
              :aria-label="favorite ? t('product.removeFromWishlist') : t('product.addToWishlist')"
              :disabled="favoriteBusy || !currentPrice"
              @click="toggleFavorite"
            >
              <AppIcon name="heart" :size="19" />
            </button>
          </div>

          <div class="detail__meta">
            <div v-if="currentStoreName" class="detail__meta-provider">
              <AppIcon name="store" :size="14" />
              <span class="detail__meta-provider-label">{{ locale === 'ar' ? 'المورد:' : 'Supplier:' }}</span>
              <strong class="detail__meta-provider-name">{{ currentStoreName }}</strong>
            </div>
            <span v-if="currentPrice && currentPrice.stockQuantity > 0" class="detail__stock">
              <AppIcon name="check" :size="14" />
              {{ t('products.inStock', { count: currentPrice.stockQuantity }) }}
            </span>
            <span v-else class="detail__stock detail__stock--out">
              {{ t('products.outOfStock') }}
            </span>
            <span v-if="currentPrice && currentPrice.maxQuantity > 0" class="detail__max">
              {{ t('products.maxPerOrder', { count: currentPrice.maxQuantity }) }}
            </span>
          </div>

          <div class="detail__buy">
            <div class="detail__stepper" role="group" :aria-label="t('product.addToCart')">
              <button
                type="button"
                class="detail__stepper-btn"
                :disabled="quantity <= 1 || (currentPrice && currentPrice.stockQuantity <= 0) || !currentPrice"
                :aria-label="t('cart.title')"
                @click="decrementQty"
              >
                <AppIcon name="minus" :size="14" />
              </button>
              <span class="detail__stepper-value">{{ quantity }}</span>
              <button
                type="button"
                class="detail__stepper-btn"
                :disabled="quantity >= cartLimit || (currentPrice && currentPrice.stockQuantity <= 0) || !currentPrice"
                :aria-label="t('cart.title')"
                @click="incrementQty"
              >
                <AppIcon name="plus" :size="14" />
              </button>
            </div>
            <AppButton
              variant="primary"
              class="detail__add"
              :disabled="!currentPrice || currentPrice.stockQuantity <= 0"
              @click="addToCart"
            >
              <AppIcon name="cart" :size="16" />
              {{ t('product.addToCart') }}
            </AppButton>
          </div>

          <dl class="detail__facts">
            <div v-if="displayCategory" class="detail__fact">
              <dt>{{ t('products.details.category') }}</dt>
              <dd>{{ displayCategory }}</dd>
            </div>
            <div v-if="detail.brandName" class="detail__fact">
              <dt>{{ t('products.details.brand') }}</dt>
              <dd>{{ detail.brandName }}</dd>
            </div>
            <div class="detail__fact">
              <dt>{{ t('products.details.availability') }}</dt>
              <dd>
                <span v-if="currentPrice && currentPrice.stockQuantity > 0" class="detail__availability detail__availability--yes">
                  {{ t('products.details.availableNow') }}
                </span>
                <span v-else class="detail__availability detail__availability--no">
                  {{ t('products.details.unavailable') }}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div v-if="displayDescription" class="detail__tabs">
        <div class="detail__tabs-bar" role="tablist">
          <button
            v-if="displayDescription"
            type="button"
            role="tab"
            class="detail__tab"
            :class="{ 'detail__tab--active': activeTab === 'description' }"
            :aria-selected="activeTab === 'description'"
            @click="activeTab = 'description'"
          >
            {{ t('products.details.description') }}
          </button>
          <button
            type="button"
            role="tab"
            class="detail__tab"
            :class="{ 'detail__tab--active': activeTab === 'refund' }"
            :aria-selected="activeTab === 'refund'"
            @click="openRefundTab"
          >
            {{ t('products.details.refundPolicy') }}
          </button>
        </div>

        <div v-if="activeTab === 'description' && displayDescription" class="detail__tab-panel">
          <p class="detail__description-text">{{ displayDescription }}</p>
        </div>

        <div v-else-if="activeTab === 'refund'" class="detail__tab-panel">
          <div v-if="refundLoading" class="detail__refund-skeleton" role="status" :aria-label="t('common.loading')">
            <span class="detail__skeleton-line" />
            <span class="detail__skeleton-line" />
            <span class="detail__skeleton-line detail__skeleton-line--short" />
            <span class="detail__skeleton-line" />
          </div>
          <div v-else-if="refundFailed" class="detail__refund-error">
            <span class="detail__refund-error-icon"><AppIcon name="alert-circle" :size="20" /></span>
            <p>{{ t('policy.errorTitle') }}</p>
            <AppButton variant="primary" @click="openRefundTab">
              <AppIcon name="refresh" :size="14" />
              {{ t('categories.retry') }}
            </AppButton>
          </div>
          <iframe
            v-else-if="refundHtml"
            ref="refundFrameRef"
            class="detail__refund-frame"
            sandbox="allow-same-origin"
            :srcdoc="refundHtml"
            :title="t('products.details.refundPolicy')"
            @load="resizeRefundFrame"
          />
        </div>
      </div>

      <!-- Similar / Related Products Section -->
      <section v-if="relatedProducts.length > 0" class="detail__related">
        <div class="detail__related-head">
          <h2 class="detail__related-title">{{ t('product.relatedTitle') }}</h2>
          <p class="detail__related-subtitle">{{ t('product.relatedSubtitle') }}</p>
        </div>
        <div class="detail__related-grid">
          <ProductCard
            v-for="rel in relatedProducts"
            :key="rel.productPriceId || rel.productId"
            :product="rel"
            :favorite="wishlistService.isFavorite(rel.productId, rel.productPriceId)"
            :favorite-busy="wishlistService.busyIds.value.has(rel.productId)"
            :details-to="productRoute(rel.productId, rel.inventoryUserId, { supplier: rel.inventoryUserName || undefined })"
            @toggle-favorite="toggleRelatedFavorite"
            @add-to-cart="addRelatedToCart"
          />
        </div>
      </section>
    </template>

    <!-- Fullscreen Image Lightbox Modal -->
    <ImageLightboxModal
      v-if="detail && detail.images.length"
      v-model="showLightbox"
      :images="detail.images"
      :initial-index="activeImage"
      :title="displayName"
      @change="activeImage = $event"
    />

    <!-- Multi-Provider Comparison & Selection Modal -->
    <ProviderSelectorModal
      v-if="availableStores.length > 1"
      v-model="showProviderModal"
      :stores="availableStores"
      :selected-id="selectedInventoryUserId"
      :product-name="displayName"
      @select="selectedInventoryUserId = $event"
    />
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

.page__loading {
  display: grid;
  grid-template-columns: minmax(0, 22rem) 1fr;
  gap: 2rem;
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

.skeleton {
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-detail--media {
  aspect-ratio: 1;
  border-radius: var(--dz-radius-lg);
}

.skeleton-detail__lines {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.skeleton-detail__line {
  height: 0.9rem;
  width: 70%;
}

.skeleton-detail__line--wide {
  height: 1.2rem;
  width: 100%;
}

.skeleton-detail__line--short {
  width: 45%;
}

.detail {
  display: grid;
  grid-template-columns: minmax(0, 22rem) 1fr;
  gap: 2rem;
  align-items: start;
}

.detail__media {
  position: relative;
  background:
    radial-gradient(14rem 10rem at 50% 115%, var(--dz-primary-soft) 0%, transparent 70%),
    var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  overflow: hidden;
  padding: 0.75rem 0.75rem 0;
}

.detail__main-wrap {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail__main-wrap--clickable {
  cursor: zoom-in;
}

.detail__zoom-btn {
  position: absolute;
  top: 0.6rem;
  inset-inline-end: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: rgb(255 255 255 / 0.9);
  backdrop-filter: blur(4px);
  color: var(--dz-ink);
  box-shadow: var(--dz-shadow-sm);
  cursor: pointer;
  z-index: 3;
  transition:
    transform 0.15s,
    background-color 0.2s,
    color 0.2s;
}

.detail__zoom-btn:hover {
  transform: scale(1.08);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
}

.detail__zoom-btn:focus-visible {
  outline: 3px solid var(--dz-primary);
  outline-offset: 2px;
}

.detail__main {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  object-position: center;
  display: block;
}

.detail__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  color: var(--dz-border-strong);
}

.detail__thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem;
  margin-inline: -0.75rem;
  border-top: 1px solid var(--dz-border);
  background: var(--dz-surface);
}

.detail__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  padding: 0.2rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.detail__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.detail__thumb--active {
  border-color: var(--dz-primary);
  box-shadow: var(--dz-ring);
}

.detail__info {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 0;
}

.detail__name {
  font-family: var(--dz-font-display);
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.detail__subhead {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.detail__code {
  font-family: var(--dz-font-mono);
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.detail__provider-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.76rem;
}

.detail__provider-tag-label {
  color: var(--dz-muted);
  font-weight: 500;
}

.detail__provider-tag-name {
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.detail__price-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.detail__price {
  font-family: var(--dz-font-display);
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  letter-spacing: -0.01em;
}

.detail__currency {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.detail__price-old {
  font-size: 1rem;
  color: var(--dz-muted);
  text-decoration: line-through;
}

.detail__sale {
  padding: 0.25rem 0.65rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger);
  color: var(--dz-white);
  font-size: 0.72rem;
  font-weight: 700;
}

.detail__favorite {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  margin-inline-start: auto;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  color: var(--dz-muted);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s,
    transform 0.15s;
}

.detail__favorite:hover {
  border-color: var(--dz-danger);
  color: var(--dz-danger);
  transform: translateY(-1px);
}

.detail__favorite--active {
  background: var(--dz-danger-soft);
  border-color: var(--dz-danger);
  color: var(--dz-danger);
}

.detail__favorite:disabled {
  opacity: 0.6;
  cursor: wait;
  transform: none;
}

.detail__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}

.detail__meta-provider {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--dz-ink);
  background: var(--dz-surface-soft);
  padding: 0.2rem 0.55rem;
  border-radius: var(--dz-radius);
  border: 1px solid var(--dz-border);
}

.detail__meta-provider-label {
  color: var(--dz-muted);
}

.detail__meta-provider-name {
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.detail__stock {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-success);
}

.detail__stock--out {
  color: var(--dz-danger);
}

.detail__max {
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.detail__buy {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.detail__stepper {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  padding: 0.25rem;
  background: var(--dz-surface);
}

.detail__stepper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.detail__stepper-btn:hover:not(:disabled) {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.detail__stepper-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.detail__stepper-value {
  min-width: 1.8rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.95rem;
}

.detail__add {
  min-width: 11rem;
}

.detail__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.6rem;
  margin-top: 0.6rem;
  padding: 0.9rem 1rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
}

.detail__fact dt {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dz-muted);
}

.detail__fact dd {
  margin-top: 0.25rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.detail__availability {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.detail__availability--yes {
  color: var(--dz-success);
}

.detail__availability--no {
  color: var(--dz-danger);
}

.detail__tabs {
  margin-top: 2.5rem;
}

.detail__tabs-bar {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--dz-border);
  margin-bottom: 1.25rem;
}

.detail__tab {
  padding: 0.65rem 1.1rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-muted);
  transition:
    color 0.2s,
    border-color 0.2s;
}

.detail__tab:hover {
  color: var(--dz-primary-strong);
}

.detail__tab--active {
  color: var(--dz-primary-strong);
  border-bottom-color: var(--dz-primary);
}

.detail__tab-panel {
  min-width: 0;
}

.detail__description-text {
  font-size: 0.92rem;
  line-height: 1.75;
  color: var(--dz-ink-soft);
  white-space: pre-line;
  width: 100%;
}

.detail__refund-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.5rem 0 1rem;
}

.detail__skeleton-line {
  height: 0.9rem;
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.detail__skeleton-line--short {
  width: 65%;
}

.detail__refund-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--dz-muted);
}

.detail__refund-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
  margin-bottom: 0.25rem;
}

.detail__refund-frame {
  display: block;
  width: 100%;
  height: 320px;
  border: 0;
  border-radius: var(--dz-radius);
  background: #fff;
  color-scheme: light;
  overflow: hidden;
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

@media (max-width: 768px) {
  .page {
    padding-block: 1.5rem 3.5rem;
  }

  .detail,
  .page__loading {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .detail__price {
    font-size: 1.6rem;
  }

  .detail__tabs-bar {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .detail__tabs-bar::-webkit-scrollbar {
    display: none;
  }

  .detail__tab {
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .detail__buy {
    flex-direction: column;
    align-items: stretch;
  }

  .detail__stepper {
    justify-content: center;
    width: 100%;
  }

  .detail__add {
    width: 100%;
    justify-content: center;
  }

  .detail__facts {
    grid-template-columns: 1fr;
  }

  .detail__thumbs {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .detail__thumbs::-webkit-scrollbar {
    display: none;
  }

  .detail__thumb {
    flex-shrink: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}

/* --- Stores / Providers Selector --- */
.detail__stores {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem;
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
}

.detail__stores-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detail__stores-head-title {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--dz-ink);
  font-size: 0.84rem;
  font-weight: 700;
}

.detail__stores-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-primary);
  background: var(--dz-surface);
  color: var(--dz-primary-strong);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, transform 0.15s;
}

.detail__stores-all-btn:hover {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  transform: translateY(-1px);
}

.detail__stores-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail__store-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  background: var(--dz-surface);
  border: 1.5px solid var(--dz-border);
  border-radius: var(--dz-radius);
  cursor: pointer;
  text-align: start;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s, transform 0.15s;
  width: 100%;
}

.detail__store-card:hover {
  border-color: var(--dz-primary);
  background: var(--dz-surface);
  transform: translateY(-1px);
}

.detail__store-card--active {
  border-color: var(--dz-primary);
  background: var(--dz-primary-soft);
  box-shadow: var(--dz-shadow-sm);
}

.detail__store-card--best {
  border-color: var(--dz-gold);
}

.detail__store-tag-best {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-gold-soft);
  color: var(--dz-gold-strong);
  flex-shrink: 0;
}

/* Explore More Providers Banner */
.detail__stores-explore {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.95rem;
  border-radius: var(--dz-radius);
  border: 1px dashed var(--dz-primary);
  background: var(--dz-primary-faint);
  cursor: pointer;
  text-align: start;
  transition: background-color 0.2s, border-color 0.2s, transform 0.15s;
  width: 100%;
}

.detail__stores-explore:hover {
  background: var(--dz-primary-soft);
  border-color: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.detail__stores-explore-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.detail__stores-explore-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  color: var(--dz-primary);
  flex-shrink: 0;
  box-shadow: var(--dz-shadow-sm);
}

.detail__stores-explore-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.detail__stores-explore-title {
  font-size: 0.84rem;
  color: var(--dz-primary-strong);
  font-weight: 700;
  line-height: 1.25;
}

.detail__stores-explore-desc {
  font-size: 0.74rem;
  color: var(--dz-muted);
  margin-top: 0.15rem;
}

.detail__stores-explore-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--dz-primary);
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

html[dir='rtl'] .detail__stores-explore-action svg {
  transform: scaleX(-1);
}

.detail__store-top {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.detail__store-radio {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: var(--dz-radius-full);
  border: 2px solid var(--dz-border-strong);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.2s;
}

.detail__store-card--active .detail__store-radio {
  border-color: var(--dz-primary);
  background: var(--dz-primary);
  box-shadow: inset 0 0 0 2.5px var(--dz-surface);
}

.detail__store-name {
  font-size: 0.88rem;
  color: var(--dz-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail__store-bottom {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.detail__store-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.detail__store-old {
  font-size: 0.75rem;
  color: var(--dz-muted);
  text-decoration: line-through;
}

.detail__store-price {
  font-size: 0.95rem;
  color: var(--dz-primary);
  font-weight: 700;
}

.detail__store-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--dz-radius-full);
}

.detail__store-badge--in {
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.detail__store-badge--out {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.detail__single-store {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.95rem;
  background: var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  align-self: flex-start;
}

.detail__single-store-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary);
  flex-shrink: 0;
}

.detail__single-store-info {
  display: flex;
  flex-direction: column;
}

.detail__single-store-label {
  font-size: 0.72rem;
  color: var(--dz-muted);
}

.detail__single-store-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--dz-ink);
}

/* --- Similar / Related Products Section --- */
.detail__related {
  margin-top: 3.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--dz-border);
}

.detail__related-head {
  margin-bottom: 1.5rem;
}

.detail__related-title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.3rem, 2.5vw, 1.6rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--dz-ink);
}

.detail__related-subtitle {
  margin-top: 0.25rem;
  font-size: 0.88rem;
  color: var(--dz-muted);
}

.detail__related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.15rem;
}

@media (min-width: 1150px) {
  .detail__related-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .detail,
  .page__loading {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .detail__related-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 360px) {
  .detail__related-grid {
    grid-template-columns: 1fr;
  }
}
</style>