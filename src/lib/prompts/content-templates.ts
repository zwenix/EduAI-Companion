/**
 * EduAI Companion - Content Generation Templates
 * Worksheets, Posters, Study Guides, Infographics
 */

export const WORKSHEET_PROMPT_TEMPLATE = `
Generate a highly descriptive, CAPS-aligned primary student activity worksheet. The content generated MUST be rich, complete, and fully fleshed out with actual, engaging questions tailored to Grade \${grade} \${subject}, with zero placeholders or standard summaries.

🎨 WORK_SHEET DESIGN & REVERSE-ENGINEERED LAYOUT DIRECTIONS:
- No fixed heights - use 'h-auto', dynamic padding ('py-6', 'px-6'), and relaxed block layouts.
- Primary colors: Mathematics = blue grid accents; Languages = violet/indigo highlights; Life Skills = orange/amber warm details; Natural Sciences/EMS = emerald/green organic tones. REPLACE all general brackets like '[subject-color]' or '[accent-color]' with real, vivid hex/Tailwind classes (e.g. 'bg-emerald-600', 'text-indigo-800').
- Circular Badge: A prominent badge at the top right: "Grade \${grade}" or "CAPS" in block font with micro shadow.
- Header Block: Full width banner with a beautiful solid brand color, rounded-3xl corners, and custom metadata inputs:
  - "Learner name: _______________________________"
  - "Date: _________________________"
  - "Overall Score: ______ / 15 Marks" (Use a beautifully-styled, layered score border card, no absolute positions to avoid overlap).
- Section headers: Full width, rounded-xl colored banner pills representing different task sections (e.g., SECTION A [5 Marks]).
- Choice options & Pills: Always use 'rounded-xl' or 'rounded-2xl' instead of 'rounded-full' to prevent text bounding errors if words wrap. Add thick colored borders ('border-2 border-emerald-100') that turn solid on hover.
- Hand-drawn or Draw illustrations boxes: Explicitly styled boxes with a nice border-2 border-dashed gray border, minimum height ('min-h-[140px]') with soft neutral background and beautiful instruction guidelines.

📝 WORK_SHEET HTML STRUCTURE:
<article class="worksheet-container max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-xl font-sans">
  
  <!-- WORK_SHEET HEADER -->
  <header class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl mb-8 relative shadow-md" style="background: \${primary};">
    <div class="flex justify-between items-start gap-4">
      <div>
        <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2 font-mono">CAPS DIAGNOSTIC WORK_SHEET</span>
        <h1 class="text-3xl font-extrabold tracking-tight leading-tight mb-2">\${topic}</h1>
        <p class="text-white/90 text-sm font-medium">\${subject} • Grade \${grade} Activity Suite</p>
      </div>
      <div class="bg-white/25 backdrop-blur-md px-4 py-3 rounded-2xl text-center shadow-inner flex-shrink-0">
        <span class="block text-[10px] font-bold uppercase tracking-wider opacity-80">Grade</span>
        <span class="text-2xl font-black">\${grade}</span>
      </div>
    </div>
    
    <div class="mt-6 pt-6 border-t border-white/25 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
      <div>🧑‍🏫 <span class="font-bold">Term:</span> Term \${term}</div>
      <div>🧬 <span class="font-bold">CAPS Focus:</span> \${capsCode}</div>
      <div>🎖️ <span class="font-bold">Total Mark Allocation:</span> \${totalMarks} Marks</div>
    </div>
  </header>

  <!-- METADATA STRIP -->
  <div class="metadata-strip grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 pb-4 border-b-2 border-dashed border-slate-200">
    <div>
      <label class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Learner's Full Name</label>
      <div class="border-b-2 border-slate-350 py-1 text-slate-400 italic text-xs font-medium">_______________________________</div>
    </div>
    <div>
      <label class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Date of Assessment</label>
      <div class="border-b-2 border-slate-350 py-1 text-slate-400 italic text-xs font-medium">_________________</div>
    </div>
    <div class="sm:col-span-2 md:col-span-1 flex items-center justify-start md:justify-end">
      <div class="bg-slate-50 border-2 rounded-2xl px-5 py-2 text-center w-40 flex items-center justify-between shadow-inner" style="border-color: \${light};">
        <span class="text-[10px] font-heavy text-slate-500 uppercase tracking-wider mr-2">TOTAL SCORE:</span>
        <span class="text-lg font-black text-slate-800">/ \${totalMarks}</span>
      </div>
    </div>
  </div>

  <!-- INSTRUCTIONS BOX -->
  <div class="bg-amber-50/70 border-l-4 border-amber-500 p-5 rounded-r-2xl mb-8 shadow-sm">
    <h3 class="text-xs font-extrabold text-amber-900 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">📋 Directions & Guidelines</h3>
    <p class="text-amber-805 text-sm leading-relaxed font-semibold">\${instructions}</p>
  </div>

  <!-- QUESTIONS BLOCK -->
  <main class="space-y-8">
    \${questions.map((q, i) => \`
      <section class="question-row bg-slate-50 border border-slate-200 p-6 rounded-2xl relative shadow-sm">
        <div class="flex items-center gap-4 mb-4">
          <div class="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm" style="background: \${primary};">
            \${i+1}
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-850 tracking-tight leading-tight">\${q.text}</h3>
            <span class="inline-block text-slate-400 font-bold text-xs">[\${q.marks} Marks]</span>
          </div>
        </div>

        <div class="question-body pl-0 md:pl-14">
          \${q.type === 'multiple-choice' ? \`
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              \${q.options.map((opt, idx) => \`
                <label class="flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 cursor-pointer transition shadow-sm hover:shadow active:scale-95">
                  <input type="radio" name="q\${i}" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm font-semibold text-slate-705 leading-snug">\${String.fromCharCode(65 + idx)}. \${opt}</span>
                </label>
              \`).join('')}
            </div>
          \` : q.type === 'short-answer' ? \`
            <div class="space-y-2">
              <p class="text-xs text-slate-400 italic">Write your explanation neatly on the lines below:</p>
              <div class="border-b border-dashed border-slate-350 h-8"></div>
              <div class="border-b border-dashed border-slate-350 h-8"></div>
            </div>
          \` : q.type === 'matching' ? \`
            <div class="grid grid-cols-1 gap-2">
              \${q.matchingPairs.map(pair => \`
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-5 p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 shadow-sm">\${pair.colA}</div>
                  <div class="col-span-2 text-center text-slate-400">✏️ connects to</div>
                  <div class="col-span-5 p-3 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-400 italic border-dashed text-center">Write matching letter here: [ _____ ]</div>
                </div>
              \`).join('')}
            </div>
          \` : q.type === 'drawing' ? \`
            <div class="border-2 border-dashed border-slate-300 rounded-3xl min-h-[160px] bg-white flex flex-col items-center justify-center p-6 text-center shadow-inner">
              <span class="text-4xl mb-2">🎨</span>
              <p class="text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">\${q.drawingInstructions}</p>
              <p class="text-[10px] text-slate-400">Sketch your visual response in this dedicated block</p>
            </div>
          \` : ''}
        </div>
      </section>
    \`).join('')}
  </main>

  <!-- SUCCESS INDICATORS -->
  <div class="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-2xl my-8 shadow-sm">
    <h3 class="text-xs font-extrabold text-emerald-900 uppercase tracking-widest flex items-center gap-1.5 mb-2">🌟 Checklist for Success</h3>
    <ul class="space-y-1.5 pl-2">
      \${successIndicators.map(si => \`
        <li class="flex items-start gap-2.5 text-sm font-semibold text-emerald-800">
          <span class="text-emerald-500">✔</span>
          <span>\${si}</span>
        </li>
      \`).join('')}
    </ul>
  </div>

  <!-- FOOTER -->
  <footer class="mt-8 pt-6 border-t-2 border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold tracking-wide">
    EduAI Companion • CAPS aligned worksheet suite • eduai-companion.github.io
  </footer>
</article>

CRITICAL: Return as JSON matching:
{
  "content": "<HTML CODE FOR STUDENT ACTIVITY WORKSHEET (using HTML above) HERE>",
  "memo": "<HTML CODE FOR ANSWER MEMORANDUM KEY OF WORKSHEET HERE>",
  "rubric": "<HTML CODE FOR ANALYTICAL MARKING RUBRIC MATRIX OF WORKSHEET TABLE HERE>",
  "successIndicators": ["string", "string"],
  "imagePrompt": "Detailed printable class assessment illustration..."
}
`;

