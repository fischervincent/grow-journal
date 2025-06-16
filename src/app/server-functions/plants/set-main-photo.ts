"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { PlantWithId } from "@/core/domain/plant";
import { getAuthenticatedUserId } from "../auth-helper";

interface SubmitMainPhotoInput {
  plantId: string;
  photoId: string;
}

export async function submitMainPhoto(input: SubmitMainPhotoInput): Promise<[PlantWithId | null, string | null]> {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantRepository = getPlantRepository();
    const plant = await plantRepository.setMainPhoto(input.plantId, userId, input.photoId);

    return [plant, null] as const;
  } catch (error) {
    console.error("Error setting main photo:", error);
    return [null, error instanceof Error ? error.message : 'Failed to set main photo'] as const;
  }
} 