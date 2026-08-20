<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { services } from '../di/container'
import { locale, t } from '../i18n'
import { API_LANG } from '../config/api.config'
import AppIcon from '../components/ui/AppIcon.vue'
import AppButton from '../components/ui/AppButton.vue'

const router = useRouter()
const { policyRepository } = services

const html = ref('')
const loading = ref(true)
const failed = ref(false)
const frameRef = ref<HTMLIFrameElement | null>(null)

const fetchRefundPolicy = (lang: number): Promise<string> => policyRepository.getRefundPolicy(lang)

const load = async () => {
  loading.value = true
  failed.value = false
  try {
    try {
      html.value = await fetchRefundPolicy(locale.value === 'ar' ? API_LANG.ARABIC : API_LANG.ENGLISH)
    } catch {
      html.value = await fetchRefundPolicy(API_LANG.ARABIC)
    }
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

const resizeFrame = () => {
  const frame = frameRef.value
  const doc = frame?.contentDocument
  if (frame && doc) {
    const height = Math.max(doc.body?.scrollHeight ?? 0, doc.documentElement?.scrollHeight ?? 0)
    frame.style.height = `${Math.max(height, 320)}px`
  }
}

onMounted(() => {
  void load()
  window.addEventListener('resize', resizeFrame)
})

watch(locale, () => {
  void load()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeFrame)
})
</script>

<template>
  <div class="page">
    <div class="container page__inner">
      <button type="button" class="page__back" @click="router.back()">
        <AppIcon name="arrow-left" :size="15" />
        {{ t('refund.back') }}
      </button>

      <h1 class="page__title">{{ t('refund.title') }}</h1>

      <div v-if="loading" class="policy__skeleton" aria-label="Loading">
        <span class="skeleton skeleton__title" />
        <span class="skeleton skeleton__line" />
        <span class="skeleton skeleton__line" />
        <span class="skeleton skeleton__line skeleton__line--short" />
        <span class="skeleton skeleton__line" />
        <span class="skeleton skeleton__line" />
        <span class="skeleton skeleton__line skeleton__line--short" />
      </div>

      <div v-else-if="failed" class="page__state">
        <span class="page__state-icon"><AppIcon name="alert-circle" :size="30" /></span>
        <h2 class="page__state-title">{{ t('refund.errorTitle') }}</h2>
        <p class="page__state-desc">{{ t('refund.errorDescription') }}</p>
        <AppButton variant="primary" @click="load">
          <AppIcon name="refresh" :size="15" />
          {{ t('categories.retry') }}
        </AppButton>
      </div>

      <iframe
        v-else-if="html"
        ref="frameRef"
        class="policy__frame"
        sandbox="allow-same-origin"
        :srcdoc="html"
        :title="t('refund.title')"
        @load="resizeFrame"
      />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding-block: 2rem 4rem;
}

.page__inner {
  max-width: 820px;
}

.page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--dz-radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
  transition:
    background-color 0.2s,
    color 0.2s;
}

.page__back:hover {
  background: var(--dz-surface-soft);
  color: var(--dz-primary-strong);
}

.page__back :deep(svg) {
  transform: scaleX(-1);
}

[dir='rtl'] .page__back :deep(svg) {
  transform: none;
}

.page__title {
  font-family: var(--dz-font-display);
  font-size: clamp(1.6rem, 3.5vw, 2.1rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
  margin-bottom: 1.75rem;
}

.page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3.5rem 1rem;
  text-align: center;
}

.page__state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-danger-soft);
  color: var(--dz-danger);
  margin-bottom: 0.5rem;
}

.page__state-title {
  font-family: var(--dz-font-display);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--dz-ink);
}

.page__state-desc {
  font-size: 0.9rem;
  color: var(--dz-muted);
  margin-bottom: 1rem;
}

.policy__skeleton {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton {
  border-radius: var(--dz-radius);
  background: var(--dz-surface-soft);
  animation: policy-pulse 1.4s ease-in-out infinite;
}

.skeleton__title {
  width: 45%;
  height: 1.9rem;
  margin-bottom: 0.5rem;
}

.skeleton__line {
  width: 100%;
  height: 0.9rem;
}

.skeleton__line--short {
  width: 70%;
}

.policy__frame {
  display: block;
  width: 100%;
  height: 320px;
  border: 0;
  border-radius: var(--dz-radius-lg);
  background: #fff;
  color-scheme: light;
  overflow: hidden;
}

@keyframes policy-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}
</style>