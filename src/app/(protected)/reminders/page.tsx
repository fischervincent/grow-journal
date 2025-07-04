"use client";

import { useEffect, useState } from "react";
import {
  getRemindersByDay,
  type RemindersByDay,
} from "@/app/server-functions/get-reminders-by-day";
import { submitPlantEvent } from "@/app/server-functions/record-plant-event";
import { updateReminderDate } from "@/app/server-functions/plantEventTypes/update-reminder-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonWithConfirmation } from "@/components/ui/button-with-confirmation";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarDays,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { format, addDays } from "date-fns";
import { RescheduleSlider } from "@/components/RescheduleSlider";

export default function RemindersPage() {
  const [remindersByDay, setRemindersByDay] = useState<RemindersByDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingReminderId, setCompletingReminderId] = useState<
    string | null
  >(null);
  const [reschedulingReminderId, setReschedulingReminderId] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    const [result, error] = await getRemindersByDay(364, 30);
    if (error) {
      console.error("Failed to load reminders:", error);
      toast.error("Failed to load reminders");
      setLoading(false);
      return;
    }
    setRemindersByDay(result || []);
    setLoading(false);
  };

  const handleCompleteReminder = async (
    plantId: string,
    eventTypeId: string,
    eventTypeName: string,
    plantName: string,
    reminderId: string
  ) => {
    setCompletingReminderId(reminderId);

    try {
      const [, error] = await submitPlantEvent({
        plantId,
        eventId: eventTypeId,
        eventDateTime: new Date(),
        comment: `Completed from reminder - ${format(
          new Date(),
          "MMM d, yyyy"
        )}`,
      });

      if (error) {
        toast.error(`Failed to record ${eventTypeName.toLowerCase()}`);
        return;
      }

      toast.success(`${eventTypeName} recorded for ${plantName}!`);

      // Reload reminders to reflect the change
      await loadReminders();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCompletingReminderId(null);
    }
  };

  const handleRescheduleReminder = async (
    reminderId: string,
    days: number,
    eventTypeName: string,
    plantName: string
  ) => {
    setReschedulingReminderId(reminderId);

    try {
      const newDate = addDays(new Date(), days);
      const [, error] = await updateReminderDate({
        reminderId,
        scheduledAt: newDate,
      });

      if (error) {
        toast.error(`Failed to reschedule ${eventTypeName.toLowerCase()}`);
        return;
      }

      const dayText = days === 1 ? "tomorrow" : `in ${days} days`;
      toast.success(
        `${eventTypeName} for ${plantName} rescheduled to ${dayText}!`
      );

      // Reload reminders to reflect the change
      await loadReminders();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setReschedulingReminderId(null);
    }
  };

  const handleRescheduleWithCustomDate = async (
    reminderId: string,
    targetDate: Date,
    eventTypeName: string,
    plantName: string
  ) => {
    setReschedulingReminderId(reminderId);

    try {
      const [, error] = await updateReminderDate({
        reminderId,
        scheduledAt: targetDate,
      });

      if (error) {
        toast.error(`Failed to reschedule ${eventTypeName.toLowerCase()}`);
        return;
      }

      toast.success(
        `${eventTypeName} for ${plantName} rescheduled to ${format(targetDate, "MMM d, yyyy")}!`
      );

      // Reload reminders to reflect the change
      await loadReminders();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setReschedulingReminderId(null);
    }
  };

  const getDayStatusIcon = (day: RemindersByDay) => {
    if (day.overdue) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (
      day.completedReminders === day.totalReminders &&
      day.totalReminders > 0
    ) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (day.pendingReminders > 0) {
      return <Clock className="w-5 h-5 text-amber-500" />;
    }
    return <CalendarDays className="w-5 h-5 text-muted-foreground" />;
  };

  const getEventTypeSummaryText = (
    eventTypeSummary: RemindersByDay["eventTypeSummary"]
  ) => {
    const eventTypes = Object.values(eventTypeSummary);
    if (eventTypes.length === 0) return "";

    if (eventTypes.length === 1) {
      const eventType = eventTypes[0];
      const pendingCount = eventType.total - eventType.completed;
      if (pendingCount === 0)
        return `All ${eventType.eventTypeName.toLowerCase()} completed`;
      return `${pendingCount} plant${
        pendingCount > 1 ? "s" : ""
      } might need ${eventType.eventTypeName.toLowerCase()}`;
    }

    const totalPending = eventTypes.reduce(
      (sum, et) => sum + (et.total - et.completed),
      0
    );
    if (totalPending === 0) return "All tasks completed";
    return `${totalPending} plant${
      totalPending > 1 ? "s" : ""
    } need your attention`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const activeDays = remindersByDay.filter((day) => day.totalReminders > 0);

  // Sort days to show overdue first, then today, then future days
  const sortedActiveDays = activeDays.sort((a, b) => {
    const today = new Date().toISOString().split("T")[0];

    // Overdue items first
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;

    // Then today
    if (a.date === today && b.date !== today) return -1;
    if (a.date !== today && b.date === today) return 1;

    // Then by date
    return a.date.localeCompare(b.date);
  });

  // Check if there are any overdue reminders to show the notice
  const hasOverdueReminders = sortedActiveDays.some((day) => day.overdue);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Plant Care Reminders</h1>
        <p className="text-muted-foreground mt-2">
          Stay on top of your plant care schedule
        </p>
      </div>

      {activeDays.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No reminders scheduled
            </h3>
            <p className="text-muted-foreground">
              Set up reminder schedules in your plant event settings to see them
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {hasOverdueReminders && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                Only overdue reminders from the last 30 days are shown. Older
                overdue items are not displayed.
              </span>
            </div>
          )}

          {sortedActiveDays.map((day) => (
            <Card
              key={day.date}
              className={cn(
                "overflow-hidden",
                day.overdue && "border-red-200 bg-red-50/50"
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDayStatusIcon(day)}
                    <div>
                      <CardTitle className="text-xl">{day.dateLabel}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getEventTypeSummaryText(day.eventTypeSummary)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {Object.values(day.eventTypeSummary).map((eventType) => (
                      <Badge
                        key={eventType.eventTypeName}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: eventType.eventTypeColor,
                          color: eventType.eventTypeColor,
                        }}
                      >
                        {eventType.completed}/{eventType.total}{" "}
                        {eventType.eventTypeName.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {day.plants.map((plant) => (
                    <div key={plant.plantId} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {plant.plantPhotoUrl && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={plant.plantPhotoUrl}
                              alt={plant.plantName}
                              fill
                              className="object-cover"
                              sizes="64px"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg mb-2">
                            {plant.plantName}
                          </h4>

                          <div className="flex flex-wrap gap-2">
                            {plant.events.map((event) => (
                              <div
                                key={event.reminderId}
                                className="flex items-center gap-1"
                              >
                                {/* Main Plant Event Button */}
                                <ButtonWithConfirmation
                                  size="sm"
                                  variant={
                                    event.isCompleted ? "secondary" : "outline"
                                  }
                                  disabled={
                                    event.isCompleted ||
                                    completingReminderId === event.reminderId
                                  }
                                  style={
                                    !event.isCompleted
                                      ? {
                                          borderColor: event.eventTypeColor,
                                          color: event.eventTypeColor,
                                        }
                                      : {}
                                  }
                                  progressColor={event.eventTypeColor}
                                  className={cn(
                                    "flex items-center gap-2",
                                    event.isOverdue &&
                                      !event.isCompleted &&
                                      "border-red-500 text-red-500",
                                    event.isCompleted && "opacity-50"
                                  )}
                                  onConfirm={async () => {
                                    await handleCompleteReminder(
                                      plant.plantId,
                                      event.eventTypeId,
                                      event.eventTypeName,
                                      plant.plantName,
                                      event.reminderId
                                    );
                                  }}
                                  dialogTitle={`Record ${event.eventTypeName}`}
                                  dialogDescription={`Are you sure you want to record ${event.eventTypeName.toLowerCase()} for ${
                                    plant.plantName
                                  }?`}
                                  confirmText={`Record ${event.eventTypeName}`}
                                >
                                  {event.isCompleted && (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                  {event.isOverdue && !event.isCompleted && (
                                    <AlertTriangle className="w-4 h-4" />
                                  )}
                                  <span>
                                    {event.eventTypeName}
                                    {event.isCompleted && " ✓"}
                                    {event.isOverdue &&
                                      !event.isCompleted &&
                                      " (overdue)"}
                                  </span>
                                  {completingReminderId ===
                                    event.reminderId && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  )}
                                </ButtonWithConfirmation>

                                {/* Reschedule Slider */}
                                <RescheduleSlider
                                  disabled={event.isCompleted}
                                  isLoading={
                                    reschedulingReminderId === event.reminderId
                                  }
                                  onReschedule={(days) =>
                                    handleRescheduleReminder(
                                      event.reminderId,
                                      days,
                                      event.eventTypeName,
                                      plant.plantName
                                    )
                                  }
                                  onCustomDate={(date) =>
                                    handleRescheduleWithCustomDate(
                                      event.reminderId,
                                      date,
                                      event.eventTypeName,
                                      plant.plantName
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
