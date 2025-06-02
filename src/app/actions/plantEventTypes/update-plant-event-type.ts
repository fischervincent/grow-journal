"use server";

import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { headers } from "next/headers";

export async function updatePlantEventType(
  id: string,
  update: {
    name?: string;
    displayColor?: string;
    trackLastDate?: boolean;
    quickAccessButton?: boolean;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const repository = getPlantEventTypeRepository();
  return repository.update(id, update);
}
