import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { notificationSubscriptions } from "../postgres-drizzle/schema/notification-subscription-schema";
import type { NotificationSubscriptionRepository } from "../../core/repositories/notification-subscription-repository";
import { NotificationSubscription, NewNotificationSubscription, BrowserPushSubscription } from "@/core/domain/notification-subscription";

const mapSubscriptionFromDB = (subscriptionInDB: typeof notificationSubscriptions.$inferSelect): NotificationSubscription => {
  return {
    id: subscriptionInDB.id,
    userId: subscriptionInDB.userId,
    endpoint: subscriptionInDB.endpoint,
    p256dh: subscriptionInDB.p256dh,
    auth: subscriptionInDB.auth,
    subscription: subscriptionInDB.subscription as BrowserPushSubscription,
    createdAt: subscriptionInDB.createdAt,
    updatedAt: subscriptionInDB.updatedAt,
  };
};

export class DrizzleNotificationSubscriptionRepository implements NotificationSubscriptionRepository {
  constructor(private readonly db: PostgresJsDatabase) { }

  async create(subscription: NewNotificationSubscription): Promise<NotificationSubscription> {
    const [createdSubscription] = await this.db.insert(notificationSubscriptions)
      .values(subscription)
      .returning();
    return mapSubscriptionFromDB(createdSubscription);
  }

  async findByUserId(userId: string): Promise<NotificationSubscription[]> {
    const subscriptions = await this.db.select()
      .from(notificationSubscriptions)
      .where(eq(notificationSubscriptions.userId, userId))
      .orderBy(notificationSubscriptions.createdAt);

    return subscriptions.map(mapSubscriptionFromDB);
  }

  async findByEndpoint(endpoint: string): Promise<NotificationSubscription | null> {
    const [subscription] = await this.db.select()
      .from(notificationSubscriptions)
      .where(eq(notificationSubscriptions.endpoint, endpoint))
      .limit(1);

    return subscription ? mapSubscriptionFromDB(subscription) : null;
  }

  async findByUserIdAndEndpoint(userId: string, endpoint: string): Promise<NotificationSubscription | null> {
    const [subscription] = await this.db.select()
      .from(notificationSubscriptions)
      .where(
        and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);

    return subscription ? mapSubscriptionFromDB(subscription) : null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(notificationSubscriptions)
      .where(eq(notificationSubscriptions.userId, userId));
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.db.delete(notificationSubscriptions)
      .where(eq(notificationSubscriptions.endpoint, endpoint));
  }

  async deleteByUserIdAndEndpoint(userId: string, endpoint: string): Promise<void> {
    await this.db.delete(notificationSubscriptions)
      .where(
        and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.endpoint, endpoint)
        )
      );
  }
} 