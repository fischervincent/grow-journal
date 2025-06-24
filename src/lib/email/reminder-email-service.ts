import { Resend } from 'resend';
import { render } from '@react-email/components';
import PlantCareReminderEmail from './plant-care-reminder-template';
import type { RemindersByDay } from '@/app/server-functions/get-reminders-by-day';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Generate email subject
    const emailSubject = generateEmailSubject(data.reminderData);

    // Render the React Email template to HTML
    const emailHtml = await render(
      PlantCareReminderEmail({
        reminderData: data.reminderData,
        userInfo: data.userInfo,
      })
    );

    // Verify Resend API key is available
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY environment variable not set');
      throw new Error('Email service not configured');
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Plant Care <grow-journal@resend.dev>',
      to: data.email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (result.error) {
      console.error(`❌ Resend error for ${data.email}:`, result.error);
      throw new Error(`Email sending failed: ${result.error.message}`);
    }

    console.log(`✅ Email sent successfully to ${data.email} (ID: ${result.data?.id})`);

    // Count unique plants with pending reminders for accurate logging
    const plantsWithPendingReminders = data.reminderData.plants.filter(plant =>
      plant.events.some(event => !event.isCompleted)
    ).length;

    console.log('📊 Email data:', {
      email: data.email,
      totalReminders: data.reminderData.totalReminders,
      pendingReminders: data.reminderData.pendingReminders,
      totalPlants: data.reminderData.plants.length,
      plantsWithPendingReminders: plantsWithPendingReminders,
      eventTypes: Object.keys(data.reminderData.eventTypeSummary),
    });

  } catch (error) {
    console.error(`❌ Failed to send email to ${data.email}:`, error);
    throw error;
  }
}

function generateEmailSubject(reminderData: RemindersByDay): string {
  const { pendingReminders } = reminderData;

  // Count unique plants that have pending (uncompleted) events
  const plantsWithPendingReminders = reminderData.plants.filter(plant =>
    plant.events.some(event => !event.isCompleted)
  ).length;

  if (pendingReminders === 0) {
    return "🌱 All your plants are up to date!";
  } else if (plantsWithPendingReminders === 1) {
    return "🌱 1 plant needs your attention today";
  } else {
    return `🌱 ${plantsWithPendingReminders} plants need your attention today`;
  }
} 