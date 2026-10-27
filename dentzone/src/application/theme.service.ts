import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'dentzone-theme'

const readStoredTheme = (): Theme => {
  if (typeof window === 'undefined' || !window.localStorage) return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}

const applyTheme = (next: Theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = next
  const themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', next === 'dark' ? '#0d1821' : '#ffffff')
  }
}

export const theme = ref<Theme>(readStoredTheme())

applyTheme(theme.value)

export const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem(STORAGE_KEY, theme.value)
  applyTheme(theme.value)
}
