<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { t, locale } from '../i18n'
import { API_LANG } from '../config/api.config'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import CategoryCard from '../components/categories/CategoryCard.vue'
import ProductCard from '../components/products/ProductCard.vue'
import OfferSlider from '../components/home/OfferSlider.vue'
import ProviderGrid from '../components/home/ProviderGrid.vue'
import type { CategoryDto } from '../domain/models/category'
import type { HomeDto, HomeProviderDto } from '../domain/models/home'
import type { ProviderProductDto } from '../domain/models/product'

const router = useRouter()
const { authService, categoryRepository, homeRepository, productRepository, cartService, wishlistService } = services

const isAuthenticated = computed(() => authService.isAuthenticated)

const CATEGORIES_LIMIT = 10

const categories = ref<CategoryDto[]>([])
const categoriesLoading = ref(true)
const categoriesError = ref(false)

const home = ref<HomeDto | null>(null)
const homeLoading = ref(true)
const homeError = ref(false)

const popularProducts = ref<ProviderProductDto[]>([])
const popularLoading = ref(true)
const popularError = ref(false)
const showAllPopular = ref(false)
const POPULAR_LIMIT = 10

const displayedPopularProducts = computed(() => {
  if (showAllPopular.value) return popularProducts.value
  return popularProducts.value.slice(0, POPULAR_LIMIT)
})

const offersOne = computed(() => home.value?.specialOffersone ?? [])
const offersTwo = computed(() => home.value?.specialOfferstwo ?? [])
const featuredProducts = computed(() => home.value?.products ?? [])
const flashSales = computed(() => home.value?.flashSales ?? [])

// --- 1. Top Providers Section (Independent Endpoint /api/Users/get-top-providers) ---
const topProviders = ref<HomeProviderDto[]>([])
const topProvidersLoading = ref(false)
const topProvidersError = ref(false)

// --- 2. All Suppliers / Providers (General section) ---
const allProviders = computed(() => home.value?.providers ?? [])

// Home sections show the first 8 providers; "View all suppliers" opens the full list.
const HOME_PROVIDERS_LIMIT = 8
const displayedTopProviders = computed(() => topProviders.value.slice(0, HOME_PROVIDERS_LIMIT))
const displayedAllProviders = computed(() => allProviders.value.slice(0, HOME_PROVIDERS_LIMIT))

// --- 3. Products Section (First Page 15 items + View All) ---
const catalogProducts = ref<ProviderProductDto[]>([])
const catalogLoading = ref(true)
const catalogError = ref(false)

// Map to calculate number of providers offering each product
const providerCountsByProduct = computed(() => {
  const map = new Map<string, Set<string>>()
  for (const p of catalogProducts.value) {
    const key = p.productId || p.productName
    const invId = p.inventoryUserId || p.inventoryUserName || 'default'
    if (!map.has(key)) map.set(key, new Set())
    map.get(key)!.add(invId)
  }
  const countMap = new Map<string, number>()
  for (const [key, set] of map.entries()) {
    countMap.set(key, set.size)
  }
  return countMap
})

const getProductProviderCount = (product: ProviderProductDto): number => {
  const key = product.productId || product.productName
  return providerCountsByProduct.value.get(key) ?? 1
}

const viewAllProducts = () => {
  void router.push({ name: 'products' })
}

const viewAllVendors = () => {
  void router.push({ name: 'vendors' })
}

import { categoryRoute, productRoute } from '../utils/route-crypto'

const favoriteBusy = computed(() => wishlistService.busyIds.value)

const detailsTo = (product: ProviderProductDto) =>
  productRoute(product.productId, product.inventoryUserId, {
    supplier: product.inventoryUserName || undefined,
  })

const toggleFavorite = (product: ProviderProductDto) => {
  void wishlistService.toggle({
    productId: product.productId,
    productPriceId: product.productPriceId,
    inventoryUserId: product.inventoryUserId,
    name: product.productName,
  })
}

const heroSearchQuery = ref('')

const onHeroSearch = () => {
  const q = heroSearchQuery.value.trim()
  if (!q) {
    void router.push({ name: 'products' })
    return
  }
  void router.push({ name: 'products', query: { search: q } })
}

