<script setup lang="ts">
import { services } from '../di/container'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../i18n'
import { toastService } from '../infrastructure/feedback/toast.service'
import AuthLayout from '../components/auth/AuthLayout.vue'
import PasswordFlowSteps from '../components/auth/PasswordFlowSteps.vue'
import AppInput from '../components/ui/AppInput.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'

const router = useRouter()
const { authService } = services

const email = ref('')
const error = ref('')
const emailError = ref('')
const submitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submit = async () => {
  error.value = ''
  emailError.value = ''
  if (!email.value.trim()) {
    emailError.value = t('auth.errEmailRequired')
    return
  }
  if (!EMAIL_PATTERN.test(email.value.trim())) {
    emailError.value = t('auth.errEmailInvalid')
    return
  }
  submitting.value = true
  const result = await authService.forgotPassword(email.value.trim())
  submitting.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  toastService.success(t('auth.codeSent', { email: email.value.trim() }))
  void router.push({ name: 'verify-otp', query: { email: email.value.trim() } })
}
</script>

<template>
  <AuthLayout :title="t('auth.forgotTitle')" :subtitle="t('auth.forgotSubtitle')">
    <PasswordFlowSteps :current="1" />

    <form class="pw-form" novalidate @submit.prevent="submit">
      <div v-if="error" class="pw-form__error" role="alert">
        <AppIcon name="alert-circle" :size="17" />
        {{ error }}
      </div>

      <AppInput
        v-model="email"
        :label="t('auth.email')"
        type="email"
        placeholder="user@dentzone.com"
        :error="emailError"
        autocomplete="email"
        autofocus
      />

      <AppButton type="submit" size="lg" block variant="gold" :disabled="submitting">
        <AppIcon v-if="submitting" name="refresh" :size="17" class="pw-form__spinner" />
        {{ submitting ? t('auth.sendingCode') : t('auth.sendCode') }}
      </AppButton>

      <button type="button" class="pw-form__back" @click="router.push({ name: 'login' })">
        <AppIcon name="arrow-left" :size="15" />
        {{ t('auth.backToLogin') }}
      </button>
    </form>
  </AuthLayout>
</template>

<style scoped>
.pw-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pw-form__error {
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

.pw-form__spinner {
  animation: pw-spin 0.8s linear infinite;
}

.pw-form__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  align-self: center;
  background: none;
  border: none;
  padding: 0.4rem 0.6rem;
  color: var(--dz-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--dz-radius-sm);
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.pw-form__back:hover {
  color: var(--dz-primary);
  background: var(--dz-surface-soft);
}

.pw-form__back svg {
  color: currentcolor;
}

html[dir='rtl'] .pw-form__back svg {
  transform: scaleX(-1);
}

@keyframes pw-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>