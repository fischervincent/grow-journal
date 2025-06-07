"use server";

import { auth } from "@/lib/auth";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNewPlant } from "@/core/domain/plant";

export async function updatePlantDetails(
  plantId: string,
  update: {
    name?: string;
    species?: string;
    locationId?: string;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  try {
    // Validate the input using the domain logic
    if (update.name) {
      const [, errors] = createNewPlant({
        name: update.name,
        species: update.species,
      });

      if (errors) {
        return {
          success: false,
          error: errors.join(", "),
        };
      }
    }

    const plantRepository = getPlantRepository();
    const plant = await plantRepository.update(plantId, session.user.id, update);

    revalidatePath(`/plants/${plant.slug}`);

    return {
      success: true,
      plant,
    };
  } catch (error) {
    console.error("Failed to update plant details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update plant details",
    };
  }
} 