import { getQuickAccessEventTypesByUserUseCase } from "@/core/use-cases/event-types/get-quick-access-event-types";
import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";

export async function getQuickAccessEventTypes() {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantEventTypeRepository = getPlantEventTypeRepository();
    const { getQuickAccessEventTypesByUser } = getQuickAccessEventTypesByUserUseCase(plantEventTypeRepository);
    const eventTypes = await getQuickAccessEventTypesByUser(userId);

    return [eventTypes, null] as const;
  } catch (error) {
    return [[] as PlantEventTypeWithId[], error instanceof Error ? error.message : 'Failed to get quick access event types'] as const;
  }
}
