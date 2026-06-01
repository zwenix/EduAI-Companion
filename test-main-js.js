import axios from 'axios';

async function run() {
  try {
    const url = 'https://assets.alicdn.com/g/qwenweb/qwen-chat-fe/0.2.60/js/main.js';
    console.log('Fetching', url);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    console.log('Searching for endpoints containing share...');
    // find all occurrences of strings like /api/...share... or similar
    const rx = /"\/api\/[^"]*share[^"]*"/gi;
    let match;
    const s = new Set();
    while ((match = rx.exec(data)) !== null) {
      s.add(match[0]);
    }
    const rx2 = /'\/api\/[^']*share[^']*'/gi;
    while ((match = rx2.exec(data)) !== null) {
      s.add(match[0]);
    }
    
    console.log('Matches:', [...s]);
  } catch (err) {
    console.error(err);
  }
}

run();
