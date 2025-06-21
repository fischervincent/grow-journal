import { NextRequest, NextResponse } from 'next/server';
import { getNotificationReminderRepository } from '@/lib/repositories/notification-reminder-repository-factory';

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

    console.log('🔔 Starting notification trigger at:', new Date().toISOString());

    const repository = getNotificationReminderRepository();
    const usersToNotify = await repository.findUsersForNotification();

    console.warn(`📊 Found ${usersToNotify.length} users ready for notifications`);

    const results = [];
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Send notification to each user
    for (const user of usersToNotify) {
      try {
        console.log(`📧 Processing notification for user ${user.userId} (${user.email})`);

        const response = await fetch(`${baseUrl}/api/notifications/send-user`, {
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
          if (result.skipped) {
            console.log(`⏭️  Skipped notification for ${user.email}: ${result.message}`);
            results.push({ userId: user.userId, email: user.email, success: true, skipped: true, reason: result.message });
          } else {
            console.log(`✅ Successfully processed notification for ${user.email}`);
            results.push({ userId: user.userId, email: user.email, success: true, skipped: false });
          }
        } else {
          console.error(`❌ Failed to process notification for ${user.email}:`, result.error);
          results.push({ userId: user.userId, email: user.email, success: false, error: result.error });
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

    console.log(`📈 Notification trigger summary: ${successCount} successful (${skippedCount} skipped), ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Triggered notifications for ${usersToNotify.length} users`,
      summary: {
        total: usersToNotify.length,
        successful: successCount,
        failed: failureCount,
        skipped: skippedCount,
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

// This is important for Vercel functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 