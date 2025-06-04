"use server";

import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function deletePlantEventType(plantEventType: PlantEventTypeWithId) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  if (plantEventType.hasQuickAccessButton) {
    const plantRepository = getPlantRepository();
    await plantRepository.removeEventType(userId, plantEventType.id);
  }

  const plantEventTypeRepository = getPlantEventTypeRepository();
  await plantEventTypeRepository.delete(plantEventType.id, userId);

  revalidatePath("/event-settings");
} 