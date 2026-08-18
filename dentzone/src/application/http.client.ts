import { locale } from '../i18n'

export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '')

export interface ApiEnvelope<T> {
  success: boolean
  errors: Record<string, string[]> | null
  data: T | null
  message: string | null
  statusCode: number
}

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
}

const NO_REFRESH_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh-token',
]

const ACCESS_EXPIRY_MARGIN_MS = 30_000

let accessToken = ''
let accessTokenExpiresAt = ''
let refreshTokenExpiresAt = ''
let refreshInFlight: Promise<boolean> | null = null

let refreshHandler: (() => Promise<boolean>) | null = null
let sessionExpiredHandler: (() => void) | null = null

export const setTokenRefreshHandler = (handler: () => Promise<boolean>) => {
  refreshHandler = handler
}

export const setSessionExpiredHandler = (handler: () => void) => {
  sessionExpiredHandler = handler
}

export const setTokens = (tokens: AuthTokens) => {
  accessToken = tokens.accessToken
  accessTokenExpiresAt = tokens.accessTokenExpiresAt
  refreshTokenExpiresAt = tokens.refreshTokenExpiresAt
}

export const clearTokens = () => {
  accessToken = ''
  accessTokenExpiresAt = ''
  refreshTokenExpiresAt = ''
}

export const getAccessToken = (): string => accessToken

const isPastOrNear = (iso: string, withinMs: number): boolean => {
  if (!iso) return false
  const time = new Date(iso).getTime()
  return Number.isFinite(time) && Date.now() >= time - withinMs
}

const performRefresh = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = (refreshHandler?.() ?? Promise.resolve(false)).finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export interface RequestOptions {
  headers?: Record<string, string>
  skipAuthRefresh?: boolean
}

const request = async <T>(path: string, options: { method?: string; body?: unknown } & RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers: extraHeaders, skipAuthRefresh = false } = options

  const headers: Record<string, string> = { ...extraHeaders, 'Accept-Language': locale.value }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const needsRefresh =
    accessToken !== '' &&
    refreshTokenExpiresAt !== '' &&
    !skipAuthRefresh &&
    !NO_REFRESH_PREFIXES.some((prefix) => path.startsWith(prefix))

  if (needsRefresh && isPastOrNear(refreshTokenExpiresAt, 0)) {
    clearTokens()
    sessionExpiredHandler?.()
    throw new ApiError(401, 'Session expired')
  }

  if (needsRefresh && isPastOrNear(accessTokenExpiresAt, ACCESS_EXPIRY_MARGIN_MS)) {
    const refreshed = await performRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
    } else {
      clearTokens()
      sessionExpiredHandler?.()
      throw new ApiError(401, 'Session expired')
    }
  }

  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  let response: Response
  try {
    response = await doFetch()
  } catch {
    throw new ApiError(0, 'Unable to reach the server')
  }

  if (response.status === 401 && !skipAuthRefresh && !NO_REFRESH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    const refreshed = await performRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
      try {
        response = await doFetch()
      } catch {
        throw new ApiError(0, 'Unable to reach the server')
      }
    } else {
      clearTokens()
      sessionExpiredHandler?.()
    }
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok || !envelope?.success) {
    throw new ApiError(response.status, envelope?.message ?? `Request failed with status ${response.status}`, envelope?.errors ?? {})
  }

  return envelope.data as T
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
}