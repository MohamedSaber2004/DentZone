<script setup lang="ts">
import { ref } from 'vue'
import { t } from '../../i18n'
import AppIcon from './AppIcon.vue'

let uidCounter = 0

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label: string
    type?: 'text' | 'email' | 'tel' | 'password' | 'date'
    placeholder?: string
    required?: boolean
    error?: string
    autocomplete?: string
    disabled?: boolean
    autofocus?: boolean
  }>(),
  { modelValue: '', type: 'text', placeholder: '', required: false, error: '', autocomplete: 'off', disabled: false, autofocus: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const errorId = `app-input-error-${++uidCounter}`

const showPassword = ref(false)

const fieldType = () => {
  if (props.type !== 'password') return props.type
  return showPassword.value ? 'text' : 'password'
}

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label class="app-input">
    <span class="app-input__label">
      {{ label }}
      <span v-if="required" class="app-input__required">*</span>
    </span>
    <span
      class="app-input__field-wrap"
      :class="{ 'app-input__field-wrap--invalid': error, 'app-input__field-wrap--password': type === 'password' }"
    >
      <input
        class="app-input__field"
        :class="{ 'app-input__field--ltr': type === 'email' || type === 'tel' }"
        :type="fieldType()"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :autofocus="autofocus"
        :dir="type === 'email' || type === 'tel' ? 'ltr' : undefined"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
        @input="onInput"
      />
      <button
        v-if="type === 'password'"
        class="app-input__toggle"
        type="button"
        :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
        :title="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
        :aria-pressed="showPassword"
        @click="showPassword = !showPassword"
      >
        <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="17" />
      </button>
    </span>
    <span v-if="error" :id="errorId" role="alert" class="app-input__error">{{ error }}</span>
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

.app-input__field-wrap {
  position: relative;
  display: block;
}

.app-input__field {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  font-size: 0.95rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.app-input__field--ltr {
  text-align: left;
}

.app-input__field-wrap--password .app-input__field {
  padding-inline-end: 2.8rem;
}

.app-input__field::placeholder {
  color: var(--dz-muted);
}

.app-input__field:focus {
  outline: none;
  border-color: var(--dz-primary);
  box-shadow: 0 0 0 3px var(--dz-primary-soft);
}

.app-input__field:disabled {
  opacity: 0.6;
  background: var(--dz-surface-soft);
  cursor: not-allowed;
}

.app-input__field-wrap--invalid .app-input__field {
  border-color: var(--dz-danger);
}

.app-input__field-wrap--invalid .app-input__field:focus {
  box-shadow: 0 0 0 3px var(--dz-danger-soft);
}

.app-input__toggle {
  position: absolute;
  inset-inline-end: 0.55rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: var(--dz-radius-sm);
  color: var(--dz-muted);
  transition:
    color 0.2s,
    background-color 0.2s;
}

.app-input__toggle:hover {
  color: var(--dz-ink);
  background: var(--dz-surface-soft);
}

.app-input__error {
  font-size: 0.78rem;
  color: var(--dz-danger);
}
</style>