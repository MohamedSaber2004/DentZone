import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initI18n } from './i18n'
import { cartService, firebaseMessagingService } from './di/container'

initI18n()

void cartService.init()
void firebaseMessagingService.init()

createApp(App).use(router).mount('#app')