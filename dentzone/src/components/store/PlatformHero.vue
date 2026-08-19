<script setup lang="ts">
import { computed } from 'vue'
import { locale, t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

const arrowIcon = computed<'arrow-left' | 'arrow-right'>(() => (locale.value === 'ar' ? 'arrow-left' : 'arrow-right'))

const stats = computed(() => [
  { value: '2,000+', label: t('home.statCustomers') },
  { value: '4.9/5', label: t('home.statRating') },
  { value: '15,000+', label: t('home.statProducts') },
])
</script>

<template>
  <section class="platform-hero">
    <div class="container platform-hero__inner">
      <div class="platform-hero__content">
        <span class="platform-hero__eyebrow">
          <span class="platform-hero__eyebrow-dot" aria-hidden="true" />
          {{ t('home.eyebrow') }}
        </span>

        <h1 class="platform-hero__title">
          {{ t('home.titleLine1') }}
          <span class="platform-hero__title-accent">{{ t('home.titleAccent') }}</span>
        </h1>

        <p class="platform-hero__description">{{ t('home.subtitle') }}</p>

        <div class="platform-hero__actions">
          <RouterLink to="/catalog" class="platform-hero__cta platform-hero__cta--primary">
            {{ t('home.shopStore') }}
            <AppIcon :name="arrowIcon" :size="16" />
          </RouterLink>
          <RouterLink to="/catalog" class="platform-hero__cta platform-hero__cta--ghost">
            {{ t('home.whiteningKits') }}
            <AppIcon :name="arrowIcon" :size="16" />
          </RouterLink>
        </div>

        <div class="platform-hero__stats">
          <div v-for="stat in stats" :key="stat.label" class="platform-hero__stat">
            <strong class="platform-hero__stat-value">{{ stat.value }}</strong>
            <span class="platform-hero__stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="platform-hero__visual" aria-hidden="true">
        <div class="platform-hero__card">
          <span class="platform-hero__card-tile">
            <AppIcon name="tooth" :size="46" />
          </span>
          <p class="platform-hero__card-wordmark">Dent<span>Zone</span></p>
          <p class="platform-hero__card-tagline">{{ t('home.heroTagline') }}</p>

          <span class="platform-hero__chip platform-hero__chip--a">
            <AppIcon name="brush" :size="15" />
            {{ t('home.chipTools') }}
          </span>
          <span class="platform-hero__chip platform-hero__chip--b">
            <AppIcon name="shield-check" :size="15" />
            {{ t('home.chipSuppliers') }}
          </span>
          <span class="platform-hero__chip platform-hero__chip--c">
            <AppIcon name="truck" :size="15" />
            {{ t('home.chipDelivery') }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.platform-hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(56rem 30rem at 88% -12%, rgb(184 134 43 / 0.28) 0%, transparent 58%),
    var(--dz-band);
  border-bottom: 1px solid color-mix(in srgb, var(--dz-band) 80%, var(--dz-border));
}

html[dir='rtl'] .platform-hero {
  background:
    radial-gradient(56rem 30rem at 12% -12%, rgb(184 134 43 / 0.28) 0%, transparent 58%),
    var(--dz-band);
}

.platform-hero__inner {
  display: flex;
  align-items: center;
  gap: 3.5rem;
  padding-top: 4.25rem;
  padding-bottom: 4.25rem;
}

.platform-hero__content {
  flex: 1.1;
  min-width: 0;
}

.platform-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dz-gold);
  margin-bottom: 1.3rem;
}

html[dir='rtl'] .platform-hero__eyebrow {
  letter-spacing: 0;
}

.platform-hero__eyebrow-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--dz-gold);
  flex-shrink: 0;
}

.platform-hero__title {
  font-family: var(--dz-font-display);
  font-size: clamp(2.1rem, 4.2vw, 3.1rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-weight: 600;
  max-width: 600px;
  color: var(--dz-white);
}

.platform-hero__title-accent {
  color: var(--dz-gold);
}

.platform-hero__description {
  margin-top: 1.1rem;
  max-width: 500px;
  font-size: 1rem;
  line-height: 1.65;
  color: rgb(255 255 255 / 0.72);
}

.platform-hero__actions {
  display: flex;
  gap: 0.9rem;
  margin-top: 1.9rem;
  flex-wrap: wrap;
}

.platform-hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 1.7rem;
  border-radius: var(--dz-radius);
  font-size: 0.95rem;
  font-weight: 600;
  transition:
    transform 0.15s,
    background-color 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}

