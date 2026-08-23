<script setup lang="ts">
import { t } from '../../i18n'

withDefaults(
  defineProps<{
    current: number
  }>(),
  { current: 1 },
)
</script>

<template>
  <ol class="pw-steps" :aria-label="t('auth.recoveryProgress')">
    <li
      v-for="step in 3"
      :key="step"
      class="pw-steps__item"
      :class="{ 'pw-steps__item--done': step < current, 'pw-steps__item--active': step === current }"
      :aria-current="step === current ? 'step' : undefined"
    >
      <span class="pw-steps__dot">{{ step }}</span>
      <span v-if="step < 3" class="pw-steps__bar" aria-hidden="true" />
    </li>
  </ol>
</template>

<style scoped>
.pw-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.pw-steps__item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pw-steps__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-surface-soft);
  border: 1px solid var(--dz-border);
  color: var(--dz-muted);
  font-size: 0.78rem;
  font-weight: 700;
  font-family: var(--dz-font-display);
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.pw-steps__bar {
  width: 2.4rem;
  height: 2px;
  border-radius: 2px;
  background: var(--dz-border);
  transition: background 0.2s ease;
}

.pw-steps__item--done .pw-steps__dot {
  background: var(--dz-primary);
  border-color: var(--dz-primary);
  color: var(--dz-on-primary);
}

.pw-steps__item--done .pw-steps__bar {
  background: var(--dz-primary);
}

.pw-steps__item--active .pw-steps__dot {
  background: var(--dz-gold);
  border-color: var(--dz-gold);
  color: var(--dz-on-gold);
  box-shadow: 0 4px 12px rgb(184 134 43 / 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .pw-steps__dot,
  .pw-steps__bar {
    transition: none;
  }
}
</style>