<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogService } from '../application/catalog.service'
import { pricing } from '../data/mocks/catalog.data'
import { categoryName, categoryDescription, formatPrice, t } from '../i18n'
import SectionHeader from '../components/ui/SectionHeader.vue'
import CategoryPill from '../components/ui/CategoryPill.vue'
import ProductGrid from '../components/store/ProductGrid.vue'
import VendorCard from '../components/store/VendorCard.vue'
import AdBanner from '../components/store/AdBanner.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppSpinner from '../components/ui/AppSpinner.vue'
import AppIcon from '../components/ui/AppIcon.vue'

const router = useRouter()

const isReady = computed(() => catalogService.featuredProducts.value.length > 0)

onMounted(() => {
  void catalogService.init()
})

const selectCategory = (categoryId: string) => {
  void router.push({ path: '/vendors', query: { category: categoryId } })
}

const formattedThreshold = computed(() => formatPrice(pricing.freeShippingThreshold))

const valueProps = computed(() => [
  {
    icon: 'truck' as const,
    title: t('home.freeShipping'),
    description: t('home.freeShippingDesc', { amount: formatPrice(pricing.freeShippingThreshold) }),
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

const stats = computed(() => [
  { value: '40k+', label: t('home.statCustomers') },
  { value: '4.9/5', label: t('home.statRating') },
  { value: '300+', label: t('home.statProducts') },
])
</script>

<template>
  <div>
    <section class="hero">
      <div class="container hero__inner">
        <div class="hero__content">
          <span class="hero__eyebrow">
            <span class="hero__eyebrow-dot" aria-hidden="true" />
            {{ t('home.trustBadge') }}
          </span>
          <h1 class="hero__title">
            {{ t('home.titleLine1') }}
            <br />
            <span class="hero__title-accent">{{ t('home.titleAccent') }}</span>
          </h1>
          <p class="hero__subtitle">
            {{ t('home.subtitle', { amount: formattedThreshold }) }}
          </p>
          <div class="hero__actions">
            <RouterLink to="/catalog">
              <AppButton size="lg">
                {{ t('home.shopStore') }}
                <AppIcon name="arrow-right" :size="17" />
              </AppButton>
            </RouterLink>
            <RouterLink to="/catalog?category=cat-whitening">
              <AppButton variant="outline" size="lg">{{ t('home.whiteningKits') }}</AppButton>
            </RouterLink>
          </div>
          <dl class="hero__stats">
            <div v-for="stat in stats" :key="stat.label" class="hero__stat">
              <dt class="hero__stat-value">{{ stat.value }}</dt>
              <dd class="hero__stat-label">{{ stat.label }}</dd>
            </div>
          </dl>
        </div>

        <div class="hero__visual" aria-hidden="true">
          <div class="hero__card">
            <div class="hero__logo">
              <span class="hero__logo-tile">
                <AppIcon name="tooth" :size="46" />
              </span>
              <span class="hero__logo-wordmark">Dent<span>Zone</span></span>
              <span class="hero__logo-tagline">DENTAL EQUIPMENT · CLINIC SUPPLIES · TRUSTED SUPPLIERS</span>
            </div>
          </div>
        </div>
      </div>
    </section>

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
          :category="{ ...category, name: categoryName(category.id), description: categoryDescription(category.id) }"
          variant="card"
          @select="selectCategory(category.id)"
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

    <section class="container page home-section">
      <AdBanner
        :title="t('home.ad1Title')"
        :description="t('home.ad1Description')"
        :cta-label="t('home.ad1Cta')"
        cta-to="/catalog?category=cat-whitening"
        icon="sparkles"
      />
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

    <section class="container page">
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
  </div>
</template>

<style scoped>
.home-section {
  padding-top: 0;
}

.hero {
  position: relative;
  background:
    radial-gradient(52rem 26rem at 90% -10%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-surface);
  border-bottom: 1px solid var(--dz-border);
  overflow: hidden;
}

.hero__inner {
  display: flex;
  align-items: center;
  gap: 3.5rem;
  padding-top: 4.5rem;
  padding-bottom: 4.5rem;
}

.hero__content {
  flex: 1.05;
  min-width: 0;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dz-gold-strong);
  margin-bottom: 1.4rem;
}

.hero__eyebrow-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--dz-gold);
  flex-shrink: 0;
}

.hero__title {
  font-family: var(--dz-font-display);
  font-size: clamp(2.4rem, 4.6vw, 3.4rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
  font-weight: 600;
}

.hero__title-accent {
  color: var(--dz-gold-strong);
}

.hero__subtitle {
  margin-top: 1.15rem;
  max-width: 470px;
  color: var(--dz-ink-soft);
  font-size: 1.02rem;
  line-height: 1.65;
}

.hero__actions {
  display: flex;
  gap: 0.9rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.hero__stats {
  display: flex;
  gap: 2.25rem;
  margin-top: 2.75rem;
}

.hero__stat {
  position: relative;
}

.hero__stat + .hero__stat::before {
  content: '';
  position: absolute;
  inset-inline-start: -1.15rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 2.2rem;
  background: var(--dz-border);
}

.hero__stat-value {
  font-family: var(--dz-font-mono);
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.hero__stat-label {
  font-size: 0.78rem;
  color: var(--dz-muted);
  font-weight: 500;
}

.hero__visual {
  flex: 0.95;
  min-width: 0;
}

.hero__card {
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow);
  padding: 1.1rem;
}

.hero__logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.35rem;
  min-height: 330px;
  padding: 2rem;
  border-radius: var(--dz-radius);
  border: 1px solid var(--dz-border);
  background:
    radial-gradient(24rem 18rem at 50% -20%, var(--dz-primary-soft) 0%, transparent 62%),
    var(--dz-surface);
  text-align: center;
}

.hero__logo-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  height: 6rem;
  border-radius: var(--dz-radius-lg);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-primary);
}

.hero__logo-wordmark {
  font-family: var(--dz-font-display);
  font-size: clamp(2.2rem, 4.5vw, 2.9rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--dz-ink);
  line-height: 1;
}

.hero__logo-wordmark span {
  color: var(--dz-gold-strong);
}

.hero__logo-tagline {
  font-family: var(--dz-font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dz-muted);
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
  .hero__inner {
    flex-direction: column;
    padding-top: 3rem;
    padding-bottom: 3rem;
    gap: 2.5rem;
  }

  .hero__title {
    font-size: 2.4rem;
  }

  .hero__visual {
    width: 100%;
  }

  .hero__stats {
    gap: 1.5rem;
  }

  .hero__stat + .hero__stat::before {
    inset-inline-start: -0.8rem;
  }

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

  .hero__stats {
    flex-wrap: wrap;
    gap: 1rem 1.5rem;
  }

  .hero__stat + .hero__stat::before {
    display: none;
  }
}
</style>