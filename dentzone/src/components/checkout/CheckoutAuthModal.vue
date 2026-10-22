<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { services } from '../../di/container'
import { t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'

const props = defineProps<{
  isOpen: boolean
  areaId?: number
  addressLine?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const { authService } = services

const activeTab = ref<'login' | 'register'>('login')
const dialogRef = ref<HTMLDivElement | null>(null)
let previouslyFocused: HTMLElement | null = null

// Login form state
const loginEmail = ref('')
const loginPassword = ref('')
const loginEmailError = ref('')
const loginPasswordError = ref('')
const loginError = ref('')
const loginLoading = ref(false)

// Register form state
const regFullName = ref('')
const regPhone = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regNameError = ref('')
const regPhoneError = ref('')
const regEmailError = ref('')
const regPasswordError = ref('')
const regError = ref('')
const regLoading = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const resetErrors = () => {
  loginEmailError.value = ''
  loginPasswordError.value = ''
  loginError.value = ''
  regNameError.value = ''
  regPhoneError.value = ''
  regEmailError.value = ''
  regPasswordError.value = ''
  regError.value = ''
}

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      resetErrors()
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      dialogRef.value?.focus()
    } else if (previouslyFocused) {
      previouslyFocused.focus()
      previouslyFocused = null
    }
  },
)

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    event.stopPropagation()
    emit('close')
  }
}

document.addEventListener('keydown', handleKeydown)
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

const validateLogin = (): boolean => {
  loginEmailError.value = ''
  loginPasswordError.value = ''
  loginError.value = ''
  let valid = true

  const emailVal = loginEmail.value.trim()
  if (!emailVal) {
    loginEmailError.value = t('auth.errEmailRequired')
    valid = false
  }

  if (!loginPassword.value) {
    loginPasswordError.value = t('auth.errPasswordRequired')
    valid = false
  }

  return valid
}

const submitLogin = async () => {
  if (!validateLogin() || loginLoading.value) return
  loginLoading.value = true
  loginError.value = ''
  try {
    const result = await authService.login(loginEmail.value.trim(), loginPassword.value)
    if (!result.ok) {
      loginError.value = result.error
      return
    }
    emit('success')
  } catch {
    loginError.value = t('auth.errInvalidCredentials')
  } finally {
    loginLoading.value = false
  }
}

const validateRegister = (): boolean => {
  regNameError.value = ''
  regPhoneError.value = ''
  regEmailError.value = ''
  regPasswordError.value = ''
  regError.value = ''
  let valid = true

  const nameVal = regFullName.value.trim()
  if (!nameVal || nameVal.length < 2) {
    regNameError.value = t('checkout.errNameRequired')
    valid = false
  }

  const phoneVal = regPhone.value.trim()
  if (!phoneVal) {
    regPhoneError.value = t('checkout.errPhoneRequired')
    valid = false
  }

  const emailVal = regEmail.value.trim()
  if (!emailVal) {
    regEmailError.value = t('auth.errEmailRequired')
    valid = false
  } else if (!EMAIL_PATTERN.test(emailVal)) {
    regEmailError.value = t('auth.errEmailInvalid')
    valid = false
  }

  if (!regPassword.value || regPassword.value.length < 6) {
    regPasswordError.value = t('auth.errPasswordRequired')
    valid = false
  }

  return valid
}

