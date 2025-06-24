import { NextRequest, NextResponse } from 'next/server';
import { getNotificationReminderRepository } from '@/lib/repositories/notification-reminder-repository-factory';
import { getRemindersByDayForUser } from '@/app/server-functions/get-reminders-by-day-for-user';
import { sendReminderEmail } from '@/lib/email/reminder-email-service';

// Simple configuration for small user base (~50 users)
const MAX_PROCESSING_TIME = 50; // 50 seconds (leave 10s buffer for Hobby plan 60s limit)

// Extract the logic from send-reminder-notification-email endpoint
async function processUserNotification(userInfo: {
  userId: string;
  email: string;
  emailEnabled: boolean;
  notificationTime: string;
  timezone: string;
}) {
  console.log(`🔄 Processing email notification for user ${userInfo.userId} (${userInfo.email})`);

  // Check if email notifications are enabled - return early if not
  if (!userInfo.emailEnabled) {
    console.log(`ℹ️ Email notifications disabled for user ${userInfo.userId}`);
    return {
      success: true,
      message: 'Email notifications disabled',
      skipped: true
    };
  }

  // Get today's reminders for this user
  const [remindersByDay, error] = await getRemindersByDayForUser(userInfo.userId, 1); // Just today

  if (error) {
    console.error(`❌ Failed to get reminders for user ${userInfo.userId}:`, error);
    throw new Error(`Failed to get reminders: ${error}`);
  }

  if (!remindersByDay || remindersByDay.length === 0) {
    console.log(`ℹ️ No reminders for user ${userInfo.userId} today`);
    return {
      success: true,
      message: 'No reminders for today',
      skipped: true
    };
  }

  const todayReminders = remindersByDay[0];

  // Only send if there are pending reminders
  if (todayReminders.pendingReminders === 0) {
    console.log(`ℹ️ All reminders completed for user ${userInfo.userId}`);
    return {
      success: true,
      message: 'All reminders completed',
      skipped: true
    };
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

  return {
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
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from our GitHub Actions workflow
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('❌ CRON_SECRET environment variable not set');
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    if (!authHeader || authHeader !== expectedAuth) {
      console.error('❌ Unauthorized access attempt to notification trigger');
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const startTime = Date.now();
    console.log('🔔 Starting notification trigger at:', new Date().toISOString());

    const repository = getNotificationReminderRepository();
    const allUsers = await repository.findUsersForNotification();

    // Filter to only users with email notifications enabled
    const usersToEmail = allUsers.filter(user => user.emailEnabled);

    console.warn(`📊 Found ${allUsers.length} users ready for notifications, ${usersToEmail.length} with email enabled`);

    const results = [];

    // Process all users sequentially (simple approach for ~50 users)
    for (const user of usersToEmail) {
      // Check if we're approaching the time limit
      const elapsedTime = (Date.now() - startTime) / 1000;
      if (elapsedTime > MAX_PROCESSING_TIME) {
        console.warn(`⏰ Approaching Hobby plan time limit (${elapsedTime}s), stopping processing early`);
        console.warn(`📊 Processed ${results.length}/${usersToEmail.length} users before timeout`);
        break;
      }

      try {
        console.log(`📧 Processing notification for user ${user.userId} (${user.email}) - ${results.length + 1}/${usersToEmail.length}`);

        const result = await processUserNotification({
          userId: user.userId,
          email: user.email,
          emailEnabled: user.emailEnabled,
          notificationTime: user.notificationTime,
          timezone: user.timezone,
        });

        if (result.skipped) {
          console.log(`⏭️  Skipped notification for ${user.email}: ${result.message}`);
          results.push({ userId: user.userId, email: user.email, success: true, skipped: true, reason: result.message });
        } else {
          console.log(`✅ Successfully processed notification for ${user.email}`);
          results.push({ userId: user.userId, email: user.email, success: true, skipped: false });
        }
      } catch (error) {
        console.error(`❌ Error processing notification for ${user.email}:`, error);
        results.push({
          userId: user.userId,
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const skippedCount = results.filter(r => r.success && r.skipped).length;
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`📈 Processing summary: ${successCount} successful (${skippedCount} skipped), ${failureCount} failed in ${processingTime.toFixed(2)}s`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length}/${usersToEmail.length} users`,
      summary: {
        totalUsers: usersToEmail.length,
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        skipped: skippedCount,
        processingTimeSeconds: parseFloat(processingTime.toFixed(2)),
        timedOut: results.length < usersToEmail.length,
      },
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Notification trigger failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Set timeout for Hobby plan (60s max)
export const maxDuration = 60;

// This is important for Vercel functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 