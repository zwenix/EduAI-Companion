const fs = require('fs');
let content = fs.readFileSync('src/services/unifiedAiService.ts', 'utf8');

content = content.replace(
  `    const parsed = safeJsonParse(response);
    if (Object.keys(parsed).length === 0) {`,
  `    const parsed = safeJsonParse(response);
    if (Object.keys(parsed).length === 0) {
      console.warn("safeJsonParse returned empty object for response:", response);`
);

fs.writeFileSync('src/services/unifiedAiService.ts', content);
console.log('Added debug log');
