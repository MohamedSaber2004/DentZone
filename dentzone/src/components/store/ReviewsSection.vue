<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Product } from '../../domain/models/product'
import type { Review } from '../../domain/models/review'
import { catalogService } from '../../application/catalog.service'
import { locale, t } from '../../i18n'
import RatingStars from '../ui/RatingStars.vue'
import AppBadge from '../ui/AppBadge.vue'
import AppSpinner from '../ui/AppSpinner.vue'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  product: Product
}>()

const reviews = ref<Review[]>([])
const loading = ref(true)

const distribution = computed(() => {
  const total = reviews.value.length
  if (total === 0) return []
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.value.filter((review) => Math.round(review.rating) === stars).length
    return { stars, percentage: Math.round((count / total) * 100) }
  })
})

const averageLabel = computed(() => props.product.rating.toFixed(1))
const basedOnLabel = computed(() => t('product.reviewsBasedOn', { count: props.product.reviewCount }))

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))

const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

const loadReviews = async () => {
  loading.value = true
  try {
    reviews.value = await catalogService.getReviews(props.product.id)
  } catch {
    reviews.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadReviews()
})
</script>

<template>
  <div class="reviews">
    <div class="reviews__summary">
      <div class="reviews__score">
        <span class="reviews__average">{{ averageLabel }}</span>
        <RatingStars :rating="product.rating" size="md" />
        <span class="reviews__based-on">{{ basedOnLabel }}</span>
      </div>

      <ul class="reviews__distribution">
        <li v-for="item in distribution" :key="item.stars" class="reviews__row">
          <span class="reviews__star-label">{{ item.stars }} ★</span>
          <span class="reviews__track">
            <span class="reviews__fill" :style="{ width: `${item.percentage}%` }" />
          </span>
          <span class="reviews__percent">{{ item.percentage }}%</span>
        </li>
      </ul>
    </div>

    <div v-if="loading" class="reviews__loading" role="status">
      <AppSpinner size="md" :label="t('product.loadingReviews')" />
    </div>

    <ul v-else class="reviews__list">
      <li v-for="review in reviews" :key="review.id" class="review">
        <div class="review__head">
          <span class="review__avatar" aria-hidden="true">{{ initials(review.author) }}</span>
          <div class="review__meta">
            <span class="review__author">{{ review.author }}</span>
            <div class="review__sub">
              <RatingStars :rating="review.rating" size="sm" />
              <span class="review__date">{{ formatDate(review.createdAt) }}</span>
            </div>
          </div>
          <AppBadge v-if="review.verifiedPurchase" tone="success">
            <AppIcon name="check-circle" :size="12" />
            {{ t('product.verifiedPurchase') }}
          </AppBadge>
        </div>
        <p class="review__content">{{ review.content }}</p>
        <span class="review__helpful">
          <AppIcon name="smile" :size="14" />
          {{ t('product.helpful', { count: review.helpfulCount }) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.reviews {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2.5rem;
  align-items: start;
}

.reviews__summary {
  position: sticky;
  top: calc(var(--dz-header-height) + 1.25rem);
  padding: 1.5rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  background: var(--dz-surface-soft);
}

.reviews__score {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--dz-border);
}

.reviews__average {
  font-family: var(--dz-font-display);
  font-size: 2.6rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
}

.reviews__based-on {
  font-size: 0.82rem;
  color: var(--dz-muted);
}

.reviews__distribution {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 1.1rem;
}

.reviews__row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.reviews__star-label {
  width: 2.6rem;
  flex-shrink: 0;
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--dz-ink-soft);
}

.reviews__track {
  flex: 1;
  height: 0.5rem;
  border-radius: var(--dz-radius-full);
  background: var(--dz-star-track);
  overflow: hidden;
}

.reviews__fill {
  display: block;
  height: 100%;
  border-radius: var(--dz-radius-full);
  background: var(--dz-star);
}

.reviews__percent {
  width: 2.8rem;
  flex-shrink: 0;
  text-align: end;
  font-family: var(--dz-font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.reviews__loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.reviews__list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.review {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.25rem 1.4rem;
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius);
  background: var(--dz-surface);
}

.review__head {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.review__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--dz-primary-soft);
  color: var(--dz-primary-strong);
  font-family: var(--dz-font-display);
  font-size: 0.85rem;
  font-weight: 700;
}

.review__meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  min-width: 0;
}

.review__author {
  font-size: 0.9rem;
  font-weight: 700;
}

.review__sub {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.review__date {
  font-size: 0.78rem;
  color: var(--dz-muted);
}

.review__content {
  font-size: 0.92rem;
  line-height: 1.65;
  color: var(--dz-ink-soft);
}

.review__helpful {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dz-muted);
}

.review__helpful svg {
  color: var(--dz-primary);
}

@media (max-width: 900px) {
  .reviews {
    grid-template-columns: 1fr;
  }

  .reviews__summary {
    position: static;
  }
}
</style>