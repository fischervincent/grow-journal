import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { findPlantsByUserUseCase } from "@/core/use-cases/find-plants-by-user";

export async function findPlantsByUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, errors: ['Unauthorized'] };
  }

  const plantRepository = getPlantRepository();

  const { findPlantsByUser } = findPlantsByUserUseCase(plantRepository);

  const plants = await findPlantsByUser(userId);

  return { success: true, data: plants };
} 