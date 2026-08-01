const fs = require('fs');

let content = fs.readFileSync('src/components/Messenger.tsx', 'utf-8');

const pushNotificationCall = `
        // Trigger push notification
        try {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: \`New message from \${currentUserName}\`,
              body: msgText,
              url: '/messenger'
            })
          });
        } catch (e) {
          console.error('Failed to trigger push notification', e);
        }
`;

if (!content.includes('/api/notifications/send')) {
  content = content.replace(
    /createdAt: serverTimestamp\(\)\n\s*\}\);/,
    `createdAt: serverTimestamp()\n        });${pushNotificationCall}`
  );
  fs.writeFileSync('src/components/Messenger.tsx', content);
  console.log('Patched Messenger.tsx');
} else {
  console.log('Already patched Messenger.tsx');
}
