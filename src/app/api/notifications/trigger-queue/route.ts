import { NextRequest, NextResponse } from 'next/server';
import { getNotificationReminderRepository } from '@/lib/repositories/notification-reminder-repository-factory';

// This endpoint just queues users for processing
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

    console.log('🔔 Starting notification queue trigger at:', new Date().toISOString());

    const repository = getNotificationReminderRepository();
    const allUsers = await repository.findUsersForNotification();

    // Filter to only users with email notifications enabled
    const usersToEmail = allUsers.filter(user => user.emailEnabled);

    console.warn(`📊 Found ${allUsers.length} users ready for notifications, ${usersToEmail.length} with email enabled - HOBBY PLAN`);

    // Queue each user for processing
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Queue users for processing (fire and forget) - HOBBY PLAN OPTIMIZED
    usersToEmail.forEach((user, index) => {
      // More aggressive delays for Hobby plan to avoid rate limits and usage limits
      const delay = Math.floor(index / 5) * 3000; // 3 second delay every 5 users (instead of 1s every 10)

      setTimeout(async () => {
        try {
          await fetch(`${baseUrl}/api/notifications/process-single-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              userId: user.userId,
              email: user.email,
              emailEnabled: user.emailEnabled,
              notificationTime: user.notificationTime,
              timezone: user.timezone,
            }),
          });
        } catch (error) {
          console.error(`❌ Failed to queue user ${user.email}:`, error);
        }
      }, delay);
    });

    const estimatedCompletionTime = Math.ceil(usersToEmail.length / 5) * 3; // seconds
    console.log(`📤 Queued ${usersToEmail.length} users for processing (estimated completion: ${estimatedCompletionTime}s)`);

    return NextResponse.json({
      success: true,
      message: `Queued ${usersToEmail.length} users for notification processing - Hobby Plan`,
      summary: {
        totalUsers: usersToEmail.length,
        queued: usersToEmail.length,
        estimatedCompletionTimeSeconds: estimatedCompletionTime,
        plan: 'hobby',
        delayBetweenBatches: '3s per 5 users',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Notification queue trigger failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// This is important for Vercel functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 