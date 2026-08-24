<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { services } from '../di/container'
import { locale, t } from '../i18n'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import ImageLightboxModal from '../components/ui/ImageLightboxModal.vue'
import { toastService } from '../infrastructure/feedback/toast.service'
import { resolveMediaUrl } from '../utils/media'
import type { AddressDto, AreaDto } from '../domain/models/auth'

const { authService, addressRepository } = services
const router = useRouter()

const showAvatarLightbox = ref(false)

  const fullName = ref('')
  const phoneNumber = ref('')
  const email = ref('')
  const userName = ref('')
  const isActive = ref(true)
  const isPopular = ref(false)
  const orderNum = ref('')
  const serverImageUrl = ref('')
  const profileImage = ref<File | null>(null)
  const previewUrl = ref('')
  const error = ref('')
  const loading = ref(true)
  const saving = ref(false)

  const addressList = ref<AddressDto[]>([])
  const addressesLoading = ref(true)
  const addressesError = ref(false)
  const showAddressForm = ref(false)
  const editingAddressId = ref('')
  const addressLine = ref('')
  const floorNum = ref('')
  const apartmentNum = ref('')
  const areaId = ref('')
  const areas = ref<AreaDto[]>([])
  const areasLoaded = ref(false)
  const addressFormError = ref('')
  const addressSaving = ref(false)
const deletingAddressId = ref('')
const confirmDeleteId = ref('')
let confirmTimer: ReturnType<typeof setTimeout> | undefined

const showPasswordForm = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordFormError = ref('')
const passwordSaving = ref(false)

const deleteArm = ref(false)
const deletingAccount = ref(false)
let deleteArmTimer: ReturnType<typeof setTimeout> | undefined

  const user = authService.user
  const userInitials = () => {
    const u = user.value
    if (!u) return 'DZ'
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase()
  }

  const resolveImageUrl = (path: string | null): string => resolveMediaUrl(path)

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

  const initFromSession = () => {
    const u = user.value
    if (u) {
      if (!fullName.value) fullName.value = `${u.firstName || ''} ${u.lastName || ''}`.trim()
      if (!email.value) email.value = u.email || ''
      if (!phoneNumber.value && u.phone) phoneNumber.value = u.phone
      if (!serverImageUrl.value && u.profileImage) serverImageUrl.value = resolveImageUrl(u.profileImage)
    }
  }

  const applyProfile = (profile: NonNullable<Awaited<ReturnType<typeof authService.loadProfile>>['profile']>) => {
    if (profile.fullName) fullName.value = profile.fullName
    if (profile.phoneNumber !== null && profile.phoneNumber !== undefined) phoneNumber.value = profile.phoneNumber
    if (profile.email) email.value = profile.email
    if (profile.userName) userName.value = profile.userName
    if (typeof profile.isActive === 'boolean') isActive.value = profile.isActive
    if (typeof profile.isPopular === 'boolean') isPopular.value = profile.isPopular
    if (profile.orderNum !== null && profile.orderNum !== undefined) orderNum.value = String(profile.orderNum)
    if (profile.profileImage) serverImageUrl.value = resolveImageUrl(profile.profileImage)
  }

  const reloadProfile = async () => {
    loading.value = true
    error.value = ''
    initFromSession()

    if (!authService.isAuthenticated) {
      loading.value = false
      void router.push({ name: 'login', query: { redirect: '/profile' } })
      return
    }

    try {
      const result = await authService.loadProfile()
      if (result.ok) {
        if (result.profile) applyProfile(result.profile)
      } else if (!user.value) {
        error.value = result.error || t('common.error')
      }
    } catch {
      if (!user.value) {
        error.value = t('common.networkError')
      }
    } finally {
      loading.value = false
    }

    void loadAddresses()
  }

  const loadAddresses = async () => {
    addressesLoading.value = true
    addressesError.value = false
    try {
      addressList.value = await addressRepository.getUserAddresses()
    } catch {
      addressesError.value = true
    } finally {
      addressesLoading.value = false
    }
  }

  const loadAreas = async () => {
    if (areasLoaded.value) return
    try {
      areas.value = await addressRepository.getAllAreas()
    } catch {
      areas.value = []
    } finally {
      areasLoaded.value = true
    }
  }

  const startAddAddress = () => {
    editingAddressId.value = ''
    addressLine.value = ''
    floorNum.value = ''
    apartmentNum.value = ''
    areaId.value = ''
    addressFormError.value = ''
    showAddressForm.value = true
    void loadAreas()
  }

  const startEditAddress = (address: AddressDto) => {
    editingAddressId.value = address.id
    addressLine.value = address.addressLine ?? ''
    floorNum.value = address.floorNum == null ? '' : String(address.floorNum)
    apartmentNum.value = address.apartmentNum == null ? '' : String(address.apartmentNum)
    areaId.value = address.areaId == null ? '' : String(address.areaId)
    addressFormError.value = ''
    showAddressForm.value = true
    void loadAreas()
  }

  const cancelAddressForm = () => {
    showAddressForm.value = false
    editingAddressId.value = ''
  }

  const saveAddress = async () => {
    addressFormError.value = ''
    const line = addressLine.value.trim()
    if (!line) {
      addressFormError.value = t('profile.errAddressLine')
      return
    }
    const floor = floorNum.value.trim() === '' ? null : Number(floorNum.value)
    const apartment = apartmentNum.value.trim() === '' ? null : Number(apartmentNum.value)
    addressSaving.value = true
    try {
      if (editingAddressId.value) {
        await addressRepository.updateAddress(editingAddressId.value, { addressLine: line })
      } else {
        await addressRepository.insertAddress({
          userId: user.value?.id ?? '',
          addressLine: line,
          floorNum: Number.isFinite(floor as number) ? floor : null,
          apartmentNum: Number.isFinite(apartment as number) ? apartment : null,
          areaId: areaId.value === '' ? null : Number(areaId.value),
        })
      }
      showAddressForm.value = false
      editingAddressId.value = ''
      await loadAddresses()
    } catch {
      addressFormError.value = t('common.networkError')
    } finally {
      addressSaving.value = false
    }
  }

