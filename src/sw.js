import { precacheAndRoute } from 'workbox-precaching';

// Precaching
precacheAndRoute(self.__WB_MANIFEST || []);

// Push Notification Event
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'You have a new notification!',
        icon: data.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: data.url || '/',
        vibrate: [100, 50, 100],
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || 'EduAI Notification', options)
      );
    } catch (e) {
      // Fallback if not json
      const options = {
        body: event.data.text(),
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
      };
      event.waitUntil(
        self.registration.showNotification('EduAI', options)
      );
    }
  }
});

// Notification Click Event
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
