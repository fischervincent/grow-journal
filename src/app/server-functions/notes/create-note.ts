"use server";

import { getNoteRepository } from "@/lib/repositories/note-repository-factory";
import { createNewNote } from "@/core/domain/note";
import { getAuthenticatedUserId } from "../auth-helper";
import { Note } from "@/core/domain/note";
import { revalidatePath } from "next/cache";

interface CreateNoteInput {
  plantId: string;
  text: string;
  photoUrl?: string;
}

export async function submitCreateNote(input: CreateNoteInput): Promise<[Note | null, string | null]> {
  "use server";

  try {
    const userId = await getAuthenticatedUserId();

    const [note, domainErrors] = createNewNote({
      plantId: input.plantId,
      text: input.text,
      photoUrl: input.photoUrl,
    });

    if (domainErrors) {
      return [null, domainErrors.join(", ")] as const;
    }

    const noteRepository = getNoteRepository();
    const createdNote = await noteRepository.create(note, userId);

    revalidatePath(`/plants/${input.plantId}`);

    return [createdNote, null] as const;
  } catch (error) {
    console.error("Error creating note:", error);
    return [null, error instanceof Error ? error.message : 'Failed to create note'] as const;
  }
} 