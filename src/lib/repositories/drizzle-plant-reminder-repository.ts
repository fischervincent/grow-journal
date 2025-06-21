import { and, eq, isNull, desc, lte, asc, gte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  plantReminderConfigs,
  plantReminders,
  plants,
  plantPhotos
} from "../postgres-drizzle/schema/plant-schema";
import { plantEventTypeReminderConfigs, plantEvents as plantEventTypes } from "../postgres-drizzle/schema/plant-event-type-schema";
import { plantEvents } from "../postgres-drizzle/schema/plant-events-schema";
import type {
  PlantReminderRepository,
  PlantReminderConfig,
  PlantEventTypeReminderConfig,
  PlantEventTypeWithConfigs,
  PlantReminder,
  CreatePlantReminderConfig,
  UpdatePlantReminderConfig,
  CreatePlantEventTypeReminderConfig,
  UpdatePlantEventTypeReminderConfig
} from "../../core/repositories/plant-reminder-repository";

export class DrizzlePlantReminderRepository implements PlantReminderRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  // Get all plants for a user with their photos for the reminder dialog
  async findUserPlantsWithPhotos(userId: string): Promise<Array<{
    id: string;
    name: string;
    mainPhotoUrl?: string;
    lastDateByEvents: Record<string, { lastDate: string; eventName: string }>;
  }>> {
    const userPlants = await this.db
      .select({
        plant: plants,
        photo: plantPhotos,
      })
      .from(plants)
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .where(
        and(
          eq(plants.userId, userId),
          isNull(plants.deletedAt)
        )
      )
      .orderBy(plants.name);

    return userPlants.map(({ plant, photo }) => ({
      id: plant.id,
      name: plant.name,
      mainPhotoUrl: photo?.url,
      lastDateByEvents: (plant.lastDateByEvents as Record<string, { lastDate: string; eventName: string }>) || {},
    }));
  }

  // Bulk create or update plant reminder configs
  async bulkUpsertPlantReminderConfigs(
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
  ): Promise<void> {
    // Process each plant setting
    for (const setting of settings) {
      // Check if config already exists
      const [existingConfig] = await this.db
        .select()
        .from(plantReminderConfigs)
        .where(
          and(
            eq(plantReminderConfigs.plantId, setting.plantId),
            eq(plantReminderConfigs.plantEventTypeId, plantEventTypeId),
            eq(plantReminderConfigs.userId, userId),
            isNull(plantReminderConfigs.deletedAt)
          )
        )
        .limit(1);

      if (existingConfig) {
        // Update existing config
        await this.db
          .update(plantReminderConfigs)
          .set({
            isEnabled: setting.isEnabled,
            useDefault: setting.useDefault,
            reminderType: setting.reminderType || 'fixed',
            intervalValue: setting.intervalValue || null,
            intervalUnit: setting.intervalUnit || null,
            updatedAt: new Date(),
          })
          .where(eq(plantReminderConfigs.id, existingConfig.id));
      } else if (setting.isEnabled) {
        // Create new config only if enabled
        await this.db.insert(plantReminderConfigs).values({
          plantId: setting.plantId,
          plantEventTypeId,
          userId,
          isEnabled: setting.isEnabled,
          useDefault: setting.useDefault,
          reminderType: setting.reminderType || 'fixed',
          intervalValue: setting.intervalValue || null,
          intervalUnit: setting.intervalUnit || null,
        });
      }

      // Only remove reminders if disabled (creation will be handled explicitly with custom dates)
      if (!setting.isEnabled) {
        await this.removeUpcomingReminders(setting.plantId, plantEventTypeId, userId);
      }
    }
  }

  // Calculate smart reminder interval based on plant event history
  async calculateSmartReminderInterval(plantId: string, plantEventTypeId: string, userId: string): Promise<{ intervalValue: number; intervalUnit: string } | null> {
    // Get the last 10 events for this plant and event type
    const recentEvents = await this.db
      .select({
        plantEventDateTime: plantEvents.plantEventDateTime,
      })
      .from(plantEvents)
      .where(
        and(
          eq(plantEvents.plantId, plantId),
          eq(plantEvents.plantEventTypeId, plantEventTypeId),
          eq(plantEvents.userId, userId)
        )
      )
      .orderBy(desc(plantEvents.plantEventDateTime))
      .limit(10);

    if (recentEvents.length < 2) {
      // Not enough data for smart calculation
      return null;
    }
    console.log('Recent events:', recentEvents);
    // Calculate intervals between consecutive events (in days)
    const intervals: number[] = [];
    for (let i = 0; i < recentEvents.length - 1; i++) {
      const current = new Date(recentEvents[i].plantEventDateTime);
      const next = new Date(recentEvents[i + 1].plantEventDateTime);
      const diffInMs = current.getTime() - next.getTime();
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
      if (diffInDays > 0) {
        intervals.push(diffInDays);
      }
    }
    console.log('Intervals:', intervals);
    if (intervals.length === 0) {
      return null;
    }

    // Analyze the pattern and calculate the recommended interval
    const recommendedDays = this.analyzeIntervalPattern(intervals);
    console.log('Recommended days:', recommendedDays);
    // Convert to appropriate unit
    return this.convertDaysToInterval(recommendedDays);
  }

  // Analyze interval pattern and return recommended days
  private analyzeIntervalPattern(intervals: number[]): number {
    if (intervals.length === 0) return 7; // Default fallback

    // Sort intervals to analyze distribution
    const sorted = [...intervals].sort((a, b) => a - b);
    const min = sorted[0];
    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    // Calculate spread (coefficient of variation)
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // If there's a clear trend (low variation), use the trend
    if (coefficientOfVariation < 0.3) {
      // Low variation - use the mean
      return Math.round(mean);
    }

    // High variation - be cautious and prefer shorter intervals
    // Check if there's a frequent shorter interval
    const frequencyMap = new Map<number, number>();
    intervals.forEach(interval => {
      const rounded = Math.round(interval);
      frequencyMap.set(rounded, (frequencyMap.get(rounded) || 0) + 1);
    });

    // Find the most frequent interval
    let mostFrequent = min;
    let maxFrequency = 0;
    frequencyMap.forEach((frequency, interval) => {
      if (frequency > maxFrequency || (frequency === maxFrequency && interval < mostFrequent)) {
        mostFrequent = interval;
        maxFrequency = frequency;
      }
    });

    // If the most frequent interval appears multiple times, use it
    if (maxFrequency > 1) {
      return mostFrequent;
    }

    // Otherwise, be cautious and use the minimum (prefer checking sooner)
    return min;
  }

  // Convert days to appropriate interval unit
  private convertDaysToInterval(days: number): { intervalValue: number; intervalUnit: string } {
    if (days <= 14) {
      return { intervalValue: days, intervalUnit: 'days' };
    } else if (days <= 60) {
      const weeks = Math.round(days / 7);
      return { intervalValue: weeks, intervalUnit: 'weeks' };
    } else if (days <= 365) {
      const months = Math.round(days / 30);
      return { intervalValue: months, intervalUnit: 'months' };
    } else {
      const years = Math.round(days / 365);
      return { intervalValue: years, intervalUnit: 'years' };
    }
  }

  // Generate next reminder instance for a plant
  async generateNextReminder(plantId: string, plantEventTypeId: string, userId: string): Promise<void> {
    // Get the effective reminder config for this plant
    const config = await this.getEffectiveReminderConfig(plantId, plantEventTypeId, userId);
    if (!config || !config.isEnabled) return;

    // Remove any existing upcoming reminders
    await this.removeUpcomingReminders(plantId, plantEventTypeId, userId);

    // Calculate next reminder date
    const nextDate = this.calculateNextReminderDate(
      config.effectiveIntervalValue,
      config.effectiveIntervalUnit
    );

    // Create the reminder
    await this.createPlantReminder(plantId, plantEventTypeId, nextDate, userId);
  }

  // Remove upcoming reminders for a plant/event type
  async removeUpcomingReminders(plantId: string, plantEventTypeId: string, userId: string): Promise<void> {
    await this.db
      .delete(plantReminders)
      .where(
        and(
          eq(plantReminders.plantId, plantId),
          eq(plantReminders.plantEventTypeId, plantEventTypeId),
          eq(plantReminders.userId, userId),
          eq(plantReminders.isCompleted, false)
        )
      );
  }

  // Get effective reminder config for a plant (custom or default)
  private async getEffectiveReminderConfig(plantId: string, plantEventTypeId: string, userId: string) {
    const configs = await this.findPlantReminderConfigs(plantId, userId);
    return configs.find(c => c.plantEventTypeId === plantEventTypeId);
  }

  // Calculate next reminder date based on interval
  private calculateNextReminderDate(intervalValue: number, intervalUnit: string): Date {
    const now = new Date();
    const nextDate = new Date(now);

    switch (intervalUnit) {
      case 'days':
        nextDate.setDate(now.getDate() + intervalValue);
        break;
      case 'weeks':
        nextDate.setDate(now.getDate() + (intervalValue * 7));
        break;
      case 'months':
        nextDate.setMonth(now.getMonth() + intervalValue);
        break;
      case 'years':
        nextDate.setFullYear(now.getFullYear() + intervalValue);
        break;
    }

    return nextDate;
  }

  async findPlantReminderConfigs(plantId: string, userId: string): Promise<PlantReminderConfig[]> {
    // Get all plant event types for this user
    const eventTypes = await this.db
      .select()
      .from(plantEventTypes)
      .where(eq(plantEventTypes.userId, userId));

    // Get existing plant reminder configs
    const customConfigs = await this.db
      .select({
        config: plantReminderConfigs,
        eventType: plantEventTypes,
      })
      .from(plantReminderConfigs)
      .innerJoin(plantEventTypes, eq(plantReminderConfigs.plantEventTypeId, plantEventTypes.id))
      .where(
        and(
          eq(plantReminderConfigs.plantId, plantId),
          eq(plantReminderConfigs.userId, userId),
          isNull(plantReminderConfigs.deletedAt)
        )
      );

    // Get default configs for all event types
    const defaultConfigs = await this.db
      .select({
        config: plantEventTypeReminderConfigs,
        eventType: plantEventTypes,
      })
      .from(plantEventTypeReminderConfigs)
      .innerJoin(plantEventTypes, eq(plantEventTypeReminderConfigs.plantEventTypeId, plantEventTypes.id))
      .where(eq(plantEventTypeReminderConfigs.userId, userId));

    // Create a map of default configs by event type
    const defaultConfigMap = new Map(
      defaultConfigs.map(({ config, eventType }) => [eventType.id, { config, eventType }])
    );

    // Create a map of custom configs by event type
    const customConfigMap = new Map(
      customConfigs.map(({ config, eventType }) => [eventType.id, { config, eventType }])
    );

    // Build the result
    const result: PlantReminderConfig[] = [];

    for (const eventType of eventTypes) {
      const customConfig = customConfigMap.get(eventType.id);
      const defaultConfig = defaultConfigMap.get(eventType.id);

      if (customConfig) {
        // Use custom config
        const config = customConfig.config;

        result.push({
          id: config.id,
          plantId: config.plantId,
          plantEventTypeId: config.plantEventTypeId,
          plantEventTypeName: eventType.name,
          isEnabled: config.isEnabled,
          useDefault: config.useDefault,
          reminderType: config.reminderType || 'fixed',
          intervalValue: config.intervalValue,
          intervalUnit: config.intervalUnit,
          effectiveReminderType: config.useDefault && defaultConfig ? (defaultConfig.config.reminderType || 'fixed') : (config.reminderType || 'fixed'),
          effectiveIntervalValue: config.useDefault && defaultConfig ? defaultConfig.config.intervalValue : (config.intervalValue || 0),
          effectiveIntervalUnit: config.useDefault && defaultConfig ? defaultConfig.config.intervalUnit : (config.intervalUnit || 'months'),
          isCustom: !config.useDefault,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        });
      } else if (defaultConfig) {
        // Use default config (create virtual plant config)
        const config = defaultConfig.config;
        result.push({
          id: `default-${eventType.id}`, // virtual ID
          plantId,
          plantEventTypeId: eventType.id,
          plantEventTypeName: eventType.name,
          isEnabled: config.isEnabled,
          useDefault: true,
          reminderType: 'fixed',
          intervalValue: null,
          intervalUnit: null,
          effectiveReminderType: config.reminderType || 'fixed',
          effectiveIntervalValue: config.intervalValue,
          effectiveIntervalUnit: config.intervalUnit,
          isCustom: false,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        });
      }
    }

    return result;
  }

  async createPlantReminderConfig(config: CreatePlantReminderConfig, userId: string): Promise<PlantReminderConfig> {
    // Verify plant belongs to user
    const plant = await this.db
      .select()
      .from(plants)
      .where(and(eq(plants.id, config.plantId), eq(plants.userId, userId)))
      .limit(1);

    if (!plant.length) {
      throw new Error("Plant not found");
    }

    const [created] = await this.db.insert(plantReminderConfigs)
      .values({
        ...config,
        userId,
        useDefault: config.useDefault ?? true,
        reminderType: config.reminderType ?? 'fixed',
      })
      .returning();

    // Get the created config with event type name
    const [result] = await this.db
      .select({
        config: plantReminderConfigs,
        eventType: plantEventTypes,
      })
      .from(plantReminderConfigs)
      .innerJoin(plantEventTypes, eq(plantReminderConfigs.plantEventTypeId, plantEventTypes.id))
      .where(eq(plantReminderConfigs.id, created.id));

    // Get default config if using default
    let effectiveReminderType = result.config.reminderType || 'fixed';
    let effectiveIntervalValue = result.config.intervalValue || 0;
    let effectiveIntervalUnit = result.config.intervalUnit || 'months';

    if (result.config.useDefault) {
      const defaultConfig = await this.findPlantEventTypeReminderConfig(config.plantEventTypeId, userId);
      if (defaultConfig) {
        effectiveReminderType = defaultConfig.reminderType;
        effectiveIntervalValue = defaultConfig.intervalValue;
        effectiveIntervalUnit = defaultConfig.intervalUnit;
      }
    }

    return {
      id: result.config.id,
      plantId: result.config.plantId,
      plantEventTypeId: result.config.plantEventTypeId,
      plantEventTypeName: result.eventType.name,
      isEnabled: result.config.isEnabled,
      useDefault: result.config.useDefault,
      reminderType: result.config.reminderType || 'fixed',
      intervalValue: result.config.intervalValue,
      intervalUnit: result.config.intervalUnit,
      effectiveReminderType,
      effectiveIntervalValue,
      effectiveIntervalUnit,
      isCustom: !result.config.useDefault,
      createdAt: result.config.createdAt,
      updatedAt: result.config.updatedAt,
    };
  }

  async updatePlantReminderConfig(configId: string, updates: UpdatePlantReminderConfig, userId: string): Promise<PlantReminderConfig> {
    const [updated] = await this.db
      .update(plantReminderConfigs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(plantReminderConfigs.id, configId),
          eq(plantReminderConfigs.userId, userId),
          isNull(plantReminderConfigs.deletedAt)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Plant reminder config not found");
    }

    // Get the updated config with event type name
    const [result] = await this.db
      .select({
        config: plantReminderConfigs,
        eventType: plantEventTypes,
      })
      .from(plantReminderConfigs)
      .innerJoin(plantEventTypes, eq(plantReminderConfigs.plantEventTypeId, plantEventTypes.id))
      .where(eq(plantReminderConfigs.id, updated.id));

    // Get effective values
    let effectiveReminderType = result.config.reminderType || 'fixed';
    let effectiveIntervalValue = result.config.intervalValue || 0;
    let effectiveIntervalUnit = result.config.intervalUnit || 'months';

    if (result.config.useDefault) {
      const defaultConfig = await this.findPlantEventTypeReminderConfig(result.config.plantEventTypeId, userId);
      if (defaultConfig) {
        effectiveReminderType = defaultConfig.reminderType;
        effectiveIntervalValue = defaultConfig.intervalValue;
        effectiveIntervalUnit = defaultConfig.intervalUnit;
      }
    }

    return {
      id: result.config.id,
      plantId: result.config.plantId,
      plantEventTypeId: result.config.plantEventTypeId,
      plantEventTypeName: result.eventType.name,
      isEnabled: result.config.isEnabled,
      useDefault: result.config.useDefault,
      reminderType: result.config.reminderType || 'fixed',
      intervalValue: result.config.intervalValue,
      intervalUnit: result.config.intervalUnit,
      effectiveReminderType,
      effectiveIntervalValue,
      effectiveIntervalUnit,
      isCustom: !result.config.useDefault,
      createdAt: result.config.createdAt,
      updatedAt: result.config.updatedAt,
    };
  }

  async deletePlantReminderConfig(configId: string, userId: string): Promise<void> {
    await this.db
      .update(plantReminderConfigs)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(plantReminderConfigs.id, configId),
          eq(plantReminderConfigs.userId, userId),
          isNull(plantReminderConfigs.deletedAt)
        )
      );
  }

  async findPlantEventTypeReminderConfig(plantEventTypeId: string, userId: string): Promise<PlantEventTypeReminderConfig | null> {
    const [result] = await this.db
      .select({
        config: plantEventTypeReminderConfigs,
        eventType: plantEventTypes,
      })
      .from(plantEventTypeReminderConfigs)
      .innerJoin(plantEventTypes, eq(plantEventTypeReminderConfigs.plantEventTypeId, plantEventTypes.id))
      .where(
        and(
          eq(plantEventTypeReminderConfigs.plantEventTypeId, plantEventTypeId),
          eq(plantEventTypeReminderConfigs.userId, userId)
        )
      )
      .limit(1);

    if (!result) return null;

    return {
      id: result.config.id,
      plantEventTypeId: result.config.plantEventTypeId,
      plantEventTypeName: result.eventType.name,
      isEnabled: result.config.isEnabled,
      reminderType: result.config.reminderType || 'fixed',
      intervalValue: result.config.intervalValue,
      intervalUnit: result.config.intervalUnit,
      createdAt: result.config.createdAt,
      updatedAt: result.config.updatedAt,
    };
  }

  async createPlantEventTypeReminderConfig(config: CreatePlantEventTypeReminderConfig, userId: string): Promise<PlantEventTypeReminderConfig> {
    const [created] = await this.db.insert(plantEventTypeReminderConfigs)
      .values({
        ...config,
        userId,
      })
      .returning();

    const [result] = await this.db
      .select({
        config: plantEventTypeReminderConfigs,
        eventType: plantEventTypes,
      })
      .from(plantEventTypeReminderConfigs)
      .innerJoin(plantEventTypes, eq(plantEventTypeReminderConfigs.plantEventTypeId, plantEventTypes.id))
      .where(eq(plantEventTypeReminderConfigs.id, created.id));

    return {
      id: result.config.id,
      plantEventTypeId: result.config.plantEventTypeId,
      plantEventTypeName: result.eventType.name,
      isEnabled: result.config.isEnabled,
      reminderType: result.config.reminderType || 'fixed',
      intervalValue: result.config.intervalValue,
      intervalUnit: result.config.intervalUnit,
      createdAt: result.config.createdAt,
      updatedAt: result.config.updatedAt,
    };
  }

  async updatePlantEventTypeReminderConfig(configId: string, updates: UpdatePlantEventTypeReminderConfig, userId: string): Promise<PlantEventTypeReminderConfig> {
    const [updated] = await this.db
      .update(plantEventTypeReminderConfigs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(plantEventTypeReminderConfigs.id, configId),
          eq(plantEventTypeReminderConfigs.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Plant event type reminder config not found");
    }

    const [result] = await this.db
      .select({
        config: plantEventTypeReminderConfigs,
        eventType: plantEventTypes,
      })
      .from(plantEventTypeReminderConfigs)
      .innerJoin(plantEventTypes, eq(plantEventTypeReminderConfigs.plantEventTypeId, plantEventTypes.id))
      .where(eq(plantEventTypeReminderConfigs.id, updated.id));

    return {
      id: result.config.id,
      plantEventTypeId: result.config.plantEventTypeId,
      plantEventTypeName: result.eventType.name,
      isEnabled: result.config.isEnabled,
      reminderType: result.config.reminderType || 'fixed',
      intervalValue: result.config.intervalValue,
      intervalUnit: result.config.intervalUnit,
      createdAt: result.config.createdAt,
      updatedAt: result.config.updatedAt,
    };
  }

  async deletePlantEventTypeReminderConfig(configId: string, userId: string): Promise<void> {
    await this.db
      .delete(plantEventTypeReminderConfigs)
      .where(
        and(
          eq(plantEventTypeReminderConfigs.id, configId),
          eq(plantEventTypeReminderConfigs.userId, userId)
        )
      );
  }

  async findPlantEventTypeWithConfigs(plantEventTypeId: string, userId: string): Promise<PlantEventTypeWithConfigs | null> {
    // Get the plant event type
    const [eventType] = await this.db
      .select()
      .from(plantEventTypes)
      .where(
        and(
          eq(plantEventTypes.id, plantEventTypeId),
          eq(plantEventTypes.userId, userId)
        )
      )
      .limit(1);

    if (!eventType) return null;

    // Get default config
    const defaultConfig = await this.findPlantEventTypeReminderConfig(plantEventTypeId, userId);

    // Get all plant configs for this event type
    const plantConfigs = await this.db
      .select({
        config: plantReminderConfigs,
        plant: plants,
      })
      .from(plantReminderConfigs)
      .innerJoin(plants, eq(plantReminderConfigs.plantId, plants.id))
      .where(
        and(
          eq(plantReminderConfigs.plantEventTypeId, plantEventTypeId),
          eq(plantReminderConfigs.userId, userId),
          isNull(plantReminderConfigs.deletedAt),
          isNull(plants.deletedAt)
        )
      );

    // Build plant configs with effective values
    const plantConfigsWithEffectiveValues = await Promise.all(
      plantConfigs.map(async ({ config, plant }) => {
        let effectiveReminderType = config.reminderType || 'fixed';
        let effectiveIntervalValue = config.intervalValue || 0;
        let effectiveIntervalUnit = config.intervalUnit || 'months';

        if (config.useDefault && defaultConfig) {
          effectiveReminderType = defaultConfig.reminderType;
          effectiveIntervalValue = defaultConfig.intervalValue;
          effectiveIntervalUnit = defaultConfig.intervalUnit;
        }

        return {
          plantId: plant.id,
          plantName: plant.name,
          config: {
            id: config.id,
            plantId: config.plantId,
            plantEventTypeId: config.plantEventTypeId,
            plantEventTypeName: eventType.name,
            isEnabled: config.isEnabled,
            useDefault: config.useDefault,
            reminderType: config.reminderType || 'fixed',
            intervalValue: config.intervalValue,
            intervalUnit: config.intervalUnit,
            effectiveReminderType,
            effectiveIntervalValue,
            effectiveIntervalUnit,
            isCustom: !config.useDefault,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
          },
        };
      })
    );

    return {
      plantEventTypeId: eventType.id,
      plantEventTypeName: eventType.name,
      defaultConfig,
      plantConfigs: plantConfigsWithEffectiveValues,
    };
  }

  async findPlantReminders(userId: string, filters?: { plantId?: string; completed?: boolean; due?: boolean }): Promise<PlantReminder[]> {
    const conditions = [
      eq(plantReminders.userId, userId),
    ];

    if (filters?.plantId) {
      conditions.push(eq(plantReminders.plantId, filters.plantId));
    }

    if (filters?.completed !== undefined) {
      conditions.push(eq(plantReminders.isCompleted, filters.completed));
    }

    if (filters?.due) {
      conditions.push(lte(plantReminders.scheduledAt, new Date()));
    }

    const results = await this.db
      .select({
        reminder: plantReminders,
        plant: plants,
        plantEvent: plantEvents,
      })
      .from(plantReminders)
      .innerJoin(plants, eq(plantReminders.plantId, plants.id))
      .innerJoin(plantEvents, eq(plantReminders.plantEventTypeId, plantEvents.id))
      .where(and(...conditions))
      .orderBy(desc(plantReminders.scheduledAt));

    return results.map(row => ({
      id: row.reminder.id,
      plantId: row.reminder.plantId,
      plantEventTypeId: row.reminder.plantEventTypeId,
      scheduledAt: row.reminder.scheduledAt,
      isCompleted: row.reminder.isCompleted,
      completedAt: row.reminder.completedAt,
      isSnoozed: row.reminder.isSnoozed,
      snoozedUntil: row.reminder.snoozedUntil,
      createdAt: row.reminder.createdAt,
      updatedAt: row.reminder.updatedAt,
    }));
  }

  async findPlantRemindersByEventType(plantEventTypeId: string, userId: string): Promise<Array<PlantReminder & { plantName: string }>> {
    const results = await this.db
      .select({
        reminder: plantReminders,
        plant: plants,
      })
      .from(plantReminders)
      .innerJoin(plants, eq(plantReminders.plantId, plants.id))
      .where(and(
        eq(plantReminders.plantEventTypeId, plantEventTypeId),
        eq(plantReminders.userId, userId),
        eq(plantReminders.isCompleted, false)
      ))
      .orderBy(asc(plantReminders.scheduledAt));

    return results.map(row => ({
      id: row.reminder.id,
      plantId: row.reminder.plantId,
      plantEventTypeId: row.reminder.plantEventTypeId,
      scheduledAt: row.reminder.scheduledAt,
      isCompleted: row.reminder.isCompleted,
      completedAt: row.reminder.completedAt,
      isSnoozed: row.reminder.isSnoozed,
      snoozedUntil: row.reminder.snoozedUntil,
      createdAt: row.reminder.createdAt,
      updatedAt: row.reminder.updatedAt,
      plantName: row.plant.name,
    }));
  }

  async createPlantReminder(plantId: string, plantEventTypeId: string, scheduledAt: Date, userId: string): Promise<PlantReminder> {
    const [created] = await this.db.insert(plantReminders)
      .values({
        plantId,
        plantEventTypeId,
        userId,
        scheduledAt,
        isCompleted: false,
        isSnoozed: false,
      })
      .returning();

    return {
      id: created.id,
      plantId: created.plantId,
      plantEventTypeId: created.plantEventTypeId,
      scheduledAt: created.scheduledAt,
      isCompleted: created.isCompleted,
      completedAt: created.completedAt,
      isSnoozed: created.isSnoozed,
      snoozedUntil: created.snoozedUntil,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateReminderScheduledDate(reminderId: string, scheduledAt: Date, userId: string): Promise<PlantReminder> {
    const [updated] = await this.db
      .update(plantReminders)
      .set({
        scheduledAt,
        updatedAt: new Date(),
      })
      .where(and(
        eq(plantReminders.id, reminderId),
        eq(plantReminders.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new Error('Reminder not found or access denied');
    }

    return {
      id: updated.id,
      plantId: updated.plantId,
      plantEventTypeId: updated.plantEventTypeId,
      scheduledAt: updated.scheduledAt,
      isCompleted: updated.isCompleted,
      completedAt: updated.completedAt,
      isSnoozed: updated.isSnoozed,
      snoozedUntil: updated.snoozedUntil,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteReminder(reminderId: string, userId: string): Promise<void> {
    await this.db
      .delete(plantReminders)
      .where(and(
        eq(plantReminders.id, reminderId),
        eq(plantReminders.userId, userId)
      ));
  }

  async deleteRemindersByPlantAndEventType(plantId: string, eventTypeId: string, userId: string): Promise<void> {
    await this.db
      .delete(plantReminders)
      .where(and(
        eq(plantReminders.plantId, plantId),
        eq(plantReminders.plantEventTypeId, eventTypeId),
        eq(plantReminders.userId, userId)
      ));
  }

  async completeReminder(reminderId: string, userId: string): Promise<PlantReminder> {
    const [updated] = await this.db
      .update(plantReminders)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(plantReminders.id, reminderId),
          eq(plantReminders.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Plant reminder not found");
    }

    return {
      id: updated.id,
      plantId: updated.plantId,
      plantEventTypeId: updated.plantEventTypeId,
      scheduledAt: updated.scheduledAt,
      isCompleted: updated.isCompleted,
      completedAt: updated.completedAt,
      isSnoozed: updated.isSnoozed,
      snoozedUntil: updated.snoozedUntil,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async snoozeReminder(reminderId: string, snoozedUntil: Date, userId: string): Promise<PlantReminder> {
    const [updated] = await this.db
      .update(plantReminders)
      .set({
        isSnoozed: true,
        snoozedUntil,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(plantReminders.id, reminderId),
          eq(plantReminders.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Plant reminder not found");
    }

    return {
      id: updated.id,
      plantId: updated.plantId,
      plantEventTypeId: updated.plantEventTypeId,
      scheduledAt: updated.scheduledAt,
      isCompleted: updated.isCompleted,
      completedAt: updated.completedAt,
      isSnoozed: updated.isSnoozed,
      snoozedUntil: updated.snoozedUntil,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Find plant reminders with details for the reminders page
  async findPlantRemindersWithDetails(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<PlantReminder & {
    plantName: string;
    plantSlug: string;
    plantPhotoUrl?: string;
    eventTypeName: string;
    eventTypeColor: string;
  }>> {
    const results = await this.db
      .select({
        reminder: plantReminders,
        plant: plants,
        eventType: plantEventTypes,
        photo: plantPhotos,
      })
      .from(plantReminders)
      .innerJoin(plants, eq(plantReminders.plantId, plants.id))
      .innerJoin(plantEventTypes, eq(plantReminders.plantEventTypeId, plantEventTypes.id))
      .leftJoin(plantPhotos, eq(plants.mainPhotoId, plantPhotos.id))
      .where(
        and(
          eq(plantReminders.userId, userId),
          gte(plantReminders.scheduledAt, startDate),
          lte(plantReminders.scheduledAt, endDate),
          isNull(plants.deletedAt)
        )
      )
      .orderBy(plantReminders.scheduledAt);

    return results.map(({ reminder, plant, eventType, photo }) => ({
      id: reminder.id,
      plantId: reminder.plantId,
      plantEventTypeId: reminder.plantEventTypeId,
      scheduledAt: reminder.scheduledAt,
      isCompleted: reminder.isCompleted,
      completedAt: reminder.completedAt,
      isSnoozed: reminder.isSnoozed,
      snoozedUntil: reminder.snoozedUntil,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      plantName: plant.name,
      plantSlug: plant.slug,
      plantPhotoUrl: photo?.url,
      eventTypeName: eventType.name,
      eventTypeColor: eventType.displayColor,
    }));
  }
} 