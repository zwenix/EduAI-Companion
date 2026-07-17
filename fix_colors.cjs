const fs = require('fs');
let content = fs.readFileSync('src/lib/prompts/master-prompt.ts', 'utf8');

const oldColors = `5. COLOR SYSTEM (Subject-Specific Palettes):
   • Mathematics: Deep blue (#1e40af) → Sky blue (#0ea5e9) → Cyan (#06b6d4)
   • Languages: Royal purple (#7c3aed) → Violet (#8b5cf6) → Lavender (#a78bfa)
   • Life Skills: Warm orange (#ea580c) → Amber (#f59e0b) → Yellow (#fbbf24)
   • Natural Sciences: Forest green (#059669) → Emerald (#10b981) → Mint (#34d399)
   • Social Sciences: Rich brown (#92400e) → Terracotta (#dc2626) → Coral (#f87171)
   • Arts & Culture: Magenta (#db2777) → Pink (#ec4899) → Rose (#f472b6)
   • Technology: Slate gray (#334155) → Steel blue (#475569) → Silver (#94a3b8)
   • Business/EMS: Gold (#ca8a04) → Bronze (#b45309) → Copper (#d97706)`;

const newColors = `5. COLOR SYSTEM (Subject-Specific Tailwind Palettes):
   • Mathematics: bg-blue-600 to bg-cyan-500
   • Languages: bg-purple-600 to bg-violet-400
   • Life Skills: bg-orange-500 to bg-amber-400 (Always use text-slate-900 on these banners)
   • Natural Sciences: bg-emerald-600 to bg-teal-400
   • Social Sciences: bg-red-600 to bg-rose-400
   • Arts & Culture: bg-pink-600 to bg-fuchsia-400
   • Technology: bg-slate-700 to bg-slate-500
   • Business/EMS: bg-amber-600 to bg-yellow-400 (Always use text-slate-900 on these banners)`;

content = content.replace(oldColors, newColors);

fs.writeFileSync('src/lib/prompts/master-prompt.ts', content);
console.log('Fixed colors');
