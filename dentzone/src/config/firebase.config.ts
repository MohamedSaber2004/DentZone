export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDCf36SJuLtHiXQm6ZoFG-Ob2B35DQcWd4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dent-zone-ac097.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dent-zone-ac097',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dent-zone-ac097.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '637822752543',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:637822752543:web:e8067aab00ed2dbd79422a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-TSJ5KLWQR0',
} as const

export const FIREBASE_VAPID_KEY = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined) || undefined
