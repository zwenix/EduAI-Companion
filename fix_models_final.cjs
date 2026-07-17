const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace the bad array directly.
const oldArray = '["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]';
const newArray = '["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"]';

// The cache one is slightly different
const oldCached = '[cachedWorkingModel, "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]';
const newCached = '[cachedWorkingModel, "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"]';

content = content.replace(new RegExp(oldArray.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), newArray);
content = content.replace(new RegExp(oldCached.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), newCached);

fs.writeFileSync('server.ts', content);
console.log('Fixed all model arrays');