const addToCart = (product: ProviderProductDto) => {
  if (!product.inventoryUserId || product.inventoryUserId === 'default' || getProductProviderCount(product) > 1) {
    void router.push(detailsTo(product))
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

const go = () => {
  void router.push(isAuthenticated.value ? { name: 'profile' } : { name: 'login' })
}

const loadCategories = async () => {
  categoriesLoading.value = true
  categoriesError.value = false
  try {
    const all = await categoryRepository.getCategories(locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH)
    categories.value = all.slice(0, CATEGORIES_LIMIT)
  } catch {
    categoriesError.value = true
  } finally {
    categoriesLoading.value = false
  }
}

const loadPopularProducts = async () => {
  popularLoading.value = true
  popularError.value = false
  try {
    const list = await productRepository.getPopularProducts()
    popularProducts.value = list
    wishlistService.mergeFavorites(list.filter((p) => p.isFavorite).map((p) => p.productPriceId))
  } catch {
    popularError.value = true
  } finally {
    popularLoading.value = false
  }
}

const loadHome = async () => {
  homeLoading.value = true
  homeError.value = false
  try {
    home.value = await homeRepository.getHome(locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH)
    wishlistService.mergeFavorites(home.value.products.filter((p) => p.isFavorite).map((p) => p.productPriceId))

    if (catalogProducts.value.length === 0 && home.value?.products?.length) {
      catalogProducts.value = home.value.products
      catalogLoading.value = false
    }
  } catch {
    homeError.value = true
  } finally {
    homeLoading.value = false
    void loadTopProviders()
    void loadCatalogProducts()
  }
}

const loadTopProviders = async () => {
  topProvidersLoading.value = true
  topProvidersError.value = false
  try {
    const lang = locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH
    topProviders.value = await homeRepository.getTopProviders(lang)
  } catch {
    topProvidersError.value = true
  } finally {
    topProvidersLoading.value = false
  }
}

const displayedCatalogProducts = computed(() => {
  return catalogProducts.value.slice(0, 15)
})

const loadCatalogProducts = async () => {
  catalogLoading.value = true
  catalogError.value = false
  try {
    const list = await productRepository.searchProducts({})
    catalogProducts.value = list
    wishlistService.mergeFavorites(list.filter((p) => p.isFavorite).map((p) => p.productPriceId))
  } catch {
    catalogError.value = true
  } finally {
    catalogLoading.value = false
  }
}

onMounted(() => {
  void loadCategories()
  void loadPopularProducts()
  void loadHome()
  void loadTopProviders()
  void loadCatalogProducts()
  void wishlistService.refresh()
})

watch(isAuthenticated, (authed) => {
  if (authed) {
    void loadHome()
    void loadPopularProducts()
    void loadTopProviders()
    void loadCatalogProducts()
    void wishlistService.refresh(true)
  }
})
</script>

<template>
  <div class="home">
    <div class="hero">
    <div class="hero__glow hero__glow--one" aria-hidden="true" />
    <div class="hero__glow hero__glow--two" aria-hidden="true" />

    <section class="container hero__inner">
      <div class="hero__copy">

        <h1 class="hero__title">
          {{ t('home.titleLine1') }}
          <span class="hero__accent">{{ t('home.titleAccent') }}</span>
        </h1>

        <p class="hero__subtitle">{{ t('home.subtitle') }}</p>

        <div class="hero__chips">
          <span class="hero__chip"><AppIcon name="tooth" :size="15" />{{ t('home.chipTools') }}</span>
          <span class="hero__chip"><AppIcon name="shield-check" :size="15" />{{ t('home.chipSuppliers') }}</span>
          <span class="hero__chip"><AppIcon name="truck" :size="15" />{{ t('home.chipDelivery') }}</span>
        </div>

        <!-- Hero Search Bar -->
        <form class="hero__search" role="search" @submit.prevent="onHeroSearch">
          <span class="hero__search-icon">
            <AppIcon name="search" :size="18" />
          </span>
          <input
            v-model="heroSearchQuery"
            class="hero__search-input"
            type="search"
            :placeholder="t('products.searchPlaceholder')"
            :aria-label="t('products.searchPlaceholder')"
          />
          <AppButton type="submit" variant="primary" size="md" class="hero__search-btn">
            {{ t('products.search') }}
          </AppButton>
        </form>

        <div class="hero__actions">
          <AppButton size="lg" variant="gold" @click="go">
            {{ isAuthenticated ? t('profile.title') : t('auth.login') }}
            <AppIcon name="arrow-right" :size="16" />
          </AppButton>
        </div>

      </div>

      <div class="hero__visual" aria-hidden="true">
        <svg class="hero__ring" viewBox="0 0 320 320">
          <circle class="hero__ring-base" cx="160" cy="160" r="150" />
          <circle class="hero__ring-dash" cx="160" cy="160" r="122" />
        </svg>

        <div class="hero__logo-card">
          <div class="hero__logo-glow" />
          <img src="/denta-logo.png" alt="DentZone" class="hero__logo" />
        </div>

        <span class="hero__orbit hero__orbit--one"><AppIcon name="brush" :size="20" /></span>
        <span class="hero__orbit hero__orbit--two"><AppIcon name="tube" :size="20" /></span>
        <span class="hero__orbit hero__orbit--three"><AppIcon name="droplet" :size="20" /></span>

        <span class="hero__wordmark">Dent<span>Zone</span></span>
      </div>
    </section>
  </div>

    <section class="categories" :aria-label="t('home.shopByCategory')">
    <div class="container">
      <div class="categories__head">
        <div>
          <h2 class="categories__title">{{ t('home.shopByCategory') }}</h2>
          <p class="categories__subtitle">{{ t('home.categorySubtitle') }}</p>
        </div>
        <RouterLink to="/categories" class="categories__all">
          <AppIcon name="box" :size="16" />
          {{ t('home.viewAllCategories') }}
          <AppIcon name="arrow-right" :size="15" />
        </RouterLink>
      </div>

      <div v-if="categoriesLoading" class="categories__grid" role="status" :aria-label="t('common.loading')">
        <div v-for="i in 10" :key="i" class="categories__skeleton">
          <span class="categories__skeleton-media" />
          <span class="categories__skeleton-line categories__skeleton-line--wide" />
          <span class="categories__skeleton-line" />
        </div>
      </div>

      <div v-else-if="categoriesError" class="categories__error" role="alert">
        <AppIcon name="alert-circle" :size="17" />
        <span>{{ t('categories.errorDescription') }}</span>
        <button type="button" class="categories__retry" @click="loadCategories">
          <AppIcon name="refresh" :size="14" />
          {{ t('categories.retry') }}
        </button>
      </div>

      <div v-else-if="categories.length === 0" class="categories__empty">
        <span class="categories__empty-icon"><AppIcon name="box" :size="24" /></span>
        <strong>{{ t('categories.emptyTitle') }}</strong>
        <span>{{ t('categories.emptyDescription') }}</span>
      </div>

      <div v-else class="categories__grid">
        <CategoryCard
          v-for="category in categories"
          :key="category.id"
          :category="category"
          :to="categoryRoute(category.id)"
        />
      </div>
    </div>
    </section>

    <!-- SECTION 1: Top Providers (Independent Section) -->
    <section class="providers providers--top" :aria-label="t('home.topProvidersTitle')">
      <div class="container">
        <div class="providers__head">
          <div>
            <span class="providers__badge">
              <AppIcon name="shield-check" :size="14" />
              {{ t('home.topProvidersTitle') }}
            </span>
            <h2 class="providers__title">{{ t('home.topProvidersTitle') }}</h2>
            <p class="providers__subtitle">{{ t('home.topProvidersSubtitle') }}</p>
          </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="topProvidersLoading && topProviders.length === 0" class="providers__skeleton-row" role="status" :aria-label="t('common.loading')">
          <div v-for="i in 5" :key="i" class="providers__skeleton-card">
            <span class="providers__skeleton-avatar" />
            <span class="providers__skeleton-lines">
              <span class="providers__skeleton-line providers__skeleton-line--wide" />
              <span class="providers__skeleton-line" />
            </span>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="topProvidersError && topProviders.length === 0" class="providers__error" role="alert">
          <AppIcon name="alert-circle" :size="17" />
          <span>{{ t('categories.errorDescription') }}</span>
          <button type="button" class="providers__retry" @click="loadTopProviders">
            <AppIcon name="refresh" :size="14" />
            {{ t('categories.retry') }}
          </button>
        </div>

        <!-- Top Providers Grid -->
        <ProviderGrid v-if="!topProvidersLoading && displayedTopProviders.length > 0" :providers="displayedTopProviders" />
      </div>
    </section>

    <OfferSlider
      :offers="offersOne"
      :title="t('home.specialOffers')"
      :subtitle="t('home.specialOffersSubtitle')"
      show-states
      :loading="homeLoading"
      :error="homeError"
      @retry="loadHome"
    />

    <section
      v-if="popularLoading || (!popularError && popularProducts.length)"
      class="featured featured--popular"
      :aria-label="t('home.popularTitle')"
    >
      <div class="container">
        <div class="featured__head featured__head--flex">
          <div>
            <span class="featured__badge">
              <AppIcon name="flame" :size="14" />
              {{ t('home.bestsellersTitle') }}
            </span>
            <h2 class="featured__title">{{ t('home.popularTitle') }}</h2>
            <p class="featured__subtitle">{{ t('home.popularSubtitle') }}</p>
          </div>
          <button
            v-if="!popularLoading && popularProducts.length > POPULAR_LIMIT"
            type="button"
            class="featured__toggle-btn"
            :aria-expanded="showAllPopular"
            @click="showAllPopular = !showAllPopular"
          >
            <span>{{ showAllPopular ? t('home.showLess') : t('home.viewAllPopular') }}</span>
            <AppIcon :name="showAllPopular ? 'chevron-up' : 'arrow-right'" :size="15" />
          </button>
        </div>

        <div v-if="popularLoading" class="featured__grid" role="status" :aria-label="t('common.loading')">
          <div v-for="i in 4" :key="i" class="categories__skeleton">
            <span class="categories__skeleton-media" />
            <span class="categories__skeleton-line categories__skeleton-line--wide" />
            <span class="categories__skeleton-line" />
          </div>
        </div>

        <div v-else class="featured__grid">
          <ProductCard
            v-for="product in displayedPopularProducts"
            :key="product.productPriceId"
            :product="product"
            :favorite="wishlistService.isFavorite(product.productId, product.productPriceId)"
            :favorite-busy="favoriteBusy.has(product.productId)"
            :details-to="detailsTo(product)"
            :provider-count="getProductProviderCount(product)"
            @toggle-favorite="toggleFavorite"
            @add-to-cart="addToCart"
          />
        </div>

        <div v-if="!popularLoading && popularProducts.length > POPULAR_LIMIT" class="featured__footer-action">
          <button
            type="button"
            class="featured__toggle-btn featured__toggle-btn--lg"
            :aria-expanded="showAllPopular"
            @click="showAllPopular = !showAllPopular"
          >
            <span>
              {{ showAllPopular ? t('home.showLess') : t('home.viewAllPopular') }}
              <template v-if="!showAllPopular">({{ popularProducts.length }})</template>
            </span>
            <AppIcon :name="showAllPopular ? 'chevron-up' : 'arrow-right'" :size="15" />
          </button>
        </div>
      </div>
    </section>

    <section v-if="!homeLoading && !homeError && featuredProducts.length" class="featured" :aria-label="t('home.featuredTitle')">
      <div class="container">
        <div class="featured__head">
          <div>
            <h2 class="featured__title">{{ t('home.featuredTitle') }}</h2>
            <p class="featured__subtitle">{{ t('home.featuredSubtitle') }}</p>
          </div>
        </div>

        <div class="featured__grid">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.productPriceId"
            :product="product"
            :favorite="wishlistService.isFavorite(product.productId, product.productPriceId)"
            :favorite-busy="favoriteBusy.has(product.productId)"
            :details-to="detailsTo(product)"
            :provider-count="getProductProviderCount(product)"
            @toggle-favorite="toggleFavorite"
            @add-to-cart="addToCart"
          />
        </div>
      </div>
    </section>

    <section v-if="!homeLoading && !homeError && flashSales.length" class="featured featured--flash" :aria-label="t('home.flashSalesTitle')">
      <div class="container">
        <div class="featured__head">
          <div>
            <h2 class="featured__title">{{ t('home.flashSalesTitle') }}</h2>
            <p class="featured__subtitle">{{ t('home.flashSalesSubtitle') }}</p>
          </div>
        </div>

        <div class="featured__grid">
          <ProductCard
            v-for="product in flashSales"
            :key="product.productPriceId"
            :product="product"
            :favorite="wishlistService.isFavorite(product.productId, product.productPriceId)"
            :favorite-busy="favoriteBusy.has(product.productId)"
            :details-to="detailsTo(product)"
            :provider-count="getProductProviderCount(product)"
            @toggle-favorite="toggleFavorite"
            @add-to-cart="addToCart"
          />
        </div>
      </div>
    </section>

    <OfferSlider
      v-if="!homeLoading && !homeError && offersTwo.length"
      :offers="offersTwo"
      :title="t('home.moreOffersTitle')"
      :subtitle="t('home.moreOffersSubtitle')"
    />

    <!-- SECTION 2: All Suppliers / Providers (General Section) -->
    <section v-if="!homeLoading && allProviders.length > 0" class="providers providers--all" :aria-label="t('home.shopByVendor')">
      <div class="container">
        <div class="providers__head providers__head--flex">
          <div>
            <h2 class="providers__title">{{ t('home.shopByVendor') }}</h2>
            <p class="providers__subtitle">{{ t('home.vendorSubtitle') }}</p>
          </div>
          <button type="button" class="catalog-section__view-all providers__view-all" @click="viewAllVendors">
            <span>{{ t('home.viewAllVendors') }}</span>
            <AppIcon name="arrow-right" :size="15" />
          </button>
        </div>

        <!-- All Suppliers Grid -->
        <ProviderGrid :providers="displayedAllProviders" />
      </div>
    </section>

    <!-- SECTION 3: Products Catalog (First Page 15 items + View All) -->
    <section class="catalog-section" :aria-label="t('home.allProductsTitle')">
      <div class="container">
        <div class="catalog-section__head">
          <div>
            <span class="catalog-section__badge">
              <AppIcon name="box" :size="14" />
              {{ t('home.allProductsTitle') }}
            </span>
            <h2 class="catalog-section__title">{{ t('home.allProductsTitle') }}</h2>
            <p class="catalog-section__subtitle">{{ t('home.allProductsSubtitle') }}</p>
          </div>
          <button type="button" class="catalog-section__view-all" @click="viewAllProducts">
            <span>{{ t('home.viewAllProducts') }}</span>
            <AppIcon name="arrow-right" :size="15" />
          </button>
        </div>

        <!-- Loading Skeletons -->
        <div v-if="catalogLoading" class="catalog-section__grid" role="status" :aria-label="t('common.loading')">
          <div v-for="i in 6" :key="i" class="categories__skeleton">
            <span class="categories__skeleton-media" />
            <span class="categories__skeleton-line categories__skeleton-line--wide" />
            <span class="categories__skeleton-line" />
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="catalogError" class="categories__error" role="alert">
          <AppIcon name="alert-circle" :size="17" />
          <span>{{ t('categories.errorDescription') }}</span>
          <button type="button" class="categories__retry" @click="loadCatalogProducts">
            <AppIcon name="refresh" :size="14" />
            {{ t('categories.retry') }}
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="catalogProducts.length === 0" class="categories__empty">
          <span class="categories__empty-icon"><AppIcon name="search" :size="24" /></span>
          <strong>{{ t('home.noPaginatedProducts') }}</strong>
          <span>{{ t('home.noPaginatedProductsDesc') }}</span>
          <AppButton variant="secondary" size="sm" @click="loadCatalogProducts">
            {{ t('categories.retry') }}
          </AppButton>
        </div>

        <!-- First Page 15-Product Grid -->
        <div v-else class="catalog-section__grid">
          <ProductCard
            v-for="product in displayedCatalogProducts"
            :key="product.productPriceId || product.productId"
            :product="product"
            :favorite="wishlistService.isFavorite(product.productId, product.productPriceId)"
            :favorite-busy="favoriteBusy.has(product.productId)"
            :details-to="detailsTo(product)"
            :provider-count="getProductProviderCount(product)"
            @toggle-favorite="toggleFavorite"
            @add-to-cart="addToCart"
          />
        </div>

        <!-- View All Footer CTA -->
        <div v-if="!catalogLoading && !catalogError && catalogProducts.length > 0" class="catalog-section__footer">
          <button type="button" class="catalog-section__footer-btn" @click="viewAllProducts">
            <span>{{ t('home.viewAllProducts') }}</span>
            <AppIcon name="arrow-right" :size="16" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(52rem 30rem at 82% -12%, rgb(127 212 189 / 0.14) 0%, transparent 60%),
    radial-gradient(40rem 26rem at 8% 108%, rgb(184 134 43 / 0.1) 0%, transparent 60%),
    var(--dz-band);
  color: var(--dz-white);
  padding: 5rem 0 5.5rem;
}

.hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}

