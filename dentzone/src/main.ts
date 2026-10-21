import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initI18n } from './i18n'
import { cartService, firebaseMessagingService } from './di/container'

initI18n()

void cartService.init()
void firebaseMessagingService.init()

const app = createApp(App)
app.use(router)

// Graceful Vue error handler to prevent unhandled render errors from polluting console
app.config.errorHandler = () => {
  // Handled silently
}

// Suppress unhandled promise rejections from operational errors (e.g. guest 401s, aborted fetches)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { name?: string; status?: number; isOperational?: boolean } | null | undefined
    if (
      reason?.status === 401 ||
      reason?.name === 'ApiError' ||
      reason?.name === 'AbortError' ||
      reason?.isOperational
    ) {
      event.preventDefault()
    }
  })
}

app.mount('#app')