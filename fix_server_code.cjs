const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Need to match exactly what is in the file.
// The file has:
// const modelsToTry = cachedWorkingModel 
//   ? [cachedWorkingModel, "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]
//   : ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"];

// Actually, let me just replace the entire line range if I can.
// Or just replace the bad part.

// Trying with a simpler approach to replace the array content
const oldArray = 'cachedWorkingModel           ? [cachedWorkingModel, "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]';
const newArray = 'cachedWorkingModel           ? [cachedWorkingModel, "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"]';

// The file might have different spacing due to previous attempts.
// Let's read the file and do a smarter replace.

const start = content.indexOf('const modelsToTry =');
const end = content.indexOf(';', start);
const line = content.substring(start, end);

const updatedLine = line.replace('"gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"', '"gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"');

content = content.replace(line, updatedLine);

fs.writeFileSync('server.ts', content);
console.log('Fixed models line');
