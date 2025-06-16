"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { del } from "@vercel/blob";

interface SubmitPlantPhotoDeletionInput {
  plantId: string;
  photoId: string;
}

export async function submitPlantPhotoDeletion(input: SubmitPlantPhotoDeletionInput): Promise<[{ success: boolean } | null, string | null]> {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantRepository = getPlantRepository();

    // Get the photo URL before deleting from DB
    const photo = await plantRepository.getPhotoById(input.photoId, userId);
    if (!photo) {
      return [null, "Photo not found"] as const;
    }

    // Delete from Vercel Blob storage
    await del(photo.url);

    // Delete from database
    await plantRepository.deletePhoto(input.photoId, userId);

    return [{ success: true }, null] as const;
  } catch (error) {
    console.error("Error deleting photo:", error);
    return [null, error instanceof Error ? error.message : 'Failed to delete photo'] as const;
  }
} 