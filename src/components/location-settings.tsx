"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Plus, Trash2, Check, X } from "lucide-react";
import { addLocation } from "@/app/actions/plants/add-location";
import { updateLocation } from "@/app/actions/plants/update-location";
import { deleteLocation } from "@/app/actions/plants/delete-location";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Location {
  id: string;
  name: string;
}

interface EditableLocationProps {
  location: Location;
  onLocationUpdated: (updatedLocation: Location) => void;
}

function EditableLocation({
  location,
  onLocationUpdated,
}: EditableLocationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(location.name);

  const handleSubmit = async () => {
    if (!name.trim() || name.trim() === location.name) {
      setIsEditing(false);
      setName(location.name);
      return;
    }

    const result = await updateLocation(location.id, name.trim());
    if (result.success && result.location) {
      onLocationUpdated(result.location);
      setIsEditing(false);
      toast.success("Location updated successfully");
    } else {
      toast.error(result.error || "Failed to update location");
      setName(location.name);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(location.name);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          autoFocus
          className="h-8"
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSubmit}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className="flex-1 cursor-pointer hover:underline"
    >
      {location.name}
    </span>
  );
}

interface LocationSettingsProps {
  locations: Location[];
}

export function LocationSettings({
  locations: initialLocations,
}: LocationSettingsProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [newLocation, setNewLocation] = useState("");
  const router = useRouter();

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    const result = await addLocation(newLocation.trim());
    if (result.success && result.location) {
      setLocations([...locations, result.location]);
      setNewLocation("");
      toast.success("Location added successfully");
    } else {
      toast.error("Failed to add location");
    }
  };

  const handleDeleteLocation = async (id: string) => {
    const result = await deleteLocation(id);
    if (result.success) {
      setLocations(locations.filter((loc) => loc.id !== id));
      toast.success("Location deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete location");
    }
  };

  const handleLocationUpdated = (updatedLocation: Location) => {
    setLocations(
      locations.map((loc) =>
        loc.id === updatedLocation.id ? updatedLocation : loc
      )
    );
  };

  return (
    <div className="container max-w-2xl py-6">
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
                <EditableLocation
                  location={location}
                  onLocationUpdated={handleLocationUpdated}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteLocation(location.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
