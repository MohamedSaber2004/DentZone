// Service worker for Firebase Cloud Messaging in DentZone

const SUSPENDED_KEY = 'AIzaSyDCf36SJuLtHiXQm6ZoFG-Ob2B35DQcWd4'
const apiKey = '' // Set to a valid non-suspended Firebase API key when available

if (!apiKey || apiKey === SUSPENDED_KEY) {
  // If the key is suspended or unconfigured, unregister this service worker
  // to avoid background 403 Google API errors.
  self.addEventListener('install', () => {
    self.skipWaiting()
  })
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      self.registration
        .unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => {
          clients.forEach((client) => {
            if (client.url && 'navigate' in client) {
              client.navigate(client.url)
            }
          })
        })
        .catch(() => undefined),
    )
  })
} else {
  try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
    importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

    const firebaseConfig = {
      apiKey,
      authDomain: 'dent-zone-ac097.firebaseapp.com',
      projectId: 'dent-zone-ac097',
      storageBucket: 'dent-zone-ac097.firebasestorage.app',
      messagingSenderId: '637822752543',
      appId: '1:637822752543:web:e8067aab00ed2dbd79422a',
      measurementId: 'G-TSJ5KLWQR0',
    }

    firebase.initializeApp(firebaseConfig)

    const messaging = firebase.messaging()

    messaging.onBackgroundMessage((payload) => {
      const title =
        payload.notification?.title ||
        payload.data?.title ||
        'DentZone Notification'

      const body =
        payload.notification?.body ||
        payload.data?.body ||
        payload.data?.message ||
        ''

      const icon = payload.notification?.icon || payload.data?.icon || '/favicon.ico'
      const link =
        payload.fcmOptions?.link ||
        payload.data?.link ||
        payload.data?.click_action ||
        '/notifications'

      const notificationOptions = {
        body,
        icon,
        badge: '/favicon.ico',
        tag: payload.data?.id || `dz-notif-${Date.now()}`,
        data: {
          url: link,
          ...payload.data,
        },
      }

      return self.registration.showNotification(title, notificationOptions)
    })
  } catch {
    // Graceful silence
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/notifications'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            if ('navigate' in client && targetUrl) {
              client.navigate(targetUrl)
            }
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      }),
  )
})

