import { z } from "zod";

export type Note = {
  id: string;
  plantId: string;
  text: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NoteWithId = Note;

const NOTE_CREATION_ERRORS = {
  EmptyText: "EmptyText",
  TextTooLong: "TextTooLong",
  UnknownError: "UnknownError",
} as const;
export type NoteCreationError = typeof NOTE_CREATION_ERRORS[keyof typeof NOTE_CREATION_ERRORS];

const MAX_TEXT_LENGTH = 2000;
export const NewNoteSchema = z.object({
  text: z.string()
    .min(1, { message: NOTE_CREATION_ERRORS.EmptyText })
    .max(MAX_TEXT_LENGTH, { message: NOTE_CREATION_ERRORS.TextTooLong }),
  photoUrl: z.string().url().optional(),
});

export type CreateNewNoteResult = [Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, undefined] | [null, NoteCreationError[]];

export const createNewNote = (newNoteInput: {
  plantId: string;
  text: string;
  photoUrl?: string;
}): CreateNewNoteResult => {
  const parseResult = NewNoteSchema.safeParse(newNoteInput);
  if (!parseResult.success) {
    const errors: NoteCreationError[] = [];

    for (const err of parseResult.error.errors) {
      const message = err.message as NoteCreationError;
      if (Object.values(NOTE_CREATION_ERRORS).includes(message)) {
        errors.push(message);
      } else {
        console.error("Unknown error at domain New Note Creation", err.message);
        errors.push(NOTE_CREATION_ERRORS.UnknownError);
      }
    }
    return [null, errors];
  }

  return [
    {
      plantId: newNoteInput.plantId,
      text: parseResult.data.text,
      photoUrl: parseResult.data.photoUrl,
    },
    undefined,
  ];
}; 