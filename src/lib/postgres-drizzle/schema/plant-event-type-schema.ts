import { pgTable, text, uuid, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
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

// Default reminder configurations for plant event types
export const plantEventTypeReminderConfigs = pgTable("plant_event_type_reminder_configs", {
  id: uuid('id').defaultRandom().primaryKey(),
  plantEventTypeId: uuid('plant_event_type_id').notNull().references(() => plantEvents.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isEnabled: boolean('is_enabled').default(false).notNull(),
  reminderType: text('reminder_type').default('fixed').notNull(), // 'fixed' or 'smart'
  intervalValue: integer('interval_value').notNull(), // e.g., 2 for "every 2 months"
  intervalUnit: text('interval_unit').notNull(), // 'days', 'weeks', 'months', 'years'
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    plantEventTypeUserIdx: index('plant_event_type_reminder_configs_event_type_user_idx')
      .on(table.plantEventTypeId, table.userId),
    userIdIdx: index('plant_event_type_reminder_configs_user_id_idx').on(table.userId),
  }
}); 