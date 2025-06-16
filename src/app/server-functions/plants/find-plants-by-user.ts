import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { findPlantsByUserUseCase } from "@/core/use-cases/find-plants-by-user";

export async function findPlantsByUser() {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const plantRepository = getPlantRepository();
    const { findPlantsByUser } = findPlantsByUserUseCase(plantRepository);
    const plants = await findPlantsByUser(userId);

    return [plants, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to find plants'] as const;
  }
} 