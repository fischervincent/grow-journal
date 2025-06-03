import { db } from "../postgres-drizzle/database";
import type { PlantEventRepository } from "@/core/repositories/plant-event-repository";
import { DrizzlePlantEventRepository } from "./drizzle-plant-event-repository";

let repository: PlantEventRepository | null = null;

export function getPlantEventRepository(): PlantEventRepository {
  if (!repository) {
    repository = new DrizzlePlantEventRepository(db);
  }
  return repository;
} 