'use server'

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function addPlantEvent(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, errors: ['Unauthorized'] };
  }

  const plantRepository = getPlantRepository();
  const plant = await plantRepository.findBySlugAndUserId(slug, userId);

  if (!plant) {
    return { success: false, errors: ['Plant not found'] };
  }

  // TODO: Add event somehow ?? and keep in mind that if the event is water
  // we want to update the lastWatered field
  return { success: true, data: plant };
}