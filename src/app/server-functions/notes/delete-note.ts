"use server";

import { getNoteRepository } from "@/lib/repositories/note-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { revalidatePath } from "next/cache";

interface DeleteNoteInput {
  noteId: string;
  plantId: string; // for revalidation
}

export async function submitDeleteNote(input: DeleteNoteInput): Promise<[boolean, string | null]> {
  "use server";

  try {
    const userId = await getAuthenticatedUserId();

    const noteRepository = getNoteRepository();
    await noteRepository.remove(input.noteId, userId);

    revalidatePath(`/plants/${input.plantId}`);

    return [true, null] as const;
  } catch (error) {
    console.error("Error deleting note:", error);
    return [false, error instanceof Error ? error.message : 'Failed to delete note'] as const;
  }
} 