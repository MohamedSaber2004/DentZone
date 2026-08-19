import { locale, t } from '../../i18n'
import { API_BASE_URL, AUTH_ROUTES } from '../../config/api.config'
import { requestTracker } from '../../application/request.tracker'
import { ApiError, GENERIC_OK_MESSAGES, type ApiEnvelope } from './api-error'
import type { TokenStore } from './token-store'
import type { AuthBridge } from './auth-bridge'
import type { ModalService } from '../feedback/modal.service'

export interface HttpClientDependencies {
  tokenStore: TokenStore
  authBridge: AuthBridge
  feedback: ModalService
}

export interface RequestOptions {
  headers?: Record<string, string>
  skipAuthRefresh?: boolean
  showFeedback?: boolean
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const NO_REFRESH_PATHS = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.logout,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.verifyOtp,
  AUTH_ROUTES.resetPassword,
  AUTH_ROUTES.refreshToken,
]

const MAX_RATE_LIMIT_WAIT_MS = 10_000
const MAX_429_RETRIES = 2
const MAX_429_WAIT_MS = 10_000

const isMutation = (method: HttpMethod): boolean => method !== 'GET'

const pathMatches = (path: string, candidates: string[]): boolean =>
  candidates.some((candidate) => path.startsWith(candidate))

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

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

export class HttpClient {
  private readonly tokenStore: TokenStore
  private readonly authBridge: AuthBridge
  private readonly feedback: ModalService

  private refreshInFlight: Promise<boolean> | null = null

  private maxConcurrency = 4
  private inFlightCount = 0
  private waitQueue: (() => void)[] = []

  private rateLimiters: Record<string, FixedWindowLimiter> = {
    login: new FixedWindowLimiter(3, 60_000),
    otp: new FixedWindowLimiter(5, 60_000),
    general: new FixedWindowLimiter(60, 60_000),
  }

  private dedupeMap = new Map<string, Promise<unknown>>()

  constructor(dependencies: HttpClientDependencies) {
    this.tokenStore = dependencies.tokenStore
    this.authBridge = dependencies.authBridge
    this.feedback = dependencies.feedback
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'GET', undefined, options)
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'POST', body, options)
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'PUT', body, options)
  }

  del<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'DELETE', undefined, options)
  }

  private async request<T>(
    path: string,
    method: HttpMethod,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const { headers: extraHeaders, skipAuthRefresh = false, showFeedback } = options
    const mutation = isMutation(method)
    const wantsFeedback = showFeedback ?? mutation
    const canRefresh = !skipAuthRefresh && !pathMatches(path, NO_REFRESH_PATHS)

    const headers: Record<string, string> = { ...extraHeaders, 'Accept-Language': locale.value }
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    if (this.tokenStore.hasAccessToken() && canRefresh) {
      if (this.tokenStore.isRefreshTokenExpired()) {
        this.tokenStore.clear()
        this.authBridge.onSessionExpired()
        throw new ApiError(401, 'Session expired', {}, true)
      }
      if (this.tokenStore.isAccessTokenExpiring()) {
        const refreshed = await this.performRefresh()
        if (!refreshed) throw new ApiError(401, 'Session expired', {}, true)
      }
    }

    const activeToken = this.tokenStore.getAccessToken()
    if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`

    const doFetch = (): Promise<Response> =>
      fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

    const run = async (): Promise<T> => {
      await this.waitForRateLimit(path)

      for (let attempt = 0; ; attempt++) {
        let response: Response
        try {
          response = await doFetch()
        } catch {
          const error = new ApiError(0, 'Unable to reach the server')
          if (wantsFeedback) this.feedback.showError(t('common.networkError'))
          throw error
        }

        if (response.status === 401 && canRefresh) {
          const refreshed = await this.performRefresh()
          if (refreshed) {
            const newAccessToken = this.tokenStore.getAccessToken()
            if (newAccessToken) headers['Authorization'] = `Bearer ${newAccessToken}`
            continue
          }
          throw new ApiError(401, 'Session expired', {}, true)
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
          const error = new ApiError(
            response.status,
            envelope?.message ?? `Request failed with status ${response.status}`,
            envelope?.errors ?? {},
          )
          if (wantsFeedback) this.feedback.showError(error.message)
          throw error
        }

        if (wantsFeedback) {
          const message =
            envelope.message && !GENERIC_OK_MESSAGES.has(envelope.message)
              ? envelope.message
              : t('common.operationDone')
          this.feedback.showSuccess(message)
        }

        return envelope.data as T
      }
    }

    if (method === 'GET') {
      const langHeader = headers['Accept-Language'] ?? locale.value
      const dedupeKey = `${method} ${path} [${langHeader}]`
      const existing = this.dedupeMap.get(dedupeKey) as Promise<T> | undefined
      if (existing) return existing
      const promise = this.tracked(path, () => this.withSlot(run))
      this.dedupeMap.set(dedupeKey, promise)
      void promise.finally(() => {
        if (this.dedupeMap.get(dedupeKey) === promise) this.dedupeMap.delete(dedupeKey)
      })
      return promise
    }

    return this.tracked(path, () => this.withSlot(run))
  }

  private performRefresh(): Promise<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.authBridge
        .refresh()
        .finally(() => {
          this.refreshInFlight = null
        })
    }
    return this.refreshInFlight
  }

  private async tracked<T>(path: string, run: () => Promise<T>): Promise<T> {
    requestTracker.begin()
    try {
      const result = await run()
      requestTracker.settle(true)
      return result
    } catch (error) {
      requestTracker.settle(false, error instanceof ApiError && error.silent)
      throw error
    }
  }

  private async withSlot<T>(run: () => Promise<T>): Promise<T> {
    await this.acquireSlot()
    try {
      return await run()
    } finally {
      this.releaseSlot()
    }
  }

  private acquireSlot(): Promise<void> {
    if (this.inFlightCount < this.maxConcurrency) {
      this.inFlightCount += 1
      return Promise.resolve()
    }
    return new Promise((resolve) => this.waitQueue.push(resolve))
  }

  private releaseSlot(): void {
    this.inFlightCount -= 1
    const next = this.waitQueue.shift()
    if (next) next()
  }

  private policyForPath(path: string): string {
    if (path.startsWith(AUTH_ROUTES.login)) return 'login'
    if (['forgot-password', 'verify-otp', 'reset-password'].some((segment) => path.includes(segment))) return 'otp'
    return 'general'
  }

  private async waitForRateLimit(path: string): Promise<void> {
    const waitMs = this.rateLimiters[this.policyForPath(path)]?.acquire() ?? 0
    if (waitMs <= 0) return
    if (waitMs > MAX_RATE_LIMIT_WAIT_MS) throw new ApiError(429, 'Rate limit exceeded', {}, true)
    await sleep(waitMs)
  }
}