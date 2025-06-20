import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { notes } from "../postgres-drizzle/schema/note-schema";
import type { NewNote, NoteRepository } from "../../core/repositories/note-repository";
import { Note } from "@/core/domain/note";

const mapNoteFromDB = (noteInDB: typeof notes.$inferSelect): Note => {
  return {
    id: noteInDB.id,
    plantId: noteInDB.plantId,
    text: noteInDB.text,
    photoUrl: noteInDB.photoUrl || undefined,
    createdAt: noteInDB.createdAt,
    updatedAt: noteInDB.updatedAt,
  };
};

export class DrizzleNoteRepository implements NoteRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async findByUserId(userId: string, limit: number = 50): Promise<Note[]> {
    const notesInDB = await this.db.select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt))
      .limit(limit);

    return notesInDB.map(mapNoteFromDB);
  }

  async findByPlantIdAndUserId(plantId: string, userId: string, limit: number = 50): Promise<Note[]> {
    const notesInDB = await this.db.select()
      .from(notes)
      .where(and(
        eq(notes.plantId, plantId),
        eq(notes.userId, userId)
      ))
      .orderBy(desc(notes.createdAt))
      .limit(limit);

    return notesInDB.map(mapNoteFromDB);
  }

  async findByTextAndUserAndPlant(userId: string, plantId: string, searchText: string, limit: number = 50): Promise<Note[]> {
  // Fetch all notes for the plant (assuming small dataset per plant)
    const notesInDB = await this.db.select()
      .from(notes)
      .where(and(
        eq(notes.plantId, plantId),
        eq(notes.userId, userId)
      ))
      .orderBy(desc(notes.createdAt))
      .limit(limit * 2); // Get more to account for filtering

    const allNotes = notesInDB.map(mapNoteFromDB);

    // If no search text, return empty array (since this is specifically for search)
    if (!searchText || !searchText.trim()) {
      return [];
    }

    // Simple client-side filtering - case insensitive partial match
    const filtered = allNotes.filter(note =>
      note.text.toLowerCase().includes(searchText.toLowerCase())
    );

    return filtered.slice(0, limit);
  }

  async create(note: NewNote, userId: string): Promise<Note> {
    const [createdNote] = await this.db.insert(notes)
      .values({
        ...note,
        userId,
        photoUrl: note.photoUrl || null,
      })
      .returning();

    return mapNoteFromDB(createdNote);
  }

  async remove(noteId: string, userId: string): Promise<void> {
    await this.db.delete(notes)
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, userId)
      ));
  }

  async update(noteId: string, userId: string, updates: Partial<Pick<Note, 'text' | 'photoUrl'>>): Promise<Note> {
    const [updatedNote] = await this.db.update(notes)
      .set({
        ...updates,
        photoUrl: updates.photoUrl === undefined ? undefined : updates.photoUrl || null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, userId)
      ))
      .returning();

    if (!updatedNote) {
      throw new Error("Note not found or access denied");
    }

    return mapNoteFromDB(updatedNote);
  }
} 