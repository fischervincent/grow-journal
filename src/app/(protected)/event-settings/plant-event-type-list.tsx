"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  PlantEventType,
  PlantEventTypeWithId,
} from "@/core/domain/plant-event-type";
import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { submitPlantEventType } from "../../server-functions/plantEventTypes/create-plant-event-type";
import { toast } from "sonner";
import { submitPlantEventTypeUpdate } from "@/app/server-functions/plantEventTypes/update-plant-event-type";
import { submitPlantEventTypeDeletion } from "@/app/server-functions/plantEventTypes/delete-plant-event-type";

// Predefined color options
const colorOptions = [
  { name: "Blue", value: "#2196f3" },
  { name: "Green", value: "#4caf50" },
  { name: "Light Green", value: "#8bc34a" },
  { name: "Yellow", value: "#ffeb3b" },
  { name: "Orange", value: "#ff9800" },
  { name: "Red", value: "#f44336" },
  { name: "Pink", value: "#e91e63" },
  { name: "Purple", value: "#9c27b0" },
  { name: "Deep Purple", value: "#673ab7" },
  { name: "Indigo", value: "#3f51b5" },
  { name: "Light Blue", value: "#03a9f4" },
  { name: "Cyan", value: "#00bcd4" },
  { name: "Teal", value: "#009688" },
  { name: "Brown", value: "#795548" },
  { name: "Grey", value: "#9e9e9e" },
];

interface EventTypeFormProps {
  eventType: PlantEventType;
  onSave: (updates: Partial<PlantEventType>) => void;
  onCancel: () => void;
}

interface PlantEventTypeListProps {
  fetchedEventTypes: PlantEventTypeWithId[];
}

interface DeletedEventFeedbackProps {
  eventName: string;
  onClose: () => void;
}

