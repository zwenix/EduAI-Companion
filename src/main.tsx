import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { AiProvider } from './contexts/AiContext.tsx';
import { installImageRecovery } from './lib/imageRecovery.ts';

// Catch generated illustrations whose direct URL fails (most importantly the
// backend-only /api/image-proxy route inside the Android APK) and re-resolve
// them through the provider chain instead of leaving a blank placeholder.
installImageRecovery();


import { NotificationManager } from './lib/notifications/NotificationManager';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    NotificationManager.init();
  });
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AiProvider>
      <App />
    </AiProvider>
  </StrictMode>,
);
