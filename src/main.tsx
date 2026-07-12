import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { AiProvider } from './contexts/AiContext.tsx';

// Register Service Worker for Offline access in production only
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registered successfully!', reg);
        reg.update();
      })
      .catch(err => console.error('Service Worker registration failed:', err));
  });
} else if ('serviceWorker' in navigator) {
  // Unregister service worker in development to prevent aggressive local caching
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered stale service worker in Dev Mode');
          window.location.reload();
        }
      });
    }
  });
}

// Prevent unhandled rejections from WebSocket connection issues (e.g. from HMR being disabled in remote dev environments)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event.reason?.message || event.reason?.toString?.() || '';
    if (reasonStr.includes('WebSocket') || reasonStr.includes('websocket')) {
      console.debug('Prevented benign HMR WebSocket unhandled promise rejection');
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AiProvider>
      <App />
    </AiProvider>
  </StrictMode>,
);
