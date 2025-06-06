"use server";

import { auth } from "@/lib/auth";
import { getPlantEventRepository } from "@/lib/repositories/plant-event-repository-factory";
import { headers } from "next/headers";

export async function getPlantEvents(plantId: string, eventTypeId?: string) {
  "use server";
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    const userId = session?.user?.id;
    if (!userId) {
      return { plantEvents: [], error: "Unauthorized" };
    }

    const plantEventRepository = getPlantEventRepository();
    const plantEvents = eventTypeId
      ? await plantEventRepository.findByPlantIdAndType(plantId, eventTypeId, userId)
      : await plantEventRepository.findByPlantId(plantId, userId);

    return { plantEvents, error: null };
  } catch (error) {
    console.error("Error fetching plant events:", error);
    return { plantEvents: [], error: "Failed to fetch plant events" };
  }
} 