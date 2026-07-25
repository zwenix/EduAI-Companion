const fs = require('fs');
let code = fs.readFileSync('src/services/unifiedAiService.ts', 'utf8');

const regex = /const systemInstruction = `\$\{MASTER_SYSTEM_PROMPT\}\\n\\nGenerate a formal \$\{input\.documentType\} for \$\{input\.schoolName\}\.[\s\S]*?(?=const response = await multiAiService\.generateContent)/;

const replacement = `const systemInstruction = \`\${MASTER_SYSTEM_PROMPT}\\n\\nGenerate a formal \${input.documentType} for \${input.schoolName || 'the school'}.
  The tone should be \${input.tone || 'Formal'}.
  IMPORTANT: The 'content' field MUST be formatted as visually pleasing HTML string styled with Tailwind CSS classes. DO NOT use generic Markdown.\`;
  const prompt = \`
    Type: \${input.documentType}
    Purpose: \${input.purpose}
    School Name: \${input.schoolName || 'Not specified'}
    Date & Time: \${input.timeDate || 'Not specified'}
    Recipient: \${input.recipient || 'Not specified'}
    Venue: \${input.venue || 'Not specified'}
    Class Teacher: \${input.classTeacher || 'Not specified'}
    School Principal: \${input.schoolPrincipal || 'Not specified'}
    Key Points / Extra Info: \${input.keyPoints || 'None'}
    Include Reply Slip: \${input.includeReplySlip ? 'Yes' : 'No'}
    Language: \${input.language || 'English'}
    \${input.additionalInstructions ? \`User Custom Instructions: \${input.additionalInstructions}\\nMake sure to incorporate all specific details mentioned here.\` : ""}
  \`;
  `;

code = code.replace(regex, replacement);
fs.writeFileSync('src/services/unifiedAiService.ts', code);
