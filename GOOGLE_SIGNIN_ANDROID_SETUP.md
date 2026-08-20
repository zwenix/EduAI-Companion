# Google Sign-In on Android — Setup & Troubleshooting 🔐

This is the definitive checklist for the native Android Google Sign-In flow used
by the EduAI Companion APK. The most common failure is Google Sign-In error
**code 10 (DEVELOPER_ERROR / 12501 / 12500)** or **`invalid_client`** with a
message like:

> Google sign-in isn't configured for this Android build… create an OAuth
> client with package name `com.eduaicompanion.app` and SHA-1 `73:BB:…`

That error means one of these is out of sync:

1. The **OAuth client ID of type "Android"** matching the installed APK's
   package name **and** signing fingerprint does not exist in the Google Cloud
   project that owns the web client ID the app uses.
2. The **Web client ID hardcoded in the app** (`src/config/googleAuth.ts`)
   no longer exists in GCP (it was deleted or regenerated), so Google rejects
   the ID-token request with `invalid_client`.
3. The OAuth **consent screen** is unpublished or your Google account is not a
   test user.
4. The installed APK was signed with a different keystore than the one whose
   SHA-1 is registered.

---

## 1. The identities that must match

| Item | Value |
| :--- | :--- |
| Package name | `com.eduaicompanion.app` |
| Web client ID (used by the app) | `725068822716-cmk737dpv1620nicbriuoji883vk4dg6.apps.googleusercontent.com` |
| GCP project number (must own the OAuth clients) | `725068822716` |
| Firebase project (linked to that GCP project) | `gen-lang-client-0448588221` |
| Debug signing keystore (committed) | `signing/android-debug.keystore` (password `android`, alias `androiddebugkey`) |
| Debug keystore SHA-1 (verified) | `73:BB:00:87:CF:0B:C5:43:B7:60:37:01:03:CE:D3:47:9E:5E:D5:FD` |
| Debug keystore SHA-256 (verified) | `F6:92:B7:34:F6:91:BF:55:76:A5:07:D0:78:C6:ED:8F:9F:BA:72:A1:20:A3:2A:39:BA:FD:EF:B4:AF:D7:B9:5A` |

> The fingerprints above are generated from the committed keystore itself. The
> CI workflow (`build-android2.yml`) copies this exact keystore into the build,
> so every CI APK presents **exactly** these fingerprints.

> ⚠️ If you replace the Web client in GCP, you MUST update
> `src/config/googleAuth.ts` (`FIREBASE_WEB_CLIENT_ID`) to the new client ID —
> the previous client was `…-tv8hh929bsagjliekkoq4ptkcfb3gs0k`, the current one
> is `…-cmk737dpv1620nicbriuoji883vk4dg6`.

---

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
6. Create.

Adding the SHA-1 in the **Firebase console** (Project settings → Your apps →
Android app → SHA certificate fingerprints) does the same thing — it creates
the Android OAuth client in the GCP project linked to that Firebase project.
If you did it there and it still fails, confirm that the Firebase project's
linked GCP project is actually `gen-lang-client-0448588221` (Project settings →
Integrations → Google Cloud).

### The google-services.json file

The Capacitor plugin does **not** strictly require `google-services.json`, but
you can commit the file exported from Firebase console (Project settings → Your
apps → Android app → google-services.json) at the **repo root**. To make CI use
it, add this step to `.github/workflows/build-android2.yml` right after
"Sync web assets to Android" (note: workflow files cannot be pushed by the
assistant bot on this branch — the repo owner must apply this snippet):

