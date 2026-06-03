import axios from 'axios';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://chat.qwen.ai/s/t_7d825e28-eb57-48ad-a712-a27b4739e641?fev=0.2.62';
    console.log('Fetching', url);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });

    console.log('Successfully fetched main HTML page. Size:', data.length);
    fs.writeFileSync('raw-qwen-page.html', data);
    console.log('Wrote raw-qwen-page.html');
  } catch (err) {
    console.error('Error fetching HTML:', err);
  }
}

run();
