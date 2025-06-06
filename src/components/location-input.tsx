"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface Location {
  id: string;
  name: string;
}

interface LocationInputProps {
  locations: Location[];
  selectedLocationId?: string;
  onLocationChange: (locationId: string | undefined) => void;
  onAddLocation: (name: string) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function LocationInput({
  locations,
  selectedLocationId,
  onLocationChange,
  onAddLocation,
  onCancel,
  className,
}: LocationInputProps) {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState("");

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;
    await onAddLocation(newLocation.trim());
    setNewLocation("");
    setIsAddingLocation(false);
  };

  if (isAddingLocation) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder="Enter new location"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAddingLocation(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleAddLocation}
          disabled={!newLocation.trim()}
        >
          Add
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select
        value={selectedLocationId || "none"}
        onValueChange={(value) =>
          onLocationChange(value === "none" ? undefined : value)
        }
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No location</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsAddingLocation(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
