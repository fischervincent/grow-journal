"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";
import type { UpdatePlantEventTypeReminderConfig } from "@/core/repositories/plant-reminder-repository";

interface UpdateReminderConfigInput {
  configId: string;
  plantEventTypeId: string;
  isEnabled?: boolean;
  reminderType?: string;
  intervalValue?: number;
  intervalUnit?: string;
}

export async function updateReminderConfig(input: UpdateReminderConfigInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    const updates: UpdatePlantEventTypeReminderConfig = {
      isEnabled: input.isEnabled,
      reminderType: input.reminderType,
      intervalValue: input.intervalValue,
      intervalUnit: input.intervalUnit,
    };

    const updatedConfig = await repository.updatePlantEventTypeReminderConfig(input.configId, updates, userId);

    if (input.isEnabled === false) {
      const reminders = await repository.findPlantRemindersByEventType(input.plantEventTypeId, userId);
      for (const reminder of reminders) {
        await repository.deleteReminder(reminder.id, userId);
      }
    }

    return [updatedConfig, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to update reminder config'] as const;
  }
} 