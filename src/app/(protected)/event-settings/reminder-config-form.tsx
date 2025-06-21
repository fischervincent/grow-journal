"use client";

import { Button } from "@/components/ui/button";
import { ButtonWithConfirmation } from "@/components/ui/button-with-confirmation";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { FormErrorList, FieldError } from "@/components/ui/form-error";
import { useState, useEffect } from "react";
import { useFormError } from "@/hooks/use-form-error";
import { createReminderConfig } from "@/app/server-functions/plantEventTypes/create-reminder-config";
import { updateReminderConfig } from "@/app/server-functions/plantEventTypes/update-reminder-config";
import { deleteReminderConfig } from "@/app/server-functions/plantEventTypes/delete-reminder-config";
import { getReminderConfig } from "@/app/server-functions/plantEventTypes/get-reminder-config";
import type { PlantEventTypeReminderConfig } from "@/core/repositories/plant-reminder-repository";
import {
  Bell,
  BellOff,
  Clock,
  Trash2,
  Settings,
  Calendar,
  Brain,
} from "lucide-react";
import { PlantReminderSettingsDialog } from "./plant-reminder-settings-dialog";

interface ReminderConfigFormProps {
  plantEventTypeId: string;
  plantEventTypeName: string;
  onConfigChanged?: (config: PlantEventTypeReminderConfig | null) => void;
}

const intervalUnits = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

const reminderTypes = [
  {
    value: "fixed",
    label: "Fixed Schedule",
    description: "Uses a regular, consistent interval for reminders",
    icon: Calendar,
  },
  {
    value: "smart",
    label: "Smart Schedule",
    description: "Analyzes your past events to predict optimal reminder timing",
    icon: Brain,
    isNew: true,
  },
];

