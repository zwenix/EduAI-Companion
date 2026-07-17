const fs = require('fs');

const file = 'src/components/ContentCreator.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /className="h-24 text-xs rounded-xl resize-none bg-white\/5 border-white\/10 placeholder:text-slate-600 text-slate-300 p-3 w-full outline-none focus:border-indigo-500\/50"/g,
  'className="h-24 text-xs resize-none w-full"'
);

fs.writeFileSync(file, content);
console.log("Fixed Textarea className");
