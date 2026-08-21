<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { services } from '../di/container'
import { t, locale } from '../i18n'
import type { NotificationDto } from '../domain/models/notification'
import AppIcon from '../components/ui/AppIcon.vue'
import AppButton from '../components/ui/AppButton.vue'

const { authService, notificationRepository, firebaseMessagingService } = services

const notifications = ref<NotificationDto[]>([])
const loading = ref(true)
const error = ref(false)
const showToken = ref(false)

const user = computed(() => authService.user.value)
const isPushSupported = computed(() => firebaseMessagingService.isSupported.value)
const pushPermission = computed(() => firebaseMessagingService.permission.value)
const pushToken = computed(() => firebaseMessagingService.token.value)
const isPushLoading = computed(() => firebaseMessagingService.isLoading.value)

let unsubscribeNotif: (() => void) | null = null

const load = async () => {
  if (!user.value?.id) return
  loading.value = true
  error.value = false
  try {
    notifications.value = await notificationRepository.getUserNotifications(user.value.id)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const enablePush = async () => {
  await firebaseMessagingService.requestPushPermission()
}

const copyToken = async () => {
  await firebaseMessagingService.copyToken()
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return dateStr
  }
}

const isExpired = (expiredStr: string): boolean => {
  if (!expiredStr) return false
  try {
    return new Date(expiredStr).getTime() < Date.now()
  } catch {
    return false
  }
}

onMounted(() => {
  void load()
  unsubscribeNotif = firebaseMessagingService.onNotification(() => {
    void load()
  })
})

onUnmounted(() => {
  if (unsubscribeNotif) {
    unsubscribeNotif()
    unsubscribeNotif = null
  }
})
</script>

<template>
  <div class="notifications-page">
    <div class="container">
      <div class="notifications-page__head">
        <div>
          <h1 class="notifications-page__title">{{ t('notifications.title') }}</h1>
          <p class="notifications-page__subtitle">{{ t('notifications.subtitle') }}</p>
        </div>
        <button
          v-if="!loading"
          type="button"
          class="notifications-page__refresh"
          :aria-label="t('categories.retry')"
          @click="load"
        >
          <AppIcon name="refresh" :size="16" />
        </button>
      </div>

      <!-- Push Notification Opt-in / Status Card -->
      <div v-if="isPushSupported" class="push-card">
        <div class="push-card__content">
          <div class="push-card__icon" :class="{ 'push-card__icon--active': pushPermission === 'granted' }">
            <AppIcon name="bell" :size="20" />
          </div>
          <div class="push-card__info">
            <div class="push-card__title-row">
              <h2 class="push-card__title">
                {{ pushPermission === 'granted' ? t('notifications.pushEnabled') : t('notifications.pushPromptTitle') }}
              </h2>
              <span
                class="push-badge"
                :class="{
                  'push-badge--granted': pushPermission === 'granted',
                  'push-badge--denied': pushPermission === 'denied',
                  'push-badge--default': pushPermission === 'default',
                }"
              >
                {{
                  pushPermission === 'granted'
                    ? t('notifications.pushEnabled')
                    : pushPermission === 'denied'
                      ? t('notifications.pushBlocked')
                      : t('notifications.enablePush')
                }}
              </span>
            </div>
            <p class="push-card__desc">
              {{
                pushPermission === 'granted'
                  ? t('notifications.subtitle')
                  : pushPermission === 'denied'
                    ? t('notifications.pushBlocked')
                    : t('notifications.pushPromptDesc')
              }}
            </p>

            <div v-if="pushPermission === 'granted' && pushToken" class="push-token-actions">
              <button type="button" class="push-token-toggle" @click="showToken = !showToken">
                <AppIcon name="user" :size="13" />
                {{ showToken ? 'Hide token' : t('notifications.copyToken') }}
              </button>

              <div v-if="showToken" class="push-token-box">
                <code class="push-token-text">{{ pushToken }}</code>
                <button type="button" class="push-token-copy" @click="copyToken">
                  {{ t('notifications.copyToken') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pushPermission === 'default'" class="push-card__action">
          <AppButton variant="primary" :disabled="isPushLoading" @click="enablePush">
            <AppIcon name="bell" :size="15" />
            {{ isPushLoading ? t('common.loading') : t('notifications.enablePush') }}
          </AppButton>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="loading" class="notifications-page__list" aria-label="Loading">
        <div v-for="i in 3" :key="i" class="notif-card notif-card--skeleton">
          <div class="notif-card__skeleton-icon" />
          <div class="notif-card__skeleton-body">
            <div class="notif-card__skeleton-line notif-card__skeleton-line--title" />
            <div class="notif-card__skeleton-line" />
            <div class="notif-card__skeleton-line notif-card__skeleton-line--short" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="notifications-page__state" role="alert">
        <span class="notifications-page__state-icon notifications-page__state-icon--error">
          <AppIcon name="alert-circle" :size="30" />
        </span>
        <h2 class="notifications-page__state-title">{{ t('notifications.error') }}</h2>
        <AppButton variant="primary" @click="load">
          <AppIcon name="refresh" :size="15" />
          {{ t('notifications.retry') }}
        </AppButton>
      </div>

      <!-- Empty State -->
      <div v-else-if="notifications.length === 0" class="notifications-page__state">
        <span class="notifications-page__state-icon">
          <AppIcon name="bell" :size="30" />
        </span>
        <h2 class="notifications-page__state-title">{{ t('notifications.empty') }}</h2>
        <p class="notifications-page__state-desc">{{ t('notifications.emptyDesc') }}</p>
      </div>

      <!-- Notifications List -->
      <div v-else class="notifications-page__list">
        <article
          v-for="notif in notifications"
          :key="notif.id"
          class="notif-card"
          :class="{ 'notif-card--expired': isExpired(notif.expired) }"
        >
          <div class="notif-card__icon-wrap">
            <AppIcon name="bell" :size="18" />
          </div>

          <div class="notif-card__content">
            <div class="notif-card__header">
              <h2 class="notif-card__title">{{ notif.title }}</h2>
              <time v-if="notif.createdAt" class="notif-card__time" :datetime="notif.createdAt">
                {{ formatDate(notif.createdAt) }}
              </time>
            </div>

            <p class="notif-card__message">{{ notif.message }}</p>

            <div class="notif-card__footer">
              <span v-if="notif.expired" class="notif-card__expired-tag">
                <AppIcon name="clock" :size="13" />
                {{ t('notifications.expiresAt') }}: {{ formatDate(notif.expired) }}
              </span>

              <a
                v-if="notif.link"
                :href="notif.link"
                class="notif-card__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('notifications.viewDetails') }}
                <AppIcon name="arrow-right" :size="14" />
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  min-height: 70vh;
  padding: 3rem var(--dz-gutter) 4.5rem;
  background: var(--dz-paper);
}

.notifications-page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.notifications-page__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.6rem, 3.5vw, 2.1rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.notifications-page__subtitle {
  margin-top: 0.4rem;
  font-size: 0.92rem;
  color: var(--dz-muted);
}

.notifications-page__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--dz-radius-full);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-ink-soft);
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s,
    transform 0.15s;
}

