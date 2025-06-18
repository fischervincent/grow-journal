"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface UpdateReminderDateInput {
  reminderId: string;
  scheduledAt: Date;
}

export async function updateReminderDate(input: UpdateReminderDateInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    const updatedReminder = await repository.updateReminderScheduledDate(input.reminderId, input.scheduledAt, userId);
    return [updatedReminder, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to update reminder date'] as const;
  }
} 