<script setup lang="ts">
import { computed, ref } from 'vue'
import { toastService } from '../../application/toast.service'
import { categoryName, t } from '../../i18n'
import AppIcon from '../ui/AppIcon.vue'
import AppButton from '../ui/AppButton.vue'

const categoryLinks = [
  { categoryId: 'cat-toothbrushes', to: '/catalog?category=cat-toothbrushes' },
  { categoryId: 'cat-toothpaste', to: '/catalog?category=cat-toothpaste' },
  { categoryId: 'cat-mouthwash', to: '/catalog?category=cat-mouthwash' },
  { categoryId: 'cat-whitening', to: '/catalog?category=cat-whitening' },
  { categoryId: 'cat-floss', to: '/catalog?category=cat-floss' },
  { categoryId: 'cat-accessories', to: '/catalog?category=cat-accessories' },
]

const companyLinks = computed(() => [
  { label: t('footer.companyAbout'), to: '/' },
  { label: t('footer.companyContact'), to: '/' },
  { label: t('footer.companyShipping'), to: '/' },
  { label: t('footer.companyPrivacy'), to: '/' },
])

const newsletterEmail = ref('')

const socialLinks = [
  { name: 'Facebook', icon: 'facebook' as const, href: 'https://facebook.com/dentzone' },
  { name: 'Instagram', icon: 'instagram' as const, href: 'https://instagram.com/dentzone' },
  { name: 'X', icon: 'twitter' as const, href: 'https://x.com/dentzone' },
  { name: 'YouTube', icon: 'youtube' as const, href: 'https://youtube.com/@dentzone' },
  { name: 'TikTok', icon: 'tiktok' as const, href: 'https://tiktok.com/@dentzone' },
]

const subscribe = () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.value)) {
    toastService.error(t('footer.invalidEmail'))
    return
  }
  toastService.success(t('footer.subscribed'))
  newsletterEmail.value = ''
}
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__newsletter">
      <div class="container app-footer__newsletter-inner">
        <div>
          <h3 class="app-footer__newsletter-title">{{ t('footer.newsletterTitle') }}</h3>
          <p class="app-footer__newsletter-sub">
            {{ t('footer.newsletterSub') }}
          </p>
        </div>
        <form class="app-footer__newsletter-form" @submit.prevent="subscribe">
          <input
            v-model="newsletterEmail"
            class="app-footer__newsletter-input"
            type="email"
            :placeholder="t('footer.emailPlaceholder')"
            :aria-label="t('footer.emailAria')"
          />
          <AppButton type="submit">{{ t('footer.subscribe') }}</AppButton>
        </form>
      </div>
    </div>

    <div class="container app-footer__inner">
      <div class="app-footer__brand">
        <RouterLink to="/" class="app-footer__logo">
          <span class="app-footer__logo-tile">
            <AppIcon name="tooth" :size="18" />
          </span>
          Dent<span>Zone</span>
        </RouterLink>
        <p class="app-footer__tagline">
          {{ t('footer.tagline') }}
        </p>
        <div class="app-footer__trust">
          <span class="app-footer__trust-item">
            <AppIcon name="truck" :size="15" /> {{ t('footer.freeShippingOver') }}
          </span>
          <span class="app-footer__trust-item">
            <AppIcon name="shield-check" :size="15" /> {{ t('footer.guarantee') }}
          </span>
        </div>
        <div class="app-footer__social">
          <h3 class="app-footer__heading">{{ t('footer.socialHeading') }}</h3>
          <div class="app-footer__social-icons">
            <a
              v-for="social in socialLinks"
              :key="social.name"
              class="app-footer__social-link"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.name"
              :title="social.name"
            >
              <AppIcon :name="social.icon" :size="17" filled />
            </a>
          </div>
        </div>
      </div>

      <nav class="app-footer__col" :aria-label="t('footer.shopHeading')">
        <h3 class="app-footer__heading">{{ t('footer.shopHeading') }}</h3>
        <RouterLink
          v-for="link in categoryLinks"
          :key="link.categoryId"
          :to="link.to"
          class="app-footer__link"
        >
          {{ categoryName(link.categoryId) }}
        </RouterLink>
      </nav>

      <nav class="app-footer__col" :aria-label="t('footer.companyHeading')">
        <h3 class="app-footer__heading">{{ t('footer.companyHeading') }}</h3>
        <RouterLink v-for="link in companyLinks" :key="link.label" :to="link.to" class="app-footer__link">
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="app-footer__col app-footer__col--app">
        <h3 class="app-footer__heading">{{ t('footer.appHeading') }}</h3>
        <p class="app-footer__app-sub">{{ t('footer.appSub') }}</p>
        <a
          class="app-footer__store-badge"
          href="https://apps.apple.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <AppIcon name="apple" :size="22" filled />
          <span class="app-footer__store-text">
            <span class="app-footer__store-caption">{{ t('footer.downloadOn') }}</span>
            <strong>{{ t('footer.appStore') }}</strong>
          </span>
        </a>
        <a
          class="app-footer__store-badge"
          href="https://play.google.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <AppIcon name="google-play" :size="20" filled />
          <span class="app-footer__store-text">
            <span class="app-footer__store-caption">{{ t('footer.getItOn') }}</span>
            <strong>{{ t('footer.googlePlay') }}</strong>
          </span>
        </a>
      </div>

      <div class="app-footer__col">
        <h3 class="app-footer__heading">{{ t('footer.helpHeading') }}</h3>
        <span class="app-footer__link">support@dentzone.store</span>
        <span class="app-footer__link">+1 (555) 014-2026</span>
        <span class="app-footer__link">{{ t('footer.helpHours') }}</span>
      </div>
    </div>

    <div class="app-footer__bottom">
      <div class="container">
        <span>{{ t('footer.rights', { year: new Date().getFullYear() }) }}</span>
        <span class="app-footer__made">{{ t('footer.madeFor') }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 3rem;
  background: var(--dz-surface);
  border-top: 1px solid var(--dz-border);
}

