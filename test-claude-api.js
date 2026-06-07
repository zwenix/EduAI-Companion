import axios from 'axios';

async function run() {
  const uuid = 'e8c9346a-44d9-447a-80c4-7475997ca3f0';
  const endpoints = [
    `https://claude.ai/api/shared_conversations/${uuid}`,
    `https://claude.ai/api/share/${uuid}`,
    `https://claude.ai/api/shares/${uuid}`,
  ];

  for (const url of endpoints) {
    console.log(`Trying endpoint: ${url}`);
    try {
      const { status, headers, data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      console.log(`Success! Status: ${status}`);
      console.log('Data keys:', Object.keys(data));
      console.log('Data preview:', JSON.stringify(data).substring(0, 500));
      return; // Stop if success
    } catch (err) {
      console.log(`Failed! Status: ${err.response?.status || err.message}`);
      if (err.response?.data) {
        console.log('Payload:', typeof err.response.data === 'string' ? err.response.data.substring(0, 200) : JSON.stringify(err.response.data).substring(0, 200));
      }
    }
  }
}

run();
