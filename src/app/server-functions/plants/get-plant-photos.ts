"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { PlantPhoto } from "@/core/domain/plant";
import { getAuthenticatedUserId } from "../auth-helper";

export async function getPlantPhotos(plantId: string): Promise<[PlantPhoto[], string | null]> {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantRepository = getPlantRepository();
    const photos = await plantRepository.getPhotos(plantId, userId);

    return [photos, null] as const;
  } catch (error) {
    console.error("Error getting photos:", error);
    return [[], error instanceof Error ? error.message : 'Failed to get photos'] as const;
  }
} 