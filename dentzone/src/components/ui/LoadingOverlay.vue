<script setup lang="ts">
import { ref, watch } from 'vue'
import { requestTracker } from '../../application/request.tracker'
import AppIcon from './AppIcon.vue'

const visible = ref(false)
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => requestTracker.isLoading.value,
  (loading) => {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    if (loading) {
      showTimer = setTimeout(() => {
        visible.value = true
      }, 200)
    } else {
      hideTimer = setTimeout(() => {
        visible.value = false
      }, 150)
    }
  },
)
</script>

<template>
  <Transition name="loading-fade">
    <div v-if="visible" class="loading-overlay" aria-hidden="true">
      <div class="loading-overlay__card">
        <span class="loading-overlay__logo">
          <AppIcon name="tooth" :size="26" />
        </span>
        <span class="loading-overlay__ring" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--dz-band) 30%, transparent);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  pointer-events: none;
}

.loading-overlay__card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.4rem;
  height: 4.4rem;
}

.loading-overlay__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--dz-radius);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-primary);
  animation: loading-overlay-breathe 1.4s ease-in-out infinite;
}

.loading-overlay__ring {
  position: absolute;
  inset: 0;
  border-radius: var(--dz-radius-full);
  border: 2px dashed var(--dz-gold);
  opacity: 0.8;
  animation: loading-overlay-spin 1.1s linear infinite;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

@keyframes loading-overlay-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes loading-overlay-breathe {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}
</style>