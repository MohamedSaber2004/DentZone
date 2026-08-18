<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../application/auth.service'
import { toastService } from '../application/toast.service'
import { wishlistService } from '../application/wishlist.service'
import { locale, setLocale, t } from '../i18n'
import AppInput from '../components/ui/AppInput.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import AppSelect, { type SelectOption } from '../components/ui/AppSelect.vue'
import SectionHeader from '../components/ui/SectionHeader.vue'

const router = useRouter()

const user = computed(() => authService.user.value)

const form = reactive<{
  firstName: string
  lastName: string
  email: string
  birthDate: string
  language: string
}>({
  firstName: user.value?.firstName ?? '',
  lastName: user.value?.lastName ?? '',
  email: user.value?.email ?? '',
  birthDate: user.value?.birthDate ?? '',
  language: locale.value,
})

const languageOptions: SelectOption[] = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
]

const saving = ref(false)
const formError = ref('')

const initials = computed(() =>
  `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase() || 'DZ',
)

const recordId = computed(() => (user.value?.id ?? 'dz').slice(0, 8).toUpperCase())

onMounted(() => {
  void authService.fetchProfile()
})

watch(authService.user, (next) => {
  if (next) {
    form.firstName = next.firstName
    form.lastName = next.lastName
    form.email = next.email
    form.birthDate = next.birthDate ?? ''
    form.language = locale.value
  }
})

const onLanguageChange = (value: string) => {
  form.language = value
  setLocale(value as 'en' | 'ar')
}

const saveProfile = async () => {
  formError.value = ''
  if (!form.firstName.trim() || !form.lastName.trim()) {
    formError.value = t('profile.errRequired')
    return
  }
  if (form.birthDate && new Date(form.birthDate).getTime() > Date.now()) {
    formError.value = t('profile.errBirthDateFuture')
    return
  }
  saving.value = true
  const result = await authService.updateProfile({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    birthDate: form.birthDate,
  })
  saving.value = false
  if (!result.ok) {
    formError.value = t(result.error)
  }
}

const passwordOpen = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const changing = ref(false)

const savePassword = async () => {
  passwordError.value = ''
  if (!currentPassword.value) {
    passwordError.value = t('profile.errCurrentPassword')
    return
  }
  if (newPassword.value.length < 8) {
    passwordError.value = t('auth.passwordMin')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t('auth.passwordMismatch')
    return
  }
  changing.value = true
  const result = await authService.changePassword(currentPassword.value, newPassword.value, confirmPassword.value)
  changing.value = false
  if (!result.ok) {
    passwordError.value = t(result.error)
    return
  }
  passwordOpen.value = false
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  void router.push({ name: 'login' })
}

const logout = () => {
  void authService.logout()
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
      <section class="chart" :style="{ '--tint': user.tint }">
        <span class="chart__stamp" aria-hidden="true">{{ initials }}</span>
        <div class="chart__identity">
          <p class="chart__eyebrow">
            {{ t('profile.recordId') }} <span class="chart__code">{{ recordId }}</span>
          </p>
          <h2 class="chart__name">{{ user.firstName }} {{ user.lastName }}</h2>
          <p class="chart__email">{{ user.email }}</p>
        </div>
        <span class="chart__status">
          <span class="chart__status-dot" />
          {{ t('profile.activeAccount') }}
        </span>
      </section>

      <div class="profile__grid">
        <div class="profile__main">
          <section class="profile__card">
            <div class="profile__card-head">
              <span class="profile__card-icon">
                <AppIcon name="user" :size="17" />
              </span>
              <div>
                <h3 class="profile__heading">{{ t('profile.personalInfo') }}</h3>
                <p class="profile__muted">{{ t('profile.personalInfoDesc') }}</p>
              </div>
            </div>
            <div v-if="formError" class="profile__alert" role="alert">
              <AppIcon name="alert-circle" :size="16" />
              {{ formError }}
            </div>
            <div class="profile__email-row">
              <span class="profile__email-icon">
                <AppIcon name="mail" :size="16" />
              </span>
              <div class="profile__email-info">
                <span class="profile__email-label">{{ t('profile.email') }}</span>
                <span class="profile__email-value">{{ form.email }}</span>
              </div>
              <span class="profile__email-note">{{ t('profile.emailReadOnly') }}</span>
            </div>
            <div class="profile__form">
              <AppInput v-model="form.firstName" :label="t('profile.firstName')" required autocomplete="given-name" />
              <AppInput v-model="form.lastName" :label="t('profile.lastName')" required autocomplete="family-name" />
              <AppInput v-model="form.birthDate" :label="t('profile.birthDate')" type="date" autocomplete="bday" />
              <label class="profile__field">
                <span class="profile__field-label">{{ t('profile.language') }}</span>
                <AppSelect :model-value="form.language" :options="languageOptions" @update:model-value="onLanguageChange" />
              </label>
            </div>
            <div class="profile__actions">
              <AppButton :disabled="saving" @click="saveProfile">
                {{ saving ? t('profile.saving') : t('profile.saveChanges') }}
              </AppButton>
            </div>
          </section>

          <section class="profile__card">
            <div class="profile__card-head">
              <span class="profile__card-icon profile__card-icon--lock">
                <AppIcon name="lock" :size="17" />
              </span>
              <div>
                <h3 class="profile__heading">{{ t('profile.security') }}</h3>
                <p class="profile__muted">{{ t('profile.changePasswordDesc') }}</p>
              </div>
              <AppButton variant="outline" size="sm" class="profile__toggle" @click="passwordOpen = !passwordOpen">
                <AppIcon name="key" :size="14" />
                {{ passwordOpen ? t('profile.hideForm') : t('profile.changePassword') }}
              </AppButton>
            </div>
            <div v-if="passwordOpen" class="profile__password">
              <p class="profile__note">
                <AppIcon name="shield-check" :size="15" />
                {{ t('profile.changePasswordNote') }}
              </p>
              <div class="profile__form">
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
              </div>
              <div v-if="passwordError" class="profile__alert" role="alert">
                <AppIcon name="alert-circle" :size="16" />
                {{ passwordError }}
              </div>
              <div class="profile__actions">
                <AppButton :disabled="changing" @click="savePassword">
                  {{ changing ? t('profile.saving') : t('profile.updatePassword') }}
                </AppButton>
              </div>
            </div>
          </section>
        </div>

        <aside class="profile__side">
          <section class="profile__card profile__card--flush">
            <h3 class="profile__heading profile__heading--padded">{{ t('profile.shortcuts') }}</h3>
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

          <section class="profile__card profile__card--flush">
            <h3 class="profile__heading profile__heading--padded">{{ t('profile.account') }}</h3>
            <nav class="profile__links">
              <button type="button" class="profile__link profile__link--danger" @click="logout">
                <AppIcon name="logout" :size="17" />
                {{ t('profile.logout') }}
              </button>
            </nav>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem 2rem;
  border-radius: var(--dz-radius-lg);
  border: 1px solid var(--dz-border);
  background:
    linear-gradient(120deg, color-mix(in srgb, var(--tint) 12%, var(--dz-surface)) 0%, var(--dz-surface) 55%),
    var(--dz-surface);
  box-shadow: var(--dz-shadow-sm);
  overflow: hidden;
}

.chart::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--tint) 85%, transparent), color-mix(in srgb, var(--tint) 35%, transparent));
}

.chart__stamp {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5.25rem;
  height: 5.25rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: color-mix(in srgb, var(--tint) 16%, var(--dz-surface-soft));
  border: 1px solid color-mix(in srgb, var(--tint) 30%, var(--dz-border));
  outline: 6px solid color-mix(in srgb, var(--tint) 8%, transparent);
  color: color-mix(in srgb, var(--tint) 85%, var(--dz-ink));
  font-family: var(--dz-font-display);
  font-size: 1.9rem;
  font-weight: 700;
}

.chart__identity {
  min-width: 0;
}

.chart__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dz-muted);
}

.chart__code {
  font-family: var(--dz-font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  padding: 0.15rem 0.45rem;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-surface-soft);
  border: 1px dashed var(--dz-border-strong);
  color: var(--dz-ink-soft);
}

.chart__name {
  font-family: var(--dz-font-display);
  font-size: 1.5rem;
  margin-top: 0.35rem;
}

.chart__email {
  color: var(--dz-muted);
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

.chart__status {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-success-soft);
  color: var(--dz-success);
  font-size: 0.75rem;
  font-weight: 600;
}

.chart__status-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: currentColor;
}

.profile__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
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

.profile__card--flush {
  padding: 0;
  overflow: hidden;
}

.profile__card-head {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  margin-bottom: 1.25rem;
}

.profile__card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.profile__card-icon--lock {
  background: var(--dz-warning-soft);
  color: var(--dz-warning);
}

.profile__toggle {
  margin-inline-start: auto;
}

.profile__heading {
  font-size: 1rem;
}

.profile__heading--padded {
  padding: 1.25rem 1.5rem 0.9rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--dz-border);
}

.profile__muted {
  color: var(--dz-muted);
  font-size: 0.82rem;
  margin-top: 0.15rem;
}

.profile__form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.profile__email-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  margin-bottom: 1rem;
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
}

.profile__email-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-faint);
  color: var(--dz-primary-strong);
}

.profile__email-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile__email-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dz-muted);
}

.profile__email-value {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--dz-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile__email-note {
  margin-inline-start: auto;
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.profile__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.profile__field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.profile__field .app-select {
  width: 100%;
}

.profile__field .app-select__native {
  width: 100%;
  padding: 0.65rem 2.4rem 0.65rem 0.9rem;
}

.profile__password {
  border-top: 1px solid var(--dz-border);
  padding-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile__note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--dz-radius);
  background: var(--dz-primary-faint);
  border: 1px solid color-mix(in srgb, var(--dz-primary) 18%, var(--dz-border));
  color: var(--dz-primary-strong);
  font-size: 0.8rem;
  font-weight: 600;
}

.profile__actions {
  display: flex;
  justify-content: flex-end;
}

.profile__alert {
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
  padding: 0.5rem;
  gap: 0.2rem;
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
  .profile__grid {
    grid-template-columns: 1fr;
  }

  .profile__side {
    position: static;
  }
}

@media (max-width: 640px) {
  .chart {
    flex-wrap: wrap;
    padding: 1.5rem;
  }

  .chart__status {
    margin-inline-start: 0;
  }

  .profile__form {
    grid-template-columns: 1fr;
  }

  .profile__card-head {
    flex-wrap: wrap;
  }

  .profile__toggle {
    margin-inline-start: 0;
    width: 100%;
  }
}
</style>