const onDeleteAddress = async (id: string) => {
  if (confirmDeleteId.value !== id) {
    confirmDeleteId.value = id
    clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      confirmDeleteId.value = ''
    }, 3000)
    return
  }
  confirmDeleteId.value = ''
  clearTimeout(confirmTimer)
  deletingAddressId.value = id
  try {
    await addressRepository.deleteAddress(id)
    await loadAddresses()
  } catch {
    toastService.error(t('common.networkError'))
  } finally {
    deletingAddressId.value = ''
  }
}

const openPasswordForm = () => {
  showPasswordForm.value = true
  passwordFormError.value = ''
}

const closePasswordForm = () => {
  showPasswordForm.value = false
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordFormError.value = ''
}

const submitPassword = async () => {
  passwordFormError.value = ''
  const cur = currentPassword.value
  const pw = newPassword.value
  const conf = confirmPassword.value
  if (!cur) {
    passwordFormError.value = t('profile.errRequired')
    return
  }
  if (!pw) {
    passwordFormError.value = t('auth.errPasswordRequired')
    return
  }
  if (pw.length < 8) {
    passwordFormError.value = t('auth.passwordMin')
    return
  }
  if (conf !== pw) {
    passwordFormError.value = t('auth.passwordMismatch')
    return
  }
  passwordSaving.value = true
  try {
    const result = await authService.changePassword(cur, pw)
    if (!result.ok) {
      passwordFormError.value = result.error
      return
    }
    toastService.success(t('profile.passwordUpdatedToast'))
    closePasswordForm()
  } finally {
    passwordSaving.value = false
  }
}

