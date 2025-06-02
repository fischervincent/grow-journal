import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { PlantEventTypeRepository } from "@/core/repositories/plant-event-repository";

export const getQuickAccessEventTypesByUserUseCase = (plantEventTypeRepository: PlantEventTypeRepository) => {
  const getQuickAccessEventTypesByUser = async (userId: string): Promise<PlantEventTypeWithId[]> => {
    const events = await plantEventTypeRepository.findQuickAccessEventTypesByUserId(userId);
    return events;
  }

  return {
    getQuickAccessEventTypesByUser,
  }
}