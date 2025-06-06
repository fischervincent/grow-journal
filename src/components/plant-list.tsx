"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { PlantWithId, PlantWithPhotoAndId } from "@/core/domain/plant";
import { PlantCard } from "./plant-card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, X } from "lucide-react";
import { NewPlantDialog } from "./new-plant-dialog";
import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { recordPlantEvent } from "@/app/actions/record-plant-event";
import debounce from "lodash/debounce";
import { useSearchParams } from "next/navigation";
import autoAnimate from "@formkit/auto-animate";

export default function PlantList({
  plants,
  quickAccessEvents,
  sortableEventTypes,
}: {
  plants: PlantWithPhotoAndId[];
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
  plants: PlantWithPhotoAndId[];
  quickAccessEvents: PlantEventTypeWithId[];
  sortableEventTypes: PlantEventTypeWithId[];
  searchParamValue: string | null;
  orderByParamValue: string | null;
}) {
  const [searchTerm, setSearchTerm] = useState(searchParamValue);
  const [activeSortType, setActiveSortType] =
    useState<PlantEventTypeWithId | null>(
      sortableEventTypes.find((type) => type.id === orderByParamValue) || null
    );
  const [isSorting, setIsSorting] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize auto-animate
  useEffect(() => {
    const parent = parentRef.current;
    if (parent) {
      autoAnimate(parent, {
        duration: 150,
        easing: "ease-in-out",
      });
    }
  }, []);

  // Separate debounced URL update
  const debouncedUpdateUrl = useMemo(
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

  // Update URL whenever states change
  useEffect(() => {
    debouncedUpdateUrl(searchTerm || null, activeSortType?.id ?? null);
  }, [searchTerm, activeSortType, debouncedUpdateUrl]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleSortChange = (eventType: PlantEventTypeWithId) => {
    const newSortType = activeSortType?.id === eventType.id ? null : eventType;
    setActiveSortType(newSortType);
    setIsSorting(true);
    // Use requestAnimationFrame to let the UI update before heavy sorting
    requestAnimationFrame(() => {
      // Add a small delay to ensure the UI has updated
      setTimeout(() => {
        setIsSorting(false);
      }, 50);
    });
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateUrl.cancel();
    };
  }, [debouncedUpdateUrl]);

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
        <NewPlantDialog onPlantCreated={() => {}} />
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm h-fit">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search plants..."
            className="h-10 pl-9 pr-9 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent leading-none"
            value={searchTerm ?? ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              <button
                onClick={clearSearch}
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <div className="overflow-x-auto flex gap-2 pb-2 pr-4 max-w-[calc(100vw-2rem)] sm:max-w-[400px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
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
                className="border-1 whitespace-nowrap flex-shrink-0 transition-transform active:scale-95"
                onClick={() => handleSortChange(eventType)}
              >
                <ArrowUpDown
                  className={`h-4 w-4 mr-2 transition-transform ${
                    isSorting && activeSortType?.id === eventType.id
                      ? "animate-spin"
                      : ""
                  }`}
                />
                {eventType.name}
                {activeSortType?.id === eventType.id && (
                  <X
                    className="h-4 w-4 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSortType(null);
                      setIsSorting(true);
                      requestAnimationFrame(() => {
                        setTimeout(() => {
                          setIsSorting(false);
                        }, 50);
                      });
                    }}
                  />
                )}
              </Button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>

      <div
        ref={parentRef}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-150 ${
          isSorting ? "opacity-50" : ""
        }`}
      >
        {filteredAndSortedPlants.map((plant) => (
          <div key={plant.slug} className="transition-all">
            <PlantCard
              {...plant}
              image={plant.mainPhotoUrl ?? "/placeholderPlant.svg"}
              quickAccessEvents={quickAccessEvents}
              onEventClick={handleEventClick(plant)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
