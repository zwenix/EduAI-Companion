const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldCached = 'cachedWorkingModel           ? [cachedWorkingModel, "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]';
const newCached = 'cachedWorkingModel           ? [cachedWorkingModel, "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"]';

content = content.replace(oldCached, newCached);

fs.writeFileSync('server.ts', content);
console.log('Updated cachedWorkingModel list');
