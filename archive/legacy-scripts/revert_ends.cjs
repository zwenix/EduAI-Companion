const fs = require('fs');
const files = [
  'src/components/AdminDashboard.tsx',
  'src/components/CurriculumSuite.tsx',
  'src/components/ProgressReports.tsx',
  'src/components/WeeklyPlanner.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  // Look for the block we added
  const lines = code.split('\n');
  const lastLine = lines.length - 1;
  
  // We want to replace the last 7 lines or so if they match our pattern
  // Pattern: 
  //   </div> (maybe multiple)
  //   );
  // }
  
  // Actually, let's just find the first instance of ');' from the end
  let lastSemicolon = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes(');')) {
      lastSemicolon = i;
      break;
    }
  }
  
  if (lastSemicolon !== -1) {
    // Keep only ONE </div> before the );
    // The ); is on line lastSemicolon
    // The closing brace is on line lastSemicolon + 1
    
    const head = lines.slice(0, lastSemicolon - 4); // Remove the 4 extra divs we might have
    // Wait, this is too dangerous.
    
    // Safer: Replace the specific sequence
    code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}/, '    </div>\n  );\n}');
  }
  
  fs.writeFileSync(file, code);
});
