const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf-8');

// We need to replace the /api/notifications routes
const newRoutes = `
app.get('/api/notifications/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  // avoid duplicates
  if (!pushSubscriptions.find(s => s.subscription.endpoint === subscription.endpoint)) {
    pushSubscriptions.push({ subscription, userId });
  } else {
    // update userId if it changed
    const existing = pushSubscriptions.find(s => s.subscription.endpoint === subscription.endpoint);
    if (existing) existing.userId = userId;
  }
  res.status(201).json({ success: true });
});

app.post('/api/notifications/send', async (req, res) => {
  const { title, body, url, userId } = req.body;
  const payload = JSON.stringify({ title, body, url });
  
  const targetSubs = userId ? pushSubscriptions.filter(s => s.userId === userId) : pushSubscriptions;
  
  const notifications = targetSubs.map(subData => 
    webpush.sendNotification(subData.subscription, payload).catch(err => {
      console.error('Error sending push:', err);
      // Remove failed subscription (e.g., user revoked permission)
      const idx = pushSubscriptions.indexOf(subData);
      if (idx > -1) pushSubscriptions.splice(idx, 1);
    })
  );
  
  await Promise.all(notifications);
  res.status(200).json({ success: true, count: targetSubs.length });
});
`;

serverTs = serverTs.replace(/app\.get\('\/api\/notifications\/vapid-public-key'[\s\S]*?res\.status\(200\)\.json\(\{ success: true, count: pushSubscriptions\.length \}\);\n\}\);/m, newRoutes);
fs.writeFileSync('server.ts', serverTs);
console.log('Fixed web push routes');
