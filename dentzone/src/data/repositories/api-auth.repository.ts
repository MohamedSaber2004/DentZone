import type { AuthRepository, LoginCredentials, PasswordChange, ProfileUpdate } from '../../domain/ports/auth-repository'
import type { LoginResponseDto, UserProfileDto } from '../../domain/models/auth'
import { AUTH_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiAuthRepository implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Promise<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(
      AUTH_ROUTES.login,
      { email: credentials.email, password: credentials.password },
      { headers: { 'X-Attempt-Email': credentials.email }, showFeedback: false },
    )
  }

  refreshSession(refreshToken?: string): Promise<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(
      AUTH_ROUTES.refreshToken,
      { refreshToken: refreshToken ?? undefined },
      { skipAuthRefresh: true, showFeedback: false },
    )
  }

  logout(refreshToken?: string): Promise<void> {
    return this.http.post<void>(
      AUTH_ROUTES.logout,
      { refreshToken: refreshToken ?? undefined },
      { skipAuthRefresh: true, showFeedback: false },
    )
  }

  requestOtp(email: string): Promise<void> {
    return this.http.post<void>(
      AUTH_ROUTES.forgotPassword,
      { email },
      { showFeedback: false },
    )
  }

  verifyOtp(email: string, otpCode: string): Promise<void> {
    return this.http.post<void>(
      AUTH_ROUTES.verifyOtp,
      { email, otpCode },
      { showFeedback: false },
    )
  }

  resetPassword(email: string, otpCode: string, newPassword: string, confirmPassword: string): Promise<void> {
    return this.http.post<void>(
      AUTH_ROUTES.resetPassword,
      { email, otpCode, newPassword, confirmPassword },
      { showFeedback: false },
    )
  }

  getProfile(): Promise<UserProfileDto> {
    return this.http.get<UserProfileDto>(AUTH_ROUTES.profile)
  }

  updateProfile(patch: ProfileUpdate): Promise<void> {
    return this.http.put<void>(AUTH_ROUTES.profile, patch)
  }

  changePassword(payload: PasswordChange): Promise<void> {
    return this.http.put<void>(AUTH_ROUTES.changePassword, payload)
  }
}