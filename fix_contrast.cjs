const fs = require('fs');
let content = fs.readFileSync('src/lib/prompts/master-prompt.ts', 'utf8');

const oldContrast = `   • STRICT BANNER & TEXT COLOR CONTRAST: To guarantee perfect accessibility and readability, all generated text over any background or banner MUST have high visual contrast (ratio >= 4.5:1). If a banner uses light or highly vibrant colors (such as orange, amber, yellow, cyan, mint, lime, or any light pastel/accent color), you MUST use dark text (e.g. text-slate-900 or text-black). Do NOT use white text (text-white) over yellow, orange, cyan, mint, or light blue backgrounds. White text is strictly restricted to deep, dark background colors (such as dark royal blue, deep purple, forest green, or dark slate).`;

content = content.replace(oldContrast, `   • Maintain consistent padding throughout
   • Use shadow-lg or shadow-xl for elevation

6. STRICT BANNER & TEXT COLOR CONTRAST (MANDATORY):
   • If a background or banner is light or vibrant (bg-orange-*, bg-amber-*, bg-yellow-*, bg-cyan-*, bg-teal-300, bg-pink-300, bg-white, bg-slate-50): YOU MUST USE \`text-slate-900\`.
   • NEVER use \`text-white\` on orange, amber, yellow, or white backgrounds.
   • \`text-white\` is ONLY allowed on deep backgrounds (bg-blue-800, bg-purple-800, bg-slate-900).`);

fs.writeFileSync('src/lib/prompts/master-prompt.ts', content);
console.log('Fixed contrast');
