import { ref } from 'vue'
import type { MessageKey } from '../i18n'
import { locale, t } from '../i18n'
import type { User } from '../domain/models/user'
import type { LoginResponseDto, UserProfileDto } from '../domain/models/auth'
import { toastService } from './toast.service'
import router from '../router'
import {
  ApiError,
  clearSessionMeta,
  http,
  setSessionExpiredHandler,
  setSessionMeta,
  setTokenRefreshHandler,
} from './http.client'

export type AuthResult = { ok: true } | { ok: false; error: MessageKey }

const SESSION_KEY = 'dentzone-auth'
const TINTS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899']

interface StoredSession {
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  user: User
}

export interface ProfilePatch {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const nameToUser = (id: string, fullName: string, email: string, existing?: User): User => {
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
  }
}

const toMessageKey = (err: unknown, fallback: MessageKey): MessageKey => {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 404:
        return 'auth.errEmailNotFound'
      case 429:
        return 'auth.errTooManyAttempts'
      case 0:
        return 'auth.errNetwork'
    }
  }
  return fallback
}

class AuthService {
  readonly user = ref<User | null>(null)

  private session: StoredSession | null = null
  private pendingEmail = ''
  private pendingOtp = ''

  constructor() {
    this.restore()
    setTokenRefreshHandler(() => this.refreshSession())
    setSessionExpiredHandler(() => this.handleSessionExpired())
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
      if (session?.user && session?.refreshTokenExpiresAt) {
        this.session = session
        this.user.value = session.user
        setSessionMeta(session.accessTokenExpiresAt, session.refreshTokenExpiresAt)
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  private applyLoginResponse(data: LoginResponseDto): void {
    const user = nameToUser(data.userId, data.fullName, data.email, this.user.value ?? undefined)
    this.session = {
      accessTokenExpiresAt: data.accessTokenExpiresAt,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt,
      user,
    }
    this.user.value = user
    setSessionMeta(data.accessTokenExpiresAt, data.refreshTokenExpiresAt)
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
      const data = await http.post<LoginResponseDto>(
        '/api/v1/auth/login',
        { email, password },
        { headers: { 'X-Attempt-Email': email } },
      )
      this.applyLoginResponse(data)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toMessageKey(err, 'auth.errInvalidCredentials') }
    }
  }

  async refreshSession(): Promise<boolean> {
    if (!this.session) return false
    try {
      const data = await http.post<LoginResponseDto>('/api/v1/auth/refresh-token', undefined, { skipAuthRefresh: true })
      this.applyLoginResponse(data)
      return true
    } catch {
      this.handleSessionExpired()
      return false
    }
  }

  async requestOtp(email: string): Promise<AuthResult> {
    try {
      await http.post('/api/v1/auth/forgot-password', { email })
      this.pendingEmail = email.trim().toLowerCase()
      this.pendingOtp = ''
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toMessageKey(err, 'auth.errEmailNotFound') }
    }
  }

  async verifyOtp(code: string): Promise<AuthResult> {
    if (!this.pendingEmail) return { ok: false, error: 'auth.errEmailNotFound' }
    try {
      await http.post('/api/v1/auth/verify-otp', { email: this.pendingEmail, otpCode: code })
      this.pendingOtp = code
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toMessageKey(err, 'auth.errInvalidOtp') }
    }
  }

  async resetPassword(password: string): Promise<AuthResult> {
    if (!this.pendingEmail || !this.pendingOtp) return { ok: false, error: 'auth.errInvalidOtp' }
    try {
      await http.post('/api/v1/auth/reset-password', {
        email: this.pendingEmail,
        otpCode: this.pendingOtp,
        newPassword: password,
        confirmPassword: password,
      })
      this.pendingOtp = ''
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toMessageKey(err, 'auth.errInvalidOtp') }
    }
  }

  async fetchProfile(): Promise<void> {
    if (!this.session) return
    try {
      const profile = await http.get<UserProfileDto>('/api/v1/auth/profile')
      this.user.value = nameToUser(profile.id, profile.fullName, profile.email, this.user.value ?? undefined)
      this.persistUser()
    } catch {
      /* interceptor handles session expiry */
    }
  }

  async updateProfile(patch: ProfilePatch): Promise<AuthResult> {
    const current = this.user.value
    if (!current || !this.session) return { ok: false, error: 'auth.errSessionExpired' }
    try {
      await http.put('/api/v1/auth/profile', {
        userId: current.id,
        fullName: `${patch.firstName} ${patch.lastName}`.trim(),
        birthDate: null,
        profilePictureName: null,
        language: locale.value,
      })
      this.user.value = { ...current, ...patch }
      this.persistUser()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toMessageKey(err, 'auth.errSessionExpired') }
    }
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<AuthResult> {
    if (!this.session) return { ok: false, error: 'auth.errSessionExpired' }
    try {
      await http.put('/api/v1/auth/change-password', { currentPassword, newPassword, confirmPassword })
      this.expireSession()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: toMessageKey(err, 'auth.errGeneric') }
    }
  }

  expireSession(): void {
    this.session = null
    this.user.value = null
    this.pendingEmail = ''
    this.pendingOtp = ''
    clearSessionMeta()
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
    try {
      await http.post('/api/v1/auth/logout', undefined, { skipAuthRefresh: true })
    } catch {
      /* server revoke is best-effort */
    }
  }
}

export const authService = new AuthService()
