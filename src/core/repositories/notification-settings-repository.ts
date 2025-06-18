export interface NotificationSettings {
  id: string;
  userId: string;
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notificationTime: string; // HH:MM format
  timezone: string; // IANA timezone identifier
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationSettings {
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

export interface UpdateNotificationSettings {
  enabled?: boolean;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  notificationTime?: string;
  timezone?: string;
}

export interface NotificationSettingsRepository {
  findByUserId(userId: string): Promise<NotificationSettings | null>;
  create(settings: CreateNotificationSettings, userId: string): Promise<NotificationSettings>;
  update(userId: string, updates: UpdateNotificationSettings): Promise<NotificationSettings>;
  delete(userId: string): Promise<void>;
} 