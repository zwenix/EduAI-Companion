const fs = require('fs');
let code = fs.readFileSync('src/components/Messenger.tsx', 'utf8');
code = code.replace(
  /messages: \[\]\n    } as ChatThread\n    };/,
  'messages: []\n    } as ChatThread;'
);
fs.writeFileSync('src/components/Messenger.tsx', code);
