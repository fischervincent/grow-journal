import { NotificationSubscription, NewNotificationSubscription } from "../domain/notification-subscription";

export interface NotificationSubscriptionRepository {
  create(subscription: NewNotificationSubscription): Promise<NotificationSubscription>;
  findByUserId(userId: string): Promise<NotificationSubscription[]>;
  findByEndpoint(endpoint: string): Promise<NotificationSubscription | null>;
  findByUserIdAndEndpointAndDevice(userId: string, endpoint: string, deviceId: string): Promise<NotificationSubscription | null>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByEndpoint(endpoint: string): Promise<void>;
  deleteByUserAndDevice(userId: string, deviceId: string): Promise<void>;
  deleteByEndpointAndDevice(endpoint: string, deviceId: string): Promise<void>;
  deleteByUserIdAndEndpointAndDevice(userId: string, endpoint: string, deviceId: string): Promise<void>;
} 