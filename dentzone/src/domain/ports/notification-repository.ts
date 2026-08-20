import type { NotificationDto } from '../models/notification'

export interface NotificationRepository {
  getUserNotifications(userId: string): Promise<NotificationDto[]>
}
