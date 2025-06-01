import { PlantWithId } from "../domain/plant";
import { PlantRepository } from "../repositories/plant-repository";


export const findPlantsByUserUseCase = (plantRepository: PlantRepository) => {
  const findPlantsByUser = async (userId: string): Promise<PlantWithId[]> => {
    const plants = await plantRepository.findByUserId(userId);
    return plants;
  }

  return {
    findPlantsByUser,
  }
}