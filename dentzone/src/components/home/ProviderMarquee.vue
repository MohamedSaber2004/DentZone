<script setup lang="ts">
import { computed, ref } from 'vue'
import { t } from '../../i18n'
import { resolveMediaUrl } from '../../utils/media'
import AppIcon from '../ui/AppIcon.vue'
import type { HomeProviderDto } from '../../domain/models/home'

const props = withDefaults(
  defineProps<{
    providers: HomeProviderDto[]
    reverseOrder?: boolean
    reverseAnimation?: boolean
    decorative?: boolean
  }>(),
  { reverseOrder: false, reverseAnimation: false, decorative: false },
)

const failedImages = ref<Set<string>>(new Set())
const groups = ['base', 'dup'] as const

const items = computed(() => {
  if (!props.providers || props.providers.length === 0) return []
  const base = props.reverseOrder ? [...props.providers].reverse() : [...props.providers]
  if (base.length >= 8) return base
  const repeated: HomeProviderDto[] = []
  while (repeated.length < 8) {
    repeated.push(...base)
  }
  return repeated
})

const durationSeconds = computed(() => Math.max(items.value.length * 4, 16))

const trackClass = computed(() =>
  props.reverseAnimation
    ? 'provider-marquee__track--reverse'
    : 'provider-marquee__track--forward',
)

const hidden = (group: string) => props.decorative || group === 'dup'
const tabindex = (group: string) => (hidden(group) ? -1 : undefined)
const altFor = (provider: HomeProviderDto, group: string) => (hidden(group) ? '' : provider.fullName)
</script>

<template>
  <div
    v-if="items.length"
    class="provider-marquee"
    :style="{ '--marquee-duration': `${durationSeconds}s` }"
    :aria-hidden="decorative || undefined"
  >
    <div
      class="provider-marquee__track"
      :class="trackClass"
    >
      <div
        v-for="group in groups"
        :key="group"
        class="provider-marquee__group"
        :aria-hidden="hidden(group) ? 'true' : undefined"
      >
        <RouterLink
          v-for="(provider, index) in items"
          :key="`${group}-${provider.id}-${index}`"
          :to="{ name: 'inventory-products', params: { inventoryUserId: provider.id }, query: { supplier: provider.fullName } }"
          class="provider-card"
          :tabindex="tabindex(group)"
        >
          <span class="provider-card__avatar">
            <img
              v-if="provider.profileImage && !failedImages.has(provider.id)"
              :src="resolveMediaUrl(provider.profileImage)"
              :alt="altFor(provider, group)"
              loading="lazy"
              @error="failedImages.add(provider.id)"
            />
            <AppIcon v-else name="store" :size="22" />
          </span>
          <span class="provider-card__meta">
            <strong>{{ provider.fullName }}</strong>
            <span
              class="provider-card__status"
              :class="provider.isAvailableNow ? 'provider-card__status--on' : 'provider-card__status--off'"
            >
              <span class="provider-card__dot" aria-hidden="true" />
              {{ t(provider.isAvailableNow ? 'categories.available' : 'categories.notAvailable') }}
            </span>
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.provider-marquee {
  --marquee-gap: 1.1rem;
  overflow: hidden;
  padding-block: 0.5rem;
  direction: ltr;
  width: 100%;
}

.provider-marquee__track {
  display: flex;
  width: max-content;
  will-change: transform;
}

.provider-marquee__track--forward {
  animation: providers-marquee-forward var(--marquee-duration, 30s) linear infinite;
}

.provider-marquee__track--reverse {
  animation: providers-marquee-reverse var(--marquee-duration, 30s) linear infinite;
}

.provider-marquee__track:hover {
  animation-play-state: paused;
}

.provider-marquee__group {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.provider-card {
  flex: 0 0 250px;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  margin-right: var(--marquee-gap);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  direction: rtl;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  box-shadow: var(--dz-shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.05));
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

html[dir='ltr'] .provider-card {
  direction: ltr;
}

.provider-card:hover {
  transform: translateY(-2px);
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow-sm);
}

.provider-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 3.2rem;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: var(--dz-radius-full);
  overflow: hidden;
  background: var(--dz-surface-soft);
  color: var(--dz-primary);
  border: 1px solid var(--dz-border-subtle, rgba(0, 0, 0, 0.06));
}

.provider-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.provider-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.provider-card__meta strong {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--dz-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
}

.provider-card__status--on {
  color: var(--dz-success);
}

.provider-card__status--off {
  color: var(--dz-muted);
}

.provider-card__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--dz-radius-full);
  background: currentColor;
}

@keyframes providers-marquee-forward {
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

@keyframes providers-marquee-reverse {
  0% {
    transform: translate3d(-50%, 0, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}

@media (max-width: 560px) {
  .provider-card {
    flex-basis: 210px;
  }
}
</style>