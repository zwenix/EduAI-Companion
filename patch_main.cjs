const fs = require('fs');

let content = fs.readFileSync('src/main.tsx', 'utf-8');

// Replace the old SW registration logic
const newSwLogic = `
import { NotificationManager } from './lib/notifications/NotificationManager';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    NotificationManager.init();
  });
}
`;

content = content.replace(/\/\/ Register Service Worker for Offline access in production only[\s\S]*\}\);[\s]*\}/m, newSwLogic);

if (!content.includes('NotificationManager')) {
  console.log('Could not replace. Adding manually.');
  // If replacement failed, just append to bottom
  content += `\n${newSwLogic}`;
}

fs.writeFileSync('src/main.tsx', content);
console.log('Patched main.tsx');
