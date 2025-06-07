"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { put } from "@vercel/blob";
import { PlantPhoto } from "@/core/domain/plant";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadPlantPhoto(
  formData: FormData
): Promise<{ photo: PlantPhoto | null; error: string | null }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    const userId = session?.user?.id;

    if (!userId) {
      return { photo: null, error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    const plantId = formData.get("plantId") as string;

    if (!file || !plantId) {
      return { photo: null, error: "Missing required fields" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        photo: null,
        error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        photo: null,
        error: `File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`
      };
    }
    const unguessableFileName = `${uuidv4()}.jpg`
    // Upload to Vercel Blob
    const { url } = await put(
      `plants/${userId}/${plantId}/${unguessableFileName}`,
      file,
      { access: 'public' } // not an issue since the file name is not guessable even by brute force
    );

    // Save to database
    const plantRepository = getPlantRepository();

    const takenAt = new Date(file.lastModified);

    const photo = await plantRepository.addPhoto({ plantId, userId, url, takenAt });

    // If this is the first photo, set it as the main photo
    const plant = await plantRepository.findById(plantId, userId);
    if (plant && !plant.mainPhotoUrl) {
      await plantRepository.setMainPhoto(plantId, userId, photo.id);
    }
    revalidatePath(`/plants/${plantId}`)
    return { photo, error: null };
  } catch (error) {
    console.error("Error uploading photo:", error);
    return { photo: null, error: "Failed to upload photo" };
  }
} 