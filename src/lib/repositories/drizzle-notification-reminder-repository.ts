import { and, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { notificationSettings } from "../postgres-drizzle/schema/notification-settings-schema";
import { users } from "../postgres-drizzle/schema/auth-schema";
import type {
  NotificationReminderRepository,
  NotificationReminderUser,
} from "../../core/repositories/notification-reminder-repository";

export class DrizzleNotificationReminderRepository implements NotificationReminderRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async findUsersForNotification(): Promise<NotificationReminderUser[]> {
    const results = await this.db
      .select({
        userId: notificationSettings.userId,
        email: users.email,
        pushEnabled: notificationSettings.pushEnabled,
        emailEnabled: notificationSettings.emailEnabled,
        notificationTime: notificationSettings.notificationTime,
        timezone: notificationSettings.timezone,
      })
      .from(notificationSettings)
      .innerJoin(users, sql`${notificationSettings.userId} = ${users.id}`)
      .where(
        and(
          // Notifications must be enabled
          sql`${notificationSettings.enabled} = true`,
          // At least one notification method must be enabled
          or(
            sql`${notificationSettings.pushEnabled} = true`,
            sql`${notificationSettings.emailEnabled} = true`
          ),
          // Current time in user's timezone should match their notification time
          // This compares the current time converted to user's timezone with their preferred notification time
          sql`EXTRACT(HOUR FROM (NOW() AT TIME ZONE ${notificationSettings.timezone})) || ':' || 
              LPAD(EXTRACT(MINUTE FROM (NOW() AT TIME ZONE ${notificationSettings.timezone}))::text, 2, '0') = 
              ${notificationSettings.notificationTime}`
        )
      );

    return results.map(row => ({
      userId: row.userId,
      email: row.email || '',
      pushEnabled: row.pushEnabled,
      emailEnabled: row.emailEnabled,
      notificationTime: row.notificationTime,
      timezone: row.timezone,
    }));
  }
} 