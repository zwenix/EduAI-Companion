const fs = require('fs');
let content = fs.readFileSync('src/lib/prompts/master-prompt.ts', 'utf8');

content = content.replace(/YOU MUST USE `text-slate-900`/g, "YOU MUST USE text-slate-900");
content = content.replace(/NEVER use `text-white`/g, "NEVER use text-white");
content = content.replace(/`text-white` is ONLY allowed/g, "text-white is ONLY allowed");

fs.writeFileSync('src/lib/prompts/master-prompt.ts', content);
console.log('Fixed backticks');