.hero__glow--one {
  width: 24rem;
  height: 24rem;
  top: -8rem;
  inset-inline-end: 6%;
  background: rgb(127 212 189 / 0.16);
}

.hero__glow--two {
  width: 18rem;
  height: 18rem;
  bottom: -9rem;
  inset-inline-start: 3%;
  background: rgb(212 162 76 / 0.1);
}

.hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 3rem;
}

.hero__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.15rem;
  animation: hero-fade-up 0.6s ease both;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.95rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.06);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgb(255 255 255 / 0.82);
}

.hero__title {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -0.025em;
  color: var(--dz-white);
}

.hero__accent {
  display: block;
  color: var(--dz-gold);
}

.hero__subtitle {
  max-width: 46ch;
  font-size: 1.02rem;
  line-height: 1.65;
  color: rgb(255 255 255 / 0.72);
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid rgb(255 255 255 / 0.16);
  background: rgb(255 255 255 / 0.06);
  font-size: 0.78rem;
  font-weight: 600;
  color: rgb(255 255 255 / 0.85);
}

.hero__search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgb(255 255 255 / 0.95);
  backdrop-filter: blur(8px);
  border: 1.5px solid var(--dz-gold);
  border-radius: var(--dz-radius-full);
  padding: 0.35rem 0.45rem 0.35rem 1rem;
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.25);
  max-width: 32rem;
  width: 100%;
}

