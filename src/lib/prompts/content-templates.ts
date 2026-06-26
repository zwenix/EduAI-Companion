/**
 * EduAI Companion - Content Generation Templates
 * Worksheets, Posters, Study Guides, Infographics
 */

export const WORKSHEET_PROMPT_TEMPLATE = `
Generate a highly descriptive, CAPS-aligned primary student activity worksheet. The content generated MUST be rich, complete, and fully fleshed out with actual, engaging questions tailored to Grade \\\${grade} \\\${subject}, with zero placeholders or standard summaries.

🎨 WORK_SHEET DESIGN & REVERSE-ENGINEERED LAYOUT DIRECTIONS:
- No fixed heights - use 'h-auto', dynamic padding ('py-6', 'px-6'), and relaxed block layouts.
- Primary colors: Mathematics = blue grid accents; Languages = violet/indigo highlights; Life Skills = orange/amber warm details; Natural Sciences/EMS = emerald/green organic tones. REPLACE all general brackets like '[subject-color]' or '[accent-color]' with real, vivid hex/Tailwind classes (e.g. 'bg-emerald-600', 'text-indigo-800').
- Circular Badge: A prominent badge at the top right of the header: "Grade \\\${grade}" or "CAPS" in block font with micro shadow.
- Header Block: A spectacular full-width background color cover banner with deep, vibrant colors matching the learning domain (using \\\${primary}, \\\${accent}, \\\${dark}, \\\${light} with clean rounded corners, beautiful graphics/emojis, and student name fields).
- "Learner name: _______________________________"
- "Date: _________________________"
- "Overall Score: ______ / \\\${totalMarks} Marks" (Use a beautifully-styled offset score border card, no absolute positions to avoid overlap).
- Section headers: Full width, rounded-xl colored banner pills representing different task sections (e.g., SECTION A [5 Marks]).
- Choice options & Pills: Always use 'rounded-xl' or 'rounded-2xl' instead of 'rounded-full' to prevent text bounding errors if words wrap. Add thick colored borders ('border-2 border-emerald-100') that turn solid on hover.
- Hand-drawn or Draw illustrations boxes: Explicitly styled boxes with a nice border-2 border-dashed gray border, minimum height ('min-h-[140px]') with soft neutral background and beautiful instruction guidelines.

📝 WORK_SHEET HTML STRUCTURE:
<article class="worksheet-container max-w-5xl mx-auto bg-white p-2 md:p-4 rounded-[2.5rem] shadow-2xl font-sans border-4" style="border-color: \\\${light};">
  
  <!-- PREMIUM FULL-WIDTH GRADIENT HEADER BANNER BLOCK -->
  <header class="text-white p-6 md:p-8 rounded-[2rem] relative overflow-hidden shadow-lg m-2" style="background: linear-gradient(135deg, \\\${primary}, \\\${accent});">
    <!-- Overlay/Decorative pattern -->
    <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
    
    <div class="relative z-10 flex justify-between items-start flex-wrap gap-4 mb-6">
      <div class="flex flex-wrap gap-2.5">
        <span class="inline-block px-3 py-1.5 bg-white/20 text-white backdrop-blur-md text-xs font-black rounded-full uppercase tracking-widest shadow-sm">
          🇿🇦 EduAI Companion
        </span>
        <span class="inline-block px-3 py-1.5 bg-white/20 text-white backdrop-blur-md text-xs font-black rounded-full uppercase tracking-widest shadow-sm font-mono">
          CAPS ALIGNED • \\\${capsCode}
        </span>
        <span class="inline-block px-3 py-1.5 bg-white/20 text-white backdrop-blur-md text-xs font-black rounded-full uppercase tracking-widest shadow-sm">
          TERM \\\${term}
        </span>
      </div>
      
      <!-- Hanging Grade Circle Badge -->
      <div class="w-16 h-16 bg-white/25 border-4 border-white/40 rounded-full flex flex-col items-center justify-center text-white font-extrabold flex-shrink-0 shadow-lg select-none">
        <span class="text-[8px] uppercase tracking-widest opacity-90 leading-none">Grade</span>
        <span class="text-xl font-black leading-none mt-1">\\\${grade}</span>
      </div>
    </div>

    <!-- Thematic Heading & Subheading -->
    <div class="relative z-10 mb-6 text-left">
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-sm uppercase">
        [Generate an exceptionally creative, immersive thematic heading here based on the topic \\\${topic} (e.g. "Quest of the Golden Numbers: The Ultimate Addition Safari!" instead of "Addition Worksheet")]
      </h1>
      <p class="text-white/90 text-sm md:text-base font-bold italic drop-shadow-sm">
        [Generate a contextually tailored, encouraging layout caption/subtitle here] ✨ Let's explore together!
      </p>
    </div>

    <!-- Metadata & Total Marks strip -->
    <div class="relative z-10 pt-4 border-t border-white/20 flex flex-wrap justify-between items-center gap-4 text-xs font-black uppercase tracking-wider">
      <div class="flex items-center gap-2">
         📚 <span class="tracking-widest">\\\${subject}</span>
      </div>
      
      <!-- Offset Score Block -->
      <div class="bg-white text-slate-900 border-2 border-slate-900 rounded-2xl px-5 py-2 text-center w-36 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <span class="block text-[9px] font-black text-slate-500 tracking-widest uppercase leading-none">TOTAL MARKS</span>
        <span class="text-base font-black text-slate-900 border-t border-dashed border-slate-300 block pt-1 mt-1 leading-none">______ / \\\${totalMarks}</span>
      </div>
    </div>
  </header>

  <div class="p-4 md:p-6">
    <!-- Learner metadata inputs block -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 mb-8 bg-slate-50 border-2 border-slate-200 rounded-3xl" style="border-color: \\\${light};">
      <div>
        <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">LEARNER NAME:</label>
        <div class="border-b-2 border-slate-300 py-1 text-slate-400 italic text-sm font-medium">________________________________________________</div>
      </div>
      <div>
        <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">DATE OF ASSESSMENT:</label>
        <div class="border-b-2 border-slate-300 py-1 text-slate-400 italic text-sm font-semibold">__________________________________ 2026</div>
      </div>
    </div>

    <!-- INSTRUCTIONS BOX -->
    <div class="bg-amber-50/70 border-l-4 border-amber-500 p-5 rounded-r-2xl mb-8 shadow-sm">
      <h3 class="text-xs font-extrabold text-amber-900 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">📋 Directions & Guidelines</h3>
      <p class="text-amber-805 text-sm leading-relaxed font-semibold">\\\${instructions}</p>
    </div>

    <!-- QUESTIONS BLOCK -->
    <main class="space-y-8">
      \\\${questions.map((q, i) => \\\`
        <section class="question-row bg-slate-50 border border-slate-200 p-6 rounded-2xl relative shadow-sm">
          <div class="flex items-center gap-4 mb-4">
            <div class="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm" style="background: \\\${primary};">
              \\\${i+1}
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-850 tracking-tight leading-tight">\\\${q.text}</h3>
              <span class="inline-block text-slate-400 font-bold text-xs">[\\\${q.marks} Marks]</span>
            </div>
          </div>

          <div class="question-body pl-0 md:pl-14">
            \\\${q.type === 'multiple-choice' ? \\\`
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                \\\${q.options.map((opt, idx) => \\\`
                  <label class="flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 cursor-pointer transition shadow-sm hover:shadow active:scale-95">
                    <input type="radio" name="q\\\${i}" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                    <span class="text-sm font-semibold text-slate-705 leading-snug">\\\${String.fromCharCode(65 + idx)}. \\\${opt}</span>
                  </label>
                \\\`).join('')}
              </div>
            \\\` : q.type === 'short-answer' ? \\\`
              <div class="space-y-2">
                <p class="text-xs text-slate-400 italic">Write your explanation neatly on the lines below:</p>
                <div class="border-b border-dashed border-slate-350 h-8"></div>
                <div class="border-b border-dashed border-slate-350 h-8"></div>
              </div>
            \\\` : q.type === 'matching' ? \\\`
              <div class="grid grid-cols-1 gap-2">
                \\\${q.matchingPairs.map(pair => \\\`
                  <div class="grid grid-cols-12 gap-2 items-center">
                    <div class="col-span-12 md:col-span-5 p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 shadow-sm">\\\${pair.colA}</div>
                    <div class="col-span-12 md:col-span-2 text-center text-slate-400">✏️ connects to</div>
                    <div class="col-span-12 md:col-span-5 p-3 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-400 italic border-dashed text-center">Write matching letter here: [ _____ ]</div>
                  </div>
                \\\`).join('')}
              </div>
            \\\` : q.type === 'drawing' ? \\\`
              <div class="border-2 border-dashed border-slate-300 rounded-3xl min-h-[160px] bg-white flex flex-col items-center justify-center p-6 text-center shadow-inner">
                <span class="text-4xl mb-2">🎨</span>
                <p class="text-xs font-bold text-slate-500 tracking-wide uppercase mb-1">\\\${q.drawingInstructions}</p>
                <p class="text-[10px] text-slate-400">Sketch your visual response in this dedicated block</p>
              </div>
            \\\` : ''}
          </div>
        </section>
      \\\`).join('')}
    </main>

    <!-- SUCCESS INDICATORS -->
    <div class="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-2xl my-8 shadow-sm">
      <h3 class="text-xs font-extrabold text-emerald-900 uppercase tracking-widest flex items-center gap-1.5 mb-2">🌟 Checklist for Success</h3>
      <ul class="space-y-1.5 pl-2">
        \\\${successIndicators.map(si => \\\`
          <li class="flex items-start gap-2.5 text-sm font-semibold text-emerald-800">
            <span class="text-emerald-500">✔</span>
            <span>\\\${si}</span>
          </li>
        \\\`).join('')}
      </ul>
    </div>
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

⚠️ CORE NON-ASSESSMENT RULE:
This is a visual teaching aid, poster, chart, or infographic. It is NOT an assessment.
- NO MARK ALLOCATIONS: Do NOT include any marks allocations (e.g. [5 Marks], Marks: 10) anywhere.
- NO GRADING/SCORE INDICATORS: Do NOT include grading/score fields, e.g. "SCORE: ____", "Total Marks: ___", or scoring rubrics anywhere.
- The header banner must strictly include human-readable educational metadata (e.g., Grade, Subject, Topic, Term, CAPS Alignment Focus) but ZERO reference to marks or grading.
- RELATED DRAWINGS / ILLUSTRATIONS: Inside the text, seamlessly embed visual aid placeholders like \`[Illustration: description]\` highlighting key concepts where helpful.

🎨 LAYOUT GRID (Tailwind CSS):
<div class="poster-container max-w-4xl mx-auto bg-white p-2 rounded-[2.5rem] shadow-2xl border-4 overflow-hidden" style="border-color: \\\${light};">
  
  <!-- TOP BANNER: Title + Grade -->
  <header class="text-white p-8 rounded-[2rem] relative overflow-hidden shadow-lg m-2" style="background: linear-gradient(135deg, \\\${primary}, \\\${accent});">
    <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
    
    <div class="relative z-10 flex justify-between items-start flex-wrap gap-4">
      <div class="flex-1">
        <span class="inline-block px-3 py-1 bg-white/20 text-white backdrop-blur-md text-xs font-black rounded-full uppercase tracking-widest shadow-sm font-mono mb-3">
          📚 POSTER SUITE • \\\${subject}
        </span>
        <!-- Generate a stunningly creative, comprehensive title here matching the topic (e.g. "The Whispering Wilds: Exploring South African Ecosystems" instead of "Ecosystems") -->
        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-sm uppercase">
          [Generate a spectacularly unique, creative educational title here matching the topic \\\${title}]
        </h1>
        <p class="text-white/90 text-sm md:text-base font-bold italic drop-shadow-sm">
          [Generate an encouraging, high-level caption or subtitle matching the theme here]
        </p>
      </div>
      
      <!-- Hanging Grade Circle Badge -->
      <div class="w-16 h-16 bg-white/25 border-4 border-white/40 rounded-full flex flex-col items-center justify-center text-white font-extrabold flex-shrink-0 shadow-lg select-none">
        <span class="text-[8px] uppercase tracking-widest opacity-90 leading-none">Grade</span>
        <span class="text-xl font-black leading-none mt-1">\\\${grade}</span>
      </div>
    </div>
  </header>

  <!-- HERO ILLUSTRATION (30% of poster) -->
  <div class="hero-section bg-slate-50/50 p-6 rounded-3xl m-2">
    <div class="illustration-frame aspect-[16/9] bg-white rounded-2xl shadow-inner flex items-center justify-center border-4 border-dashed border-slate-200">
      <div class="text-center p-6">
        <div class="text-6xl mb-4">🎨</div>
        <p class="font-medium text-slate-705">[Illustration: \\\${imagePrompt}]</p>
        <p class="text-xs text-slate-400 mt-2">Semi-realistic digital painting • South African context • 300 DPI print quality</p>
      </div>
    </div>
  </div>

  <!-- CONTENT GRID (2-3 columns based on complexity) -->
  <div class="content-grid grid md:grid-cols-2 gap-6 p-6">
    \\\${contentBlocks.map(block => \\\`
    <div class="content-card bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:shadow-md transition">
      <div class="card-header flex items-center gap-3 mb-3">
        <div class="icon-bubble text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold" style="background: \\\${primary};">
          \\\${block.icon}
        </div>
        <h3 class="font-bold text-lg text-slate-800">\\\${block.title}</h3>
      </div>
      
      <!-- INLINE BREAK ILLUSTRATION: Breaking any text-heavy block with a mini-illustration -->
      <div class="my-4 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
        [Illustration: A beautiful, context-relevant mini-illustration depicting \\\${block.title} specifically for South African Grade \\\${grade} learners]
      </div>

      <div class="card-body text-slate-705 leading-relaxed font-semibold text-sm space-y-2">
        \\\${block.content}
      </div>
      \\\${block.callout ? \\\`
      <div class="callout mt-4 p-3 rounded-lg border-l-4" style="background-color: \\\${light}; border-color: \\\${primary};">
        <p class="text-sm font-semibold" style="color: \\\${dark};">💡 \\\${block.callout}</p>
      </div>\\\` : ''}
    </div>
    \\\`).join('')}
  </div>

  <!-- KEY TAKEAWAYS STRIP -->
  <div class="takeaways p-6 rounded-3xl m-2 bg-slate-50 border border-slate-200">
    <p class="font-black text-slate-800 uppercase tracking-wider text-xs mb-3 flex items-center gap-1.5">🔑 Key Reminders & Takeaways:</p>
    <div class="flex flex-wrap gap-2.5">
      \\\${keyPoints.map(kp => \\\`
        <span class="pill bg-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm border border-slate-200">
          \\\${kp}
        </span>
      \\\`).join('')}
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="footer bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400 font-bold tracking-wide">
    EduAI Companion • CAPS Curriculum Poster Suite • Print at 300 DPI for best results
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

⚠️ CORE NON-ASSESSMENT RULE:
This is a study guide, revision list, or textbook learning material. It is NOT an assessment or test.
- NO MARK ALLOCATIONS: You must NOT include any marks allocations (e.g. [5 Marks], Marks: 10) anywhere.
- NO GRADING/SCORE INDICATORS: Do NOT include grading/score fields, e.g. "SCORE: ____", "Total Marks: ___", or scoring rubrics anywhere.
- The header banner must strictly include human-readable educational metadata (e.g., Grade, Subject, Topic, Term, CAPS Alignment Focus) but ZERO reference to marks or grading.
- RELATED DRAWINGS / ILLUSTRATIONS: Inside the text, seamlessly embed visual aid placeholders like \`[Illustration: description]\` highlighting key concepts where helpful.

📖 STRUCTURE & TYPOGRAPHY:
<article class="study-guide max-w-5xl mx-auto bg-white p-2 rounded-[2.5rem] shadow-2xl border-4 overflow-hidden" style="border-color: \\\${light};">
  
  <!-- STUNNING COVER HEADER GRADIENT SYSTEM -->
  <header class="text-white p-8 rounded-[2rem] relative overflow-hidden shadow-lg m-2" style="background: linear-gradient(135deg, \\\${primary}, \\\${accent});">
    <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
    
    <div class="relative z-10 flex justify-between items-start flex-wrap gap-4 mb-6">
      <div class="flex flex-wrap gap-2.5">
        <span class="inline-block px-3 py-1.5 bg-white/20 text-white backdrop-blur-md text-xs font-black rounded-full uppercase tracking-widest shadow-sm font-mono">
          📚 CAPS ALIGNED • \\\${subject}
        </span>
        <span class="inline-block px-3 py-1.5 bg-white/20 text-white backdrop-blur-md text-xs font-black rounded-full uppercase tracking-widest shadow-sm font-mono">
          TERM \\\${term} • Focus: \\\${capsReference}
        </span>
      </div>
      
      <!-- Hanging Grade Circle Badge -->
      <div class="w-16 h-16 bg-white/25 border-4 border-white/40 rounded-full flex flex-col items-center justify-center text-white font-extrabold flex-shrink-0 shadow-lg select-none">
        <span class="text-[8px] uppercase tracking-widest opacity-90 leading-none">Grade</span>
        <span class="text-xl font-black leading-none mt-1">\\\${grade}</span>
      </div>
    </div>

    <!-- Textbook Title & Subcaption -->
    <div class="relative z-10 mb-4 text-center">
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-sm uppercase">
        [Generate an exceptionally creative, professional-grade concept textbook title here matching the topic \\\${title} (e.g. "Commanders of the Circuit: Master Guide to Electricity" instead of "Electricity Study Guide")]
      </h1>
      <p class="text-white/95 text-base font-bold italic drop-shadow-sm mb-4">
        [Generate a creative, inspiring sub-caption or learning focus matching the topic \\\${title}]
      </p>
      <p class="text-white/80 text-xs font-black tracking-widest uppercase italic">Facilitator: EduAI Companion Study Suite</p>
    </div>
  </header>

  <!-- ILLUSTRATION HERO BLOCK (Placed prominently at the top level prior to cover subtitle) -->
  <div class="hero-illustration p-6 bg-slate-50/50 rounded-3xl m-2">
    <div class="illustration-container max-w-4xl mx-auto aspect-video rounded-3xl bg-white shadow-md border-4 border-dashed border-slate-200 flex items-center justify-center p-4">
      <div class="text-center">
        <span class="text-5xl block mb-3">🎨</span>
        <p class="font-bold text-slate-700 text-sm">[Illustration: \\\${imagePrompt}]</p>
        <p class="text-[10px] text-slate-400 mt-1.5 uppercase font-semibold">Semi-realistic educational art • South African context • Print-ready 300 DPI</p>
      </div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <nav class="toc bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-6 m-2">
    <h2 class="font-extrabold text-slate-800 mb-3 text-lg flex items-center gap-1.5 uppercase tracking-wider">📑 In This Guide</h2>
    <ol class="list-decimal list-inside space-y-2 text-slate-700">
      \\\${sections.map((s, i) => \\\`
        <li><a href="#section-\\\${i+1}" class="hover:underline transition font-bold" style="color: \\\${primary};">\\\${s.title}</a> 
          <span class="text-slate-400 text-sm font-semibold">• \\\${s.pageEstimate} min read</span></li>
      \\\`).join('')}
    </ol>
  </nav>

  <!-- MAIN CONTENT SECTIONS -->
  <main class="content p-6 space-y-10">
    \\\${sections.map((section, idx) => \\\`
    <section id="section-\\\${idx+1}" class="section scroll-mt-24">
      <div class="section-header flex items-center gap-4 mb-6 pb-4 border-b-2 border-slate-100">
        <span class="section-number text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow" style="background: \\\${primary};">
          \\\${idx+1}
        </span>
        <h2 class="text-3xl font-black text-slate-900">\\\${section.title}</h2>
      </div>
      
      <!-- Key Concept Box -->
      \\\${section.keyConcept ? \\\`
      <div class="key-concept border-l-4 p-5 rounded-r-xl mb-6 bg-blue-50/50" style="border-color: \\\${primary};">
        <p class="font-bold flex items-center gap-2" style="color: \\\${dark};">
          <span>💡</span> Key Concept:
        </p>
        <p class="mt-2 leading-relaxed font-semibold" style="color: \\\${dark};">\\\${section.keyConcept}</p>
      </div>\\\` : ''}
      
      <!-- Core Explanation (textbook-style paragraphs) -->
      <div class="explanation prose prose-lg max-w-none text-slate-705 leading-relaxed font-semibold">
        \\\${section.content}
      </div>
      
      <!-- Visual Aid / Diagram Placeholder -->
      \\\${section.diagram ? \\\`
      <div class="diagram-frame my-8 p-6 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-200">
        <p class="text-center text-slate-600 font-bold">[Diagram: \\\${section.diagramDescription}]</p>
        <p class="text-center text-xs text-slate-400 mt-2">Labelled educational diagram • High contrast for projection</p>
      </div>\\\` : ''}
      
      <!-- Worked Example -->
      \\\${section.example ? \\\`
      <div class="example border-l-4 p-5 rounded-r-xl my-6 bg-emerald-50/50" style="border-color: #10b981;">
        <p class="font-bold text-emerald-950 mb-3">✨ Worked Example:</p>
        <div class="example-content bg-white p-4 rounded-lg shadow-sm font-semibold text-slate-705 border border-slate-100">
          \\\${section.example}
        </div>
      </div>\\\` : ''}
      
      <!-- Check Your Understanding -->
      <div class="check-understanding mt-8 p-5 rounded-xl border border-purple-200 bg-purple-50/50">
        <p class="font-bold text-purple-900 mb-3">🤔 Check Your Understanding:</p>
        <ul class="space-y-3">
          \\\${section.checkQuestions.map((q, i) => \\\`
            <li class="flex gap-3">
              <span class="bullet bg-purple-205 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0">\\\${i+1}</span>
              <span class="question text-purple-800 font-semibold text-sm">\\\${q}</span>
            </li>
          \\\`).join('')}
        </ul>
      </div>
    </section>
    \\\`).join('')}
  </main>

  <!-- QUICK REFERENCE BOX -->
  <aside class="quick-ref p-8 rounded-[1.5rem] m-2 border border-slate-100 bg-slate-50/50">
    <h3 class="font-black text-slate-800 text-lg mb-4 flex items-center gap-2 uppercase tracking-wide">
      <span>🔖</span> Quick Reference Summary
    </h3>
    <div class="grid md:grid-cols-2 gap-4">
      \\\${quickFacts.map(fact => \\\`
        <div class="ref-card bg-white p-4 rounded-xl shadow-sm border border-slate-200/50">
          <p class="font-bold text-slate-800 text-sm">\\\${fact.label}:</p>
          <p class="text-slate-650 text-xs font-semibold mt-1">\\\${fact.value}</p>
        </div>
      \\\`).join('')}
    </div>
  </aside>

  <!-- PRINT-OPTIMIZED FOOTER -->
  <footer class="footer bg-slate-100 p-6 m-2 rounded-2xl text-center text-xs text-slate-400 font-bold print:mt-12">
    <p class="font-bold">EduAI Companion • CAPS Curriculum Study Guide</p>
    <p class="mt-1 font-semibold">Print tip: Use "Fit to Page" • For best results, print on A4 at 300 DPI</p>
    <p class="mt-2">eduai-companion.github.io • Version 2.0</p>
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