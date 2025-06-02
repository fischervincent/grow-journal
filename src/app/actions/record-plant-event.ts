"use server";

import { auth } from "@/lib/auth";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { headers } from "next/headers";

export async function recordPlantEvent(plantId: string, eventId: string, eventName: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const repository = getPlantRepository();
  const plant = await repository.findById(plantId, session.user.id);
  if (!plant) {
    throw new Error("Plant not found");
  }

  const lastDateByEvents = {
    ...plant.lastDateByEvents,
    [eventId]: {
      lastDate: new Date(),
      eventName,
    },
  };

  await repository.update(plantId, { lastDateByEvents });
} 