"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface GetPlantReminderConfigsInput {
  eventTypeId: string;
}

export async function getPlantReminderConfigs(input: GetPlantReminderConfigsInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    // Get the event type with configs which includes all plant configs for this event type
    const eventTypeWithConfigs = await repository.findPlantEventTypeWithConfigs(input.eventTypeId, userId);

    if (!eventTypeWithConfigs) {
      return [];
    }

    // Return the plant configs
    return eventTypeWithConfigs.plantConfigs.map(pc => ({
      plantId: pc.plantId,
      plantName: pc.plantName,
      isEnabled: pc.config.isEnabled,
      useDefault: pc.config.useDefault,
      reminderType: pc.config.reminderType,
      intervalValue: pc.config.intervalValue,
      intervalUnit: pc.config.intervalUnit,
    }));
  } catch (error) {
    console.error("Failed to get plant reminder configs:", error);
    return [];
  }
} 