```yaml
      - name: Wire Google Sign-In native config
        run: |
          set -euo pipefail
          # Install the Firebase Android config when it is committed at the
          # repo root, so the native Google Sign-In plugin resolves the
          # OAuth client configuration from google-services.json.
          if [ -f google-services.json ]; then
            cp google-services.json android/app/google-services.json
            echo "✓ google-services.json installed into android/app/"
          else
            echo "ℹ No repo-root google-services.json found — the Capacitor plugin will resolve clients from runtime config."
          fi

          # Patch strings.xml with the Web OAuth client ID so the plugin's
          # native layer always resolves server_client_id, even without
          # google-services.json. The client ID is read from the same
          # src/config/googleAuth.ts constant the web app uses.
          CLIENT_ID=$(sed -n "s/.*'\([0-9][0-9]*-[a-zA-Z0-9]*\.apps\.googleusercontent\.com\)'.*/\1/p" src/config/googleAuth.ts | head -n 1)
          echo "Google Sign-In Web client ID: ${CLIENT_ID}"
          STRINGS_FILE=android/app/src/main/res/values/strings.xml
          if grep -q 'name="server_client_id"' "$STRINGS_FILE"; then
            sed -i "s|<string name=\"server_client_id\">[^<]*</string>|<string name=\"server_client_id\">${CLIENT_ID}</string>|" "$STRINGS_FILE"
          else
            sed -i "s|</resources>|    <string name=\"server_client_id\">${CLIENT_ID}</string>\n</resources>|" "$STRINGS_FILE"
          fi
          echo "✓ server_client_id patched into strings.xml"
```

If you do commit the file, the Firebase API key inside should be restricted in
GCP (APIs & Services → Credentials → API Keys) to the Firebase/Identity Toolkit
services for safety.

---

## 3. The Web OAuth client (the app's ID-token audience)

The native sign-in asks Google for an ID token with audience = the **Web
application** client ID from the table above. That client must exist in GCP
(APIs & Services → Credentials) in the same project. This is the client whose
`client_secret_….json` you can download — if the client ID in the downloaded
file differs from `src/config/googleAuth.ts`, update the constant.

---

## 4. OAuth consent screen

1. **APIs & Services → OAuth consent screen** (same project).
2. Fill in the app name and a **support email** (this is mandatory).
3. Add the scopes `openid`, `profile`, `email` if prompted.
4. Publish the consent screen **or** keep it in "Testing" and add your own
   Google account under **Test users**. A test account not listed on a testing
   consent screen fails with `access_denied`.

---

## 5. Web sign-in (browser / PWA)

Web sign-in uses Firebase's own OAuth client (managed in Firebase console →
Authentication → Sign-in methods → Google):

1. **Firebase console → Authentication → Sign-in methods → Google** must be
   enabled. If sign-in broke after client changes in GCP, toggle the provider
   off and on again so Firebase re-links a valid client.
2. **Firebase console → Authentication → Settings → Authorized domains** must
   include the host where the app runs (e.g. `your-app.vercel.app`).
3. In GCP, the Web client used by Firebase must list the app origin under
   **Authorized JavaScript origins** and
   `https://gen-lang-client-0448588221.firebaseapp.com/__/auth/handler` under
   **Authorized redirect URIs**.
4. In sandboxed previews/iframes the popup may be blocked — the app now
   automatically falls back to the full-page redirect flow.

---

## 6. "I registered everything but it still fails"

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
  keystore — the table values above are correct; re-check steps 1–4, especially
  the GCP project selection and whether the Web client ID still exists.
- **Uploaded to Google Play?** Play App Signing re-signs the app with Google's
  key. Register the **App signing certificate** SHA-1 shown in Play Console →
  Setup → App signing (both the app-signing and upload certificates if
  needed).

---

## 7. Code pointers

- `src/config/googleAuth.ts` — web client ID, scopes, package name and the
  verified keystore fingerprints.
- `capacitor.config.ts` — `GoogleAuth` plugin configuration (clientId /
  androidClientId / serverClientId / scopes).
- `src/components/LoginPage.tsx` — native sign-in flow, popup → redirect
  fallback on web, and the friendly error messages shown for each failure.
- `.github/workflows/build-android2.yml` — copies the committed keystore and
  prints the fingerprints in the build log and release notes. Apply the
  "Wire Google Sign-In native config" snippet above so it also installs
  `google-services.json` and patches `strings.xml`.
