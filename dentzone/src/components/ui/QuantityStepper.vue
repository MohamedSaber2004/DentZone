<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    size?: 'sm' | 'md'
  }>(),
  { min: 1, max: 99, size: 'md' },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const canDecrement = computed(() => props.modelValue > props.min)
const canIncrement = computed(() => props.modelValue < props.max)

const setValue = (value: number) => {
  const clamped = Math.min(props.max, Math.max(props.min, value))
  emit('update:modelValue', clamped)
}

const decrement = () => setValue(props.modelValue - 1)
const increment = () => setValue(props.modelValue + 1)
</script>

<template>
  <div class="quantity-stepper" :class="`quantity-stepper--${size}`">
    <button
      class="quantity-stepper__btn"
      type="button"
      :disabled="!canDecrement"
      aria-label="Decrease quantity"
      @click="decrement"
    >
      <AppIcon name="minus" :size="14" />
    </button>
    <input
      class="quantity-stepper__input"
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      aria-label="Quantity"
      @input="setValue(Number(($event.target as HTMLInputElement).value))"
    />
    <button
      class="quantity-stepper__btn"
      type="button"
      :disabled="!canIncrement"
      aria-label="Increase quantity"
      @click="increment"
    >
      <AppIcon name="plus" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.quantity-stepper {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  overflow: hidden;
}

.quantity-stepper--sm {
  border-radius: var(--dz-radius-sm);
}

.quantity-stepper__btn {
  width: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--dz-ink-soft);
  transition: background-color 0.15s;
}

.quantity-stepper--sm .quantity-stepper__btn {
  width: 1.9rem;
}

.quantity-stepper__btn:hover:not(:disabled) {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.quantity-stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.quantity-stepper__input {
  width: 2.8rem;
  border: none;
  border-left: 1px solid var(--dz-border);
  border-right: 1px solid var(--dz-border);
  text-align: center;
  font-weight: 600;
  -moz-appearance: textfield;
  appearance: textfield;
}

.quantity-stepper--sm .quantity-stepper__input {
  width: 2.3rem;
}

.quantity-stepper__input::-webkit-outer-spin-button,
.quantity-stepper__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.quantity-stepper__input:focus-visible {
  outline: none;
  background: var(--dz-primary-faint);
}
</style>