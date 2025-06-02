"use client";

import { useState } from "react";
import { PlantWithId } from "@/core/domain/plant";
import { PlantCard } from "./plant-card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { NewPlantDialog } from "./new-plant-dialog";
import { recordPlantEvent } from "@/app/actions/record-plant-event";
import { PlantEventType } from "@/core/domain/plant-event-type";

export default function PlantList({
  plants: initialPlants,
  quickAccessEvents,
  sortableEventTypes,
}: {
  plants: PlantWithId[];
  quickAccessEvents: PlantEventType[];
  sortableEventTypes: PlantEventType[];
}) {
  const [plants, setPlants] = useState(initialPlants);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getFilteredPlants = () => {
    let filtered = [...plants];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (plant) =>
          plant.name.toLowerCase().includes(query) ||
          plant.species?.toLowerCase().includes(query) ||
          plant.location?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filter === "indoor") {
      filtered = filtered.filter((plant) => plant.location === "indoor");
    } else if (filter === "outdoor") {
      filtered = filtered.filter((plant) => plant.location === "outdoor");
    }

    return filtered;
  };

  const handleEventClick = async (
    plantId: string,
    eventId: string,
    eventName: string
  ) => {
    try {
      await recordPlantEvent(plantId, eventId, eventName);
      // Update the local state to reflect the new event history
      setPlants((prev) =>
        prev.map((plant) =>
          plant.id === plantId
            ? {
                ...plant,
                lastDateByEvents: {
                  ...plant.lastDateByEvents,
                  [eventId]: {
                    lastDate: new Date(),
                    eventName,
                  },
                },
              }
            : plant
        )
      );
    } catch (error) {
      console.error("Failed to record event:", error);
    }
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">My Plants</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Add New Plant</Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search plants..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            className={
              filter === "all"
                ? "bg-green-600 hover:bg-green-700"
                : "border-green-200 text-green-800"
            }
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "indoor" ? "default" : "outline"}
            className={
              filter === "indoor"
                ? "bg-blue-600 hover:bg-blue-700"
                : "border-blue-200 text-blue-800"
            }
            onClick={() => setFilter("indoor")}
          >
            Indoor
          </Button>
          <Button
            variant={filter === "outdoor" ? "default" : "outline"}
            className={
              filter === "outdoor"
                ? "bg-amber-600 hover:bg-amber-700"
                : "border-amber-200 text-amber-800"
            }
            onClick={() => setFilter("outdoor")}
          >
            Outdoor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredPlants().map((plant) => (
          <PlantCard
            key={plant.slug}
            {...plant}
            image="/placeholderPlant.svg"
            quickAccessEvents={quickAccessEvents}
            onEventClick={(eventId) =>
              handleEventClick(
                plant.id,
                eventId,
                quickAccessEvents.find((e) => e.id === eventId)?.name || ""
              )
            }
          />
        ))}
      </div>

      <NewPlantDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPlantCreated={(newPlant: PlantWithId) => {
          setPlants((prev) => [...prev, newPlant]);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
