<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    length?: number
  }>(),
  { length: 6 },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  complete: [value: string]
}>()

const inputs = ref<HTMLInputElement[]>([])
const digits = ref<string[]>(Array.from({ length: props.length }, () => ''))

watch(
  digits,
  (values) => {
    const value = values.join('')
    emit('update:modelValue', value)
    if (value.length === props.length) {
      emit('complete', value)
    }
  },
  { deep: true, immediate: true },
)

watch(
  () => props.modelValue,
  (next) => {
    const current = digits.value.join('')
    if (next !== current) {
      const chars = (next ?? '').split('').slice(0, props.length)
      digits.value = Array.from({ length: props.length }, (_, i) => chars[i] ?? '')
    }
  },
)

const focusIndex = (index: number) => {
  const input = inputs.value[index]
  input?.focus()
  input?.select()
}

const onInput = (index: number, event: Event) => {
  const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  if (raw.length > 1) {
    const chars = raw.split('').slice(0, props.length)
    digits.value = Array.from({ length: props.length }, (_, i) => chars[i] ?? '')
    focusIndex(Math.min(chars.length, props.length - 1))
    return
  }
  const nextDigits = [...digits.value]
  nextDigits[index] = raw
  digits.value = nextDigits
  if (raw && index < props.length - 1) {
    focusIndex(index + 1)
  }
}

const onKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace') {
    if (!digits.value[index] && index > 0) {
      focusIndex(index - 1)
    }
  }
}

const onPaste = (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text').replace(/\D/g, '') ?? ''
  if (!text) return
  event.preventDefault()
  const chars = text.split('').slice(0, props.length)
  digits.value = Array.from({ length: props.length }, (_, i) => chars[i] ?? '')
  focusIndex(Math.min(chars.length, props.length - 1))
}

onMounted(() => {
  focusIndex(0)
})
</script>

<template>
  <div class="otp-input" role="group" aria-label="Verification code">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      ref="inputs"
      class="otp-input__box"
      :class="{ 'otp-input__box--filled': digit !== '' }"
      :value="digit"
      type="text"
      inputmode="numeric"
      maxlength="10"
      :aria-label="`Digit ${index + 1}`"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste"
    />
  </div>
</template>

<style scoped>
.otp-input {
  display: flex;
  justify-content: center;
  gap: 0.55rem;
  direction: ltr;
}

.otp-input__box {
  width: 2.9rem;
  height: 3.2rem;
  text-align: center;
  font-family: var(--dz-font-mono);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--dz-ink);
  border: 1px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background-color 0.2s;
}

.otp-input__box::placeholder {
  color: var(--dz-muted);
}

.otp-input__box:focus {
  outline: none;
  border-color: var(--dz-primary);
  box-shadow: 0 0 0 3px var(--dz-primary-soft);
  background: var(--dz-primary-faint);
}

.otp-input__box--filled {
  border-color: var(--dz-primary);
}

@media (max-width: 560px) {
  .otp-input {
    gap: 0.4rem;
  }

  .otp-input__box {
    width: 2.4rem;
    height: 2.9rem;
  }
}
</style>