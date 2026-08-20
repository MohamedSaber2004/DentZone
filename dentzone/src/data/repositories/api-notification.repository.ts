import type { NotificationRepository } from '../../domain/ports/notification-repository'
import type { NotificationDto } from '../../domain/models/notification'
import { NOTIFICATION_ROUTES } from '../../config/api.config'
import type { HttpClient } from '../../infrastructure/http/http-client'

export class ApiNotificationRepository implements NotificationRepository {
  constructor(private readonly http: HttpClient) {}

  async getUserNotifications(userId: string): Promise<NotificationDto[]> {
    const result = await this.http.get<NotificationDto[]>(NOTIFICATION_ROUTES.byUserId(userId), {
      showFeedback: false,
    })
    return result ?? []
  }
}
