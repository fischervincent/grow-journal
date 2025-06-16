"use server";

import { getAuthenticatedUserId } from "./auth-helper";
import { getPlantEventRepository } from "@/lib/repositories/plant-event-repository-factory";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { revalidatePath } from "next/cache";

interface SubmitPlantEventInput {
  plantId: string;
  eventId: string;
  eventDateTime: Date;
  comment?: string;
}

export async function submitPlantEvent(input: SubmitPlantEventInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();

    const plantRepository = getPlantRepository();
    const plant = await plantRepository.findById(input.plantId, userId);

    if (!plant) {
      return [null, "Plant not found"] as const;
    }

    const eventType = await getPlantEventTypeRepository().findById(input.eventId, userId);

    if (!eventType) {
      return [null, "Event type not found"] as const;
    }

    const lastDateByEvents = {
      ...plant.lastDateByEvents,
      [input.eventId]: {
        lastDate: input.eventDateTime.toISOString(),
        eventName: eventType.name,
      },
    };

    const plantEventRepository = getPlantEventRepository();
    const createdEvent = await plantEventRepository.create({
      plantId: input.plantId,
      plantEventTypeId: input.eventId,
      comment: input.comment,
      plantEventDateTime: input.eventDateTime,
    }, userId);

    await plantRepository.update(input.plantId, userId, { lastDateByEvents });

    revalidatePath(`/plants`);

    return [createdEvent, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to record plant event'] as const;
  }
} 