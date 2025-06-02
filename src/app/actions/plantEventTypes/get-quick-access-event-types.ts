import { getQuickAccessEventTypesByUserUseCase } from "@/core/use-cases/event-types/get-quick-access-event-types";
import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { headers } from "next/headers";

export async function getQuickAccessEventTypes() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  const plantEventTypeRepository = getPlantEventTypeRepository();

  const { getQuickAccessEventTypesByUser } = getQuickAccessEventTypesByUserUseCase(plantEventTypeRepository);
  const eventTypes = await getQuickAccessEventTypesByUser(session.user.id);
  return eventTypes;
}
