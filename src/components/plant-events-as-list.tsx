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
import { PlantEventTypeWithId } from "@/core/domain/plant-event-type";
import { getPlantEvents } from "@/app/actions/plants/get-plant-events";
import { PlantEventWithId } from "@/core/domain/plant-event";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deletePlantEvent } from "@/app/actions/plants/delete-plant-event";
import { ButtonWithConfirmation } from "./ui/button-with-confirmation";

interface PlantEventsAsListProps {
  plantId: string;
  eventTypes: PlantEventTypeWithId[];
}

const ALL_EVENTS = "all";

export function PlantEventsAsList({
  plantId,
  eventTypes,
}: PlantEventsAsListProps) {
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

  const handleDeleteEvent = async (eventId: string) => {
    const { success, error } = await deletePlantEvent(eventId);
    if (error) {
      toast.error(error);
      return;
    }

    if (success) {
      setPlantEvents(plantEvents.filter((e) => e.id !== eventId));
      toast.success("Event deleted successfully");
    }
  };

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
                  className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  style={{
                    borderLeft: `3px solid ${eventType.displayColor}`,
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div>
                    <div
                      className="font-medium"
                      style={{ color: eventType.displayColor }}
                    >
                      {eventType.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      <Calendar className="inline-block w-4 h-4 mr-1" />
                      {format(new Date(plantEvent.plantEventDateTime), "PPp")}
                    </div>
                    {plantEvent.comment && (
                      <div className="mt-2 text-sm">{plantEvent.comment}</div>
                    )}
                  </div>
                  <ButtonWithConfirmation
                    variant="ghost"
                    size="icon"
                    onConfirm={() => handleDeleteEvent(plantEvent.id)}
                    dialogTitle="Delete Event"
                    dialogDescription={`Are you sure you want to delete this ${eventType.name.toLowerCase()} event? This action cannot be undone.`}
                    confirmText="Delete"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    longPressEnabled={false}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ButtonWithConfirmation>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
