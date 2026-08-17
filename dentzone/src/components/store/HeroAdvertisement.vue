<script setup lang="ts">
import { computed } from 'vue'
import type { Advertisement } from '../../domain/models/advertisement'
import { locale } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  advertisement: Advertisement
}>()

const theme = computed(() => props.advertisement.theme ?? 'dark')
const arrowIcon = computed<'arrow-left' | 'arrow-right'>(() => (locale.value === 'ar' ? 'arrow-left' : 'arrow-right'))
const imageSrc = computed(() => props.advertisement.mobileImage ?? props.advertisement.image)
</script>

<template>
  <section class="hero-ad" :class="`hero-ad--${theme}`">
    <div class="container hero-ad__inner">
      <div class="hero-ad__content">
        <span v-if="advertisement.eyebrow" class="hero-ad__eyebrow">
          <span class="hero-ad__eyebrow-dot" aria-hidden="true" />
          {{ advertisement.eyebrow }}
        </span>

        <h1 class="hero-ad__title">{{ advertisement.title }}</h1>

        <p v-if="advertisement.description" class="hero-ad__description">
          {{ advertisement.description }}
        </p>

        <div class="hero-ad__actions">
          <RouterLink
            v-if="advertisement.ctaLabel && advertisement.ctaTo"
            :to="advertisement.ctaTo"
            class="hero-ad__cta"
          >
            {{ advertisement.ctaLabel }}
            <AppIcon :name="arrowIcon" :size="16" />
          </RouterLink>
        </div>

        <div class="hero-ad__brand" aria-hidden="true">
          <span class="hero-ad__brand-logo">
            <AppIcon name="tooth" :size="17" />
          </span>
          <span class="hero-ad__brand-wordmark">Dent<span>Zone</span></span>
          <span class="hero-ad__brand-tagline">DENTAL EQUIPMENT · CLINIC SUPPLIES · TRUSTED SUPPLIERS</span>
        </div>
      </div>

      <div class="hero-ad__visual" aria-hidden="true">
        <div class="hero-ad__card">
          <img class="hero-ad__img" :src="imageSrc" :alt="advertisement.title" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-ad {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--dz-border);
}

.hero-ad::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-ad--dark {
  background:
    radial-gradient(56rem 30rem at 88% -12%, rgb(184 134 43 / 0.28) 0%, transparent 58%),
    var(--dz-band);
  border-bottom-color: color-mix(in srgb, var(--dz-band) 80%, var(--dz-border));
}

html[dir='rtl'] .hero-ad--dark {
  background:
    radial-gradient(56rem 30rem at 12% -12%, rgb(184 134 43 / 0.28) 0%, transparent 58%),
    var(--dz-band);
}

.hero-ad--gold {
  background:
    radial-gradient(48rem 26rem at 90% -20%, var(--dz-gold-faint) 0%, transparent 60%),
    linear-gradient(120deg, var(--dz-gold-faint) 0%, var(--dz-surface) 60%);
}

html[dir='rtl'] .hero-ad--gold {
  background:
    radial-gradient(48rem 26rem at 10% -20%, var(--dz-gold-faint) 0%, transparent 60%),
    linear-gradient(120deg, var(--dz-surface) 40%, var(--dz-gold-faint) 100%);
}

.hero-ad--light {
  background:
    radial-gradient(48rem 26rem at 90% -20%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-surface);
}

html[dir='rtl'] .hero-ad--light {
  background:
    radial-gradient(48rem 26rem at 10% -20%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-surface);
}

.hero-ad__inner {
  display: flex;
  align-items: center;
  gap: 3.5rem;
  padding-top: 4.25rem;
  padding-bottom: 4.25rem;
}

.hero-ad__content {
  flex: 1.1;
  min-width: 0;
}

.hero-ad__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 1.3rem;
}

.hero-ad--dark .hero-ad__eyebrow {
  color: var(--dz-gold);
}

.hero-ad--gold .hero-ad__eyebrow {
  color: var(--dz-gold-strong);
}

.hero-ad--light .hero-ad__eyebrow {
  color: var(--dz-primary-strong);
}

