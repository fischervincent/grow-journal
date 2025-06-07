"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { addLocation } from "@/app/actions/plants/add-location";
import { updateLocation } from "@/app/actions/plants/update-location";
import { deleteLocation } from "@/app/actions/plants/delete-location";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "./ui/confirmation-dialog";

interface Location {
  id: string;
  name: string;
}

interface LocationSettingsContainerProps {
  initialLocations: Location[];
}

interface LocationActionResponse {
  success: boolean;
  location?: Location;
  error?: string;
}

export function LocationSettingsContainer({
  initialLocations,
}: LocationSettingsContainerProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [newLocation, setNewLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState<{
    id: string;
    name: string;
    originalName: string;
  } | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    try {
      const result = (await addLocation(
        newLocation.trim()
      )) as LocationActionResponse;
      if (result.success && result.location) {
        setLocations([...locations, result.location]);
        setNewLocation("");
        toast.success("Location added successfully");
      } else {
        toast.error(result.error || "Failed to add location");
      }
    } catch {
      toast.error("Failed to add location");
    }
  };

  const handleStartEdit = (location: Location) => {
    setEditingLocation({
      id: location.id,
      name: location.name,
      originalName: location.name,
    });
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
  };

  const handleSaveEdit = async () => {
    if (!editingLocation || !editingLocation.name.trim()) return;

    try {
      const result = (await updateLocation(
        editingLocation.id,
        editingLocation.name.trim()
      )) as LocationActionResponse;
      if (result.success && result.location) {
        setLocations(
          locations.map((loc) =>
            loc.id === editingLocation.id ? result.location! : loc
          )
        );
        setEditingLocation(null);
        toast.success("Location updated successfully");
      } else {
        toast.error(result.error || "Failed to update location");
      }
    } catch {
      toast.error("Failed to update location");
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleDeleteLocation = async (id: string) => {
    setIsDeleting(true);
    try {
      const result = (await deleteLocation(id)) as LocationActionResponse;
      if (result.success) {
        setLocations(locations.filter((loc) => loc.id !== id));
        toast.success("Location deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete location");
      }
    } catch {
      toast.error("Failed to delete location");
    } finally {
      setIsDeleting(false);
      setDeletingLocation(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Locations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAddLocation} className="flex gap-2">
          <Input
            placeholder="Add new location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <Button type="submit" disabled={!newLocation.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </form>

        <div className="space-y-2">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              {editingLocation?.id === location.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingLocation.name}
                    onChange={(e) =>
                      setEditingLocation((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    onKeyDown={handleEditKeyDown}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveEdit}
                    disabled={!editingLocation.name.trim()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="truncate flex-1 min-w-0 pr-2">
                    {location.name}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(location)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingLocation(location)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <ConfirmationDialog
          open={!!deletingLocation}
          onOpenChange={(open) => !open && setDeletingLocation(null)}
          title="Delete Location"
          description={
            <>
              Are you sure you want to delete the location{" "}
              <strong>&ldquo;{deletingLocation?.name}&rdquo;</strong>?
              <br />
              This action cannot be undone.
            </>
          }
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() =>
            deletingLocation
              ? handleDeleteLocation(deletingLocation.id)
              : Promise.resolve()
          }
          isLoading={isDeleting}
        />
      </CardContent>
    </Card>
  );
}
