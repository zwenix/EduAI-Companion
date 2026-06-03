import axios from 'axios';

const id = 't_7d825e28-eb57-48ad-a712-a27b4739e641';

const endpoints = [
  `https://chat.qwen.ai/api/v2/chats/share/${id}`,
  `https://chat.qwen.ai/api/v2/threads/share/${id}`,
  `https://chat.qwen.ai/api/v2/shares/${id}`,
  `https://chat.qwen.ai/api/v2/share/${id}`,
  `https://chat.qwen.ai/api/v2/share/chats/${id}`,
  `https://chat.qwen.ai/api/v2/chats/${id}/share`,
  `https://chat.qwen.ai/api/v1/chats/share/${id}`,
  `https://chat.qwen.ai/api/v1/threads/share/${id}`,
];

async function run() {
  for (const url of endpoints) {
    try {
      console.log('Testing endpoint:', url);
      const { data, status } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        timeout: 4000
      });
      if (data.success) {
        console.log(`-> ACTUAL SUCCESS! Status: ${status}, keys:`, Object.keys(data), JSON.stringify(data).substring(0, 500));
        return;
      } else {
        console.log(`-> JSON payload indicated failure:`, data);
      }
    } catch (err) {
      if (err.response) {
        console.log(`-> Failed with status ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else {
        console.log(`-> Failed: ${err.message}`);
      }
    }
  }
}

run();
