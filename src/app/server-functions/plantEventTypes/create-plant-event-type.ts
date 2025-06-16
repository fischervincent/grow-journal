"use server";

import { createNewPlantEventType } from "@/core/domain/plant-event-type";
import { addNewPlantEventTypeUseCase } from "@/core/use-cases/event-types/add-new-event-type";
import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";

interface SubmitPlantEventTypeInput {
  name: string;
  displayColor: string;
  isSortableByDate: boolean;
  hasQuickAccessButton: boolean;
  hasComment: boolean;
}

export async function submitPlantEventType(input: SubmitPlantEventTypeInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();

    const [newPlantEventType, domainErrors] = createNewPlantEventType(input);

    if (domainErrors) {
      return [null, domainErrors] as const;
    }

    const plantEventTypeRepository = getPlantEventTypeRepository();
    const { addNewPlantEventType } = addNewPlantEventTypeUseCase(plantEventTypeRepository);
    const [createdPlantEventType] = await addNewPlantEventType(newPlantEventType, userId);

    return [createdPlantEventType, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to create plant event type'] as const;
  }
} 