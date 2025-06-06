"use server";

import { auth } from "@/lib/auth";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";
import { headers } from "next/headers";

export async function deleteLocation(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  try {
    const locationRepository = getLocationRepository();

    // First verify the location belongs to the user
    const existingLocation = await locationRepository.findById(id);
    if (!existingLocation || existingLocation.userId !== session.user.id) {
      throw new Error("Location not found");
    }

    await locationRepository.delete(id);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete location",
    };
  }
} 