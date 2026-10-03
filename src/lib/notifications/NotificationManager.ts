/**
 * Cross-platform notification facade.
 *
 * Two delivery paths, one API:
 *
 *   • Native (Capacitor Android APK / iOS build) → `./androidPush`, i.e. FCM
 *     registration for background delivery plus `LocalNotifications` for the
 *     tray. Web Push is unavailable in an Android WebView (`PushManager` and
 *     `Notification` are both undefined), so this is the only path that works
 *     there. See androidPush.ts for the full diagnosis.
 *
 *   • Web / installed PWA → a service worker subscription registered with the
 *     Express API and delivered over Web Push (VAPID).
 *
 * Every method is defensive: it resolves quietly instead of throwing when a
 * capability is missing (iframe preview, denied permission, unconfigured
 * VAPID keys, WebView without the Notification API). Callers such as
 * `NotificationsDropdown` run this inside a Firestore snapshot callback, so an
 * unhandled rejection there would silently kill the rest of the listener.
 */

import { isNativeApp, getPlatform } from '../platform';
import {
  initNativePush,
  showNativeNotification,
  getNativePushState,
  requestNativePermission,
  type NativePushState,
} from './androidPush';

/** Where the web service worker lives (built from `src/sw.js` by VitePWA). */
const SW_URL = '/sw.js';

export interface NotificationSupport {
  platform: 'native' | 'web';
  /** True when *some* notification can be shown on this device. */
  canNotify: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';
  /** Web only: the browser exposes the Push API (a service worker can subscribe). */
  pushSupported: boolean;
  /** Web only: the deployment supplied VAPID keys, so the server can send. */
  serverPushEnabled: boolean | null;
  /** Native only: FCM handed back a registration token. */
  fcmRegistered: boolean;
  detail: string;
}

export class NotificationManager {
  /** Mirrors the last known native state so the web path can report on it too. */
  private static nativeState: NativePushState | null = null;
  private static serverPushEnabled: boolean | null = null;

