import { locale, t } from '../../i18n'
import { API_BASE_URL, AUTH_ROUTES } from '../../config/api.config'
import { requestTracker } from '../../application/request.tracker'
import { ApiError, GENERIC_OK_MESSAGES, type ApiEnvelope } from './api-error'
import type { TokenStore } from './token-store'
import type { AuthBridge } from './auth-bridge'
import type { ModalService } from '../feedback/modal.service'
import { firebaseMessagingService } from '../firebase/firebase-messaging.service'

export interface DiagnosticError {
  timestamp: string
  method: string
  path: string
  status: number
  message: string
  details?: string
}

const DIAGNOSTIC_KEY = 'dz_last_api_errors'
const MAX_DIAGNOSTICS = 10

export const getDiagnosticErrors = (): DiagnosticError[] => {
  if (typeof window === 'undefined' || !window.sessionStorage) return []
  try {
    const raw = window.sessionStorage.getItem(DIAGNOSTIC_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const recordDiagnosticError = (item: DiagnosticError): void => {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  try {
    const list = getDiagnosticErrors()
    list.unshift(item)
    if (list.length > MAX_DIAGNOSTICS) list.length = MAX_DIAGNOSTICS
    window.sessionStorage.setItem(DIAGNOSTIC_KEY, JSON.stringify(list))
  } catch {
    // Ignore quota errors
  }
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { dzGetErrors?: () => DiagnosticError[] }).dzGetErrors = getDiagnosticErrors
}

export interface ExtractedErrorInfo {
  message: string
  details?: string
  errors: Record<string, string[]>
}

export function extractErrorInfo(body: unknown, status: number): ExtractedErrorInfo {
  const result: ExtractedErrorInfo = {
    message: '',
    errors: {},
  }

  if (!body) {
    result.message = `Request failed with status ${status}`
    return result
  }

  let parsed: unknown = body
  if (typeof body === 'string') {
    const trimmed = body.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        parsed = trimmed
      }
    }
  }

  if (typeof parsed === 'string') {
    result.message = parsed
    result.details = parsed
    return result
  }

  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>

    const rawErrors = record.errors ?? record.Errors
    if (rawErrors && typeof rawErrors === 'object' && !Array.isArray(rawErrors)) {
      const errDict: Record<string, string[]> = {}
      const messageList: string[] = []

      for (const [key, val] of Object.entries(rawErrors as Record<string, unknown>)) {
        if (Array.isArray(val)) {
          const strList = val.map((v) => String(v)).filter(Boolean)
          errDict[key] = strList
          messageList.push(...strList)
        } else if (typeof val === 'string' && val.trim()) {
          errDict[key] = [val.trim()]
          messageList.push(val.trim())
        }
      }

      result.errors = errDict
      if (messageList.length > 0) {
        result.message = messageList.join(' • ')
      }
    } else if (Array.isArray(rawErrors)) {
      result.message = rawErrors.map((e) => String(e)).filter(Boolean).join(' • ')
    }

    if (!result.message) {
      const candidateMsg =
        record.message ??
        record.Message ??
        record.error ??
        record.Error ??
        record.detail ??
        record.Detail ??
        record.title ??
        record.Title

      if (typeof candidateMsg === 'string' && candidateMsg.trim()) {
        result.message = candidateMsg.trim()
      }
    }

    try {
      result.details = JSON.stringify(record, null, 2)
    } catch {
      // ignore
    }
  }

  if (!result.message) {
    result.message = `Request failed with status ${status}`
  }

  return result
}

export interface HttpClientDependencies {
  tokenStore: TokenStore
  authBridge: AuthBridge
  feedback: ModalService
}

export interface RequestOptions {
  headers?: Record<string, string>
  showFeedback?: boolean
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const NO_FEEDBACK_PATHS = [AUTH_ROUTES.login, AUTH_ROUTES.loginGuest]

const MAX_RATE_LIMIT_WAIT_MS = 10_000
const MAX_429_RETRIES = 2
const MAX_429_WAIT_MS = 10_000

const isMutation = (method: HttpMethod): boolean => method !== 'GET'

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

  private maxConcurrency = 4
  private inFlightCount = 0
  private waitQueue: (() => void)[] = []

  private rateLimiters: Record<string, FixedWindowLimiter> = {
    login: new FixedWindowLimiter(3, 60_000),
    general: new FixedWindowLimiter(60, 60_000),
  }

  private dedupeMap = new Map<string, Promise<unknown>>()

  constructor(dependencies: HttpClientDependencies) {
    this.tokenStore = dependencies.tokenStore
    this.authBridge = dependencies.authBridge
    this.feedback = dependencies.feedback
  }

