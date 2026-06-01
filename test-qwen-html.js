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

    fs.writeFileSync('raw-qwen-page.html', data);
    console.log('Wrote raw-qwen-page.html');
  } catch (err) {
    console.error(err);
  }
}

run();
