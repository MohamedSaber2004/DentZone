<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { t, locale } from '../i18n'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import CategoryCard from '../components/categories/CategoryCard.vue'
import type { CategoryDto } from '../domain/models/category'

const router = useRouter()
const authService = services.authService
const categoryRepository = services.categoryRepository

const isAuthenticated = computed(() => authService.isAuthenticated)

const CATEGORIES_LIMIT = 10

const categories = ref<CategoryDto[]>([])
const categoriesLoading = ref(true)
const categoriesError = ref(false)

const go = () => {
  void router.push(isAuthenticated.value ? { name: 'profile' } : { name: 'login' })
}

const loadCategories = async () => {
  categoriesLoading.value = true
  categoriesError.value = false
  try {
    const all = await categoryRepository.getCategories(locale.value === 'ar' ? 1 : 0)
    categories.value = all.slice(0, CATEGORIES_LIMIT)
  } catch {
    categoriesError.value = true
  } finally {
    categoriesLoading.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="home">
    <div class="hero">
    <div class="hero__glow hero__glow--one" aria-hidden="true" />
    <div class="hero__glow hero__glow--two" aria-hidden="true" />

    <section class="container hero__inner">
      <div class="hero__copy">
        <span class="hero__badge">
          <AppIcon name="shield-check" :size="14" />
          {{ t('home.trustBadge') }}
        </span>

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

        <div class="hero__actions">
          <AppButton size="lg" variant="gold" @click="go">
            {{ isAuthenticated ? t('profile.title') : t('auth.login') }}
            <AppIcon name="arrow-right" :size="16" />
          </AppButton>
        </div>

        <div class="hero__stats">
          <div class="hero__stat">
            <strong>2,000+</strong>
            <span>{{ t('home.statCustomers') }}</span>
          </div>
          <div class="hero__stat">
            <strong>4.9<span class="hero__stat-star">★</span></strong>
            <span>{{ t('home.statRating') }}</span>
          </div>
          <div class="hero__stat">
            <strong>500+</strong>
            <span>{{ t('home.statProducts') }}</span>
          </div>
        </div>
      </div>

      <div class="hero__visual" aria-hidden="true">
        <svg class="hero__ring" viewBox="0 0 320 320">
          <circle class="hero__ring-base" cx="160" cy="160" r="150" />
          <circle class="hero__ring-dash" cx="160" cy="160" r="122" />
        </svg>

        <span class="hero__logo">
          <AppIcon name="tooth" :size="64" />
        </span>

        <span class="hero__orbit hero__orbit--one"><AppIcon name="brush" :size="20" /></span>
        <span class="hero__orbit hero__orbit--two"><AppIcon name="tube" :size="20" /></span>
        <span class="hero__orbit hero__orbit--three"><AppIcon name="droplet" :size="20" /></span>

        <span class="hero__wordmark">Dent<span>Zone</span></span>
      </div>
    </section>
  </div>

  <section v-if="categoriesLoading || categories.length > 0" class="categories" aria-label="Categories">
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

      <div v-if="categoriesLoading" class="categories__grid" aria-label="Loading">
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

      <div v-else class="categories__grid">
        <CategoryCard
          v-for="category in categories"
          :key="category.id"
          :category="category"
          :to="`/categories/${category.id}`"
        />
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
  padding: 5rem var(--dz-gutter) 5.5rem;
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

.hero__actions {
  margin-top: 0.4rem;
}

.hero__stats {
  display: flex;
  gap: 2.4rem;
  margin-top: 1.2rem;
  padding-top: 1.4rem;
  border-top: 1px solid rgb(255 255 255 / 0.14);
  animation: hero-fade-up 0.6s 0.25s ease both;
}

.hero__stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hero__stat strong {
  font-family: var(--dz-font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--dz-white);
  letter-spacing: -0.01em;
}

.hero__stat-star {
  color: var(--dz-gold);
  margin-inline-start: 0.2rem;
  font-size: 1rem;
}

.hero__stat span:not(.hero__stat-star) {
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.6);
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

.hero__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 7.5rem;
  height: 7.5rem;
  border-radius: var(--dz-radius-lg);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow:
    0 14px 34px rgb(0 0 0 / 0.35),
    inset 0 0 0 1px rgb(255 255 255 / 0.08);
  animation: hero-breathe 5s ease-in-out infinite;
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
    padding: 4rem var(--dz-gutter) 4rem;
  }
}

@media (max-width: 560px) {
  .hero__stats {
    gap: 1.6rem;
  }

  .hero__stat strong {
    font-size: 1.25rem;
  }

  .hero__visual {
    min-height: 240px;
  }

  .hero__logo {
    width: 6rem;
    height: 6rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__copy,
  .hero__visual,
  .hero__stats {
    animation: none;
  }

  .hero__ring,
  .hero__logo {
    animation: none;
  }
}

.categories {
  padding: 4rem var(--dz-gutter);
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
  height: 9rem;
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

@media (max-width: 560px) {
  .categories__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .categories {
    padding: 3rem var(--dz-gutter);
  }
}

@media (prefers-reduced-motion: reduce) {
  .categories__skeleton-media,
  .categories__skeleton-line,
  .categories__all svg:last-child {
    animation: none;
    transition: none;
  }
}
</style>