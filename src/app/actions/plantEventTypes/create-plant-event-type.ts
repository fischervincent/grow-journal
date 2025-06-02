"use server";

import { createNewPlantEventType } from "@/core/domain/plant-event-type";
import { addNewPlantEventTypeUseCase } from "@/core/use-cases/event-types/add-new-event-type";
import { auth } from "@/lib/auth";
import { getPlantEventTypeRepository } from "@/lib/repositories/plant-event-type-repository-factory";
import { headers } from "next/headers";

export async function createPlantEventType(input: {
  name: string;
  displayColor: string;
  isSortableByDate: boolean;
  hasQuickAccessButton: boolean;
  hasComment: boolean;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  const [newPlantEventType, errors] = createNewPlantEventType(input);
  console.log("err", errors);

  if (errors) {
    throw new Error(errors.join(", ") || "Failed to create plant event");
  }

  const plantEventTypeRepository = getPlantEventTypeRepository();
  const { addNewPlantEventType } = addNewPlantEventTypeUseCase(plantEventTypeRepository);
  const createdPlantEventType = await addNewPlantEventType(newPlantEventType, session.user.id)

  return createdPlantEventType;
} 