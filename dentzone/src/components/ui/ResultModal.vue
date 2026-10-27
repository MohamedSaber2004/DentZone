<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { modalService } from '../../di/container'
import { t } from '../../i18n'
import AppIcon, { type IconName } from './AppIcon.vue'
import AppButton from './AppButton.vue'

const icons: Record<string, IconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'smile',
}

const titles: Record<string, string> = {
  success: t('common.success'),
  error: t('common.error'),
  info: t('common.notice'),
}

const currentTitle = computed(() => {
  const type = modalService.data.value?.type
  return type ? titles[type] : ''
})

const currentIcon = computed(() => {
  const type = modalService.data.value?.type
  return type ? icons[type] ?? 'smile' : 'smile'
})

const dialogRef = ref<HTMLDivElement | null>(null)
let previouslyFocused: HTMLElement | null = null
const copied = ref(false)

const copyErrorDetails = async () => {
  const data = modalService.data.value
  if (!data) return
  const textToCopy = `DentZone Error [${data.status ?? 'N/A'}]:\n${data.message}\n\nTechnical Details:\n${data.details || 'None'}`
  try {
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  } catch {
    // Clipboard permission denied fallback
  }
}

watch(
  () => modalService.visible.value,
  async (visible) => {
    copied.value = false
    if (visible) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      dialogRef.value?.focus()
    } else if (previouslyFocused) {
      previouslyFocused.focus()
      previouslyFocused = null
    }
  },
)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && modalService.visible.value) {
    event.stopPropagation()
    modalService.close()
  }
}

document.addEventListener('keydown', onKeydown)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="result-modal">
      <div v-if="modalService.visible.value" class="result-modal__backdrop" @click.self="modalService.close()">
        <div
          ref="dialogRef"
          class="result-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-modal-title"
          tabindex="-1"
        >
          <span class="result-modal__icon" :class="`result-modal__icon--${modalService.data.value?.type}`" aria-hidden="true">
            <AppIcon :name="currentIcon" :size="22" />
          </span>
          <h3 id="result-modal-title" class="result-modal__title">{{ currentTitle }}</h3>
          <p class="result-modal__message">{{ modalService.data.value?.message }}</p>
          <button
            v-if="modalService.data.value?.type === 'error' && modalService.data.value?.details"
            type="button"
            class="result-modal__copy-btn"
            @click="copyErrorDetails"
          >
            <AppIcon :name="copied ? 'check' : 'copy'" :size="13" />
            <span>{{ copied ? t('common.errorDetailsCopied') : t('common.copyErrorDetails') }}</span>
          </button>
          <AppButton class="result-modal__action" @click="modalService.close()">
            {{ t('common.ok') }}
          </AppButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.result-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(2, 6, 23, 0.55);
  backdrop-filter: blur(2px);
}

.result-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: min(400px, 100%);
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow-lg);
  text-align: center;
}

.result-modal:focus {
  outline: none;
}

.result-modal__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}

.result-modal__icon--success {
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.result-modal__icon--error {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.result-modal__icon--info {
  background: var(--dz-primary-faint);
  color: var(--dz-primary);
}

.result-modal__title {
  font-size: 1.1rem;
  font-family: var(--dz-font-display);
}

.result-modal__message {
  font-size: 0.9rem;
  color: var(--dz-muted);
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-line;
}

.result-modal__copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.78rem;
  color: var(--dz-primary);
  background: var(--dz-surface-soft);
  border: 1px dashed var(--dz-border);
  border-radius: var(--dz-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-modal__copy-btn:hover {
  background: var(--dz-surface-hover);
  color: var(--dz-primary-strong);
  border-color: var(--dz-primary);
}

.result-modal__action {
  margin-top: 0.5rem;
  min-width: 8rem;
}

.result-modal-enter-active,
.result-modal-leave-active {
  transition: opacity 0.2s ease;
}

.result-modal-enter-active .result-modal,
.result-modal-leave-active .result-modal {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.result-modal-enter-from,
.result-modal-leave-to {
  opacity: 0;
}

.result-modal-enter-from .result-modal,
.result-modal-leave-to .result-modal {
  transform: scale(0.96);
  opacity: 0;
}
</style>