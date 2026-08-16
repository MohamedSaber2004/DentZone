<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import ChatWidget from './components/store/ChatWidget.vue'

const router = useRouter()
const searchQuery = ref('')

const onSearchSubmit = () => {
  const term = searchQuery.value.trim()
  void router.push({
    path: '/catalog',
    query: term ? { q: term } : {},
  })
}
</script>

<template>
  <div class="app-shell">
    <AppHeader v-model:query="searchQuery" @submit="onSearchSubmit" />
    <ToastContainer />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
    <ChatWidget />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>