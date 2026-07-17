const fs = require('fs');
let content = fs.readFileSync('src/lib/prompts/content-templates.ts', 'utf8');

content = content.replace(/<h1 class="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">/g, '<h1 class="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-950">');

fs.writeFileSync('src/lib/prompts/content-templates.ts', content);
console.log('Fixed banner text color');
