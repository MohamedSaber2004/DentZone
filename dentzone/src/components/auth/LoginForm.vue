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
const submitting = ref(false)
const mode = ref<'ordinal' | 'guest'>('ordinal')

const submit = async () => {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = t('auth.errInvalidCredentials')
    return
  }
  submitting.value = true
  const result = mode.value === 'guest' ? await authService.loginGuest(email.value, password.value) : await authService.login(email.value, password.value)
  submitting.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  void router.push(redirect)
}
</script>

<template>
  <form class="login-form" novalidate @submit.prevent="submit">
    <div class="login-form__tabs" role="tablist">
      <button
        type="button"
        class="login-form__tab"
        :class="{ 'login-form__tab--active': mode === 'ordinal' }"
        role="tab"
        :aria-selected="mode === 'ordinal'"
        @click="mode = 'ordinal'"
      >
        {{ t('auth.ordinalLogin') }}
      </button>
      <button
        type="button"
        class="login-form__tab"
        :class="{ 'login-form__tab--active': mode === 'guest' }"
        role="tab"
        :aria-selected="mode === 'guest'"
        @click="mode = 'guest'"
      >
        {{ t('auth.guestLogin') }}
      </button>
    </div>

    <p v-if="mode === 'guest'" class="login-form__guest-note">
      <AppIcon name="user" :size="14" />
      {{ t('auth.guestSubtitle') }}
    </p>

    <div v-if="error" class="login-form__error" role="alert">
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
    <AppInput
      v-model="password"
      :label="t('auth.password')"
      type="password"
      placeholder="••••••••"
      required
      autocomplete="current-password"
    />

    <div class="login-form__row">
      <RouterLink to="/auth/forgot-password" class="login-form__forgot">
        {{ t('auth.forgotPassword') }}
      </RouterLink>
    </div>

    <AppButton type="submit" size="lg" block :disabled="submitting">
      <AppIcon v-if="submitting" name="refresh" :size="17" class="login-form__spinner" />
      {{ submitting ? t('auth.loggingIn') : t('auth.login') }}
    </AppButton>

    <!--<p class="login-form__hint">
      <AppIcon name="key" :size="14" />
      {{ t('auth.demoHint') }}
    </p>-->
  </form>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  padding: 0.3rem;
  background: var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
}

.login-form__tab {
  padding: 0.55rem 0.75rem;
  border-radius: var(--dz-radius);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-muted);
  transition:
    background-color 0.2s,
    color 0.2s;
}

.login-form__tab:hover {
  color: var(--dz-primary-strong);
}

.login-form__tab--active {
  background: var(--dz-surface);
  color: var(--dz-primary-strong);
  box-shadow: var(--dz-shadow-sm);
}

.login-form__guest-note {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.8rem;
  border-radius: var(--dz-radius);
  background: var(--dz-gold-faint);
  border: 1px dashed color-mix(in srgb, var(--dz-gold) 35%, var(--dz-border));
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-gold-strong);
}

.login-form__guest-note svg {
  flex-shrink: 0;
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

.login-form__row {
  display: flex;
  justify-content: flex-end;
}

.login-form__forgot {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
}

.login-form__forgot:hover {
  text-decoration: underline;
}

.login-form__spinner {
  animation: login-spin 0.8s linear infinite;
}

@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}

.login-form__no-account {
  text-align: center;
  font-size: 0.88rem;
  color: var(--dz-muted);
}

.login-form__register {
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.login-form__register:hover {
  text-decoration: underline;
}

.login-form__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.8rem;
  border-radius: var(--dz-radius);
  background: var(--dz-gold-faint);
  border: 1px dashed color-mix(in srgb, var(--dz-gold) 35%, var(--dz-border));
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  color: var(--dz-gold-strong);
  text-align: center;
}
</style>
