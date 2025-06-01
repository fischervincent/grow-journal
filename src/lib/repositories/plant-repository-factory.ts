import { db } from "../postgres-drizzle/database";
import { DrizzlePlantRepository } from "./drizzle-plant-repository";
import type { PlantRepository } from "../../core/repositories/plant-repository";

let repository: PlantRepository | null = null;

export function getPlantRepository(): PlantRepository {
  if (!repository) {
    repository = new DrizzlePlantRepository(db);
  }
  return repository;
} 