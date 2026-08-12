import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eduaicompanion.app',
  appName: 'EduAI Companion',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      // IMPORTANT: replace with YOUR Firebase "Web client ID"
      // (Firebase Console -> Project settings -> Your apps -> Web app -> Web client ID).
      // It looks like: 1234567890-xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
      clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    },
  },
};

export default config;
