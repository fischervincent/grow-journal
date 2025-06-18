"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

export async function getUserPlantsWithPhotos() {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    const plants = await repository.findUserPlantsWithPhotos(userId);
    return [plants, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to get plants'] as const;
  }
} 