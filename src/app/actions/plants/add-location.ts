"use server";

import { auth } from "@/lib/auth";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function addLocation(name: string, plantSlug?: string) {
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

    if (plantSlug) {
      revalidatePath(`/plants/${plantSlug}`);
    } else {
      revalidatePath("/plants");
    }

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