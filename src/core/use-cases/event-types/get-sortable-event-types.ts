import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { PlantEventTypeRepository } from "@/core/repositories/plant-event-repository";

export const getSortableEventTypesByUserUseCase = (plantEventTypeRepository: PlantEventTypeRepository) => {
  const getSortableEventTypesByUser = async (userId: string): Promise<PlantEventTypeWithId[]> => {
    const events = await plantEventTypeRepository.findSortableEventTypesByUserId(userId);
    return events;
  }

  return {
    getSortableEventTypesByUser,
  }
}