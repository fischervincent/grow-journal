import { PlantEventTypeRepository } from "@/core/repositories/plant-event-repository";
import { CreateNewPlantEventInput, createNewPlantEventType, PlantEventTypeError, PlantEventTypeWithId } from "@/core/domain/plant-event-type";

type AddNewPlantEventTypeResult = [PlantEventTypeWithId, undefined] | [null, PlantEventTypeError[]];

export const addNewPlantEventTypeUseCase = (plantEventTypeRepository: PlantEventTypeRepository) => {
  const addNewPlantEventType = async (newPlantType: CreateNewPlantEventInput, userId: string): Promise<AddNewPlantEventTypeResult> => {
    const [plantType, errors] = createNewPlantEventType(newPlantType);
    if (!plantType) return [null, errors];
    const plantTypeStored = await plantEventTypeRepository.create(plantType, userId);
    return [plantTypeStored, undefined];
  }

  return {
    addNewPlantEventType,
  }
}