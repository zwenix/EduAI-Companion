const fs = require('fs');

const file = 'src/components/ContentCreator.tsx';
let content = fs.readFileSync(file, 'utf8');

const headerOld = `<h2 className="text-lg md:text-xl lg:text-2xl font-hand text-white">Content Creator Studio</h2>`;
const headerNew = `<div className="flex flex-col">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-hand font-bold text-white leading-tight">Lesson Architect</h2>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400">Intelligence Engine</span>
                </div>`;

content = content.replace(headerOld, headerNew);
fs.writeFileSync(file, content);
console.log("Replacement successful");
