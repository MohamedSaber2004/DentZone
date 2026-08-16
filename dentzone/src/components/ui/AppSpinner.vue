<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { label: 'Loading', size: 'md' },
)
</script>

<template>
  <div class="app-spinner" :class="`app-spinner--${size}`" role="status" :aria-label="label">
    <span class="app-spinner__ring" aria-hidden="true" />
  </div>
</template>

<style scoped>
.app-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-spinner--sm {
  --spinner-size: 1.1rem;
}

.app-spinner--md {
  --spinner-size: 1.8rem;
}

.app-spinner--lg {
  --spinner-size: 2.8rem;
}

.app-spinner__ring {
  width: var(--spinner-size);
  height: var(--spinner-size);
  border: 3px solid var(--dz-primary-soft);
  border-top-color: var(--dz-primary);
  border-radius: 50%;
  animation: app-spinner-rotate 0.8s linear infinite;
}

@keyframes app-spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>