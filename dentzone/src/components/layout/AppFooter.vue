<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../../i18n'
import { WHATSAPP_LINK, CONTACT_PHONE, APP_STORE_LINK, GOOGLE_PLAY_LINK } from '../../config/contact.config'
import AppIcon from '../ui/AppIcon.vue'

interface CompanyLink {
  label: string
  type: 'route' | 'external'
  to?: string
  href?: string
}

const companyLinks = computed<CompanyLink[]>(() => [
  { label: t('footer.companyContact'), type: 'external', href: WHATSAPP_LINK },
  { label: t('footer.companyShipping'), type: 'route', to: '/refund-policy' },
  { label: t('footer.companyPrivacy'), type: 'route', to: '/privacy-policy' },
  { label: t('nav.termsConditions'), type: 'route', to: '/terms-and-conditions' },
])

const routeLinks = computed(() => companyLinks.value.filter((link): link is CompanyLink & { to: string } => link.type === 'route'))
const externalLinks = computed(() => companyLinks.value.filter((link): link is CompanyLink & { href: string } => link.type === 'external'))

const socialLinks = [
  { name: 'Facebook', icon: 'facebook' as const, href: 'https://www.facebook.com/profile.php?id=61573252657293' },
  { name: 'Instagram', icon: 'instagram' as const, href: 'https://www.instagram.com/dentzonee/' },
  { name: 'TikTok', icon: 'tiktok' as const, href: 'https://www.tiktok.com/@dentzonee' },
]
</script>

<template>
  <footer class="app-footer">
    <div class="container app-footer__inner">
      <div class="app-footer__brand">
        <RouterLink to="/" class="app-footer__logo">
          <img src="/denta-logo.png" alt="DentZone" class="app-footer__logo-img" />
          Dent<span>Zone</span>
        </RouterLink>
        <p class="app-footer__tagline">
          {{ t('footer.tagline') }}
        </p>
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

      <nav class="app-footer__col" :aria-label="t('footer.companyHeading')">
        <h3 class="app-footer__heading">{{ t('footer.companyHeading') }}</h3>
        <RouterLink
          v-for="link in routeLinks"
          :key="link.to"
          :to="link.to"
          class="app-footer__link"
        >
          {{ link.label }}
        </RouterLink>
        <a
          v-for="link in externalLinks"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="app-footer__link"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="app-footer__col app-footer__col--app">
        <h3 class="app-footer__heading">{{ t('footer.appHeading') }}</h3>
        <p class="app-footer__app-sub">{{ t('footer.appSub') }}</p>
        <a
          class="app-footer__store-badge"
          :href="APP_STORE_LINK"
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
          :href="GOOGLE_PLAY_LINK"
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
        <a
          class="app-footer__link app-footer__link--whatsapp"
          :href="WHATSAPP_LINK"
          target="_blank"
          rel="noopener noreferrer"
        >
          <AppIcon name="whatsapp" :size="15" filled />
          {{ CONTACT_PHONE }}
        </a>
        <!--<span class="app-footer__link">{{ t('footer.helpHours') }}</span>-->
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

.app-footer__inner {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
  gap: 2rem;
  padding-top: 3rem;
  padding-bottom: 2.5rem;
}

.app-footer__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-family: var(--dz-font-display);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.app-footer__logo span {
  color: var(--dz-gold-strong);
}

.app-footer__logo-img {
  display: block;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: var(--dz-radius-md);
  object-fit: contain;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
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
  flex-wrap: wrap;
}

.app-footer__social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
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

.app-footer__social-link:focus-visible,
.app-footer__store-badge:focus-visible,
.app-footer__link:focus-visible {
  outline: 3px solid var(--dz-primary);
  outline-offset: 2px;
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
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-band);
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
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding-block: 0.15rem;
  font-size: 0.875rem;
  color: var(--dz-ink-soft);
  transition: color 0.2s;
}

.app-footer__link:hover {
  color: var(--dz-primary-strong);
}

.app-footer__link--whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #1da851;
}

.app-footer__link--whatsapp:hover {
  color: #128c4a;
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

@media (max-width: 1000px) {
  .app-footer__inner {
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 800px) {
  .app-footer__inner {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .app-footer {
    margin-top: 2rem;
  }

  .app-footer__inner {
    grid-template-columns: 1fr;
    gap: 1.75rem;
    padding-top: 2rem;
    padding-bottom: 2rem;
  }

  .app-footer__tagline {
    max-width: 100%;
  }

  .app-footer__bottom .container {
    flex-direction: column;
    text-align: center;
    gap: 0.4rem;
  }
}
</style>
