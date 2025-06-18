"use server";

import { getAuthenticatedUserId } from "./auth-helper";
import { getNotificationSettingsRepository } from "@/lib/repositories/notification-settings-repository-factory";
import type { CreateNotificationSettings, UpdateNotificationSettings } from "@/core/repositories/notification-settings-repository";

export async function getNotificationSettings() {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getNotificationSettingsRepository();

    const settings = await repository.findByUserId(userId);

    // Return default settings if none exist
    if (!settings) {
      return [{
        enabled: false,
        pushEnabled: false,
        emailEnabled: false,
        notificationTime: "09:00",
        timezone: "UTC",
      }, null] as const;
    }

    return [settings, null] as const;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return [null, error instanceof Error ? error.message : 'Failed to get notification settings'] as const;
  }
}

export async function createNotificationSettings(settings: CreateNotificationSettings) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getNotificationSettingsRepository();

    const created = await repository.create(settings, userId);

    return [created, null] as const;
  } catch (error) {
    console.error('Error creating notification settings:', error);
    return [null, error instanceof Error ? error.message : 'Failed to create notification settings'] as const;
  }
}

export async function updateNotificationSettings(updates: UpdateNotificationSettings) {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getNotificationSettingsRepository();

    // Check if settings exist
    const existing = await repository.findByUserId(userId);

    let result;
    if (!existing) {
      // Create new settings with defaults + updates
      const defaultSettings: CreateNotificationSettings = {
        enabled: false,
        pushEnabled: false,
        emailEnabled: false,
        notificationTime: "09:00",
        timezone: "UTC",
        ...updates,
      };
      result = await repository.create(defaultSettings, userId);
    } else {
      // Update existing settings
      result = await repository.update(userId, updates);
    }

    return [result, null] as const;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return [null, error instanceof Error ? error.message : 'Failed to update notification settings'] as const;
  }
}

export async function deleteNotificationSettings() {
  try {
    const userId = await getAuthenticatedUserId();
    const repository = getNotificationSettingsRepository();

    await repository.delete(userId);

    return [true, null] as const;
  } catch (error) {
    console.error('Error deleting notification settings:', error);
    return [null, error instanceof Error ? error.message : 'Failed to delete notification settings'] as const;
  }
} 