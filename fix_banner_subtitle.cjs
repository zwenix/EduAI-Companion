const fs = require('fs');
let content = fs.readFileSync('src/lib/prompts/content-templates.ts', 'utf8');

content = content.replace(/text-white\/90/g, 'text-slate-900/90');

fs.writeFileSync('src/lib/prompts/content-templates.ts', content);
console.log('Fixed banner subtitle text color');
