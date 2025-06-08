'use server'

import webpush, { PushSubscription } from 'web-push'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createNotificationSubscriptionRepository } from '@/lib/repositories/notification-subscription-repository-factory'

webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_FROM}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function subscribeUser(sub: PushSubscription) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  const repository = createNotificationSubscriptionRepository()

  // Check if subscription already exists for this user and endpoint
  const existingSubscription = await repository.findByUserIdAndEndpoint(
    session.user.id,
    sub.endpoint
  )

  if (existingSubscription) {
    // Update existing subscription
    await repository.deleteByUserIdAndEndpoint(session.user.id, sub.endpoint)
  }

  // Create new subscription
  await repository.create({
    userId: session.user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    subscription: {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      }
    },
  })

  return { success: true }
}

export async function unsubscribeUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  const repository = createNotificationSubscriptionRepository()

  // Remove all subscriptions for this user
  await repository.deleteByUserId(session.user.id)

  return { success: true }
}

export async function sendNotification(message: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error('Not authenticated')
  }

  const repository = createNotificationSubscriptionRepository()
  const subscriptions = await repository.findByUserId(session.user.id)

  if (subscriptions.length === 0) {
    throw new Error('No subscriptions available')
  }

  const results = []

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        subscription.subscription as PushSubscription,
        JSON.stringify({
          title: 'Grow Journal',
          body: message,
          icon: '/icon-192.png',
          data: {
            url: 'https://grow-journal-tau.vercel.app/plants'
          }
        })
      )
      results.push({ success: true, subscriptionId: subscription.id })
    } catch (error) {
      console.error('Error sending push notification:', error)
      results.push({
        success: false,
        error: 'Failed to send notification',
        subscriptionId: subscription.id
      })

      // If the subscription is invalid, remove it from the database
      if (error instanceof Error && error.message.includes('410')) {
        await repository.deleteByEndpoint(subscription.endpoint)
      }
    }
  }

  return {
    success: results.some(r => r.success),
    results
  }
}