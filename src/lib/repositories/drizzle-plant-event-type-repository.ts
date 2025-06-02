import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { plantEvents } from "../postgres-drizzle/schema/plant-event-type-schema";
import type { PlantEventTypeRepository } from "../../core/repositories/plant-event-repository";
import { PlantEventType, PlantEventTypeWithId } from "@/core/domain/plant-event-type";

const mapPlantEventTypeFromDB = (eventInDB: typeof plantEvents.$inferSelect): PlantEventTypeWithId => {
  return {
    id: eventInDB.id,
    name: eventInDB.name,
    hasQuickAccessButton: eventInDB.hasQuickAccessButton,
    hasComment: eventInDB.hasComment,
    isSortableByDate: eventInDB.isSortableByDate,
    displayColor: eventInDB.displayColor,
  };
};

export class DrizzlePlantEventTypeRepository implements PlantEventTypeRepository {
  constructor(private readonly db: NodePgDatabase) { }

  async create(event: PlantEventType, userId: string) {
    const [createdEvent] = await this.db.insert(plantEvents)
      .values({ ...event, userId })
      .returning();
    return mapPlantEventTypeFromDB(createdEvent);
  }

  async findByUserId(userId: string) {
    const eventsInDB = await this.db.select()
      .from(plantEvents)
      .where(eq(plantEvents.userId, userId));
    return eventsInDB.map(mapPlantEventTypeFromDB);
  }

  async findQuickAccessEventTypesByUserId(userId: string) {
    const eventsInDB = await this.db.select()
      .from(plantEvents)
      .where(and(eq(plantEvents.userId, userId), eq(plantEvents.hasQuickAccessButton, true)));
    return eventsInDB.map(mapPlantEventTypeFromDB);
  }

  async findSortableEventTypesByUserId(userId: string) {
    const eventsInDB = await this.db.select()
      .from(plantEvents)
      .where(and(eq(plantEvents.userId, userId), eq(plantEvents.isSortableByDate, true)));
    return eventsInDB.map(mapPlantEventTypeFromDB);
  }

  async update(id: string, event: Partial<PlantEventType>) {
    const [updatedEvent] = await this.db.update(plantEvents)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(plantEvents.id, id))
      .returning();
    return mapPlantEventTypeFromDB(updatedEvent);
  }

  async delete(id: string) {
    await this.db.delete(plantEvents)
      .where(eq(plantEvents.id, id));
  }
} 