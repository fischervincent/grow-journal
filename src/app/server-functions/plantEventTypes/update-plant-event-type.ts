"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";

interface SubmitPlantEventTypeUpdateInput {
  id: string;
  name?: string;
  displayColor?: string;
  hasQuickAccessButton?: boolean;
}

export async function submitPlantEventTypeUpdate(input: SubmitPlantEventTypeUpdateInput) {
  "use server"

  try {
    await getAuthenticatedUserId();
    const repository = getPlantEventTypeRepository();

    const updatedEventType = await repository.update(input.id, {
      name: input.name,
      displayColor: input.displayColor,
      hasQuickAccessButton: input.hasQuickAccessButton,
    });

    return [updatedEventType, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to update plant event type'] as const;
  }
}
