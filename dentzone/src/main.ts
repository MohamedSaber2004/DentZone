import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { catalogService } from './application/catalog.service'
import { chatService } from './application/chat.service'
import { initI18n, t } from './i18n'

void catalogService.init()
initI18n()

chatService.configure((userText) => {
  const text = userText.toLowerCase()
  if (/(hi|hello|hey|مرحبا|السلام)/.test(text)) return t('chat.replyGreeting')
  if (/(order|طلب|شحن|deliver|track|tracking)/.test(text)) return t('chat.replyOrder')
  if (/(product|product|منتج|brush|toothbrush|فرشاة)/.test(text)) return t('chat.replyProduct')
  if (/(price|سعر|discount|خصم|offer)/.test(text)) return t('chat.replyPrice')
  return t('chat.replyDefault')
})

createApp(App).use(router).mount('#app')