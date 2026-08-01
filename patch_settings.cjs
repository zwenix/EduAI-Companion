const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf-8');

const importStatement = `import { NotificationManager } from '../lib/notifications/NotificationManager';\n`;
if (!content.includes('NotificationManager')) {
  content = importStatement + content;
}

// Replace the onChange handler for Push Notifications
content = content.replace(
  /onChange=\{e => setNotifications\(e\.target\.checked\)\}/g,
  `onChange={async (e) => {
                        const checked = e.target.checked;
                        setNotifications(checked);
                        if (checked) {
                          await NotificationManager.init();
                        }
                      }}`
);

fs.writeFileSync('src/components/Settings.tsx', content);
console.log('Patched Settings.tsx');
