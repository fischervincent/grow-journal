'use server'

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { createNewPlant } from "@/core/domain/plant";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { newPlantUseCase } from "@/core/use-cases/new-plant";

interface CreatePlantInput {
  name: string;
  species: string | undefined;
  location: string | undefined;
}

export async function createPlant(input: CreatePlantInput) {
  "use server"
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, errors: ['Unauthorized'] };
  }

  const [plant, errors] = createNewPlant(input);

  if (errors) {
    return { success: false, errors };
  }

  const plantRepository = getPlantRepository();
  const { newPlant } = newPlantUseCase(plantRepository);
  const createdPlant = await newPlant({
    ...plant,
  }, userId);

  return { success: true, data: createdPlant };
} 