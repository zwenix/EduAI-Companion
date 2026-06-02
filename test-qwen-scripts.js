import axios from 'axios';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://chat.qwen.ai/s/0145dd4b-aaa1-41e9-9bc7-c20105a84964?fev=0.2.60';
    console.log('Fetching', url);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    // Find script tags
    const rx = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let count = 0;
    let content = '';
    while ((match = rx.exec(data)) !== null) {
      count++;
      const src = /src="([^"]+)"/.exec(match[0]);
      if (!src) {
        content += `\n\n// ==================== INLINE SCRIPT #${count} (length: ${match[1].length}) ====================\n`;
        content += match[1];
      }
    }
    fs.writeFileSync('all-scripts.js', content);
    console.log('Successfully wrote all inline scripts to all-scripts.js');
  } catch (err) {
    console.error('Error fetching Qwen share link:', err);
  }
}

run();
