import { DrizzleNotificationSettingsRepository } from "./drizzle-notification-settings-repository";
import { db } from "../postgres-drizzle/database";
import type { NotificationSettingsRepository } from "../../core/repositories/notification-settings-repository";

export function getNotificationSettingsRepository(): NotificationSettingsRepository {
  return new DrizzleNotificationSettingsRepository(db);
} 