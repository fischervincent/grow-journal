import { AnyPgColumn, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { plants } from "./plant-schema";

export const notes = pgTable("notes", {
  id: uuid('id').defaultRandom().primaryKey(),
  plantId: uuid('plant_id').notNull().references((): AnyPgColumn => plants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    plantIdIdx: index('notes_plant_id_idx').on(table.plantId),
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    plantUserIdx: index('notes_plant_user_idx').on(table.plantId, table.userId),
    createdAtIdx: index('notes_created_at_idx').on(table.createdAt),
  }
});
