import { API_BASE_URL } from '../config/api.config'

export const resolveMediaUrl = (path: string | null | undefined): string => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path.replace(/^http:\/\//i, 'https://')
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}