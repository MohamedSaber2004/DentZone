import { ref } from 'vue'
import type { MessageKey } from '../i18n'
import { locale, t } from '../i18n'
import type { User } from '../domain/models/user'
import type { LoginResponseDto } from '../domain/models/auth'
import type { AuthRepository } from '../domain/ports/auth-repository'
import { toastService } from '../infrastructure/feedback/toast.service'
import { ApiError } from '../infrastructure/http/api-error'
import type { TokenStore } from '../infrastructure/http/token-store'
import type { AuthBridge } from '../infrastructure/http/auth-bridge'
import router from '../router'

export type AuthResult = { ok: true } | { ok: false; error: string }

const SESSION_KEY = 'dentzone-auth'
const TINTS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899']

interface StoredSession {
  accessToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  user: User
}

export interface ProfilePatch {
  firstName: string
  lastName: string
  birthDate: string
}

const toDateInput = (iso: string | null | undefined): string => {
  if (!iso) return ''
  return iso.slice(0, 10)
}

const decodeJwtExp = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : Date.now() + 3_600_000
  } catch {
    return Date.now() + 3_600_000
  }
}

const nameToUser = (id: string, fullName: string, email: string, existing?: User, birthDate?: string, ordersCount?: number): User => {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName = parts.slice(1).join(' ') || '…'
  const seed = `${id}${email}`.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return {
    id,
    firstName,
    lastName,
    email,
    phone: existing?.phone ?? '',
    tint: existing?.tint ?? TINTS[seed % TINTS.length] ?? '#0ea5e9',
    birthDate: birthDate ?? existing?.birthDate,
    ordersCount: ordersCount ?? existing?.ordersCount,
  }
}

const toMessageKey = (err: unknown, fallback: MessageKey): MessageKey => {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        return fallback !== 'auth.errGeneric' ? fallback : 'auth.errSessionExpired'
      case 404:
        return fallback !== 'auth.errGeneric' ? fallback : 'auth.errEmailNotFound'
      case 429:
        return 'auth.errTooManyAttempts'
      case 0:
        return 'auth.errNetwork'
    }
  }
  return fallback
}

const toErrorMessage = (err: unknown, fallbackKey: MessageKey): string => {
  if (err instanceof ApiError) {
    if (err.message && !err.message.startsWith('Request failed with status') && err.message !== 'Session expired') {
      return err.message
    }
    return t(toMessageKey(err, fallbackKey))
  }
  return t(fallbackKey)
}

export class AuthService {
  readonly user = ref<User | null>(null)

  private readonly authRepository: AuthRepository
  private readonly tokenStore: TokenStore
  private readonly authBridge: AuthBridge

  private session: StoredSession | null = null
  private refreshToken: string | null = null
  private pendingEmail = ''
  private pendingOtp = ''

  constructor(authRepository: AuthRepository, tokenStore: TokenStore, authBridge: AuthBridge) {
    this.authRepository = authRepository
    this.tokenStore = tokenStore
    this.authBridge = authBridge

    this.restore()
    this.authBridge.bind({
      refresh: () => this.refreshSession(),
      onSessionExpired: () => this.handleSessionExpired(),
    })
  }

  get isAuthenticated(): boolean {
    return this.user.value !== null
  }

  get hasValidRefreshToken(): boolean {
    if (!this.session) return false
    const expiry = new Date(this.session.refreshTokenExpiresAt).getTime()
    return Number.isFinite(expiry) && expiry > Date.now()
  }

  get pendingEmailValue(): string {
    return this.pendingEmail
  }

