import { ref } from 'vue'
import type { Messages } from './messages'
import { en } from './en'
import { ar } from './ar'

export type Locale = 'en' | 'ar'

const STORAGE_KEY = 'dentzone-locale'

const messages: Record<Locale, Messages> = { en, ar }

export type MessageKey = NestedKeyOf<Messages>

export type NestedKeyOf<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends Record<string, unknown>
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never
    }[keyof T]
  : never

const readStoredLocale = (): Locale => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'ar'
}

const applyDocument = (locale: Locale) => {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

export const locale = ref<Locale>(readStoredLocale())

export const setLocale = (next: Locale) => {
  locale.value = next
  localStorage.setItem(STORAGE_KEY, next)
  applyDocument(next)
  localeChangeListeners.forEach((listener) => listener(next))
}

export const t = (key: MessageKey, params?: Record<string, string | number>): string => {
  let value: unknown = messages[locale.value]
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown>)[part]
  }
  let text = typeof value === 'string' ? value : String(key)
  if (params) {
    if (typeof params.count === 'number' && text.includes('|')) {
      const parts = text.split('|')
      text = parts[params.count === 1 ? 0 : 1] ?? text
    }
    for (const [name, replacement] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(replacement))
    }
  }
  return text
}

type LocaleChangeListener = (locale: Locale) => void
const localeChangeListeners: LocaleChangeListener[] = []

export const onLocaleChange = (listener: LocaleChangeListener) => {
  localeChangeListeners.push(listener)
}

export const formatPrice = (value: number): string =>
  new Intl.NumberFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)

export const initI18n = () => {
  applyDocument(locale.value)
}
