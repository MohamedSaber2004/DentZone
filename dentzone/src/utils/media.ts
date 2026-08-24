import { API_BASE_URL } from '../config/api.config'

export const resolveMediaUrl = (path: string | null | undefined): string => {
  if (!path) return ''
  const trimmed = path.trim()
  if (!trimmed) return ''
  if (/^(?:blob|data):/i.test(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed)) {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
      return trimmed
    }
    return trimmed.replace(/^http:\/\//i, 'https://')
  }
  return `${API_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}