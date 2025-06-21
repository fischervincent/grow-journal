# Email Setup Guide

This guide explains how to set up email notifications for your plant care app using React Email and Resend.

## Required Environment Variables

Add these environment variables to your `.env.local` file and your deployment environment (Vercel):

```bash
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email sender address (must be verified in your Resend account)
EMAIL_FROM=Plant Care <noreply@yourdomain.com>

# Cron job secret for secure API access
CRON_SECRET=your-secure-random-secret-here
```

## Setup Steps

### 1. Create Resend Account
1. Go to [Resend.com](https://resend.com) and create an account
2. Verify your sending domain or use their test domain
3. Generate an API key in the dashboard

### 2. Configure Environment Variables
Add the variables above to:
- `.env.local` for local development
- Vercel environment variables for production

### 3. Verify Domain (Production)
For production emails, you'll need to:
1. Add your domain to Resend
2. Add the required DNS records
3. Update `EMAIL_FROM` to use your verified domain

## Email Template Features

The React Email template includes:
- 🌱 **Beautiful plant-themed design** with green color scheme
- 📊 **Daily summary** showing how many plants need attention
- 🌿 **Plant cards** with photos and colored event tags
- ⏰ **Timezone-aware** timestamps
- 📱 **Mobile-responsive** layout
- ✅ **Completion indicators** and overdue warnings

## Testing Emails

For development, you can:
1. Use Resend's test domain
2. Send test emails to your own address
3. View email previews using React Email's preview tools

## Email Content

Each email shows:
- Total number of plants needing attention
- Breakdown by task type (watering, fertilizing, etc.)
- Individual plant cards with:
  - Plant photos (or emoji fallback)
  - Task names with color coding
  - Overdue indicators
  - Completion status

## Troubleshooting

**Common issues:**

1. **API Key Error**: Make sure `RESEND_API_KEY` is set correctly
2. **From Address Error**: Verify your sending domain in Resend
3. **Template Errors**: Check React Email component syntax
4. **Delivery Issues**: Check Resend dashboard for delivery status

**Logs to check:**
- Vercel function logs for sending status
- Resend dashboard for delivery reports
- Browser console for template rendering issues 