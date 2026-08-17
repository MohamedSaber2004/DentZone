<script setup lang="ts">
import { t } from '../../i18n'
import AuthLayout from '../../components/auth/AuthLayout.vue'
import LoginForm from '../../components/auth/LoginForm.vue'
</script>

<template>
  <AuthLayout :title="t('auth.loginTitle')" :subtitle="t('auth.loginSubtitle')">
    <LoginForm />
  </AuthLayout>
</template>
