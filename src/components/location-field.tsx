"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil } from "lucide-react";
import { getLocations } from "@/app/actions/plants/get-locations";
import { addLocation } from "@/app/actions/plants/add-location";
import { toast } from "sonner";
import { LocationInput } from "./location-input";

interface Location {
  id: string;
  name: string;
}

interface LocationFieldProps {
  locationId?: string;
  locationName?: string;
  onLocationChange: (locationId: string | undefined) => void;
  className?: string;
}

export function LocationField({
  locationId,
  locationName,
  onLocationChange,
  className,
}: LocationFieldProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationsList = await getLocations();
        setLocations(locationsList);
      } catch {
        toast.error("Failed to load locations");
      } finally {
        setIsLoading(false);
      }
    };
    loadLocations();
  }, []);

  const handleAddLocation = async (name: string) => {
    const result = await addLocation(name);
    if (result.success && result.location) {
      setLocations([...locations, result.location]);
      onLocationChange(result.location.id);
      toast.success("Location added successfully");
    } else {
      toast.error("Failed to add location");
    }
  };

  if (isLoading && isEditing) {
    return (
      <div
        className={`flex items-center gap-2 text-muted-foreground animate-pulse ${className}`}
      >
        <MapPin className="h-4 w-4" />
        <span>Loading locations...</span>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {locationName ?? "No location set"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2 items-center">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <LocationInput
          locations={locations}
          selectedLocationId={locationId}
          onLocationChange={(id) => {
            onLocationChange(id);
            setIsEditing(false);
          }}
          onAddLocation={handleAddLocation}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    </div>
  );
}
