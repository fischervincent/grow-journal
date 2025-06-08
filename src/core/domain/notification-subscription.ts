// Browser PushSubscription interface 
export interface BrowserPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  subscription: BrowserPushSubscription; // The full PushSubscription object
  createdAt: Date;
  updatedAt: Date;
}

export interface NewNotificationSubscription {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  subscription: BrowserPushSubscription;
} 