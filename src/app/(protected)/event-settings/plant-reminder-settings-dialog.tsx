"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getUserPlantsWithPhotos } from "@/app/server-functions/plants/get-user-plants";
import { bulkUpdatePlantReminders } from "@/app/server-functions/plantEventTypes/bulk-update-plant-reminders";
import { getPlantReminders } from "@/app/server-functions/plantEventTypes/get-plant-reminders";
import { updateReminderDate } from "@/app/server-functions/plantEventTypes/update-reminder-date";
import { getPlantReminderConfigs } from "@/app/server-functions/plantEventTypes/get-plant-reminder-configs";
import { calculateSmartInterval } from "@/app/server-functions/plantEventTypes/calculate-smart-interval";

interface Plant {
  id: string;
  name: string;
  mainPhotoUrl?: string;
}

interface PlantReminder {
  id: string;
  plantId: string;
  plantEventTypeId: string;
  scheduledAt: Date;
  plantName: string;
}

interface PlantReminderConfig {
  plantId: string;
  plantName: string;
  isEnabled: boolean;
  useDefault: boolean;
  reminderType: string;
  intervalValue: number | null;
  intervalUnit: string | null;
}

interface PlantReminderSetting {
  plantId: string;
  isEnabled: boolean;
  useDefault: boolean;
  reminderType?: string;
  intervalValue?: number;
  intervalUnit?: string;
}

interface PlantReminderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTypeName: string;
  eventTypeId: string;
  defaultConfig: PlantEventTypeReminderConfig | null;
  onSave: () => Promise<void>;
  mode: "create" | "edit";
}

const intervalUnits = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

