'use server'

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function findPlantBySlug(slug: string) {
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

  return { success: true, data: plant };
} 