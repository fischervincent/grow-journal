"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";

export async function getAllPlantEventTypes() {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantEventTypeRepository = getPlantEventTypeRepository();
    const eventTypes = await plantEventTypeRepository.findByUserId(userId);

    return [eventTypes, null] as const;
  } catch (error) {
    return [[], error instanceof Error ? error.message : 'Failed to get plant event types'] as const;
  }
}
