import fs from 'fs';

function run() {
  const raw = fs.readFileSync('qwen_real_share_data.json', 'utf8');
  const parsed = JSON.parse(raw);
  
  const messages = parsed?.data?.chat?.history?.messages || {};
  const keys = Object.keys(messages);
  console.log('Message keys:', keys);
  
  if (keys.length > 0) {
    const firstMsg = messages[keys[0]];
    console.log('First message keys:', Object.keys(firstMsg));
    console.log('First message content type:', typeof firstMsg.content);
    console.log('First message content keys/values:', JSON.stringify(firstMsg.content).substring(0, 300));
    console.log('First message role:', firstMsg.role);
    
    // Let's print out all roles and the structure of content
    keys.forEach((k, i) => {
      const msg = messages[k];
      console.log(`\n--- Message #${i+1} (${msg.role}) ---`);
      console.log('Content Keys:', msg.content ? Object.keys(msg.content) : 'null');
      console.log('Content JSON snippet:', JSON.stringify(msg.content).substring(0, 500));
    });
  }
}

run();
