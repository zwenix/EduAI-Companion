# Android Push Notifications — Setup & Troubleshooting 🔔

This is the definitive checklist for notifications in the EduAI Companion APK.
It covers **why they never worked**, **what the app now does**, and **the one
server secret you still have to supply** for messages to reach a closed app.

---

## 1. Why notifications did not work on Android

The app only had a Web Push path, and Web Push does not exist inside a Capacitor
Android WebView:

| Assumption the old code made | Reality in the APK |
| :--- | :--- |
| `window.PushManager` exists, so a service worker can subscribe | `undefined` — WebView has no push service |
| `window.Notification` exists, so `registration.showNotification()` works | `undefined` — reading `Notification.permission` threw a `ReferenceError` |
| `/sw.js` has a `push` listener that renders the payload | `public/sw.js` had **no** `push` or `notificationclick` listener at all, so even a delivered message was dropped silently |
| `/api/...` reaches the Express server | The WebView serves the bundled `dist/` itself; a relative `/api/...` has no server behind it |

Concretely, `NotificationManager.init()` began with
`if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;` — so
on Android it returned immediately and the device never registered for anything.
`src/main.tsx` then gated that call behind `'serviceWorker' in navigator` as
well, so the native path never even got a chance to run.

Notifications posted from the Auto-Grading Lab, Teacher Dashboard, Progress
Reports and Parent Dashboard *did* land in the Firestore `notifications`
collection and the in-app bell updated — but the device never raised a single
system notification.

---

## 2. What the app does now

Two Capacitor plugins were added (`@capacitor/push-notifications`,
`@capacitor/local-notifications`) and the notification layer is now
platform-aware.

| File | Role |
| :--- | :--- |
| `src/lib/notifications/androidPush.ts` | **New.** Native bridge: FCM permission → channel → `register()` → token; foreground FCM messages re-raised as local notifications; tap → `eduai:notification-tap` event |
| `src/lib/notifications/NotificationManager.ts` | Facade. Routes to the native bridge in the APK and to service-worker Web Push in the browser. Nothing throws when a capability is missing |
| `src/main.tsx` | Boots notifications unconditionally (no longer gated on `serviceWorker`) |
| `src/App.tsx` | Re-inits with the Firebase uid on sign-in; listens for notification taps and routes to the matching tab |
| `src/components/NotificationsDropdown.tsx` | Raises a real system notification for each new Firestore `notifications` doc |
| `src/components/Settings.tsx` | New **Install & Notifications** panel: live status, *Enable notifications*, *Send test notification* |
| `public/sw.js` | **Fixed.** Added `push`, `notificationclick`, `notificationclose`, `pushsubscriptionchange` (dev-time worker) |
| `src/sw.js` | Same handlers, hardened click routing (production worker built by `vite-plugin-pwa`) |
| `server.ts` | FCM HTTP v1 sender + token registry: `/api/notifications/fcm/{status,register,unregister,send}`; `test-send` now fans out to web **and** FCM |
| `firestore.rules` | `push_tokens` collection — owner-scoped writes, `list` denied |
| `capacitor.config.ts` | `PushNotifications.presentationOptions`, `LocalNotifications.iconColor` |

> ⚠️ There are **two** service workers and they must stay in sync: `src/sw.js`
> is compiled into `dist/sw.js` for production; `public/sw.js` is what
> `npm run dev` serves at the same URL. Both register as `/sw.js`.

### Delivery paths

1. **App open (any platform).** A new `notifications` doc in Firestore is
   observed by `NotificationsDropdown` and raised immediately — on Android
   through `LocalNotifications`, so it appears in the system shade even though
   nothing was "pushed".
2. **App closed / backgrounded (Android).** Requires FCM, i.e. §3 and §4 below.
   The token is stored in the Firestore `push_tokens` collection, which the
   server reads back over the Firestore REST API — so it works even though the
   APK cannot reach `/api/*`.

---

## 3. Firebase console (one-off)

| Item | Value |
| :--- | :--- |
| Package name | `com.eduaicompanion.app` |
| Firebase project | `gen-lang-client-0448588221` |
| Project number / FCM sender ID | `725068822716` |
| Android notification channel | `eduai-alerts` ("EduAI Alerts", importance MAX) |
| `google-services.json` | committed at the repo root |

1. **Firebase console → Project settings → Cloud Messaging.** Confirm *Firebase
   Cloud Messaging API* is **enabled** for `gen-lang-client-0448588221`. On
   projects created before mid-2024 it can be disabled by default, and FCM
   registration then fails silently with `SENDER_ID_MISMATCH` or a 403.
2. Confirm the Android app `com.eduaicompanion.app` is listed. It already is —
   the committed `google-services.json` contains its `mobilesdk_app_id`. If you
   ever regenerate it, replace the repo-root file.
3. **Project settings → Service accounts → Generate new private key.** That JSON
   is the secret in §4. Give the key the *Firebase Cloud Messaging* role (it
   also needs Firestore read access for the token registry — the built-in
   `Cloud Datastore User` role covers it).

### Gradle wiring (already handled)

Capacitor's generated `android/app/build.gradle` ends with:

