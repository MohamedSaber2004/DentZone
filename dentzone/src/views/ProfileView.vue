<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { services } from '../di/container'
import { t } from '../i18n'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import { toastService } from '../infrastructure/feedback/toast.service'
import { API_BASE_URL } from '../config/api.config'
import type { AddressDto } from '../domain/models/auth'

const { authService } = services

const fullName = ref('')
const phoneNumber = ref('')
const email = ref('')
const userName = ref('')
const isActive = ref(true)
const isPopular = ref(false)
const orderNum = ref('')
const addresses = ref<AddressDto[]>([])
const serverImageUrl = ref('')
const profileImage = ref<File | null>(null)
const previewUrl = ref('')
const error = ref('')
const loading = ref(true)
const saving = ref(false)

const user = authService.user
const userInitials = () => {
  const u = user.value
  if (!u) return 'DZ'
  return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase()
}

const resolveImageUrl = (path: string | null): string => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const avatarSrc = computed(() => previewUrl.value || serverImageUrl.value)

const canSave = computed(() => fullName.value.trim().length > 0 && !saving.value)

const onPickImage = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  profileImage.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const save = async () => {
  error.value = ''
  if (!fullName.value.trim()) {
    error.value = t('profile.errRequired')
    return
  }
  saving.value = true
  const parsedOrder = orderNum.value.trim() === '' ? null : Number(orderNum.value)
  const result = await authService.updateProfile({
    fullName: fullName.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
    isActive: isActive.value,
    isPopular: isPopular.value,
    orderNum: Number.isFinite(parsedOrder) ? parsedOrder : null,
    profileImage: profileImage.value ?? undefined,
  })
  saving.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  toastService.success(t('profile.savedToast'))
  profileImage.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  const refreshed = await authService.loadProfile()
  if (refreshed.ok && refreshed.profile) {
    applyProfile(refreshed.profile)
  }
}

const applyProfile = (profile: NonNullable<Awaited<ReturnType<typeof authService.loadProfile>>['profile']>) => {
  fullName.value = profile.fullName
  phoneNumber.value = profile.phoneNumber ?? ''
  email.value = profile.email
  userName.value = profile.userName ?? ''
  isActive.value = profile.isActive
  isPopular.value = profile.isPopular ?? false
  orderNum.value = profile.orderNum === null || profile.orderNum === undefined ? '' : String(profile.orderNum)
  addresses.value = profile.addresses ?? []
  serverImageUrl.value = resolveImageUrl(profile.profileImage ?? '')
}

onMounted(async () => {
  const result = await authService.loadProfile()
  loading.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  if (result.profile) applyProfile(result.profile)
})
</script>

<template>
  <div class="profile">
    <section class="container profile__inner">
      <div class="profile__card">
        <div class="profile__head">
          <div>
            <p class="profile__eyebrow">{{ t('profile.title') }}</p>
            <h1 class="profile__title">{{ t('profile.personalInfo') }}</h1>
            <p class="profile__subtitle">{{ t('profile.personalInfoDesc') }}</p>
          </div>
        </div>

        <div v-if="loading" class="profile__loading">
          <AppIcon name="refresh" :size="22" class="profile__spinner" />
          <span>{{ t('common.loading') }}</span>
        </div>

        <form v-else class="profile__form" novalidate @submit.prevent="save">
          <div class="profile__avatar-wrap">
            <div class="profile__avatar" :style="{ '--tint': user?.tint ?? '' }">
              <img v-if="avatarSrc" :src="avatarSrc" alt="" class="profile__avatar-img" />
              <span v-else>{{ userInitials() }}</span>
            </div>
            <div class="profile__avatar-actions">
              <label class="profile__upload">
                <AppIcon name="camera" :size="15" />
                <span>{{ t('profile.changePhoto') }}</span>
                <input class="profile__upload-input" type="file" accept="image/*" @change="onPickImage" />
              </label>
              <p v-if="profileImage" class="profile__upload-hint">{{ profileImage.name }}</p>
            </div>
          </div>

          <div class="profile__section">
            <p class="profile__section-title">{{ t('profile.account') }}</p>
            <AppInput v-model="fullName" :label="t('checkout.fullName')" required />
            <AppInput v-model="phoneNumber" :label="t('profile.phone')" type="tel" />
            <AppInput v-model="email" :label="t('profile.email')" type="email" disabled />
            <div v-if="userName" class="profile__readonly">
              <span class="profile__readonly-label">{{ t('profile.username') }}</span>
              <span class="profile__readonly-value" dir="ltr">{{ userName }}</span>
            </div>
          </div>

          <div class="profile__section">
            <p class="profile__section-title">{{ t('profile.preferences') }}</p>
            <label class="profile__toggle">
              <span class="profile__toggle-text">
                <span class="profile__toggle-title">{{ t('profile.activeAccount') }}</span>
              </span>
              <input v-model="isActive" type="checkbox" class="profile__toggle-input" />
              <span class="profile__toggle-track" aria-hidden="true">
                <span class="profile__toggle-thumb" />
              </span>
            </label>
            <!--<label class="profile__toggle">
              <span class="profile__toggle-text">
                <span class="profile__toggle-title">{{ t('profile.popular') }}</span>
              </span>
              <input v-model="isPopular" type="checkbox" class="profile__toggle-input" />
              <span class="profile__toggle-track" aria-hidden="true">
                <span class="profile__toggle-thumb" />
              </span>
            </label>-->
            <!--<AppInput v-model="orderNum" :label="t('profile.orderNum')" type="text" inputmode="numeric" />-->
          </div>

          <div v-if="addresses.length" class="profile__section">
            <p class="profile__section-title">{{ t('profile.addresses') }}</p>
            <div v-for="address in addresses" :key="address.id" class="profile__address">
              <AppIcon name="map-pin" :size="16" />
              <div class="profile__address-body">
                <p class="profile__address-line" dir="auto">{{ address.addressLine }}</p>
                <p class="profile__address-meta">
                  {{ t('profile.floor') }}: {{ address.floorNum ?? '—' }}
                  · {{ t('profile.apartment') }}: {{ address.apartmentNum ?? '—' }}
                </p>
              </div>
            </div>
          </div>

          <p v-if="error" class="profile__error" role="alert">
            <AppIcon name="alert-circle" :size="16" />
            {{ error }}
          </p>

          <AppButton type="submit" :disabled="!canSave" block>
            <AppIcon v-if="saving" name="refresh" :size="17" class="profile__spinner" />
            {{ saving ? t('profile.saving') : t('profile.saveChanges') }}
          </AppButton>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile {
  min-height: calc(100vh - var(--dz-header-height));
  background:
    radial-gradient(40rem 22rem at 15% -5%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-paper);
  padding: 3rem var(--dz-gutter);
}

