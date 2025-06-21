"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PlantEventTypeReminderConfig } from "@/core/repositories/plant-reminder-repository";
import { Bell, Loader2, Calendar, Edit3 } from "lucide-react";
import { bulkUpdatePlantReminders } from "@/app/server-functions/plantEventTypes/bulk-update-plant-reminders";
import { getPlantReminders } from "@/app/server-functions/plantEventTypes/get-plant-reminders";
import { updateReminderDate } from "@/app/server-functions/plantEventTypes/update-reminder-date";
import { calculateInitialPlantSettings } from "@/app/server-functions/plantEventTypes/calculate-initial-plant-settings";

interface PlantReminderSetting {
  plantId: string;
  plantName: string;
  mainPhotoUrl?: string;
  isEnabled: boolean;
  useDefault: boolean;
  reminderType: string;
  intervalValue: number | string;
  intervalUnit: string;
  reminderDate: string;
  hasExistingReminder: boolean;
  hasSmartIssue: boolean;
  existingReminderId?: string;
  existingReminderDate?: string;
}

interface PlantReminder {
  id: string;
  plantId: string;
  plantEventTypeId: string;
  scheduledAt: Date;
  plantName: string;
}

interface PlantReminderSettingsContentProps {
  eventTypeId: string;
  defaultConfig: PlantEventTypeReminderConfig;
  mode: "create" | "edit";
  onSave: () => Promise<void>;
  onClose: () => void;
}

const intervalUnits = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

