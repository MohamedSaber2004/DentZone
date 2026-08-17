<script setup lang="ts">
import { useRouter } from 'vue-router'
import { t } from '../../i18n'
import AuthLayout from '../../components/auth/AuthLayout.vue'
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm.vue'

const router = useRouter()

const onSent = () => {
  void router.push('/auth/verify-otp')
}
</script>

<template>
  <AuthLayout :title="t('auth.forgotTitle')" :subtitle="t('auth.forgotSubtitle')">
    <ForgotPasswordForm @sent="onSent" />
  </AuthLayout>
</template>
