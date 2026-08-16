<script setup lang="ts">
import { computed } from 'vue'
import { locale } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    ctaLabel?: string
    ctaTo?: string
    emoji?: string
  }>(),
  { ctaLabel: '', ctaTo: '', emoji: '📢' },
)

const arrowIcon = computed<'arrow-left' | 'arrow-right'>(() => (locale.value === 'ar' ? 'arrow-left' : 'arrow-right'))
</script>

<template>
  <aside class="ad-banner">
    <span class="ad-banner__label">Ad</span>
    <div class="ad-banner__icon" aria-hidden="true">{{ emoji }}</div>
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
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.6rem 2rem 1.6rem 1.6rem;
  border-radius: var(--dz-radius-lg);
  background:
    radial-gradient(30rem 14rem at 90% -30%, rgb(255 255 255 / 0.35) 0%, transparent 60%),
    linear-gradient(120deg, #4338ca 0%, #7c3aed 55%, #a855f7 100%);
  color: var(--dz-white);
  overflow: hidden;
}

html[dir='rtl'] .ad-banner {
  padding: 1.6rem 1.6rem 1.6rem 2rem;
}

.ad-banner__label {
  position: absolute;
  inset-inline-end: 0.75rem;
  top: 0.6rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--dz-radius-full);
  background: rgb(255 255 255 / 0.22);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ad-banner__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
  font-size: 2rem;
  border-radius: var(--dz-radius);
  background: rgb(255 255 255 / 0.18);
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
  color: rgb(255 255 255 / 0.85);
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
  background: var(--dz-white);
  color: #6d28d9;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  transition: transform 0.15s;
}

.ad-banner__cta:hover {
  transform: translateY(-1px);
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
    font-size: 1.6rem;
  }

  .ad-banner__content {
    padding-inline-end: 2.5rem;
  }

  .ad-banner__cta {
    margin-inline-start: 0;
  }
}
</style>