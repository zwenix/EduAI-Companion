/**
 * Native Android notification bridge (Capacitor).
 *
 * WHY THIS EXISTS
 * ---------------
 * Web Push (VAPID + a service-worker `push` handler) was the app's only
 * notification path, and it does not exist inside a Capacitor Android WebView:
 * `window.PushManager` and `window.Notification` are both undefined there. So
 * `NotificationManager.init()` bailed on its very first guard, the APK never
 * subscribed to anything, and `sendTestNotification()` threw a ReferenceError
 * the moment it read `Notification.permission`.
 *
 * The visible symptom: notifications posted from the Auto-Grading Lab, Teacher
 * Dashboard, Progress Reports or a Parent request landed in the Firestore
 * `notifications` collection and updated the in-app bell, but the device never
 * raised a single system notification — in the foreground or in the background.
 *
 * This module restores them properly:
 *   • `@capacitor/push-notifications` → real FCM registration, so messages sent
 *     from the backend reach the device even when the app is closed.
 *   • `@capacitor/local-notifications` → real system-tray notifications for
 *     events the app observes while it is open (a new `notifications` doc) and
 *     for FCM *data* messages, which Android does not render by itself while
 *     the app is in the foreground.
 *
 * CONVENTION
 * ----------
 * Both plugins are loaded with a dynamic `import()` inside try/catch, matching
 * `src/lib/nativeExport.ts` and `src/lib/useAndroidBackButton.ts`. The web
 * bundle never pulls native code in, and a missing/unavailable plugin degrades
 * to a no-op instead of a crash. Every entry point is safe to call on web —
 * it simply reports `supported: false`.
 */

import { isNativeApp, getPlatform } from '../platform';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/** High-importance channel so alerts can appear as heads-up notifications. */
export const PUSH_CHANNEL_ID = 'eduai-alerts';
export const PUSH_CHANNEL_NAME = 'EduAI Alerts';
export const PUSH_CHANNEL_DESCRIPTION =
  'Grading results, assigned tasks, messages and reminders from EduAI Companion.';

/** Accent tint for the small icon — `--color-brand-cyan` from src/index.css. */
const ICON_COLOR = '#00B3FF';

/** Dispatched when the user taps a system notification, so App.tsx can route. */
export const NOTIFICATION_TAP_EVENT = 'eduai:notification-tap';

export type NativePermission = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

export interface NativePushState {
  /** True when running inside the Capacitor app with the plugins available. */
  supported: boolean;
  /** True when FCM handed back a registration token. */
  registered: boolean;
  permission: NativePermission;
  token: string | null;
  error: string | null;
  platform: string;
}

export interface NativeNotificationPayload {
  title: string;
  body: string;
  /** Free-form deep-link data, e.g. `{ tab: 'student-tasks' }` or `{ url: '/ocr' }`. */
  data?: Record<string, any>;
}

// ── Module state ─────────────────────────────────────────────────────────────
let state: NativePushState = {
  supported: false,
  registered: false,
  permission: 'unknown',
  token: null,
  error: null,
  platform: 'web',
};

let pushPlugins: { Push: any; Local: any } | null = null;
let listenersAttached = false;
let initPromise: Promise<NativePushState> | null = null;
let currentUserId: string | null = null;

/** LocalNotifications requires a *numeric* id; keep them unique and int-sized. */
let idSeed = Math.floor(Date.now() % 1_000_000_000);
const nextNotificationId = (): number => {
  idSeed = (idSeed + 1) % 2_000_000_000;
  return idSeed || 1;
};

export const getNativePushState = (): NativePushState => ({ ...state });

/** True only inside the Capacitor app (Android APK / iOS build). */
export const isNativePushPlatform = (): boolean => isNativeApp();

const loadPlugins = async (): Promise<{ Push: any; Local: any } | null> => {
  if (pushPlugins) return pushPlugins;
  try {
    const [pushMod, localMod] = await Promise.all([
      import('@capacitor/push-notifications'),
      import('@capacitor/local-notifications'),
    ]);
    const Push = (pushMod as any)?.PushNotifications;
    const Local = (localMod as any)?.LocalNotifications;
    if (!Push || !Local) return null;
    pushPlugins = { Push, Local };
    return pushPlugins;
  } catch (err) {
    console.warn('[NativePush] Capacitor notification plugins unavailable:', err);
    return null;
  }
};

