"use server";

import { getPlantEventRepository } from "@/lib/repositories/plant-event-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { revalidatePath } from "next/cache";

interface SubmitPlantEventDeletionInput {
  eventId: string;
}

export async function submitPlantEventDeletion(input: SubmitPlantEventDeletionInput): Promise<[{ success: boolean } | null, string | null]> {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantEventRepository = getPlantEventRepository();

    // Get the event to get the plantId before deleting
    const event = await plantEventRepository.findById(input.eventId);
    if (!event) {
      return [null, "Event not found"] as const;
    }

    // Delete the event
    await plantEventRepository.delete(input.eventId, userId);

    // Revalidate the plant page to update the UI
    revalidatePath(`/plants/${event.plantId}`);

    return [{ success: true }, null] as const;
  } catch (error) {
    console.error("Error deleting event:", error);
    return [null, error instanceof Error ? error.message : 'Failed to delete event'] as const;
  }
} 