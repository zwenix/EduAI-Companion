import {
  buildChatPayload, resolveModelSlug, normalizeEngineId, buildFallbackChain,
  stripReasoningTraces, extractMessageText, getEngine, TEXT_ENGINE_ORDER,
} from '../src/lib/aiModels';

let pass = 0, fail = 0;
const eq = (label: string, actual: any, expected: any) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}\n       got: ${a}\n       exp: ${e}`); }
};

console.log('\n── Model slug resolution ──');
eq('ultra default slug', resolveModelSlug('nvidia-nemotron-3-ultra'), 'nvidia/nemotron-3-ultra-550b-a55b');
eq('lightning default slug', resolveModelSlug('nvidia-nemotron-3-lightning'), 'nvidia/nemotron-3.5-lightning-30b-a3b');
eq('omni default slug', resolveModelSlug('nvidia-nemotron-3-omni'), 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning');
eq('provider id never leaks as model', resolveModelSlug('nvidia-nemotron-3-ultra', 'nvidia-nemotron-3-ultra'), 'nvidia/nemotron-3-ultra-550b-a55b');
eq('nemotron slug never sent to Qwen', resolveModelSlug('alibaba-qwen', 'nvidia/nemotron-3-ultra-550b-a55b'), 'qwen3.8-max');
eq('qwen slug never sent to NVIDIA', resolveModelSlug('nvidia-nemotron-3-ultra', 'qwen3.8-max'), 'nvidia/nemotron-3-ultra-550b-a55b');
eq('same-vendor override honoured', resolveModelSlug('nvidia-nemotron-3-ultra', 'nvidia/nemotron-3-super-120b-a12b'), 'nvidia/nemotron-3-super-120b-a12b');

console.log('\n── Legacy id migration ──');
eq('nvidia-nemotron-ultra', normalizeEngineId('nvidia-nemotron-ultra'), 'nvidia-nemotron-3-ultra');
eq('nvidia-nemotron', normalizeEngineId('nvidia-nemotron'), 'nvidia-nemotron-3-lightning');
eq('groq-qwen', normalizeEngineId('groq-qwen'), 'alibaba-qwen');
eq('unknown id', normalizeEngineId('totally-unknown'), null);

console.log('\n── Payload construction ──');
const ultra = buildChatPayload('nvidia-nemotron-3-ultra', [{ role: 'user', content: 'hi' }]);
eq('ultra: thinking off for structured output', ultra.chat_template_kwargs, { enable_thinking: false });
eq('ultra: temperature', ultra.temperature, 0.6);
eq('ultra: max_tokens ceiling', ultra.max_tokens, 16384);
eq('ultra: no reasoning_budget when thinking off', ultra.reasoning_budget, undefined);

const ultraThink = buildChatPayload('nvidia-nemotron-3-ultra', [], { reasoning: true });
eq('ultra: thinking on', ultraThink.chat_template_kwargs, { enable_thinking: true });
eq('ultra: reasoning budget', ultraThink.reasoning_budget, 16384);
eq('ultra: grace period', ultraThink.grace_period, 1024);

const lightning = buildChatPayload('nvidia-nemotron-3-lightning', []);
eq('lightning: NVIDIA-recommended temp 1.0', lightning.temperature, 1.0);
eq('lightning: top_p 0.95', lightning.top_p, 0.95);

const omni = buildChatPayload('nvidia-nemotron-3-omni', []);
eq('omni: reasoning on by default', omni.chat_template_kwargs, { enable_thinking: true });
eq('omni: max_tokens 20480', omni.max_tokens, 20480);

eq('max_tokens clamped to engine ceiling', buildChatPayload('nvidia-nemotron-3-ultra', [], { maxTokens: 999999 }).max_tokens, 16384);
eq('gemini gets no chat_template_kwargs', buildChatPayload('gemini', []).chat_template_kwargs, undefined);

console.log('\n── Fallback chains ──');
eq('ultra chain', buildFallbackChain('nvidia-nemotron-3-ultra'), ['nvidia-nemotron-3-ultra','nvidia-nemotron-3-lightning','alibaba-qwen','gemini']);
eq('omni chain', buildFallbackChain('nvidia-nemotron-3-omni'), ['nvidia-nemotron-3-omni','nvidia-nemotron-3-ultra','gemini']);
eq('every chain ends at gemini', TEXT_ENGINE_ORDER.every(id => buildFallbackChain(id).includes('gemini')), true);

console.log('\n── Reasoning-trace hygiene ──');
eq('strips <think>', stripReasoningTraces('<think>plan plan</think><h1>Worksheet</h1>'), '<h1>Worksheet</h1>');
eq('strips unterminated trace', stripReasoningTraces('let me plan the layout</think>\n<h1>Poster</h1>'), '<h1>Poster</h1>');
eq('leaves clean html alone', stripReasoningTraces('<h1>Grade 5</h1>'), '<h1>Grade 5</h1>');
eq('falls back to reasoning_content', extractMessageText({ content: '', reasoning_content: 'answer' }), 'answer');
eq('prefers content', extractMessageText({ content: '<p>a</p>', reasoning_content: 'b' }), '<p>a</p>');

console.log('\n── Registry sanity ──');
eq('all engines resolvable', TEXT_ENGINE_ORDER.every(id => !!getEngine(id).model), true);
eq('3 free NVIDIA engines', TEXT_ENGINE_ORDER.filter(id => getEngine(id).free).length, 3);

console.log(`\n${fail === 0 ? '🎉' : '💥'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
