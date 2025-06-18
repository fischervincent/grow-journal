import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

// User notification settings table
export const notificationSettings = pgTable("notification_settings", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Master notification toggle
  enabled: boolean('enabled').default(false).notNull(),

  // Notification methods
  pushEnabled: boolean('push_enabled').default(false).notNull(),
  emailEnabled: boolean('email_enabled').default(false).notNull(),

  // Timing settings
  notificationTime: text('notification_time').default('09:00').notNull(), // HH:MM format
  timezone: text('timezone').default('UTC').notNull(), // IANA timezone identifier (e.g., 'America/New_York', 'Europe/London')

  // Metadata
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    userIdIdx: index('notification_settings_user_id_idx').on(table.userId),
  }
}); 