const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// remove response_format
const targetStr = `      // Force JSON mode for alternative models to ensure they output valid JSON values
      if (provider === "groq-gpt-oss" || provider === "groq-qwen") {
        payload.response_format = { type: "json_object" };
      }`;

content = content.replace(targetStr, `      // JSON mode is handled by prompt instruction`);

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts');
