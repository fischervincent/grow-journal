import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const plantEvents = pgTable("plant_event_types", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isSortableByDate: boolean('is_sortable_by_date').default(true).notNull(),
  hasQuickAccessButton: boolean('has_quick_access_button').default(false).notNull(),
  hasComment: boolean('has_comment').default(false).notNull(),
  displayColor: text('display_color').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}); 