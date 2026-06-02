/**
 * EduAI Companion - Content Generation Templates
 * Worksheets, Posters, Study Guides, Infographics
 */

export const WORKSHEET_PROMPT_TEMPLATE = `
Generate a CAPS-aligned worksheet with this structure:

\`\`\`html
<!-- HERO ILLUSTRATION SECTION -->
<div class="hero-section bg-gradient-to-r from-[subject-color] to-[accent-color] p-6 rounded-b-3xl mb-6">
  <div class="illustration-placeholder aspect-video bg-white/20 rounded-2xl border-2 border-dashed border-white/50 flex items-center justify-center">
    <span class="text-white/90 text-sm text-center px-4">
      [Image: \${imagePrompt}]
    </span>
  </div>
</div>

<!-- HEADER BANNER -->
<header class="banner bg-white shadow-md rounded-xl p-4 mb-6 flex justify-between items-center">
  <div>
    <h1 class="text-2xl font-bold text-[subject-dark]">\${topic}</h1>
    <p class="text-[subject-muted]">Grade \${grade} • \${subject} • CAPS Ref: \${capsCode}</p>
  </div>
  <div class="grade-badge bg-[accent-color] text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
    Grade \${grade}
  </div>
</header>

<!-- METADATA STRIP -->
<div class="metadata-strip flex gap-8 mb-8 pb-4 border-b-2 border-dashed border-gray-300">
  <div class="field"><span class="font-semibold">Name:</span> <span class="underline flex-1 min-w-[200px] inline-block">&nbsp;</span></div>
  <div class="field"><span class="font-semibold">Date:</span> <span class="underline flex-1 min-w-[150px] inline-block">&nbsp;</span></div>
  <div class="field"><span class="font-semibold">Total:</span> <span class="underline w-16 inline-block">&nbsp;</span> / \${totalMarks}</div>
</div>

<!-- INSTRUCTIONS BOX -->
<div class="instructions bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
  <p class="font-semibold text-blue-900">📋 Instructions:</p>
  <p class="text-blue-800 mt-1">\${instructions}</p>
</div>

<!-- QUESTIONS SECTION -->
\${questions.map((q, i) => \`
<section class="question-block mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
  <div class="question-number bg-[subject-color] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3 shadow">
    \${i+1}
  </div>
  <p class="question-text font-semibold text-lg mb-3 text-gray-800">\${q.text}</p>
  \${q.type === 'multiple-choice' ? \`
    <div class="options-grid grid grid-cols-1 md:grid-cols-2 gap-3">
      \${q.options.map(opt => \`
        <label class="option-pill flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-full hover:border-[subject-color] cursor-pointer transition">
          <input type="radio" name="q\${i}" class="accent-[subject-color]">
          <span class="option-text">\${opt}</span>
        </label>
      \`).join('')}
    </div>
  \` : q.type === 'short-answer' ? \`
    <div class="answer-space min-h-[60px] border-b-2 border-dashed border-gray-400 mt-2"></div>
  \` : ''}
  \${q.marks ? \`<p class="marks text-right text-sm text-gray-500 mt-2">[\${q.marks} marks]</p>\` : ''}
</section>
\`).join('')}

<!-- SUCCESS INDICATORS -->
<div class="success-box bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-6">
  <p class="font-semibold text-green-900">✨ I will know I'm successful when I can:</p>
  <ul class="list-disc list-inside text-green-800 mt-2 space-y-1">
    \${successIndicators.map(si => \`<li>\${si}</li>\`).join('')}
  </ul>
</div>

<!-- FOOTER -->
<footer class="footer text-center text-xs text-gray-500 pt-6 border-t mt-8">
  EduAI Companion • CAPS Aligned • eduai-companion.github.io
</footer>
\`\`\`

CRITICAL: Return as JSON with keys: { content: "[HTML above]", memo: "[teacher memo HTML]", rubric: "[rubric HTML]", successIndicators: [...], imagePrompt: "[enhanced image prompt]" }
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