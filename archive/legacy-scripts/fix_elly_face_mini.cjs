const fs = require('fs');
let code = fs.readFileSync('src/components/StudentAITutorBubble.tsx', 'utf8');

const regex = /const EllyFaceMini = \(\{ className = "w-10 h-10" \}: \{ className\?: string \}\) => \(\s*<svg[\s\S]*?<\/svg>\s*\);/g;

code = code.replace(regex, `import Logo from './Logo';

const EllyFaceMini = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={\`\${className} relative flex items-center justify-center overflow-hidden shrink-0\`}>
    <Logo className="w-full h-full object-contain" />
  </div>
);`);

fs.writeFileSync('src/components/StudentAITutorBubble.tsx', code);