const onDeleteAccount = async () => {
  if (!deleteArm.value) {
    deleteArm.value = true
    clearTimeout(deleteArmTimer)
    deleteArmTimer = setTimeout(() => {
      deleteArm.value = false
    }, 3000)
    return
  }
  deleteArm.value = false
  clearTimeout(deleteArmTimer)
  deletingAccount.value = true
  try {
    const result = await authService.deleteAccount()
    if (!result.ok) {
      toastService.error(result.error)
      return
    }
    toastService.success(t('profile.accountDeletedToast'))
    void router.push({ name: 'login' })
  } finally {
    deletingAccount.value = false
  }
}

  onMounted(() => {
    void reloadProfile()
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

        <div v-else-if="!user" class="profile__state" role="alert">
          <span class="profile__state-icon"><AppIcon name="user" :size="30" /></span>
          <h2 class="profile__state-title">{{ t('auth.login') }}</h2>
          <p class="profile__state-desc">{{ t('auth.errSessionExpired') }}</p>
          <AppButton variant="primary" @click="router.push({ name: 'login', query: { redirect: '/profile' } })">
            {{ t('auth.login') }}
          </AppButton>
        </div>

        <form v-else class="profile__form" novalidate @submit.prevent="save">
          <div class="profile__avatar-wrap">
            <div
              class="profile__avatar"
              :class="{ 'profile__avatar--clickable': !!avatarSrc }"
              :style="{ '--tint': user?.tint ?? '' }"
              :title="avatarSrc ? (locale === 'ar' ? 'عرض الصورة' : 'View Image') : undefined"
              :tabindex="avatarSrc ? 0 : undefined"
              :role="avatarSrc ? 'button' : undefined"
              :aria-label="avatarSrc ? (locale === 'ar' ? 'عرض صورة الحساب' : 'View profile picture') : undefined"
              @click="avatarSrc && (showAvatarLightbox = true)"
              @keydown.enter="avatarSrc && (showAvatarLightbox = true)"
              @keydown.space.prevent="avatarSrc && (showAvatarLightbox = true)"
            >
              <img v-if="avatarSrc" :src="avatarSrc" alt="" class="profile__avatar-img" />
              <span v-else>{{ userInitials() }}</span>
              <span v-if="avatarSrc" class="profile__avatar-zoom" aria-hidden="true">
                <AppIcon name="zoom-in" :size="16" />
              </span>
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
            <div class="profile__section-head">
              <p class="profile__section-title">{{ t('profile.addresses') }}</p>
              <button v-if="!showAddressForm" type="button" class="profile__add" @click="startAddAddress">
                <AppIcon name="plus" :size="14" />
                {{ t('profile.addAddress') }}
              </button>
            </div>

            <div v-if="addressesLoading" class="profile__addresses-loading">
              <AppIcon name="refresh" :size="17" class="profile__spinner" />
              <span>{{ t('common.loading') }}</span>
            </div>

            <div v-else-if="addressesError" class="profile__error" role="alert">
              <AppIcon name="alert-circle" :size="16" />
              <span>{{ t('categories.errorDescription') }}</span>
              <button type="button" class="profile__retry" @click="loadAddresses">
                <AppIcon name="refresh" :size="13" />
                {{ t('categories.retry') }}
              </button>
            </div>

            <div v-else-if="addressList.length === 0" class="profile__addresses-empty">
              <span>{{ t('profile.addressesEmpty') }}</span>
            </div>

            <div v-else class="profile__addresses">
              <div v-for="address in addressList" :key="address.id" class="profile__address">
                <AppIcon name="map-pin" :size="16" />
                <div class="profile__address-body">
                  <p class="profile__address-line" dir="auto">{{ address.addressLine }}</p>
                  <p class="profile__address-meta">
                    {{ address.area?.name ?? '—' }}
                    <span v-if="address.floorNum != null || address.apartmentNum != null"> · </span>
                    <template v-if="address.floorNum != null">
                      {{ t('profile.floor') }}: {{ address.floorNum }}
                    </template>
                    <template v-if="address.apartmentNum != null">
                      <span> · </span>
                      {{ t('profile.apartment') }}: {{ address.apartmentNum }}
                    </template>
                  </p>
                </div>
                <div class="profile__address-actions">
                  <button type="button"
                          class="profile__address-btn"
                          :aria-label="t('profile.editAddress')"
                          :title="t('profile.editAddress')"
                          @click="startEditAddress(address)">
                    <AppIcon name="pencil" :size="14" />
                  </button>
                  <button type="button"
                          class="profile__address-btn profile__address-btn--danger"
                          :class="{ 'profile__address-btn--confirm': confirmDeleteId === address.id }"
                          :disabled="deletingAddressId === address.id"
                          :aria-label="t('profile.deleteAddress')"
                          :title="confirmDeleteId === address.id ? t('profile.confirmDelete') : t('profile.deleteAddress')"
                          @click="onDeleteAddress(address.id)">
                    <AppIcon v-if="deletingAddressId === address.id" name="refresh" :size="14" class="profile__spinner" />
                    <AppIcon v-else name="trash" :size="14" />
                  </button>
                </div>
              </div>
            </div>

            <form v-if="showAddressForm" class="profile__address-form" novalidate @submit.prevent="saveAddress">
              <p class="profile__address-form-title">
                {{ editingAddressId ? t('profile.updateAddress') : t('profile.addAddress') }}
              </p>
              <AppInput v-model="addressLine" :label="t('profile.addressLine')" required />
              <div class="profile__field">
                <label class="app-input__label">
                  {{ t('profile.area') }}
                </label>
                <select v-model="areaId"
                        class="profile__select"
                        :disabled="!!editingAddressId"
                        :title="editingAddressId ? t('profile.areaUneditable') : ''">
                  <option value="">{{ t('profile.selectArea') }}</option>
                  <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
                </select>
                <span v-if="editingAddressId" class="app-input__error">{{ t('profile.areaUneditable') }}</span>
              </div>
              <div class="profile__address-form-row">
                <AppInput v-model="floorNum" :label="t('profile.floor')" type="text" inputmode="numeric" />
                <AppInput v-model="apartmentNum" :label="t('profile.apartment')" type="text" inputmode="numeric" />
              </div>
              <p v-if="addressFormError" class="profile__error" role="alert">
                <AppIcon name="alert-circle" :size="16" />
                {{ addressFormError }}
              </p>
              <div class="profile__address-form-actions">
                <AppButton type="submit" variant="primary" :disabled="addressSaving">
                  <AppIcon v-if="addressSaving" name="refresh" :size="16" class="profile__spinner" />
                  {{ editingAddressId ? t('profile.updateAddress') : t('profile.addAddress') }}
                </AppButton>
                <AppButton type="button" variant="ghost" :disabled="addressSaving" @click="cancelAddressForm">
                  {{ t('profile.cancel') }}
                </AppButton>
              </div>
            </form>
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

        <div class="profile__section">
          <div class="profile__section-head">
            <p class="profile__section-title">{{ t('profile.security') }}</p>
            <button v-if="!showPasswordForm" type="button" class="profile__add" @click="openPasswordForm">
              <AppIcon name="pencil" :size="14" />
              {{ t('profile.changePassword') }}
            </button>
          </div>
          <p class="profile__section-desc">{{ t('profile.changePasswordDesc') }}</p>
          <form v-if="showPasswordForm" class="profile__address-form" novalidate @submit.prevent="submitPassword">
            <AppInput
              v-model="currentPassword"
              :label="t('profile.currentPassword')"
              type="password"
              autocomplete="current-password"
            />
            <AppInput v-model="newPassword" :label="t('profile.newPassword')" type="password" autocomplete="new-password" />
            <AppInput
              v-model="confirmPassword"
              :label="t('profile.confirmNewPassword')"
              type="password"
              autocomplete="new-password"
            />
            <p class="profile__note">
              <AppIcon name="shield-check" :size="15" />
              {{ t('profile.changePasswordNote') }}
            </p>
            <p v-if="passwordFormError" class="profile__error" role="alert">
              <AppIcon name="alert-circle" :size="16" />
              {{ passwordFormError }}
            </p>
            <div class="profile__address-form-actions">
              <AppButton type="submit" variant="primary" :disabled="passwordSaving">
                <AppIcon v-if="passwordSaving" name="refresh" :size="16" class="profile__spinner" />
                {{ t('profile.updatePassword') }}
              </AppButton>
              <AppButton type="button" variant="ghost" :disabled="passwordSaving" @click="closePasswordForm">
                {{ t('profile.hideForm') }}
              </AppButton>
            </div>
          </form>
        </div>

        <div class="profile__section profile__section--danger">
          <p class="profile__section-title">{{ t('profile.deleteAccount') }}</p>
          <p class="profile__section-desc">{{ t('profile.deleteAccountDesc') }}</p>
          <AppButton
            type="button"
            variant="danger"
            :class="{ 'profile__delete-confirm': deleteArm }"
            :disabled="deletingAccount"
            @click="onDeleteAccount"
          >
            <AppIcon v-if="deletingAccount" name="refresh" :size="16" class="profile__spinner" />
            {{ deleteArm ? t('profile.deleteAccountConfirm') : t('profile.deleteAccount') }}
          </AppButton>
        </div>
      </div>
    </section>

    <!-- Fullscreen Avatar Lightbox Modal -->
    <ImageLightboxModal
      v-if="avatarSrc"
      v-model="showAvatarLightbox"
      :images="[avatarSrc]"
      :title="fullName || user?.firstName || t('profile.title')"
    />
  </div>
</template>

<style scoped>
  .profile {
    min-height: calc(100vh - var(--dz-header-height));
    background: radial-gradient(40rem 22rem at 15% -5%, var(--dz-primary-soft) 0%, transparent 60%), var(--dz-paper);
    padding-block: var(--dz-page-py) var(--dz-page-pb);
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

  .profile__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 3rem 1rem;
    text-align: center;
  }

  .profile__state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: var(--dz-radius-full);
    background: var(--dz-surface-soft);
    color: var(--dz-muted);
    margin-bottom: 0.4rem;
  }

  .profile__state-title {
    font-family: var(--dz-font-display);
    font-size: 1.15rem;
    font-weight: 600;
  }

  .profile__state-desc {
    font-size: 0.88rem;
    color: var(--dz-muted);
    max-width: 32ch;
  }

  .profile__state .app-button {
    margin-top: 0.8rem;
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
    position: relative;
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
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .profile__avatar--clickable {
    cursor: zoom-in;
  }

  .profile__avatar--clickable:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 14px rgb(27 78 119 / 0.2);
  }

  .profile__avatar--clickable:focus-visible {
    outline: 3px solid var(--dz-primary);
    outline-offset: 2px;
  }

  .profile__avatar-zoom {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    opacity: 0;
    transition: opacity 0.2s ease;
    border-radius: var(--dz-radius-full);
  }

  .profile__avatar--clickable:hover .profile__avatar-zoom {
    opacity: 1;
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
    transition: background-color 0.2s, color 0.2s;
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
    transition: border-color 0.2s, background-color 0.2s;
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
    transition: inset-inline-start 0.2s, background-color 0.2s;
  }

  .profile__toggle-input:checked + .profile__toggle-track {
    background: var(--dz-primary);
  }

    .profile__toggle-input:checked + .profile__toggle-track .profile__toggle-thumb {
      inset-inline-start: 1.35rem;
    }

.profile__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.profile__section-desc {
  font-size: 0.78rem;
  color: var(--dz-muted);
  margin: 0.2rem 0 0.8rem;
}

.profile__section--danger {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--dz-danger) 35%, var(--dz-border));
  border-radius: var(--dz-radius);
}

