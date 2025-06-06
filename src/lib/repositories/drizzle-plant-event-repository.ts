import { and, desc, eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { plantEvents } from "../postgres-drizzle/schema/plant-events-schema";
import type { PlantEventRepository } from "../../core/repositories/plant-event-repository";
import { PlantEvent, PlantEventWithId } from "@/core/domain/plant-event";

const mapPlantEventFromDB = (eventInDB: typeof plantEvents.$inferSelect): PlantEventWithId => {
  return {
    id: eventInDB.id,
    plantId: eventInDB.plantId,
    plantEventTypeId: eventInDB.plantEventTypeId,
    plantEventDateTime: eventInDB.plantEventDateTime,
    comment: eventInDB.comment || undefined,
  };
};

export class DrizzlePlantEventRepository implements PlantEventRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async create(plantEvent: PlantEvent, userId: string): Promise<PlantEventWithId> {
    const [createdEvent] = await this.db
      .insert(plantEvents)
      .values({ ...plantEvent, userId })
      .returning();
    return mapPlantEventFromDB(createdEvent);
  }

  async findByPlantId(plantId: string, userId: string): Promise<PlantEventWithId[]> {
    const eventsInDB = await this.db
      .select()
      .from(plantEvents)
      .where(and(eq(plantEvents.plantId, plantId), eq(plantEvents.userId, userId)))
      .orderBy(desc(plantEvents.plantEventDateTime));
    console.log(eventsInDB);

    return eventsInDB.map(mapPlantEventFromDB);
  }

  async findByPlantIdAndType(
    plantId: string,
    plantEventTypeId: string,
    userId: string
  ): Promise<PlantEventWithId[]> {
    const eventsInDB = await this.db
      .select()
      .from(plantEvents)
      .where(
        and(
          eq(plantEvents.plantId, plantId),
          eq(plantEvents.plantEventTypeId, plantEventTypeId),
          eq(plantEvents.userId, userId)
        )
      )
      .orderBy(desc(plantEvents.plantEventDateTime));
    console.log(eventsInDB);
    return eventsInDB.map(mapPlantEventFromDB);
  }
} 