import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Column,
} from "@react-email/components";
import type { RemindersByDay } from "@/app/server-functions/get-reminders-by-day";

interface PlantCareReminderEmailProps {
  reminderData: RemindersByDay;
  userInfo: {
    timezone: string;
    notificationTime: string;
  };
}

export default function PlantCareReminderEmail({
  reminderData,
  userInfo,
}: PlantCareReminderEmailProps) {
  // Base URL for the application
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Generate preview text
  const previewText =
    reminderData.pendingReminders === 1
      ? "1 plant needs your attention today"
      : `${reminderData.pendingReminders} plants need your attention today`;

  // Generate summary text
  const eventTypeSummary = Object.values(reminderData.eventTypeSummary);
  let summaryText = "";

  if (eventTypeSummary.length === 1) {
    const eventType = eventTypeSummary[0];
    const pendingCount = eventType.total - eventType.completed;
    summaryText =
      pendingCount > 0
        ? `${pendingCount} plant${pendingCount > 1 ? "s" : ""} might need ${eventType.eventTypeName.toLowerCase()}`
        : "All tasks completed!";
  } else {
    const eventSummaries = eventTypeSummary
      .map((et) => {
        const pending = et.total - et.completed;
        return pending > 0
          ? `${pending} ${et.eventTypeName.toLowerCase()}`
          : null;
      })
      .filter(Boolean);

    if (eventSummaries.length > 0) {
      summaryText = `Tasks needed: ${eventSummaries.join(", ")}`;
    } else {
      summaryText = "All tasks completed!";
    }
  }

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Link href={`${baseUrl}/reminders`} style={headerLink}>
              <Text style={headerEmoji}>🌱</Text>
              <Heading style={headerTitle}>Daily Plant Care</Heading>
              <Text style={headerSubtitle}>
                Your plants need attention today
              </Text>
            </Link>
          </Section>

          {/* Summary Section */}
          <Section style={summarySection}>
            <Link href={`${baseUrl}/reminders`} style={summaryLink}>
              <Heading style={summaryTitle}>Today&apos;s Summary</Heading>
              <Text style={summaryTextStyle}>{summaryText}</Text>
              <Text style={summaryDetails}>
                {reminderData.pendingReminders} of {reminderData.totalReminders}{" "}
                tasks remaining
              </Text>
            </Link>
          </Section>

          {/* Plant Cards */}
          <Section style={plantsSection}>
            {reminderData.plants.map((plant) => (
              <Section key={plant.plantId} style={plantCard}>
                <Link
                  href={`${baseUrl}/plants/${plant.plantSlug}`}
                  style={plantLink}
                >
                  <Row>
                    <Column style={plantImageColumn}>
                      {plant.plantPhotoUrl ? (
                        <Img
                          src={plant.plantPhotoUrl}
                          alt={plant.plantName}
                          style={plantImage}
                        />
                      ) : (
                        <Text style={plantImagePlaceholder}>🌱</Text>
                      )}
                    </Column>
                    <Column style={plantInfoColumn}>
                      <Heading style={plantName}>{plant.plantName}</Heading>
                      <Section style={eventTagsSection}>
                        {plant.events.map((event) => (
                          <Text
                            key={event.reminderId}
                            style={{
                              ...eventTag,
                              backgroundColor: `${event.eventTypeColor}20`,
                              color: event.eventTypeColor,
                              border: `1px solid ${event.eventTypeColor}40`,
                            }}
                          >
                            {event.eventTypeName}
                            {event.isCompleted && " ✓"}
                            {event.isOverdue && " (overdue)"}
                          </Text>
                        ))}
                      </Section>
                    </Column>
                  </Row>
                </Link>
              </Section>
            ))}
          </Section>

          {/* Call to Action */}
          <Section style={ctaSection}>
            <Link href={`${baseUrl}/reminders`} style={ctaButton}>
              <Text style={ctaButtonText}>View All Reminders</Text>
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This reminder was sent at {userInfo.notificationTime} in your
              timezone ({userInfo.timezone})
            </Text>
            <Text style={footerText}>
              <Link href={`${baseUrl}/settings`} style={footerLink}>
                Manage your notification settings
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "48px",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#22c55e",
  borderRadius: "8px 8px 0 0",
  padding: "20px",
  textAlign: "center" as const,
};

const headerLink = {
  color: "#ffffff",
  textDecoration: "none",
  display: "block",
};

const headerEmoji = {
  fontSize: "32px",
  margin: "0 0 10px 0",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const headerSubtitle = {
  color: "#ffffff",
  fontSize: "16px",
  margin: "0",
  opacity: 0.9,
};

const summarySection = {
  backgroundColor: "#ffffff",
  padding: "0",
  borderLeft: "4px solid #22c55e",
  margin: "0 20px 20px 20px",
  borderRadius: "0 6px 6px 0",
};

const summaryLink = {
  color: "inherit",
  textDecoration: "none",
  display: "block",
  padding: "20px",
};

const summaryTitle = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const summaryTextStyle = {
  color: "#374151",
  fontSize: "16px",
  margin: "0 0 8px 0",
};

const summaryDetails = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
};

const plantsSection = {
  padding: "0 20px",
};

const plantCard = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "0",
  marginBottom: "15px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  border: "1px solid #e5e7eb",
};

const plantLink = {
  color: "inherit",
  textDecoration: "none",
  display: "block",
  padding: "15px",
};

const plantImageColumn = {
  width: "60px",
  verticalAlign: "top",
};

const plantImage = {
  width: "50px",
  height: "50px",
  borderRadius: "6px",
  objectFit: "cover" as const,
};

const plantImagePlaceholder = {
  width: "50px",
  height: "50px",
  borderRadius: "6px",
  backgroundColor: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  margin: "0",
};

const plantInfoColumn = {
  paddingLeft: "15px",
  verticalAlign: "top",
};

const plantName = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const eventTagsSection = {
  margin: "0",
};

const eventTag = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "500",
  margin: "2px 4px 2px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "30px 20px",
};

const ctaButton = {
  backgroundColor: "#22c55e",
  borderRadius: "6px",
  padding: "12px 24px",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
};

const ctaButtonText = {
  color: "#ffffff",
  fontSize: "16px",
  margin: "0",
};

const footer = {
  textAlign: "center" as const,
  margin: "20px 20px 0 20px",
  padding: "20px 0 0 0",
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 8px 0",
};

const footerLink = {
  color: "#22c55e",
  textDecoration: "underline",
};