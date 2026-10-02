const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/gemini-3\.5-flash/g, 'gemini-2.5-flash');
content = content.replace(/gemini-3\.1-flash-lite/g, 'gemini-2.0-flash-lite');

fs.writeFileSync('server.ts', content);

let multiContent = fs.readFileSync('src/services/multiAiService.ts', 'utf8');
multiContent = multiContent.replace(/gemini-3\.5-flash/g, 'gemini-2.5-flash');
multiContent = multiContent.replace(/gemini-3\.1-flash-lite/g, 'gemini-2.0-flash-lite');
fs.writeFileSync('src/services/multiAiService.ts', multiContent);

let unifiedContent = fs.readFileSync('src/services/unifiedAiService.ts', 'utf8');
unifiedContent = unifiedContent.replace(/gemini-3\.5-flash/g, 'gemini-2.5-flash');
unifiedContent = unifiedContent.replace(/gemini-3\.1-flash-lite/g, 'gemini-2.0-flash-lite');
fs.writeFileSync('src/services/unifiedAiService.ts', unifiedContent);

let geminiContent = fs.readFileSync('src/services/geminiService.ts', 'utf8');
geminiContent = geminiContent.replace(/gemini-3\.5-flash/g, 'gemini-2.5-flash');
geminiContent = geminiContent.replace(/gemini-3\.1-flash-lite/g, 'gemini-2.0-flash-lite');
fs.writeFileSync('src/services/geminiService.ts', geminiContent);

console.log('Fixed gemini models');
