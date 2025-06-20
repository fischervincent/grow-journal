"use server";

import { getNoteRepository } from "@/lib/repositories/note-repository-factory";
import { getAuthenticatedUserId } from "../auth-helper";
import { Note } from "@/core/domain/note";
import { revalidatePath } from "next/cache";

interface UpdateNoteInput {
  noteId: string;
  text?: string;
  photoUrl?: string;
  plantId: string; // for revalidation
}

export async function submitUpdateNote(input: UpdateNoteInput): Promise<[Note | null, string | null]> {
  "use server";

  try {
    const userId = await getAuthenticatedUserId();

    if (!input.text && input.photoUrl === undefined) {
      return [null, "No updates provided"] as const;
    }

    const noteRepository = getNoteRepository();
    const updates: Partial<Pick<Note, 'text' | 'photoUrl'>> = {};

    if (input.text !== undefined) {
      updates.text = input.text;
    }
    if (input.photoUrl !== undefined) {
      updates.photoUrl = input.photoUrl;
    }

    const updatedNote = await noteRepository.update(input.noteId, userId, updates);

    revalidatePath(`/plants/${input.plantId}`);

    return [updatedNote, null] as const;
  } catch (error) {
    console.error("Error updating note:", error);
    return [null, error instanceof Error ? error.message : 'Failed to update note'] as const;
  }
} 