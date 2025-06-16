"use server";

import { Location } from "@/core/repositories/location-repository";
import { getAuthenticatedUserId } from "../auth-helper";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";

export async function getLocations() {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const locationRepository = getLocationRepository();
    const locations = await locationRepository.findByUserId(userId);

    const mappedLocations = locations.map(location => ({
      id: location.id,
      name: location.name,
    }));

    return [mappedLocations, null] as const;
  } catch (error) {
    return [[] as Location[], error instanceof Error ? error.message : 'Failed to get locations'] as const;
  }
} 