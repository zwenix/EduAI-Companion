// OAuth client IDs are public identifiers, not secrets. Keep the native
// Capacitor configuration and the runtime initialization on this single value
// so Android always requests a Firebase-compatible Google ID token.
export const FIREBASE_WEB_CLIENT_ID =
  '725068822716-tv8hh929bsagjliekkoq4ptkcfb3gs0k.apps.googleusercontent.com';

export const GOOGLE_AUTH_SCOPES = ['profile', 'email'];
