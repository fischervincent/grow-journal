"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getLocationRepository } from "@/lib/repositories/location-repository-factory";
import { revalidatePath } from "next/cache";

interface SubmitNewLocationInput {
  name: string;
  plantSlug?: string;
}

export async function submitNewLocation(input: SubmitNewLocationInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const locationRepository = getLocationRepository();

    const location = await locationRepository.create({
      name: input.name,
      userId: userId,
    });

    if (input.plantSlug) {
      revalidatePath(`/plants/${input.plantSlug}`);
    } else {
      revalidatePath("/plants");
    }

    return [{
      id: location.id,
      name: location.name,
    }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to create location'] as const;
  }
} 