"use server";

import { auth } from "@/lib/auth";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";
import { headers } from "next/headers";

export async function addLocation(name: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  try {
    const locationRepository = getLocationRepository();
    const location = await locationRepository.create({
      name,
      userId: session.user.id,
    });

    return {
      success: true,
      location: {
        id: location.id,
        name: location.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create location",
    };
  }
} 