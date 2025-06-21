import { NextRequest, NextResponse } from 'next/server';
import { getRemindersByDayForUser } from '@/app/server-functions/get-reminders-by-day-for-user';
import { sendReminderEmail } from '@/lib/email/reminder-email-service';

interface UserNotificationRequest {
  userId: string;
  email: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInfo: UserNotificationRequest = await request.json();
    console.log(`🔄 Processing notification for user ${userInfo.userId} (${userInfo.email})`);

    // Get today's reminders for this user
    const [remindersByDay, error] = await getRemindersByDayForUser(userInfo.userId, 1); // Just today

    if (error) {
      console.error(`❌ Failed to get reminders for user ${userInfo.userId}:`, error);
      return NextResponse.json({
        success: false,
        error: `Failed to get reminders: ${error}`
      }, { status: 500 });
    }

    if (!remindersByDay || remindersByDay.length === 0) {
      console.log(`ℹ️ No reminders for user ${userInfo.userId} today`);
      return NextResponse.json({
        success: true,
        message: 'No reminders for today',
        skipped: true
      });
    }

    const todayReminders = remindersByDay[0];

    // Only send if there are pending reminders
    if (todayReminders.pendingReminders === 0) {
      console.log(`ℹ️ All reminders completed for user ${userInfo.userId}`);
      return NextResponse.json({
        success: true,
        message: 'All reminders completed',
        skipped: true
      });
    }

    console.log(`📧 Sending email to ${userInfo.email} - ${todayReminders.pendingReminders} pending reminders`);

    // Send email if email notifications are enabled
    if (userInfo.emailEnabled) {
      await sendReminderEmail({
        email: userInfo.email,
        reminderData: todayReminders,
        userInfo: {
          timezone: userInfo.timezone,
          notificationTime: userInfo.notificationTime,
        },
      });

      console.log(`✅ Email sent successfully to ${userInfo.email}`);
    }

    // TODO: Send push notification if push notifications are enabled
    if (userInfo.pushEnabled) {
      console.log(`🔔 Push notification would be sent to user ${userInfo.userId} (not implemented yet)`);
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${userInfo.email}`,
      data: {
        totalReminders: todayReminders.totalReminders,
        pendingReminders: todayReminders.pendingReminders,
        completedReminders: todayReminders.completedReminders,
        plantsCount: todayReminders.plants.length,
        eventTypes: Object.keys(todayReminders.eventTypeSummary),
        emailSent: userInfo.emailEnabled,
        pushSent: false, // Not implemented yet
      },
    });

  } catch (error) {
    console.error('❌ Send user notification failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// This is important for Vercel functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 