import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const plants = pgTable("plants", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});
