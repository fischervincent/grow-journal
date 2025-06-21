"use server";

import type { PlantEventTypeReminderConfig } from "@/core/repositories/plant-reminder-repository";
import { getUserPlantsWithPhotos } from "../plants/get-user-plants";
import { getPlantReminders } from "./get-plant-reminders";
import { getPlantReminderConfigs } from "./get-plant-reminder-configs";
import { calculateSmartInterval } from "./calculate-smart-interval";
import { getAuthenticatedUserId } from "../auth-helper";

interface PlantWithLastEvents {
  id: string;
  name: string;
  mainPhotoUrl?: string;
  lastDateByEvents: Record<string, { lastDate: string; eventName: string }>;
}

interface PlantReminderSetting {
  plantId: string;
  plantName: string;
  mainPhotoUrl?: string;
  isEnabled: boolean;
  useDefault: boolean;
  reminderType: string;
  intervalValue: number;
  intervalUnit: string;
  reminderDate: string;
  hasExistingReminder: boolean;
  hasSmartIssue: boolean;
  existingReminderId?: string;
  existingReminderDate?: string;
}

interface InitialPlantSettingsInput {
  eventTypeId: string;
  defaultConfig: PlantEventTypeReminderConfig;
  mode: "create" | "edit";
}

export async function calculateInitialPlantSettings({
  eventTypeId,
  defaultConfig,
  mode,
}: InitialPlantSettingsInput): Promise<[PlantReminderSetting[], string | null]> {
  try {
    await getAuthenticatedUserId(); // Ensure user is authenticated

    // Load all required data in parallel
    const [
      [plants, plantsError],
      reminders,
      plantConfigs,
    ] = await Promise.all([
      getUserPlantsWithPhotos(),
      getPlantReminders({ eventTypeId }),
      getPlantReminderConfigs({ eventTypeId }),
    ]);

    if (plantsError || !plants) {
      return [[], plantsError || "Failed to load plants"];
    }

    const typedPlants = plants as PlantWithLastEvents[];
    const plantSettings: PlantReminderSetting[] = [];

    // Helper function to calculate next reminder date
    const calculateNextReminderDate = (
      plant: PlantWithLastEvents,
      intervalValue: number,
      intervalUnit: string
    ): string => {
      // Check if there's a last event for this event type
      const lastEventInfo = plant.lastDateByEvents?.[eventTypeId];

      if (!lastEventInfo) {
        // No last event, use tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().slice(0, 10);
      }

      // Calculate next date based on last event + interval
      const lastEventDate = new Date(lastEventInfo.lastDate);
      const nextDate = new Date(lastEventDate);

      switch (intervalUnit) {
        case "days":
          nextDate.setDate(nextDate.getDate() + intervalValue);
          break;
        case "weeks":
          nextDate.setDate(nextDate.getDate() + intervalValue * 7);
          break;
        case "months":
          nextDate.setMonth(nextDate.getMonth() + intervalValue);
          break;
        case "years":
          nextDate.setFullYear(nextDate.getFullYear() + intervalValue);
          break;
        default:
          nextDate.setDate(nextDate.getDate() + intervalValue);
      }

      return nextDate.toISOString().slice(0, 10);
    };

    // Process each plant
    for (const plant of typedPlants) {
      const existingReminder = reminders.find(r => r.plantId === plant.id);
      const existingConfig = plantConfigs.find(c => c.plantId === plant.id);

      // Default settings
      let isEnabled = false;
      let useDefault = true;
      let reminderType = defaultConfig.reminderType || "fixed";
      let intervalValue = defaultConfig.intervalValue || 1;
      let intervalUnit = defaultConfig.intervalUnit || "months";
      let reminderDate = "";
      let hasSmartIssue = false;

      // In create mode, enable all plants by default if the reminder is enabled
      if (mode === "create" && defaultConfig.isEnabled) {
        isEnabled = true;
      }

      // In edit mode, use existing config if available
      if (mode === "edit" && existingConfig) {
        isEnabled = existingConfig.isEnabled;
        useDefault = existingConfig.useDefault;
        reminderType = existingConfig.reminderType;
        if (!useDefault) {
          intervalValue = existingConfig.intervalValue || 1;
          intervalUnit = existingConfig.intervalUnit || "months";
        }
      }

      // Calculate reminder date if plant is enabled
      if (isEnabled) {
        if (existingReminder) {
          // Use existing reminder date
          reminderDate = new Date(existingReminder.scheduledAt).toISOString().slice(0, 10);
        } else {
          // Calculate new reminder date
          const configToUse = useDefault ? defaultConfig : { reminderType, intervalValue, intervalUnit };

          if (configToUse.reminderType === "smart") {
            // Calculate smart interval
            try {
              const [smartResult, smartError] = await calculateSmartInterval({
                plantId: plant.id,
                eventTypeId,
              });

              if (smartError || !smartResult) {
                // Smart calculation failed, use fallback
                hasSmartIssue = true;
                reminderDate = calculateNextReminderDate(plant, intervalValue, intervalUnit);
              } else {
                // Use smart calculation
                intervalValue = smartResult.intervalValue;
                intervalUnit = smartResult.intervalUnit;
                reminderDate = smartResult.nextReminderDate.toISOString().slice(0, 10);
              }
            } catch {
              // Smart calculation failed, use fallback
              hasSmartIssue = true;
              reminderDate = calculateNextReminderDate(plant, intervalValue, intervalUnit);
            }
          } else {
            // Fixed interval
            reminderDate = calculateNextReminderDate(plant, intervalValue, intervalUnit);
          }
        }
      }

      // Fallback to tomorrow if no date calculated
      if (isEnabled && !reminderDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        reminderDate = tomorrow.toISOString().slice(0, 10);
      }

      plantSettings.push({
        plantId: plant.id,
        plantName: plant.name,
        mainPhotoUrl: plant.mainPhotoUrl,
        isEnabled,
        useDefault,
        reminderType,
        intervalValue,
        intervalUnit,
        reminderDate,
        hasExistingReminder: !!existingReminder,
        hasSmartIssue,
        existingReminderId: existingReminder?.id,
        existingReminderDate: existingReminder
          ? new Date(existingReminder.scheduledAt).toISOString().slice(0, 10)
          : undefined,
      });
    }

    return [plantSettings, null];
  } catch (error) {
    console.error("Error calculating initial plant settings:", error);
    return [[], error instanceof Error ? error.message : "Failed to calculate plant settings"];
  }
} 