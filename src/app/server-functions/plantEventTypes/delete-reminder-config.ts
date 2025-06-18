"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface DeleteReminderConfigInput {
  configId: string;
  plantEventTypeId: string;
}

export async function deleteReminderConfig(input: DeleteReminderConfigInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    // Delete all reminders for this event type first
    const reminders = await repository.findPlantRemindersByEventType(input.plantEventTypeId, userId);
    for (const reminder of reminders) {
      await repository.deleteReminder(reminder.id, userId);
    }

    // Delete the config itself
    await repository.deletePlantEventTypeReminderConfig(input.configId, userId);

    return [true, null] as const;
  } catch (error) {
    return [false, error instanceof Error ? error.message : 'Failed to delete reminder config'] as const;
  }
} 