export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  tint: string
  birthDate?: string
  ordersCount?: number
  profileImage?: string
}