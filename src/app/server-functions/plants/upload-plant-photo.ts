"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { put } from "@vercel/blob";
import { PlantPhoto } from "@/core/domain/plant";
import { getAuthenticatedUserId } from "../auth-helper";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB (reduced since we're compressing)
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];



export async function submitPlantPhotoUpload(formData: FormData): Promise<[PlantPhoto | null, string | null]> {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();

    const file = formData.get("file") as File;
    const plantId = formData.get("plantId") as string;

    if (!file || !plantId) {
      return [null, "Missing required fields"] as const;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return [null, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`] as const;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return [null, `File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`] as const;
    }

    // Use the correct file extension based on the processed file type
    const fileExtension = file.type === 'image/webp' ? 'webp' :
      file.type === 'image/png' ? 'png' : 'jpg';
    const unguessableFileName = `${uuidv4()}.${fileExtension}`;

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

    revalidatePath(`/plants/${plantId}`);

    return [photo, null] as const;
  } catch (error) {
    console.error("Error uploading photo:", error);
    return [null, error instanceof Error ? error.message : 'Failed to upload photo'] as const;
  }
} 