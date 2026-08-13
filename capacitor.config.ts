import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eduaicompanion.app',
  appName: 'EduAI Companion',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      clientId: '725068822716-tv8hh929bsagjliekkoq4ptkcfb3gs0k.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    },
  },
};

export default config;
