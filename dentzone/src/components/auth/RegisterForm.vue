<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { services } from '../../di/container'
import { t } from '../../i18n'
import { toastService } from '../../infrastructure/feedback/toast.service'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'
import AppIcon from '../ui/AppIcon.vue'

const router = useRouter()
const route = useRoute()
const { authService, cartService } = services

const fullName = ref('')
const phoneNumber = ref('')
const email = ref('')
const password = ref('')

const fullNameError = ref('')
const phoneError = ref('')
const emailError = ref('')
const passwordError = ref('')
const error = ref('')
const submitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {},
)

const validate = (): boolean => {
  fullNameError.value = ''
  phoneError.value = ''
  emailError.value = ''
  passwordError.value = ''
  error.value = ''
  let valid = true

  const name = fullName.value.trim()
  if (name.length < 2) {
    fullNameError.value = t('auth.errNameRequired')
    valid = false
  }

  const phone = phoneNumber.value.trim()
  if (!phone) {
    phoneError.value = t('auth.errPhoneRequired')
    valid = false
  } else if (phone.replace(/\D/g, '').length < 8) {
    phoneError.value = t('auth.errPhoneInvalid')
    valid = false
  }

  const emailValue = email.value.trim()
  if (!emailValue) {
    emailError.value = t('auth.errEmailRequired')
    valid = false
  } else if (!EMAIL_PATTERN.test(emailValue)) {
    emailError.value = t('auth.errEmailInvalid')
    valid = false
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    passwordError.value = t('auth.errPasswordTooShort', { min: MIN_PASSWORD_LENGTH })
    valid = false
  }

  return valid
}

const submit = async () => {
  if (!validate() || submitting.value) return
  submitting.value = true
  const result = await authService.register({
    fullName: fullName.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
    email: email.value.trim(),
    password: password.value,
  })
  if (!result.ok) {
    submitting.value = false
    error.value = result.error
    return
  }
  try {
    await cartService.syncGuestCartToServer()
  } catch {
    // Continue navigation even if sync fails partially
  } finally {
    submitting.value = false
  }
  const user = authService.user.value
  if (user?.firstName) toastService.success(t('auth.registerWelcome', { name: user.firstName }))
  const redirect =
    typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/'
  void router.push(redirect)
}
</script>

<template>
  <form class="register-form" novalidate @submit.prevent="submit">
    <div v-if="error" class="register-form__error" role="alert">
      <AppIcon name="alert-circle" :size="17" />
      {{ error }}
    </div>

    <AppInput
      v-model="fullName"
      :label="t('auth.fullName')"
      type="text"
      :placeholder="t('auth.namePlaceholder')"
      :error="fullNameError"
      required
      autocomplete="name"
    />
    <AppInput
      v-model="phoneNumber"
      :label="t('auth.phoneNumber')"
      type="tel"
      :placeholder="t('auth.phonePlaceholder')"
      :error="phoneError"
      required
      autocomplete="tel"
    />
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
      autocomplete="new-password"
    />

    <AppButton type="submit" size="lg" block :disabled="submitting">
      <AppIcon v-if="submitting" name="refresh" :size="17" class="register-form__spinner" />
      {{ submitting ? t('auth.creatingAccount') : t('auth.createAccount') }}
    </AppButton>

    <p class="register-form__alt">
      {{ t('auth.alreadyHaveAccount') }}
      <RouterLink :to="{ name: 'login', query: redirectQuery }" class="register-form__alt-link">
        {{ t('auth.login') }}
      </RouterLink>
    </p>
  </form>
</template>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.register-form__error {
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

.register-form__alt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--dz-muted);
}

.register-form__alt-link {
  font-weight: 700;
  color: var(--dz-primary);
  text-decoration: none;
  padding: 0.2rem 0.3rem;
  border-radius: var(--dz-radius-sm);
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.register-form__alt-link:hover {
  color: var(--dz-primary-strong);
  background: var(--dz-primary-faint);
}

.register-form__spinner {
  animation: register-spin 0.8s linear infinite;
}

@keyframes register-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