.profile__inner {
  display: flex;
  justify-content: center;
}

.profile__card {
  width: min(100%, 540px);
  padding: 2.5rem 2.25rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-lg);
}

.profile__eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dz-primary-strong);
}

.profile__title {
  font-family: var(--dz-font-display);
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-top: 0.25rem;
}

.profile__subtitle {
  font-size: 0.9rem;
  color: var(--dz-muted);
  margin-top: 0.3rem;
  margin-bottom: 0.5rem;
}

.profile__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 0;
  color: var(--dz-muted);
}

.profile__spinner {
  animation: profile-spin 0.8s linear infinite;
}

@keyframes profile-spin {
  to {
    transform: rotate(360deg);
  }
}

.profile__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.profile__avatar-wrap {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--dz-border);
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
  font-size: 1.1rem;
  font-weight: 700;
  overflow: hidden;
}

.profile__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile__avatar-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
}

.profile__upload {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-primary);
  background: var(--dz-surface);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.profile__upload:hover {
  background: var(--dz-primary);
  color: var(--dz-on-primary);
}

.profile__upload-input {
  display: none;
}

.profile__upload-hint {
  font-size: 0.72rem;
  color: var(--dz-muted);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile__section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.profile__section-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dz-muted);
  padding-bottom: 0.15rem;
}

.profile__readonly {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.9rem;
  border: 1px dashed var(--dz-border-strong);
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
}

.profile__readonly-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.profile__readonly-value {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dz-ink);
  text-align: end;
}

.profile__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.profile__toggle:hover {
  border-color: var(--dz-primary-soft);
  background: var(--dz-primary-faint);
}

.profile__toggle-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.profile__toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.profile__toggle-track {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 2.6rem;
  height: 1.45rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: var(--dz-border-strong);
  transition: background-color 0.2s;
}

.profile__toggle-thumb {
  position: absolute;
  inset-inline-start: 0.2rem;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  background: var(--dz-surface);
  box-shadow: var(--dz-shadow-sm);
  transition:
    inset-inline-start 0.2s,
    background-color 0.2s;
}

.profile__toggle-input:checked + .profile__toggle-track {
  background: var(--dz-primary);
}

.profile__toggle-input:checked + .profile__toggle-track .profile__toggle-thumb {
  inset-inline-start: 1.35rem;
}

.profile__addresses {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile__address {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  color: var(--dz-primary-strong);
}

.profile__address-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.profile__address-line {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dz-ink);
}

.profile__address-meta {
  font-size: 0.75rem;
  color: var(--dz-muted);
}

.profile__error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--dz-danger);
  padding: 0.6rem 0.8rem;
  border-radius: var(--dz-radius);
  background: var(--dz-danger-soft);
}
</style>