.notifications-page__refresh:hover {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  border-color: var(--dz-primary);
  transform: rotate(45deg);
}

/* Push Notification Card */
.push-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.25rem 1.4rem;
  margin-bottom: 1.75rem;
  max-width: 800px;
  margin-inline: auto;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-sm);
  flex-wrap: wrap;
}

.push-card__content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
  min-width: 260px;
}

.push-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
}

.push-card__icon--active {
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.push-card__info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
}

.push-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.push-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--dz-ink);
  margin: 0;
}

.push-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: var(--dz-radius-full);
}

.push-badge--granted {
  background: #ecfdf5;
  color: #059669;
}

.push-badge--denied {
  background: #fef2f2;
  color: #dc2626;
}

.push-badge--default {
  background: var(--dz-surface-soft);
  color: var(--dz-ink-soft);
}

.push-card__desc {
  font-size: 0.85rem;
  color: var(--dz-muted);
  line-height: 1.45;
  margin: 0;
}

.push-token-actions {
  margin-top: 0.5rem;
}

.push-token-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.push-token-toggle:hover {
  color: var(--dz-primary);
}

.push-token-box {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  max-width: 100%;
}

.push-token-text {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--dz-ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.push-token-copy {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.55rem;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  border: none;
  cursor: pointer;
}

.push-card__action {
  flex-shrink: 0;
}

.notifications-page__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin-inline: auto;
}

