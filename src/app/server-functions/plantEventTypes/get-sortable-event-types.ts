import { getSortableEventTypesByUserUseCase } from "@/core/use-cases/event-types/get-sortable-event-types";
import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";

export async function getSortableEventTypesByUser() {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantEventTypeRepository = getPlantEventTypeRepository();
    const { getSortableEventTypesByUser } = getSortableEventTypesByUserUseCase(plantEventTypeRepository);
    const eventTypes = await getSortableEventTypesByUser(userId);

    return [eventTypes, null] as const;
  } catch (error) {
    return [[] as PlantEventTypeWithId[], error instanceof Error ? error.message : 'Failed to get sortable event types'] as const;
  }
} 