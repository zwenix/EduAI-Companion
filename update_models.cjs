const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Update generateContentWithFallback models
const oldModels = '["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]';
const newModels = '["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"]';

content = content.split(oldModels).join(newModels);

fs.writeFileSync('server.ts', content);
console.log('Updated model list');