html[dir='rtl'] .hero__search {
  padding: 0.35rem 1rem 0.35rem 0.45rem;
}

.hero__search-icon {
  display: flex;
  align-items: center;
  color: var(--dz-primary);
  flex-shrink: 0;
}

.hero__search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--dz-ink);
  outline: none;
  min-width: 0;
}

.hero__search-input::placeholder {
  color: var(--dz-muted);
}

.hero__search-btn {
  border-radius: var(--dz-radius-full) !important;
  flex-shrink: 0;
}

.hero__actions {
  margin-top: 0.4rem;
}


.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340px;
  animation: hero-fade-up 0.7s 0.12s ease both;
}

.hero__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: 340px;
  max-height: 340px;
  margin: auto;
  animation: hero-orbit 42s linear infinite;
}

.hero__ring-base,
.hero__ring-dash {
  fill: none;
  stroke: rgb(255 255 255 / 0.12);
  stroke-width: 1.5;
}

.hero__ring-dash {
  stroke: var(--dz-gold);
  stroke-dasharray: 2 14;
  stroke-width: 2;
  opacity: 0.75;
}

.hero__logo-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 11.5rem;
  height: 11.5rem;
  border-radius: 28px;
  background: linear-gradient(145deg, #ffffff 0%, #f4f8fc 100%);
  border: 2.5px solid var(--dz-gold);
  box-shadow:
    0 0 0 6px rgb(255 255 255 / 0.18),
    0 24px 60px rgb(0 0 0 / 0.55),
    0 0 45px rgb(247 147 59 / 0.35);
  padding: 0.85rem;
  z-index: 2;
  animation: hero-breathe 5s ease-in-out infinite;
}

