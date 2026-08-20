<script setup lang="ts">
import { ref, watch } from 'vue'
import { requestTracker } from '../../application/request.tracker'

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
        <div class="loading-overlay__logo-box">
          <img src="/denta-logo.png" alt="DentZone" class="loading-overlay__logo" />
          <span class="loading-overlay__ring" />
        </div>
        <span class="loading-overlay__wordmark">Dent<span>Zone</span></span>
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
  background: color-mix(in srgb, var(--dz-band) 45%, transparent);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  pointer-events: none;
}

.loading-overlay__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  padding: 1.6rem 2rem;
  border-radius: var(--dz-radius-lg);
  background: color-mix(in srgb, var(--dz-surface) 95%, transparent);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow-lg);
}

.loading-overlay__logo-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6.5rem;
  height: 6.5rem;
}

.loading-overlay__logo {
  display: block;
  width: 5.25rem;
  height: 5.25rem;
  border-radius: var(--dz-radius-lg);
  object-fit: contain;
  box-shadow: 0 10px 28px rgb(0 0 0 / 0.16);
  animation: loading-overlay-breathe 1.8s ease-in-out infinite;
}

.loading-overlay__ring {
  position: absolute;
  inset: -4px;
  border-radius: var(--dz-radius-full);
  border: 2.5px dashed var(--dz-gold);
  opacity: 0.85;
  animation: loading-overlay-spin 2.4s linear infinite;
}

.loading-overlay__wordmark {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--dz-ink);
}

.loading-overlay__wordmark span {
  color: var(--dz-gold-strong);
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
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-4px) scale(1.04);
  }
}
</style>