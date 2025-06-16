"use server";

import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { revalidatePath } from "next/cache";

interface SubmitPlantEventTypeDeletionInput {
  plantEventType: PlantEventTypeWithId;
}

export async function submitPlantEventTypeDeletion(input: SubmitPlantEventTypeDeletionInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();

    if (input.plantEventType.hasQuickAccessButton) {
      const plantRepository = getPlantRepository();
      await plantRepository.removeEventType(userId, input.plantEventType.id);
    }

    const plantEventTypeRepository = getPlantEventTypeRepository();
    await plantEventTypeRepository.delete(input.plantEventType.id, userId);

    revalidatePath("/event-settings");

    return [{ success: true }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to delete plant event type'] as const;
  }
} 