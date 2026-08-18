<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'grid' | 'cards' | 'rows' | 'detail' | 'hero'
    count?: number
  }>(),
  { variant: 'grid', count: 4 },
)
</script>

<template>
  <div class="skeleton-loader" :class="`skeleton-loader--${variant}`" role="status" aria-label="Loading">
    <template v-for="n in count" :key="n">
      <div v-if="variant === 'grid'" class="skeleton-card">
        <div class="skeleton skeleton-card__image" />
        <div class="skeleton skeleton-card__line skeleton-card__line--title" />
        <div class="skeleton skeleton-card__line skeleton-card__line--subtitle" />
        <div class="skeleton skeleton-card__line skeleton-card__line--price" />
      </div>

      <div v-else-if="variant === 'cards'" class="skeleton-card-row">
        <div class="skeleton skeleton-card-row__thumb" />
        <div class="skeleton-card-row__body">
          <div class="skeleton skeleton-card-row__line skeleton-card-row__line--title" />
          <div class="skeleton skeleton-card-row__line" />
        </div>
      </div>

      <div v-else-if="variant === 'rows'" class="skeleton-row">
        <div class="skeleton skeleton-row__thumb" />
        <div class="skeleton-row__body">
          <div class="skeleton skeleton-row__line skeleton-row__line--title" />
          <div class="skeleton skeleton-row__line skeleton-row__line--short" />
        </div>
        <div class="skeleton skeleton-row__line skeleton-row__line--price" />
      </div>

      <div v-else-if="variant === 'detail'" class="skeleton-detail">
        <div class="skeleton skeleton-detail__image" />
        <div class="skeleton-detail__body">
          <div class="skeleton skeleton-detail__line skeleton-detail__line--tag" />
          <div class="skeleton skeleton-detail__line skeleton-detail__line--title" />
          <div class="skeleton skeleton-detail__line skeleton-detail__line--text" />
          <div class="skeleton skeleton-detail__line skeleton-detail__line--text" />
          <div class="skeleton skeleton-detail__line skeleton-detail__line--price" />
        </div>
      </div>

      <div v-else class="skeleton skeleton-hero" />
    </template>
  </div>
</template>

<style scoped>
.skeleton-loader {
  display: grid;
  gap: 1.1rem;
}

.skeleton-loader--grid {
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
}

.skeleton-loader--cards {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.skeleton-loader--rows {
  grid-template-columns: 1fr;
}

.skeleton {
  position: relative;
  overflow: hidden;
  background: var(--dz-surface-soft);
  border-radius: var(--dz-radius);
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.28), transparent);
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
}

.skeleton-card__image {
  aspect-ratio: 1;
  border-radius: var(--dz-radius);
}

.skeleton-card__line {
  height: 0.8rem;
}

.skeleton-card__line--title {
  width: 70%;
}

.skeleton-card__line--subtitle {
  width: 90%;
  height: 0.65rem;
}

.skeleton-card__line--price {
  width: 40%;
  height: 0.9rem;
}

.skeleton-card-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
}

.skeleton-card-row__thumb {
  width: 3.2rem;
  height: 3.2rem;
  flex-shrink: 0;
  border-radius: 50%;
}

.skeleton-card-row__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-card-row__line {
  height: 0.75rem;
  width: 100%;
}

.skeleton-card-row__line--title {
  width: 60%;
  height: 0.9rem;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface);
}

.skeleton-row__thumb {
  width: 4.2rem;
  height: 4.2rem;
  flex-shrink: 0;
}

.skeleton-row__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-row__line {
  height: 0.8rem;
  width: 100%;
}

.skeleton-row__line--title {
  width: 55%;
  height: 0.95rem;
}

.skeleton-row__line--short {
  width: 35%;
}

.skeleton-row__line--price {
  width: 5rem;
  height: 0.95rem;
}

.skeleton-detail {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: 2rem;
  align-items: start;
}

.skeleton-detail__image {
  aspect-ratio: 1;
  border-radius: var(--dz-radius-lg);
}

.skeleton-detail__body {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding-top: 0.5rem;
}

.skeleton-detail__line {
  height: 0.85rem;
  width: 100%;
}

.skeleton-detail__line--tag {
  width: 30%;
  height: 0.6rem;
}

.skeleton-detail__line--title {
  width: 75%;
  height: 1.6rem;
}

.skeleton-detail__line--text {
  width: 90%;
}

.skeleton-detail__line--price {
  width: 35%;
  height: 1.4rem;
  margin-top: 0.5rem;
}

.skeleton-hero {
  height: 280px;
  border-radius: var(--dz-radius-lg);
}

@media (max-width: 800px) {
  .skeleton-detail {
    grid-template-columns: 1fr;
  }
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>