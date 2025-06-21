import type { PlantReminderRepository } from "@/core/repositories/plant-reminder-repository";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

export class PlantReminderScheduler {
  constructor(private reminderRepository: PlantReminderRepository) { }

  /**
   * Schedules the next reminder for a plant after an event is recorded
   * This will cancel any existing reminders and create a new one based on the configuration
   */
  async scheduleNextReminder(
    plantId: string,
    eventTypeId: string,
    userId: string
  ): Promise<void> {
    // Get the effective reminder config for this plant and event type
    const reminderConfigs = await this.reminderRepository.findPlantReminderConfigs(
      plantId,
      userId
    );

    // Find the config for this specific event type
    const plantSpecificConfig = reminderConfigs.find(
      config => config.plantEventTypeId === eventTypeId && config.isEnabled
    );

    let effectiveConfig: {
      isEnabled: boolean;
      reminderType: string;
      intervalValue: number;
      intervalUnit: string;
    } | null = null;

    if (plantSpecificConfig) {
      // Use plant-specific configuration
      effectiveConfig = {
        isEnabled: plantSpecificConfig.isEnabled,
        reminderType: plantSpecificConfig.effectiveReminderType,
        intervalValue: plantSpecificConfig.effectiveIntervalValue,
        intervalUnit: plantSpecificConfig.effectiveIntervalUnit,
      };
    } else {
      // Check for default event type configuration
      const defaultConfig = await this.reminderRepository.findPlantEventTypeReminderConfig(
        eventTypeId,
        userId
      );

      if (defaultConfig && defaultConfig.isEnabled) {
        effectiveConfig = {
          isEnabled: defaultConfig.isEnabled,
          reminderType: defaultConfig.reminderType,
          intervalValue: defaultConfig.intervalValue,
          intervalUnit: defaultConfig.intervalUnit,
        };
      }
    }

    // If no valid config found or reminders are disabled, clean up and exit
    if (!effectiveConfig || !effectiveConfig.isEnabled) {
      await this.removeUpcomingReminders(plantId, eventTypeId, userId);
      return;
    }

    // Remove existing upcoming reminders for this plant/event type
    await this.removeUpcomingReminders(plantId, eventTypeId, userId);

    // Calculate next reminder date
    let nextReminderDate: Date;

    if (effectiveConfig.reminderType === 'smart') {
      // Use smart interval calculation
      const smartInterval = await this.reminderRepository.calculateSmartReminderInterval(
        plantId,
        eventTypeId,
        userId
      );

      if (smartInterval) {
        nextReminderDate = this.calculateNextReminderDate(
          smartInterval.intervalValue,
          smartInterval.intervalUnit
        );
      } else {
        // Smart calculation failed, fall back to fixed interval
        nextReminderDate = this.calculateNextReminderDate(
          effectiveConfig.intervalValue,
          effectiveConfig.intervalUnit
        );
      }
    } else {
      // Use fixed interval
      nextReminderDate = this.calculateNextReminderDate(
        effectiveConfig.intervalValue,
        effectiveConfig.intervalUnit
      );
    }

    // Create the new reminder
    await this.reminderRepository.createPlantReminder(
      plantId,
      eventTypeId,
      nextReminderDate,
      userId
    );
  }

  /**
   * Removes all reminders (regardless of status) for a specific plant and event type
   */
  private async removeUpcomingReminders(
    plantId: string,
    eventTypeId: string,
    userId: string
  ): Promise<void> {
    await this.reminderRepository.deleteRemindersByPlantAndEventType(
      plantId,
      eventTypeId,
      userId
    );
  }

  /**
   * Calculates the next reminder date based on the current time and interval
   */
  private calculateNextReminderDate(intervalValue: number, intervalUnit: string): Date {
    const now = new Date();
    const nextDate = new Date(now);

    switch (intervalUnit) {
      case 'days':
        nextDate.setDate(now.getDate() + intervalValue);
        break;
      case 'weeks':
        nextDate.setDate(now.getDate() + (intervalValue * 7));
        break;
      case 'months':
        nextDate.setMonth(now.getMonth() + intervalValue);
        break;
      case 'years':
        nextDate.setFullYear(now.getFullYear() + intervalValue);
        break;
      default:
        // Default to days if unit is unknown
        nextDate.setDate(now.getDate() + intervalValue);
    }

    return nextDate;
  }
}

/**
 * Factory function to create a PlantReminderScheduler instance
 */
export function createPlantReminderScheduler(): PlantReminderScheduler {
  return new PlantReminderScheduler(getPlantReminderRepository());
} 