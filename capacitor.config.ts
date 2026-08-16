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
      // The Android plugin uses this Web OAuth client ID to request the ID
      // token that Firebase Authentication exchanges for a user session.
      clientId: FIREBASE_WEB_CLIENT_ID,
      androidClientId: FIREBASE_WEB_CLIENT_ID,
      scopes: GOOGLE_AUTH_SCOPES,
    },
  },
};

export default config;
