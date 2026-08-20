import type {
  AuthRepository,
  LoginCredentials,
  SaveFcmTokenPayload,
  UpdateUserProfilePayload,
  VerifyOtpResult,
} from '../../domain/ports/auth-repository'
import type { LoginResponseDto, UserProfileDto } from '../../domain/models/auth'
import { AUTH_ROUTES, PASSWORD_ROUTES, USER_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

const query = (params: Record<string, string>): string => {
  const search = new URLSearchParams(params)
  return `?${search.toString()}`
}

export class ApiAuthRepository implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Promise<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(
      AUTH_ROUTES.login,
      { usernameOrEmail: credentials.usernameOrEmail, password: credentials.password },
      { headers: { 'X-Attempt-Email': credentials.usernameOrEmail }, showFeedback: false },
    )
  }

  saveFcmToken(payload: SaveFcmTokenPayload): Promise<void> {
    return this.http.post<void>(
      USER_ROUTES.saveFcmToken,
      {
        userId: payload.userId,
        fcmToken: payload.fcmToken,
        token: payload.fcmToken,
      },
      { showFeedback: false },
    )
  }

  getUserProfile(userId: string): Promise<UserProfileDto> {
    return this.http.get<UserProfileDto>(USER_ROUTES.profile(userId), { showFeedback: false })
  }

  updateUserProfile(userId: string, payload: UpdateUserProfilePayload): Promise<UserProfileDto> {
    const formData = new FormData()
    formData.append('FullName', payload.fullName)
    formData.append('PhoneNumber', payload.phoneNumber)
    formData.append('IsActive', String(payload.isActive))
    if (payload.isPopular !== null && payload.isPopular !== undefined) {
      formData.append('IsPopular', String(payload.isPopular))
    }
    if (payload.orderNum !== null && payload.orderNum !== undefined) {
      formData.append('OrderNum', String(payload.orderNum))
    }
    if (payload.profileImage) formData.append('UploudProfileImage', payload.profileImage)
    return this.http.put<UserProfileDto>(USER_ROUTES.update(userId), formData, { showFeedback: false })
  }

  forgotPassword(email: string): Promise<void> {
    return this.http.post<void>(`${PASSWORD_ROUTES.forgot}${query({ email })}`, undefined, { showFeedback: false })
  }

  verifyOtp(email: string, code: string): Promise<VerifyOtpResult> {
    return this.http.post<VerifyOtpResult>(`${PASSWORD_ROUTES.verifyOtp}${query({ email, code })}`, undefined, {
      showFeedback: false,
    })
  }

  resetPassword(email: string, newPassword: string): Promise<void> {
    return this.http.post<void>(`${PASSWORD_ROUTES.reset}${query({ email, newPassword })}`, undefined, {
      showFeedback: false,
    })
  }

  resendOtp(email: string): Promise<void> {
    return this.http.post<void>(`${PASSWORD_ROUTES.resendOtp}${query({ email })}`, undefined, { showFeedback: false })
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    return this.http.post<void>(
      USER_ROUTES.changePassword,
      { userId, currentPassword, newPassword },
      { showFeedback: false },
    )
  }

  deleteAccount(userId: string): Promise<void> {
    return this.http.del<void>(USER_ROUTES.delete(userId), { showFeedback: false })
  }
}