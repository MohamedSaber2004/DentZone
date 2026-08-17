import { ref } from 'vue'
import type { User } from '../domain/models/user'
import type { MessageKey } from '../i18n'

export type AuthResult = { ok: true } | { ok: false; error: MessageKey }

let DEMO_PASSWORD = 'demo1234'

const demoUser: User = {
  id: 'u-demo',
  firstName: 'Mohamed',
  lastName: 'Saber',
  email: 'user@dentzone.com',
  phone: '+20 100 123 4567',
  tint: '#0ea5e9',
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class AuthService {
  private readonly STORAGE_KEY = 'dentzone-user'

  readonly user = ref<User | null>(null)

  private pendingEmail = ''
  private otp = ''

  constructor() {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        this.user.value = JSON.parse(stored) as User
      } catch {
        localStorage.removeItem(this.STORAGE_KEY)
      }
    }
  }

  get isAuthenticated(): boolean {
    return this.user.value !== null
  }

  get demoEmail(): string {
    return demoUser.email
  }

  get demoPassword(): string {
    return DEMO_PASSWORD
  }

  get demoOtp(): string {
    return '123456'
  }

  get pendingEmailValue(): string {
    return this.pendingEmail
  }

  private persist(): void {
    if (this.user.value) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.user.value))
    } else {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    await delay(650)
    if (email.trim().toLowerCase() === demoUser.email && password === DEMO_PASSWORD) {
      this.user.value = { ...demoUser }
      this.persist()
      return { ok: true }
    }
    return { ok: false, error: 'auth.errInvalidCredentials' }
  }

  async requestOtp(email: string): Promise<AuthResult> {
    await delay(600)
    if (email.trim().toLowerCase() !== demoUser.email) {
      return { ok: false, error: 'auth.errEmailNotFound' }
    }
    this.pendingEmail = email.trim().toLowerCase()
    this.otp = this.demoOtp
    return { ok: true }
  }

  async verifyOtp(code: string): Promise<AuthResult> {
    await delay(650)
    if (code !== this.otp) {
      return { ok: false, error: 'auth.errInvalidOtp' }
    }
    return { ok: true }
  }

  async resetPassword(_password: string): Promise<AuthResult> {
    await delay(700)
    this.otp = ''
    return { ok: true }
  }

  async updateProfile(patch: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>): Promise<void> {
    await delay(500)
    if (!this.user.value) return
    this.user.value = { ...this.user.value, ...patch }
    this.persist()
  }

  async changePassword(current: string, next: string): Promise<AuthResult> {
    await delay(550)
    if (current !== DEMO_PASSWORD) {
      return { ok: false, error: 'profile.errCurrentPassword' }
    }
    if (next.length < 8) {
      return { ok: false, error: 'auth.passwordMin' }
    }
    DEMO_PASSWORD = next
    return { ok: true }
  }

  logout(): void {
    this.user.value = null
    this.pendingEmail = ''
    this.otp = ''
    this.persist()
  }
}

export const authService = new AuthService()