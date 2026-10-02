const fs = require('fs');
let content = fs.readFileSync('src/components/Messenger.tsx', 'utf-8');

content = content.replace(
  /url: '\/messenger'\n\s*\}\)/g,
  `url: '/messenger',
              userId: activeThread.recipientId || ''
            })`
);

fs.writeFileSync('src/components/Messenger.tsx', content);
console.log('Updated Messenger.tsx');
