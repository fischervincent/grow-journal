export interface PlantReminderConfig {
  id: string;
  plantId: string;
  plantEventTypeId: string;
  plantEventTypeName: string;
  isEnabled: boolean;
  useDefault: boolean;
  reminderType: string; // 'fixed' or 'smart'
  intervalValue: number | null;
  intervalUnit: string | null;
  effectiveReminderType: string; // The actual type being used (custom or default)
  effectiveIntervalValue: number; // The actual value being used (custom or default)
  effectiveIntervalUnit: string; // The actual unit being used (custom or default)
  isCustom: boolean; // true if using custom config, false if using default
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantEventTypeReminderConfig {
  id: string;
  plantEventTypeId: string;
  plantEventTypeName: string;
  isEnabled: boolean;
  reminderType: string; // 'fixed' or 'smart'
  intervalValue: number;
  intervalUnit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantEventTypeWithConfigs {
  plantEventTypeId: string;
  plantEventTypeName: string;
  defaultConfig: PlantEventTypeReminderConfig | null;
  plantConfigs: Array<{
    plantId: string;
    plantName: string;
    config: PlantReminderConfig;
  }>;
}

export interface PlantReminder {
  id: string;
  plantId: string;
  plantEventTypeId: string;
  scheduledAt: Date;
  isCompleted: boolean;
  completedAt: Date | null;
  isSnoozed: boolean;
  snoozedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlantReminderConfig {
  plantId: string;
  plantEventTypeId: string;
  isEnabled: boolean;
  useDefault?: boolean;
  reminderType?: string;
  intervalValue?: number;
  intervalUnit?: string;
}

export interface UpdatePlantReminderConfig {
  isEnabled?: boolean;
  useDefault?: boolean;
  reminderType?: string;
  intervalValue?: number;
  intervalUnit?: string;
}

export interface CreatePlantEventTypeReminderConfig {
  plantEventTypeId: string;
  isEnabled: boolean;
  reminderType: string;
  intervalValue: number;
  intervalUnit: string;
}

export interface UpdatePlantEventTypeReminderConfig {
  isEnabled?: boolean;
  reminderType?: string;
  intervalValue?: number;
  intervalUnit?: string;
}

export interface PlantReminderRepository {
  // Plant data methods
  findUserPlantsWithPhotos(userId: string): Promise<Array<{
    id: string;
    name: string;
    mainPhotoUrl?: string;
  }>>;

  // Bulk operations
  bulkUpsertPlantReminderConfigs(
    plantEventTypeId: string,
    settings: Array<{
      plantId: string;
      isEnabled: boolean;
      useDefault: boolean;
      reminderType?: string;
      intervalValue?: number;
      intervalUnit?: string;
    }>,
    userId: string
  ): Promise<void>;

  // Plant-specific reminder configs
  findPlantReminderConfigs(plantId: string, userId: string): Promise<PlantReminderConfig[]>;
  createPlantReminderConfig(config: CreatePlantReminderConfig, userId: string): Promise<PlantReminderConfig>;
  updatePlantReminderConfig(configId: string, updates: UpdatePlantReminderConfig, userId: string): Promise<PlantReminderConfig>;
  deletePlantReminderConfig(configId: string, userId: string): Promise<void>;

  // Plant event type default configs
  findPlantEventTypeReminderConfig(plantEventTypeId: string, userId: string): Promise<PlantEventTypeReminderConfig | null>;
  createPlantEventTypeReminderConfig(config: CreatePlantEventTypeReminderConfig, userId: string): Promise<PlantEventTypeReminderConfig>;
  updatePlantEventTypeReminderConfig(configId: string, updates: UpdatePlantEventTypeReminderConfig, userId: string): Promise<PlantEventTypeReminderConfig>;
  deletePlantEventTypeReminderConfig(configId: string, userId: string): Promise<void>;

  // Overview for plant event types
  findPlantEventTypeWithConfigs(plantEventTypeId: string, userId: string): Promise<PlantEventTypeWithConfigs | null>;

  // Reminder instances
  findPlantReminders(userId: string, filters?: { plantId?: string; completed?: boolean; due?: boolean }): Promise<PlantReminder[]>;
  findPlantRemindersByEventType(plantEventTypeId: string, userId: string): Promise<Array<PlantReminder & { plantName: string }>>;
  createPlantReminder(plantId: string, plantEventTypeId: string, scheduledAt: Date, userId: string): Promise<PlantReminder>;
  updateReminderScheduledDate(reminderId: string, scheduledAt: Date, userId: string): Promise<PlantReminder>;
  deleteReminder(reminderId: string, userId: string): Promise<void>;
  completeReminder(reminderId: string, userId: string): Promise<PlantReminder>;
  snoozeReminder(reminderId: string, snoozedUntil: Date, userId: string): Promise<PlantReminder>;

  // Smart reminder calculation
  calculateSmartReminderInterval(plantId: string, plantEventTypeId: string, userId: string): Promise<{ intervalValue: number; intervalUnit: string } | null>;
} 