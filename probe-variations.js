import axios from 'axios';

const idWithT = 't_7d825e28-eb57-48ad-a712-a27b4739e641';
const idWithoutT = '7d825e28-eb57-48ad-a712-a27b4739e641';

const templates = [
  'https://chat.qwen.ai/api/v2/chats/share/{}',
  'https://chat.qwen.ai/api/v2/threads/share/{}',
  'https://chat.qwen.ai/api/v2/shares/{}',
  'https://chat.qwen.ai/api/v2/share/{}',
  'https://chat.qwen.ai/api/v2/share/chats/{}',
];

async function run() {
  for (const template of templates) {
    for (const val of [idWithT, idWithoutT]) {
      const url = template.replace('{}', val);
      try {
        console.log('Testing:', url);
        const { data } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          timeout: 4000
        });
        if (data.success) {
          console.log(`\n=== SUCCESS ===\nURL: ${url}\nKeys:`, Object.keys(data), `\nData:`, JSON.stringify(data).substring(0, 1000));
          return;
        } else {
          console.log(`  -> Response indicates success=false:`, data.data);
        }
      } catch (err) {
        // failed
      }
    }
  }
  console.log('All probes complete. No direct API endpoint matches.');
}

run();