  get hasToken(): boolean {
    return Boolean(this.tokenStore.getAccessToken())
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'GET', undefined, options)
  }

  getText<T extends string>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'GET', undefined, options, true)
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
    asText = false,
  ): Promise<T> {
    const { headers: extraHeaders, showFeedback } = options
    const mutation = isMutation(method)
    const wantsFeedback = showFeedback ?? mutation
    const silentPath = NO_FEEDBACK_PATHS.some((candidate) => path.startsWith(candidate))

    const headers: Record<string, string> = { ...extraHeaders, 'Accept-Language': locale.value }
    if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'

    const activeToken = this.tokenStore.getAccessToken()
    if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`

    const doFetch = (): Promise<Response> =>
      fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
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

        if (response.status === 401 && !silentPath) {
          const activeUserToken = this.tokenStore.getAccessToken()
          const isUserSession = Boolean(activeUserToken) && headers['Authorization'] === `Bearer ${activeUserToken}`
          if (isUserSession) {
            this.tokenStore.clear()
            this.authBridge.onSessionExpired()
          }
          throw new ApiError(
            401,
            isUserSession ? 'Session expired' : 'Authentication required',
            {},
            true,
          )
        }

        if (response.status === 429 && attempt < MAX_429_RETRIES) {
          const retryAfter = response.headers.get('Retry-After')
          const parsed = retryAfter ? Number(retryAfter) * 1000 : 1000 * 2 ** attempt
          const delayMs = Number.isFinite(parsed) ? Math.min(parsed, MAX_429_WAIT_MS) : 1000
          await sleep(delayMs)
          continue
        }

        let body: unknown
        if (asText) {
          body = await response.text()
        } else {
          const contentType = (response.headers.get('Content-Type') ?? '').toLowerCase()
          if (contentType.includes('json')) {
            body = await response.json().catch(() => null)
          } else {
            const text = (await response.text().catch(() => '')).trim()
            body = text === '' ? null : text
          }
        }

        const isEnvelope = !asText && body !== null && typeof body === 'object' && 'success' in body
        const textError = !response.ok && typeof body === 'string' ? body : null
        const envelope: ApiEnvelope<T> = isEnvelope
          ? (body as unknown as ApiEnvelope<T>)
          : {
              success: response.ok,
              errors: null,
              data: body as T,
              message: textError,
              statusCode: response.status,
            }

        if (!response.ok || !envelope.success) {
          const errorInfo = extractErrorInfo(body, response.status)
          const finalMessage = (envelope.message && envelope.message !== textError ? envelope.message : null) || errorInfo.message
          const finalErrors = envelope.errors || errorInfo.errors

          const error = new ApiError(
            response.status,
            finalMessage,
            finalErrors,
          )

          // 1. Structured console logging for developer debugging
          console.error(`[API Error] ${method} ${path} (${response.status}):`, {
            message: finalMessage,
            errors: finalErrors,
            details: errorInfo.details,
            body,
          })

          // 2. Persist diagnostic record to sessionStorage for support debugging
          recordDiagnosticError({
            timestamp: new Date().toISOString(),
            method,
            path,
            status: response.status,
            message: finalMessage,
            details: errorInfo.details,
          })

          // 3. Track error event in Firebase Analytics
          firebaseMessagingService.trackError('api_error', {
            method,
            endpoint: path.split('?')[0] || path,
            status: response.status,
            error_message: finalMessage.slice(0, 100),
          })

          if (wantsFeedback) {
            this.feedback.showError(error.message, errorInfo.details, response.status)
          }
          throw error
        }

        if (wantsFeedback && !silentPath) {
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
      void promise
        .finally(() => {
          if (this.dedupeMap.get(dedupeKey) === promise) this.dedupeMap.delete(dedupeKey)
        })
        .catch(() => undefined)
      return promise
    }

    return this.tracked(path, () => this.withSlot(run))
  }

  private async tracked<T>(path: string, run: () => Promise<T>): Promise<T> {
    requestTracker.begin()
    try {
      return await run()
    } finally {
      requestTracker.settle()
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
    return 'general'
  }

  private async waitForRateLimit(path: string): Promise<void> {
    const waitMs = this.rateLimiters[this.policyForPath(path)]?.acquire() ?? 0
    if (waitMs <= 0) return
    if (waitMs > MAX_RATE_LIMIT_WAIT_MS) throw new ApiError(429, 'Rate limit exceeded', {}, true)
    await sleep(waitMs)
  }
}