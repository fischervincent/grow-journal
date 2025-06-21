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
    // Verify the request is from our notification trigger
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('❌ CRON_SECRET environment variable not set');
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    if (!authHeader || authHeader !== expectedAuth) {
      console.error('❌ Unauthorized access attempt to send user notification');
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

    // Send email notification
    await sendReminderEmail({
      email: userInfo.email,
      reminderData: todayReminders,
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
        totalReminders: todayReminders.totalReminders,
        pendingReminders: todayReminders.pendingReminders,
        completedReminders: todayReminders.completedReminders,
        plantsCount: todayReminders.plants.length,
        eventTypes: Object.keys(todayReminders.eventTypeSummary),
        emailSent: true,
      },
    });

  } catch (error) {
    console.error('❌ Send email notification failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// This is important for Vercel functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 