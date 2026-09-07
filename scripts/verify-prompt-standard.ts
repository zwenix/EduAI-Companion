import { EduAIPromptEngine } from '../src/lib/prompt-engine';
import { getSystemPrompt, enhanceUserPrompt } from '../src/lib/prompts/system-prompts';
import { MASTER_SYSTEM_PROMPT } from '../src/services/geminiService';
import { ENHANCED_MASTER_PROMPT } from '../src/lib/prompts/master-prompt';

const MARKER = 'EDUAI WORLD-CLASS';
let pass = 0, fail = 0;
const has = (label: string, text: string) => {
  if (text.includes(MARKER)) { pass++; console.log(`  ✅ ${label} (${text.length.toLocaleString()} chars)`); }
  else { fail++; console.log(`  ❌ ${label} — World-Class Standard NOT injected`); }
};

console.log('\n── World-Class Standard injection ──');
has('ENHANCED_MASTER_PROMPT', ENHANCED_MASTER_PROMPT);
has('geminiService MASTER_SYSTEM_PROMPT', MASTER_SYSTEM_PROMPT);
has('getSystemPrompt("worksheet")', getSystemPrompt('worksheet'));
has('getSystemPrompt("lesson-plan")', getSystemPrompt('lesson-plan'));
has('getSystemPrompt("assessment")', getSystemPrompt('assessment'));
has('enhanceUserPrompt', enhanceUserPrompt('Base', { grade: '5', subject: 'Mathematics', topic: 'Fractions' }));

const full = EduAIPromptEngine.assemblePrompt({
  contentType: 'lesson-plan', grade: '5', subject: 'Mathematics',
  topic: 'Equivalent Fractions', language: 'English', term: 'Term 2',
} as any);
has('assemblePrompt → system', full.system);

const compressed = EduAIPromptEngine.assemblePrompt({
  contentType: 'worksheet', grade: '2', subject: 'Life Skills',
  topic: 'Weather', language: 'English', isGroq: true,
} as any);
has('assemblePrompt (compressed) → system', compressed.system);

console.log('\n── Clause coverage in the assembled system prompt ──');
const clauses: [string, RegExp][] = [
  ['Completeness contract', /COMPLETENESS CONTRACT/i],
  ['Banned placeholder list', /lorem ipsum/i],
  ['Factual precision', /FACTUAL & EDITORIAL PRECISION/i],
  ['Pedagogical rigour', /PEDAGOGICAL RIGOUR/i],
  ['Design excellence', /DESIGN & TYPOGRAPHIC EXCELLENCE/i],
  ['Reasoning hygiene', /REASONING HYGIENE/i],
  ['Pre-flight audit', /SILENT PRE-FLIGHT AUDIT/i],
  ['Memorandum parity', /MEMORANDUM PARITY/i],
  ['Numerical integrity', /NUMERICAL INTEGRITY/i],
];
for (const [label, re] of clauses) {
  if (re.test(full.system)) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}`); }
}

console.log(`\n${fail === 0 ? '🎉' : '💥'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