.hero__logo-glow {
  position: absolute;
  inset: -1.75rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(247 147 59 / 0.45) 0%, rgb(255 255 255 / 0.2) 45%, transparent 70%);
  filter: blur(18px);
  pointer-events: none;
  z-index: -1;
}

.hero__logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 18px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgb(0 0 0 / 0.2));
}

.hero__orbit {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--dz-radius-full);
  background: rgb(255 255 255 / 0.07);
  border: 1px solid rgb(255 255 255 / 0.16);
  color: var(--dz-mint);
  backdrop-filter: blur(6px);
}

.hero__orbit--one {
  top: 8%;
  inset-inline-end: 16%;
}

.hero__orbit--two {
  bottom: 12%;
  inset-inline-end: 10%;
}

.hero__orbit--three {
  bottom: 6%;
  inset-inline-start: 20%;
  color: var(--dz-gold);
}

.hero__wordmark {
  position: absolute;
  bottom: 0;
  font-family: var(--dz-font-display);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.4);
}

.hero__wordmark span {
  color: var(--dz-gold);
}

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes hero-breathe {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 900px) {
  .hero__inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero__visual {
    min-height: 280px;
  }

  .hero {
    padding: 3.5rem var(--dz-gutter) 3.5rem;
  }
}

@media (max-width: 560px) {
  .hero {
    padding: 2.5rem var(--dz-gutter) 2.75rem;
  }

  .hero__copy {
    gap: 0.95rem;
  }

  .hero__subtitle {
    font-size: 0.92rem;
  }

  .hero__visual {
    min-height: 220px;
  }

  .hero__ring {
    max-width: 250px;
    max-height: 250px;
  }

  .hero__logo-card {
    width: 8.5rem;
    height: 8.5rem;
    border-radius: 20px;
    padding: 0.65rem;
  }

  .hero__orbit {
    width: 2.4rem;
    height: 2.4rem;
  }
}

