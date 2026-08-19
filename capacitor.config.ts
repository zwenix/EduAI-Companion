import type { CapacitorConfig } from '@capacitor/cli';
import { FIREBASE_WEB_CLIENT_ID, GOOGLE_AUTH_SCOPES } from './src/config/googleAuth';

const config: CapacitorConfig = {
  appId: 'com.eduaicompanion.app',
  appName: 'EduAI Companion',
  webDir: 'dist',
  android: {
    // The app handles the hardware back button itself (see
    // src/lib/useAndroidBackButton.ts) so a back press navigates within the app
    // instead of closing it on the first tap.
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    GoogleAuth: {
      // The Web OAuth client ID is used on both web and Android to request the
      // Google ID token that Firebase exchanges for a session. It must live in
      // the same Google Cloud project as the Android OAuth client (package
      // com.eduaicompanion.app + SHA-1 73:BB:…:FD). See GOOGLE_SIGNIN_ANDROID_SETUP.md
      // and src/config/googleAuth.ts for registration steps.
      clientId: FIREBASE_WEB_CLIENT_ID,
      androidClientId: FIREBASE_WEB_CLIENT_ID,
      serverClientId: FIREBASE_WEB_CLIENT_ID,
      scopes: GOOGLE_AUTH_SCOPES,
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
