export class NotificationManager {
  static async init(userId?: string) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js').catch(() => null);
      if (!registration) return;
      
      // If permission is already granted, proceed with subscription setup
      if ('Notification' in window && Notification.permission === 'granted') {
        await this.subscribeUser(registration, userId);
      }
    } catch (error) {
      // Quiet fail in iframe/preview environments
    }
  }

  static async requestPermissionExplicitly(userId?: string) {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        await this.subscribeUser(registration, userId);
        return true;
      }
    } catch (err) {
      // Permission denied or blocked by iframe environment
    }
    return false;
  }

  private static async subscribeUser(registration: ServiceWorkerRegistration, userId?: string) {
    try {
      const response = await fetch('/api/notifications/vapid-public-key');
      if (!response.ok) return;
      const data = await response.json();
      const publicKey = data.publicKey;
      if (!publicKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, userId })
      });
    } catch (e) {
      // Non-fatal
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
