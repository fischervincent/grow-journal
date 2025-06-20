import { Note } from "../domain/note";

export type NewNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

export interface NoteRepository {
  findByUserId(userId: string, limit?: number): Promise<Note[]>;
  findByPlantIdAndUserId(plantId: string, userId: string, limit?: number): Promise<Note[]>;
  findByTextAndUserAndPlant(userId: string, plantId: string, searchText: string, limit?: number): Promise<Note[]>;
  create(note: NewNote, userId: string): Promise<Note>;
  remove(noteId: string, userId: string): Promise<void>;
  update(noteId: string, userId: string, updates: Partial<Pick<Note, 'text' | 'photoUrl'>>): Promise<Note>;
} 