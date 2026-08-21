<script setup lang="ts">
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import ResultModal from './components/ui/ResultModal.vue'
import LoadingBar from './components/ui/LoadingBar.vue'
import LoadingOverlay from './components/ui/LoadingOverlay.vue'
import AppIcon from './components/ui/AppIcon.vue'
import { WHATSAPP_LINK } from './config/contact.config'
</script>

<template>
  <div class="app-shell">
    <LoadingBar />
    <LoadingOverlay />
    <AppHeader />
    <ToastContainer />
    <ResultModal />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
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

.app-whatsapp {
  position: fixed;
  bottom: 1.25rem;
  inset-inline-end: 1.25rem;
  z-index: 40;
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
    transform 0.2s,
    box-shadow 0.2s;
}

.app-whatsapp:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 28px rgb(37 211 102 / 55%);
}

@media (max-width: 640px) {
  .app-whatsapp {
    bottom: 1rem;
    inset-inline-end: 1rem;
    width: 2.9rem;
    height: 2.9rem;
  }
}

@media (max-width: 380px) {
  .app-whatsapp {
    bottom: 0.75rem;
    inset-inline-end: 0.75rem;
    width: 2.65rem;
    height: 2.65rem;
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