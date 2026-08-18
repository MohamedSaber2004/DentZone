<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogService } from '../application/catalog.service'
import { advertisementService } from '../application/advertisement.service'
import { cartService } from '../application/cart.service'
import { formatPrice, t } from '../i18n'
import SectionHeader from '../components/ui/SectionHeader.vue'
import CategoryPill from '../components/ui/CategoryPill.vue'
import ProductGrid from '../components/store/ProductGrid.vue'
import VendorCard from '../components/store/VendorCard.vue'
import HeroAdvertisement from '../components/store/HeroAdvertisement.vue'
import PromotionalGrid from '../components/store/PromotionalGrid.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppSpinner from '../components/ui/AppSpinner.vue'
import AppIcon from '../components/ui/AppIcon.vue'

const router = useRouter()

const isReady = computed(() => catalogService.featuredProducts.value.length > 0)

const heroAd = computed(() => advertisementService.hero.value)
const secondaryAds = computed(() => advertisementService.secondary.value)

onMounted(() => {
  void (async () => {
    await catalogService.init()
    if (cartService.itemCount.value > 0) {
      cartService.hydrate(await catalogService.getAllProducts())
    }
    void advertisementService.load()
  })()
})

const selectCategory = (categorySlug: string) => {
  void router.push({ path: '/vendors', query: { category: categorySlug } })
}

const formattedThreshold = computed(() => formatPrice(catalogService.settings.value.freeShippingThreshold))

const valueProps = computed(() => [
  {
    icon: 'truck' as const,
    title: t('home.freeShipping'),
    description: t('home.freeShippingDesc', { amount: formatPrice(catalogService.settings.value.freeShippingThreshold) }),
  },
  {
    icon: 'shield-check' as const,
    title: t('home.guarantee'),
    description: t('home.guaranteeDesc'),
  },
  {
    icon: 'smile' as const,
    title: t('home.dentistApproved'),
    description: t('home.dentistApprovedDesc'),
  },
  {
    icon: 'refresh' as const,
    title: t('home.easyReturns'),
    description: t('home.easyReturnsDesc'),
  },
])
</script>

