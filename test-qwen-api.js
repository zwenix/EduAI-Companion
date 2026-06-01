import axios from 'axios';

async function testEndpoint(url) {
  try {
    console.log('Testing endpoint:', url);
    const { data, headers } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    const contentType = headers['content-type'] || '';
    if (contentType.includes('html')) {
      return false;
    }
    
    console.log('SUCCESS API MATCH!', url);
    console.log('Response Keys:', Object.keys(data));
    console.log(JSON.stringify(data).substring(0, 1000));
    if (data.success !== false) {
      console.log('=====> FOUND FUNCTIONAL ENDPOINT WITH TRUE SUCCESS!');
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

async function run() {
  const shareId = '0145dd4b-aaa1-41e9-9bc7-c20105a84964';
  const endpoints = [
    `https://chat.qwen.ai/api/v2/shares/${shareId}`,
    `https://chat.qwen.ai/api/v2/share/${shareId}`,
    `https://chat.qwen.ai/api/v2/shared-chats/${shareId}`,
    `https://chat.qwen.ai/api/v2/shared/${shareId}`,
    `https://chat.qwen.ai/api/shares/v2/${shareId}`,
    `https://chat.qwen.ai/api/share/v2/${shareId}`,
    `https://chat.qwen.ai/api/v1/shares/detail/${shareId}`,
    `https://chat.qwen.ai/api/v1/share/detail/${shareId}`,
    `https://chat.qwen.ai/api/v2/shares/detail/${shareId}`,
    `https://chat.qwen.ai/api/v2/share/detail/${shareId}`,
    `https://chat.qwen.ai/api/v1/shared-chats/detail/${shareId}`,
    `https://chat.qwen.ai/api/v2/shared-chats/detail/${shareId}`,
    `https://chat.qwen.ai/api/shares/detail/${shareId}`,
    `https://chat.qwen.ai/api/share/detail/${shareId}`,
    `https://chat.qwen.ai/api/shared-chats/${shareId}/messages`,
    `https://chat.qwen.ai/api/v2/shared-chats/${shareId}/messages`,
    `https://chat.qwen.ai/api/shares/${shareId}/messages`,
    // more variations
    `https://chat.qwen.ai/api/v2/shares/info/${shareId}`,
    `https://chat.qwen.ai/api/v2/shared-chats/info/${shareId}`,
    `https://chat.qwen.ai/api/shares/info/${shareId}`,
    `https://chat.qwen.ai/api/v2/posts/${shareId}`,
    `https://chat.qwen.ai/api/v2/chats/share/${shareId}`
  ];
  
  for (const ep of endpoints) {
    const res = await testEndpoint(ep);
    if (res) {
      break;
    }
  }
}

run();
