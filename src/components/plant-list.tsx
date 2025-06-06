"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { PlantWithId } from "@/core/domain/plant";
import { PlantCard } from "./plant-card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, X } from "lucide-react";
import { NewPlantDialog } from "./new-plant-dialog";
import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { cn } from "@/lib/utils";
import { recordPlantEvent } from "@/app/actions/record-plant-event";
import debounce from "lodash/debounce";
import { useSearchParams } from "next/navigation";

export default function PlantList({
  plants,
  quickAccessEvents,
  sortableEventTypes,
}: {
  plants: PlantWithId[];
  quickAccessEvents: PlantEventTypeWithId[];
  sortableEventTypes: PlantEventTypeWithId[];
}) {
  const searchParams = useSearchParams();
  const searchParamValue = searchParams?.get("search") ?? null;
  const orderByParamValue = searchParams?.get("sortBy") ?? null;
  return (
    <PlantListContent
      plants={plants}
      quickAccessEvents={quickAccessEvents}
      sortableEventTypes={sortableEventTypes}
      searchParamValue={searchParamValue}
      orderByParamValue={orderByParamValue}
    />
  );
}

function PlantListContent({
  plants,
  quickAccessEvents,
  sortableEventTypes,
  searchParamValue,
  orderByParamValue,
}: {
  plants: PlantWithId[];
  quickAccessEvents: PlantEventTypeWithId[];
  sortableEventTypes: PlantEventTypeWithId[];
  searchParamValue: string | null;
  orderByParamValue: string | null;
}) {
  const lastCreatedPlantRef = useRef<HTMLDivElement>(null);
  const [newPlantId, setNewPlantId] = useState<string | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParamValue);
  const initialSortById = orderByParamValue;
  const [activeSortType, setActiveSortType] =
    useState<PlantEventTypeWithId | null>(
      sortableEventTypes.find((type) => type.id === initialSortById) || null
    );

  // Debounced URL update without redirect
  const updateUrl = useMemo(
    () =>
      debounce((search: string | null, sortBy: string | null) => {
        const params = new URLSearchParams(window.location.search);
        if (search) {
          params.set("search", search);
        } else {
          params.delete("search");
        }
        if (sortBy) {
          params.set("sortBy", sortBy);
        } else {
          params.delete("sortBy");
        }

        const queryString = params.toString();
        const newUrl = queryString
          ? `?${queryString}`
          : window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }, 300),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateUrl(value || null, activeSortType?.id ?? null);
  };

  const clearSearch = () => {
    setSearchTerm("");
    updateUrl(null, activeSortType?.id ?? null);
  };

  const handleSortChange = (eventType: PlantEventTypeWithId) => {
    const newSortType = activeSortType?.id === eventType.id ? null : eventType;
    setActiveSortType(newSortType);
    updateUrl(searchTerm || null, newSortType?.id ?? null);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      updateUrl.cancel();
    };
  }, [updateUrl]);

  const filteredAndSortedPlants = useMemo(() => {
    let filtered = [...plants];

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (plant) =>
          plant.name.toLowerCase().includes(query) ||
          plant.species?.toLowerCase().includes(query) ||
          plant.location?.toLowerCase().includes(query)
      );
    }

    if (activeSortType) {
      filtered = filtered.sort((a, b) => {
        const aDate = a.lastDateByEvents[activeSortType.id]?.lastDate;
        const bDate = b.lastDateByEvents[activeSortType.id]?.lastDate;
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
  }, [plants, searchTerm, activeSortType]);

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
  }, [newPlantId]);

  const handleEventClick =
    (plant: PlantWithId) =>
    (plantEventType: PlantEventTypeWithId) =>
    async () => {
      await recordPlantEvent(plant.id, plantEventType.id, new Date());
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
            className="pl-10 pr-10 py-2 w-full border rounded-lg"
            value={searchTerm ?? ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {sortableEventTypes.map((eventType) => (
            <Button
              key={eventType.id}
              variant={
                activeSortType?.id === eventType.id ? "default" : "outline"
              }
              style={{
                ...(activeSortType?.id === eventType.id
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
              onClick={() => handleSortChange(eventType)}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {eventType.name}
              {activeSortType?.id === eventType.id && (
                <X
                  className="h-4 w-4 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSortType(null);
                    updateUrl(searchTerm || null, null);
                  }}
                />
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedPlants.map((plant) => (
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
              onEventClick={handleEventClick(plant)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
