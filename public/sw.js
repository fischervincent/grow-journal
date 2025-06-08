self.addEventListener('push', function (event) {
  console.log('Push event received:', event);

  if (event.data) {
    console.log('Push event has data');
    try {
      const data = event.data.json();
      console.log('Parsed push data:', data);

      const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '2',
          url: data.data?.url
        },
      }

      console.log('Notification options:', options);

      event.waitUntil(
        self.registration.showNotification(data.title, options)
          .then(() => console.log('Notification shown successfully'))
          .catch(err => console.error('Error showing notification:', err))
      );
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  } else {
    console.log('Push event has no data');
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received: ', event.notification?.data)

  event.notification.close()

  const redirectUrl = event.notification.data?.url || 'https://grow-journal-tau.vercel.com'

  event.waitUntil(clients.openWindow(redirectUrl))
})