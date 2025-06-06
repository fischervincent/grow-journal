"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { PlantPhoto } from "@/core/domain/plant";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getPlantPhotos(
  plantId: string
): Promise<{ photos: PlantPhoto[]; error: string | null }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    const userId = session?.user?.id;
    if (!userId) {
      return { photos: [], error: "Unauthorized" };
    }

    const plantRepository = getPlantRepository();
    const photos = await plantRepository.getPhotos(plantId, userId);

    return { photos, error: null };
  } catch (error) {
    console.error("Error getting photos:", error);
    return { photos: [], error: "Failed to get photos" };
  }
} 