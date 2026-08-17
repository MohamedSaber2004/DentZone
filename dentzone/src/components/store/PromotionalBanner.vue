<script setup lang="ts">
import { computed } from 'vue'
import type { Advertisement } from '../../domain/models/advertisement'
import { locale } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  advertisement: Advertisement
}>()

const theme = computed(() => props.advertisement.theme ?? 'gold')
const arrowIcon = computed<'arrow-left' | 'arrow-right'>(() => (locale.value === 'ar' ? 'arrow-left' : 'arrow-right'))
const imageSrc = computed(() => props.advertisement.mobileImage ?? props.advertisement.image)
</script>

<template>
  <aside class="promo-banner" :class="`promo-banner--${theme}`">
    <div class="promo-banner__media">
      <img class="promo-banner__img" :src="imageSrc" :alt="advertisement.title" loading="lazy" decoding="async" />
    </div>

    <div class="promo-banner__body">
      <span v-if="advertisement.eyebrow" class="promo-banner__eyebrow">{{ advertisement.eyebrow }}</span>
      <h3 class="promo-banner__title">{{ advertisement.title }}</h3>
      <p v-if="advertisement.description" class="promo-banner__description">
        {{ advertisement.description }}
      </p>
      <RouterLink
        v-if="advertisement.ctaLabel && advertisement.ctaTo"
        :to="advertisement.ctaTo"
        class="promo-banner__cta"
      >
        {{ advertisement.ctaLabel }}
        <AppIcon :name="arrowIcon" :size="14" />
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
.promo-banner {
  position: relative;
  display: flex;
  gap: 1.25rem;
  padding: 1.4rem;
  border-radius: var(--dz-radius-lg);
  border: 1px solid var(--dz-border);
  overflow: hidden;
  height: 100%;
}

.promo-banner--gold {
  background:
    radial-gradient(30rem 18rem at 110% -30%, var(--dz-gold-faint) 0%, transparent 60%),
    var(--dz-surface);
}

.promo-banner--light {
  background:
    radial-gradient(30rem 18rem at 110% -30%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-surface);
}

html[dir='rtl'] .promo-banner--gold {
  background:
    radial-gradient(30rem 18rem at -10% -30%, var(--dz-gold-faint) 0%, transparent 60%),
    var(--dz-surface);
}

html[dir='rtl'] .promo-banner--light {
  background:
    radial-gradient(30rem 18rem at -10% -30%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-surface);
}

.promo-banner__media {
  width: 7.5rem;
  height: 7.5rem;
  flex-shrink: 0;
  align-self: center;
  border-radius: var(--dz-radius);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  box-shadow: var(--dz-shadow-sm);
  overflow: hidden;
}

.promo-banner__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.promo-banner:hover .promo-banner__img {
  transform: scale(1.06);
}

.promo-banner__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  min-width: 0;
}

.promo-banner__eyebrow {
  font-family: var(--dz-font-mono);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.promo-banner--gold .promo-banner__eyebrow {
  color: var(--dz-gold-strong);
}

.promo-banner--light .promo-banner__eyebrow {
  color: var(--dz-primary-strong);
}

.promo-banner__title {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.promo-banner__description {
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--dz-ink-soft);
}

.promo-banner__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.promo-banner--gold .promo-banner__cta {
  color: var(--dz-gold-strong);
}

.promo-banner--light .promo-banner__cta {
  color: var(--dz-primary-strong);
}

.promo-banner__cta:hover {
  text-decoration: underline;
}

@media (max-width: 560px) {
  .promo-banner {
    flex-direction: column;
  }

  .promo-banner__media {
    width: 100%;
    height: 9.5rem;
    align-self: stretch;
  }
}
</style>