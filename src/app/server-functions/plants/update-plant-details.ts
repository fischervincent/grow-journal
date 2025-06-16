"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { revalidatePath } from "next/cache";
import { createNewPlant } from "@/core/domain/plant";

interface SubmitPlantDetailsUpdateInput {
  plantId: string;
  name?: string;
  species?: string;
  locationId?: string;
}

export async function submitPlantDetailsUpdate(input: SubmitPlantDetailsUpdateInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();

    // Validate the input using the domain logic
    if (input.name) {
      const [, domainErrors] = createNewPlant({
        name: input.name,
        species: input.species,
      });

      if (domainErrors) {
        return [null, domainErrors.join(", ")] as const;
      }
    }

    const plantRepository = getPlantRepository();
    const plant = await plantRepository.update(input.plantId, userId, {
      name: input.name,
      species: input.species,
      locationId: input.locationId,
    });

    revalidatePath(`/plants/${plant.slug}`);

    return [plant, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to update plant details'] as const;
  }
} 