/* Card */
.notif-card {
  display: flex;
  align-items: flex-start;
  gap: 1.15rem;
  padding: 1.35rem 1.4rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-sm);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.15s;
}

.notif-card:hover {
  border-color: var(--dz-border-strong);
  box-shadow: var(--dz-shadow);
  transform: translateY(-1px);
}

.notif-card--expired {
  opacity: 0.72;
}

.notif-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  border-radius: var(--dz-radius-full);
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
}

.notif-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notif-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.notif-card__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--dz-ink);
  line-height: 1.4;
}

.notif-card__time {
  font-size: 0.78rem;
  color: var(--dz-muted);
  white-space: nowrap;
}

.notif-card__message {
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--dz-ink-soft);
  white-space: pre-line;
}

.notif-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
  padding-top: 0.65rem;
  border-top: 1px dashed var(--dz-border);
}

.notif-card__expired-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--dz-muted);
}

.notif-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dz-primary-strong);
  text-decoration: none;
  margin-inline-start: auto;
  transition: gap 0.2s, color 0.2s;
}

.notif-card__link:hover {
  color: var(--dz-primary);
  gap: 0.55rem;
}

html[dir='rtl'] .notif-card__link svg {
  transform: scaleX(-1);
}

/* State (empty / error) */
.notifications-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 4rem 1rem;
  text-align: center;
}

.notifications-page__state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  color: var(--dz-muted);
  margin-bottom: 0.4rem;
}

.notifications-page__state-icon--error {
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
}

.notifications-page__state-title {
  font-family: var(--dz-font-display);
  font-size: 1.15rem;
  font-weight: 600;
}

.notifications-page__state-desc {
  font-size: 0.88rem;
  color: var(--dz-muted);
  max-width: 38ch;
}

/* Skeleton */
.notif-card--skeleton {
  pointer-events: none;
}

.notif-card__skeleton-icon {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  animation: notif-pulse 1.4s ease-in-out infinite;
}

.notif-card__skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.notif-card__skeleton-line {
  height: 0.8rem;
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius-sm);
  animation: notif-pulse 1.4s ease-in-out infinite;
  width: 75%;
}

.notif-card__skeleton-line--title {
  height: 1.1rem;
  width: 45%;
}

.notif-card__skeleton-line--short {
  width: 35%;
}

@keyframes notif-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 560px) {
  .notifications-page {
    padding: 1.75rem var(--dz-gutter) 3.5rem;
  }

  .notifications-page__head {
    margin-bottom: 1.25rem;
  }

  .push-card {
    padding: 1rem;
    gap: 0.85rem;
  }

  .push-card__content {
    min-width: 0;
  }

  .push-card__action {
    width: 100%;
  }

  .push-card__action :deep(.app-button) {
    width: 100%;
    justify-content: center;
  }

  .notif-card {
    padding: 0.95rem 1rem;
    gap: 0.75rem;
  }

  .notif-card__icon-wrap {
    width: 2.2rem;
    height: 2.2rem;
  }

  .notif-card__header {
    flex-direction: column;
    gap: 0.25rem;
  }

  .notif-card__footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .notif-card__link {
    margin-inline-start: 0;
  }
}
</style>
