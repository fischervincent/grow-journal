import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
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
  };
};

export class DrizzlePlantRepository implements PlantRepository {
  constructor(private readonly db: NodePgDatabase) { }

  async create(plant: Plant, userId: string) {
    await this.db.insert(plants)
      .values({ ...plant, userId })
      .returning();
    return plant;
  }

  async findById(id: string, userId: string) {
    const [plant] = await this.db.select()
      .from(plants)
      .where(and(eq(plants.id, id), eq(plants.userId, userId)))
      .limit(1);
    return plant ? mapPlantFromDB(plant) : null;
  }

  async findByUserId(userId: string) {
    const plantsInDB = await this.db.select()
      .from(plants)
      .where(eq(plants.userId, userId));
    return plantsInDB.map(mapPlantFromDB);
  }

  async findBySlugAndUserId(slug: string, userId: string) {
    const [plant] = await this.db.select()
      .from(plants)
      .where(and(eq(plants.slug, slug), eq(plants.userId, userId)))
      .limit(1);
    return plant ? mapPlantFromDB(plant) : null;
  }

  async update(id: string, plant: Partial<Plant>) {
    const [updatedPlant] = await this.db.update(plants)
      .set({ ...plant, updatedAt: new Date() })
      .where(eq(plants.id, id))
      .returning();
    return updatedPlant;
  }

  async delete(id: string) {
    await this.db.delete(plants)
      .where(eq(plants.id, id));
  }
}