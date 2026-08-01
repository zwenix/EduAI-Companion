const fs = require('fs');
let content = fs.readFileSync('src/lib/notifications/NotificationManager.ts', 'utf-8');

content = content.replace(
  /static async init\(\) \{/,
  `static async init(userId?: string) {`
);

content = content.replace(
  /body: JSON\.stringify\(subscription\)/,
  `body: JSON.stringify({ subscription, userId })`
);

fs.writeFileSync('src/lib/notifications/NotificationManager.ts', content);
console.log('Patched NotificationManager');
