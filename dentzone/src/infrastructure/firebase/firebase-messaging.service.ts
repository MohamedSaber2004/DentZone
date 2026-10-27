import { ref, type Ref } from 'vue'
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported as isAnalyticsSupported, logEvent, type Analytics } from 'firebase/analytics'
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging'
import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY, isFirebaseConfigured } from '../../config/firebase.config'
import { toastService } from '../feedback/toast.service'

export type PushNotificationCallback = (payload: MessagePayload) => void

/** Legacy cache key used by older builds — removed on init so tokens are never persisted. */
const LEGACY_FCM_TOKEN_KEY = 'dz_fcm_token'

export class FirebaseMessagingService {
  private app: FirebaseApp | null = null
  private analytics: Analytics | null = null
  private messaging: Messaging | null = null
  private swRegistration: ServiceWorkerRegistration | null = null
  private listeners: Set<PushNotificationCallback> = new Set()
  private tokenListeners: Set<(token: string) => void> = new Set()
  private initialized = false

  readonly token: Ref<string | null> = ref(null)
  readonly permission: Ref<NotificationPermission> = ref(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  )
  readonly isSupported: Ref<boolean> = ref(false)
  readonly isLoading: Ref<boolean> = ref(false)
  readonly error: Ref<string | null> = ref(null)

  /**
   * Initializes the Firebase App, Analytics, and Messaging if supported.
   */
  async init(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true

    // If Firebase credentials are not valid/configured or key is suspended,
    // safely unregister any old background service worker and avoid calling Firebase endpoints.
    if (!isFirebaseConfigured()) {
      this.isSupported.value = false
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => {
            for (const reg of registrations) {
              if (reg.active?.scriptURL.includes('firebase-messaging-sw.js')) {
                void reg.unregister()
              }
            }
          })
          .catch(() => undefined)
      }
      return
    }

    try {
      localStorage.removeItem(LEGACY_FCM_TOKEN_KEY)

      // 1. Initialize Firebase App
      if (!getApps().length) {
        this.app = initializeApp(FIREBASE_CONFIG)
      } else {
        this.app = getApp()
      }

      // 2. Initialize Analytics conditionally
      const analyticsSupported = await isAnalyticsSupported().catch(() => false)
      if (analyticsSupported && this.app) {
        try {
          this.analytics = getAnalytics(this.app)
        } catch {
          // Analytics may fail if API key is invalid or blocked
        }
      }

      // 3. Check if Firebase Messaging & Service Workers are supported
      const messagingSupported = await isMessagingSupported().catch(() => false)
      const swSupported = 'serviceWorker' in navigator && 'Notification' in window

      this.isSupported.value = messagingSupported && swSupported

      if (!this.isSupported.value) {
        return
      }

      this.messaging = getMessaging(this.app)
      this.permission.value = Notification.permission

      // 4. Register Service Worker
      await this.registerServiceWorker()

      // 5. Setup foreground message listener
      this.setupForegroundMessageListener()

      // 6. If user already granted permission earlier, automatically retrieve/refresh token
      if (Notification.permission === 'granted') {
        void this.retrieveToken().catch(() => undefined)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      this.error.value = errorMsg
    }
  }

  /**
   * Registers the Firebase service worker file.
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !isFirebaseConfigured()) return null

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      })
      this.swRegistration = registration
      return registration
    } catch {
      return null
    }
  }

  /**
   * Requests user permission for Push Notifications and retrieves the FCM token.
   */
  async requestPushPermission(): Promise<string | null> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.error.value = 'Notifications are not supported by your browser.'
      return null
    }

    if (!isFirebaseConfigured()) {
      this.error.value = 'Push notifications service is currently unavailable.'
      return null
    }

    this.isLoading.value = true
    this.error.value = null

    try {
      if (!this.initialized) {
        await this.init()
      }

      const permissionResult = await Notification.requestPermission()
      this.permission.value = permissionResult

      if (permissionResult === 'granted') {
        const token = await this.retrieveToken()
        if (token) {
          toastService.success('Push notifications enabled successfully!')
        }
        return token
      } else if (permissionResult === 'denied') {
        this.error.value = 'Push notification permission was denied in browser settings.'
        toastService.info('Notifications are blocked in your browser settings.')
        return null
      } else {
        return null
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      this.error.value = errorMsg
      toastService.error('Failed to enable push notifications.')
      return null
    } finally {
      this.isLoading.value = false
    }
  }

  /**
   * Retrieves the FCM Device Token.
   */
  async retrieveToken(): Promise<string | null> {
    if (!isFirebaseConfigured() || !this.messaging) return null

    try {
      if (!this.swRegistration) {
        this.swRegistration = await this.registerServiceWorker()
      }

      const tokenOptions: { serviceWorkerRegistration?: ServiceWorkerRegistration; vapidKey?: string } = {}
      if (this.swRegistration) {
        tokenOptions.serviceWorkerRegistration = this.swRegistration
      }
      if (FIREBASE_VAPID_KEY) {
        tokenOptions.vapidKey = FIREBASE_VAPID_KEY
      }

      const currentToken = await getToken(this.messaging, tokenOptions)

      if (currentToken) {
        this.token.value = currentToken
        this.tokenListeners.forEach((cb) => {
          try {
            cb(currentToken)
          } catch {
            // Silently handle callback errors
          }
        })
        return currentToken
      } else {
        return null
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      this.error.value = errorMsg
      return null
    }
  }

  /**
   * Listens for foreground push notifications.
   */
  private setupForegroundMessageListener(): void {
    if (!this.messaging) return

    onMessage(this.messaging, (payload: MessagePayload) => {
      const title = payload.notification?.title || payload.data?.title || 'DentZone Notification'
      const body = payload.notification?.body || payload.data?.body || payload.data?.message || ''

      // Display in-app toast notification
      const fullMessage = body ? `${title}: ${body}` : title
      toastService.info(fullMessage, { duration: 4500 })

      // Notify all registered listeners
      this.listeners.forEach((callback) => {
        try {
          callback(payload)
        } catch {
          // Silently handle listener errors
        }
      })
    })
  }

  /**
   * Subscribes a callback to FCM token changes or retrieval.
   * Immediately calls the callback if a token is already present.
   */
  onToken(callback: (token: string) => void): () => void {
    this.tokenListeners.add(callback)
    if (this.token.value) {
      try {
        callback(this.token.value)
      } catch {
        // Silently handle callback errors
      }
    }
    return () => {
      this.tokenListeners.delete(callback)
    }
  }

  /**
   * Subscribes a callback to incoming push notifications.
   * Returns an unsubscribe function.
   */
  onNotification(callback: PushNotificationCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Gets the underlying Firebase App instance.
   */
  getApp(): FirebaseApp | null {
    return this.app
  }

  /**
   * Gets the underlying Analytics instance.
   */
  getAnalytics(): Analytics | null {
    return this.analytics
  }

  /**
   * Tracks an error or failure event to Firebase Analytics.
   */
  trackError(eventName: string, params: Record<string, unknown> = {}): void {
    if (!this.analytics) return
    try {
      logEvent(this.analytics, eventName, params)
    } catch {
      // Analytics failure should never break UI
    }
  }
}

export const firebaseMessagingService = new FirebaseMessagingService()
