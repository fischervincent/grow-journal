import { pgTable, text, timestamp, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const plants = pgTable("plants", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  species: text('species'),
  location: text('location'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
}, (table) => {
  return {
    slugUserIdx: uniqueIndex('plants_slug_user_id_idx').on(table.slug, table.userId),
    userIdIdx: index('plants_user_id_idx').on(table.userId),
  }
});
