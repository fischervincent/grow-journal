import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { plants } from "./plant-schema";
import { plantEvents as plantEventTypes } from "./plant-event-type-schema";

export const plantEvents = pgTable("plant_events", {
  id: uuid('id').defaultRandom().primaryKey(),
  plantEventDateTime: timestamp('plant_event_date_time').notNull(),
  comment: text('comment'),
  plantEventTypeId: uuid('plant_event_type_id').notNull().references(() => plantEventTypes.id, { onDelete: 'cascade' }),
  plantId: uuid('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    userIdIdx: index('plant_events_user_id_idx').on(table.userId),
    userPlantIdx: index('plant_events_user_plant_idx').on(table.userId, table.plantId),
    userPlantTypeIdx: index('plant_events_user_plant_type_idx').on(table.userId, table.plantId, table.plantEventTypeId),
    userPlantDateIdx: index('plant_events_user_plant_date_idx').on(table.userId, table.plantId, table.plantEventDateTime),
  }
}); 