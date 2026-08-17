<script setup lang="ts">
import { computed } from 'vue'
import { locale } from '../../i18n'
import AppIcon, { type IconName } from '../ui/AppIcon.vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    ctaLabel?: string
    ctaTo?: string
    icon?: IconName
  }>(),
  { ctaLabel: '', ctaTo: '', icon: 'sparkles' },
)

const arrowIcon = computed<'arrow-left' | 'arrow-right'>(() => (locale.value === 'ar' ? 'arrow-left' : 'arrow-right'))
</script>

<template>
  <aside class="ad-banner">
    <span class="ad-banner__label">Limited offer</span>
    <div class="ad-banner__icon" aria-hidden="true">
      <AppIcon :name="icon" :size="24" />
    </div>
    <div class="ad-banner__content">
      <h3 class="ad-banner__title">{{ title }}</h3>
      <p class="ad-banner__description">{{ description }}</p>
    </div>
    <RouterLink v-if="ctaLabel && ctaTo" :to="ctaTo" class="ad-banner__cta">
      {{ ctaLabel }}
      <AppIcon :name="arrowIcon" :size="15" />
    </RouterLink>
  </aside>
</template>

<style scoped>
.ad-banner {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem 2rem 1.5rem 1.6rem;
  border-radius: var(--dz-radius-lg);
  background:
    linear-gradient(120deg, var(--dz-gold-faint) 0%, var(--dz-surface) 55%),
    var(--dz-surface);
  border: 1px solid var(--dz-border);
  color: var(--dz-ink);
  overflow: hidden;
}

html[dir='rtl'] .ad-banner {
  padding: 1.5rem 1.6rem 1.5rem 2rem;
}

.ad-banner::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--dz-gold);
}

.ad-banner {
  position: relative;
}

.ad-banner__label {
  position: absolute;
  inset-inline-end: 0.9rem;
  top: 0.65rem;
  font-family: var(--dz-font-mono);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dz-gold-strong);
}

.ad-banner__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.75rem;
  height: 3.75rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
  background: var(--dz-gold-soft);
  color: var(--dz-gold-strong);
  border: 1px solid color-mix(in srgb, var(--dz-gold) 22%, var(--dz-surface-soft));
}

.ad-banner__content {
  flex: 1;
  min-width: 0;
  padding-inline-end: 1rem;
}

.ad-banner__title {
  font-size: 1.2rem;
}

.ad-banner__description {
  margin-top: 0.25rem;
  font-size: 0.88rem;
  color: var(--dz-ink-soft);
  max-width: 56ch;
}

.ad-banner__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  margin-inline-start: auto;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition:
    transform 0.15s,
    background-color 0.2s;
}

.ad-banner__cta:hover {
  transform: translateY(-1px);
  background: var(--dz-primary-strong);
}

@media (max-width: 640px) {
  .ad-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem 1.25rem;
  }

  .ad-banner__icon {
    width: 3.25rem;
    height: 3.25rem;
  }

  .ad-banner__content {
    padding-inline-end: 2.5rem;
  }

  .ad-banner__cta {
    margin-inline-start: 0;
  }
}
</style>
