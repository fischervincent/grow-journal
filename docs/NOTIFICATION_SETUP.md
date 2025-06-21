# Plant Care Notification Setup

This document explains how to set up the automated plant care notification system using GitHub Actions and Vercel.

## Architecture

- **GitHub Actions**: Runs every hour as a scheduler (free on GitHub)
- **Vercel API**: Handles the notification logic and email sending
- **Security**: Protected by `CRON_SECRET` environment variable

## Setup Instructions

### 1. Deploy to Vercel

Deploy your application to Vercel and note the production URL (e.g., `https://your-app.vercel.app`).

### 2. Set Environment Variables in Vercel

In your Vercel dashboard, add these environment variables:

```bash
CRON_SECRET=your-secret-key-here  # Generate a secure random string
EMAIL_FROM=noreply@yourdomain.com # Your email sender address
# Add your email provider credentials (Resend, SendGrid, etc.)
```

### 3. Set GitHub Repository Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:

```bash
VERCEL_URL=https://your-app.vercel.app  # Your Vercel production URL (without trailing slash)
CRON_SECRET=your-secret-key-here        # Same as in Vercel
```

### 4. Enable GitHub Actions

The workflow file `.github/workflows/send-notifications.yml` will automatically:
- Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
- Call your Vercel API endpoint
- Log the results in GitHub Actions

### 5. Test the Setup

You can manually trigger the workflow:
1. Go to **Actions** tab in your GitHub repository
2. Select "Send Plant Care Notifications"
3. Click "Run workflow"

## How It Works

1. **GitHub Actions triggers** every hour
2. **Calls Vercel API**: `GET /api/notifications/trigger`
3. **Vercel finds users** whose notification time matches current time in their timezone
4. **For each user**: Calls `POST /api/notifications/send-user` 
5. **Gets user's reminders** for today
6. **Sends email** with plant care summary (if email enabled)
7. **Logs results** back to GitHub Actions

## Email Template Features

The notification emails include:
- 📊 **Daily summary**: "3 plants need watering, 1 plant needs fertilizing"
- 🌱 **Plant cards** with photos and colored event tags  
- ⚠️ **Overdue indicators** for late tasks
- ✅ **Completed task markers**
- 🌍 **Timezone context** in footer

## Monitoring

**Important**: The notification process is asynchronous. GitHub Actions only confirms that the job was triggered successfully, not that all emails were delivered. For email delivery status, check Vercel function logs.

### GitHub Actions Logs
Check the Actions tab for execution logs:
```bash
🔔 Triggering plant care notification job at Mon Jan 15 09:00:01 UTC 2024
📊 HTTP Status: 200
📋 Server Response: {"success":true,"message":"Processed 3 users",...}
✅ Notification job triggered successfully
ℹ️  Check Vercel function logs for email delivery status
🏁 Notification trigger completed at Mon Jan 15 09:00:03 UTC 2024
📝 Note: Individual email delivery status available in Vercel logs
```

### Vercel Function Logs
Check Vercel dashboard for detailed processing logs:
```bash
🔔 Starting notification cron job at: 2024-01-15T09:00:00.000Z
📊 Found 2 users ready for notifications
📧 Sending notification to user@example.com - 2 pending reminders
✅ Email sent successfully to user@example.com
📈 Notification summary: 2 successful, 0 failed
```

## Troubleshooting

### Common Issues

**GitHub Actions fails with 401 Unauthorized:**
- Check that `CRON_SECRET` matches between GitHub and Vercel
- Verify `VERCEL_URL` is correct and doesn't have trailing slash

**No users found for notifications:**
- Users must have notification settings enabled
- Their notification time must match current time in their timezone
- Check notification settings in the app

**Emails not being sent:**
- Configure email provider in `reminder-email-service.ts`
- Set email provider credentials in Vercel environment variables
- Check Vercel function logs for email sending errors

### Manual Testing

Test the API directly:
```bash
curl -X GET "https://your-app.vercel.app/api/notifications/trigger" \
  -H "Authorization: Bearer your-cron-secret"
```

## Cost Analysis

- **GitHub Actions**: Free (2,000 minutes/month for public repos)
- **Vercel**: Free tier includes serverless functions
- **Email Provider**: Varies (Resend: 3k emails/month free)

Total cost: **$0/month** for most small applications! 🎉 