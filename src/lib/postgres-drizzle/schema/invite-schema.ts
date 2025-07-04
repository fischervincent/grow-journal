import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const invites = pgTable("invites", {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  invitedBy: text('invited_by'), // Optional - could track who sent the invite
  isUsed: boolean('is_used').$defaultFn(() => false).notNull(),
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at'), // Optional - for expiring invites
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
}); 