export const VISUAL_AID_PROMPT_TEMPLATE = `
Design a classroom-ready educational poster/infographic with this layout system:

🎨 LAYOUT GRID (Tailwind CSS):
<div class="poster-container max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
  
  <!-- TOP BANNER: Title + Grade -->
  <div class="banner bg-gradient-to-r from-[subject-start] to-[subject-end] p-6 text-white">
    <div class="flex justify-between items-start">
      <h1 class="text-4xl font-extrabold tracking-tight">\${title}</h1>
      <div class="grade-badge bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold">
        Grade \${grade}
      </div>
    </div>
    <p class="mt-2 text-white/90 text-lg">\${subtitle}</p>
  </div>

  <!-- HERO ILLUSTRATION (30% of poster) -->
  <div class="hero-section bg-[light-accent] p-8">
    <div class="illustration-frame aspect-[4/3] bg-white rounded-2xl shadow-inner flex items-center justify-center border-4 border-dashed border-[subject-color]/30">
      <div class="text-center p-6">
        <div class="text-6xl mb-4">🎨</div>
        <p class="font-medium text-gray-700">[Illustration: \${imagePrompt}]</p>
        <p class="text-sm text-gray-500 mt-2">Semi-realistic digital painting • South African context • 300 DPI print quality</p>
      </div>
    </div>
  </div>

  <!-- CONTENT GRID (2-3 columns based on complexity) -->
  <div class="content-grid grid md:grid-cols-2 gap-6 p-8">
    \${contentBlocks.map(block => \`
    <div class="content-card bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:shadow-md transition">
      <div class="card-header flex items-center gap-3 mb-3">
        <div class="icon-bubble bg-[subject-color] text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold">
          \${block.icon}
        </div>
        <h3 class="font-bold text-lg text-gray-800">\${block.title}</h3>
      </div>
      
      <!-- INLINE BREAK ILLUSTRATION: Breaking any text-heavy block with a mini-illustration -->
      <div class="my-4 bg-white p-1 rounded-xl shadow-inner border border-gray-100">
        [Illustration: A beautiful, context-relevant mini-illustration depicting \${block.title} specifically for South African Grade \${grade} learners]
      </div>

      <div class="card-body text-gray-750 leading-relaxed font-medium text-sm space-y-2">
        \${block.content}
      </div>
      \${block.callout ? \`
      <div class="callout mt-4 p-3 bg-[accent-light] rounded-lg border-l-4 border-[accent-color]">
        <p class="text-sm font-semibold text-[accent-dark]">💡 \${block.callout}</p>
      </div>\` : ''}
    </div>
    \`).join('')}
  </div>

  <!-- KEY TAKEAWAYS STRIP -->
  <div class="takeaways bg-[subject-light] p-6">
    <p class="font-bold text-[subject-dark] mb-3">🔑 Remember:</p>
    <div class="flex flex-wrap gap-3">
      \${keyPoints.map(kp => \`
        <span class="pill bg-white px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-gray-200">
          \${kp}
        </span>
      \`).join('')}
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="footer bg-gray-100 p-4 text-center text-xs text-gray-600">
    EduAI Companion • CAPS Curriculum • Print at 300 DPI for best results
  </footer>
</div>

🎨 IMAGE PROMPT SPECIFICATION:
"Professional educational poster illustration: [Topic] for South African Grade [X]. 
Style: Semi-realistic digital painting, children's educational book aesthetic. 
Composition: Central hero image with supporting contextual elements. 
Cultural authenticity: Include [specific SA elements: e.g., Table Mountain, springbok, local flora]. 
Color harmony: Align with [subject] palette ([colors]). 
Technical specs: 300 DPI, CMYK-ready, no text overlays, no borders, museum-quality detail, 
optimized for A3/A4 classroom printing. Emotional tone: [inspiring/curious/empowering]."

Return as JSON: { content: "[HTML above]", imagePrompt: "[enhanced prompt]", printInstructions: "A4/A3, 300 DPI, CMYK", accessibilityNotes: "[alt text suggestions]" }
`;

