import { NextRequest, NextResponse } from 'next/server';
import { getRemindersByDayForUser } from '@/app/server-functions/get-reminders-by-day-for-user';
import { sendReminderEmail } from '@/lib/email/reminder-email-service';

interface UserNotificationRequest {
  userId: string;
  email: string;
  emailEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from our notification system
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('❌ CRON_SECRET environment variable not set');
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    if (!authHeader || authHeader !== expectedAuth) {
      console.error('❌ Unauthorized access attempt to process user notification');
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const userInfo: UserNotificationRequest = await request.json();
    console.log(`🔄 Processing email notification for user ${userInfo.userId} (${userInfo.email})`);

    // Check if email notifications are enabled - return early if not
    if (!userInfo.emailEnabled) {
      console.log(`ℹ️ Email notifications disabled for user ${userInfo.userId}`);
      return NextResponse.json({
        success: true,
        message: 'Email notifications disabled',
        skipped: true
      });
    }

    // Get reminders for the last 100 days (to include overdue) plus today
    const [remindersByDay, error] = await getRemindersByDayForUser(userInfo.userId, 1, 100); // 1 day ahead, 100 days back

    if (error) {
      console.error(`❌ Failed to get reminders for user ${userInfo.userId}:`, error);
      return NextResponse.json({
        success: false,
        error: `Failed to get reminders: ${error}`
      }, { status: 500 });
    }

    if (!remindersByDay || remindersByDay.length === 0) {
      console.log(`ℹ️ No reminders for user ${userInfo.userId} in the past week`);
      return NextResponse.json({
        success: true,
        message: 'No reminders found',
        skipped: true
      });
    }

    // Find today's reminders and overdue reminders
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get all days with pending reminders (including overdue)
    const pendingReminderDays = remindersByDay.filter(day => day.pendingReminders > 0);

    if (pendingReminderDays.length === 0) {
      console.log(`ℹ️ No pending reminders for user ${userInfo.userId}`);
      return NextResponse.json({
        success: true,
        message: 'No pending reminders',
        skipped: true
      });
    }

    // Calculate totals across all pending days
    const totalPendingReminders = pendingReminderDays.reduce((sum, day) => sum + day.pendingReminders, 0);
    const totalReminders = pendingReminderDays.reduce((sum, day) => sum + day.totalReminders, 0);
    const totalCompletedReminders = pendingReminderDays.reduce((sum, day) => sum + day.completedReminders, 0);

    // Combine event type summaries across all days
    const combinedEventTypeSummary: Record<string, {
      eventTypeName: string;
      eventTypeColor: string;
      total: number;
      completed: number;
    }> = {};
    pendingReminderDays.forEach(day => {
      Object.entries(day.eventTypeSummary).forEach(([eventTypeId, eventType]) => {
        if (!combinedEventTypeSummary[eventTypeId]) {
          combinedEventTypeSummary[eventTypeId] = {
            eventTypeName: eventType.eventTypeName,
            eventTypeColor: eventType.eventTypeColor,
            total: 0,
            completed: 0
          };
        }
        combinedEventTypeSummary[eventTypeId].total += eventType.total;
        combinedEventTypeSummary[eventTypeId].completed += eventType.completed;
      });
    });

    // Get unique plants across all pending days
    const allPlants = new Map();
    pendingReminderDays.forEach(day => {
      day.plants.forEach(plant => {
        if (!allPlants.has(plant.plantId)) {
          allPlants.set(plant.plantId, {
            ...plant,
            events: []
          });
        }
        // Add events that have pending reminders
        plant.events.filter(event => !event.isCompleted).forEach(event => {
          allPlants.get(plant.plantId).events.push(event);
        });
      });
    });

    // Create a combined reminder data for email
    const combinedReminderData = {
      date: today,
      dateLabel: "Today & Overdue",
      totalReminders,
      completedReminders: totalCompletedReminders,
      pendingReminders: totalPendingReminders,
      overdue: pendingReminderDays.some(day => day.overdue),
      eventTypeSummary: combinedEventTypeSummary,
      plants: Array.from(allPlants.values())
    };

    console.log(`📧 Sending email to ${userInfo.email} - ${totalPendingReminders} pending reminders (including overdue)`);

    // Send email notification
    await sendReminderEmail({
      email: userInfo.email,
      reminderData: combinedReminderData,
      userInfo: {
        timezone: userInfo.timezone,
        notificationTime: userInfo.notificationTime,
      },
    });

    console.log(`✅ Email sent successfully to ${userInfo.email}`);

    return NextResponse.json({
      success: true,
      message: `Email notification sent to ${userInfo.email}`,
      data: {
        totalReminders,
        pendingReminders: totalPendingReminders,
        completedReminders: totalCompletedReminders,
        plantsCount: allPlants.size,
        eventTypes: Object.keys(combinedEventTypeSummary),
        emailSent: true,
        includesOverdue: pendingReminderDays.some(day => day.overdue),
      },
    });

  } catch (error) {
    console.error('❌ Process single user notification failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// This is important for Vercel functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 