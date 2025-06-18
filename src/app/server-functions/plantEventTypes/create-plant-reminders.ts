"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface CreatePlantRemindersInput {
  reminders: Array<{
    plantId: string;
    plantEventTypeId: string;
    scheduledAt: Date;
  }>;
}

export async function createPlantReminders(input: CreatePlantRemindersInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    const createdReminders = [];
    for (const reminder of input.reminders) {
      const created = await repository.createPlantReminder(
        reminder.plantId,
        reminder.plantEventTypeId,
        reminder.scheduledAt,
        userId
      );
      createdReminders.push(created);
    }

    return [createdReminders, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to create reminders'] as const;
  }
} 