"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { PlantWithId } from "@/core/domain/plant";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function setMainPhoto(
  plantId: string,
  photoId: string
): Promise<{ plant: PlantWithId | null; error: string | null }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    const userId = session?.user?.id;
    if (!userId) {
      return { plant: null, error: "Unauthorized" };
    }

    const plantRepository = getPlantRepository();
    const plant = await plantRepository.setMainPhoto(plantId, userId, photoId);

    return { plant, error: null };
  } catch (error) {
    console.error("Error setting main photo:", error);
    return { plant: null, error: "Failed to set main photo" };
  }
} 