export function PlantReminderSettingsContent({
  eventTypeId,
  defaultConfig,
  mode,
  onSave,
  onClose,
}: PlantReminderSettingsContentProps) {
  const [plantSettings, setPlantSettings] = useState<PlantReminderSetting[]>(
    []
  );
  const [reminders, setReminders] = useState<PlantReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [globalReminderDate, setGlobalReminderDate] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Load initial settings
  useEffect(() => {
    const loadInitialSettings = async () => {
      setIsInitializing(true);
      try {
        const [settings, error] = await calculateInitialPlantSettings({
          eventTypeId,
          defaultConfig,
          mode,
        });

        if (error) {
          toast.error(error);
          return;
        }

        setPlantSettings(settings);

        // Set global date to tomorrow by default
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setGlobalReminderDate(tomorrow.toISOString().slice(0, 10));

        // Load current reminders
        const currentReminders = await getPlantReminders({ eventTypeId });
        setReminders(currentReminders);
      } catch (error) {
        console.error("Failed to load initial settings:", error);
        toast.error("Failed to load plant settings");
      } finally {
        setIsInitializing(false);
      }
    };

    loadInitialSettings();
  }, [eventTypeId, defaultConfig, mode]);

  const setGlobalDateForAllPlants = (dateString: string) => {
    setGlobalReminderDate(dateString);
    setPlantSettings((prev) =>
      prev.map((setting) =>
        setting.isEnabled ? { ...setting, reminderDate: dateString } : setting
      )
    );
  };

  const updatePlantSetting = (
    plantId: string,
    updates: Partial<PlantReminderSetting>
  ) => {
    setPlantSettings((prev) =>
      prev.map((setting) =>
        setting.plantId === plantId ? { ...setting, ...updates } : setting
      )
    );

    // If enabling a plant and we have a global date set, apply it
    if (updates.isEnabled && globalReminderDate) {
      setPlantSettings((prev) =>
        prev.map((setting) =>
          setting.plantId === plantId
            ? { ...setting, reminderDate: globalReminderDate }
            : setting
        )
      );
    }
  };

  const updatePlantReminderDate = (plantId: string, dateString: string) => {
    setPlantSettings((prev) =>
      prev.map((setting) =>
        setting.plantId === plantId
          ? { ...setting, reminderDate: dateString }
          : setting
      )
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // For create mode, ensure at least one plant is enabled
      if (mode === "create") {
        const enabledPlants = plantSettings.filter((s) => s.isEnabled);
        if (enabledPlants.length === 0) {
          toast.error("Please enable at least one plant for reminders");
          setIsLoading(false);
          return;
        }

        // Ensure all enabled plants have valid dates
        const plantsWithoutDates = enabledPlants.filter((s) => !s.reminderDate);
        if (plantsWithoutDates.length > 0) {
          toast.error("Please set reminder dates for all enabled plants");
          setIsLoading(false);
          return;
        }
      }

      // Validate and prepare settings for saving
      const settingsForSave = plantSettings.map((setting) => {
        const intervalValue =
          typeof setting.intervalValue === "string"
            ? parseInt(setting.intervalValue)
            : setting.intervalValue;

        // Validate interval for enabled plants
        if (setting.isEnabled && (!intervalValue || intervalValue < 1)) {
          throw new Error(
            `Please enter a valid interval value for ${setting.plantName}`
          );
        }

        return {
          plantId: setting.plantId,
          isEnabled: setting.isEnabled,
          useDefault: setting.useDefault,
          reminderType: setting.reminderType,
          intervalValue: intervalValue || 1,
          intervalUnit: setting.intervalUnit,
          reminderDate: setting.isEnabled ? setting.reminderDate : undefined,
        };
      });

      // Save to database
      const [, error] = await bulkUpdatePlantReminders({
        plantEventTypeId: eventTypeId,
        settings: settingsForSave,
      });

      if (error) {
        toast.error("Failed to save plant settings");
        return;
      }

      // Call the callback
      await onSave();
      onClose();
      toast.success("Plant reminder settings saved");
    } catch {
      toast.error("Failed to save plant settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    // If closing in create mode, warn the user
    if (mode === "create") {
      const enabledPlants = plantSettings.filter((s) => s.isEnabled);
      if (enabledPlants.length > 0) {
        const confirmed = confirm(
          "You have unsaved changes. If you close now, no reminder configuration will be created. Are you sure?"
        );
        if (!confirmed) {
          return;
        }
      }
    }
    onClose();
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Calculating plant reminder settings...
      </div>
    );
  }

  const enabledCount = plantSettings.filter((s) => s.isEnabled).length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-6 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {enabledCount} of {plantSettings.length} plants enabled
          </Badge>
          {defaultConfig && (
            <Badge variant="outline" className="text-xs">
              Default: Every {defaultConfig.intervalValue}{" "}
              {defaultConfig.intervalUnit}
            </Badge>
          )}
        </div>
      </div>

      <Separator className="flex-shrink-0" />

      {/* Global Date Picker - Only show when creating new config or no existing reminders */}
      {(mode === "create" ||
        !plantSettings.some((s) => s.hasExistingReminder)) && (
        <>
          <div className="px-6 py-3 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Set reminder date for all plants
                </Label>
                <p className="text-xs text-muted-foreground">
                  Choose a default date, then customize individual plants below.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={globalReminderDate}
                  onChange={(e) => setGlobalDateForAllPlants(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </div>
          <Separator className="flex-shrink-0" />
        </>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-6 pb-4">
            {plantSettings.map((setting) => {
              const existingReminder = reminders.find(
                (r) => r.plantId === setting.plantId
              );

              return (
                <div key={setting.plantId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={setting.mainPhotoUrl} />
                        <AvatarFallback className="text-xs">
                          {setting.plantName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{setting.plantName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {setting.isEnabled ? (
                            setting.useDefault ? (
                              <>Using default settings</>
                            ) : (
                              <>
                                Custom: Every {setting.intervalValue}{" "}
                                {setting.intervalUnit}
                              </>
                            )
                          ) : (
                            <>Reminders disabled</>
                          )}
                        </p>
                        {/* Show smart scheduling status */}
                        {setting.isEnabled &&
                          ((setting.useDefault &&
                            defaultConfig?.reminderType === "smart") ||
                            (!setting.useDefault &&
                              setting.reminderType === "smart")) &&
                          setting.hasSmartIssue && (
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ Smart scheduling unavailable - using fallback
                              interval
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.isEnabled}
                        onCheckedChange={(checked) =>
                          updatePlantSetting(setting.plantId, {
                            isEnabled: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  {setting.isEnabled && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Use default settings</Label>
                        <Switch
                          checked={setting.useDefault}
                          onCheckedChange={(checked) =>
                            updatePlantSetting(setting.plantId, {
                              useDefault: checked,
                            })
                          }
                        />
                      </div>

                      {!setting.useDefault && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                          <Label className="text-sm font-medium">
                            Custom Settings
                          </Label>

                          <div className="space-y-2">
                            <Label className="text-sm">Reminder Type</Label>
                            <Select
                              value={setting.reminderType}
                              onValueChange={(value) =>
                                updatePlantSetting(setting.plantId, {
                                  reminderType: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">
                                  Fixed Schedule
                                </SelectItem>
                                <SelectItem value="smart">
                                  Smart Schedule
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {setting.reminderType === "smart" &&
                              setting.hasSmartIssue && (
                                <p className="text-xs text-amber-600">
                                  Smart scheduling requires more event history.
                                  Using fixed interval below.
                                </p>
                              )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">
                              Every
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={setting.intervalValue || ""}
                              onChange={(e) =>
                                updatePlantSetting(setting.plantId, {
                                  intervalValue:
                                    e.target.value === ""
                                      ? ""
                                      : parseInt(e.target.value) || "",
                                })
                              }
                              className="w-20"
                            />
                            <Select
                              value={setting.intervalUnit}
                              onValueChange={(value) =>
                                updatePlantSetting(setting.plantId, {
                                  intervalUnit: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {intervalUnits.map((unit) => (
                                  <SelectItem
                                    key={unit.value}
                                    value={unit.value}
                                  >
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Reminder Date Section */}
                      {(() => {
                        if (existingReminder) {
                          const isEditing =
                            editingReminder === existingReminder.id;
                          const reminderDate = new Date(
                            existingReminder.scheduledAt
                          );

                          return (
                            <div className="space-y-2 p-3 bg-blue-50 rounded-md">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Next Reminder
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingReminder(
                                      isEditing ? null : existingReminder.id
                                    )
                                  }
                                  className="h-6 px-2"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              </div>

                              {isEditing ? (
                                <Input
                                  type="date"
                                  defaultValue={reminderDate
                                    .toISOString()
                                    .slice(0, 10)}
                                  onChange={async (e) => {
                                    if (e.target.value) {
                                      const newDate = new Date(reminderDate);
                                      const selectedDate = new Date(
                                        e.target.value
                                      );
                                      newDate.setFullYear(
                                        selectedDate.getFullYear()
                                      );
                                      newDate.setMonth(selectedDate.getMonth());
                                      newDate.setDate(selectedDate.getDate());

                                      const [, error] =
                                        await updateReminderDate({
                                          reminderId: existingReminder.id,
                                          scheduledAt: newDate,
                                        });

                                      if (error) {
                                        toast.error(
                                          "Failed to update reminder date"
                                        );
                                      } else {
                                        toast.success("Reminder date updated");
                                        const updatedReminders =
                                          await getPlantReminders({
                                            eventTypeId,
                                          });
                                        setReminders(updatedReminders);
                                        setEditingReminder(null);
                                      }
                                    }
                                  }}
                                  className="text-xs"
                                />
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {reminderDate.toLocaleDateString()} at{" "}
                                  {reminderDate.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          );
                        }

                        // Show date picker for new reminders
                        return (
                          <div className="space-y-2 p-3 bg-green-50 rounded-md">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Set Reminder Date
                            </Label>
                            <Input
                              type="date"
                              value={setting.reminderDate}
                              onChange={(e) =>
                                updatePlantReminderDate(
                                  setting.plantId,
                                  e.target.value
                                )
                              }
                              className="text-xs"
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator className="flex-shrink-0" />

      <div className="flex justify-end gap-2 px-6 py-4 flex-shrink-0">
        <Button variant="outline" onClick={handleDialogClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
