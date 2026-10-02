const fs = require('fs');
let code = fs.readFileSync('src/components/AITutorPage.tsx', 'utf8');

const regex = /const EllyFace = \(\{ className = "w-16 h-16" \}: \{ className\?: string \}\) => \(\s*<svg[\s\S]*?<\/svg>\s*\);/g;

code = code.replace(regex, `import Logo from './Logo';

const EllyFace = ({ className = "w-16 h-16" }: { className?: string }) => (
  <div className={\`\${className} relative flex items-center justify-center overflow-hidden shrink-0\`}>
    <Logo className="w-full h-full object-contain" />
  </div>
);`);

// Wait, we need to handle if import Logo already exists, but it's safe to just define EllyFace using Logo if it's imported or we can just require it.
fs.writeFileSync('src/components/AITutorPage.tsx', code);
