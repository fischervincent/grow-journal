"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface DeletePlantRemindersInput {
  eventTypeId: string;
}

export async function deletePlantRemindersByEventType(input: DeletePlantRemindersInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    // Get all reminders for this event type
    const reminders = await repository.findPlantRemindersByEventType(input.eventTypeId, userId);

    // Delete each reminder
    for (const reminder of reminders) {
      await repository.deleteReminder(reminder.id, userId);
    }

    return [{ deletedCount: reminders.length }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to delete reminders'] as const;
  }
} 