<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '../../application/auth.service'
import { t } from '../../i18n'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'
import AppIcon from '../ui/AppIcon.vue'

const emit = defineEmits<{
  sent: [email: string]
}>()

const email = ref('')
const error = ref('')
const submitting = ref(false)

const submit = async () => {
  error.value = ''
  if (!email.value.trim()) {
    error.value = t('auth.errEmailNotFound')
    return
  }
  submitting.value = true
  const result = await authService.requestOtp(email.value)
  submitting.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  emit('sent', email.value.trim())
}
</script>

<template>
  <form class="forgot-form" novalidate @submit.prevent="submit">
    <div v-if="error" class="forgot-form__error" role="alert">
      <AppIcon name="alert-circle" :size="17" />
      {{ error }}
    </div>

    <AppInput
      v-model="email"
      :label="t('auth.email')"
      type="email"
      placeholder="user@dentzone.com"
      required
      autocomplete="email"
    />

    <AppButton type="submit" size="lg" block :disabled="submitting">
      <AppIcon v-if="submitting" name="refresh" :size="17" class="forgot-form__spinner" />
      {{ submitting ? t('auth.sendingCode') : t('auth.sendCode') }}
    </AppButton>

    <RouterLink to="/auth/login" class="forgot-form__back">
      <AppIcon name="arrow-left" :size="14" />
      {{ t('auth.backToLogin') }}
    </RouterLink>
  </form>
</template>

<style scoped>
.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.forgot-form__error {
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

.forgot-form__spinner {
  animation: forgot-spin 0.8s linear infinite;
}

@keyframes forgot-spin {
  to {
    transform: rotate(360deg);
  }
}

.forgot-form__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-muted);
}

html[dir='rtl'] .forgot-form__back svg {
  transform: scaleX(-1);
}

.forgot-form__back:hover {
  color: var(--dz-primary-strong);
}
</style>