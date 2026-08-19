// OAuth client IDs are public identifiers, not secrets. Keep the native
// Capacitor configuration and the runtime initialization on this single value
// so Android always requests a Firebase-compatible Google ID token.
export const FIREBASE_WEB_CLIENT_ID =
  '725068822716-tv8hh929bsagjliekkoq4ptkcfb3gs0k.apps.googleusercontent.com';

export const GOOGLE_AUTH_SCOPES = ['profile', 'email'];

// Android app identity used by the native Google Sign-In flow. Both of these
// MUST be registered in Google Cloud Console (APIs & Services → Credentials)
// as an OAuth client ID of type "Android", in the same project that owns the
// web client ID above:
//   - Package name: com.eduaicompanion.app
//   - SHA-1 certificate fingerprint (debug signing keystore at
//     signing/android-debug.keystore, password "android")
//
// If the APK is signed with a different keystore (e.g. a release keystore
// or Google Play App Signing), register THAT keystore's SHA-1 instead.
// Google Sign-In error code 10 ("Something went wrong" / DEVELOPER_ERROR)
// means this fingerprint is missing, the OAuth client is in the wrong
// project, or the consent screen is not published.
//
// The workflow .github/workflows/build-android2.yml copies the committed
// keystore and patches android/app/src/main/res/values/strings.xml with
// server_client_id so the native plugin always resolves the Web client ID
// even without a google-services.json.
export const ANDROID_APP_PACKAGE_NAME = 'com.eduaicompanion.app';

export const ANDROID_DEBUG_SHA1 =
  '73:BB:00:87:CF:0B:C5:43:B7:60:37:01:03:CE:D3:47:9E:5E:D5:FD';

export const ANDROID_DEBUG_SHA256 =
  'F6:92:B7:34:F6:91:BF:55:76:A5:07:D0:78:C6:ED:8F:9F:BA:72:A1:20:A3:2A:39:BA:FD:EF:B4:AF:D7:B9:5A';

// Ring-friendly alias kept for older docs/scripts.
export const FIREBASE_ANDROID_PACKAGE = ANDROID_APP_PACKAGE_NAME;
