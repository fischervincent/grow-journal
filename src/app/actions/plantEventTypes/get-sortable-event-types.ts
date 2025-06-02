import { getSortableEventTypesByUserUseCase } from "@/core/use-cases/event-types/get-sortable-event-types";
import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { headers } from "next/headers";

export async function getSortableEventTypesByUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  const plantEventTypeRepository = getPlantEventTypeRepository();

  const { getSortableEventTypesByUser } = getSortableEventTypesByUserUseCase(plantEventTypeRepository);
  const eventTypes = await getSortableEventTypesByUser(session.user.id);
  return eventTypes;
} 