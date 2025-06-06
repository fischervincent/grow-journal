"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { PlantEventType } from "@/core/domain/plant-event-type";
import { PlantEventWithId } from "@/core/domain/plant-event";
import { getPlantEvents } from "@/app/actions/plants/get-plant-events";
import { format } from "date-fns";
import { toast } from "sonner";

interface PlantCareHistoryProps {
  plantId: string;
  eventTypes: (PlantEventType & { id: string })[];
}

const ALL_EVENTS = "all";

export function PlantCareHistory({
  plantId,
  eventTypes,
}: PlantCareHistoryProps) {
  const [selectedEventType, setSelectedEventType] =
    useState<string>(ALL_EVENTS);
  const [plantEvents, setPlantEvents] = useState<PlantEventWithId[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      const { plantEvents, error } = await getPlantEvents(
        plantId,
        selectedEventType === ALL_EVENTS ? undefined : selectedEventType
      );
      if (error) {
        toast.error(error);
      } else {
        setPlantEvents(plantEvents);
      }
      setIsLoadingEvents(false);
    };
    loadEvents();
  }, [plantId, selectedEventType]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Care History</h2>
          <Select
            value={selectedEventType}
            onValueChange={setSelectedEventType}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_EVENTS}>All events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingEvents ? (
          <div className="text-center py-8 text-gray-500">
            Loading events...
          </div>
        ) : plantEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No events recorded yet
          </div>
        ) : (
          <div className="space-y-4">
            {plantEvents.map((plantEvent) => {
              const eventType = eventTypes.find(
                (type) => type.id === plantEvent.plantEventTypeId
              );
              if (!eventType) return null;

              return (
                <div
                  key={plantEvent.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: eventType.displayColor }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{eventType.name}</p>
                    {plantEvent.comment && (
                      <p className="text-sm text-gray-600 mt-1">
                        {plantEvent.comment}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      <Calendar className="inline-block w-4 h-4 mr-1" />
                      {format(new Date(plantEvent.plantEventDateTime), "PPp")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
