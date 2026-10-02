const fs = require('fs');
const files = [
  'src/components/AdminDashboard.tsx',
  'src/components/CurriculumSuite.tsx',
  'src/components/ProgressReports.tsx',
  'src/components/WeeklyPlanner.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  // Remove any trailing whitespace/newlines
  code = code.trimEnd();
  
  // Find the last return (
  // Actually, let's just find the last );\n}
  // and replace it with a clean version.
  
  // First, check if there's a semicolon at the end of the function
  if (code.endsWith('};')) {
     code = code.slice(0, -2) + '}';
  }
  
  // Ensure we have the right number of closing divs
  // This is risky, but we know we added 4
  
  fs.writeFileSync(file, code + '\n');
});
