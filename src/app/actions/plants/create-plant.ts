'use server'

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { createNewPlant } from "@/core/domain/plant";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { addNewPlantUseCase } from "@/core/use-cases/add-new-plant";

interface CreatePlantInput {
  name: string;
  species: string | undefined;
  locationId: string | undefined;
}

export async function createPlant(input: CreatePlantInput) {
  "use server"
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id;
  if (!userId) {
    return [null, 'Unauthorized'] as const // for now let's not handle errors in form
  }

  const [plant, errors] = createNewPlant({
    name: input.name,
    species: input.species,
  });

  if (errors) {
    return [null, errors] as const;
  }

  const plantRepository = getPlantRepository();
  const { addNewPlant } = addNewPlantUseCase(plantRepository);
  const newPlantCreationResult = await addNewPlant({
    name: plant.name,
    species: plant.species,
    locationId: input.locationId,
  }, userId);

  return newPlantCreationResult
} 