export function ReminderConfigForm({
  plantEventTypeId,
  plantEventTypeName,
  onConfigChanged,
}: ReminderConfigFormProps) {
  const [config, setConfig] = useState<PlantEventTypeReminderConfig | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPlantSettings, setShowPlantSettings] = useState(false);
  const [formData, setFormData] = useState<{
    isEnabled: boolean;
    reminderType: "fixed" | "smart";
    intervalValue: number | string;
    intervalUnit: string;
  }>({
    isEnabled: true,
    reminderType: "fixed",
    intervalValue: 1,
    intervalUnit: "months",
  });

  const {
    errors,
    isSubmitting,
    hasGeneralErrors,
    setError,
    setFieldError,
    clearError,
    clearAllErrors,
    getFieldError,
    withSubmission,
  } = useFormError();

  // Load existing config
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      clearAllErrors();
      const [existingConfig, error] = await getReminderConfig({
        plantEventTypeId,
      });

      if (error) {
        setError("Failed to load reminder settings");
        setIsLoading(false);
        return;
      }

      setConfig(existingConfig);
      if (existingConfig) {
        setFormData({
          isEnabled: existingConfig.isEnabled,
          reminderType:
            (existingConfig.reminderType as "fixed" | "smart") || "fixed",
          intervalValue: existingConfig.intervalValue,
          intervalUnit: existingConfig.intervalUnit,
        });
      }
      setIsLoading(false);
    };

    loadConfig();
  }, [plantEventTypeId, clearAllErrors, setError]);

  const handleSave = async () => {
    // Validate interval value
    const intervalValue =
      typeof formData.intervalValue === "string"
        ? parseInt(formData.intervalValue)
        : formData.intervalValue;

    if (formData.isEnabled && (!intervalValue || intervalValue < 1)) {
      setFieldError(
        "intervalValue",
        "Please enter a valid interval value (1 or greater)"
      );
      return;
    }

    const result = await withSubmission(async () => {
      if (config) {
        // Update existing config
        const [updatedConfig, error] = await updateReminderConfig({
          configId: config.id,
          plantEventTypeId: plantEventTypeId,
          isEnabled: formData.isEnabled,
          reminderType: formData.reminderType,
          intervalValue: intervalValue || 1,
          intervalUnit: formData.intervalUnit,
        });

        if (error) {
          throw new Error("Failed to update reminder settings");
        }

        return updatedConfig;
      } else {
        // For new configs, show plant settings dialog first
        // The config will be created when the user saves plant settings
        if (formData.isEnabled) {
          return "show-plant-settings";
        } else {
          // If disabled, create the config directly
          const [newConfig, error] = await createReminderConfig({
            plantEventTypeId,
            isEnabled: false,
            reminderType: formData.reminderType,
            intervalValue: intervalValue || 1,
            intervalUnit: formData.intervalUnit,
          });

          if (error) {
            throw new Error("Failed to create reminder settings");
          }

          return newConfig;
        }
      }
    });

    if (result) {
      if (result === "show-plant-settings") {
        setShowPlantSettings(true);
      } else {
        setConfig(result);
        onConfigChanged?.(result);
        setIsEditing(false);

        // Show plant settings dialog for further configuration
        if (result?.isEnabled) {
          setShowPlantSettings(true);
        }
      }
    }
  };

  const handlePlantSettingsSave = async () => {
    // Validate interval value
    const intervalValue =
      typeof formData.intervalValue === "string"
        ? parseInt(formData.intervalValue)
        : formData.intervalValue;

    // If this is a new config (no existing config), create it now
    if (!config) {
      const result = await withSubmission(async () => {
        const [newConfig, error] = await createReminderConfig({
          plantEventTypeId,
          isEnabled: formData.isEnabled,
          reminderType: formData.reminderType,
          intervalValue: intervalValue || 1,
          intervalUnit: formData.intervalUnit,
        });

        if (error) {
          throw new Error("Failed to create reminder settings");
        }

        return newConfig;
      });

      if (result) {
        setConfig(result);
        onConfigChanged?.(result);
        setIsEditing(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!config) return;

    const result = await withSubmission(async () => {
      const [, error] = await deleteReminderConfig({
        configId: config.id,
        plantEventTypeId: plantEventTypeId,
      });

      if (error) {
        throw new Error("Failed to delete reminder settings");
      }

      return true;
    });

    if (result) {
      setConfig(null);
      onConfigChanged?.(null);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (config) {
      setFormData({
        isEnabled: config.isEnabled,
        reminderType: (config.reminderType as "fixed" | "smart") || "fixed",
        intervalValue: config.intervalValue,
        intervalUnit: config.intervalUnit,
      });
    } else {
      setFormData({
        isEnabled: true,
        reminderType: "fixed",
        intervalValue: 1,
        intervalUnit: "months",
      });
    }
    clearAllErrors();
    setIsEditing(false);
  };

  const getReminderTypeLabel = (type: string) => {
    const reminderType = reminderTypes.find((t) => t.value === type);
    return reminderType?.label || "Fixed Schedule";
  };

  const getReminderTypeDescription = (type: string) => {
    const reminderType = reminderTypes.find((t) => t.value === type);
    return (
      reminderType?.description ||
      "Uses a regular, consistent interval for reminders"
    );
  };

  if (isLoading) {
    return (
      <div className="border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-3">
          <Clock className="h-4 w-4 animate-spin" />
          Loading reminder settings...
        </div>
      </div>
    );
  }

  if (hasGeneralErrors && !isEditing) {
    return (
      <div className="border-t border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <BellOff className="h-4 w-4" />
            {errors[0]?.message}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAllErrors();
              setIsEditing(true);
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!isEditing && !config) {
    return (
      <div className="border-t border-gray-100">
        <div className="">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="justify-start text-muted-foreground hover:text-foreground px-4 has-[>svg]:px-4 py-3 h-auto"
          >
            <Bell className="h-4 w-4 mr-2" />
            Add reminder
          </Button>
        </div>
      </div>
    );
  }

  if (!isEditing && config) {
    return (
      <>
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {config.isEnabled ? (
                <Bell className="h-4 w-4 text-blue-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {config.isEnabled
                    ? `${getReminderTypeLabel(config.reminderType)} - Every ${
                        config.intervalValue
                      } ${config.intervalUnit}`
                    : "Reminder disabled"}
                </span>
                {config.isEnabled && (
                  <span className="text-xs text-muted-foreground">
                    {getReminderTypeDescription(config.reminderType)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {config.isEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlantSettings(true)}
                  className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Plants
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
              >
                Edit
              </Button>
              <ButtonWithConfirmation
                variant="ghost"
                size="sm"
                onConfirm={handleDelete}
                dialogTitle="Delete Reminder Settings"
                dialogDescription={`Are you sure you want to delete the reminder settings for "${plantEventTypeName}"? This will remove the default reminder configuration, any plant-specific settings, and all scheduled reminders for this event type.`}
                confirmText="Delete"
                cancelText="Cancel"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
              >
                <Trash2 className="h-3 w-3" />
              </ButtonWithConfirmation>
            </div>
          </div>
        </div>

        <PlantReminderSettingsDialog
          open={showPlantSettings}
          onOpenChange={setShowPlantSettings}
          eventTypeName={plantEventTypeName}
          eventTypeId={plantEventTypeId}
          defaultConfig={config}
          onSave={handlePlantSettingsSave}
          mode="edit"
        />
      </>
    );
  }

  return (
    <>
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Enable Reminders</Label>
            <Switch
              checked={formData.isEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isEnabled: checked }))
              }
            />
          </div>

          {formData.isEnabled && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Reminder Type</Label>
                <RadioGroup
                  value={formData.reminderType}
                  onValueChange={(value: "fixed" | "smart") =>
                    setFormData((prev) => ({ ...prev, reminderType: value }))
                  }
                  className="space-y-3"
                >
                  {reminderTypes.map((type) => (
                    <div
                      key={type.value}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <RadioGroupItem
                        value={type.value}
                        id={type.value}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={type.value}
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <type.icon className="h-4 w-4" />
                          {type.label}
                          {type.isNew && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {formData.reminderType === "smart" && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Smart scheduling will analyze your recent &ldquo;
                    {plantEventTypeName}&rdquo; events to determine the best
                    reminder frequency for each plant.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    If no pattern is found, it will fall back to the interval
                    you set below.
                  </p>
                </div>
              )}

              <div className="space-y-3 p-3 bg-white rounded-md border">
                <Label className="text-sm font-medium">
                  {formData.reminderType === "smart"
                    ? "Fallback Interval"
                    : "Interval"}
                </Label>
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Every</Label>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      value={formData.intervalValue || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          intervalValue:
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value) || "",
                        }));
                        // Clear field error when user starts typing
                        if (getFieldError("intervalValue")) {
                          clearError("intervalValue");
                        }
                      }}
                      className={`w-20 ${
                        getFieldError("intervalValue") ? "border-red-300" : ""
                      }`}
                    />
                    <FieldError message={getFieldError("intervalValue")} />
                  </div>
                  <Select
                    value={formData.intervalUnit}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, intervalUnit: value }))
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {intervalUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <FormErrorList errors={errors} onDismiss={clearAllErrors} />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : config ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </div>

      <PlantReminderSettingsDialog
        open={showPlantSettings}
        onOpenChange={setShowPlantSettings}
        eventTypeName={plantEventTypeName}
        eventTypeId={plantEventTypeId}
        defaultConfig={
          config || {
            id: "",
            plantEventTypeId,
            plantEventTypeName,
            isEnabled: formData.isEnabled,
            reminderType: formData.reminderType,
            intervalValue:
              typeof formData.intervalValue === "string"
                ? parseInt(formData.intervalValue) || 1
                : formData.intervalValue,
            intervalUnit: formData.intervalUnit,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
        onSave={handlePlantSettingsSave}
        mode={config ? "edit" : "create"}
      />
    </>
  );
}