@media (max-width: 380px) {
  .hero__actions {
    width: 100%;
  }

  .hero__actions :deep(.app-button) {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__copy,
  .hero__visual {
    animation: none;
  }

  .hero__ring,
  .hero__logo-card {
    animation: none;
  }
}

.featured {
  padding: 4rem 0 0;
  background: var(--dz-paper);
}

.featured--popular {
  padding-top: 3.5rem;
}

.featured--flash {
  padding-top: 3rem;
}

.featured__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
}

.featured__title,
.providers__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.featured__subtitle,
.providers__subtitle {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.featured__all {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  white-space: nowrap;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s,
    transform 0.15s;
}

.featured__all:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
  transform: translateY(-1px);
}

.featured__all svg:last-child {
  transition: transform 0.2s;
}

.featured__all:hover svg:last-child {
  transform: translateX(3px);
}

html[dir='rtl'] .featured__all svg:last-child {
  transform: scaleX(-1);
}

html[dir='rtl'] .featured__all:hover svg:last-child {
  transform: scaleX(-1) translateX(-3px);
}

.featured__toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.52rem 1.15rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s,
    transform 0.15s;
}

.featured__toggle-btn:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
  transform: translateY(-1px);
}

.featured__toggle-btn svg {
  transition: transform 0.2s;
}

