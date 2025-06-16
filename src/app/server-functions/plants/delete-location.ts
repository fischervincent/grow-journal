"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";

interface SubmitLocationDeletionInput {
  id: string;
}

export async function submitLocationDeletion(input: SubmitLocationDeletionInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const locationRepository = getLocationRepository();

    // First verify the location belongs to the user
    const existingLocation = await locationRepository.findById(input.id);
    if (!existingLocation || existingLocation.userId !== userId) {
      return [null, "Location not found"] as const;
    }

    await locationRepository.delete(input.id);

    return [{ success: true }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to delete location'] as const;
  }
} 