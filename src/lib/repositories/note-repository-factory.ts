import { db } from "../postgres-drizzle/database";
import { DrizzleNoteRepository } from "./drizzle-note-repository";
import type { NoteRepository } from "../../core/repositories/note-repository";

let repository: NoteRepository | null = null;

export function getNoteRepository(): NoteRepository {
  if (!repository) {
    repository = new DrizzleNoteRepository(db);
  }
  return repository;
} 