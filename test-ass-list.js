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
      if (Array.isArray(msg.content_list)) {
        console.log(`content_list size: ${msg.content_list.length}`);
        msg.content_list.forEach((item, idx) => {
          console.log(`- Item #${idx+1} keys:`, Object.keys(item));
          console.log(`  phase: ${item.phase}, status: ${item.status}`);
          console.log(`  content length: ${item.content ? item.content.length : 0}`);
          if (item.content) {
            console.log(`  content snippet: ${item.content.substring(0, 300)}`);
            // write it to a separate file so we can see it
            fs.writeFileSync(`assistant_msg_${k}_item_${idx+1}.txt`, item.content);
            console.log(`  Wrote full content of item #${idx+1} to assistant_msg_${k}_item_${idx+1}.txt`);
          }
        });
      } else {
        console.log('No content_list array');
      }
    }
  });
}

run();
