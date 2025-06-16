'use server'

import webpush, { PushSubscription } from 'web-push';
import { getAuthenticatedUserId } from './auth-helper';
import { createNotificationSubscriptionRepository } from '@/lib/repositories/notification-subscription-repository-factory'

webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_FROM}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface SubmitPushSubscriptionInput {
  sub: PushSubscription;
  deviceId: string;
}

interface SubmitPushUnsubscriptionInput {
  deviceId: string;
}

interface SendPushNotificationInput {
  message: string;
}

export async function submitPushSubscription(input: SubmitPushSubscriptionInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const repository = createNotificationSubscriptionRepository();

    // Check if subscription already exists for this user and endpoint
    const existingSubscription = await repository.findByUserIdAndEndpointAndDevice(
      userId,
      input.deviceId,
      input.sub.endpoint
    );

    if (existingSubscription) {
      await repository.deleteByUserIdAndEndpointAndDevice(userId, input.sub.endpoint, input.deviceId);
    }

    // Create new subscription
    await repository.create({
      userId: userId,
      endpoint: input.sub.endpoint,
      p256dh: input.sub.keys.p256dh,
      auth: input.sub.keys.auth,
      subscription: {
        endpoint: input.sub.endpoint,
        keys: {
          p256dh: input.sub.keys.p256dh,
          auth: input.sub.keys.auth,
        }
      },
      deviceId: input.deviceId
    });

    return [{ success: true }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to subscribe to push notifications'] as const;
  }
}

export async function submitPushUnsubscription(input: SubmitPushUnsubscriptionInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const repository = createNotificationSubscriptionRepository();

    // Remove all subscriptions for this user
    await repository.deleteByUserAndDevice(userId, input.deviceId);

    return [{ success: true }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to unsubscribe from push notifications'] as const;
  }
}

export async function checkPushSubscription(deviceId: string) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const repository = createNotificationSubscriptionRepository();
    const subscription = await repository.findByUserIdAndDevice(userId, deviceId);
    return [!!subscription, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to check push subscription'] as const;
  }
}

export async function sendPushNotification(input: SendPushNotificationInput) {
  "use server"

  try {
    const userId = await getAuthenticatedUserId();
    const repository = createNotificationSubscriptionRepository();
    const subscriptions = await repository.findByUserId(userId);

    if (subscriptions.length === 0) {
      return [null, 'No subscriptions available'] as const;
    }

    const results = [];

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          subscription.subscription,
          JSON.stringify({
            title: 'Grow Journal',
            body: input.message,
            url: 'https://grow-journal-tau.vercel.app/plants'
          })
        );
        results.push({ success: true, subscriptionId: subscription.id });
      } catch (error) {
        console.error('Error sending push notification:', error);
        results.push({
          success: false,
          error: 'Failed to send notification',
          subscriptionId: subscription.id
        });

        // If the subscription is invalid, remove it from the database
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        if (error instanceof Error && (error as any).statusCode! == 410) {
          await repository.deleteByEndpoint(subscription.endpoint);
        }
      }
    }

    return [{
      success: results.some(r => r.success),
      results
    }, null] as const;
  } catch (error) {
    return [null, error instanceof Error ? error.message : 'Failed to send push notification'] as const;
  }
}