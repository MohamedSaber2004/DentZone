<script setup lang="ts">
import { toastService, type Toast } from '../../application/toast.service'
import AppIcon, { type IconName } from './AppIcon.vue'

const icons: Record<Toast['type'], IconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'smile',
}
</script>

<template>
  <div class="toast-container" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastService.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        role="alert"
      >
        <span class="toast__icon">
          <AppIcon :name="icons[toast.type]" :size="18" />
        </span>
        <span class="toast__message">{{ toast.message }}</span>
        <button class="toast__close" type="button" aria-label="Dismiss notification" @click="toastService.dismiss(toast.id)">
          <AppIcon name="close" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(var(--dz-header-height) + 1rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  width: min(420px, calc(100vw - 2rem));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow-lg);
  pointer-events: auto;
}

.toast--success {
  border-left: 4px solid var(--dz-success);
}

.toast--error {
  border-left: 4px solid var(--dz-danger);
}

.toast--info {
  border-left: 4px solid var(--dz-primary);
}

.toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--dz-surface-soft);
}

.toast--success .toast__icon {
  background: var(--dz-success-faint);
  color: var(--dz-success);
}

.toast--error .toast__icon {
  background: var(--dz-danger-faint);
  color: var(--dz-danger);
}

.toast--info .toast__icon {
  background: var(--dz-primary-faint);
  color: var(--dz-primary);
}

.toast__message {
  flex: 1;
  font-size: 0.88rem;
  font-weight: 500;
}

.toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  color: var(--dz-muted);
  flex-shrink: 0;
}

.toast__close:hover {
  background: var(--dz-surface-soft);
  color: var(--dz-ink);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>