.featured__toggle-btn:hover svg {
  transform: translateX(3px);
}

html[dir='rtl'] .featured__toggle-btn svg {
  transform: scaleX(-1);
}

html[dir='rtl'] .featured__toggle-btn:hover svg {
  transform: scaleX(-1) translateX(-3px);
}

.featured__footer-action {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.featured__toggle-btn--lg {
  padding: 0.65rem 1.75rem;
  font-size: 0.92rem;
  box-shadow: var(--dz-shadow-sm);
}

.featured__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.1rem;
}

.categories {
  padding: 4rem 0;
  background: var(--dz-paper);
}

.categories__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.categories__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.categories__subtitle {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.categories__all {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  white-space: nowrap;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s,
    transform 0.15s;
}

.categories__all:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-faint);
  transform: translateY(-1px);
}

.categories__all svg:last-child {
  transition: transform 0.2s;
}

.categories__all:hover svg:last-child {
  transform: translateX(3px);
}

html[dir='rtl'] .categories__all svg:last-child {
  transform: scaleX(-1);
}

html[dir='rtl'] .categories__all:hover svg:last-child {
  transform: scaleX(-1) translateX(-3px);
}

.categories__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.1rem;
}

.categories__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  padding-bottom: 1.1rem;
  overflow: hidden;
}

.categories__skeleton-media,
.categories__skeleton-line {
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: categories-pulse 1.4s ease-in-out infinite;
}

.categories__skeleton-media {
  aspect-ratio: 1 / 1;
  width: 100%;
  border-radius: 0;
}

.categories__skeleton-line {
  height: 0.8rem;
  width: 60%;
  margin-inline: 1.1rem;
}

.categories__skeleton-line--wide {
  width: 85%;
  height: 1rem;
}

.categories__error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 1.2rem;
  border-radius: var(--dz-radius);
  background: var(--dz-danger-soft);
  border: 1px solid color-mix(in srgb, var(--dz-danger) 25%, var(--dz-border));
  color: var(--dz-danger);
  font-size: 0.88rem;
  font-weight: 600;
  flex-wrap: wrap;
}

.categories__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--dz-border-strong);
  border-radius: var(--dz-radius-lg);
  text-align: center;
}

.categories__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.4rem;
}

.categories__empty strong {
  font-family: var(--dz-font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.categories__empty > span:last-child {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 38ch;
}

.categories__retry {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  margin-inline-start: auto;
  border: 1px solid color-mix(in srgb, var(--dz-danger) 40%, var(--dz-border));
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  color: var(--dz-danger);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.categories__retry:hover {
  background: var(--dz-danger);
  color: var(--dz-white);
}

@keyframes categories-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}

.providers {
  padding: 2rem 0 4rem;
  background: var(--dz-paper);
  overflow: hidden;
}

.providers__head {
  margin-bottom: 1.75rem;
}

.providers__head--flex {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.providers__view-all {
  flex-shrink: 0;
}

/* Providers skeleton */
.providers__skeleton-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 0.85rem;
}

.providers__skeleton-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
}

.providers__skeleton-avatar {
  flex: 0 0 3rem;
  width: 3rem;
  height: 3rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  animation: categories-pulse 1.4s ease-in-out infinite;
}

.providers__skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.providers__skeleton-line {
  height: 0.75rem;
  width: 55%;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-surface-soft);
  animation: categories-pulse 1.4s ease-in-out infinite;
}

.providers__skeleton-line--wide {
  width: 80%;
  height: 0.9rem;
}

/* Providers error */
.providers__error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 1.2rem;
  border-radius: var(--dz-radius);
  background: var(--dz-danger-soft);
  border: 1px solid color-mix(in srgb, var(--dz-danger) 25%, var(--dz-border));
  color: var(--dz-danger);
  font-size: 0.88rem;
  font-weight: 600;
  flex-wrap: wrap;
}

