"use client";

import { useState, useRef, useEffect } from "react";
import { PlantWithId } from "@/core/domain/plant";
import { PlantCard } from "./plant-card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search } from "lucide-react";
import { NewPlantDialog } from "./new-plant-dialog";
import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { cn } from "@/lib/utils";
import { recordPlantEvent } from "@/app/actions/record-plant-event";

export default function PlantList({
  plants,
  quickAccessEvents,
  sortableEventTypes,
}: {
  plants: PlantWithId[];
  quickAccessEvents: PlantEventTypeWithId[];
  sortableEventTypes: PlantEventTypeWithId[];
}) {
  const [sortedBy, setSortedBy] = useState<PlantEventTypeWithId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const lastCreatedPlantRef = useRef<HTMLDivElement>(null);
  const [newPlantId, setNewPlantId] = useState<string | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

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

    if (sortedBy) {
      filtered = filtered.sort((a, b) => {
        const aDate = a.lastDateByEvents[sortedBy.id]?.lastDate;
        const bDate = b.lastDateByEvents[sortedBy.id]?.lastDate;
        if (aDate && bDate) {
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        }
        if (aDate) {
          return 1;
        }
        if (bDate) {
          return -1;
        }
        return 0;
      });
    }
    return filtered;
  };

  const handlePlantCreated = (plantId: string) => {
    setNewPlantId(plantId);
    setShouldAnimate(false);
  };

  useEffect(() => {
    if (newPlantId) {
      // First scroll instantly to the new plant
      lastCreatedPlantRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Then trigger the animation after a small delay
      const animationTimeout = setTimeout(() => {
        setShouldAnimate(true);
      }, 500);

      // Clear the plant ID and animation state after animation completes
      const cleanupTimeout = setTimeout(() => {
        setNewPlantId(null);
        setShouldAnimate(false);
      }, 2500); // animation duration (2s) + small buffer

      return () => {
        clearTimeout(animationTimeout);
        clearTimeout(cleanupTimeout);
      };
    }
  }, [newPlantId, plants]);

  const toggleSortBy = (eventType: PlantEventTypeWithId) => {
    if (sortedBy?.id === eventType.id) {
      setSortedBy(null);
    } else {
      setSortedBy(eventType);
    }
  };

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
          {sortableEventTypes.map((eventType) => (
            <Button
              key={eventType.id}
              variant={sortedBy?.id === eventType.id ? "default" : "outline"}
              style={{
                ...(sortedBy?.id === eventType.id
                  ? {
                      color: "white",
                      backgroundColor: eventType.displayColor,
                      borderColor: eventType.displayColor,
                    }
                  : {
                      color: eventType.displayColor,
                      borderColor: eventType.displayColor,
                    }),
              }}
              className="border-1"
              onClick={() => toggleSortBy(eventType)}
            >
              <ArrowUpDown className="w-4 h-4" />
              {eventType.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredPlants(plants).map((plant) => (
          <div
            key={plant.slug}
            ref={plant.id === newPlantId ? lastCreatedPlantRef : null}
            className={cn(
              "transition-all duration-2000",
              plant.id === newPlantId && shouldAnimate && "animate-highlight"
            )}
          >
            <PlantCard
              {...plant}
              image="/placeholderPlant.svg"
              quickAccessEvents={quickAccessEvents}
              onEventClick={(plantEventType: PlantEventTypeWithId) => () => {
                recordPlantEvent(plant.id, plantEventType.id, new Date());
                console.log("plant", plant);
                console.log("plantEventType", plantEventType);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
