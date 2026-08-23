<script setup lang="ts">
import { ref } from 'vue'
import { t } from '../../i18n'
import { resolveMediaUrl } from '../../utils/media'
import AppIcon from '../ui/AppIcon.vue'
import type { HomeProviderDto } from '../../domain/models/home'

defineProps<{
  providers: HomeProviderDto[]
}>()

const failedImages = ref<Set<string>>(new Set())
</script>

<template>
  <div v-if="providers.length" class="provider-grid">
    <RouterLink
      v-for="provider in providers"
      :key="provider.id"
      :to="{ name: 'inventory-products', params: { inventoryUserId: provider.id }, query: { supplier: provider.fullName } }"
      class="provider-card"
    >
      <span class="provider-card__avatar">
        <img
          v-if="provider.profileImage && !failedImages.has(provider.id)"
          :src="resolveMediaUrl(provider.profileImage)"
          :alt="provider.fullName"
          loading="lazy"
          @error="failedImages.add(provider.id)"
        />
        <AppIcon v-else name="store" :size="22" />
      </span>
      <span class="provider-card__meta">
        <strong>{{ provider.fullName }}</strong>
        <span
          class="provider-card__status"
          :class="provider.isAvailableNow ? 'provider-card__status--on' : 'provider-card__status--off'"
        >
          <span class="provider-card__dot" aria-hidden="true" />
          {{ t(provider.isAvailableNow ? 'categories.available' : 'categories.notAvailable') }}
        </span>
      </span>
    </RouterLink>
  </div>
</template>

<style scoped>
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 0.85rem;
}

.provider-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  background: var(--dz-surface);
  border: 1px solid var(--dz-border);
  border-radius: var(--dz-radius-lg);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  box-shadow: var(--dz-shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.05));
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.provider-card:hover {
  transform: translateY(-2px);
  border-color: var(--dz-primary);
  box-shadow: var(--dz-shadow-sm);
}

.provider-card:focus-visible {
  outline: none;
  box-shadow: var(--dz-ring);
}

.provider-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 3.2rem;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: var(--dz-radius-full);
  overflow: hidden;
  background: var(--dz-surface-soft);
  color: var(--dz-primary);
  border: 1px solid var(--dz-border-subtle, rgba(0, 0, 0, 0.06));
}

.provider-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.provider-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.provider-card__meta strong {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--dz-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
}

.provider-card__status--on {
  color: var(--dz-success);
}

.provider-card__status--off {
  color: var(--dz-muted);
}

.provider-card__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--dz-radius-full);
  background: currentColor;
}

/* ── Tablet ───────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .provider-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }
}

/* ── Mobile: stack cards under each other ─────────────────────── */
@media (max-width: 600px) {
  .provider-grid {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }

  .provider-card {
    padding: 0.8rem 0.95rem;
  }
}
</style>
