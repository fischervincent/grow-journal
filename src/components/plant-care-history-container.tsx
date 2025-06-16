"use client";

import { useState, useEffect } from "react";
import { PlantEventType } from "@/core/domain/plant-event-type";
import { PlantCareHistory } from "./plant-care-history";
import { getAllPlantEventTypes } from "@/app/server-functions/plantEventTypes/get-all-plant-event-types";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitPlantEvent } from "@/app/server-functions/record-plant-event";
import { toast } from "sonner";

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
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [comment, setComment] = useState("");
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const loadEventTypes = async () => {
      const [plantEventTypes, error] = await getAllPlantEventTypes();
      if (!error) {
        setEventTypes([...plantEventTypes]);
      }
      setIsLoading(false);
    };
    loadEventTypes();
  }, []);

  const handleAddEvent = async () => {
    if (!selectedEventType) return;

    const eventType = eventTypes.find((type) => type.id === selectedEventType);
    if (!eventType) return;

    try {
      // Only pass comment if the event type allows comments and we have a comment
      const commentToSend =
        eventType.hasComment && comment ? comment : undefined;

      const [, error] = await submitPlantEvent({
        plantId,
        eventId: selectedEventType,
        eventDateTime: new Date(),
        comment: commentToSend,
      });
      if (error) {
        toast.error(error || "Failed to record event");
        return;
      }
      toast.success("Event recorded");
      setSelectedEventType("");
      setComment("");
      setUpdateCount((c) => c + 1); // Trigger re-render to refresh history. I know...
    } catch {
      toast.error("Failed to record event");
    }
  };

  const selectedEventTypeDetails = selectedEventType
    ? eventTypes.find((type) => type.id === selectedEventType)
    : null;

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!eventTypes) {
    return (
      <div className="text-center py-8 text-gray-500">No event types found</div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-2">
          <h3 className="font-medium">Add Care Event</h3>
          <div className="flex gap-2">
            <Select
              value={selectedEventType}
              onValueChange={setSelectedEventType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEventTypeDetails?.hasComment && (
              <Input
                placeholder="Notes (e.g., 'Fully watered', 'Half strength fertilizer')"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1"
              />
            )}
            <Button
              onClick={handleAddEvent}
              disabled={!selectedEventType}
              className="bg-green-600 hover:bg-green-700"
            >
              Add
            </Button>
          </div>
        </div>
      </Card>

      <PlantCareHistory
        plantId={plantId}
        eventTypes={eventTypes}
        updateCount={updateCount}
      />
    </div>
  );
}
