import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { users } from "./auth-schema";

export const locations = pgTable(
  "locations",
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (locations) => ({
    nameUserIdIdx: unique("locations_name_user_id_unique_idx").on(locations.name, locations.userId),
  })
); 