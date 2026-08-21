<script setup lang="ts">
import { services } from '../di/container'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n'
import { toastService } from '../infrastructure/feedback/toast.service'
import AuthLayout from '../components/auth/AuthLayout.vue'
import PasswordFlowSteps from '../components/auth/PasswordFlowSteps.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'

const router = useRouter()
const route = useRoute()
const { authService } = services

const email = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))

const digits = ref<string[]>(['', '', '', '', '', ''])
const boxes = ref<HTMLInputElement[]>([])
const error = ref('')
const verifying = ref(false)

const RESEND_SECONDS = 60
const resendLeft = ref(RESEND_SECONDS)
let timer: number | null = null

const canResend = computed(() => resendLeft.value <= 0 && !verifying.value)
const complete = computed(() => digits.value.every((d) => d.length === 1))

const goBack = () => {
  void router.push({ name: 'forgot-password' })
}

const onDigitInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const raw = input.value.replace(/\D/g, '')
  digits.value[index] = raw.slice(-1)
  if (raw.length > 1) {
    raw
      .slice(0, 6)
      .split('')
      .forEach((ch, i) => {
        const target = index + i
        if (target < 6) digits.value[target] = ch
      })
  }
  const next = boxes.value[index + 1]
  if (next && digits.value[index]) next.focus()
  if (complete.value) void verify()
}

const onDigitKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key !== 'Backspace') return
  if (digits.value[index]) {
    digits.value[index] = ''
    return
  }
  const prev = boxes.value[index - 1]
  if (prev) {
    prev.focus()
    digits.value[index - 1] = ''
  }
}

const onDigitPaste = (index: number, event: ClipboardEvent) => {
  const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  if (!pasted) return
  event.preventDefault()
  pasted.split('').forEach((ch, i) => {
    const target = index + i
    if (target < 6) digits.value[target] = ch
  })
  const target = boxes.value[Math.min(index + pasted.length, 5)]
  target?.focus()
  if (complete.value) void verify()
}

const verify = async () => {
  if (verifying.value || !complete.value) return
  error.value = ''
  verifying.value = true
  const result = await authService.verifyOtp(email.value, digits.value.join(''))
  verifying.value = false
  if (!result.ok) {
    error.value = result.error
    boxes.value[0]?.focus()
    return
  }
  void router.push({ name: 'reset-password', query: { email: email.value } })
}

const resend = async () => {
  if (!canResend.value) return
  error.value = ''
  const result = await authService.resendOtp(email.value)
  if (!result.ok) {
    error.value = result.error
    return
  }
  resendLeft.value = RESEND_SECONDS
  toastService.success(t('auth.codeSent', { email: email.value }))
}

onMounted(() => {
  boxes.value[0]?.focus()
  timer = window.setInterval(() => {
    resendLeft.value = Math.max(0, resendLeft.value - 1)
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})
</script>

<template>
  <AuthLayout :title="t('auth.verifyTitle')" :subtitle="t('auth.verifySubtitle', { email })">
    <PasswordFlowSteps :current="2" />

    <form class="otp-form" novalidate @submit.prevent="verify">
      <div v-if="error" class="otp-form__error" role="alert">
        <AppIcon name="alert-circle" :size="17" />
        {{ error }}
      </div>

      <fieldset class="otp-form__boxes" :disabled="verifying">
        <legend class="otp-form__sr-only">Verification code</legend>
        <input
          v-for="(digit, index) in digits"
          :key="index"
          ref="boxes"
          v-model="digits[index]"
          class="otp-form__box"
          :class="{ 'otp-form__box--filled': digit !== '' }"
          type="text"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          :aria-label="`Digit ${index + 1}`"
          @input="onDigitInput(index, $event)"
          @keydown="onDigitKeydown(index, $event)"
          @paste="onDigitPaste(index, $event)"
        />
      </fieldset>

      <AppButton type="submit" size="lg" block variant="gold" :disabled="verifying || !complete">
        <AppIcon v-if="verifying" name="refresh" :size="17" class="otp-form__spinner" />
        {{ verifying ? t('auth.verifying') : t('auth.verify') }}
      </AppButton>

      <div class="otp-form__footer">
        <span v-if="!canResend" class="otp-form__timer">
          <AppIcon name="clock" :size="15" />
          {{ t('auth.resendTimer', { seconds: resendLeft }) }}
        </span>
        <button v-else type="button" class="otp-form__resend" @click="resend">
          <AppIcon name="refresh" :size="15" />
          {{ t('auth.resend') }}
        </button>

        <button type="button" class="otp-form__back" @click="goBack">
          <AppIcon name="arrow-left" :size="15" />
          {{ t('auth.backToLogin') }}
        </button>
      </div>
    </form>
  </AuthLayout>
</template>

<style scoped>
.otp-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.otp-form__error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.9rem;
  border-radius: var(--dz-radius);
  background: var(--dz-danger-soft);
  border: 1px solid color-mix(in srgb, var(--dz-danger) 25%, var(--dz-border));
  color: var(--dz-danger);
  font-size: 0.85rem;
  font-weight: 600;
}

.otp-form__boxes {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  border: none;
}

.otp-form__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.otp-form__box {
  width: 2.9rem;
  height: 3.3rem;
  text-align: center;
  font-family: var(--dz-font-mono);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--dz-ink);
  background: var(--dz-surface);
  border: 1.5px solid var(--dz-border-strong);
  border-radius: var(--dz-radius);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.otp-form__box:focus {
  outline: none;
  border-color: var(--dz-primary);
  box-shadow: 0 0 0 3px var(--dz-primary-soft);
}

.otp-form__box--filled {
  border-color: var(--dz-gold);
  background: var(--dz-gold-faint);
}

.otp-form__box::selection {
  background: var(--dz-primary-soft);
}

.otp-form__spinner {
  animation: otp-spin 0.8s linear infinite;
}

.otp-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.35rem;
}

.otp-form__timer,
.otp-form__resend,
.otp-form__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.otp-form__timer {
  color: var(--dz-muted);
}

.otp-form__resend {
  background: none;
  border: none;
  padding: 0.3rem 0.5rem;
  color: var(--dz-primary);
  cursor: pointer;
  border-radius: var(--dz-radius-sm);
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.otp-form__resend:hover {
  background: var(--dz-primary-faint);
}

.otp-form__back {
  background: none;
  border: none;
  padding: 0.3rem 0.5rem;
  color: var(--dz-muted);
  cursor: pointer;
  border-radius: var(--dz-radius-sm);
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.otp-form__back:hover {
  color: var(--dz-primary);
  background: var(--dz-surface-soft);
}

.otp-form__resend svg,
.otp-form__back svg {
  color: currentcolor;
  flex-shrink: 0;
}

html[dir='rtl'] .otp-form__back svg {
  transform: scaleX(-1);
}

@keyframes otp-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 420px) {
  .otp-form__boxes {
    gap: 0.35rem;
  }

  .otp-form__box {
    width: 2.35rem;
    height: 2.85rem;
    font-size: 1.1rem;
  }

  .otp-form__footer {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
}

@media (max-width: 360px) {
  .otp-form__boxes {
    gap: 0.25rem;
  }

  .otp-form__box {
    width: 2.1rem;
    height: 2.6rem;
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .otp-form__box {
    transition: none;
  }
}
</style>