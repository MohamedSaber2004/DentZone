<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const onSubmit = (event: Event) => {
  event.preventDefault()
  emit('submit')
}
</script>

<template>
  <form class="search-field" role="search" @submit="onSubmit">
    <AppIcon name="search" :size="17" class="search-field__icon" />
    <input
      class="search-field__input"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      aria-label="Search products"
      @input="onInput"
    />
    <button
      v-if="modelValue"
      class="search-field__clear"
      type="button"
      aria-label="Clear search"
      @click="emit('update:modelValue', '')"
    >
      <AppIcon name="close" :size="13" />
    </button>
  </form>
</template>

<style scoped>
.search-field {
  position: relative;
  display: flex;
  align-items: center;
}

.search-field__icon {
  position: absolute;
  inset-inline-start: 0.9rem;
  color: var(--dz-muted);
  pointer-events: none;
}

.search-field__input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 2.4rem;
  border: 1px solid var(--dz-border-strong);
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface);
  font-size: 0.9rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

html[dir='rtl'] .search-field__input {
  padding: 0.6rem 2.4rem 0.6rem 2.5rem;
}

.search-field__input::placeholder {
  color: var(--dz-muted);
}

.search-field__input:focus {
  outline: none;
  border-color: var(--dz-primary);
  box-shadow: 0 0 0 3px var(--dz-primary-soft);
}

.search-field__clear {
  position: absolute;
  inset-inline-end: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  color: var(--dz-muted);
}

.search-field__clear:hover {
  background: var(--dz-surface-soft);
  color: var(--dz-ink);
}
</style>