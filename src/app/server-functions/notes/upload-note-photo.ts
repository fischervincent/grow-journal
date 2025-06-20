"use server";

import { put } from "@vercel/blob";
import { getAuthenticatedUserId } from "../auth-helper";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB for note photos
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function submitNotePhotoUpload(formData: FormData): Promise<[string | null, string | null]> {
  "use server";

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
      `notes/${userId}/${plantId}/${unguessableFileName}`,
      file,
      { access: 'public' }
    );

    return [url, null] as const;
  } catch (error) {
    console.error("Error uploading note photo:", error);
    return [null, error instanceof Error ? error.message : 'Failed to upload photo'] as const;
  }
} 