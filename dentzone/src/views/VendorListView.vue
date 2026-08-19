<script setup lang="ts">
import { services } from '../di/container'
import { computed, onMounted, ref, watch } from 'vue'
const { catalogService } = services
import { useRoute } from 'vue-router'
import type { Vendor } from '../domain/models/vendor'
import { t } from '../i18n'
import SectionHeader from '../components/ui/SectionHeader.vue'
import VendorCard from '../components/store/VendorCard.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppIcon from '../components/ui/AppIcon.vue'

const route = useRoute()

const vendors = ref<Vendor[]>([])
const loading = ref(true)

const activeCategory = computed(() => (typeof route.query.category === 'string' ? route.query.category : ''))

const pageTitle = computed(() =>
  activeCategory.value
    ? t('vendors.categoryTitle', {
        category: catalogService.getCategoryBySlug(activeCategory.value)?.name ?? activeCategory.value,
      })
    : t('vendors.allTitle'),
)

const pageSubtitle = computed(() => t('vendors.available', { count: vendors.value.length }))

const loadVendors = async () => {
  loading.value = true
  vendors.value = await catalogService.getVendorsByCategory(activeCategory.value || undefined)
  loading.value = false
}

onMounted(() => {
  void loadVendors()
})

watch(activeCategory, () => {
  void loadVendors()
})
</script>

<template>
  <div class="container page">
    <SectionHeader :title="pageTitle" :subtitle="pageSubtitle">
      <template #action>
        <RouterLink to="/catalog" class="vendors__back">
          <AppIcon name="arrow-left" :size="15" />
          {{ t('catalog.shopAllProducts') }}
        </RouterLink>
      </template>
    </SectionHeader>

    <SkeletonLoader v-if="loading" variant="cards" :count="6" class="vendors__skeleton" role="status" />

    <div v-else-if="vendors.length > 0" class="vendors__grid">
      <VendorCard v-for="vendor in vendors" :key="vendor.id" :vendor="vendor" />
    </div>

    <EmptyState
      v-else
      icon="store"
      :title="t('vendors.noVendorsTitle')"
      :description="t('vendors.noVendorsDescription')"
    >
      <template #action>
        <RouterLink to="/catalog">
          <AppButton>{{ t('catalog.clearFilters') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.vendors__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dz-primary-strong);
  white-space: nowrap;
}

.vendors__back:hover {
  text-decoration: underline;
}

.vendors__skeleton {
  padding-top: 0.25rem;
}

.vendors__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

@media (max-width: 640px) {
  .vendors__grid {
    grid-template-columns: 1fr;
  }
}
</style>