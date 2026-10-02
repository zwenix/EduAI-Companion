const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf-8');

const importsToAdd = `import webpush from 'web-push';\n`;

// Generate VAPID keys for session
const vapidCode = `
// Web Push VAPID keys for this session
const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  'mailto:support@eduai.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscriptions in memory (in a real app, save to DB)
const pushSubscriptions = [];

app.get('/api/notifications/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', (req, res) => {
  const subscription = req.body;
  // avoid duplicates
  if (!pushSubscriptions.find(s => s.endpoint === subscription.endpoint)) {
    pushSubscriptions.push(subscription);
  }
  res.status(201).json({ success: true });
});

app.post('/api/notifications/send', async (req, res) => {
  const { title, body, url } = req.body;
  const payload = JSON.stringify({ title, body, url });
  
  const notifications = pushSubscriptions.map(sub => 
    webpush.sendNotification(sub, payload).catch(err => {
      console.error('Error sending push:', err);
      // Remove failed subscription (e.g., user revoked permission)
      const idx = pushSubscriptions.indexOf(sub);
      if (idx > -1) pushSubscriptions.splice(idx, 1);
    })
  );
  
  await Promise.all(notifications);
  res.status(200).json({ success: true, count: pushSubscriptions.length });
});
`;

if (!serverTs.includes('import webpush')) {
  // Add import at the top
  serverTs = importsToAdd + serverTs;
  
  // Add routes after app initialization
  serverTs = serverTs.replace('const app = express();\nconst PORT = 3000;\n', 'const app = express();\nconst PORT = 3000;\n' + vapidCode);
  
  fs.writeFileSync('server.ts', serverTs);
  console.log('web-push code added to server.ts');
} else {
  console.log('web-push already exists in server.ts');
}

