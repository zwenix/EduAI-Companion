const CACHE_NAME = 'eduai-companion-v3-splash-fix';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

/* ==========================================================================
   PUSH NOTIFICATIONS
   --------------------------------------------------------------------------
   This file is the service worker served in DEVELOPMENT (`/sw.js` out of
   `public/`). In a production build `vite-plugin-pwa` compiles `src/sw.js`
   over the top of it, so the two files must stay behaviourally identical —
   the push/notificationclick logic below is mirrored there.

   It used to contain only caching + fetch handlers. A push subscription could
   be created and the server could deliver a message, but with no `push`
   listener registered the browser dropped every payload on the floor and no
   notification ever appeared. Same for taps: without `notificationclick` the
   banner was inert.
   ========================================================================== */

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

/** Keep the subscription alive when the browser rotates its push endpoint. */
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
        // Non-fatal: the client re-subscribes on next load.
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
      // duplicate window (and on an installed PWA it keeps the single instance).
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`Failed to pre-cache asset ${asset}:`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old Service Worker Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API routes, media files, Range requests, external networks, and non-GET requests
  if (
    url.pathname.startsWith('/api') ||
    /\.(mp4|webm|ogg|mp3|wav|m4a|aac)$/i.test(url.pathname) ||
    event.request.headers.get('range') ||
    event.request.method !== 'GET' ||
    !url.origin.includes(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // stale-while-revalidate pattern
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch offline failure
          });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache valid resources dynamically (e.g. static assets)
          const isAsset = /\.(js|css|png|jpg|jpeg|svg|woff2?|ico|json)$/.test(url.pathname);
          if (isAsset) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
