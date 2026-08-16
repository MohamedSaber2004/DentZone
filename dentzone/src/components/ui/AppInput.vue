<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    type?: 'text' | 'email' | 'tel'
    placeholder?: string
    required?: boolean
    error?: string
    autocomplete?: string
  }>(),
  { type: 'text', placeholder: '', required: false, error: '', autocomplete: 'off' },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="app-input">
    <span class="app-input__label">
      {{ label }}
      <span v-if="required" class="app-input__required">*</span>
    </span>
    <input
      class="app-input__field"
      :class="{ 'app-input__field--invalid': error }"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      @input="
        $emit(
          'update:modelValue',
          ($event.target as HTMLInputElement).value,
        )
      "
    />
    <span v-if="error" class="app-input__error">{{ error }}</span>
  </label>
</template>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.app-input__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.app-input__required {
  color: var(--dz-danger);
}

.app-input__field {
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  font-size: 0.95rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.app-input__field::placeholder {
  color: var(--dz-muted);
}

.app-input__field:focus {
  outline: none;
  border-color: var(--dz-primary);
  box-shadow: 0 0 0 3px var(--dz-primary-soft);
}

.app-input__field--invalid {
  border-color: var(--dz-danger);
}

.app-input__field--invalid:focus {
  box-shadow: 0 0 0 3px var(--dz-danger-soft);
}

.app-input__error {
  font-size: 0.78rem;
  color: var(--dz-danger);
}
</style>