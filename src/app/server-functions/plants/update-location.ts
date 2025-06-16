"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";

interface SubmitLocationUpdateInput {
  id: string;
  name: string;
}

export async function submitLocationUpdate(input: SubmitLocationUpdateInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const locationRepository = getLocationRepository();

    // First verify the location belongs to the user
    const existingLocation = await locationRepository.findById(input.id);
    if (!existingLocation || existingLocation.userId !== userId) {
      return [null, "Location not found"] as const;
    }

    const location = await locationRepository.update(input.id, { name: input.name });

    return [{
      id: location.id,
      name: location.name,
    }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to update location'] as const;
  }
} 