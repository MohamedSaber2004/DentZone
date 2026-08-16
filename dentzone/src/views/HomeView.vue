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
import MarqueeRow from '../components/store/MarqueeRow.vue'
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
            <AppIcon name="sparkles" :size="14" />
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
            <AppIcon name="tooth" :size="96" class="hero__card-icon" />
          </div>
          <div class="hero__chip hero__chip--1">
            <AppIcon name="truck" :size="16" />
            {{ t('home.freeShipping') }}
          </div>
          <div class="hero__chip hero__chip--2">
            <span class="hero__chip-stars">★★★★★</span>
            4.9 · 12k
          </div>
          <div class="hero__chip hero__chip--3">
            <AppIcon name="shield-check" :size="16" />
            {{ t('home.guarantee') }}
          </div>
        </div>
      </div>
    </section>

    <section class="container page">
      <div class="value-props">
        <div v-for="prop in valueProps" :key="prop.title" class="value-prop">
          <span class="value-prop__icon">
            <AppIcon :name="prop.icon" :size="22" />
          </span>
          <div>
            <h3 class="value-prop__title">{{ prop.title }}</h3>
            <p class="value-prop__description">{{ prop.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="container page" style="padding-top: 0">
      <AdBanner
        :title="t('home.ad1Title')"
        :description="t('home.ad1Description')"
        :cta-label="t('home.ad1Cta')"
        cta-to="/catalog?category=cat-whitening"
        emoji="⚡"
      />
    </section>

    <section class="container page" style="padding-top: 0">
      <div class="home__dual">
        <div class="home__dual-col">
          <SectionHeader :title="t('home.shopByCategory')" :subtitle="t('home.categorySubtitle')">
            <template #action>
              <RouterLink to="/catalog" class="section-link">
                {{ t('home.viewAllProducts') }} <AppIcon name="arrow-right" :size="15" />
              </RouterLink>
            </template>
          </SectionHeader>

          <div v-if="isReady">
            <MarqueeRow :speed="30">
              <CategoryPill
                v-for="category in catalogService.categories.value"
                :key="category.id"
                :category="{ ...category, name: categoryName(category.id), description: categoryDescription(category.id) }"
                variant="card"
                class="home__marquee-item home__marquee-item--category"
                @select="selectCategory(category.id)"
              />
            </MarqueeRow>
          </div>
          <div v-else class="home__loading" role="status">
            <AppSpinner size="md" :label="t('home.loadingFeatured')" />
          </div>
        </div>

        <div class="home__dual-col">
          <SectionHeader :title="t('home.shopByVendor')" :subtitle="t('home.vendorSubtitle')">
            <template #action>
              <RouterLink to="/vendors" class="section-link">
                {{ t('home.viewAllVendors') }} <AppIcon name="arrow-right" :size="15" />
              </RouterLink>
            </template>
          </SectionHeader>

          <div v-if="isReady">
            <MarqueeRow :speed="38">
              <VendorCard
                v-for="vendor in catalogService.vendors.value.slice(0, 8)"
                :key="vendor.id"
                :vendor="vendor"
                class="home__marquee-item home__marquee-item--vendor"
              />
            </MarqueeRow>
          </div>
          <div v-else class="home__loading" role="status">
            <AppSpinner size="md" :label="t('home.loadingFeatured')" />
          </div>
        </div>
      </div>
    </section>

    <section class="container page" style="padding-top: 0">
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

    <section class="promo">
      <div class="container promo__inner">
        <div class="promo__icon" aria-hidden="true">
          <AppIcon name="truck" :size="34" />
        </div>
        <div class="promo__text">
          <h2 class="promo__title">{{ t('home.promoTitle', { amount: formattedThreshold }) }}</h2>
          <p class="promo__subtitle">{{ t('home.promoSubtitle') }}</p>
        </div>
        <RouterLink to="/catalog">
          <AppButton variant="secondary" size="lg">{{ t('home.startShopping') }}</AppButton>
        </RouterLink>
      </div>
    </section>

    <section class="container page" style="padding-top: 0">
      <AdBanner
        :title="t('home.ad2Title')"
        :description="t('home.ad2Description')"
        :cta-label="t('home.ad2Cta')"
        cta-to="/catalog"
        emoji="💥"
      />
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
.hero {
  position: relative;
  background:
    radial-gradient(58rem 30rem at 88% -12%, var(--dz-primary-soft) 0%, transparent 60%),
    radial-gradient(42rem 26rem at -6% 112%, var(--dz-accent-soft) 0%, transparent 55%),
    var(--dz-surface);
  border-bottom: 1px solid var(--dz-border);
  overflow: hidden;
}

.hero__inner {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding-top: 4.5rem;
  padding-bottom: 4.5rem;
}

.hero__content {
  flex: 1.1;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.95rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-white);
  border: 1px solid var(--dz-primary-soft);
  box-shadow: var(--dz-shadow-sm);
  color: var(--dz-primary-strong);
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.hero__title {
  font-size: 3rem;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.hero__title-accent {
  background: var(--dz-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__subtitle {
  margin-top: 1.1rem;
  max-width: 460px;
  color: var(--dz-ink-soft);
  font-size: 1.05rem;
}

.hero__actions {
  display: flex;
  gap: 0.9rem;
  margin-top: 1.9rem;
  flex-wrap: wrap;
}

.hero__stats {
  display: flex;
  gap: 2.25rem;
  margin-top: 2.5rem;
}

.hero__stat {
  position: relative;
}

.hero__stat + .hero__stat::before {
  content: '';
  position: absolute;
  left: -1.15rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 2.4rem;
  background: var(--dz-border);
}

.hero__stat-value {
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.hero__stat-label {
  font-size: 0.8rem;
  color: var(--dz-muted);
  font-weight: 500;
}

.hero__visual {
  position: relative;
  flex: 0.9;
  min-height: 380px;
}

.hero__card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 250px;
  height: 250px;
  border-radius: 3.5rem;
  background: var(--dz-gradient);
  box-shadow: var(--dz-shadow-lg), 0 24px 60px rgb(13 148 136 / 0.35);
}

.hero__card-icon {
  color: var(--dz-white);
}

.hero__chip {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: var(--dz-radius);
  background: var(--dz-white);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  animation: chip-float 5s ease-in-out infinite;
}

.hero__chip svg {
  color: var(--dz-primary);
}

.hero__chip--1 {
  top: 14%;
  left: 4%;
}

.hero__chip--2 {
  bottom: 16%;
  right: 2%;
  animation-delay: 1.2s;
}

.hero__chip--3 {
  bottom: 4%;
  left: 8%;
  animation-delay: 2.2s;
}

.hero__chip-stars {
  color: var(--dz-star);
  font-size: 0.75rem;
  letter-spacing: 1px;
}

@keyframes chip-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.value-props {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.value-prop {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1.25rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}

.value-prop:hover {
  transform: translateY(-3px);
  box-shadow: var(--dz-shadow);
  border-color: var(--dz-primary-soft);
}

.value-prop__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.value-prop__title {
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.value-prop__description {
  font-size: 0.8rem;
  color: var(--dz-muted);
  line-height: 1.45;
}

.home__dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.home__dual-col {
  min-width: 0;
}

.home__dual-col :deep(.section-header) {
  margin-bottom: 1.1rem;
}

.home__marquee-item {
  flex-shrink: 0;
}

.home__marquee-item--category {
  width: 210px;
}

.home__marquee-item--vendor {
  width: 260px;
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

.home__loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.promo {
  background: var(--dz-gradient);
}

.promo__inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2.5rem var(--dz-gutter);
}

.promo__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-lg);
  background: rgb(255 255 255 / 0.18);
  color: var(--dz-white);
}

.promo__text {
  flex: 1;
}

.promo__title {
  color: var(--dz-white);
  font-size: 1.5rem;
}

.promo__subtitle {
  color: rgb(255 255 255 / 0.85);
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

@media (max-width: 1000px) {
  .value-props {
    grid-template-columns: repeat(2, 1fr);
  }

  .home__dual {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

@media (max-width: 800px) {
  .hero__inner {
    flex-direction: column;
    padding-top: 3rem;
    padding-bottom: 3rem;
  }

  .hero__title {
    font-size: 2.4rem;
  }

  .hero__visual {
    min-height: 300px;
    width: 100%;
  }

  .hero__card {
    width: 190px;
    height: 190px;
    border-radius: 2.6rem;
  }

  .hero__stats {
    gap: 1.5rem;
  }

  .hero__stat + .hero__stat::before {
    left: -0.8rem;
  }

  .promo__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .value-props {
    grid-template-columns: 1fr;
  }

  .hero__stats {
    flex-wrap: wrap;
    gap: 1rem 1.5rem;
  }

  .hero__stat + .hero__stat::before {
    display: none;
  }

  .hero__chip--1 {
    left: 0;
  }

  .hero__chip--2 {
    right: 0;
  }
}
</style>