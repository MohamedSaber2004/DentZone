export interface NotificationDto {
  id: string
  userId: string
  title: string
  message: string
  createdAt: string
  expired: string
  status: number
  link?: string
}
