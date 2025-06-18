"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";
import { getPlantRepository } from "@/lib/repositories/plant-repository-factory";

interface CalculateSmartIntervalInput {
  plantId: string;
  eventTypeId: string;
}

interface SmartIntervalResult {
  intervalValue: number;
  intervalUnit: string;
  nextReminderDate: Date;
  lastEventDate: Date | null;
}

export async function calculateSmartInterval(input: CalculateSmartIntervalInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const { plantId, eventTypeId } = input;

    if (!plantId || !eventTypeId) {
      return [null, 'Plant ID and Event Type ID are required'] as const;
    }

    const [plantRepository, reminderRepository] = [
      getPlantRepository(),
      getPlantReminderRepository()
    ];

    // Get the plant to access lastDateByEvents
    const plant = await plantRepository.findById(plantId, userId);
    if (!plant) {
      return [null, 'Plant not found'] as const;
    }

    // Calculate smart interval
    const smartInterval = await reminderRepository.calculateSmartReminderInterval(
      plantId,
      eventTypeId,
      userId
    );

    // Check if smart interval calculation failed
    if (!smartInterval) {
      return [null, 'Unable to calculate smart interval - no event history found'] as const;
    }

    // Get last event date from plant's lastDateByEvents
    const lastEventInfo = plant.lastDateByEvents[eventTypeId];
    const lastEventDate = lastEventInfo ? new Date(lastEventInfo.lastDate) : null;

    // Calculate next reminder date
    let nextReminderDate: Date;

    if (lastEventDate && smartInterval) {
      // Start from last event date and add the smart interval
      nextReminderDate = new Date(lastEventDate);

      switch (smartInterval.intervalUnit) {
        case 'days':
          nextReminderDate.setDate(nextReminderDate.getDate() + smartInterval.intervalValue);
          break;
        case 'weeks':
          nextReminderDate.setDate(nextReminderDate.getDate() + (smartInterval.intervalValue * 7));
          break;
        case 'months':
          nextReminderDate.setMonth(nextReminderDate.getMonth() + smartInterval.intervalValue);
          break;
        case 'years':
          nextReminderDate.setFullYear(nextReminderDate.getFullYear() + smartInterval.intervalValue);
          break;
        default:
          // Fallback to days
          nextReminderDate.setDate(nextReminderDate.getDate() + smartInterval.intervalValue);
      }
    } else {
      // No previous event or smart interval calculation failed, use tomorrow as default
      nextReminderDate = new Date();
      nextReminderDate.setDate(nextReminderDate.getDate() + 1);
    }

    const result: SmartIntervalResult = {
      intervalValue: smartInterval.intervalValue,
      intervalUnit: smartInterval.intervalUnit,
      nextReminderDate,
      lastEventDate
    };

    console.log('Smart interval calculated:', {
      plantId,
      eventTypeId,
      lastEventDate: lastEventDate?.toISOString(),
      smartInterval,
      nextReminderDate: nextReminderDate.toISOString()
    });

    return [result, null] as const;
  } catch (error) {
    console.error('Error calculating smart interval:', error);
    return [null, error instanceof Error ? error.message : 'Failed to calculate smart interval'] as const;
  }
} 