<template>
  <div>
    <HeroAdvertisement v-if="heroAd" :advertisement="heroAd" />

    <section class="container page">
      <div class="value-props">
        <div v-for="prop in valueProps" :key="prop.title" class="value-prop">
          <span class="value-prop__icon">
            <AppIcon :name="prop.icon" :size="20" />
          </span>
          <div>
            <h3 class="value-prop__title">{{ prop.title }}</h3>
            <p class="value-prop__description">{{ prop.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="container page home-section">
      <SectionHeader :title="t('home.shopByCategory')" :subtitle="t('home.categorySubtitle')">
        <template #action>
          <RouterLink to="/catalog" class="section-link">
            {{ t('home.viewAllProducts') }} <AppIcon name="arrow-right" :size="15" />
          </RouterLink>
        </template>
      </SectionHeader>

      <div v-if="isReady" class="home__categories">
        <CategoryPill
          v-for="category in catalogService.categories.value"
          :key="category.id"
          :category="category"
          variant="card"
          @select="selectCategory(category.slug)"
        />
      </div>
      <div v-else class="home__loading" role="status">
        <AppSpinner size="md" :label="t('home.loadingFeatured')" />
      </div>
    </section>

    <section class="container page home-section">
      <SectionHeader :title="t('home.featuredTitle')" :subtitle="t('home.featuredSubtitle')">
        <template #action>
          <RouterLink to="/catalog" class="section-link">
            {{ t('home.browseAll') }} <AppIcon name="arrow-right" :size="15" />
          </RouterLink>
        </template>
      </SectionHeader>
      <div v-if="isReady" class="home__grid">
        <ProductGrid :products="catalogService.featuredProducts.value" />
      </div>
      <div v-else class="home__loading" role="status">
        <AppSpinner size="lg" :label="t('home.loadingFeatured')" />
      </div>
    </section>

    <section v-if="secondaryAds.length" class="container page home-section">
      <PromotionalGrid :advertisements="secondaryAds" />
    </section>

    <section class="container page home-section">
      <SectionHeader :title="t('home.bestsellersTitle')" :subtitle="t('home.bestsellersSubtitle')">
        <template #action>
          <RouterLink to="/catalog" class="section-link">
            {{ t('home.seeAll') }} <AppIcon name="arrow-right" :size="15" />
          </RouterLink>
        </template>
      </SectionHeader>
      <div v-if="isReady" class="home__grid">
        <ProductGrid :products="catalogService.bestsellers.value" />
      </div>
      <div v-else class="home__loading" role="status">
        <AppSpinner size="lg" :label="t('home.loadingBestsellers')" />
      </div>
    </section>

    <section class="container page home-section">
      <SectionHeader :title="t('home.shopByVendor')" :subtitle="t('home.vendorSubtitle')">
        <template #action>
          <RouterLink to="/vendors" class="section-link">
            {{ t('home.viewAllVendors') }} <AppIcon name="arrow-right" :size="15" />
          </RouterLink>
        </template>
      </SectionHeader>

      <div v-if="isReady" class="home__vendors">
        <VendorCard
          v-for="vendor in catalogService.vendors.value.slice(0, 8)"
          :key="vendor.id"
          :vendor="vendor"
        />
      </div>
      <div v-else class="home__loading" role="status">
        <AppSpinner size="md" :label="t('home.loadingFeatured')" />
      </div>
    </section>

    <section class="promo">
      <div class="container promo__inner">
        <div class="promo__icon" aria-hidden="true">
          <AppIcon name="truck" :size="30" />
        </div>
        <div class="promo__text">
          <h2 class="promo__title">
            <span class="promo__title-main">{{ t('home.promoTitle', { amount: formattedThreshold }) }}</span>
          </h2>
          <p class="promo__subtitle">{{ t('home.promoSubtitle') }}</p>
        </div>
        <RouterLink to="/catalog">
          <AppButton variant="gold" size="lg">{{ t('home.startShopping') }}</AppButton>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-section {
  padding-top: 0;
}

.value-props {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
  overflow: hidden;
}

.value-prop {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1.4rem 1.35rem;
}

.value-prop + .value-prop {
  border-inline-start: 1px solid var(--dz-border);
}

.value-prop__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-soft);
  color: var(--dz-primary);
}

.value-prop__title {
  font-family: var(--dz-font-display);
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.value-prop__description {
  font-size: 0.8rem;
  color: var(--dz-muted);
  line-height: 1.5;
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
  white-space: nowrap;
}

.section-link:hover {
  text-decoration: underline;
}

.home__categories {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.1rem;
}

.home__vendors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.1rem;
}

.home__loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.promo {
  background: var(--dz-band);
}

.promo__inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2.75rem var(--dz-gutter);
}

.promo__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.25rem;
  height: 4.25rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-lg);
  background: rgb(255 255 255 / 0.1);
  border: 1px solid rgb(255 255 255 / 0.16);
  color: var(--dz-gold);
}

.promo__text {
  flex: 1;
}

.promo__title {
  color: var(--dz-white);
  font-size: 1.5rem;
  font-weight: 600;
}

.promo__subtitle {
  color: rgb(255 255 255 / 0.7);
  font-size: 0.95rem;
  margin-top: 0.3rem;
}

@media (max-width: 1000px) {
  .value-props {
    grid-template-columns: repeat(2, 1fr);
  }

  .value-prop:nth-child(3) {
    border-inline-start: none;
  }

  .value-prop:nth-child(n + 3) {
    border-top: 1px solid var(--dz-border);
  }

  .home__vendors {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 800px) {
  .home__categories {
    grid-template-columns: repeat(2, 1fr);
  }

  .promo__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 560px) {
  .value-props {
    grid-template-columns: 1fr;
  }

  .value-prop + .value-prop {
    border-inline-start: none;
    border-top: 1px solid var(--dz-border);
  }

  .value-prop:nth-child(n + 3) {
    border-top: none;
  }

  .home__categories {
    grid-template-columns: 1fr;
  }

  .home__vendors {
    grid-template-columns: 1fr;
  }
}
</style>