.app-footer__newsletter {
  background: linear-gradient(120deg, var(--dz-primary) 0%, var(--dz-accent) 100%);
}

.app-footer__newsletter-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 2.2rem;
  padding-bottom: 2.2rem;
}

.app-footer__newsletter-title {
  color: var(--dz-white);
  font-size: 1.25rem;
}

.app-footer__newsletter-sub {
  color: rgb(255 255 255 / 0.85);
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

.app-footer__newsletter-form {
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
}

.app-footer__newsletter-input {
  width: 240px;
  padding: 0.65rem 1rem;
  border: 1px solid rgb(255 255 255 / 0.4);
  border-radius: var(--dz-radius);
  background: rgb(255 255 255 / 0.14);
  color: var(--dz-white);
  font-size: 0.9rem;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.app-footer__newsletter-input::placeholder {
  color: rgb(255 255 255 / 0.65);
}

.app-footer__newsletter-input:focus {
  outline: none;
  background: rgb(255 255 255 / 0.22);
  border-color: var(--dz-white);
}

.app-footer__newsletter :deep(.app-button--primary) {
  background: var(--dz-white);
  color: var(--dz-primary-strong);
  box-shadow: none;
}

.app-footer__inner {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr;
  gap: 2rem;
  padding-top: 3rem;
  padding-bottom: 2.5rem;
}

.app-footer__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.app-footer__logo span {
  color: var(--dz-primary);
}

.app-footer__logo-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--dz-radius-sm);
  background: var(--dz-gradient);
  color: var(--dz-white);
}

.app-footer__tagline {
  margin-top: 0.7rem;
  max-width: 280px;
  color: var(--dz-muted);
  font-size: 0.85rem;
}

.app-footer__trust {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1rem;
}

.app-footer__trust-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.app-footer__trust-item svg {
  color: var(--dz-primary);
}

.app-footer__heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--dz-ink);
  margin-bottom: 0.85rem;
}

.app-footer__col {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.app-footer__social {
  margin-top: 1.1rem;
}

.app-footer__social .app-footer__heading {
  margin-bottom: 0.6rem;
}

.app-footer__social-icons {
  display: flex;
  gap: 0.5rem;
}

.app-footer__social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: var(--dz-radius);
  border: 1px solid var(--dz-border);
  background: var(--dz-surface);
  color: var(--dz-muted);
  transition:
    color 0.2s,
    border-color 0.2s,
    transform 0.15s,
    background-color 0.2s;
}

.app-footer__social-link:hover {
  color: var(--dz-primary-strong);
  border-color: var(--dz-primary-soft);
  background: var(--dz-primary-faint);
  transform: translateY(-2px);
}

.app-footer__app-sub {
  font-size: 0.8rem;
  color: var(--dz-muted);
  margin-bottom: 0.6rem;
}

.app-footer__store-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-ink);
  color: var(--dz-white);
  transition:
    transform 0.15s,
    border-color 0.2s;
}

.app-footer__store-badge:hover {
  transform: translateY(-2px);
  border-color: var(--dz-primary);
}

.app-footer__store-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.app-footer__store-caption {
  font-size: 0.62rem;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.app-footer__store-text strong {
  font-size: 0.85rem;
}

.app-footer__link {
  font-size: 0.875rem;
  color: var(--dz-ink-soft);
  transition: color 0.2s;
}

.app-footer__link:hover {
  color: var(--dz-primary-strong);
}

.app-footer__bottom {
  border-top: 1px solid var(--dz-border);
  padding: 1rem 0;
  font-size: 0.8rem;
  color: var(--dz-muted);
}

.app-footer__bottom .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.app-footer__heart {
  color: var(--dz-danger);
}

@media (max-width: 900px) {
  .app-footer__newsletter-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .app-footer__newsletter-form {
    width: 100%;
  }

  .app-footer__newsletter-input {
    flex: 1;
    width: auto;
  }
}

@media (max-width: 1000px) {
  .app-footer__inner {
    grid-template-columns: 1.5fr 1fr 1fr;
  }
}

@media (max-width: 800px) {
  .app-footer__inner {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .app-footer__inner {
    grid-template-columns: 1fr;
  }
}
</style>