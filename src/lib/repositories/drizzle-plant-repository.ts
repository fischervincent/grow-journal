import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { plants } from "../postgres-drizzle/schema/plant-schema";
import type { PlantRepository } from "../../core/repositories/plant-repository";
import { Plant } from "@/core/domain/plant";

export class DrizzlePlantRepository implements PlantRepository {
  constructor(private readonly db: NodePgDatabase) { }

  async create(plant: Plant, userId: string) {
    await this.db.insert(plants)
      .values({ ...plant, userId })
      .returning();
    return plant;
  }
} 