import axios from 'axios';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://chat.qwen.ai/s/0145dd4b-aaa1-41e9-9bc7-c20105a84964?fev=0.2.60';
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const startPos = data.indexOf('EduAI Companion: Battle-Tested Prompt Engineering System');
    if (startPos === -1) {
      console.log('Not found');
      return;
    }
    console.log('Found start pos:', startPos);
    
    // Let's print out 30k characters around this pos
    const sub = data.substring(startPos, startPos + 40000);
    fs.writeFileSync('extracted_qwen_text.txt', sub);
    console.log('Saved to extracted_qwen_text.txt');
  } catch (err) {
    console.error(err);
  }
}

run();
