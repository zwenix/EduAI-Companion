import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { AiProvider } from './contexts/AiContext.tsx';
import { installImageRecovery } from './lib/imageRecovery.ts';
import { installNativeDownloadBridge } from './lib/nativeDownloadBridge.ts';
import { installExportSafetyNet } from './lib/exportSafetyNet.ts';

// Detect Android WebView once at boot and tag <html> so CSS can disable
// expensive backdrop-blur/animations that cause flickering on that platform.
(function detectAndroid() {
  try {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isWebView = /wv|WebView|; wv\)/i.test(ua);
    if (isAndroid) document.documentElement.classList.add('android-webview');
    if (isWebView) document.documentElement.classList.add('in-webview');
    // Expose a tiny helper so components can toggle the "generating" class
    // without fighting over classList state.
    let genCounter = 0;
    (window as any).__eduaiSetGenerating = (on: boolean) => {
      genCounter = Math.max(0, genCounter + (on ? 1 : -1));
      document.body.classList.toggle('eduai-generating', genCounter > 0);
    };
  } catch {}
})();

// Catch generated illustrations whose direct URL fails (most importantly the
// backend-only /api/image-proxy route inside the Android APK) and re-resolve
// them through the provider chain instead of leaving a blank placeholder.
installImageRecovery();

// Android WebView drops blob downloads and turns blank popups into external
// browser intents. This bridge routes every `<a download>` export through the
// device filesystem + share sheet instead (PDF, HTML, images, video, JSON…).
installNativeDownloadBridge();

// Remove any invisible html2pdf overlay / cloned iframe left behind by a failed
// export so a stuck layer can never make the app look frozen.
installExportSafetyNet();


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
