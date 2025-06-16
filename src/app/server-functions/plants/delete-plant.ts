"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { revalidatePath } from "next/cache";

interface SubmitPlantDeletionInput {
  plantId: string;
}

export async function submitPlantDeletion(input: SubmitPlantDeletionInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantRepository = getPlantRepository();

    await plantRepository.delete(input.plantId, userId);
    revalidatePath("/plants", "page");

    return [{ success: true }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to delete plant'] as const;
  }
}
