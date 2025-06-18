import { AnyPgColumn, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { sql } from "drizzle-orm";
import { locations } from "./location-schema";
import { plantEvents } from "./plant-event-type-schema";

export const plantPhotos = pgTable("plant_photos", {
  id: uuid('id').defaultRandom().primaryKey(),
  plantId: uuid('plant_id').notNull().references((): AnyPgColumn => plants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  takenAt: timestamp('taken_at'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
});

export const plants = pgTable("plants", {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  species: text('species'),
  locationId: uuid('location_id').references((): AnyPgColumn => locations.id, { onDelete: 'set null' }),
  mainPhotoId: uuid('main_photo_id').references((): AnyPgColumn => plantPhotos.id),
  lastDateByEvents: jsonb('last_date_by_events').default({}).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => {
  return {
    slugUserIdx: uniqueIndex('plants_slug_user_id_idx').on(table.slug, table.userId),
    userIdIdx: index('plants_user_id_idx').on(table.userId),
    activeUserIdIdx: index('plants_active_user_id_idx')
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
  }
});

// Custom reminder configurations per plant (overrides default configs)
export const plantReminderConfigs = pgTable("plant_reminder_configs", {
  id: uuid('id').defaultRandom().primaryKey(),
  plantId: uuid('plant_id').notNull().references((): AnyPgColumn => plants.id, { onDelete: 'cascade' }),
  plantEventTypeId: uuid('plant_event_type_id').notNull().references((): AnyPgColumn => plantEvents.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  isEnabled: boolean('is_enabled').notNull(),
  useDefault: boolean('use_default').default(true).notNull(), // if true, use default config; if false, use custom values
  reminderType: text('reminder_type').default('fixed').notNull(), // 'fixed' or 'smart' (preserved even when using default)
  intervalValue: integer('interval_value'), // custom interval value (preserved even when using default)
  intervalUnit: text('interval_unit'), // custom interval unit (preserved even when using default)
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
  deletedAt: timestamp('deleted_at'), // soft delete
}, (table) => {
  return {
    plantEventTypeIdx: index('plant_reminder_configs_plant_event_type_idx')
      .on(table.plantId, table.plantEventTypeId),
    plantIdIdx: index('plant_reminder_configs_plant_id_idx').on(table.plantId),
    userIdIdx: index('plant_reminder_configs_user_id_idx').on(table.userId),
    activeConfigsIdx: index('plant_reminder_configs_active_idx')
      .on(table.plantId, table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
  }
});

// Actual reminder instances (scheduled reminders)
export const plantReminders = pgTable("plant_reminders", {
  id: uuid('id').defaultRandom().primaryKey(),
  plantId: uuid('plant_id').notNull().references((): AnyPgColumn => plants.id, { onDelete: 'cascade' }),
  plantEventTypeId: uuid('plant_event_type_id').notNull().references((): AnyPgColumn => plantEvents.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at').notNull(), // when the reminder should trigger
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  isSnoozed: boolean('is_snoozed').default(false).notNull(),
  snoozedUntil: timestamp('snoozed_until'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    scheduledAtIdx: index('plant_reminders_scheduled_at_idx').on(table.scheduledAt),
    plantUserIdx: index('plant_reminders_plant_user_idx').on(table.plantId, table.userId),
    userActiveIdx: index('plant_reminders_user_active_idx')
      .on(table.userId, table.isCompleted, table.scheduledAt),
    plantEventTypeIdx: index('plant_reminders_plant_event_type_idx')
      .on(table.plantId, table.plantEventTypeId),
  }
});
