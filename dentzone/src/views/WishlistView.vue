<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { wishlistService } from '../application/wishlist.service'
import { toastService } from '../application/toast.service'
import { t } from '../i18n'
import ProductGrid from '../components/store/ProductGrid.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import SkeletonLoader from '../components/ui/SkeletonLoader.vue'
import SectionHeader from '../components/ui/SectionHeader.vue'

const loading = ref(true)

onMounted(async () => {
  await wishlistService.refresh()
  loading.value = false
})

const clearWishlist = async () => {
  try {
    await wishlistService.clear()
    toastService.info(t('wishlist.clearedToast'))
  } catch {
    toastService.error(t('wishlist.errorToast'))
  }
}
</script>

<template>
  <div class="container page">
    <SectionHeader :title="t('wishlist.title')" :subtitle="t('wishlist.count', { count: wishlistService.count.value })">
      <template #action>
        <AppButton v-if="wishlistService.count.value > 0" variant="outline" size="sm" @click="clearWishlist">
          {{ t('wishlist.clear') }}
        </AppButton>
      </template>
    </SectionHeader>

    <div v-if="loading" class="wishlist__loading" role="status">
      <SkeletonLoader variant="grid" :count="4" />
    </div>

    <ProductGrid v-else-if="wishlistService.count.value > 0" :products="wishlistService.items.value" />

    <EmptyState
      v-else
      icon="heart"
      :title="t('wishlist.emptyTitle')"
      :description="t('wishlist.emptyDescription')"
    >
      <template #action>
        <RouterLink to="/catalog">
          <AppButton>{{ t('wishlist.browseProducts') }}</AppButton>
        </RouterLink>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.wishlist__loading {
  padding-top: 0.25rem;
}
</style>