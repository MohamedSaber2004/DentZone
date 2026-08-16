<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    block: false,
    disabled: false,
    type: 'button',
  },
)
</script>

<template>
  <button
    class="app-button"
    :class="[`app-button--${variant}`, `app-button--${size}`, { 'app-button--block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  border-radius: var(--dz-radius);
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    transform 0.1s,
    box-shadow 0.2s;
  white-space: nowrap;
}

.app-button:active:not(:disabled) {
  transform: translateY(1px);
}

.app-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.app-button--sm {
  padding: 0.45rem 0.85rem;
  font-size: 0.825rem;
}

.app-button--md {
  padding: 0.65rem 1.25rem;
  font-size: 0.9rem;
}

.app-button--lg {
  padding: 0.85rem 1.75rem;
  font-size: 1rem;
}

.app-button--block {
  display: flex;
  width: 100%;
}

.app-button--primary {
  background: var(--dz-gradient);
  color: var(--dz-white);
  box-shadow: var(--dz-shadow-primary);
}

.app-button--primary:hover:not(:disabled) {
  filter: brightness(1.08);
  box-shadow: 0 10px 26px rgb(13 148 136 / 0.45);
  transform: translateY(-1px);
}

.app-button--secondary {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.app-button--secondary:hover:not(:disabled) {
  background: var(--dz-hover-secondary);
}

.app-button--outline {
  background: var(--dz-surface);
  border: 1px solid var(--dz-border-strong);
  color: var(--dz-ink-soft);
}

.app-button--outline:hover:not(:disabled) {
  border-color: var(--dz-primary);
  color: var(--dz-primary-strong);
}

.app-button--ghost {
  color: var(--dz-ink-soft);
}

.app-button--ghost:hover:not(:disabled) {
  background: var(--dz-surface-soft);
  color: var(--dz-ink);
}

.app-button--danger {
  background: var(--dz-danger);
  color: var(--dz-white);
}
</style>