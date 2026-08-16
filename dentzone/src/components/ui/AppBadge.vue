<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'violet' | 'neutral'
    size?: 'sm' | 'md'
  }>(),
  { tone: 'primary', size: 'sm' },
)
</script>

<template>
  <span class="badge" :class="[`badge--${tone}`, `badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 700;
  border-radius: var(--dz-radius-full);
}

.badge--sm {
  padding: 0.15rem 0.55rem;
  font-size: 0.7rem;
}

.badge--md {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}

.badge--primary {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.badge--success {
  background: var(--dz-success-soft);
  color: var(--dz-success);
}

.badge--warning {
  background: var(--dz-warning-soft);
  color: var(--dz-warning);
}

.badge--danger {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.badge--violet {
  background: var(--dz-violet-soft);
  color: var(--dz-violet);
}

.badge--neutral {
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
}
</style>