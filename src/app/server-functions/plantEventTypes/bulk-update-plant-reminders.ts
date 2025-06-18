"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

interface PlantReminderSetting {
  plantId: string;
  isEnabled: boolean;
  useDefault: boolean;
  reminderType?: string;
  intervalValue?: number;
  intervalUnit?: string;
  reminderDate?: string; // ISO date string for when the reminder should be scheduled
}

interface BulkUpdatePlantRemindersInput {
  plantEventTypeId: string;
  settings: PlantReminderSetting[];
}

export async function bulkUpdatePlantReminders(input: BulkUpdatePlantRemindersInput) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    // Update plant reminder configs
    await repository.bulkUpsertPlantReminderConfigs(
      input.plantEventTypeId,
      input.settings,
      userId
    );

    // Handle reminder instance creation/deletion/updates
    for (const setting of input.settings) {
      // Get existing reminders for this plant and event type
      const existingReminders = await repository.findPlantRemindersByEventType(input.plantEventTypeId, userId);
      const plantReminder = existingReminders.find(r => r.plantId === setting.plantId);

      if (setting.isEnabled && setting.reminderDate) {
        // Plant is enabled and has a reminder date
        const reminderDateTime = new Date(setting.reminderDate);
        // Set time to 9:00 AM (default notification time)
        reminderDateTime.setHours(9, 0, 0, 0);

        if (plantReminder) {
          // Update existing reminder date
          await repository.updateReminderScheduledDate(plantReminder.id, reminderDateTime, userId);
        } else {
          // Create new reminder
          await repository.createPlantReminder(setting.plantId, input.plantEventTypeId, reminderDateTime, userId);
        }
      } else if (!setting.isEnabled && plantReminder) {
        // Plant is disabled, remove existing reminder
        await repository.deleteReminder(plantReminder.id, userId);
      }
    }

    return [true, null] as const;
  } catch (error) {
    console.error('Bulk update plant reminders error:', error);
    return [null, error instanceof Error ? error.message : 'Failed to update plant reminders'] as const;
  }
} 