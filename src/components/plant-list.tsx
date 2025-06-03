"use client";

import { useState, useRef, useEffect } from "react";
import { PlantWithId } from "@/core/domain/plant";
import { PlantCard } from "./plant-card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { NewPlantDialog } from "./new-plant-dialog";
import { PlantEventType } from "@/core/domain/plant-event-type";

export default function PlantList({
  plants,
  quickAccessEvents,
}: {
  plants: PlantWithId[];
  quickAccessEvents: PlantEventType[];
}) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const lastCreatedPlantRef = useRef<HTMLDivElement>(null);
  const [newPlantId, setNewPlantId] = useState<string | null>(null);

  const getFilteredPlants = (plants: PlantWithId[]) => {
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

  const handlePlantCreated = (plantId: string) => {
    setNewPlantId(plantId);
  };

  useEffect(() => {
    lastCreatedPlantRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [plants]);

  return (
    <div className="container px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800">My Plants</h1>
        <NewPlantDialog onPlantCreated={handlePlantCreated} />
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
        {getFilteredPlants(plants).map((plant) => (
          <div
            key={plant.slug}
            ref={plant.id === newPlantId ? lastCreatedPlantRef : null}
          >
            <PlantCard
              {...plant}
              image="/placeholderPlant.svg"
              quickAccessEvents={quickAccessEvents}
              onEventClick={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
