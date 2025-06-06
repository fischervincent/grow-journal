"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { del } from "@vercel/blob";

export async function deletePlantPhoto(
  plantId: string,
  photoId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const plantRepository = getPlantRepository();

    // Get the photo URL before deleting from DB
    const photo = await plantRepository.getPhotoById(photoId, userId);
    if (!photo) {
      return { success: false, error: "Photo not found" };
    }

    // Delete from Vercel Blob storage
    await del(photo.url);

    // Delete from database
    await plantRepository.deletePhoto(photoId, userId);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting photo:", error);
    return { success: false, error: "Failed to delete photo" };
  }
} 