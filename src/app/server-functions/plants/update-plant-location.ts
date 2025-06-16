"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { revalidatePath } from "next/cache";

interface SubmitPlantLocationUpdateInput {
  plantId: string;
  locationId: string | undefined;
}

export async function submitPlantLocationUpdate(input: SubmitPlantLocationUpdateInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantRepository = getPlantRepository();

    const plant = await plantRepository.update(input.plantId, userId, {
      locationId: input.locationId,
    });

    revalidatePath(`/plants/${plant.slug}`);

    return [plant, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to update plant location'] as const;
  }
} 