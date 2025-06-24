"use server";

import { getAuthenticatedUserId } from "./auth-helper";
import { getPlantReminderRepository } from "@/lib/repositories/plant-reminder-repository-factory";
import { format, startOfDay, addDays, isSameDay } from "date-fns";

export interface RemindersByDay {
  date: string; // YYYY-MM-DD format
  dateLabel: string; // "Today", "Tomorrow", "Dec 25, 2024"
  totalReminders: number;
  completedReminders: number;
  pendingReminders: number;
  overdue: boolean;
  eventTypeSummary: Record<string, {
    eventTypeName: string;
    eventTypeColor: string;
    total: number;
    completed: number;
  }>;
  plants: Array<{
    plantId: string;
    plantName: string;
    plantSlug: string;
    plantPhotoUrl?: string;
    events: Array<{
      reminderId: string;
      eventTypeId: string;
      eventTypeName: string;
      eventTypeColor: string;
      scheduledAt: Date;
      isCompleted: boolean;
      isOverdue: boolean;
    }>;
  }>;
}

interface ReminderWithDetails {
  id: string;
  plantId: string;
  plantEventTypeId: string;
  scheduledAt: Date;
  isCompleted: boolean;
  completedAt: Date | null;
  isSnoozed: boolean;
  snoozedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plantName: string;
  plantSlug: string;
  plantPhotoUrl?: string;
  eventTypeName: string;
  eventTypeColor: string;
}

export async function getRemindersByDay(daysAhead: number = 7, daysBack: number = 7) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getPlantReminderRepository();

    // Get all active reminders for the date range (past + today + future)
    const today = startOfDay(new Date());
    const startDate = addDays(today, -daysBack); // Go back in time
    const endDate = addDays(today, daysAhead);

    const allReminders = await repository.findPlantRemindersWithDetails(
      userId,
      startDate,
      endDate
    );

    // Group reminders by day
    const remindersByDay: Record<string, RemindersByDay> = {};

    // Create entries for past days, today, and future days
    for (let i = -daysBack; i < daysAhead; i++) {
      const currentDate = addDays(today, i);
      const dateKey = format(currentDate, 'yyyy-MM-dd');

      // Create date label
      let dateLabel: string;
      if (i === 0) {
        dateLabel = "Today";
      } else if (i === 1) {
        dateLabel = "Tomorrow";
      } else if (i === -1) {
        dateLabel = "Yesterday";
      } else if (i < 0) {
        dateLabel = format(currentDate, 'MMM d, yyyy') + " (overdue)";
      } else {
        dateLabel = format(currentDate, 'MMM d, yyyy');
      }

      // Filter reminders for this day
      const dayReminders = allReminders.filter((reminder: ReminderWithDetails) =>
        isSameDay(new Date(reminder.scheduledAt), currentDate)
      );

      // Group by plant
      const plantGroups: Record<string, RemindersByDay['plants'][0]> = {};
      const eventTypeSummary: Record<string, RemindersByDay['eventTypeSummary'][string]> = {};

      dayReminders.forEach((reminder: ReminderWithDetails) => {
        // Add to plant group
        if (!plantGroups[reminder.plantId]) {
          plantGroups[reminder.plantId] = {
            plantId: reminder.plantId,
            plantName: reminder.plantName,
            plantSlug: reminder.plantSlug,
            plantPhotoUrl: reminder.plantPhotoUrl,
            events: []
          };
        }

        plantGroups[reminder.plantId].events.push({
          reminderId: reminder.id,
          eventTypeId: reminder.plantEventTypeId,
          eventTypeName: reminder.eventTypeName,
          eventTypeColor: reminder.eventTypeColor,
          scheduledAt: reminder.scheduledAt,
          isCompleted: reminder.isCompleted,
          isOverdue: reminder.scheduledAt < today && !reminder.isCompleted
        });

        // Add to event type summary
        if (!eventTypeSummary[reminder.plantEventTypeId]) {
          eventTypeSummary[reminder.plantEventTypeId] = {
            eventTypeName: reminder.eventTypeName,
            eventTypeColor: reminder.eventTypeColor,
            total: 0,
            completed: 0
          };
        }

        eventTypeSummary[reminder.plantEventTypeId].total++;
        if (reminder.isCompleted) {
          eventTypeSummary[reminder.plantEventTypeId].completed++;
        }
      });

      // Calculate summary stats
      const totalReminders = dayReminders.length;
      const completedReminders = dayReminders.filter((r: ReminderWithDetails) => r.isCompleted).length;
      const pendingReminders = totalReminders - completedReminders;
      const overdue = currentDate < today && pendingReminders > 0;

      remindersByDay[dateKey] = {
        date: dateKey,
        dateLabel,
        totalReminders,
        completedReminders,
        pendingReminders,
        overdue,
        eventTypeSummary,
        plants: Object.values(plantGroups)
      };
    }

    // Convert to array and sort by date
    const result = Object.values(remindersByDay).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return [result, null] as const;
  } catch (error) {
    console.error('Error getting reminders by day:', error);
    return [null, error instanceof Error ? error.message : 'Failed to get reminders'] as const;
  }
} 