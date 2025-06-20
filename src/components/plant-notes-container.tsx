"use client";

import { Note } from "@/core/domain/note";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonWithConfirmation } from "@/components/ui/button-with-confirmation";
import { SearchInput } from "@/components/ui/search-input";
import {
  Camera,
  FileText,
  Trash2,
  Edit3,
  Plus,
  X,
  Check,
  Search,
} from "lucide-react";
import Image from "next/image";
import { useState, useOptimistic, useTransition } from "react";
import { submitCreateNote } from "@/app/server-functions/notes/create-note";
import { submitUpdateNote } from "@/app/server-functions/notes/update-note";
import { submitDeleteNote } from "@/app/server-functions/notes/delete-note";
import { submitNotePhotoUpload } from "@/app/server-functions/notes/upload-note-photo";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

interface PlantNotesContainerProps {
  plantId: string;
  initialNotes: Note[];
}

type OptimisticAction =
  | { type: "add"; note: Note }
  | {
      type: "update";
      noteId: string;
      updates: Partial<Pick<Note, "text" | "photoUrl">>;
    }
  | { type: "delete"; noteId: string };

export function PlantNotesContainer({
  plantId,
  initialNotes,
}: PlantNotesContainerProps) {
  const [notes, setOptimisticNotes] = useOptimistic<Note[], OptimisticAction>(
    initialNotes,
    (state, action) => {
      switch (action.type) {
        case "add":
          return [action.note, ...state];
        case "update":
          return state.map((note) =>
            note.id === action.noteId
              ? { ...note, ...action.updates, updatedAt: new Date() }
              : note
          );
        case "delete":
          return state.filter((note) => note.id !== action.noteId);
        default:
          return state;
      }
    }
  );

  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNotePhoto, setNewNotePhoto] = useState<File | null>(null);
  const [editText, setEditText] = useState("");
  const [searchText, setSearchText] = useState("");

  const handleCreateNote = async () => {
    if (!newNoteText.trim()) {
      toast.error("Please enter some text for the note");
      return;
    }

    let photoUrl: string | undefined;

    // Handle photo upload if present
    if (newNotePhoto) {
      try {
        const compressionOptions = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 400,
          useWebWorker: true,
          fileType: "image/jpeg" as const,
          initialQuality: 0.8,
        };

        const compressedFile = await imageCompression(
          newNotePhoto,
          compressionOptions
        );

        // Upload the photo
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("plantId", plantId);

        const [uploadedUrl, uploadError] = await submitNotePhotoUpload(
          formData
        );

        if (uploadError || !uploadedUrl) {
          toast.error(uploadError || "Failed to upload photo");
          return;
        }

        photoUrl = uploadedUrl;
      } catch (error) {
        console.error("Image compression failed:", error);
        toast.error("Failed to process image. Please try again.");
        return;
      }
    }

    const optimisticNote: Note = {
      id: `temp-${Date.now()}`,
      plantId,
      text: newNoteText,
      photoUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setOptimisticNotes({ type: "add", note: optimisticNote });
    setNewNoteText("");
    setNewNotePhoto(null);
    setIsCreating(false);

    startTransition(async () => {
      const [note, error] = await submitCreateNote({
        plantId,
        text: newNoteText,
        photoUrl,
      });

      if (error) {
        toast.error(error);
        // Revert optimistic update on error
        setOptimisticNotes({ type: "delete", noteId: optimisticNote.id });
      } else if (note) {
        toast.success("Note created successfully!");
      }
    });
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editText.trim()) return;

    setOptimisticNotes({
      type: "update",
      noteId,
      updates: { text: editText },
    });
    setEditingId(null);
    setEditText("");

    startTransition(async () => {
      const [note, error] = await submitUpdateNote({
        noteId,
        text: editText,
        plantId,
      });

      if (error) {
        toast.error(error);
      } else if (note) {
        toast.success("Note updated successfully!");
      }
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    setOptimisticNotes({ type: "delete", noteId });

    startTransition(async () => {
      const [success, error] = await submitDeleteNote({
        noteId,
        plantId,
      });

      if (error) {
        toast.error(error);
      } else if (success) {
        toast.success("Note deleted successfully!");
      }
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewNotePhoto(file);
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  // Filter notes based on search text
  const filteredNotes = searchText.trim()
    ? notes.filter((note) =>
        note.text.toLowerCase().includes(searchText.toLowerCase())
      )
    : notes;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notes</h2>
          <Button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>
        {notes.length > 0 && (
          <SearchInput
            value={searchText}
            onChange={setSearchText}
            placeholder="Search notes..."
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new note form */}
        {isCreating && (
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-note-text">Note</Label>
                <Textarea
                  id="new-note-text"
                  placeholder="Add your note here..."
                  value={newNoteText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewNoteText(e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-note-photo">Photo (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="new-note-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="new-note-photo"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {newNotePhoto ? "Photo Selected" : "Select Photo"}
                  </Label>
                  {newNotePhoto && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewNotePhoto(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleCreateNote}
                  disabled={isPending || !newNoteText.trim()}
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Note
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setNewNoteText("");
                    setNewNotePhoto(null);
                  }}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">
              Add your first note to track observations about this plant
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notes match your search</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="bg-background">
                <CardContent className="p-4">
                  {editingId === note.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <Textarea
                        value={editText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditText(e.target.value)
                        }
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={isPending || !editText.trim()}
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={cancelEditing}
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm leading-relaxed flex-1">
                          {note.text}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(note)}
                            className="h-8 w-8"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <ButtonWithConfirmation
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onConfirm={() => handleDeleteNote(note.id)}
                            dialogTitle="Delete Note"
                            dialogDescription="Are you sure you want to delete this note? This action cannot be undone."
                            confirmText="Delete"
                            longPressEnabled={false}
                          >
                            <Trash2 className="h-4 w-4" />
                          </ButtonWithConfirmation>
                        </div>
                      </div>

                      {note.photoUrl && (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                          <Image
                            src={note.photoUrl}
                            alt="Note photo"
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>
                          Created{" "}
                          {new Date(note.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {note.updatedAt &&
                          note.updatedAt !== note.createdAt && (
                            <span>
                              Updated{" "}
                              {new Date(note.updatedAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