  private restore(): void {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    try {
      const session = JSON.parse(raw) as StoredSession
      if (session?.accessToken && session?.user) {
        this.session = session
        this.user.value = session.user
        this.tokenStore.setTokens(session)
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  private applyLoginResponse(data: LoginResponseDto): void {
    const user = nameToUser(data.id, data.fullName, data.email, this.user.value ?? undefined)
    user.phone = data.phoneNumber
    const expiresAt = new Date(decodeJwtExp(data.token)).toISOString()
    this.session = {
      accessToken: data.token,
      accessTokenExpiresAt: expiresAt,
      refreshTokenExpiresAt: expiresAt,
      user,
    }
    this.refreshToken = data.token
    this.user.value = user
    this.tokenStore.setTokens(this.session)
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.session))
  }

  private persistUser(): void {
    if (this.session && this.user.value) {
      this.session.user = this.user.value
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.session))
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const data = await this.authRepository.login({ email, password })
      this.applyLoginResponse(data)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errInvalidCredentials') }
    }
  }

  async loginGuest(email: string, password: string): Promise<AuthResult> {
    try {
      const data = await this.authRepository.loginGuest({ email, password })
      this.applyLoginResponse(data)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errInvalidCredentials') }
    }
  }

  async refreshSession(): Promise<boolean> {
    if (!this.session) return false
    try {
      const data = await this.authRepository.refreshSession(this.refreshToken ?? undefined)
      this.applyLoginResponse(data)
      return true
    } catch (err) {
      if (err instanceof ApiError && (err.status === 0 || err.status === 429 || err.status >= 500)) {
        return false
      }
      this.handleSessionExpired()
      return false
    }
  }

  async requestOtp(email: string): Promise<AuthResult> {
    try {
      await this.authRepository.requestOtp(email)
      this.pendingEmail = email.trim().toLowerCase()
      this.pendingOtp = ''
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errEmailNotFound') }
    }
  }

  async verifyOtp(code: string): Promise<AuthResult> {
    if (!this.pendingEmail) return { ok: false, error: t('auth.errEmailNotFound') }
    try {
      await this.authRepository.verifyOtp(this.pendingEmail, code)
      this.pendingOtp = code
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errInvalidOtp') }
    }
  }

  async resetPassword(password: string): Promise<AuthResult> {
    if (!this.pendingEmail || !this.pendingOtp) return { ok: false, error: t('auth.errInvalidOtp') }
    try {
      await this.authRepository.resetPassword(this.pendingEmail, this.pendingOtp, password, password)
      this.pendingOtp = ''
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errInvalidOtp') }
    }
  }

  async fetchProfile(): Promise<void> {
    if (!this.session) return
    try {
      const profile = await this.authRepository.getProfile()
      this.user.value = nameToUser(
        profile.id,
        profile.fullName,
        profile.email,
        this.user.value ?? undefined,
        toDateInput(profile.birthDate),
        profile.ordersCount,
      )
      this.persistUser()
    } catch {
      /* interceptor handles session expiry */
    }
  }

  async updateProfile(patch: ProfilePatch): Promise<AuthResult> {
    const current = this.user.value
    if (!current || !this.session) return { ok: false, error: 'auth.errSessionExpired' }
    try {
      await this.authRepository.updateProfile({
        userId: current.id,
        fullName: `${patch.firstName} ${patch.lastName}`.trim(),
        birthDate: patch.birthDate || null,
        profilePictureName: null,
        language: locale.value,
      })
      this.user.value = {
        ...current,
        firstName: patch.firstName,
        lastName: patch.lastName,
        birthDate: patch.birthDate || undefined,
      }
      this.persistUser()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errGeneric') }
    }
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<AuthResult> {
    if (!this.session) return { ok: false, error: t('auth.errSessionExpired') }
    try {
      await this.authRepository.changePassword({ currentPassword, newPassword, confirmPassword })
      this.expireSession()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errGeneric') }
    }
  }

  expireSession(): void {
    this.session = null
    this.refreshToken = null
    this.user.value = null
    this.pendingEmail = ''
    this.pendingOtp = ''
    this.tokenStore.clear()
    localStorage.removeItem(SESSION_KEY)
  }

  private handleSessionExpired(): void {
    if (!this.user.value) return
    this.expireSession()
    toastService.info(t('auth.errSessionExpired'))
    void router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  }

  async logout(): Promise<void> {
    const token = this.refreshToken
    this.expireSession()
    if (token) {
      try {
        await this.authRepository.logout(token)
      } catch {
        /* server revoke is best-effort */
      }
    }
  }
}