export function PlantReminderSettingsDialog({
  open,
  onOpenChange,
  eventTypeName,
  eventTypeId,
  defaultConfig,
  onSave,
  mode,
}: PlantReminderSettingsDialogProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantSettings, setPlantSettings] = useState<
    Record<string, PlantReminderSetting>
  >({});
  const [plantReminderDates, setPlantReminderDates] = useState<
    Record<string, string>
  >({});
  const [globalReminderDate, setGlobalReminderDate] = useState<string>("");
  const [reminders, setReminders] = useState<PlantReminder[]>([]);
  const [plantConfigs, setPlantConfigs] = useState<PlantReminderConfig[]>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSyncedReminders, setHasSyncedReminders] = useState(false);
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [plantsWithSmartIssues, setPlantsWithSmartIssues] = useState<
    Set<string>
  >(new Set());

  // Reset sync state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setHasSyncedReminders(false);
      setIsLoadingConfigs(false);
      setPlantsWithSmartIssues(new Set());
    }
  }, [open]);

  // Load plants when dialog opens
  useEffect(() => {
    if (open) {
      console.log("Dialog opened, loading plants...");
      loadPlants();
    }
  }, [open]);

  // Initialize plant settings when plants are loaded
  useEffect(() => {
    if (plants.length > 0 && open && defaultConfig) {
      const initializePlantSettings = async () => {
        const initialSettings: Record<string, PlantReminderSetting> = {};
        const initialDates: Record<string, string> = {};
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 1); // Default to tomorrow
        const defaultDateString = defaultDate.toISOString().slice(0, 10); // Only date part

        for (const plant of plants) {
          // In create mode, enable all plants by default if the reminder is enabled
          // In edit mode, start with plants disabled (user can enable them manually)
          const shouldEnableByDefault =
            mode === "create" && defaultConfig.isEnabled;

          console.log("Plant initialization:", {
            mode,
            plantId: plant.id,
            defaultConfigEnabled: defaultConfig.isEnabled,
            shouldEnableByDefault,
          });

          let intervalValue = defaultConfig.intervalValue;
          let intervalUnit = defaultConfig.intervalUnit;

          // Calculate smart interval if default config is smart and plant will be enabled
          if (shouldEnableByDefault && defaultConfig.reminderType === "smart") {
            console.log("Calculating smart interval for plant:", plant.id);
            const smartInterval = await calculateSmartIntervalForPlant(
              plant.id
            );
            if (smartInterval) {
              intervalValue = smartInterval.intervalValue;
              intervalUnit = smartInterval.intervalUnit;
              // Use the calculated reminder date instead of tomorrow
              initialDates[plant.id] = smartInterval.nextReminderDate
                .toISOString()
                .slice(0, 10);
              console.log("Smart interval calculated:", smartInterval);
            } else {
              // Smart calculation failed, fallback to default config values
              console.log(
                "Smart calculation failed for plant:",
                plant.id,
                "using fallback"
              );
              intervalValue = defaultConfig.intervalValue;
              intervalUnit = defaultConfig.intervalUnit;
            }
          }

          initialSettings[plant.id] = {
            plantId: plant.id,
            isEnabled: shouldEnableByDefault,
            useDefault: true,
            reminderType: defaultConfig.reminderType || "fixed",
            intervalValue,
            intervalUnit,
          };

          // Only set default date if we haven't already set a smart interval date
          if (!initialDates[plant.id]) {
            initialDates[plant.id] = defaultDateString;
          }
        }

        console.log("Setting initial plant settings:", initialSettings);
        setPlantSettings(initialSettings);
        setPlantReminderDates(initialDates);
        setGlobalReminderDate(defaultDateString);
      };

      initializePlantSettings();
    }
  }, [plants, defaultConfig, open, mode]);

  // Sync plant settings with existing configs in edit mode
  useEffect(() => {
    console.log("Sync effect triggered:", {
      mode,
      remindersCount: reminders.length,
      plantsCount: plants.length,
      plantConfigsCount: plantConfigs.length,
      plantSettingsCount: Object.keys(plantSettings).length,
      hasSyncedReminders,
      isLoadingPlants,
      isLoadingConfigs,
    });

    // Only sync in edit mode when ALL data is loaded and we haven't synced yet
    if (
      mode === "edit" &&
      !isLoadingPlants && // Wait for plants to load
      !isLoadingConfigs && // Wait for configs to load
      plants.length > 0 &&
      Object.keys(plantSettings).length > 0 &&
      !hasSyncedReminders // Only sync once
    ) {
      // Check if we have plant configs to sync with
      if (plantConfigs.length > 0) {
        const syncPlantConfigs = async () => {
          const updatedSettings = { ...plantSettings };
          const updatedDates = { ...plantReminderDates };
          let hasChanges = false;

          console.log("Syncing with existing plant configs:", plantConfigs);
          console.log("Current plant settings before sync:", plantSettings);

          // Enable plants that have existing configs
          for (const config of plantConfigs) {
            console.log(
              "Processing config for plant:",
              config.plantId,
              "Current enabled:",
              updatedSettings[config.plantId]?.isEnabled,
              "Config enabled:",
              config.isEnabled
            );

            if (
              updatedSettings[config.plantId] &&
              updatedSettings[config.plantId].isEnabled !== config.isEnabled
            ) {
              console.log(
                "Updating plant:",
                config.plantId,
                "to enabled:",
                config.isEnabled
              );

              let intervalValue = config.intervalValue ?? undefined;
              let intervalUnit = config.intervalUnit ?? undefined;

              // Calculate smart interval if this plant has smart config but no existing reminder
              const hasExistingReminder = reminders.some(
                (r) => r.plantId === config.plantId
              );
              if (
                config.isEnabled &&
                config.reminderType === "smart" &&
                !hasExistingReminder
              ) {
                console.log(
                  "Calculating smart interval for existing config:",
                  config.plantId
                );
                const smartInterval = await calculateSmartIntervalForPlant(
                  config.plantId
                );
                if (smartInterval) {
                  intervalValue = smartInterval.intervalValue;
                  intervalUnit = smartInterval.intervalUnit;
                  // Use the calculated reminder date
                  updatedDates[config.plantId] = smartInterval.nextReminderDate
                    .toISOString()
                    .slice(0, 10);
                  console.log(
                    "Smart interval calculated for existing config:",
                    smartInterval
                  );
                } else {
                  // Smart calculation failed, keep the existing config values
                  console.log(
                    "Smart calculation failed for existing config:",
                    config.plantId,
                    "keeping existing values"
                  );
                }
              }

              updatedSettings[config.plantId] = {
                ...updatedSettings[config.plantId],
                isEnabled: config.isEnabled,
                useDefault: config.useDefault,
                reminderType: config.reminderType,
                intervalValue,
                intervalUnit,
              };

              // If enabled and we haven't set a smart date, set a default reminder date
              if (config.isEnabled && !updatedDates[config.plantId]) {
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 1);
                updatedDates[config.plantId] = defaultDate
                  .toISOString()
                  .slice(0, 10);
              }

              hasChanges = true;
            }
          }

          // Also sync reminder dates from actual reminders
          reminders.forEach((reminder) => {
            if (
              updatedSettings[reminder.plantId] &&
              updatedSettings[reminder.plantId].isEnabled
            ) {
              const reminderDate = new Date(reminder.scheduledAt);
              updatedDates[reminder.plantId] = reminderDate
                .toISOString()
                .slice(0, 10);
            }
          });

          if (hasChanges) {
            console.log(
              "Updated plant settings based on existing configs:",
              updatedSettings
            );
            setPlantSettings(updatedSettings);
            setPlantReminderDates(updatedDates);
          } else {
            console.log(
              "No changes needed - plant settings already match configs"
            );
          }
        };

        syncPlantConfigs();
      } else {
        console.log(
          "No plant configs found - plants will remain in default state"
        );
      }

      // Mark as synced once we've completed the sync attempt (regardless of whether configs were found)
      setHasSyncedReminders(true);
    }
  }, [
    mode,
    plantConfigs.length,
    reminders.length,
    plants.length,
    Object.keys(plantSettings).length,
    hasSyncedReminders,
    isLoadingPlants,
    isLoadingConfigs,
  ]);

  const loadPlants = async () => {
    setIsLoadingPlants(true);
    try {
      const [userPlants, error] = await getUserPlantsWithPhotos();
      if (error) {
        toast.error("Failed to load plants");
        return;
      }
      setPlants(userPlants || []);

      // Load existing reminders and configs
      await Promise.all([loadReminders(), loadPlantConfigs()]);
    } catch {
      toast.error("Failed to load plants");
    } finally {
      setIsLoadingPlants(false);
    }
  };

  const loadReminders = async () => {
    try {
      console.log("Loading reminders for eventTypeId:", eventTypeId);
      const remindersResult = await getPlantReminders({ eventTypeId });
      console.log("Loaded reminders:", remindersResult);
      setReminders(remindersResult);
    } catch (error) {
      console.error("Failed to load reminders:", error);
    }
  };

  const loadPlantConfigs = async () => {
    setIsLoadingConfigs(true);
    try {
      console.log("Loading plant configs for eventTypeId:", eventTypeId);
      const configsResult = await getPlantReminderConfigs({ eventTypeId });
      console.log("Loaded plant configs:", configsResult);
      setPlantConfigs(configsResult);
    } catch (error) {
      console.error("Failed to load plant configs:", error);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const setGlobalDateForAllPlants = (dateString: string) => {
    setGlobalReminderDate(dateString);
    const newDates: Record<string, string> = {};
    plants.forEach((plant) => {
      if (plantSettings[plant.id]?.isEnabled) {
        newDates[plant.id] = dateString;
      }
    });
    setPlantReminderDates((prev) => ({ ...prev, ...newDates }));
  };

  const updatePlantReminderDate = (plantId: string, dateString: string) => {
    setPlantReminderDates((prev) => ({
      ...prev,
      [plantId]: dateString,
    }));
  };

  const updatePlantSetting = (
    plantId: string,
    updates: Partial<PlantReminderSetting>
  ) => {
    setPlantSettings((prev) => ({
      ...prev,
      [plantId]: { ...prev[plantId], ...updates },
    }));

    // If enabling a plant and we have a global date set, apply it to this plant
    if (
      updates.isEnabled &&
      globalReminderDate &&
      !plantReminderDates[plantId]
    ) {
      updatePlantReminderDate(plantId, globalReminderDate);
    }
  };

  const calculateSmartIntervalForPlant = async (
    plantId: string
  ): Promise<{
    intervalValue: number;
    intervalUnit: string;
    nextReminderDate: Date;
    lastEventDate: Date | null;
  } | null> => {
    try {
      const [result, error] = await calculateSmartInterval({
        plantId,
        eventTypeId,
      });

      if (error) {
        console.error("Failed to calculate smart interval:", error);
        // Track plants with smart calculation issues
        setPlantsWithSmartIssues((prev) => new Set([...prev, plantId]));
        return null;
      }

      return result;
    } catch (error) {
      console.error("Failed to calculate smart interval:", error);
      // Track plants with smart calculation issues
      setPlantsWithSmartIssues((prev) => new Set([...prev, plantId]));
      return null;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const settings = Object.values(plantSettings);

      // For create mode, ensure at least one plant is enabled
      if (mode === "create") {
        const enabledPlants = settings.filter((s) => s.isEnabled);
        if (enabledPlants.length === 0) {
          toast.error("Please enable at least one plant for reminders");
          setIsLoading(false);
          return;
        }

        // Ensure all enabled plants have valid dates
        const plantsWithoutDates = enabledPlants.filter(
          (s) => !plantReminderDates[s.plantId]
        );
        if (plantsWithoutDates.length > 0) {
          toast.error("Please set reminder dates for all enabled plants");
          setIsLoading(false);
          return;
        }
      }

      // Prepare settings for saving (smart intervals are already calculated)
      const settingsWithReminderDates = settings.map((setting) => ({
        ...setting,
        reminderDate: setting.isEnabled
          ? plantReminderDates[setting.plantId]
          : undefined,
      }));

      // Save to database
      const [, error] = await bulkUpdatePlantReminders({
        plantEventTypeId: eventTypeId,
        settings: settingsWithReminderDates,
      });

      if (error) {
        toast.error("Failed to save plant settings");
        return;
      }

      // Call the callback
      await onSave();

      // Reload reminders to show updated dates
      await loadReminders();

      onOpenChange(false);
      toast.success("Plant reminder settings saved");
    } catch {
      toast.error("Failed to save plant settings");
    } finally {
      setIsLoading(false);
    }
  };

  const enabledCount = Object.values(plantSettings).filter(
    (s) => s.isEnabled
  ).length;

  const handleDialogClose = (open: boolean) => {
    // If closing in create mode, warn the user
    if (!open && mode === "create") {
      const enabledPlants = Object.values(plantSettings).filter(
        (s) => s.isEnabled
      );
      if (enabledPlants.length > 0) {
        // User has made changes but is trying to close without saving
        const confirmed = confirm(
          "You have unsaved changes. If you close now, no reminder configuration will be created. Are you sure?"
        );
        if (!confirmed) {
          return; // Don't close the dialog
        }
      }
    }
    onOpenChange(open);
  };

  if (isLoadingPlants) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading plants...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>
            {mode === "create"
              ? "Set Up Plant Reminders"
              : "Edit Plant Reminders"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Configure which plants should get "${eventTypeName}" reminders and when. You must enable at least one plant to create the reminder configuration.`
              : `Set up reminder preferences for "${eventTypeName}" across your plants. You can enable/disable reminders per plant and customize intervals.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between px-6 py-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {enabledCount} of {plants.length} plants enabled
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

        {/* Global Date Picker - Only show when creating new config or no reminders exist yet */}
        {(mode === "create" || reminders.length === 0) && (
          <>
            <div className="px-6 py-3 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Set reminder date for all plants
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose a default date, then customize individual plants
                    below. Time will be set from your notification preferences.
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
              {plants.map((plant) => {
                const setting = plantSettings[plant.id];
                if (!setting) return null;

                return (
                  <div key={plant.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={plant.mainPhotoUrl} />
                          <AvatarFallback className="text-xs">
                            {plant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{plant.name}</h4>
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
                            plantsWithSmartIssues.has(plant.id) && (
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
                            updatePlantSetting(plant.id, { isEnabled: checked })
                          }
                        />
                      </div>
                    </div>

                    {setting.isEnabled && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">
                            Use default settings
                          </Label>
                          <Switch
                            checked={setting.useDefault}
                            onCheckedChange={(checked) =>
                              updatePlantSetting(plant.id, {
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
                                value={setting.reminderType || "fixed"}
                                onValueChange={(value) =>
                                  updatePlantSetting(plant.id, {
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
                                plantsWithSmartIssues.has(plant.id) && (
                                  <p className="text-xs text-amber-600">
                                    Smart scheduling requires more event
                                    history. Using fixed interval below.
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
                                value={setting.intervalValue || 1}
                                onChange={(e) =>
                                  updatePlantSetting(plant.id, {
                                    intervalValue:
                                      parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-20"
                              />
                              <Select
                                value={setting.intervalUnit || "months"}
                                onValueChange={(value) =>
                                  updatePlantSetting(plant.id, {
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
                          const reminder = reminders.find(
                            (r) => r.plantId === plant.id
                          );

                          // Show existing reminder date (for edit mode)
                          if (reminder) {
                            const isEditing = editingReminder === reminder.id;
                            const reminderDate = new Date(reminder.scheduledAt);

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
                                        isEditing ? null : reminder.id
                                      )
                                    }
                                    className="h-6 px-2"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                </div>

                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="date"
                                      defaultValue={reminderDate
                                        .toISOString()
                                        .slice(0, 10)}
                                      onChange={async (e) => {
                                        if (e.target.value) {
                                          // Create new date with same time as original but new date
                                          const newDate = new Date(
                                            reminderDate
                                          );
                                          const selectedDate = new Date(
                                            e.target.value
                                          );
                                          newDate.setFullYear(
                                            selectedDate.getFullYear()
                                          );
                                          newDate.setMonth(
                                            selectedDate.getMonth()
                                          );
                                          newDate.setDate(
                                            selectedDate.getDate()
                                          );

                                          const [, error] =
                                            await updateReminderDate({
                                              reminderId: reminder.id,
                                              scheduledAt: newDate,
                                            });

                                          if (error) {
                                            toast.error(
                                              "Failed to update reminder date"
                                            );
                                          } else {
                                            toast.success(
                                              "Reminder date updated"
                                            );
                                            await loadReminders();
                                            setEditingReminder(null);
                                          }
                                        }
                                      }}
                                      className="text-xs"
                                    />
                                  </div>
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

                          // Show date picker for new reminders (create mode or enabled plant without existing reminder)
                          if (mode === "create" || !reminder) {
                            const plantDate =
                              plantReminderDates[plant.id] || "";

                            return (
                              <div className="space-y-2 p-3 bg-green-50 rounded-md">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Set Reminder Date
                                </Label>
                                <Input
                                  type="date"
                                  value={plantDate}
                                  onChange={(e) =>
                                    updatePlantReminderDate(
                                      plant.id,
                                      e.target.value
                                    )
                                  }
                                  className="text-xs"
                                />
                              </div>
                            );
                          }

                          return null;
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
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
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
      </DialogContent>
    </Dialog>
  );
}
