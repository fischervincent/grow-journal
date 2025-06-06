"use server";
import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { headers } from "next/headers";

export async function getAllPlantEventTypes() {
  "use server";
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  const plantEventTypeRepository = getPlantEventTypeRepository();

  const eventTypes = await plantEventTypeRepository.findByUserId(session.user.id);
  return eventTypes;
}