.hero-ad__eyebrow-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--dz-gold);
  flex-shrink: 0;
}

.hero-ad__title {
  font-family: var(--dz-font-display);
  font-size: clamp(2.1rem, 4.2vw, 3.1rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-weight: 600;
  max-width: 560px;
}

.hero-ad--dark .hero-ad__title {
  color: var(--dz-white);
}

.hero-ad__description {
  margin-top: 1.1rem;
  max-width: 470px;
  font-size: 1rem;
  line-height: 1.65;
}

.hero-ad--dark .hero-ad__description {
  color: rgb(255 255 255 / 0.72);
}

.hero-ad--gold .hero-ad__description,
.hero-ad--light .hero-ad__description {
  color: var(--dz-ink-soft);
}

.hero-ad__actions {
  display: flex;
  gap: 0.9rem;
  margin-top: 1.9rem;
  flex-wrap: wrap;
}

.hero-ad__cta {
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
    box-shadow 0.2s;
}

.hero-ad--dark .hero-ad__cta {
  background: var(--dz-gold);
  color: var(--dz-on-gold);
  box-shadow: 0 8px 20px rgb(184 134 43 / 0.35);
}

.hero-ad--dark .hero-ad__cta:hover {
  background: var(--dz-gold-strong);
  transform: translateY(-1px);
}

.hero-ad--gold .hero-ad__cta,
.hero-ad--light .hero-ad__cta {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-primary);
}

.hero-ad--gold .hero-ad__cta:hover,
.hero-ad--light .hero-ad__cta:hover {
  background: var(--dz-primary-strong);
  transform: translateY(-1px);
}

.hero-ad__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 2.6rem;
  flex-wrap: wrap;
}

.hero-ad__brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-gold);
  color: var(--dz-on-gold);
}

.hero-ad__brand-wordmark {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hero-ad--dark .hero-ad__brand-wordmark {
  color: var(--dz-white);
}

.hero-ad--dark .hero-ad__brand-wordmark span,
.hero-ad--gold .hero-ad__brand-wordmark span {
  color: var(--dz-gold-strong);
}

.hero-ad--light .hero-ad__brand-wordmark {
  color: var(--dz-ink);
}

.hero-ad--light .hero-ad__brand-wordmark span {
  color: var(--dz-gold-strong);
}

.hero-ad__brand-tagline {
  font-family: var(--dz-font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-ad--dark .hero-ad__brand-tagline {
  color: rgb(255 255 255 / 0.45);
}

.hero-ad--gold .hero-ad__brand-tagline,
.hero-ad--light .hero-ad__brand-tagline {
  color: var(--dz-muted);
}

.hero-ad__visual {
  flex: 0.9;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.hero-ad__card {
  position: relative;
  width: min(100%, 380px);
  aspect-ratio: 1 / 1;
  border-radius: var(--dz-radius-lg);
  border: 1px solid var(--dz-border-strong);
  background: var(--dz-surface);
  box-shadow: var(--dz-shadow-lg);
  padding: 1rem;
  transform: rotate(1.5deg);
}

.hero-ad--dark .hero-ad__card {
  border-color: rgb(255 255 255 / 0.14);
}

.hero-ad--dark .hero-ad__card::before {
  content: '';
  position: absolute;
  inset: -1.5rem -1.5rem auto auto;
  width: 5.5rem;
  height: 5.5rem;
  border: 1px dashed rgb(184 134 43 / 0.55);
  border-radius: var(--dz-radius-lg);
}

html[dir='rtl'] .hero-ad__card::before {
  inset: -1.5rem auto auto -1.5rem;
}

.hero-ad__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: var(--dz-radius);
}

@media (max-width: 800px) {
  .hero-ad__inner {
    flex-direction: column;
    padding-top: 3rem;
    padding-bottom: 3rem;
    gap: 2.5rem;
  }

  .hero-ad__title {
    font-size: 2.1rem;
  }

  .hero-ad__card {
    width: min(100%, 300px);
  }
}

@media (max-width: 560px) {
  .hero-ad__card {
    transform: none;
  }
}
</style>