export const STUDY_GUIDE_PROMPT_TEMPLATE = `
Create a comprehensive, textbook-quality study guide with this sophisticated layout:

📖 STRUCTURE & TYPOGRAPHY:
<article class="study-guide max-w-5xl mx-auto bg-white shadow-xl rounded-3xl overflow-hidden">
  
  <!-- COVER SECTION -->
  <header class="cover bg-gradient-to-br from-[subject-start] via-[subject-mid] to-[subject-end] text-white p-10 text-center">
    <div class="subject-icon text-6xl mb-4">📚</div>
    <h1 class="text-5xl font-extrabold mb-3 tracking-tight">\${title}</h1>
    <p class="text-2xl opacity-95 mb-2">\${subject} • Grade \${grade}</p>
    <p class="text-lg opacity-90">\${capsReference}</p>
    <div class="mt-6 flex justify-center gap-4">
      <span class="badge bg-white/20 px-4 py-2 rounded-full text-sm">CAPS Aligned</span>
      <span class="badge bg-white/20 px-4 py-2 rounded-full text-sm">\${term}</span>
    </div>
  </header>

  <!-- HERO ILLUSTRATION -->
  <div class="hero-illustration bg-[light-bg] p-8">
    <div class="illustration-container max-w-3xl mx-auto aspect-video bg-white rounded-2xl shadow-lg border-4 border-dashed border-[subject-color]/20 flex items-center justify-center">
      <div class="text-center p-6">
        <p class="text-5xl mb-4">🖼️</p>
        <p class="font-semibold text-gray-800">[Concept Illustration: \${imagePrompt}]</p>
        <p class="text-sm text-gray-500 mt-2">Semi-realistic educational art • South African context • Print-ready 300 DPI</p>
      </div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <nav class="toc bg-gray-50 border-y border-gray-200 p-6">
    <h2 class="font-bold text-lg text-gray-800 mb-3">📑 In This Guide</h2>
    <ol class="list-decimal list-inside space-y-2 text-gray-700">
      \${sections.map((s, i) => \`
        <li><a href="#section-\${i+1}" class="hover:text-[subject-color] transition font-medium">\${s.title}</a> 
          <span class="text-gray-400 text-sm">• \${s.pageEstimate} min read</span></li>
      \`).join('')}
    </ol>
  </nav>

  <!-- MAIN CONTENT SECTIONS -->
  <main class="content p-8 space-y-10">
    \${sections.map((section, idx) => \`
    <section id="section-\${idx+1}" class="section scroll-mt-24">
      <div class="section-header flex items-center gap-4 mb-6 pb-4 border-b-2 border-[subject-light]">
        <span class="section-number bg-[subject-color] text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow">
          \${idx+1}
        </span>
        <h2 class="text-3xl font-bold text-gray-900">\${section.title}</h2>
      </div>
      
      <!-- Key Concept Box -->
      \${section.keyConcept ? \`
      <div class="key-concept bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl mb-6">
        <p class="font-bold text-blue-900 flex items-center gap-2">
          <span>💡</span> Key Concept:
        </p>
        <p class="text-blue-800 mt-2 leading-relaxed">\${section.keyConcept}</p>
      </div>\` : ''}
      
      <!-- Core Explanation (textbook-style paragraphs) -->
      <div class="explanation prose prose-lg max-w-none text-gray-700 leading-relaxed">
        \${section.content}
      </div>
      
      <!-- Visual Aid / Diagram Placeholder -->
      \${section.diagram ? \`
      <div class="diagram-frame my-8 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
        <p class="text-center text-gray-600 font-medium">[Diagram: \${section.diagramDescription}]</p>
        <p class="text-center text-xs text-gray-400 mt-2">Labelled educational diagram • High contrast for projection</p>
      </div>\` : ''}
      
      <!-- Worked Example -->
      \${section.example ? \`
      <div class="example bg-green-50 border-l-4 border-green-500 p-5 rounded-r-xl my-6">
        <p class="font-bold text-green-900 mb-3">✨ Worked Example:</p>
        <div class="example-content bg-white p-4 rounded-lg shadow-sm">
          \${section.example}
        </div>
      </div>\` : ''}
      
      <!-- Check Your Understanding -->
      <div class="check-understanding mt-8 p-5 bg-purple-50 rounded-xl border border-purple-200">
        <p class="font-bold text-purple-900 mb-3">🤔 Check Your Understanding:</p>
        <ul class="space-y-3">
          \${section.checkQuestions.map((q, i) => \`
            <li class="flex gap-3">
              <span class="bullet bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">\${i+1}</span>
              <span class="question text-purple-800">\${q}</span>
            </li>
          \`).join('')}
        </ul>
      </div>
    </section>
    \`).join('')}
  </main>

  <!-- QUICK REFERENCE BOX -->
  <aside class="quick-ref bg-[subject-light] p-8">
    <h3 class="font-bold text-[subject-dark] text-xl mb-4 flex items-center gap-2">
      <span>🔖</span> Quick Reference
    </h3>
    <div class="grid md:grid-cols-2 gap-4">
      \${quickFacts.map(fact => \`
        <div class="ref-card bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p class="font-semibold text-gray-800">\${fact.label}:</p>
          <p class="text-gray-700">\${fact.value}</p>
        </div>
      \`).join('')}
    </div>
  </aside>

  <!-- PRINT-OPTIMIZED FOOTER -->
  <footer class="footer bg-gray-100 p-6 text-center text-sm text-gray-600 print:mt-12">
    <p class="font-medium">EduAI Companion • CAPS Curriculum Study Guide</p>
    <p class="text-xs mt-1">Print tip: Use "Fit to Page" • For best results, print on A4 at 300 DPI</p>
    <p class="text-xs mt-2 text-gray-500">eduai-companion.github.io • Version 2.0</p>
  </footer>
</article>

🎨 HERO IMAGE PROMPT:
"Educational textbook-style illustration: [Core concept of study guide] for South African Grade [X] [Subject]. 
Style: Semi-realistic digital painting, children's educational non-fiction book aesthetic. 
Composition: Central conceptual diagram with contextual South African elements ([examples]). 
Color strategy: Harmonious palette aligned with [subject] ([colors]), high contrast for readability. 
Technical: 300 DPI, CMYK-ready, no text overlays, no borders, museum-quality detail, 
optimized for both digital viewing and A4 printing. Emotional resonance: [inspiring clarity / confident mastery]. 
Include subtle visual metaphors for [key concept]."

Return as JSON: { 
  content: "[HTML above]", 
  imagePrompt: "[enhanced prompt]", 
  printInstructions: "A4, 300 DPI, CMYK, bleed 3mm", 
  accessibilityNotes: "[alt text for hero + diagrams]", 
  estimatedReadTime: "[X] minutes",
  capsAlignment: "[specific CAPS codes covered]"
}
`;

export default {
  WORKSHEET_PROMPT_TEMPLATE,
  VISUAL_AID_PROMPT_TEMPLATE,
  STUDY_GUIDE_PROMPT_TEMPLATE
};