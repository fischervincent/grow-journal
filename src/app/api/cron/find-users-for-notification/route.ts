import { NextRequest, NextResponse } from 'next/server';
import { getNotificationReminderRepository } from '@/lib/repositories/notification-reminder-repository-factory';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional security check)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Starting notification cron job at:', new Date().toISOString());

    const repository = getNotificationReminderRepository();
    const usersToNotify = await repository.findUsersForNotification();

    console.log(`📊 Found ${usersToNotify.length} users ready for notifications`);

    const results = [];
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Send notification to each user
    for (const user of usersToNotify) {
      try {
        console.log(`📧 Sending notification to user ${user.userId} (${user.email})`);

        const response = await fetch(`${baseUrl}/api/cron/send-user-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            userId: user.userId,
            email: user.email,
            pushEnabled: user.pushEnabled,
            emailEnabled: user.emailEnabled,
            notificationTime: user.notificationTime,
            timezone: user.timezone,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          console.log(`✅ Successfully sent notification to ${user.email}`);
          results.push({ userId: user.userId, email: user.email, success: true });
        } else {
          console.error(`❌ Failed to send notification to ${user.email}:`, result.error);
          results.push({ userId: user.userId, email: user.email, success: false, error: result.error });
        }
      } catch (error) {
        console.error(`❌ Error sending notification to ${user.email}:`, error);
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

    console.log(`📈 Notification summary: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${usersToNotify.length} users`,
      summary: {
        total: usersToNotify.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Notification cron job failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// This is important for Vercel cron jobs
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 