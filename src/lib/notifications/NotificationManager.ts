export class NotificationManager {
  static async init(userId?: string) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Fetch VAPID key from backend
      const response = await fetch('/api/notifications/vapid-public-key');
      if (!response.ok) {
        throw new Error('Failed to fetch VAPID key');
      }
      const data = await response.json();
      const publicKey = data.publicKey;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to backend
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription, userId })
      });
      console.log('Push notification subscription successful.');
      
    } catch (error) {
      console.error('Error in Service Worker registration / push subscription:', error);
    }
  }

  static async sendTestNotification(title: string, body: string, url: string = '/') {
    if (Notification.permission === 'granted') {
       // if we are in foreground and just want to show something without going to server
       // we can either do serviceWorker registration showNotification or regular Notification
       const registration = await navigator.serviceWorker.ready;
       registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          data: url
       });
    }
  }

  static urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
