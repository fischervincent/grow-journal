"use server";

import { getAuthenticatedUserId } from "../auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";

export async function cleanupDuplicateReminders() {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    // Get all reminders for the user
    const allReminders = await repository.findPlantReminders(userId);

    // Group by plant + event type
    const reminderGroups = new Map<string, typeof allReminders>();

    for (const reminder of allReminders) {
      const key = `${reminder.plantId}-${reminder.plantEventTypeId}`;
      if (!reminderGroups.has(key)) {
        reminderGroups.set(key, []);
      }
      reminderGroups.get(key)!.push(reminder);
    }

    // Find duplicates and keep only the most recent one
    let duplicatesRemoved = 0;

    for (const [key, reminders] of reminderGroups) {
      if (reminders.length > 1) {
        // Sort by creation date, keep the newest
        reminders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const toKeep = reminders[0];
        const toRemove = reminders.slice(1);

        // Remove duplicates (we'll need to add a delete method to the repository)
        duplicatesRemoved += toRemove.length;
      }
    }

    return [{ duplicatesFound: duplicatesRemoved }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to cleanup duplicates'] as const;
  }
} 