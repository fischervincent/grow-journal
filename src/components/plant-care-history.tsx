"use client";

import { useState } from "react";
import { PlantEventType } from "@/core/domain/plant-event-type";
import { PlantEventsAsList } from "./plant-events-as-list";
import { PlantEventsAsTimeline } from "./plant-events-as-timeline";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlantCareHistoryProps {
  plantId: string;
  eventTypes: (PlantEventType & { id: string })[];
}

type ViewMode = "list" | "timeline";

export function PlantCareHistory({
  plantId,
  eventTypes,
}: PlantCareHistoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
        >
          <TabsList className="bg-card">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "list" ? (
        <PlantEventsAsList plantId={plantId} eventTypes={eventTypes} />
      ) : (
        <PlantEventsAsTimeline plantId={plantId} eventTypes={eventTypes} />
      )}
    </div>
  );
}
