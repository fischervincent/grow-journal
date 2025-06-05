"use server";

import { auth } from "@/lib/auth";
import { getPlantEventRepository } from "@/lib/repositories/plant-event-repository-factory";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function recordPlantEvent(plantId: string, eventId: string, eventDateTime: Date, comment?: string) {
  "use server"
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const plantRepository = getPlantRepository();
  const plant = await plantRepository.findById(plantId, session.user.id);
  if (!plant) {
    throw new Error("Plant not found");
  }
  const eventType = await getPlantEventTypeRepository().findById(eventId, session.user.id);

  const lastDateByEvents = {
    ...plant.lastDateByEvents,
    [eventId]: {
      lastDate: eventDateTime.toISOString(),
      eventName: eventType.name,
    },
  };

  const plantEventRepository = getPlantEventRepository();
  await plantEventRepository.create({
    plantId,
    plantEventTypeId: eventId,
    comment,
    plantEventDateTime: eventDateTime,
  }, session.user.id);
  revalidatePath(`/plants`);
  await plantRepository.update(plantId, session.user.id, { lastDateByEvents });
} 