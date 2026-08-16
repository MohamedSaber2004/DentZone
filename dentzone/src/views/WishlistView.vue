<script setup lang="ts">
import { wishlistService } from '../application/wishlist.service'
import { toastService } from '../application/toast.service'
import { t } from '../i18n'
import ProductGrid from '../components/store/ProductGrid.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import SectionHeader from '../components/ui/SectionHeader.vue'

const clearWishlist = () => {
  wishlistService.clear()
  toastService.info(t('wishlist.clearedToast'))
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

    <ProductGrid v-if="wishlistService.count.value > 0" :products="wishlistService.items.value" />

    <EmptyState
      v-else
      emoji="💛"
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
