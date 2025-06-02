import { db } from "../postgres-drizzle/database";
import { DrizzlePlantEventTypeRepository } from "./drizzle-plant-event-type-repository";
import type { PlantEventTypeRepository } from "../../core/repositories/plant-event-repository";

let repository: PlantEventTypeRepository | null = null;

export function getPlantEventTypeRepository(): PlantEventTypeRepository {
  if (!repository) {
    repository = new DrizzlePlantEventTypeRepository(db);
  }
  return repository;
}