// ── Token registry ───────────────────────────────────────────────────────────
/**
 * Where the backend resolves `/api/*` from. The Express API is reachable with a
 * plain relative path on web/PWA, but the APK serves its bundle from the
 * WebView, so a native build needs `VITE_API_BASE_URL` (or a `server.url` in
 * capacitor.config.ts) to talk to the hosted API. Without it we simply skip the
 * HTTP registration — the Firestore registry below is the source of truth and
 * always works from the APK.
 */
const apiBase = (): string => {
  const fromEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.replace(/\/+$/, '');
  // '' = same-origin relative, which is correct on web/PWA and a no-op in the
  // APK (see the doc comment above).
  return '';
};

/**
 * Persist the FCM token so something can actually send to this device.
 *
 * Firestore is the primary registry: the APK can always reach Firebase, and
 * `firestore.rules` scopes each document to the signed-in owner. The HTTP POST
 * is best-effort for deployments that also run the Express API.
 */
const persistToken = async (token: string, userId: string | null): Promise<void> => {
  const platform = getPlatform() || 'android';
  // firestore.rules scopes a push-token document to `request.auth.uid`, so the
  // authenticated uid always wins over the id handed in at init time (a token
  // can arrive before `onAuthStateChanged` resolves). `initNativePush` re-runs
  // this once a uid exists.
  const ownerUid = auth?.currentUser?.uid || userId;

  if (ownerUid) {
    try {
      await setDoc(
        doc(db, 'push_tokens', token),
        {
          token,
          userId: ownerUid,
          platform,
          // `merge: true` + a fresh `createdAt` on every boot would churn the
          // field and trip the ownership rule; `updatedAt` is the "last seen"
          // marker the backend actually needs.
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[NativePush] Could not store token in Firestore (handled):', err);
    }
  } else {
    console.info('[NativePush] No signed-in user yet \u2014 deferring token registration.');
  }

  const base = apiBase();
  if (!base && isNativePushPlatform()) return;

  try {
    await fetch(`${base}/api/notifications/fcm/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId, platform }),
    });
  } catch (err) {
    // Non-fatal — the Firestore registry already has the token.
    console.warn('[NativePush] API token registration skipped:', err);
  }
};

// ── Foreground / tap handling ────────────────────────────────────────────────
const notifyTap = (data: any) => {
  try {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_TAP_EVENT, {
        detail: {
          data: data || {},
          url: data?.url || null,
          tab: data?.tab || null,
        },
      })
    );
  } catch {
    /* window is always present in the WebView; kept defensive anyway */
  }
};

/**
 * Show a real system notification from inside the app.
 *
 * Used for (a) Firestore `notifications` documents observed while the app is
 * open, and (b) FCM *data* messages, which Android never renders on its own in
 * the foreground — without this the device would stay silent.
 */
export const showNativeNotification = async (
  payload: NativeNotificationPayload
): Promise<boolean> => {
  if (!isNativePushPlatform()) return false;

  const plugins = await loadPlugins();
  if (!plugins) return false;

  try {
    await plugins.Local.schedule({
      notifications: [
        {
          id: nextNotificationId(),
          title: payload.title || 'EduAI Companion',
          body: payload.body || 'You have a new notification.',
          channelId: PUSH_CHANNEL_ID,
          iconColor: ICON_COLOR,
          autoCancel: true,
          extra: payload.data || {},
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn('[NativePush] Local notification failed:', err);
    return false;
  }
};

// ── Initialisation ───────────────────────────────────────────────────────────
const attachListeners = async (plugins: { Push: any; Local: any }): Promise<void> => {
  if (listenersAttached) return;
  listenersAttached = true;

  const { Push } = plugins;

  try {
    await Push.removeAllListeners();
  } catch {
    /* no listeners yet */
  }

  // FCM token (also re-fires when Firebase rotates it).
  Push.addListener('registration', (token: { value: string }) => {
    if (!token?.value) return;
    state = { ...state, registered: true, token: token.value, error: null };
    console.info('[NativePush] FCM registration token acquired.');
    void persistToken(token.value, currentUserId);
  });

  Push.addListener('registrationError', (error: any) => {
    const message = error?.message || error?.error || 'FCM registration failed.';
    state = { ...state, registered: false, token: null, error: String(message) };
    // Local notifications keep working, so in-app events still reach the tray.
    console.warn('[NativePush] FCM registration error:', message);
  });

  // Foreground FCM message: Android shows nothing by itself here, and a
  // notification-message is suppressed while the app has focus — so we raise it.
  Push.addListener('pushNotificationReceived', async (notification: any) => {
    const data = { ...(notification?.data || {}), ...(notification?.userData || {}) };
    await showNativeNotification({
      title: notification?.title || 'EduAI Companion',
      body: notification?.body || 'You have a new notification.',
      data,
    });
  });

  // Tapped a notification from the tray → hand the payload to the app shell.
  Push.addListener('pushNotificationActionPerformed', (action: any) => {
    notifyTap(action?.notification?.data);
  });

  // Same for locally raised notifications.
  try {
    plugins.Local.addListener('localNotificationActionPerformed', (action: any) => {
      notifyTap(action?.notification?.extra);
    });
  } catch {
    /* optional */
  }
};

/**
 * Request permissions, create the Android channel and register with FCM.
 *
 * Idempotent: repeated calls (login, Settings → "Enable notifications") reuse
 * the in-flight promise and never attach duplicate listeners.
 */
export const initNativePush = async (userId?: string | null): Promise<NativePushState> => {
  if (userId) currentUserId = userId;

  if (!isNativePushPlatform()) {
    state = { ...state, supported: false, platform: getPlatform() || 'web' };
    return getNativePushState();
  }

  if (initPromise) {
    // A later login may supply the uid the first attempt did not have —
    // re-persist the token we already hold under the new owner.
    if (state.token && userId) void persistToken(state.token, userId);
    return initPromise;
  }

  initPromise = (async () => {
    state = { ...state, supported: true, platform: getPlatform() || 'android' };

    const plugins = await loadPlugins();
    if (!plugins) {
      state = { ...state, supported: false, error: 'Notification plugins are not bundled.' };
      return getNativePushState();
    }

    // 1. Permissions. On Android 13+ this is the POST_NOTIFICATIONS runtime
    //    permission (declared by the local-notifications plugin manifest).
    try {
      const localPerm = await plugins.Local.requestPermissions();
      const pushPerm = await plugins.Push.requestPermissions();
      const receive = pushPerm?.receive || localPerm?.display || 'prompt';
      state = { ...state, permission: receive as NativePermission };
    } catch (err) {
      console.warn('[NativePush] Permission request failed:', err);
      state = { ...state, permission: 'unknown' };
    }

    // 2. Android notification channel (rejected on web/iOS — hence the guard).
    try {
      if (getPlatform() === 'android') {
        await plugins.Local.createChannel({
          id: PUSH_CHANNEL_ID,
          name: PUSH_CHANNEL_NAME,
          description: PUSH_CHANNEL_DESCRIPTION,
          importance: 5, // MAX — allows heads-up display + sound
          visibility: 1, // show on the lock screen
          vibration: true,
          lights: true,
          lightColor: ICON_COLOR,
        });
      }
    } catch (err) {
      console.warn('[NativePush] Channel creation skipped:', err);
    }

    // 3. Listeners first, then register — otherwise the `registration` event
    //    can fire before anything is listening and the token is lost.
    await attachListeners(plugins);

    try {
      await plugins.Push.register();
    } catch (err: any) {
      state = { ...state, error: err?.message || 'FCM register() failed.' };
      console.warn('[NativePush] register() failed:', err);
    }

    return getNativePushState();
  })();

  return initPromise;
};

/** Explicit permission request for a Settings toggle (mirrors the web flow). */
export const requestNativePermission = async (
  userId?: string | null
): Promise<NativePushState> => {
  if (!isNativePushPlatform()) return getNativePushState();
  return initNativePush(userId);
};
