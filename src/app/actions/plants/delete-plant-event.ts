"use server";

import { getPlantEventRepository } from "@/lib/repositories/plant-event-repository-factory";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deletePlantEvent(
  eventId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const plantEventRepository = getPlantEventRepository();

    // Get the event to get the plantId before deleting
    const event = await plantEventRepository.findById(eventId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Delete the event
    await plantEventRepository.delete(eventId, userId);

    // Revalidate the plant page to update the UI
    revalidatePath(`/plants/${event.plantId}`);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
} 