import { db } from "../postgres-drizzle/database";
import { DrizzleNotificationReminderRepository } from "./drizzle-notification-reminder-repository";
import type { NotificationReminderRepository } from "@/core/repositories/notification-reminder-repository";

let repository: NotificationReminderRepository | null = null;

export function getNotificationReminderRepository(): NotificationReminderRepository {
  if (!repository) {
    repository = new DrizzleNotificationReminderRepository(db);
  }
  return repository;
} 