.providers__retry {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  margin-inline-start: auto;
  border: 1px solid color-mix(in srgb, var(--dz-danger) 40%, var(--dz-border));
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  color: var(--dz-danger);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.providers__retry:hover {
  background: var(--dz-danger);
  color: var(--dz-white);
}

/* Providers Badge & Top Section */
.providers__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.76rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.providers--top {
  padding-top: 3.5rem;
  background: var(--dz-paper);
}

.providers--all {
  padding-top: 3.5rem;
  padding-bottom: 3.5rem;
  background: var(--dz-paper);
}

/* =========================================================================
   Paginated Catalog Section
   ========================================================================= */
.catalog-section {
  padding: 4rem 0 5rem;
  background: var(--dz-paper);
  border-top: 1px solid var(--dz-border);
}

.catalog-section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.catalog-section__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-size: 0.76rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.catalog-section__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.catalog-section__subtitle {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.catalog-section__count {
  flex-shrink: 0;
  padding: 0.4rem 1rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.catalog-section__filters {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.catalog-search {
  flex: 1 1 280px;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  padding: 0.45rem 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.catalog-search:focus-within {
  border-color: var(--dz-primary);
  box-shadow: var(--dz-ring);
}

.catalog-search__icon {
  display: flex;
  align-items: center;
  color: var(--dz-muted);
  margin-inline-end: 0.5rem;
  flex-shrink: 0;
}

.catalog-search__input {
  width: 100%;
  border: none;
  background: none;
  font-size: 0.9rem;
  color: var(--dz-ink);
  outline: none;
}

.catalog-search__input::placeholder {
  color: var(--dz-muted);
}

.catalog-search__clear {
  border: none;
  background: none;
  color: var(--dz-muted);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
}

.catalog-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-full);
  padding: 0.45rem 1rem;
  min-width: 200px;
  transition: border-color 0.2s;
}

.catalog-select-wrap:focus-within {
  border-color: var(--dz-primary);
}

.catalog-select-icon {
  display: flex;
  align-items: center;
  color: var(--dz-primary);
  margin-inline-end: 0.5rem;
  flex-shrink: 0;
}

.catalog-select {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dz-ink);
  outline: none;
  cursor: pointer;
}

.catalog-clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-primary-strong);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.catalog-clear-btn:hover {
  border-color: var(--dz-primary);
  background: var(--dz-primary-soft);
}

.catalog-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.catalog-section__view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-primary-strong);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    transform 0.15s;
}

.catalog-section__view-all:hover {
  background: var(--dz-primary-soft);
  border-color: var(--dz-primary);
  transform: translateY(-1px);
}

.catalog-section__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--dz-border);
}

.catalog-section__footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 2rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-primary);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--dz-primary) 30%, transparent);
  transition:
    background-color 0.2s,
    transform 0.15s,
    box-shadow 0.2s;
}

.catalog-section__footer-btn:hover {
  background: var(--dz-primary-strong);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--dz-primary) 40%, transparent);
}

html[dir='rtl'] .catalog-section__view-all svg,
html[dir='rtl'] .catalog-section__footer-btn svg {
  transform: scaleX(-1);
}

/* â”€â”€ Tablet Breakpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
@media (max-width: 900px) {
  .categories__grid,
  .featured__grid,
  .catalog-section__grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }

  .providers__skeleton-row {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }
}

/* â”€â”€ Mobile Breakpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
@media (max-width: 600px) {
  .categories__head,
  .catalog-section__head,
  .featured__head--flex,
  .providers__head--flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .categories__all,
  .catalog-section__view-all,
  .featured__toggle-btn,
  .providers__view-all {
    align-self: flex-start;
  }

  .categories {
    padding: 2.5rem 0;
  }

  .featured {
    padding: 2.5rem 0 0;
  }

  .featured--popular {
    padding-top: 2.5rem;
  }

  .featured--flash {
    padding-top: 2.25rem;
  }

  .providers {
    padding: 1.5rem 0 2.5rem;
  }

  .catalog-section {
    padding: 2.5rem 0 3.5rem;
  }

  .categories__grid,
  .featured__grid,
  .catalog-section__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .providers__skeleton-row {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }

  .catalog-section__footer {
    margin-top: 2rem;
    padding-top: 1.5rem;
  }

  .catalog-section__footer-btn {
    width: 100%;
    justify-content: center;
  }
}

/* â”€â”€ Extra-Small Mobile Breakpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
@media (max-width: 360px) {
  .categories__grid,
  .featured__grid,
  .catalog-section__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .categories__skeleton-media,
  .categories__skeleton-line,
  .categories__all svg:last-child,
  .providers__skeleton-avatar,
  .providers__skeleton-line {
    animation: none;
    transition: none;
  }
}
</style>
