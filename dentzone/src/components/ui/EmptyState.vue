<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'

withDefaults(
  defineProps<{
    icon?: IconName
    title: string
    description?: string
  }>(),
  { icon: 'box', description: '' },
)
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <AppIcon :name="icon" :size="26" />
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: var(--dz-surface);
  border: 1px dashed var(--dz-border-strong);
  border-radius: var(--dz-radius-lg);
}

.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.25rem;
  height: 4.25rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-faint);
  border: 1px solid var(--dz-primary-soft);
  color: var(--dz-primary);
  margin-bottom: 1rem;
}

.empty-state__title {
  font-size: 1.15rem;
}

.empty-state__description {
  margin-top: 0.35rem;
  color: var(--dz-muted);
  max-width: 380px;
}

.empty-state__action {
  margin-top: 1.25rem;
}
</style>
