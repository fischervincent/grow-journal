"use server";

import { getNoteRepository } from "@/lib/repositories/note-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { Note } from "@/core/domain/note";

export async function searchNotes(plantId: string, searchText: string): Promise<Note[]> {
  "use server";

  try {
    const userId = await getAuthenticatedUserId();
    const noteRepository = getNoteRepository();

    return await noteRepository.findByTextAndUserAndPlant(userId, plantId, searchText, 50);
  } catch (error) {
    console.error("Error searching notes:", error);
    return [];
  }
} 