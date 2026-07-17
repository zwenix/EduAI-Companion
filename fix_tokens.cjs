const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldCode = `      if (provider === "groq-gpt-oss" || provider === "groq-qwen") {
        payload.max_tokens = 1500;
      }`;

const newCode = `      if (provider === "groq-gpt-oss" || provider === "groq-qwen") {
        payload.max_tokens = 800;
      }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('server.ts', content);
console.log('Fixed max_tokens to 800');
