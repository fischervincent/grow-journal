"use server";

import { getNoteRepository } from "@/lib/repositories/note-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { Note } from "@/core/domain/note";

export async function getPlantNotes(plantId: string): Promise<Note[]> {
  "use server";

  try {
    const userId = await getAuthenticatedUserId();
    const noteRepository = getNoteRepository();

    return await noteRepository.findByPlantIdAndUserId(plantId, userId, 50);
  } catch (error) {
    console.error("Error fetching plant notes:", error);
    return [];
  }
} 