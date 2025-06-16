"use server";

import { PlantEventWithId } from "@/core/domain/plant-event";
import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantEventRepository } from "@/lib/repositories/plant-event-repository-factory";

export async function getPlantEvents(plantId: string, eventTypeId?: string) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantEventRepository = getPlantEventRepository();

    const plantEvents = eventTypeId
      ? await plantEventRepository.findByPlantIdAndType(plantId, eventTypeId, userId)
      : await plantEventRepository.findByPlantId(plantId, userId);

    return [plantEvents, null] as const;
  } catch (error) {
    console.error("Error fetching plant events:", error);
    return [[] as PlantEventWithId[], error instanceof Error ? error.message : 'Failed to fetch plant events'] as const;
  }
} 