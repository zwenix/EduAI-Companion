import axios from 'axios';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://chat.qwen.ai/api/v2/chats/share/t_7d825e28-eb57-48ad-a712-a27b4739e641';
    console.log('Fetching full Qwen share content from:', url);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    fs.writeFileSync('qwen_real_share_data.json', JSON.stringify(data, null, 2));
    console.log('Successfully wrote to qwen_real_share_data.json');
    
    // Let's summarize the messages:
    const messages = data?.data?.chat?.history?.messages || {};
    const messageKeys = Object.keys(messages);
    console.log(`Found ${messageKeys.length} messages in history.`);
    
    // Message rendering:
    // Usually Qwen messages are sorted by timestamp or parent. Let's look at the structure and print out the keys/content.
    fs.writeFileSync('message_summaries.txt', '');
    for (const key of messageKeys) {
      const msg = messages[key];
      fs.appendFileSync('message_summaries.txt', `\n\n=== ROLE: ${msg.role} (ID: ${msg.id}) ===\n`);
      fs.appendFileSync('message_summaries.txt', typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
    }
    console.log('Wrote messages to message_summaries.txt');
  } catch (err) {
    console.error('Error in fetching real share JSON:', err);
  }
}

run();
