"use client";

import { useState, useEffect } from "react";
import { PlantEventType } from "@/core/domain/plant-event-type";
import { PlantCareHistory } from "./plant-care-history";
import { getAllPlantEventTypes } from "@/app/actions/plantEventTypes/get-all-plant-event-types";

interface PlantCareHistoryContainerProps {
  plantId: string;
}

export function PlantCareHistoryContainer({
  plantId,
}: PlantCareHistoryContainerProps) {
  const [eventTypes, setEventTypes] = useState<
    (PlantEventType & { id: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEventTypes = async () => {
      const plantEventTypes = await getAllPlantEventTypes();
      setEventTypes(plantEventTypes);
      setIsLoading(false);
    };
    loadEventTypes();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }
  if (!eventTypes) {
    return (
      <div className="text-center py-8 text-gray-500">No event types found</div>
    );
  }
  return <PlantCareHistory plantId={plantId} eventTypes={eventTypes} />;
}
