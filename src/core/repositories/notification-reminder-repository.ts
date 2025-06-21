export interface NotificationReminderUser {
  userId: string;
  email: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

export interface NotificationReminderRepository {
  findUsersForNotification(): Promise<NotificationReminderUser[]>;
} 