import fs from 'fs';

function run() {
  const raw = fs.readFileSync('qwen_real_share_data.json', 'utf8');
  const parsed = JSON.parse(raw);
  
  const messages = parsed?.data?.chat?.history?.messages || {};
  const keys = Object.keys(messages);
  
  keys.forEach((k) => {
    const msg = messages[k];
    if (msg.role === 'assistant') {
      console.log(`\n\n=== ASSISTANT MESSAGE KEY: ${k} ===`);
      console.log('All Keys of Message:', Object.keys(msg));
      
      // Let's print out non-null keys and their types/contents
      Object.keys(msg).forEach((key) => {
        const val = msg[key];
        if (val !== null && val !== undefined) {
          console.log(`- ${key}: (${typeof val})`, typeof val === 'object' ? JSON.stringify(val).substring(0, 300) : val);
        }
      });
    }
  });
}

run();
