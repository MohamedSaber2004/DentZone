<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../application/auth.service'
import { toastService } from '../application/toast.service'
import { wishlistService } from '../application/wishlist.service'
import { t } from '../i18n'
import AppInput from '../components/ui/AppInput.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import SectionHeader from '../components/ui/SectionHeader.vue'

const router = useRouter()

const user = computed(() => authService.user.value)

const form = reactive({
  firstName: user.value?.firstName ?? '',
  lastName: user.value?.lastName ?? '',
  email: user.value?.email ?? '',
  phone: user.value?.phone ?? '',
})

const saving = ref(false)
const formError = ref('')

const initials = computed(() =>
  `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase() || 'DZ',
)

onMounted(() => {
  void authService.fetchProfile()
})

watch(authService.user, (next) => {
  if (next) {
    form.firstName = next.firstName
    form.lastName = next.lastName
    form.email = next.email
    form.phone = next.phone
  }
})

const saveProfile = async () => {
  formError.value = ''
  if (!form.firstName.trim() || !form.lastName.trim()) {
    formError.value = t('profile.errRequired')
    return
  }
  saving.value = true
  const result = await authService.updateProfile({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  })
  saving.value = false
  if (!result.ok) {
    formError.value = t(result.error)
    return
  }
  toastService.success(t('profile.savedToast'))
}

const passwordOpen = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const changing = ref(false)

const savePassword = async () => {
  passwordError.value = ''
  if (newPassword.value.length < 8) {
    passwordError.value = t('auth.passwordMin')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t('auth.passwordMismatch')
    return
  }
  changing.value = true
  const result = await authService.changePassword(currentPassword.value, newPassword.value)
  changing.value = false
  if (!result.ok) {
    passwordError.value = t(result.error)
    return
  }
  passwordOpen.value = false
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  toastService.success(t('profile.passwordUpdatedToast'))
}

const logout = () => {
  void authService.logout()
  toastService.info(t('auth.logoutToast'))
  void router.push('/')
}

const ordersComingSoon = () => {
  toastService.info(t('auth.ordersComingSoon'))
}
</script>

<template>
  <div class="container page">
    <SectionHeader :title="t('profile.title')" />

    <div v-if="user" class="profile">
      <div class="profile__main">
        <section class="profile__card profile__hero">
          <span class="profile__avatar" :style="{ '--tint': user.tint }" aria-hidden="true">
            {{ initials }}
          </span>
          <div class="profile__hero-info">
            <h2 class="profile__name">{{ user.firstName }} {{ user.lastName }}</h2>
            <p class="profile__email">{{ user.email }}</p>
          </div>
        </section>

        <section class="profile__card">
          <h3 class="profile__heading">{{ t('profile.personalInfo') }}</h3>
          <div v-if="formError" class="profile__error" role="alert">
            <AppIcon name="alert-circle" :size="16" />
            {{ formError }}
          </div>
          <div class="profile__form">
            <AppInput v-model="form.firstName" :label="t('profile.firstName')" required autocomplete="given-name" />
            <AppInput v-model="form.lastName" :label="t('profile.lastName')" required autocomplete="family-name" />
            <AppInput v-model="form.email" :label="t('profile.email')" type="email" required autocomplete="email" />
            <AppInput v-model="form.phone" :label="t('profile.phone')" type="tel" autocomplete="tel" />
          </div>
          <div class="profile__actions">
            <AppButton :disabled="saving" @click="saveProfile">
              {{ saving ? t('profile.saving') : t('profile.saveChanges') }}
            </AppButton>
          </div>
        </section>

        <section class="profile__card">
          <div class="profile__security-head">
            <div>
              <h3 class="profile__heading">{{ t('profile.security') }}</h3>
              <p class="profile__muted">{{ t('profile.changePasswordDesc') }}</p>
            </div>
            <AppButton
              variant="outline"
              size="sm"
              @click="passwordOpen = !passwordOpen"
            >
              {{ passwordOpen ? '✕' : t('profile.changePassword') }}
            </AppButton>
          </div>
          <div v-if="passwordOpen" class="profile__form">
            <AppInput
              v-model="currentPassword"
              :label="t('profile.currentPassword')"
              type="password"
              required
              autocomplete="current-password"
            />
            <AppInput
              v-model="newPassword"
              :label="t('auth.newPassword')"
              type="password"
              required
              autocomplete="new-password"
            />
            <AppInput
              v-model="confirmPassword"
              :label="t('auth.confirmPassword')"
              type="password"
              required
              autocomplete="new-password"
            />
            <div v-if="passwordError" class="profile__error" role="alert">
              <AppIcon name="alert-circle" :size="16" />
              {{ passwordError }}
            </div>
            <div class="profile__actions">
              <AppButton :disabled="changing" @click="savePassword">
                {{ t('profile.changePassword') }}
              </AppButton>
            </div>
          </div>
        </section>
      </div>

      <div class="profile__side">
        <section class="profile__card">
          <h3 class="profile__heading">{{ t('profile.shortcuts') }}</h3>
          <nav class="profile__links">
            <RouterLink to="/wishlist" class="profile__link">
              <AppIcon name="heart" :size="17" />
              {{ t('profile.wishlistShortcut') }}
              <span v-if="wishlistService.count.value" class="profile__link-count">
                {{ wishlistService.count.value }}
              </span>
            </RouterLink>
            <button type="button" class="profile__link" @click="ordersComingSoon">
              <AppIcon name="box" :size="17" />
              {{ t('profile.ordersShortcut') }}
            </button>
          </nav>
        </section>

        <section class="profile__card">
          <h3 class="profile__heading">{{ t('profile.account') }}</h3>
          <nav class="profile__links">
            <button type="button" class="profile__link profile__link--danger" @click="logout">
              <AppIcon name="logout" :size="17" />
              {{ t('profile.logout') }}
            </button>
          </nav>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
}

.profile__main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile__side {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: calc(var(--dz-header-height) + 1.25rem);
}

.profile__card {
  padding: 1.5rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-sm);
}

.profile__hero {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.profile__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: color-mix(in srgb, var(--tint) 16%, var(--dz-surface-soft));
  border: 1px solid color-mix(in srgb, var(--tint) 26%, var(--dz-border));
  color: color-mix(in srgb, var(--tint) 80%, var(--dz-ink));
  font-family: var(--dz-font-display);
  font-size: 1.7rem;
  font-weight: 700;
}

.profile__name {
  font-size: 1.25rem;
}

.profile__email {
  color: var(--dz-muted);
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

.profile__heading {
  font-size: 1rem;
  margin-bottom: 1.1rem;
}

.profile__muted {
  color: var(--dz-muted);
  font-size: 0.82rem;
  margin-top: -0.6rem;
  margin-bottom: 1.1rem;
}

.profile__security-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.profile__form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.profile__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}

.profile__error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0.85rem;
  margin-bottom: 1rem;
  border-radius: var(--dz-radius);
  background: var(--dz-danger-soft);
  border: 1px solid color-mix(in srgb, var(--dz-danger) 25%, var(--dz-border));
  color: var(--dz-danger);
  font-size: 0.82rem;
  font-weight: 600;
}

.profile__links {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.profile__link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 0.9rem;
  border-radius: var(--dz-radius);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  text-align: start;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.profile__link:hover {
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.profile__link svg {
  color: var(--dz-primary);
  flex-shrink: 0;
}

.profile__link--danger {
  color: var(--dz-danger);
}

.profile__link--danger:hover {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.profile__link--danger svg {
  color: var(--dz-danger);
}

.profile__link-count {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.35rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  font-family: var(--dz-font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
}

@media (max-width: 900px) {
  .profile {
    grid-template-columns: 1fr;
  }

  .profile__side {
    position: static;
  }
}

@media (max-width: 640px) {
  .profile__form {
    grid-template-columns: 1fr;
  }

  .profile__security-head {
    flex-direction: column;
  }
}
</style>