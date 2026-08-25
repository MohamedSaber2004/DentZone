<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import ResultModal from './components/ui/ResultModal.vue'
import LoadingBar from './components/ui/LoadingBar.vue'
import LoadingOverlay from './components/ui/LoadingOverlay.vue'
import AppIcon from './components/ui/AppIcon.vue'
import { WHATSAPP_LINK } from './config/contact.config'
import { t } from './i18n'

const showScrollTop = ref(false)
const scrollProgress = ref(0)
const isLaunching = ref(false)

// Circle progress constants (r=20 -> circumference ≈ 125.66)
const CIRCUMFERENCE = 125.66
const strokeDashoffset = computed(() => {
  const p = Math.min(Math.max(scrollProgress.value, 0), 100)
  return CIRCUMFERENCE - (p / 100) * CIRCUMFERENCE
})

const onScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  showScrollTop.value = scrollTop > 240
  scrollProgress.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
}

const smoothScrollToTop = (duration = 550) => {
  if (isLaunching.value) return
  isLaunching.value = true

  const startPosition = window.scrollY || document.documentElement.scrollTop
  if (startPosition === 0) {
    isLaunching.value = false
    return
  }

  const startTime = performance.now()

  // Easing curve: easeInOutCubic
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = easeInOutCubic(progress)

    window.scrollTo(0, startPosition * (1 - ease))

    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      window.scrollTo(0, 0)
      setTimeout(() => {
        isLaunching.value = false
      }, 150)
    }
  }

  requestAnimationFrame(step)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">{{ t('common.skipToMain') }}</a>
    <LoadingBar />
    <LoadingOverlay />
    <AppHeader />
    <ToastContainer />
    <ResultModal />
    <main id="main-content" class="app-main" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />

    <!-- Fixed Floating Action Buttons (Scroll to Top + WhatsApp) -->
    <aside class="app-floating-actions" aria-label="Quick Actions">
      <Transition name="fab">
        <button
          v-if="showScrollTop"
          type="button"
          class="app-scroll-top"
          :class="{ 'app-scroll-top--launching': isLaunching }"
          :aria-label="t('common.scrollToTop')"
          :title="t('common.scrollToTop')"
          @click="smoothScrollToTop()"
        >
          <!-- Animated Circular Progress Ring -->
          <svg class="app-scroll-top__ring" viewBox="0 0 48 48" aria-hidden="true">
            <circle
              class="app-scroll-top__ring-bg"
              cx="24"
              cy="24"
              r="20"
            />
            <circle
              class="app-scroll-top__ring-fill"
              cx="24"
              cy="24"
              r="20"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="strokeDashoffset"
            />
          </svg>

          <!-- Animated Arrow Icon -->
          <span class="app-scroll-top__icon">
            <AppIcon name="arrow-up" :size="19" />
          </span>
        </button>
      </Transition>

      <a
        class="app-whatsapp"
        :href="WHATSAPP_LINK"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        title="WhatsApp"
      >
        <AppIcon name="whatsapp" :size="26" filled />
      </a>
    </aside>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}

.app-main:focus {
  outline: none;
}

/* Floating Actions Cluster (Scroll-to-top & WhatsApp) */
.app-floating-actions {
  position: fixed;
  bottom: max(1.25rem, env(safe-area-inset-bottom, 1.25rem));
  inset-inline-end: max(1.25rem, env(safe-area-inset-right, 1.25rem));
  z-index: 45;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  pointer-events: none;
}

.app-floating-actions > * {
  pointer-events: auto;
}

/* Scroll To Top Button */
.app-scroll-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-ink);
  box-shadow: var(--dz-shadow-md);
  cursor: pointer;
  outline: none;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s,
    box-shadow 0.25s;
}

/* Circular Progress Ring */
.app-scroll-top__ring {
  position: absolute;
  inset: -2px;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  transform: rotate(-90deg);
  pointer-events: none;
}

.app-scroll-top__ring-bg {
  fill: none;
  stroke: var(--dz-border-soft);
  stroke-width: 2.5;
  opacity: 0.35;
}

.app-scroll-top__ring-fill {
  fill: none;
  stroke: var(--dz-primary);
  stroke-width: 2.5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.15s ease-out;
}

/* Arrow Icon and Floating Hover Animation */
.app-scroll-top__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.4, 1);
}

.app-scroll-top:hover {
  transform: translateY(-4px) scale(1.06);
  background: var(--dz-primary);
  color: #fff;
  border-color: var(--dz-primary);
  box-shadow: 0 10px 24px rgb(0 0 0 / 22%);
}

.app-scroll-top:hover .app-scroll-top__ring-fill {
  stroke: #fff;
}

.app-scroll-top:hover .app-scroll-top__icon {
  animation: float-arrow 0.9s ease-in-out infinite alternate;
}

.app-scroll-top:active {
  transform: translateY(-1px) scale(0.96);
}

.app-scroll-top:focus-visible {
  outline: 3px solid var(--dz-primary);
  outline-offset: 3px;
}

/* Rocket Launch Upward Effect on Click */
.app-scroll-top--launching {
  animation: launch-pulse 0.55s ease-out;
}

.app-scroll-top--launching .app-scroll-top__icon {
  animation: arrow-rocket 0.55s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}

@keyframes float-arrow {
  0% {
    transform: translateY(1px);
  }
  100% {
    transform: translateY(-3px);
  }
}

@keyframes launch-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--dz-primary-rgb, 30, 110, 230), 0.7);
    transform: scale(0.92);
  }
  40% {
    box-shadow: 0 0 0 12px rgba(var(--dz-primary-rgb, 30, 110, 230), 0);
    transform: scale(1.08) translateY(-4px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

@keyframes arrow-rocket {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  45% {
    transform: translateY(-18px) scale(1.15);
    opacity: 0;
  }
  50% {
    transform: translateY(18px) scale(0.7);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Floating WhatsApp Button */
.app-whatsapp {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.3rem;
  height: 3.3rem;
  border-radius: var(--dz-radius-full);
  background: #25d366;
  color: #fff;
  box-shadow: 0 8px 24px rgb(37 211 102 / 45%);
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s;
  outline: none;
}

.app-whatsapp:hover {
  transform: translateY(-3px) scale(1.06);
  box-shadow: 0 12px 28px rgb(37 211 102 / 55%);
}

.app-whatsapp:active {
  transform: translateY(0) scale(0.95);
}

.app-whatsapp:focus-visible {
  outline: 3px solid #25d366;
  outline-offset: 2px;
}

/* FAB Spring Transition */
.fab-enter-active,
.fab-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.65);
}

/* Responsive Styles */
@media (max-width: 640px) {
  .app-floating-actions {
    bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
    inset-inline-end: max(1rem, env(safe-area-inset-right, 1rem));
    gap: 0.5rem;
  }

  .app-scroll-top {
    width: 2.85rem;
    height: 2.85rem;
  }

  .app-whatsapp {
    width: 2.95rem;
    height: 2.95rem;
  }
}

@media (max-width: 380px) {
  .app-floating-actions {
    bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
    inset-inline-end: max(0.75rem, env(safe-area-inset-right, 0.75rem));
    gap: 0.4rem;
  }

  .app-scroll-top {
    width: 2.6rem;
    height: 2.6rem;
  }

  .app-whatsapp {
    width: 2.7rem;
    height: 2.7rem;
  }
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>