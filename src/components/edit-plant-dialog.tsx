"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { updatePlantDetails } from "@/app/actions/plants/update-plant-details";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LocationInput } from "./location-input";
import { addLocation } from "@/app/actions/plants/add-location";

interface EditPlantDialogProps {
  plantId: string;
  currentName: string;
  currentSpecies?: string;
  currentLocationId?: string;
  plantSlug?: string;
  locations: Array<{ id: string; name: string }>;
}

export function EditPlantDialog({
  plantId,
  currentName,
  currentSpecies,
  currentLocationId,
  locations,
  plantSlug,
}: EditPlantDialogProps) {
  console.log("currentLocationId", currentLocationId);
  console.log("locations", locations);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: currentName,
    species: currentSpecies || "",
    locationId: currentLocationId || "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Plant name is required");
      return;
    }

    try {
      const result = await updatePlantDetails(plantId, {
        name: formData.name.trim(),
        species: formData.species.trim() || undefined,
        locationId: formData.locationId || undefined,
      });

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update plant details");
      }
    } catch (error) {
      console.error("Error updating plant:", error);
      toast.error("Failed to update plant");
    }
  };

  const handleLocationChange = (locationId: string | undefined) => {
    setFormData((prev) => ({ ...prev, locationId: locationId || "" }));
  };

  const handleAddNewLocation = async (name: string) => {
    const result = await addLocation(name, plantSlug);
    if (result.success && result.location) {
      setFormData((prev) => ({ ...prev, locationId: result.location.id }));
      return;
    }
    return;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Plant Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="plant-name">Plant Name</Label>
            <Input
              id="plant-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter plant name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plant-species">Species (Optional)</Label>
            <Input
              id="plant-species"
              value={formData.species}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, species: e.target.value }))
              }
              placeholder="Enter species name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plant-location">Location (Optional)</Label>
            <LocationInput
              locations={locations}
              selectedLocationId={formData.locationId}
              onLocationChange={handleLocationChange}
              onAddLocation={handleAddNewLocation}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