const submitRegister = async () => {
  if (!validateRegister() || regLoading.value) return
  regLoading.value = true
  regError.value = ''
  try {
    const result = await authService.register({
      fullName: regFullName.value.trim(),
      email: regEmail.value.trim(),
      phoneNumber: regPhone.value.trim(),
      password: regPassword.value,
      areaId: props.areaId,
      addressLines: props.addressLine ? [props.addressLine] : undefined,
    })
    if (!result.ok) {
      regError.value = result.error
      return
    }
    emit('success')
  } catch {
    regError.value = t('auth.registerError')
  } finally {
    regLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="auth-modal">
      <div v-if="isOpen" class="auth-modal__backdrop" @click.self="emit('close')">
        <div
          ref="dialogRef"
          class="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          tabindex="-1"
        >
          <button
            type="button"
            class="auth-modal__close"
            :aria-label="t('chat.close')"
            @click="emit('close')"
          >
            <AppIcon name="close" :size="18" />
          </button>

          <div class="auth-modal__header">
            <div class="auth-modal__icon">
              <AppIcon name="user" :size="24" />
            </div>
            <h2 id="auth-modal-title" class="auth-modal__title">
              {{ t('checkout.authModalTitle') }}
            </h2>
            <p class="auth-modal__subtitle">
              {{ t('checkout.authModalSubtitle') }}
            </p>
          </div>

          <div class="auth-modal__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              class="auth-modal__tab"
              :class="{ 'auth-modal__tab--active': activeTab === 'login' }"
              :aria-selected="activeTab === 'login'"
              @click="activeTab = 'login'"
            >
              <AppIcon name="lock" :size="16" />
              <span>{{ t('checkout.tabLogin') }}</span>
            </button>
            <button
              type="button"
              role="tab"
              class="auth-modal__tab"
              :class="{ 'auth-modal__tab--active': activeTab === 'register' }"
              :aria-selected="activeTab === 'register'"
              @click="activeTab = 'register'"
            >
              <AppIcon name="user" :size="16" />
              <span>{{ t('checkout.tabRegister') }}</span>
            </button>
          </div>

          <!-- LOGIN TAB -->
          <form
            v-if="activeTab === 'login'"
            class="auth-modal__form"
            novalidate
            @submit.prevent="submitLogin"
          >
            <div v-if="loginError" class="auth-modal__error-box" role="alert">
              <AppIcon name="alert-circle" :size="18" />
              <span>{{ loginError }}</span>
            </div>

            <AppInput
              v-model="loginEmail"
              :label="t('auth.email')"
              type="text"
              placeholder="user@dentzone.com"
              :error="loginEmailError"
              required
              autocomplete="username email"
            />

            <AppInput
              v-model="loginPassword"
              :label="t('auth.password')"
              type="password"
              placeholder="••••••••"
              :error="loginPasswordError"
              required
              autocomplete="current-password"
            />

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              class="auth-modal__submit"
              :disabled="loginLoading"
            >
              <AppIcon v-if="loginLoading" name="refresh" :size="16" class="auth-modal__spinner" />
              {{ loginLoading ? t('auth.loggingIn') : t('checkout.loginAndContinue') }}
            </AppButton>
          </form>

          <!-- REGISTER TAB -->
          <form
            v-else
            class="auth-modal__form"
            novalidate
            @submit.prevent="submitRegister"
          >
            <div v-if="regError" class="auth-modal__error-box" role="alert">
              <AppIcon name="alert-circle" :size="18" />
              <span>{{ regError }}</span>
            </div>

            <AppInput
              v-model="regFullName"
              :label="t('checkout.fullName')"
              type="text"
              :placeholder="t('checkout.namePlaceholder')"
              :error="regNameError"
              required
              autocomplete="name"
            />

            <AppInput
              v-model="regPhone"
              :label="t('checkout.phone')"
              type="tel"
              inputmode="tel"
              :placeholder="t('checkout.phonePlaceholder')"
              :error="regPhoneError"
              required
              autocomplete="tel"
            />

            <AppInput
              v-model="regEmail"
              :label="t('auth.email')"
              type="email"
              placeholder="user@dentzone.com"
              :error="regEmailError"
              required
              autocomplete="email"
            />

            <AppInput
              v-model="regPassword"
              :label="t('auth.password')"
              type="password"
              placeholder="••••••••"
              :error="regPasswordError"
              required
              autocomplete="new-password"
            />

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              class="auth-modal__submit"
              :disabled="regLoading"
            >
              <AppIcon v-if="regLoading" name="refresh" :size="16" class="auth-modal__spinner" />
              {{ regLoading ? t('common.loading') : t('checkout.registerAndContinue') }}
            </AppButton>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
}

.auth-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(460px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.75rem;
  border-radius: var(--dz-radius-xl);
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  box-shadow: var(--dz-shadow-xl);
}

.auth-modal:focus {
  outline: none;
}

.auth-modal__close {
  position: absolute;
  top: 1rem;
  inset-inline-end: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border: none;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-modal__close:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.auth-modal__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.auth-modal__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  margin-bottom: 0.75rem;
}

.auth-modal__title {
  font-family: var(--dz-font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--dz-ink);
  margin: 0;
}

.auth-modal__subtitle {
  font-size: 0.88rem;
  color: var(--dz-muted);
  margin-top: 0.35rem;
  max-width: 34ch;
  line-height: 1.4;
}

.auth-modal__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  padding: 0.3rem;
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-lg);
  margin-bottom: 1.25rem;
}

.auth-modal__tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border: none;
  border-radius: var(--dz-radius);
  background: transparent;
  color: var(--dz-muted);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-modal__tab:hover:not(.auth-modal__tab--active) {
  color: var(--dz-ink);
}

.auth-modal__tab--active {
  background: var(--dz-surface);
  color: var(--dz-primary-strong);
  box-shadow: var(--dz-shadow-xs);
}

.auth-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.auth-modal__error-box {
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

.auth-modal__submit {
  width: 100%;
  margin-top: 0.5rem;
}

.auth-modal__spinner {
  animation: auth-spin 0.8s linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal Transition */
.auth-modal-enter-active,
.auth-modal-leave-active {
  transition: opacity 0.2s ease;
}

.auth-modal-enter-from,
.auth-modal-leave-to {
  opacity: 0;
}

.auth-modal-enter-active .auth-modal,
.auth-modal-leave-active .auth-modal {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.auth-modal-enter-from .auth-modal,
.auth-modal-leave-to .auth-modal {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}
</style>
