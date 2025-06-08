import { NotificationSubscription, NewNotificationSubscription } from "../domain/notification-subscription";

export interface NotificationSubscriptionRepository {
  create(subscription: NewNotificationSubscription): Promise<NotificationSubscription>;
  findByUserId(userId: string): Promise<NotificationSubscription[]>;
  findByEndpoint(endpoint: string): Promise<NotificationSubscription | null>;
  findByUserIdAndEndpoint(userId: string, endpoint: string): Promise<NotificationSubscription | null>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByEndpoint(endpoint: string): Promise<void>;
  deleteByUserIdAndEndpoint(userId: string, endpoint: string): Promise<void>;
} 