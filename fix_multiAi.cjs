const fs = require('fs');
let content = fs.readFileSync('src/services/multiAiService.ts', 'utf8');

const targetStr = `  if (isAltModel) {
    payload.response_format = { type: "json_object" };
  }`;

content = content.replace(targetStr, `  // Let the prompt dictate JSON mode, do not force it which causes issues with certain models on openrouter`);

fs.writeFileSync('src/services/multiAiService.ts', content);
console.log('Fixed multiAiService.ts');
