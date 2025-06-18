"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface GetReminderConfigInput {
  plantEventTypeId: string;
}

export async function getReminderConfig(input: GetReminderConfigInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    const config = await repository.findPlantEventTypeReminderConfig(input.plantEventTypeId, userId);
    return [config, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to get reminder config'] as const;
  }
} 