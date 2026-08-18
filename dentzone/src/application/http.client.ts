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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// --- Load balancing: concurrency queue ---

const MAX_CONCURRENCY = 4
let inFlightCount = 0
const waitQueue: (() => void)[] = []

const acquireSlot = (): Promise<void> => {
  if (inFlightCount < MAX_CONCURRENCY) {
    inFlightCount += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => waitQueue.push(resolve))
}

const releaseSlot = (): void => {
  inFlightCount -= 1
  const next = waitQueue.shift()
  if (next) next()
}

const withSlot = async <T>(run: () => Promise<T>): Promise<T> => {
  await acquireSlot()
  try {
    return await run()
  } finally {
    releaseSlot()
  }
}

// --- Load balancing: client-side throttling mirroring backend policies ---

class FixedWindowLimiter {
  private count = 0
  private windowStart = Date.now()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  acquire(): number {
    const now = Date.now()
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now
      this.count = 0
    }
    if (this.count < this.limit) {
      this.count += 1
      return 0
    }
    return this.windowStart + this.windowMs - now
  }
}

const RATE_LIMITERS: Record<string, FixedWindowLimiter> = {
  login: new FixedWindowLimiter(3, 60_000),
  otp: new FixedWindowLimiter(5, 60_000),
  general: new FixedWindowLimiter(60, 60_000),
}

const MAX_RATE_LIMIT_WAIT_MS = 10_000
const MAX_429_RETRIES = 2
const MAX_429_WAIT_MS = 10_000

const policyForPath = (path: string): string => {
  if (path.startsWith('/api/v1/auth/login')) return 'login'
  if (['forgot-password', 'verify-otp', 'reset-password'].some((segment) => path.includes(segment))) return 'otp'
  return 'general'
}

const waitForRateLimit = async (path: string): Promise<void> => {
  const waitMs = RATE_LIMITERS[policyForPath(path)]?.acquire() ?? 0
  if (waitMs <= 0) return
  if (waitMs > MAX_RATE_LIMIT_WAIT_MS) throw new ApiError(429, 'Rate limit exceeded')
  await sleep(waitMs)
}

// --- Request execution ---

export interface RequestOptions {
  headers?: Record<string, string>
  skipAuthRefresh?: boolean
}

const dedupeMap = new Map<string, Promise<unknown>>()

const request = async <T>(path: string, options: { method?: string; body?: unknown } & RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers: extraHeaders, skipAuthRefresh = false } = options

  const headers: Record<string, string> = { ...extraHeaders, 'Accept-Language': locale.value }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

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

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const doFetch = (): Promise<Response> =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  const run = async (): Promise<T> => {
    await waitForRateLimit(path)

    for (let attempt = 0; ; attempt++) {
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
          continue
        }
        clearTokens()
        sessionExpiredHandler?.()
      }

      if (response.status === 429 && attempt < MAX_429_RETRIES) {
        const retryAfter = response.headers.get('Retry-After')
        const parsed = retryAfter ? Number(retryAfter) * 1000 : 1000 * 2 ** attempt
        const delayMs = Number.isFinite(parsed) ? Math.min(parsed, MAX_429_WAIT_MS) : 1000
        await sleep(delayMs)
        continue
      }

      const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

      if (!response.ok || !envelope?.success) {
        throw new ApiError(response.status, envelope?.message ?? `Request failed with status ${response.status}`, envelope?.errors ?? {})
      }

      return envelope.data as T
    }
  }

  const isRefreshTokenCall = path.startsWith('/api/v1/auth/refresh-token')

  if (method === 'GET' && !isRefreshTokenCall) {
    const dedupeKey = `${method} ${path}`
    const existing = dedupeMap.get(dedupeKey) as Promise<T> | undefined
    if (existing) return existing
    const promise = withSlot(run)
    dedupeMap.set(dedupeKey, promise)
    void promise.finally(() => {
      if (dedupeMap.get(dedupeKey) === promise) dedupeMap.delete(dedupeKey)
    })
    return promise
  }

  if (isRefreshTokenCall) return run()

  return withSlot(run)
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
}