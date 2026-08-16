<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    align?: 'left' | 'center'
  }>(),
  { align: 'left' },
)
</script>

<template>
  <div class="section-header" :class="`section-header--${align}`">
    <div class="section-header__text">
      <h2 class="section-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="section-header__subtitle">{{ subtitle }}</p>
    </div>
    <div class="section-header__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.section-header--center {
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.section-header__title {
  font-size: 1.6rem;
}

.section-header__subtitle {
  margin-top: 0.3rem;
  color: var(--dz-muted);
  font-size: 0.95rem;
}
</style>