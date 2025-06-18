import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { notificationSettings } from "../postgres-drizzle/schema/notification-settings-schema";
import type {
  NotificationSettingsRepository,
  NotificationSettings,
  CreateNotificationSettings,
  UpdateNotificationSettings,
} from "../../core/repositories/notification-settings-repository";

export class DrizzleNotificationSettingsRepository implements NotificationSettingsRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async findByUserId(userId: string): Promise<NotificationSettings | null> {
    const [result] = await this.db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      userId: result.userId,
      enabled: result.enabled,
      pushEnabled: result.pushEnabled,
      emailEnabled: result.emailEnabled,
      notificationTime: result.notificationTime,
      timezone: result.timezone,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async create(settings: CreateNotificationSettings, userId: string): Promise<NotificationSettings> {
    const [created] = await this.db
      .insert(notificationSettings)
      .values({
        userId,
        enabled: settings.enabled,
        pushEnabled: settings.pushEnabled,
        emailEnabled: settings.emailEnabled,
        notificationTime: settings.notificationTime,
        timezone: settings.timezone,
      })
      .returning();

    return {
      id: created.id,
      userId: created.userId,
      enabled: created.enabled,
      pushEnabled: created.pushEnabled,
      emailEnabled: created.emailEnabled,
      notificationTime: created.notificationTime,
      timezone: created.timezone,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(userId: string, updates: UpdateNotificationSettings): Promise<NotificationSettings> {
    const [updated] = await this.db
      .update(notificationSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationSettings.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Notification settings not found');
    }

    return {
      id: updated.id,
      userId: updated.userId,
      enabled: updated.enabled,
      pushEnabled: updated.pushEnabled,
      emailEnabled: updated.emailEnabled,
      notificationTime: updated.notificationTime,
      timezone: updated.timezone,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(userId: string): Promise<void> {
    await this.db
      .delete(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
  }
} 