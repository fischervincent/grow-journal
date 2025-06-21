import type { RemindersByDay } from '@/app/server-functions/get-reminders-by-day';

interface ReminderEmailData {
  email: string;
  reminderData: RemindersByDay;
  userInfo: {
    timezone: string;
    notificationTime: string;
  };
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<void> {
  try {
    console.log(`📧 Sending reminder email to ${data.email}`);

    // Generate email content
    const emailHtml = generateReminderEmailHtml(data);
    const emailSubject = generateEmailSubject(data.reminderData);

    // For now, just log the email content (replace with actual email sending)
    console.log('📄 Email Subject:', emailSubject);
    console.log('📄 Email HTML length:', emailHtml.length);
    console.log('📊 Email data:', {
      email: data.email,
      totalReminders: data.reminderData.totalReminders,
      pendingReminders: data.reminderData.pendingReminders,
      plantsCount: data.reminderData.plants.length,
      eventTypes: Object.keys(data.reminderData.eventTypeSummary),
    });

    // TODO: Replace with actual email sending logic
    // Examples:
    // - Send via SendGrid API
    // - Send via AWS SES
    // - Send via Resend
    // - Send via Nodemailer

    // Example with Resend (uncomment when ready):
    /*
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
      to: data.email,
      subject: emailSubject,
      html: emailHtml,
    });
    */

    console.log(`✅ Email would be sent to ${data.email} (currently just logging)`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${data.email}:`, error);
    throw error;
  }
}

function generateEmailSubject(reminderData: RemindersByDay): string {
  const { pendingReminders } = reminderData;

  if (pendingReminders === 0) {
    return "🌱 All your plants are up to date!";
  } else if (pendingReminders === 1) {
    return "🌱 1 plant needs your attention today";
  } else {
    return `🌱 ${pendingReminders} plants need your attention today`;
  }
}

function generateReminderEmailHtml(data: ReminderEmailData): string {
  const { reminderData, userInfo } = data;

  // Generate summary text
  const eventTypeSummary = Object.values(reminderData.eventTypeSummary);
  let summaryText = '';

  if (eventTypeSummary.length === 1) {
    const eventType = eventTypeSummary[0];
    const pendingCount = eventType.total - eventType.completed;
    summaryText = pendingCount > 0
      ? `${pendingCount} plant${pendingCount > 1 ? 's' : ''} might need ${eventType.eventTypeName.toLowerCase()}`
      : 'All tasks completed!';
  } else {
    const eventSummaries = eventTypeSummary
      .map(et => {
        const pending = et.total - et.completed;
        return pending > 0 ? `${pending} ${et.eventTypeName.toLowerCase()}` : null;
      })
      .filter(Boolean);

    if (eventSummaries.length > 0) {
      summaryText = `Tasks needed: ${eventSummaries.join(', ')}`;
    } else {
      summaryText = 'All tasks completed!';
    }
  }

  // Generate plant cards HTML
  const plantCardsHtml = reminderData.plants
    .map(plant => generatePlantCardHtml(plant))
    .join('');

  // Simple HTML email template (can be replaced with MJML)
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Plant Care Reminders</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #22c55e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .summary { background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #22c55e; }
    .plant-card { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .plant-header { display: flex; align-items: center; margin-bottom: 10px; }
    .plant-image { width: 50px; height: 50px; border-radius: 6px; object-fit: cover; margin-right: 15px; background: #f3f4f6; }
    .plant-name { font-size: 18px; font-weight: bold; color: #111; }
    .event-tag { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 2px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    .overdue { color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🌱 Daily Plant Care</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Your plants need attention today</p>
    </div>
    
    <div class="content">
      <div class="summary">
        <h2 style="margin: 0 0 10px 0; color: #111;">Today's Summary</h2>
        <p style="margin: 0; font-size: 16px;">${summaryText}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
          ${reminderData.pendingReminders} of ${reminderData.totalReminders} tasks remaining
        </p>
      </div>
      
      ${plantCardsHtml}
      
      <div class="footer">
        <p>This reminder was sent at ${userInfo.notificationTime} in your timezone (${userInfo.timezone})</p>
        <p>Manage your notification settings in the app</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generatePlantCardHtml(plant: RemindersByDay['plants'][0]): string {
  const eventsHtml = plant.events
    .map(event => {
      const style = `background-color: ${event.eventTypeColor}20; color: ${event.eventTypeColor}; border: 1px solid ${event.eventTypeColor}40;`;
      const overdueText = event.isOverdue ? ' (overdue)' : '';
      const completedText = event.isCompleted ? ' ✓' : '';

      return `<span class="event-tag" style="${style}">
        ${event.eventTypeName}${completedText}${overdueText}
      </span>`;
    })
    .join('');

  const imageHtml = plant.plantPhotoUrl
    ? `<img src="${plant.plantPhotoUrl}" alt="${plant.plantName}" class="plant-image">`
    : `<div class="plant-image" style="display: flex; align-items: center; justify-content: center; font-size: 20px;">🌱</div>`;

  return `
    <div class="plant-card">
      <div class="plant-header">
        ${imageHtml}
        <div class="plant-name">${plant.plantName}</div>
      </div>
      <div>
        ${eventsHtml}
      </div>
    </div>`;
} 