<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { locale, t } from '../../i18n'
import { resolveMediaUrl } from '../../utils/media'
import AppIcon from '../ui/AppIcon.vue'
import type { SpecialOfferDto } from '../../domain/models/special-offer'

const props = withDefaults(
  defineProps<{
    offers: SpecialOfferDto[]
    title: string
    subtitle: string
    ariaLabel?: string
    showStates?: boolean
    loading?: boolean
    error?: boolean
  }>(),
  { showStates: false, loading: false, error: false, ariaLabel: '' },
)

const emit = defineEmits<{ (e: 'retry'): void }>()

const sliderRef = ref<HTMLElement | null>(null)

// Fall back to the visible (translated) title when no explicit label is given.
const resolvedLabel = computed(() => props.ariaLabel || props.title)

const STEP_MS = 4000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let timer: ReturnType<typeof setInterval> | undefined

const advance = () => {
  const slider = sliderRef.value
  if (!slider) return
  const card = slider.firstElementChild as HTMLElement | null
  if (!card) return
  const cardWidth = card.getBoundingClientRect().width
  const maxScroll = slider.scrollWidth - slider.clientWidth
  if (Math.abs(slider.scrollLeft) >= maxScroll - slider.clientWidth / 2) {
    slider.scrollTo({ left: 0, behavior: 'auto' })
  } else {
    slider.scrollBy({
      left: (locale.value === 'ar' ? -1 : 1) * cardWidth,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }
}

const startTimer = () => {
  stopTimer()
  if (props.offers.length < 2) return
  timer = setInterval(advance, STEP_MS)
}

const stopTimer = () => {
  if (timer !== undefined) {
    clearInterval(timer)
    timer = undefined
  }
}

watch(
  () => [props.loading, props.error, props.offers.length] as const,
  () => {
    if (!props.loading && !props.error) startTimer()
  },
  { flush: 'post' },
)

onMounted(() => {
  if (!props.loading && !props.error) startTimer()
})

onBeforeUnmount(stopTimer)
</script>

<template>
  <section class="offer-slider" :aria-label="resolvedLabel">
    <div class="container">
      <div class="offer-slider__head">
        <div>
          <h2 class="offer-slider__title">{{ title }}</h2>
          <p class="offer-slider__subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div v-if="showStates && loading" class="offer-slider__skeleton" role="status" :aria-label="t('common.loading')" />

      <div v-else-if="showStates && error" class="offer-slider__error" role="alert">
        <AppIcon name="alert-circle" :size="17" />
        <span>{{ t('categories.errorDescription') }}</span>
        <button type="button" class="offer-slider__retry" @click="emit('retry')">
          <AppIcon name="refresh" :size="14" />
          {{ t('categories.retry') }}
        </button>
      </div>

      <div v-else-if="showStates && offers.length === 0" class="offer-slider__empty">
        <span class="offer-slider__empty-icon"><AppIcon name="sparkles" :size="24" /></span>
        <strong>{{ t('categories.emptyTitle') }}</strong>
        <span>{{ t('categories.emptyDescription') }}</span>
      </div>

      <div v-else-if="offers.length" ref="sliderRef" class="offer-slider__slider" :aria-label="resolvedLabel">
        <a
          v-for="offer in offers"
          :key="offer.id"
          class="offer-slider__card"
          :href="offer.link"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="resolvedLabel"
        >
          <img :src="resolveMediaUrl(offer.imagePath)" :alt="resolvedLabel" loading="lazy" draggable="false" />
        </a>
        <a
          v-if="offers.length > 1"
          class="offer-slider__card"
          :href="offers[0]!.link"
          target="_blank"
          rel="noopener noreferrer"
          aria-hidden="true"
          tabindex="-1"
        >
          <img :src="resolveMediaUrl(offers[0]!.imagePath)" alt="" loading="lazy" draggable="false" />
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.offer-slider {
  --offer-card-w: 100%;
  padding: 4rem var(--dz-gutter) 0;
  background: var(--dz-paper);
}

.offer-slider__head {
  margin-bottom: 1.75rem;
}

.offer-slider__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.offer-slider__subtitle {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.offer-slider__slider {
  display: flex;
  width: 100%;
  margin-inline: auto;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  border-radius: var(--dz-radius-lg);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  box-shadow: var(--dz-shadow-sm);
  overscroll-behavior-x: contain;
}

.offer-slider__slider::-webkit-scrollbar {
  display: none;
}

.offer-slider__card {
  flex: 0 0 100%;
  scroll-snap-align: start;
}

.offer-slider__card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  aspect-ratio: 16 / 7;
  user-select: none;
}

.offer-slider__skeleton {
  width: 100%;
  margin-inline: auto;
  aspect-ratio: 16 / 7;
  border-radius: var(--dz-radius-lg);
  background: linear-gradient(
    100deg,
    var(--dz-surface-soft) 40%,
    var(--dz-primary-faint) 50%,
    var(--dz-surface-soft) 60%
  );
  background-size: 200% 100%;
  animation: offer-slider-shimmer 1.4s ease-in-out infinite;
}

@keyframes offer-slider-shimmer {
  to {
    background-position: -200% 0;
  }
}

.offer-slider__error {
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

.offer-slider__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--dz-border-strong);
  border-radius: var(--dz-radius-lg);
  text-align: center;
}

.offer-slider__empty-icon {
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

.offer-slider__empty strong {
  font-family: var(--dz-font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.offer-slider__empty > span:last-child {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 38ch;
}

.offer-slider__retry {
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

.offer-slider__retry:hover {
  background: var(--dz-danger);
  color: var(--dz-white);
}

@media (max-width: 820px) {
  .offer-slider__card {
    flex: 0 0 100%;
    scroll-snap-align: start;
  }

  .offer-slider__skeleton {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .offer-slider {
    padding: 3rem var(--dz-gutter) 0;
  }

  .offer-slider__card img {
    aspect-ratio: 16 / 9;
  }

  .offer-slider__skeleton {
    aspect-ratio: 16 / 9;
  }
}

@media (prefers-reduced-motion: reduce) {
  .offer-slider__skeleton {
    animation: none;
    transition: none;
  }
}
</style>