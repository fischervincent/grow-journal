import { Plant, PlantWithId } from "../domain/plant";

export interface PlantRepository {
  create(plant: Plant, userId: string): Promise<PlantWithId>;
  findById(id: string, userId: string): Promise<PlantWithId | null>;
  findByUserId(userId: string): Promise<PlantWithId[]>;
  findBySlugAndUserId(slug: string, userId: string): Promise<PlantWithId | null>;
  update(id: string, userId: string, plant: Partial<Plant>): Promise<PlantWithId>;
  delete(id: string, userId: string): Promise<PlantWithId>;
} 