<script setup lang="ts">
import { computed } from 'vue'
import { locale } from '../../i18n'

const props = withDefaults(
  defineProps<{
    speed?: number
  }>(),
  { speed: 32 },
)

const isRtl = computed(() => locale.value === 'ar')
const speedStyle = computed(() => ({ '--marquee-speed': `${props.speed}s` }))
</script>

<template>
  <div class="marquee" :class="{ 'marquee--rtl': isRtl }" :style="speedStyle">
    <div class="marquee__viewport">
      <div class="marquee__track">
        <div class="marquee__group">
          <slot />
        </div>
        <div class="marquee__group" aria-hidden="true">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee {
  position: relative;
}

.marquee__viewport {
  overflow: hidden;
  padding-block: 0.35rem;
  -webkit-mask-image: linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
}

.marquee--rtl .marquee__viewport {
  -webkit-mask-image: linear-gradient(to left, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
  mask-image: linear-gradient(to left, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
}

.marquee__track {
  display: flex;
  width: max-content;
  animation: marquee-ltr var(--marquee-speed) linear infinite;
}

.marquee--rtl .marquee__track {
  animation-name: marquee-rtl;
}

.marquee:hover .marquee__track {
  animation-play-state: paused;
}

.marquee__group {
  display: flex;
  gap: 1.1rem;
  padding-inline-end: 1.1rem;
}

@keyframes marquee-ltr {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

@keyframes marquee-rtl {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track {
    animation: none;
  }

  .marquee__viewport {
    overflow-x: auto;
    mask-image: none;
    -webkit-mask-image: none;
  }
}
</style>