.platform-hero__cta--primary {
  background: var(--dz-gold);
  color: var(--dz-on-gold);
  box-shadow: 0 8px 20px rgb(184 134 43 / 0.35);
}

.platform-hero__cta--primary:hover {
  background: var(--dz-gold-strong);
  transform: translateY(-1px);
}

.platform-hero__cta--ghost {
  background: rgb(255 255 255 / 0.06);
  color: var(--dz-white);
  border: 1px solid rgb(255 255 255 / 0.18);
}

.platform-hero__cta--ghost:hover {
  background: rgb(255 255 255 / 0.12);
  border-color: rgb(255 255 255 / 0.32);
  transform: translateY(-1px);
}

.platform-hero__stats {
  display: flex;
  gap: 2.25rem;
  margin-top: 2.4rem;
  flex-wrap: wrap;
}

.platform-hero__stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.platform-hero__stat + .platform-hero__stat {
  padding-inline-start: 2.25rem;
  border-inline-start: 1px solid rgb(255 255 255 / 0.14);
}

.platform-hero__stat-value {
  font-family: var(--dz-font-display);
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--dz-white);
}

.platform-hero__stat-label {
  font-size: 0.78rem;
  color: rgb(255 255 255 / 0.55);
}

.platform-hero__visual {
  flex: 0.9;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.platform-hero__card {
  position: relative;
  width: min(100%, 380px);
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  border-radius: var(--dz-radius-lg);
  border: 1px solid rgb(255 255 255 / 0.14);
  background: rgb(255 255 255 / 0.05);
  box-shadow: var(--dz-shadow-lg);
  backdrop-filter: blur(4px);
  padding: 1rem;
  transform: rotate(1.5deg);
}

.platform-hero__card::before {
  content: '';
  position: absolute;
  inset: -1.5rem -1.5rem auto auto;
  width: 5.5rem;
  height: 5.5rem;
  border: 1px dashed rgb(184 134 43 / 0.55);
  border-radius: var(--dz-radius-lg);
}

html[dir='rtl'] .platform-hero__card::before {
  inset: -1.5rem auto auto -1.5rem;
}

.platform-hero__card-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: var(--dz-radius-lg);
  background: var(--dz-gold);
  color: var(--dz-on-gold);
  box-shadow: 0 12px 28px rgb(184 134 43 / 0.4);
}

.platform-hero__card-wordmark {
  font-family: var(--dz-font-display);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-white);
}

.platform-hero__card-wordmark span {
  color: var(--dz-gold);
}

.platform-hero__card-tagline {
  font-family: var(--dz-font-mono);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.5);
  text-align: center;
}

html[dir='rtl'] .platform-hero__card-tagline {
  letter-spacing: 0;
}

.platform-hero__chip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border-strong);
  box-shadow: var(--dz-shadow);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  white-space: nowrap;
}

.platform-hero__chip svg {
  color: var(--dz-gold-strong);
  flex-shrink: 0;
}

.platform-hero__chip--a {
  top: 1.4rem;
  inset-inline-start: -1.4rem;
}

.platform-hero__chip--b {
  bottom: 2.4rem;
  inset-inline-start: -2.4rem;
}

.platform-hero__chip--c {
  top: 2.2rem;
  inset-inline-end: -1.9rem;
}

@media (max-width: 800px) {
  .platform-hero__inner {
    flex-direction: column;
    padding-top: 3rem;
    padding-bottom: 3rem;
    gap: 2.5rem;
  }

  .platform-hero__title {
    font-size: 2.1rem;
  }

  .platform-hero__card {
    width: min(100%, 300px);
  }

  .platform-hero__chip--a {
    inset-inline-start: -0.4rem;
  }

  .platform-hero__chip--b {
    inset-inline-start: -1.4rem;
  }

  .platform-hero__chip--c {
    inset-inline-end: -0.9rem;
  }
}

@media (max-width: 560px) {
  .platform-hero__stats {
    gap: 1.5rem;
  }

  .platform-hero__stat + .platform-hero__stat {
    padding-inline-start: 1.5rem;
  }

  .platform-hero__card {
    transform: none;
  }
}
</style>
