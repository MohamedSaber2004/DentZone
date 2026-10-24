<script setup lang="ts">
import { t } from '../../i18n'
import AuthLayout from '../../components/auth/AuthLayout.vue'
import RegisterForm from '../../components/auth/RegisterForm.vue'
</script>

<template>
  <AuthLayout :title="t('auth.registerTitle')" :subtitle="t('auth.registerSubtitle')">
    <RegisterForm />
  </AuthLayout>
</template>
