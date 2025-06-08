import { db } from "../postgres-drizzle/database";
import { DrizzleNotificationSubscriptionRepository } from "./drizzle-notification-subscription-repository";

export const createNotificationSubscriptionRepository = () => {
  return new DrizzleNotificationSubscriptionRepository(db);
}; 