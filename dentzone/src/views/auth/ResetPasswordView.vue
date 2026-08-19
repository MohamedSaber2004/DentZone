<script setup lang="ts">
import { services } from '../../di/container'
import { onMounted } from 'vue'
const { authService } = services
import { useRouter } from 'vue-router'
import { toastService } from '../../infrastructure/feedback/toast.service'
import { t } from '../../i18n'
import AuthLayout from '../../components/auth/AuthLayout.vue'
import ResetPasswordForm from '../../components/auth/ResetPasswordForm.vue'

const router = useRouter()

onMounted(() => {
  if (!authService.pendingEmailValue) {
    void router.push('/auth/forgot-password')
  }
})

const onSuccess = () => {
  toastService.success(t('auth.passwordChanged'))
  void router.push('/auth/login')
}
</script>

<template>
  <AuthLayout :title="t('auth.resetTitle')" :subtitle="t('auth.resetSubtitle')">
    <ResetPasswordForm @success="onSuccess" />
  </AuthLayout>
</template>
