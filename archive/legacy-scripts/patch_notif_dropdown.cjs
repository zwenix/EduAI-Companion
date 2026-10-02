const fs = require('fs');
let content = fs.readFileSync('src/components/NotificationsDropdown.tsx', 'utf-8');

const importManager = `import { NotificationManager } from '../lib/notifications/NotificationManager';\n`;

if (!content.includes('NotificationManager')) {
  content = importManager + content;
}

// Add state for initial load
if (!content.includes('const [isInitialLoad')) {
  content = content.replace(
    /const \[notifications, setNotifications\] = useState<any\[\]>\(\[\]\);/,
    `const [notifications, setNotifications] = useState<any[]>([]);
  const isInitialLoad = React.useRef(true);`
  );
}

const onSnapshotLogic = `const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => {
         const tA = a.createdAt?.seconds || 0;
         const tB = b.createdAt?.seconds || 0;
         return tB - tA;
      });
      setNotifications(data);

      if (!isInitialLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notif = change.doc.data();
            NotificationManager.sendTestNotification(
              notif.title || 'New Notification', 
              notif.message || notif.body || 'You have a new alert', 
              notif.url || '/'
            );
          }
        });
      } else {
        isInitialLoad.current = false;
      }
    }, (error) => console.error("Notifications snapshot fail:", error));`;

content = content.replace(
  /const unsubscribe = onSnapshot\(q, \(snapshot\) => \{[\s\S]*?setNotifications\(data\);\n    \}, \(error\) => console.error\("Notifications snapshot fail:", error\)\);/m,
  onSnapshotLogic
);

fs.writeFileSync('src/components/NotificationsDropdown.tsx', content);
console.log('Patched NotificationsDropdown');
