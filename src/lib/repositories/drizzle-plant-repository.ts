import { and, eq, isNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { plants } from "../postgres-drizzle/schema/plant-schema";
import type { PlantRepository } from "../../core/repositories/plant-repository";
import { Plant, PlantWithId } from "@/core/domain/plant";
import { LastDateByEventTypes } from "@/core/domain/plant-event-type";

const mapPlantFromDB = (plantInDB: typeof plants.$inferSelect): PlantWithId => {
  return {
    id: plantInDB.id,
    name: plantInDB.name,
    species: plantInDB.species || undefined,
    location: plantInDB.location || undefined,
    slug: plantInDB.slug,
    lastDateByEvents: plantInDB.lastDateByEvents as LastDateByEventTypes,
    deletedAt: plantInDB.deletedAt ?? undefined,
  };
};

export class DrizzlePlantRepository implements PlantRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async create(plant: Plant, userId: string) {
    const [createdPlant] = await this.db.insert(plants)
      .values({ ...plant, userId })
      .returning();
    return mapPlantFromDB(createdPlant);
  }

  async findById(id: string, userId: string) {
    const [plant] = await this.db.select()
      .from(plants)
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
      ))
      .limit(1);
    return plant ? mapPlantFromDB(plant) : null;
  }

  async findByUserId(userId: string) {
    const plantsInDB = await this.db.select()
      .from(plants)
      .where(and(
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      ))
      .orderBy(plants.createdAt);
    return plantsInDB.map(mapPlantFromDB);
  }

  async findBySlugAndUserId(slug: string, userId: string) {
    const [plant] = await this.db.select()
      .from(plants)
      .where(and(
        eq(plants.slug, slug),
        eq(plants.userId, userId)
      ))
      .limit(1);
    return plant ? mapPlantFromDB(plant) : null;
  }

  async update(id: string, userId: string, plant: Partial<Plant>) {
    const [updatedPlant] = await this.db.update(plants)
      .set({ ...plant, updatedAt: new Date() })
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      ))
      .returning();
    return mapPlantFromDB(updatedPlant);
  }

  async delete(id: string, userId: string) {
    const [deletedPlant] = await this.db.update(plants)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(plants.id, id),
        eq(plants.userId, userId),
        isNull(plants.deletedAt)
      ))
      .returning();
    return mapPlantFromDB(deletedPlant);
  }

  async removeEventType(userId: string, eventTypeId: string) {
    await this.db.update(plants)
      .set({
        lastDateByEvents: sql`${plants.lastDateByEvents} - ${eventTypeId}`
      })
      .where(eq(plants.userId, userId));
  }
}