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

    // Log details for each user (for now, just console logging)
    usersToNotify.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`, {
        userId: user.userId,
        email: user.email,
        pushEnabled: user.pushEnabled,
        emailEnabled: user.emailEnabled,
        notificationTime: user.notificationTime,
        timezone: user.timezone,
        currentTimeInUserTz: new Date().toLocaleString('en-US', { timeZone: user.timezone })
      });
    });

    return NextResponse.json({
      success: true,
      message: `Found ${usersToNotify.length} users for notifications`,
      timestamp: new Date().toISOString(),
      users: usersToNotify.map(user => ({
        userId: user.userId,
        email: user.email,
        methods: {
          push: user.pushEnabled,
          email: user.emailEnabled
        },
        schedule: {
          time: user.notificationTime,
          timezone: user.timezone
        }
      }))
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