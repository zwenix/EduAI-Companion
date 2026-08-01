import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { AiProvider } from './contexts/AiContext.tsx';
import { generateImageWithFallback } from './lib/imageGeneration.ts';


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
