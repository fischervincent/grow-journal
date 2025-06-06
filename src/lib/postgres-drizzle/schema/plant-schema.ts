import { AnyPgColumn, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { sql } from "drizzle-orm";

export const plantPhotos = pgTable("plant_photos", {
  id: uuid('id').defaultRandom().primaryKey(),
  plantId: uuid('plant_id').notNull().references((): AnyPgColumn => plants.id, { onDelete: 'cascade' }),
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
  location: text('location'),
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
