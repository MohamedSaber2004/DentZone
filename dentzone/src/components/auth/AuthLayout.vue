<script setup lang="ts">
import AppIcon from '../ui/AppIcon.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle: string
  }>(),
  { title: '', subtitle: '' },
)
</script>

<template>
  <div class="auth-layout">
    <div class="auth-layout__glow" aria-hidden="true" />
    <div class="container auth-layout__inner">
      <div class="auth-layout__card">
        <RouterLink to="/" class="auth-layout__brand">
          <span class="auth-layout__logo">
            <AppIcon name="tooth" :size="24" />
          </span>
          <span class="auth-layout__wordmark">Dent<span>Zone</span></span>
        </RouterLink>

        <div class="auth-layout__heading">
          <h1 class="auth-layout__title">{{ title }}</h1>
          <p class="auth-layout__subtitle">{{ subtitle }}</p>
        </div>

        <slot />

        <p class="auth-layout__footnote">
          <AppIcon name="shield-check" :size="14" />
          <span class="auth-layout__footnote-text">Your data is protected with secure encryption.</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: calc(100vh - var(--dz-header-height));
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(44rem 24rem at 85% -10%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-paper);
  padding: 3rem var(--dz-gutter);
  overflow: hidden;
}

html[dir='rtl'] .auth-layout {
  background:
    radial-gradient(44rem 24rem at 15% -10%, var(--dz-primary-soft) 0%, transparent 60%),
    var(--dz-paper);
}

.auth-layout__glow {
  position: absolute;
  inset: auto -6rem -8rem auto;
  width: 20rem;
  height: 20rem;
  border-radius: 50%;
  background: radial-gradient(circle, var(--dz-gold-faint) 0%, transparent 65%);
  pointer-events: none;
}

html[dir='rtl'] .auth-layout__glow {
  inset: auto auto -8rem -6rem;
}

.auth-layout__inner {
  width: 100%;
  display: flex;
  justify-content: center;
}

.auth-layout__card {
  width: min(100%, 420px);
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 2.25rem 2.25rem 1.75rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  box-shadow: var(--dz-shadow-lg);
  animation: auth-card-in 0.35s ease both;
}

@keyframes auth-card-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-layout__card {
    animation: none;
  }
}

.auth-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  align-self: center;
}

.auth-layout__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--dz-radius);
  background: var(--dz-primary);
  color: var(--dz-on-primary);
  box-shadow: var(--dz-shadow-primary);
}

.auth-layout__wordmark {
  font-family: var(--dz-font-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dz-ink);
}

.auth-layout__wordmark span {
  color: var(--dz-gold-strong);
}

.auth-layout__heading {
  text-align: center;
}

.auth-layout__title {
  font-family: var(--dz-font-display);
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.auth-layout__subtitle {
  margin-top: 0.4rem;
  font-size: 0.9rem;
  color: var(--dz-muted);
}

.auth-layout__footnote {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--dz-border);
  color: var(--dz-muted);
  font-size: 0.75rem;
}

.auth-layout__footnote svg {
  color: var(--dz-primary);
  flex-shrink: 0;
}
</style>