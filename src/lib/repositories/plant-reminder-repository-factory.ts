import { db } from "../postgres-drizzle/database";
import { DrizzlePlantReminderRepository } from "./drizzle-plant-reminder-repository";
import type { PlantReminderRepository } from "../../core/repositories/plant-reminder-repository";

let repository: PlantReminderRepository | null = null;

export function getPlantReminderRepository(): PlantReminderRepository {
  if (!repository) {
    repository = new DrizzlePlantReminderRepository(db);
  }
  return repository;
} 