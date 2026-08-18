export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  refreshTokenReused: boolean
  userId: string
  fullName: string
  email: string
  userType: number
  roles: string[]
}

export interface UserProfileDto {
  id: string
  fullName: string
  email: string
  birthDate: string | null
  profilePictureName: string | null
  language: string
  userType: number
  ordersCount?: number
}