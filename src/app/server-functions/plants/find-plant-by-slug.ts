'use server'

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";

export async function findPlantBySlug(slug: string) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantRepository = getPlantRepository();
    const plant = await plantRepository.findBySlugAndUserId(slug, userId);

    if (!plant) {
      return [null, 'Plant not found'] as const;
    }

    return [plant, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to find plant'] as const;
  }
} 