import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { plantEvents } from "../postgres-drizzle/schema/plant-events-schema";
import type { PlantEventRepository } from "../../core/repositories/plant-event-repository";
import { PlantEvent, PlantEventWithId } from "@/core/domain/plant-event";

const mapPlantEventFromDB = (
  plantEventInDB: typeof plantEvents.$inferSelect
): PlantEventWithId => {
  return {
    id: plantEventInDB.id,
    plantEventDateTime: plantEventInDB.plantEventDateTime,
    comment: plantEventInDB.comment || undefined,
    plantEventTypeId: plantEventInDB.plantEventTypeId,
    plantId: plantEventInDB.plantId,
    createdAt: plantEventInDB.createdAt,
    updatedAt: plantEventInDB.updatedAt,
  };
};

export class DrizzlePlantEventRepository implements PlantEventRepository {
  constructor(private readonly db: NodePgDatabase) { }

  async create(plantEvent: PlantEvent, userId: string) {
    const [createdPlantEvent] = await this.db
      .insert(plantEvents)
      .values({ ...plantEvent, userId })
      .returning();
    return mapPlantEventFromDB(createdPlantEvent);
  }

  async findByPlantId(plantId: string, userId: string) {
    const plantEventsInDB = await this.db
      .select()
      .from(plantEvents)
      .where(and(eq(plantEvents.plantId, plantId), eq(plantEvents.userId, userId)))
      .orderBy(plantEvents.plantEventDateTime);
    return plantEventsInDB.map(mapPlantEventFromDB);
  }

  async findByPlantIdAndType(
    plantId: string,
    plantEventTypeId: string,
    userId: string
  ) {
    const plantEventsInDB = await this.db
      .select()
      .from(plantEvents)
      .where(
        and(
          eq(plantEvents.plantId, plantId),
          eq(plantEvents.plantEventTypeId, plantEventTypeId),
          eq(plantEvents.userId, userId)
        )
      )
      .orderBy(plantEvents.plantEventDateTime);
    return plantEventsInDB.map(mapPlantEventFromDB);
  }
} 