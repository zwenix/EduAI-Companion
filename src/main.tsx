import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { AiProvider } from './contexts/AiContext.tsx';
import { generateImageWithFallback } from './lib/imageGeneration.ts';

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

  // Global Image Hydration Observer for generated HTML content
  const hydrateImages = () => {
    const images = document.querySelectorAll<HTMLImageElement>('.eduai-async-image:not([data-hydrated="true"])');
    images.forEach(async (img) => {
      img.dataset.hydrated = "true";
      const prompt = img.dataset.eduaiPrompt ? decodeURIComponent(img.dataset.eduaiPrompt) : null;
      const seed = parseInt(img.dataset.eduaiSeed || '0');
      
      if (prompt) {
        try {
          // Use the fallback chain requested by the user
          const result = await generateImageWithFallback({ prompt, width: 800, height: 600, seed });
          img.src = result.url;
        } catch (e) {
          console.error("Image hydration failed", e);
        }
      }
    });
  };

  const observer = new MutationObserver((mutations) => {
    let shouldHydrate = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        shouldHydrate = true;
        break;
      }
    }
    if (shouldHydrate) hydrateImages();
  });
  
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AiProvider>
      <App />
    </AiProvider>
  </StrictMode>,
);
