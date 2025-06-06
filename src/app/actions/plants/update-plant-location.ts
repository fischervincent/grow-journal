"use server";

import { auth } from "@/lib/auth";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updatePlantLocation(plantId: string, locationId: string | undefined) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  try {
    const plantRepository = getPlantRepository();
    const plant = await plantRepository.update(plantId, session.user.id, {
      locationId,
    });

    revalidatePath(`/plants/${plant.slug}`);

    return {
      success: true,
      plant,
    };
  } catch (error) {
    console.error("Failed to update plant location:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update plant location",
    };
  }
} 