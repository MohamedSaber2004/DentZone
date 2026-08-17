import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'dentzone-theme'

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

const readStoredTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return prefersDark() ? 'dark' : 'light'
}

const applyTheme = (next: Theme) => {
  document.documentElement.dataset.theme = next
}

export const theme = ref<Theme>(readStoredTheme())

applyTheme(theme.value)

export const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem(STORAGE_KEY, theme.value)
  applyTheme(theme.value)
}