.profile__note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--dz-muted);
}

.profile__delete-confirm {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dz-danger) 30%, transparent);
  animation: profile-delete-pulse 1s ease-in-out infinite;
}

@keyframes profile-delete-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--dz-danger) 30%, transparent);
  }
  50% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--dz-danger) 15%, transparent);
  }
}

  .profile__add {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.85rem;
    border-radius: var(--dz-radius-full);
    border: 1px solid var(--dz-primary);
    background: var(--dz-surface);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--dz-primary-strong);
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

    .profile__add:hover {
      background: var(--dz-primary);
      color: var(--dz-on-primary);
    }

  .profile__addresses-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1.4rem 0;
    font-size: 0.85rem;
    color: var(--dz-muted);
  }

  .profile__addresses-empty {
    padding: 1.4rem 1rem;
    border: 1px dashed var(--dz-border-strong);
    border-radius: var(--dz-radius);
    text-align: center;
    font-size: 0.85rem;
    color: var(--dz-muted);
  }

  .profile__addresses {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .profile__retry {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    margin-inline-start: auto;
    border: 1px solid color-mix(in srgb, var(--dz-danger) 40%, var(--dz-border));
    border-radius: var(--dz-radius-full);
    background: var(--dz-surface);
    color: var(--dz-danger);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

    .profile__retry:hover {
      background: var(--dz-danger);
      color: var(--dz-white);
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
    flex: 1;
    min-width: 0;
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

  .profile__address-actions {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .profile__address-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--dz-radius);
    border: 1px solid var(--dz-border);
    background: var(--dz-surface);
    color: var(--dz-muted);
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background-color 0.2s;
  }

    .profile__address-btn:hover {
      color: var(--dz-primary-strong);
      border-color: var(--dz-primary-soft);
    }

  .profile__address-btn--danger {
    color: var(--dz-danger);
  }

    .profile__address-btn--danger:hover,
    .profile__address-btn--confirm {
      background: var(--dz-danger);
      border-color: var(--dz-danger);
      color: var(--dz-white);
    }

  .profile__address-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
    border: 1px solid var(--dz-border);
    border-radius: var(--dz-radius);
    background: var(--dz-surface);
  }

  .profile__address-form-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--dz-ink);
  }

  .profile__address-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .profile__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .profile__select {
    width: 100%;
    padding: 0.65rem 0.9rem;
    border: 1px solid var(--dz-border-strong);
    border-radius: var(--dz-radius);
    background: var(--dz-surface);
    font-size: 0.95rem;
    color: var(--dz-ink);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

    .profile__select:focus {
      outline: none;
      border-color: var(--dz-primary);
      box-shadow: 0 0 0 3px var(--dz-primary-soft);
    }

    .profile__select:disabled {
      opacity: 0.6;
      background: var(--dz-surface-soft);
      cursor: not-allowed;
    }

  .profile__address-form-actions {
    display: flex;
    gap: 0.6rem;
  }

    .profile__address-form-actions .app-button:first-child {
      flex: 1;
    }

.profile__form + .profile__section {
  margin-top: 1.25rem;
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

@media (max-width: 640px) {
  .profile__card {
    padding: 1.5rem 1.1rem;
    border-radius: var(--dz-radius);
  }

  .profile__title {
    font-size: 1.35rem;
  }

  .profile__avatar-wrap {
    gap: 0.85rem;
  }

  .profile__avatar {
    width: 3.8rem;
    height: 3.8rem;
  }

  .profile__section-head {
    flex-wrap: wrap;
  }

  .profile__address-form-row {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }

  .profile__address-form-actions {
    flex-wrap: wrap;
  }

  .profile__address-form-actions .app-button:first-child {
    flex: 1 1 100%;
  }

  .profile__section--danger .app-button {
    width: 100%;
  }
}

@media (max-width: 400px) {
  .profile__avatar-wrap {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile__avatar-actions {
    align-items: center;
  }

  .profile__address {
    padding: 0.6rem 0.75rem;
    gap: 0.5rem;
  }

  .profile__address-actions {
    gap: 0.25rem;
  }

  .profile__address-btn {
    width: 1.85rem;
    height: 1.85rem;
  }
}
</style>
