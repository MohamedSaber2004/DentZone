<script setup lang="ts">
import { useRouter } from 'vue-router'
import { toastService } from '../../application/toast.service'
import { t } from '../../i18n'
import AuthLayout from '../../components/auth/AuthLayout.vue'
import ResetPasswordForm from '../../components/auth/ResetPasswordForm.vue'

const router = useRouter()

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
