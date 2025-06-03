"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlant } from "@/app/actions/plants/create-plant";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

interface NewPlantDialogProps {
  onPlantCreated: (plantId: string) => void;
}

export function NewPlantDialog({ onPlantCreated }: NewPlantDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    isSpeciesName: true,
    species: "",
    location: "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const [createdPlant, errors] = await createPlant({
      name: formData.name,
      species: formData.isSpeciesName
        ? formData.name
        : formData.species || undefined,
      location: formData.location || undefined,
    });

    if (createdPlant) {
      setOpen(false);
      setFormData({
        name: "",
        isSpeciesName: true,
        species: "",
        location: "",
      });
      router.refresh();
      onPlantCreated(createdPlant.id);
    } else {
      console.error("Failed to create plant:", errors);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Plant</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white fixed sm:top-[20vh] top-4 translate-y-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Add New Plant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="plant-name">Plant Name</Label>
            <Input
              id="plant-name"
              placeholder="Enter plant name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex items-center space-x-2 py-1">
            <Checkbox
              id="is-species-name"
              checked={formData.isSpeciesName}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isSpeciesName: checked === true,
                  species: checked === true ? "" : prev.species,
                }))
              }
            />
            <Label htmlFor="is-species-name">
              This is also the species name
            </Label>
          </div>
          {!formData.isSpeciesName && (
            <div className="space-y-1.5">
              <Label htmlFor="plant-species">Species Name (Optional)</Label>
              <Input
                id="plant-species"
                placeholder="Enter species name"
                value={formData.species}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, species: e.target.value }))
                }
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="plant-location">Location (Optional)</Label>
            <Select
              value={formData.location}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, location: value }))
              }
            >
              <SelectTrigger id="plant-location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="living-room">Living Room</SelectItem>
                <SelectItem value="bedroom">Bedroom</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="bathroom">Bathroom</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="balcony">Balcony</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            Add Plant
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