```gradle
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch (Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

`scripts/wire-google-signin.mjs` copies the repo-root `google-services.json`
into `android/app/`, and CI runs it **before** `./gradlew assembleDebug` — so
the plugin is applied and FCM initialises. If you build locally, the order is:

```bash
npm ci && npm run build
npx cap add android
npx @capacitor/assets generate --android --iconBackgroundColor '#060b18' --splashBackgroundColor '#060b18'
npx cap sync android
node scripts/wire-google-signin.mjs      # installs google-services.json
cd android && ./gradlew assembleDebug
```

`npx cap sync android` also writes both plugins into
`android/app/capacitor.build.gradle`, and `@capacitor/local-notifications`
contributes `POST_NOTIFICATIONS` through its own manifest — no manual
`AndroidManifest.xml` edit is needed.

---

## 4. Server secret (required for background delivery)

Set **one** of these wherever the Express API runs:

```bash
# preferred — inline JSON (keep the \n escapes inside private_key)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"gen-lang-client-0448588221",…}'

# or a path to the same file
GOOGLE_APPLICATION_CREDENTIALS=/secrets/firebase-adminsdk.json
```

No new dependency is needed: `server.ts` signs the OAuth2 RS256 JWT with
`node:crypto`, exchanges it at `https://oauth2.googleapis.com/token`, and posts
to the FCM HTTP v1 endpoint
(`…/v1/projects/{projectId}/messages:send`). The legacy `fcm.googleapis.com/fcm/send`
server-key API was shut down by Google in June 2024 — do not use it.

Optional, for a native build that *can* reach the hosted API:

```bash
VITE_API_BASE_URL=https://your-api-host.example.com
```

Without it the APK simply skips the HTTP registration and relies on the
Firestore `push_tokens` registry, which the server reads over REST.

### Sending

```bash
# every registered device
curl -X POST https://your-api-host/api/notifications/fcm/send \
  -H 'Content-Type: application/json' \
  -d '{"title":"Grading complete","body":"Grade 5 Fractions Quiz — 93%","url":"/","tab":"ocr"}'

# one user only
curl -X POST https://your-api-host/api/notifications/fcm/send \
  -H 'Content-Type: application/json' \
  -d '{"title":"New task","body":"Your teacher assigned a worksheet","userId":"<uid>"}'

# what does the server currently know?
curl https://your-api-host/api/notifications/fcm/status
```

`/api/notifications/test-send` now delivers over **both** transports and reports
each separately:

```json
{ "ok": true, "sent": 2, "total": 2,
  "web": { "sent": 0, "total": 0, "error": "…missing VAPID keys." },
  "fcm": { "enabled": true, "sent": 2, "total": 2, "error": null } }
```

Messages are sent with `android.priority = "high"`, `ttl = 3600s` and
`notification.channel_id = "eduai-alerts"`, matching the channel the app
creates, so alerts can appear as heads-up notifications.

---

## 5. Verifying on a device

1. Install the APK, sign in, open **Settings → Install & Notifications**.
2. Tap **Enable notifications** → Android 13+ shows the runtime permission
   dialog. The status pill should flip to **Enabled** and *FCM token* to
   **Registered**.
3. Tap **Send test notification**. A system notification must appear in the
   shade even while the app is in the foreground — this proves
   `LocalNotifications` and the channel are working, independent of FCM.
4. Background the app and have a teacher post something that writes a
   `notifications` doc (finish a grading run in the Auto-Grading Lab, assign a
   task, publish a report). Firestore listeners stop when the process is
   suspended, so this is the case that needs §4.
5. Force-stop the app and send via `/api/notifications/fcm/send`. The
   notification should still be delivered — that is FCM, not the app.
6. Tap it: the app opens on the tab named by `tab` (or inferred from `type`).

Logcat while debugging:

```bash
adb logcat -s capacitor:V Capacitor:V Capacitor/PushNotifications:V FirebaseMessaging:V chromium:V
```

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| Status shows *Permissions granted* but *FCM token: Not registered* | `google-services.json` missing from `android/app/`, or Cloud Messaging disabled in the console | Re-run `node scripts/wire-google-signin.mjs`; check §3.1 |
| `registrationError: SENDER_ID_MISMATCH` | The APK's package name / signing key does not match the Firebase Android app | Package must be exactly `com.eduaicompanion.app`; see `GOOGLE_SIGNIN_ANDROID_SETUP.md` for the SHA-1 |
| Token registers, `/fcm/send` returns `sent: 0, total: 0` | Server has no service account, so it cannot read `push_tokens` | Set `FIREBASE_SERVICE_ACCOUNT_JSON` (§4) and restart the API |
| `403 SENDER_ID_MISMATCH` / `404 UNREGISTERED` from FCM v1 | Service account belongs to a **different** Firebase project than the APK's | The key must come from `gen-lang-client-0448588221` (project number `725068822716`) |
| Notification arrives but is silent / no heads-up | Channel importance was locked in at first install | Android caches channel settings — uninstall and reinstall to recreate `eduai-alerts` at MAX importance |
| Works in `npm run dev`, not in production (web) | The two service workers diverged | Keep `src/sw.js` and `public/sw.js` in sync (§2) |
| In-app bell updates but no system notification, app in foreground | Old code path — should now be fixed by `NotificationsDropdown` → `showNotification` | Clear app data / reinstall so the new SW and bridge load |
| `Notification is not defined` in logcat | A code path is still touching the web `Notification` global directly | Always go through `NotificationManager`, never `new Notification(…)` |

---

## 7. iOS (when the app is ported)

`initNativePush()` is not Android-specific: it calls `PushNotifications.register()`
on any native platform and `capacitor.config.ts` already declares
`presentationOptions`. For iOS you additionally need an APNs key uploaded in
Firebase console → Cloud Messaging → Apple app configuration, plus the
`aps-environment` entitlement. The Android notification-channel step is skipped
automatically on iOS.
