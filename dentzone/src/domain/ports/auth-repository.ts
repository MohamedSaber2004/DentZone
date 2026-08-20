import type { LoginResponseDto, UserProfileDto } from '../models/auth'

export interface LoginCredentials {
  usernameOrEmail: string
  password: string
}

export interface UpdateUserProfilePayload {
  fullName: string
  phoneNumber: string
  isActive: boolean
  isPopular: boolean | null
  orderNum: number | null
  profileImage?: File
}

export interface VerifyOtpResult {
  message: string
  isVerified: boolean
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<LoginResponseDto>
  getUserProfile(userId: string): Promise<UserProfileDto>
  updateUserProfile(userId: string, payload: UpdateUserProfilePayload): Promise<UserProfileDto>
  forgotPassword(email: string): Promise<void>
  verifyOtp(email: string, code: string): Promise<VerifyOtpResult>
  resetPassword(email: string, newPassword: string): Promise<void>
  resendOtp(email: string): Promise<void>
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
  deleteAccount(userId: string): Promise<void>
}