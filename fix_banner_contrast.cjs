const fs = require('fs');
let content = fs.readFileSync('src/lib/prompts/content-templates.ts', 'utf8');

// Replace text-white and text-white/90 with darker colors in banner/header contexts
// Using regex to match specific banner/header structures if possible, but let's be careful.
// The user says "white or light coloured text on banners on white background"

// Worksheet header title (line 14)
content = content.replace('text-4xl md:text-5xl font-black tracking-tight leading-tight text-white', 'text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-950');

// Worksheet grade badge (line 19)
content = content.replace('text-3xl font-black text-white', 'text-3xl font-black text-slate-950');

// Worksheet metadata (line 23, 27, 31)
content = content.replace(/text-white\/90/g, 'text-slate-900');
content = content.replace(/text-white\/80/g, 'text-slate-700');

// Visual Aid banner (line 264)
content = content.replace('p-8 md:p-12 text-white relative overflow-hidden', 'p-8 md:p-12 text-slate-950 relative overflow-hidden');
// And fix banner background (need it to be lighter)
content = content.replace('style="background: linear-gradient(135deg, \${primary}, \${dark});"', 'style="background: linear-gradient(135deg, ${light}, #ffffff);"');

// Study Guide header (line 443)
content = content.replace('text-white p-12 md:p-16 text-center relative overflow-hidden', 'text-slate-950 p-12 md:p-16 text-center relative overflow-hidden');
// And fix background
content = content.replace('style="background: linear-gradient(135deg, \${primary}, \${dark});">', 'style="background: linear-gradient(135deg, ${light}, #ffffff);">');

fs.writeFileSync('src/lib/prompts/content-templates.ts', content);
console.log('Fixed banner text contrast');
