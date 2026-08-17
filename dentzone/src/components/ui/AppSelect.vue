<script setup lang="ts">
import AppIcon from './AppIcon.vue'

export interface SelectOption {
  value: string
  label: string
}

withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    placeholder?: string
  }>(),
  { placeholder: 'Select an option' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="app-select">
    <select
      class="app-select__native"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <AppIcon name="chevron-down" :size="15" class="app-select__chevron" />
  </label>
</template>

<style scoped>
.app-select {
  position: relative;
  display: inline-block;
}

.app-select__native {
  appearance: none;
  -webkit-appearance: none;
  padding: 0.6rem 2.4rem 0.6rem 1rem;
  border: 1px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition: border-color 0.2s;
}

html[dir='rtl'] .app-select__native {
  padding: 0.6rem 1rem 0.6rem 2.4rem;
}

.app-select__native:hover {
  border-color: var(--dz-primary);
}

.app-select__chevron {
  position: absolute;
  inset-inline-end: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dz-muted);
  pointer-events: none;
}
</style>