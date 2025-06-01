import { PlantRepository } from "../repositories/plant-repository";
import { createNewPlant } from "../domain/plant";

interface AddNewPlantDto {
  name: string;
  species: string | undefined;
  location: string | undefined;
}

export const newPlantUseCase = (plantRepository: PlantRepository) => {
  const newPlant = async (newPlantDto: AddNewPlantDto, userId: string) => {
    const [plant, errors] = createNewPlant(newPlantDto);
    if (!plant) return [null, errors];
    await plantRepository.create(plant, userId);
    return plant;
  }

  return {
    newPlant,
  }
}