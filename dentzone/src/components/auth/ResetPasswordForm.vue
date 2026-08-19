<script setup lang="ts">
import { services } from '../../di/container'
import { ref } from 'vue'
const { authService } = services
import { t } from '../../i18n'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'
import AppIcon from '../ui/AppIcon.vue'

const emit = defineEmits<{
  success: []
}>()

const password = ref('')
const confirm = ref('')
const error = ref('')
const submitting = ref(false)

const submit = async () => {
  error.value = ''
  if (password.value.length < 8) {
    error.value = t('auth.passwordMin')
    return
  }
  if (password.value !== confirm.value) {
    error.value = t('auth.passwordMismatch')
    return
  }
  submitting.value = true
  await authService.resetPassword(password.value)
  submitting.value = false
  emit('success')
}
</script>

<template>
  <form class="reset-form" novalidate @submit.prevent="submit">
    <div v-if="error" class="reset-form__error" role="alert">
      <AppIcon name="alert-circle" :size="17" />
      {{ error }}
    </div>

    <AppInput
      v-model="password"
      :label="t('auth.newPassword')"
      type="password"
      placeholder="••••••••"
      required
      autocomplete="new-password"
    />
    <AppInput
      v-model="confirm"
      :label="t('auth.confirmPassword')"
      type="password"
      placeholder="••••••••"
      required
      autocomplete="new-password"
    />

    <AppButton type="submit" size="lg" block :disabled="submitting">
      <AppIcon v-if="submitting" name="refresh" :size="17" class="reset-form__spinner" />
      {{ submitting ? t('auth.resetting') : t('auth.resetPassword') }}
    </AppButton>
  </form>
</template>

<style scoped>
.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reset-form__error {
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

.reset-form__spinner {
  animation: reset-spin 0.8s linear infinite;
}

@keyframes reset-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>