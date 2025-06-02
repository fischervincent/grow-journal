import { Plant, PlantWithId } from "../domain/plant";

export interface PlantRepository {
  create(plant: Plant, userId: string): Promise<Plant>;
  findById(id: string, userId: string): Promise<PlantWithId | null>;
  findByUserId(userId: string): Promise<PlantWithId[]>;
  findBySlugAndUserId(slug: string, userId: string): Promise<PlantWithId | null>;
} 