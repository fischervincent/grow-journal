import { PlantRepository } from "../repositories/plant-repository";
import { createNewPlant, PlantCreationError, PlantWithId } from "../domain/plant";

interface AddNewPlantDto {
  name: string;
  species: string | undefined;
  locationId: string | undefined;
}

type AddNewPlantResult = [PlantWithId, undefined] | [null, PlantCreationError[]];

export const addNewPlantUseCase = (plantRepository: PlantRepository) => {
  const addNewPlant = async (newPlantDto: AddNewPlantDto, userId: string): Promise<AddNewPlantResult> => {
    const [plant, errors] = createNewPlant(newPlantDto);
    if (!plant) return [null, errors];
    console.log({ newPlantDto })
    const plantStored = await plantRepository.create({ ...plant, locationId: newPlantDto.locationId }, userId);
    return [plantStored, undefined];
  }

  return {
    addNewPlant,
  }
}