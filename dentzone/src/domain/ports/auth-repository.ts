import type { LoginResponseDto, UserProfileDto } from '../models/auth'

export interface LoginCredentials {
  email: string
  password: string
}

export interface ProfileUpdate {
  userId: string
  fullName: string
  birthDate: string | null
  profilePictureName: string | null
  language: string
}

export interface PasswordChange {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<LoginResponseDto>
  refreshSession(refreshToken?: string): Promise<LoginResponseDto>
  logout(refreshToken?: string): Promise<void>
  requestOtp(email: string): Promise<void>
  verifyOtp(email: string, otpCode: string): Promise<void>
  resetPassword(email: string, otpCode: string, newPassword: string, confirmPassword: string): Promise<void>
  getProfile(): Promise<UserProfileDto>
  updateProfile(patch: ProfileUpdate): Promise<void>
  changePassword(payload: PasswordChange): Promise<void>
}