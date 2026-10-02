const fs = require('fs');
let content = fs.readFileSync('src/lib/prompts/content-templates.ts', 'utf8');

// Fix Visual Aid Banner (remove text-white parent, add dark text to h1/p)
content = content.replace(
  /<div class="banner bg-gradient-to-br from-\[subject-start\] via-\[subject-mid\] to-\[subject-end\] p-8 md:p-12 text-white relative overflow-hidden" style="background: linear-gradient\(135deg, \${primary}, \${dark}\);">/g,
  '<div class="banner bg-gradient-to-br from-[subject-start] via-[subject-mid] to-[subject-end] p-8 md:p-12 text-slate-950 relative overflow-hidden" style="background: linear-gradient(135deg, ${light}, ${light});">'
);

// Fix Study Guide Banner (remove text-white parent, add dark text to h1/p)
content = content.replace(
  /<header class="cover text-white p-12 md:p-16 text-center relative overflow-hidden" style="background: linear-gradient\(135deg, \${primary}, \${dark}\);">/g,
  '<header class="cover text-slate-950 p-12 md:p-16 text-center relative overflow-hidden" style="background: linear-gradient(135deg, ${light}, ${light});">'
);

fs.writeFileSync('src/lib/prompts/content-templates.ts', content);
console.log('Fixed all banner text colors');
