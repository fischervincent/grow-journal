"use server";

import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function deletePlant(plantId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const plantRepository = getPlantRepository();
  await plantRepository.delete(plantId, userId);
}