function DeletedEventFeedback({
  eventName,
  onClose,
}: DeletedEventFeedbackProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <Check className="h-4 w-4 text-green-600 animate-[appear_0.3s_ease-out]" />
            </div>
            <p>
              <span className="font-medium">{eventName}</span> has been deleted
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type ListItem =
  | { type: "event"; data: PlantEventTypeWithId; position: number }
  | {
      type: "deleted";
      data: { id: string; name: string; position: number };
      position: number;
    };

export const PlantEventTypeList = ({
  fetchedEventTypes,
}: PlantEventTypeListProps) => {
  const [eventTypes, setEventTypes] =
    useState<PlantEventTypeWithId[]>(fetchedEventTypes);
  const [deletedEvents, setDeletedEvents] = useState<
    { id: string; name: string; position: number }[]
  >([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEventType, setNewEventType] = useState<
    Omit<PlantEventTypeWithId, "id">
  >({
    name: "",
    displayColor: "#4caf50",
    isSortableByDate: true,
    hasQuickAccessButton: false,
    hasComment: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Handle adding a new event type
  const handleAddEventType = async () => {
    if (!newEventType.name.trim()) return;

    const [newEventTypeStored] = await submitPlantEventType(newEventType);
    if (!newEventTypeStored) {
      // TODO: handle errors in form
      toast.error("Failed to create event type");
      return;
    }

    setEventTypes([...eventTypes, newEventTypeStored]);

    setNewEventType({
      name: "",
      displayColor: "#4caf50",
      isSortableByDate: true,
      hasQuickAccessButton: false,
      hasComment: false,
    });

    setIsAddingNew(false);
  };

  // Handle updating an event type
  const handleUpdateEventType = async (
    id: string,
    updates: Partial<PlantEventTypeWithId>
  ) => {
    await submitPlantEventTypeUpdate({ id, ...updates });
    setEventTypes(
      eventTypes.map((eventType) =>
        eventType.id === id ? { ...eventType, ...updates } : eventType
      )
    );
  };

  // Handle deleting an event type
  const handleDeleteEventType = async (
    eventTypeToDelete: PlantEventTypeWithId
  ) => {
    const position = eventTypes.findIndex(
      (et) => et.id === eventTypeToDelete.id
    );
    await submitPlantEventTypeDeletion({ plantEventType: eventTypeToDelete });
    setEventTypes(
      eventTypes.filter((eventType) => eventType.id !== eventTypeToDelete.id)
    );
    setDeletedEvents([
      ...deletedEvents,
      { id: eventTypeToDelete.id, name: eventTypeToDelete.name, position },
    ]);
  };

  const handleRemoveDeleteFeedback = (id: string) => {
    setDeletedEvents(deletedEvents.filter((event) => event.id !== id));
  };

  // Combine event types and deletion feedback in correct order
  const renderEventsList = () => {
    const allItems: ListItem[] = eventTypes.map((et, index) => ({
      type: "event" as const,
      data: et,
      position: index,
    }));

    deletedEvents.forEach((de) => {
      allItems.splice(de.position, 0, {
        type: "deleted" as const,
        data: de,
        position: de.position,
      });
    });

    return allItems.map((item) => {
      if (item.type === "deleted") {
        return (
          <DeletedEventFeedback
            key={`deleted-${item.data.id}`}
            eventName={item.data.name}
            onClose={() => handleRemoveDeleteFeedback(item.data.id)}
          />
        );
      }

      const eventType = item.data;
      return (
        <Card key={eventType.id} className="overflow-hidden">
          <CardContent className="p-0">
            {editingId === eventType.id ? (
              <EventTypeForm
                eventType={eventType}
                onSave={(updates) => {
                  handleUpdateEventType(eventType.id, updates);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center p-4">
                <div
                  className="w-6 h-6 rounded-full mr-3 flex-shrink-0"
                  style={{ backgroundColor: eventType.displayColor }}
                />
                <div className="flex-grow">
                  <h3 className="font-medium">{eventType.name}</h3>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    {eventType.isSortableByDate && (
                      <span>Sort plants by last event</span>
                    )}
                    {eventType.hasQuickAccessButton && (
                      <span>Quick access</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(eventType.id)}
                    className="text-muted-foreground"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEventType(eventType)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <>
      <ScrollArea className="flex-1 px-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto py-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Event Types</h2>
            <p className="text-muted-foreground mb-4">
              Customize the types of events you want to track for your plants.
            </p>

            {/* List of event types and deletion feedback */}
            <div className="space-y-3 mb-6">{renderEventsList()}</div>

            {/* Add new event type */}
            {isAddingNew ? (
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Add New Event Type</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-name">Name</Label>
                      <Input
                        id="new-name"
                        value={newEventType.name}
                        onChange={(e) =>
                          setNewEventType({
                            ...newEventType,
                            name: e.target.value,
                          })
                        }
                        placeholder="Event name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              newEventType.displayColor === color.value
                                ? "ring-2 ring-offset-2 ring-[#2e7d32]"
                                : ""
                            }`}
                            style={{ backgroundColor: color.value }}
                            onClick={() =>
                              setNewEventType({
                                ...newEventType,
                                displayColor: color.value,
                              })
                            }
                            title={color.name}
                          >
                            {newEventType.displayColor === color.value && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-sortable">
                          Sort plants by last event
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Easily find plants that haven&apos;t had an event in a
                          while
                        </p>
                      </div>
                      <Switch
                        id="new-sortable"
                        checked={newEventType.isSortableByDate}
                        onCheckedChange={(checked) =>
                          setNewEventType({
                            ...newEventType,
                            isSortableByDate: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-quick-access">
                          Quick access button
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Add a shortcut for quick event registration, useful
                          for frequently logged events, like &quot;watered&quot;
                        </p>
                      </div>
                      <Switch
                        id="new-quick-access"
                        checked={newEventType.hasQuickAccessButton}
                        onCheckedChange={(checked) =>
                          setNewEventType({
                            ...newEventType,
                            hasQuickAccessButton: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-quick-access">
                          Add comment field
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Option to include a note when logging the event
                        </p>
                      </div>
                      <Switch
                        id="new-quick-access"
                        checked={newEventType.hasComment}
                        onCheckedChange={(checked) =>
                          setNewEventType({
                            ...newEventType,
                            hasComment: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingNew(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddEventType}
                        disabled={!newEventType.name.trim()}
                      >
                        Add Event Type
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={() => setIsAddingNew(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Event Type
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
};

interface EventTypeFormProps {
  eventType: PlantEventType;
  onSave: (updates: Partial<PlantEventType>) => void;
  onCancel: () => void;
}

function EventTypeForm({ eventType, onSave, onCancel }: EventTypeFormProps) {
  const [formData, setFormData] = useState({
    name: eventType.name,
    displayColor: eventType.displayColor,
    isSortableByDate: eventType.isSortableByDate,
    hasQuickAccessButton: eventType.hasQuickAccessButton,
    hasComment: eventType.hasComment,
  });

  return (
    <div className="p-4">
      <h3 className="font-medium mb-4">Edit Event Type</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Event name"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  formData.displayColor === color.value
                    ? "ring-2 ring-offset-2 ring-[#2e7d32]"
                    : ""
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() =>
                  setFormData({ ...formData, displayColor: color.value })
                }
                title={color.name}
              >
                {formData.displayColor === color.value && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="edit-sortable">Sortable by date</Label>
            <p className="text-xs text-muted-foreground">
              Allow sorting plants by last event date
            </p>
          </div>
          <Switch
            id="edit-sortable"
            checked={formData.isSortableByDate}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isSortableByDate: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="edit-quick-access">Quick access button</Label>
            <p className="text-xs text-muted-foreground">
              Add a shortcut button, useful for frequently logged events
            </p>
          </div>
          <Switch
            id="edit-quick-access"
            checked={formData.hasQuickAccessButton}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, hasQuickAccessButton: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="edit-quick-access">Comment field</Label>
            <p className="text-xs text-muted-foreground">
              Add a field to include a note when logging the event
            </p>
          </div>
          <Switch
            id="edit-quick-access"
            checked={formData.hasComment}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, hasComment: checked })
            }
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(formData)}
            disabled={!formData.name.trim()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
