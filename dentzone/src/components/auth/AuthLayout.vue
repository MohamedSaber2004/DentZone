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
          <img src="/denta-logo.png" alt="DentZone" class="auth-layout__logo-img" />
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
  gap: 0.8rem;
  align-self: center;
  transition: transform 0.2s ease;
}

.auth-layout__brand:hover {
  transform: scale(1.03);
}

.auth-layout__logo-img {
  display: block;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--dz-radius-md);
  object-fit: contain;
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.14);
}

.auth-layout__wordmark {
  font-family: var(--dz-font-display);
  font-size: 1.6rem;
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