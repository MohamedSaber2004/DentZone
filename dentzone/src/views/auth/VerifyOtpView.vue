<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../application/auth.service'
import { t } from '../../i18n'
import AuthLayout from '../../components/auth/AuthLayout.vue'
import OtpInput from '../../components/auth/OtpInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import AppIcon from '../../components/ui/AppIcon.vue'

const router = useRouter()

const code = ref('')
const error = ref('')
const verifying = ref(false)
const resendSeconds = ref(0)
let resendTimer: ReturnType<typeof setInterval> | undefined

const email = computed(() => authService.pendingEmailValue)

const startResendTimer = () => {
  resendSeconds.value = 30
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendSeconds.value -= 1
    if (resendSeconds.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = undefined
    }
  }, 1000)
}

const verify = async () => {
  error.value = ''
  if (code.value.length !== 6) {
    error.value = t('auth.errInvalidOtp')
    return
  }
  verifying.value = true
  const result = await authService.verifyOtp(code.value)
  verifying.value = false
  if (!result.ok) {
    error.value = t(result.error)
    code.value = ''
    return
  }
  void router.push('/auth/reset-password')
}

const resend = async () => {
  error.value = ''
  if (email.value) {
    await authService.requestOtp(email.value)
  }
  startResendTimer()
}

onMounted(() => {
  startResendTimer()
})
</script>

<template>
  <AuthLayout :title="t('auth.verifyTitle')" :subtitle="t('auth.verifySubtitle', { email: email || '…' })">
    <div class="verify">
      <div v-if="error" class="verify__error" role="alert">
        <AppIcon name="alert-circle" :size="17" />
        {{ error }}
      </div>

      <OtpInput v-model="code" @complete="verify" />

      <AppButton size="lg" block :disabled="verifying || code.length !== 6" @click="verify">
        <AppIcon v-if="verifying" name="refresh" :size="17" class="verify__spinner" />
        {{ verifying ? t('auth.verifying') : t('auth.verify') }}
      </AppButton>

      <div class="verify__row">
        <button
          type="button"
          class="verify__resend"
          :disabled="resendSeconds > 0"
          @click="resend"
        >
          {{ resendSeconds > 0 ? t('auth.resendTimer', { seconds: resendSeconds }) : t('auth.resend') }}
        </button>
        <RouterLink to="/auth/forgot-password" class="verify__back">
          {{ t('auth.backToLogin') }}
        </RouterLink>
      </div>

      <p class="verify__hint">
        <AppIcon name="key" :size="14" />
        {{ t('auth.otpHint') }}
      </p>
    </div>
  </AuthLayout>
</template>

<style scoped>
.verify {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.verify__error {
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

.verify__spinner {
  animation: verify-spin 0.8s linear infinite;
}

@keyframes verify-spin {
  to {
    transform: rotate(360deg);
  }
}

.verify__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.verify__resend {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
}

.verify__resend:hover:not(:disabled) {
  text-decoration: underline;
}

.verify__resend:disabled {
  color: var(--dz-muted);
  cursor: not-allowed;
}

.verify__back {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.verify__back:hover {
  color: var(--dz-primary-strong);
}

.verify__hint {
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