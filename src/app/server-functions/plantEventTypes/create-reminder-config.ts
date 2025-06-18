"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";
import type { CreatePlantEventTypeReminderConfig } from "@/core/repositories/plant-reminder-repository";

interface CreateReminderConfigInput {
  plantEventTypeId: string;
  isEnabled: boolean;
  reminderType: string;
  intervalValue: number;
  intervalUnit: string;
}

export async function createReminderConfig(input: CreateReminderConfigInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    const config: CreatePlantEventTypeReminderConfig = {
      plantEventTypeId: input.plantEventTypeId,
      isEnabled: input.isEnabled,
      reminderType: input.reminderType,
      intervalValue: input.intervalValue,
      intervalUnit: input.intervalUnit,
    };

    const createdConfig = await repository.createPlantEventTypeReminderConfig(config, userId);
    return [createdConfig, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to create reminder config'] as const;
  }
} 