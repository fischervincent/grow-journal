import { AnyPgColumn, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const notificationSubscriptions = pgTable("notification_subscriptions", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  subscription: jsonb('subscription').notNull(), // Store the full subscription object
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    userIdIdx: index('notification_subscriptions_user_id_idx').on(table.userId),
    endpointIdx: index('notification_subscriptions_endpoint_idx').on(table.endpoint),
  }
}); 