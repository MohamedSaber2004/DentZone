import { ref } from 'vue'
import type { MessageKey } from '../i18n'
import { t } from '../i18n'
import type { User } from '../domain/models/user'
import type { LoginResponseDto, UserProfileDto } from '../domain/models/auth'
import type { AuthRepository, UpdateUserProfilePayload } from '../domain/ports/auth-repository'
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

const nameToUser = (id: string, fullName: string, email: string): User => {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName = parts.slice(1).join(' ') || '…'
  const seed = `${id}${email}`.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return {
    id,
    firstName,
    lastName,
    email,
    phone: '',
    tint: TINTS[seed % TINTS.length] ?? '#0ea5e9',
  }
}

const decodeJwtExp = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : Date.now() + 3_600_000
  } catch {
    return Date.now() + 3_600_000
  }
}

const toMessageKey = (err: unknown, fallback: MessageKey): MessageKey => {
  if (err instanceof ApiError) {
    switch (err.status) {
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
    if (err.message && !err.message.startsWith('Request failed with status')) {
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

  constructor(authRepository: AuthRepository, tokenStore: TokenStore, authBridge: AuthBridge) {
    this.authRepository = authRepository
    this.tokenStore = tokenStore
    this.authBridge = authBridge

    this.restore()
    this.authBridge.bind({
      onSessionExpired: () => this.handleSessionExpired(),
    })
  }

  get isAuthenticated(): boolean {
    return this.user.value !== null
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
    const user = nameToUser(data.id, data.fullName, data.email)
    user.phone = data.phoneNumber
    const expiresAt = new Date(decodeJwtExp(data.token)).toISOString()
    this.session = {
      accessToken: data.token,
      accessTokenExpiresAt: expiresAt,
      refreshTokenExpiresAt: expiresAt,
      user,
    }
    this.user.value = user
    this.tokenStore.setTokens(this.session)
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.session))
  }

  async login(usernameOrEmail: string, password: string): Promise<AuthResult> {
    try {
      const data = await this.authRepository.login({ usernameOrEmail, password })
      this.applyLoginResponse(data)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errInvalidCredentials') }
    }
  }

  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      await this.authRepository.forgotPassword(email)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errEmailNotFound') }
    }
  }

  async verifyOtp(email: string, code: string): Promise<AuthResult> {
    try {
      const result = await this.authRepository.verifyOtp(email, code)
      if (!result.isVerified) return { ok: false, error: t('auth.errInvalidOtp') }
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errInvalidOtp') }
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<AuthResult> {
    try {
      await this.authRepository.resetPassword(email, newPassword)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errGeneric') }
    }
  }

  async resendOtp(email: string): Promise<AuthResult> {
    try {
      await this.authRepository.resendOtp(email)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errGeneric') }
    }
  }

  async loadProfile(): Promise<AuthResult & { profile?: UserProfileDto }> {
    const current = this.user.value
    if (!current) return { ok: false, error: t('auth.errSessionExpired') }
    try {
      const profile = await this.authRepository.getUserProfile(current.id)
      this.refreshUser(profile)
      return { ok: true, profile }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errGeneric') }
    }
  }

  async updateProfile(payload: UpdateUserProfilePayload): Promise<AuthResult & { profile?: UserProfileDto }> {
    const current = this.user.value
    if (!current) return { ok: false, error: t('auth.errSessionExpired') }
    try {
      const profile = await this.authRepository.updateUserProfile(current.id, payload)
      this.refreshUser(profile)
      return { ok: true, profile }
    } catch (err) {
      return { ok: false, error: toErrorMessage(err, 'auth.errGeneric') }
    }
  }

  private refreshUser(profile: UserProfileDto): void {
    const current = this.user.value
    if (!current || !this.session) return
    const updated = nameToUser(profile.id, profile.fullName, profile.email)
    updated.phone = profile.phoneNumber ?? ''
    this.session.user = updated
    this.user.value = updated
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.session))
  }

  expireSession(): void {
    this.session = null
    this.user.value = null
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
    this.expireSession()
  }
}