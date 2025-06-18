"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface GetPlantRemindersInput {
  eventTypeId: string;
}

export async function getPlantReminders(input: GetPlantRemindersInput) {
  const userId = await getAuthenticatedUserId();
  const repository = getPlantReminderRepository();

  const reminders = await repository.findPlantRemindersByEventType(input.eventTypeId, userId);

  return reminders;
} 