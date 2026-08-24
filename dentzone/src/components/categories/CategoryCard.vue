<script setup lang="ts">
import { categoryImageUrl, type CategoryDto } from '../../domain/models/category'
import { locale } from '../../i18n'
import { ref } from 'vue'
import AppIcon from '../ui/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    category: CategoryDto
    to?: string
  }>(),
  { to: undefined },
)

const imageFailed = ref(false)

const displayName = () =>
  locale.value === 'ar'
    ? props.category.arabicName || props.category.pref || props.category.name
    : props.category.pref || props.category.name

const secondary = () => {
  const primary = displayName()
  if (locale.value === 'ar') {
    if (props.category.name && props.category.name.trim() !== primary.trim()) {
      return props.category.name.trim()
    }
    if (props.category.description && props.category.description.trim() !== primary.trim()) {
      return props.category.description.trim()
    }
    return ''
  }
  if (props.category.description && props.category.description.trim() !== primary.trim()) {
    return props.category.description.trim()
  }
  return ''
}

const onImageError = () => {
  imageFailed.value = true
}
</script>

<template>
  <Component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    class="category-card"
    :class="{ 'category-card--link': to }"
  >
    <div class="category-card__media">
      <img
        v-if="category.imageName && !imageFailed"
        :src="categoryImageUrl(category.imageName)"
        :alt="displayName()"
        loading="lazy"
        @error="onImageError"
      />
      <span v-else class="category-card__placeholder">
        <AppIcon name="store" :size="30" />
      </span>
    </div>
    <div class="category-card__body">
      <h3 class="category-card__name">{{ displayName() }}</h3>
      <p v-if="secondary()" class="category-card__desc">{{ secondary() }}</p>
    </div>
    <span v-if="to" class="category-card__arrow">
      <AppIcon name="chevron-right" :size="17" />
    </span>
  </Component>
</template>

<style scoped>
.category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  overflow: hidden;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.category-card--link:hover {
  transform: translateY(-3px);
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow);
}

.category-card--link:focus-visible {
  outline: none;
  box-shadow: var(--dz-ring);
}

.category-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  width: 100%;
  padding: 0.85rem;
  background: var(--dz-surface-soft);
  overflow: hidden;
}

.category-card__media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  transition: transform 0.25s ease;
}

.category-card--link:hover .category-card__media img {
  transform: scale(1.05);
}

.category-card__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dz-border-strong);
}

.category-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1rem 1.1rem 1.15rem;
}

.category-card__name {
  font-family: var(--dz-font-display);
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dz-ink);
}

.category-card__desc {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--dz-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.category-card__arrow {
  position: absolute;
  top: 1rem;
  inset-inline-end: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: var(--dz-radius-full);
  background: rgb(255 255 255 / 0.85);
  color: var(--dz-ink-soft);
  box-shadow: var(--dz-shadow-sm);
}

html[dir='rtl'] .category-card__arrow svg {
  transform: scaleX(-1);
}

@media (max-width: 560px) {
  .category-card__media {
    padding: 0.65rem;
  }

  .category-card__body {
    padding: 0.75rem 0.85rem 0.95rem;
    gap: 0.2rem;
  }

  .category-card__name {
    font-size: 0.92rem;
  }

  .category-card__desc {
    font-size: 0.75rem;
  }

  .category-card__arrow {
    top: 0.65rem;
    inset-inline-end: 0.65rem;
    width: 1.85rem;
    height: 1.85rem;
  }
}
</style>