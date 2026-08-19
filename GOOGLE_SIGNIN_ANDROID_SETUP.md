# Google Sign-In on Android — Setup & Troubleshooting 🔐

This is the definitive checklist for the native Android Google Sign-In flow used
by the EduAI Companion APK. The most common failure is Google Sign-In error
**code 10 (DEVELOPER_ERROR / 12501)** with a message like:

> Google sign-in isn't configured for this Android build… create an OAuth
> client with package name `com.eduaicompanion.app` and SHA-1 `73:BB:…`

That error means: the **OAuth client ID of type "Android"** matching the
installed APK's package name **and** signing fingerprint does not exist in the
**Google Cloud project that owns the web client ID** the app uses.

---

## 1. The identities that must match

| Item | Value |
| :--- | :--- |
| Package name | `com.eduaicompanion.app` |
| Web client ID (used by the app) | `725068822716-tv8hh929bsagjliekkoq4ptkcfb3gs0k.apps.googleusercontent.com` |
| GCP project number (must own the OAuth client) | `725068822716` |
| Firebase project (linked to that GCP project) | `gen-lang-client-0448588221` |
| Debug signing keystore (committed) | `signing/android-debug.keystore` (password `android`, alias `androiddebugkey`) |
| Debug keystore SHA-1 (verified) | `73:BB:00:87:CF:0B:C5:43:B7:60:37:01:03:CE:D3:47:9E:5E:D5:FD` |
| Debug keystore SHA-256 (verified) | `F6:92:B7:34:F6:91:BF:55:76:A5:07:D0:78:C6:ED:8F:9F:BA:72:A1:20:A3:2A:39:BA:FD:EF:B4:AF:D7:B9:5A` |

> The fingerprints above are generated from the committed keystore itself. The
> CI workflow (`build-android2.yml`) copies this exact keystore into the build,
> so every CI APK presents **exactly** these fingerprints.

## 2. Registering the Android OAuth client

1. Open **Google Cloud Console** → select the project
   `gen-lang-client-0448588221` (project number `725068822716`).
   ⚠️ This is the single most common mistake: creating the client in a
   *different* GCP project looks "configured" in both consoles but Google
   Sign-In still fails.
2. **APIs & Services → Credentials → + CREATE CREDENTIALS → OAuth client ID.**
3. Application type: **Android**.
4. Package name: `com.eduaicompanion.app`.
5. SHA-1 certificate fingerprint: the value from the table above.
   (You can also add the SHA-256 fingerprint — Google accepts either.)
6. Create. You do **not** need a google-services.json for the Capacitor
   plugin, but if one is added to the Android project it must come from the
   same Firebase project.

Adding the SHA-1 in the **Firebase console** (Project settings → Your apps →
Android app → SHA certificate fingerprints) does the same thing — it creates
the Android OAuth client in the GCP project linked to that Firebase project.
If you did it there and it still fails, confirm that the Firebase project's
linked GCP project is actually `gen-lang-client-0448588221` (Project settings →
Integrations → Google Cloud).

## 3. OAuth consent screen

1. **APIs & Services → OAuth consent screen** (same project).
2. Fill in the app name and a **support email** (this is mandatory).
3. Add the scopes `openid`, `profile`, `email` if prompted.
4. Publish the consent screen (or add the test account as a test user while in
   "Testing" mode).

## 4. "I registered everything but it still fails"

Then the installed APK presents a **different fingerprint** than the one you
registered. Check which SHA-1 the installed build actually presents:

```bash
# The SHA-1 your local debug builds present (Android Studio / gradlew without
# the repo keystore):
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android | grep SHA1

# Or extract it from the installed APK:
apksigner verify --print-certs path/to/app.apk   # shows SHA-256; convert if needed
```

- **Built the APK yourself?** Your machine's debug keystore differs from the
  repo's committed one — register *your* fingerprint (or install the CI APK
  from the GitHub Releases page instead).
- **Downloaded the APK from the GitHub release?** It uses the committed
  keystore — the table values above are correct; re-check steps 1–3, especially
  the GCP project selection.
- **Uploaded to Google Play?** Play App Signing re-signs the app with Google's
  key. Register the **App signing certificate** SHA-1 shown in Play Console →
  Setup → App signing (both the app-signing and upload certificates if
  needed).

## 5. Code pointers

- `src/config/googleAuth.ts` — web client ID, scopes, package name and the
  verified keystore fingerprints.
- `capacitor.config.ts` — `GoogleAuth` plugin configuration (clientId /
  androidClientId / scopes).
- `src/components/LoginPage.tsx` — native sign-in flow and the friendly
  error message shown for DEVELOPER_ERROR.
- `.github/workflows/build-android2.yml` — copies the committed keystore and
  prints the fingerprints in the build log and release notes.
