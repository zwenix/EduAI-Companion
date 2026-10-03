/**
 * Production service worker (compiled by `vite-plugin-pwa`, strategy
 * `injectManifest`, into `dist/sw.js`).
 *
 * IMPORTANT — there are two service workers in this repo and they must stay
 * behaviourally identical:
 *   • `src/sw.js`    → this file; what ships in `dist/` and therefore what the
 *                      installed PWA and the hosted web app actually run.
 *   • `public/sw.js` → served verbatim at `/sw.js` during `npm run dev`, where
 *                      VitePWA does not emit a worker. It also carries the
 *                      runtime cache the dev server relies on.
 * Both register at the same URL (`/sw.js`) via
 * `src/lib/notifications/NotificationManager.ts`, so a divergence shows up as
 * "notifications work locally but not in production" (or the reverse).
 *
 * The push handling below is the piece that was missing from `public/sw.js`:
 * without a `push` listener a delivered Web Push message is discarded silently
 * and no notification is ever shown.
 */

import { precacheAndRoute } from 'workbox-precaching';

// Precaching
precacheAndRoute(self.__WB_MANIFEST || []);

const NOTIFICATION_ICON = '/icon-192x192.png';

/** Payloads arrive as `{ title, body, url }` from `/api/notifications/*`. */
const readPushPayload = (event) => {
  if (!event || !event.data) {
    return { title: 'EduAI Companion', body: 'You have a new notification.', url: '/' };
  }
  try {
    const data = event.data.json();
    return {
      title: data.title || 'EduAI Companion',
      body: data.body || data.message || 'You have a new notification.',
      url: data.url || '/',
      icon: data.icon || NOTIFICATION_ICON,
      badge: data.badge || NOTIFICATION_ICON,
      tag: data.tag || undefined,
      data,
    };
  } catch (err) {
    // Not JSON — treat the whole body as the message text.
    const text = (() => {
      try { return event.data.text(); } catch (e) { return ''; }
    })();
    return {
      title: 'EduAI Companion',
      body: text || 'You have a new notification.',
      url: '/',
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      data: { url: '/' },
    };
  }
};

// Push Notification Event
self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: payload.data || { url: payload.url },
      vibrate: [100, 50, 100],
      renotify: Boolean(payload.tag),
    })
  );
});

/**
 * Chrome rotates push subscriptions (and drops them when the browser is
 * reinstalled). Re-subscribe here and re-post to the API, otherwise the device
 * silently stops receiving pushes until the next full page load.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch('/api/notifications/vapid-public-key');
        if (!res.ok) return;
        const { publicKey } = await res.json();
        if (!publicKey) return;

        const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const key = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) key[i] = raw.charCodeAt(i);

        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });
      } catch (err) {
        // Non-fatal: NotificationManager re-subscribes on next load.
      }
    })()
  );
});

/** Resolve a possibly-relative deep link against the SW's own origin. */
const resolveTarget = (raw) => {
  const value = typeof raw === 'string' ? raw : (raw && (raw.url || raw.tab)) || '/';
  try {
    return new URL(value, self.location.origin).href;
  } catch (err) {
    return `${self.location.origin}/`;
  }
};

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = resolveTarget(event.notification.data);

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Prefer an already-open tab on this origin: focusing beats spawning a
      // duplicate window (and keeps an installed PWA to a single instance).
      const sameTarget = clients.find((client) => client.url === target && 'focus' in client);
      if (sameTarget) {
        sameTarget.postMessage({ type: 'eduai-notification', payload: event.notification.data });
        return sameTarget.focus();
      }

      const anySameOrigin = clients.find(
        (client) => 'focus' in client && new URL(client.url).origin === self.location.origin
      );
      if (anySameOrigin) {
        anySameOrigin.postMessage({ type: 'eduai-notification', payload: event.notification.data });
        try {
          await anySameOrigin.navigate(target);
        } catch (err) {
          /* cross-origin or controlled-client restriction — fall through */
        }
        return anySameOrigin.focus();
      }

      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })()
  );
});

self.addEventListener('notificationclose', () => {
  // Reserved: dismissed-notification analytics can hook in here.
});
