<script setup lang="ts">
import { ref, watch } from 'vue'
import { requestTracker } from '../../application/request.tracker'

const active = ref(false)
const completing = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => requestTracker.isLoading.value,
  (loading) => {
    clearTimeout(hideTimer)
    if (loading) {
      completing.value = false
      active.value = true
    } else if (active.value) {
      completing.value = true
      hideTimer = setTimeout(() => {
        active.value = false
        completing.value = false
      }, 450)
    }
  },
)
</script>

<template>
  <div v-if="active" class="loading-bar" :class="{ 'loading-bar--complete': completing }" aria-hidden="true">
    <span class="loading-bar__fill" />
  </div>
</template>

<style scoped>
.loading-bar {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: 110;
  height: 3px;
  overflow: hidden;
  background: transparent;
}

.loading-bar__fill {
  display: block;
  width: 45%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--dz-primary), var(--dz-gold));
  animation: loading-bar-sweep 1.1s ease-in-out infinite;
}

.loading-bar--complete .loading-bar__fill {
  width: 100%;
  animation: none;
  transition: width 0.35s ease-out;
}

@keyframes loading-bar-sweep {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(330%);
  }
}
</style>