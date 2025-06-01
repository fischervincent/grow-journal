import { Plant } from "../domain/plant";

export interface PlantRepository {
  create(plant: Plant, userId: string): Promise<Plant>;
} 