  // ── Bootstrapping ────────────────────────────────────────────────────────
  /**
   * Called once on app load (see `src/main.tsx`) and again when the Firebase
   * auth state resolves, so the FCM token / push subscription can be attributed
   * to a user id.
   */
  static async init(userId?: string) {
    if (isNativeApp()) {
      try {
        this.nativeState = await initNativePush(userId);
      } catch (err) {
        console.warn('[Notifications] Native push init failed (handled):', err);
      }
      return;
    }

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register(SW_URL).catch(() => null);
      if (!registration) return;

      // Only subscribe when permission was already granted; otherwise we would
      // trip the browser's "notification permission requested without a user
      // gesture" warning. `requestPermissionExplicitly()` covers the rest.
      if (this.webPermission() === 'granted') {
        await this.subscribeUser(registration, userId);
      }
    } catch (error) {
      // Quiet fail in iframe/preview environments.
    }
  }

  /**
   * User-gesture entry point (Settings → "Enable device notifications").
   * Returns true when the device can now show notifications.
   */
  static async requestPermissionExplicitly(userId?: string): Promise<boolean> {
    if (isNativeApp()) {
      try {
        this.nativeState = await requestNativePermission(userId);
      } catch (err) {
        console.warn('[Notifications] Native permission request failed (handled):', err);
        return false;
      }
      return this.nativeState?.permission === 'granted' || this.nativeState?.registered === true;
    }

    const permission = this.webPermission();
    if (permission === 'unsupported') return false;

    try {
      const result = await (window as any).Notification.requestPermission();
      if (result === 'granted') {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        if (registration) await this.subscribeUser(registration, userId);
        return true;
      }
    } catch (err) {
      // Permission denied or blocked by the iframe environment.
    }
    return false;
  }

  // ── Displaying ───────────────────────────────────────────────────────────
  /**
   * Raise a notification on the device right now.
   *
   * On Android this goes through `LocalNotifications`, which produces a genuine
   * system-tray notification — previously this method touched the missing
   * `Notification` global and threw, so the APK showed nothing at all.
   */
  static async showNotification(
    title: string,
    body: string,
    data?: Record<string, any> | string
  ): Promise<boolean> {
    const payload = typeof data === 'string' ? { url: data } : data || {};

    if (isNativeApp()) {
      return showNativeNotification({
        title: title || 'EduAI Companion',
        body: body || 'You have a new notification.',
        data: payload,
      });
    }

    try {
      if (this.webPermission() !== 'granted') return false;
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      if (!registration) return false;

      await registration.showNotification(title || 'EduAI Companion', {
        body: body || 'You have a new notification.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: (payload as any).url || '/',
        vibrate: [100, 50, 100],
      });
      return true;
    } catch (err) {
      // Service worker not ready, or notifications blocked — never fatal.
      return false;
    }
  }

  /**
   * Kept for existing call sites (`NotificationsDropdown`, `Settings`).
   * @deprecated use {@link NotificationManager.showNotification}.
   */
  static async sendTestNotification(title: string, body: string, url: string = '/') {
    return this.showNotification(title, body, { url });
  }

  // ── Introspection (Settings UI) ──────────────────────────────────────────
  static getSupport(): NotificationSupport {
    if (isNativeApp()) {
      const native = this.nativeState || getNativePushState();
      const granted = native.permission === 'granted';
      return {
        platform: 'native',
        canNotify: granted,
        permission: native.permission,
        pushSupported: true,
        serverPushEnabled: null,
        fcmRegistered: native.registered,
        detail: native.registered
          ? 'Registered with Firebase Cloud Messaging.'
          : native.error
            ? `FCM unavailable — ${native.error} On-device alerts still work while the app is installed.`
            : granted
              ? 'Permissions granted. Waiting for the FCM registration token…'
              : 'Ask Android for notification permission to receive alerts.',
      };
    }

    const permission = this.webPermission();
    const pushSupported =
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    return {
      platform: 'web',
      canNotify: permission === 'granted',
      permission,
      pushSupported,
      serverPushEnabled: this.serverPushEnabled,
      fcmRegistered: false,
      detail: !pushSupported
        ? 'This browser exposes neither the Push API nor the Notification API.'
        : permission === 'granted'
          ? this.serverPushEnabled === false
            ? 'On-device alerts work; background push needs VAPID keys on the server.'
            : 'Ready to receive browser push notifications.'
          : 'Allow notifications to receive grading results and task alerts.',
    };
  }

  // ── Web Push internals ───────────────────────────────────────────────────
  /** Safe permission read — `Notification` is undefined inside a WebView. */
  private static webPermission(): NotificationSupport['permission'] {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
      return (window as any).Notification.permission as NotificationSupport['permission'];
    } catch {
      return 'unsupported';
    }
  }

  private static async subscribeUser(registration: ServiceWorkerRegistration, userId?: string) {
    try {
      if (!('PushManager' in window)) return;

      const response = await fetch(`${this.apiBase()}/api/notifications/vapid-public-key`);
      if (!response.ok) return;
      const data = await response.json();
      const publicKey = data?.publicKey;
      this.serverPushEnabled = Boolean(data?.enabled);
      if (!publicKey) return;

      // Reuse an existing subscription instead of creating a new one on every
      // boot — Chrome rotates them, and each rotation left a dead entry behind.
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey),
        }));

      await fetch(`${this.apiBase()}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, userId }),
      });
    } catch (e) {
      // Non-fatal.
    }
  }

  /**
   * Same reasoning as `androidPush.apiBase()`: relative on web, and overridable
   * with `VITE_API_BASE_URL` for a native build pointed at the hosted API.
   */
  private static apiBase(): string {
    const fromEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;
    if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.replace(/\/+$/, '');
    return '';
  }

  static urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /** Current platform string, for diagnostics in Settings. */
  static getPlatform(): string {
    return getPlatform() || 'web';
  }
}
