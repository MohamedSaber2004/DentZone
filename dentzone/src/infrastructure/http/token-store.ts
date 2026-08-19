const ACCESS_TOKEN_COOKIE = 'dz_access_token'

export const ACCESS_TOKEN_EXPIRY_MARGIN_MS = 30_000

export interface TokenSet {
  accessToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
}

export class TokenStore {
  private accessToken = ''
  private accessTokenExpiresAt = ''
  private refreshTokenExpiresAt = ''

  setTokens(tokens: TokenSet): void {
    this.accessToken = tokens.accessToken
    this.accessTokenExpiresAt = tokens.accessTokenExpiresAt
    this.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt
  }

  clear(): void {
    this.accessToken = ''
    this.accessTokenExpiresAt = ''
    this.refreshTokenExpiresAt = ''
  }

  hasAccessToken(): boolean {
    return this.getAccessToken() !== ''
  }

  getAccessToken(): string {
    if (this.accessToken) return this.accessToken
    return this.readAccessTokenCookie()
  }

  isAccessTokenExpiring(withinMs: number = ACCESS_TOKEN_EXPIRY_MARGIN_MS): boolean {
    return this.isPastOrNear(this.accessTokenExpiresAt, withinMs)
  }

  isRefreshTokenExpired(): boolean {
    return this.isPastOrNear(this.refreshTokenExpiresAt, 0)
  }

  private readAccessTokenCookie(): string {
    const match = document.cookie
      .split('; ')
      .find((part) => part.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
    return match ? decodeURIComponent(match.slice(ACCESS_TOKEN_COOKIE.length + 1)) : ''
  }

  private isPastOrNear(iso: string, withinMs: number): boolean {
    if (!iso) return false
    const time = new Date(iso).getTime()
    return Number.isFinite(time) && Date.now() >= time - withinMs
  }
}