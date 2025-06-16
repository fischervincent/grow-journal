'use server'

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { createNewPlant } from "@/core/domain/plant";
import { getAuthenticatedUserId } from "../auth-helper";
import { addNewPlantUseCase } from "@/core/use-cases/add-new-plant";

interface SubmitPlantFormInput {
  name: string;
  species: string | undefined;
  locationId: string | undefined;
}

export async function submitPlantForm(input: SubmitPlantFormInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();

    const [plant, domainErrors] = createNewPlant({
      name: input.name,
      species: input.species,
    });

    if (domainErrors) {
      return [null, domainErrors] as const;
    }

    const plantRepository = getPlantRepository();
    const { addNewPlant } = addNewPlantUseCase(plantRepository);
    const newPlantCreationResult = await addNewPlant({
      name: plant.name,
      species: plant.species,
      locationId: input.locationId,
    }, userId);

    return newPlantCreationResult;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to create plant'] as const;
  }
} 