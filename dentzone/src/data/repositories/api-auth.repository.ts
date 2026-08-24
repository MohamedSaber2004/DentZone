import type {
  AuthRepository,
  LoginCredentials,
  SaveFcmTokenPayload,
  UpdateUserProfilePayload,
  VerifyOtpResult,
} from '../../domain/ports/auth-repository'
import type { AddressDto, LoginResponseDto, UserProfileDto, UserRoleDto } from '../../domain/models/auth'
import { AUTH_ROUTES, PASSWORD_ROUTES, USER_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

const query = (params: Record<string, string>): string => {
  const search = new URLSearchParams(params)
  return `?${search.toString()}`
}

function normalizeUserProfile(raw: unknown, fallbackId: string): UserProfileDto {
  if (!raw || typeof raw !== 'object') {
    return {
      id: fallbackId,
      fullName: '',
      userName: null,
      email: '',
      phoneNumber: null,
      isPopular: false,
      orderNum: null,
      isActive: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      fcmToken: null,
      profileImage: null,
      addresses: [],
      roles: [],
    }
  }

  const obj = raw as Record<string, unknown>
  const data =
    obj.data && typeof obj.data === 'object'
      ? (obj.data as Record<string, unknown>)
      : obj.result && typeof obj.result === 'object'
        ? (obj.result as Record<string, unknown>)
        : obj

  const id = String(data.id || data.Id || data.userId || data.UserId || fallbackId)
  const fullName = String(data.fullName || data.FullName || data.name || data.Name || '')
  const userName = data.userName || data.UserName || data.username || null
  const email = String(data.email || data.Email || '')
  const phoneNumber = data.phoneNumber || data.PhoneNumber || data.phone || data.Phone || null
  const isPopular = data.isPopular ?? data.IsPopular ?? false
  const orderNum = data.orderNum ?? data.OrderNum ?? null
  const isActive = data.isActive ?? data.IsActive ?? true
  const isDeleted = data.isDeleted ?? data.IsDeleted ?? false
  const createdAt = String(data.createdAt || data.CreatedAt || new Date().toISOString())
  const fcmToken = data.fcmToken || data.FcmToken || null
  const profileImage =
    data.profileImage ||
    data.ProfileImage ||
    data.uploudProfileImage ||
    data.UploudProfileImage ||
    data.image ||
    data.Image ||
    null

  const rawAddresses = data.addresses || data.Addresses
  const rawRoles = data.roles || data.Roles

  return {
    id,
    fullName,
    userName: userName ? String(userName) : null,
    email,
    phoneNumber: phoneNumber ? String(phoneNumber) : null,
    isPopular: typeof isPopular === 'boolean' ? isPopular : null,
    orderNum: typeof orderNum === 'number' ? orderNum : null,
    isActive: typeof isActive === 'boolean' ? isActive : true,
    isDeleted: typeof isDeleted === 'boolean' ? isDeleted : false,
    createdAt,
    fcmToken: fcmToken ? String(fcmToken) : null,
    profileImage: profileImage ? String(profileImage) : null,
    addresses: Array.isArray(rawAddresses) ? (rawAddresses as AddressDto[]) : [],
    roles: Array.isArray(rawRoles) ? (rawRoles as UserRoleDto[]) : [],
  }
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

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const raw = await this.http.get<unknown>(USER_ROUTES.profile(userId), { showFeedback: false })
    return normalizeUserProfile(raw, userId)
  }

  async updateUserProfile(userId: string, payload: UpdateUserProfilePayload): Promise<UserProfileDto> {
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
    const raw = await this.http.put<unknown>(USER_ROUTES.update(userId), formData, { showFeedback: false })
    return normalizeUserProfile(raw, userId)
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