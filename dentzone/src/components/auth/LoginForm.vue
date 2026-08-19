<script setup lang="ts">
import { services } from '../../di/container'
import { ref } from 'vue'
const { authService } = services
import { useRoute, useRouter } from 'vue-router'
import { t } from '../../i18n'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'
import AppIcon from '../ui/AppIcon.vue'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const emailError = ref('')
const passwordError = ref('')
const submitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validate = (): boolean => {
  emailError.value = ''
  passwordError.value = ''
  let valid = true

  if (!email.value.trim()) {
    emailError.value = t('auth.errEmailRequired')
    valid = false
  } else if (!EMAIL_PATTERN.test(email.value.trim())) {
    emailError.value = t('auth.errEmailInvalid')
    valid = false
  }

  if (!password.value) {
    passwordError.value = t('auth.errPasswordRequired')
    valid = false
  }

  return valid
}

const submit = async () => {
  error.value = ''
  if (!validate()) return
  submitting.value = true
  const result = await authService.login(email.value.trim(), password.value)
  submitting.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
  void router.push(redirect)
}
</script>

<template>
  <form class="login-form" novalidate @submit.prevent="submit">
    <div v-if="error" class="login-form__error" role="alert">
      <AppIcon name="alert-circle" :size="17" />
      {{ error }}
    </div>

    <AppInput
      v-model="email"
      :label="t('auth.email')"
      type="email"
      placeholder="user@dentzone.com"
      :error="emailError"
      required
      autocomplete="email"
    />
    <AppInput
      v-model="password"
      :label="t('auth.password')"
      type="password"
      placeholder="••••••••"
      :error="passwordError"
      required
      autocomplete="current-password"
    />

    <RouterLink :to="{ name: 'forgot-password' }" class="login-form__forgot">{{ t('auth.forgotPassword') }}</RouterLink>

    <AppButton type="submit" size="lg" block :disabled="submitting">
      <AppIcon v-if="submitting" name="refresh" :size="17" class="login-form__spinner" />
      {{ submitting ? t('auth.loggingIn') : t('auth.login') }}
    </AppButton>
  </form>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form__error {
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

.login-form__forgot {
  align-self: flex-end;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-primary);
  text-decoration: none;
  padding: 0.2rem 0.3rem;
  border-radius: var(--dz-radius-sm);
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.login-form__forgot:hover {
  color: var(--dz-primary-strong);
  background: var(--dz-primary-faint);
}

.login-form__spinner {
  animation: login-spin 0.8s linear infinite;
}

@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>