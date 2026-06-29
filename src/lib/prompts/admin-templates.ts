/**
 * EduAI Companion - Administrative Document Templates
 * Lesson Plans, Curriculum Maps, Report Comments, Meeting Notes
 */

export const LESSON_PLAN_TEMPLATE = `
Generate an exceptionally detailed, CAPS-aligned lesson plan. It MUST be extremely detailed and easy to implement for anyone (even a layman or substitute teacher) with zero preparation.

📋 COGNITIVE LEVEL & EXPLAINABILITY GUIDELINES:
- NO SHORT BULLETS OR HEADINGS-ONLY: Every single objective, resource, activity, and strategy must be described in full, rich, easy-to-understand prose (at least 3-4 sentence paragraphs per item).
- EXACT TEACHER SPOKEN SCRIPTS: Under Teacher Activities, you MUST provide word-for-word scripts of what the teacher should say to the class. Format clearly as "Teacher Spoken Script (Say this): '[word-for-word script]'".
- SPECIFIC DETAILED SCENARIOS: Provide concrete scenarios with diverse South African character names (e.g. Zola, Liam, Thabo, Amina) and complete conversational dialogues that the teacher can present to the learners as real examples.
- ZERO PLACEHOLDERS: Do not use "etc.", "fill in examples here", or standard summaries. Every exercise, rule, question, and instruction must be generated as complete, usable text.

🎨 VISUAL STYLE & REVERSE-ENGINEERED COMPONENT DESIGN:
- No fixed heights - use 'h-auto', dynamic padding ('py-6', 'px-6'), and relaxed flexbox/grid block layouts.
- Header Block: Stunning full-width card with solid brand color (Teal, Purple, Orange etc., based on subject), with clean rounded top, containing round indicator badges like "CAPS ALIGNED", "LIFE SKILLS: GRADE \${grade}", and "TERM \${term} • WEEK \${week}".
- Symmetric Side-by-Side Cards: Use a two-column grid ("grid grid-cols-1 md:grid-cols-2 gap-6") for "🎯 Aim of the Lesson" and "🎒 Resources Needed" using matching custom colors, thick rounded corners, and clear checkmarks.
- Prior Knowledge & Preparations: A beautifully highlighted full-width box with custom borders and a highlighted inner yellow container representing "CAPS Connection".
- Core Content & Key Rules: Clearly outlined, card-style rows enclosing major concepts or emergency golden rules. 
- Procedure Timeline: Beautiful vertical timeline or phase flow using solid circles with big numbers, dividing:
  - Phase 1: Introduction & Hook (Exactly what the teacher says, the prompt, icebreakers, 15 Minutes)
  - Phase 2: Direct Instruction & Demonstration (Rich explanation of core concepts, exact physical aids to show representatively, word-for-word explanations, 30 Minutes)
  - Phase 3: Guided Practice (Step-by-step roleplay instructions, pairing rules, specific scenario cards for learners to act out, 25 Minutes)
  - Phase 4: Independent Practice & Worksheet (Full workbook instruction rules, 35 Minutes)
  - Phase 5: Closure & Summary (Short interactive games, exact questions and answers to end on, school exit review, 15 Minutes)
- Inclusive Education & Differentiation layouts: Side-by-side cards ("For Struggling Learners" and "For Advanced Learners") using clear colored backgrounds.

📋 LESSON PLAN HTML TEMPLATE structure:
<article class="lesson-plan max-w-5xl mx-auto bg-slate-50 shadow-xl rounded-3xl overflow-hidden print:shadow-none font-sans">
  
  <!-- PREMIUM CAPS LESSON PLAN HEADER (Replicated from signature PDF design) -->
  <header class="text-white p-8 rounded-3xl m-4 relative overflow-hidden shadow-xl" style="background: linear-gradient(135deg, \${primary}, \${accent});">
    <div class="flex flex-wrap gap-2.5 mb-5">
      <span class="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">CAPS ALIGNED</span>
      <span class="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">\${subject}: GRADE \${grade}</span>
      <span class="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">TERM \${term} • WEEK \${week}</span>
    </div>
    
    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-none mb-3 font-sans">\${topic}</h1>
    <p class="text-white/95 text-xl font-bold italic mb-6">Topic: \${topic}</p>
    
    <!-- Dot-divided premium metadata line -->
    <div class="pt-6 border-t border-white/20 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-white uppercase tracking-wider">
      <div class="flex items-center gap-2">📅 <span class="opacity-80">Date:</span> 20 July 2026</div>
      <div class="hidden sm:inline opacity-40">•</div>
      <div class="flex items-center gap-2">⏱️ <span class="opacity-80">Duration:</span> \${duration}</div>
      <div class="hidden sm:inline opacity-40">•</div>
      <div class="flex items-center gap-2">👥 <span class="opacity-80">Class Size:</span> 35 Learners</div>
    </div>
  </header>

  <div class="p-6 md:p-8 space-y-8">
    
    <!-- AIM AND RESOURCES -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-3xl p-6 shadow-md border-2" style="border-color: \${light};">
        <h2 class="text-xl font-extrabold flex items-center gap-2 mb-4" style="color: \${dark};">🎯 Aim of the Lesson</h2>
        <div class="space-y-4">
          <p class="text-slate-600 font-medium leading-relaxed">At the end of this lesson, learners must be accomplished, confident, and independently able to:</p>
          <ul class="space-y-3">
            <!-- INSTRUCTIONS: Generate 3 to 5 highly detailed and specific learning objectives using Bloom's Taxonomy. Every objective MUST be fully written out inside a styled <li> element. DO NOT USE INTERPOLATION CODE. Write real content. Example structure:
            <li class="flex items-start gap-2.5">
              <span class="text-green-500 text-lg flex-shrink-0 mt-0.5">✓</span>
              <span class="text-slate-700 font-medium text-sm leading-relaxed">[Measurable objective here, e.g. "Listen attentively to a short story and accurately recall details (who, what, and where)."]</span>
            </li>
            -->
          </ul>
        </div>
      </div>
      
      <div class="bg-white rounded-3xl p-6 shadow-md border-2" style="border-color: \${light};">
        <h2 class="text-xl font-extrabold flex items-center gap-2 mb-4" style="color: \${dark};">🎒 Resources Needed</h2>
        <div class="space-y-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">For the Teacher:</p>
            <ul class="list-disc list-inside text-slate-700 text-sm font-medium space-y-1.5 pl-2">
              <!-- INSTRUCTIONS: Generate at least 3-4 specific physical and visual resources for the teacher, each inside a <li> element. Example:
              <li>[Detailed teacher resource, e.g. "A bright, decorated 'Speaking Token' like a colorful South African beaded stick."]</li>
              -->
            </ul>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">For the Learners:</p>
            <ul class="list-disc list-inside text-slate-700 text-sm font-medium space-y-1.5 pl-2">
              <!-- INSTRUCTIONS: Generate at least 2-3 specific learner materials, each inside a <li> element. Example:
              <li>[Detailed learner material, e.g. "Printed active-listening worksheet with color pencils."]</li>
              -->
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- PRIOR KNOWLEDGE & PREPARATION -->
    <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
      <h2 class="text-xl font-extrabold flex items-center gap-2 mb-3 text-slate-800">🧠 Prior Knowledge & Preparation</h2>
      <p class="text-slate-650 font-medium text-sm leading-relaxed mb-4">
        <!-- INSTRUCTIONS: Write 2-3 detailed paragraphs of the learners' prior knowledge, pre-classroom prep, and how to activate their attention. DO NOT use generic summaries. -->
      </p>
      
      <div class="rounded-2xl p-4 flex gap-3 border" style="background-color: \${light}; border-color: \${accent};">
        <div class="text-2xl mt-0.5">💡</div>
        <div>
          <p class="text-xs font-heavy uppercase tracking-wider mb-1 font-bold" style="color: \${dark};">CAPS Core connection</p>
          <p class="text-xs leading-relaxed font-semibold" style="color: \${dark};">
            <!-- INSTRUCTIONS: Write a highly detailed South African CAPS connection statement referencing the specific Grade, Subject, Term, and curriculum focus. -->
          </p>
        </div>
      </div>
    </div>

    <!-- CORE CONTENT & RULES -->
    <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
      <h2 class="text-xl font-extrabold flex items-center gap-2 text-slate-800">📑 Core Content & Key Concepts</h2>
      <div class="space-y-4">
        <!-- INSTRUCTIONS: Generate 2 to 3 detailed cards for core content and concepts. Each card must use the following structure:
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h3 class="font-extrabold text-slate-800 mb-1">[Concept Title, e.g. "Whole-Body Listening"]</h3>
          <p class="text-slate-600 text-sm font-medium leading-relaxed">[Detailed, extremely comprehensive content explanation, including South African contexts and terminology]</p>
        </div>
        -->
      </div>
    </div>

    <!-- LESSON PROCEDURE -->
    <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
      <h2 class="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">📖 Step-by-Step Lesson Procedure</h2>
      <div class="space-y-8 relative">
        <!-- INSTRUCTIONS: You must generate all 5 phases of the lesson procedure sequentially. For each phase, use the exact HTML structure below. DO NOT skip any phase, and ensure content is rich, extensive, and complete. -->
        
        <!-- PHASE 1: HOOK (15 Minutes) -->
        <div class="phase-row border-l-4 pl-6 relative pb-6 border-slate-200">
          <div class="absolute -left-[18px] top-0 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md" style="background-color: \${primary};">1</div>
          <div class="mb-2">
            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold leading-none mb-2">PHASE 1: HOOK</span>
            <h3 class="text-lg font-extrabold text-slate-800 leading-tight">Introduction & Hook <span class="text-slate-400 font-medium text-xs ml-2">(15 Minutes)</span></h3>
          </div>
          <div class="text-sm font-medium text-slate-700 space-y-4 pt-1 leading-relaxed">
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">👩‍🏫 Teacher Actions & Explanations:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate extensive teacher actions explaining how to launch the lesson and draw in learner attention]</p>
                <p><strong>Teacher Spoken Script (Say this):</strong> "[Generate the exact, word-for-word spoken script for the teacher]"</p>
              </div>
            </div>
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">🧑‍🎓 Learner Active Tasks:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate the physical/verbal/written tasks the learners perform]</p>
              </div>
            </div>
            <div class="bg-yellow-50/70 p-3 rounded-xl border border-yellow-250 mt-2 text-xs">
              <p class="font-bold text-yellow-905 flex items-center gap-1.5">🔍 Formative Assessment Opportunity:</p>
              <p class="text-yellow-805 mt-1 font-semibold leading-relaxed">[Generate clear observation guidelines for the teacher to check learner focus]</p>
            </div>
          </div>
        </div>

        <!-- PHASE 2: DIRECT INSTRUCTION (30 Minutes) -->
        <div class="phase-row border-l-4 pl-6 relative pb-6 border-slate-200">
          <div class="absolute -left-[18px] top-0 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md" style="background-color: \${primary};">2</div>
          <div class="mb-2">
            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold leading-none mb-2">PHASE 2: DIRECT INSTRUCTION</span>
            <h3 class="text-lg font-extrabold text-slate-800 leading-tight">Concept Demonstration <span class="text-slate-400 font-medium text-xs ml-2">(30 Minutes)</span></h3>
          </div>
          <div class="text-sm font-medium text-slate-700 space-y-4 pt-1 leading-relaxed">
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">👩‍🏫 Teacher Actions & Explanations:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate extensive teacher actions explaining core concepts clearly]</p>
                <p><strong>Teacher Spoken Script (Say this):</strong> "[Generate exact word-for-word spoken script with rich examples and South African contexts]"</p>
              </div>
            </div>
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">🧑‍🎓 Learner Active Tasks:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate physical/verbal/written tasks the learners perform]</p>
              </div>
            </div>
            <div class="bg-yellow-50/70 p-3 rounded-xl border border-yellow-250 mt-2 text-xs">
              <p class="font-bold text-yellow-905 flex items-center gap-1.5">🔍 Formative Assessment Opportunity:</p>
              <p class="text-yellow-805 mt-1 font-semibold leading-relaxed">[Generate clear observation guidelines for the teacher]</p>
            </div>
          </div>
        </div>

        <!-- PHASE 3: GUIDED PRACTICE (25 Minutes) -->
        <div class="phase-row border-l-4 pl-6 relative pb-6 border-slate-200">
          <div class="absolute -left-[18px] top-0 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md" style="background-color: \${primary};">3</div>
          <div class="mb-2">
            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold leading-none mb-2">PHASE 3: GUIDED PRACTICE</span>
            <h3 class="text-lg font-extrabold text-slate-800 leading-tight">Collaborative Activity <span class="text-slate-400 font-medium text-xs ml-2">(25 Minutes)</span></h3>
          </div>
          <div class="text-sm font-medium text-slate-700 space-y-4 pt-1 leading-relaxed">
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">👩‍🏫 Teacher Actions & Explanations:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate step-by-step roleplay or pair activity rules]</p>
              </div>
            </div>
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">🧑‍🎓 Learner Active Tasks:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate the tasks learners perform together. Must use character names like Zola, Liam, etc.]</p>
              </div>
            </div>
            <div class="bg-yellow-50/70 p-3 rounded-xl border border-yellow-250 mt-2 text-xs">
              <p class="font-bold text-yellow-905 flex items-center gap-1.5">🔍 Formative Assessment Opportunity:</p>
              <p class="text-yellow-805 mt-1 font-semibold leading-relaxed">[Generate clear observation guidelines for the teacher to monitor pair work]</p>
            </div>
          </div>
        </div>

        <!-- PHASE 4: INDEPENDENT PRACTICE (35 Minutes) -->
        <div class="phase-row border-l-4 pl-6 relative pb-6 border-slate-200">
          <div class="absolute -left-[18px] top-0 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md" style="background-color: \${primary};">4</div>
          <div class="mb-2">
            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold leading-none mb-2">PHASE 4: INDEPENDENT PRACTICE</span>
            <h3 class="text-lg font-extrabold text-slate-800 leading-tight">Written Worksheet <span class="text-slate-400 font-medium text-xs ml-2">(35 Minutes)</span></h3>
          </div>
          <div class="text-sm font-medium text-slate-700 space-y-4 pt-1 leading-relaxed">
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">👩‍🏫 Teacher Actions & Explanations:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Explain how to transition learners and hand out the independent worksheet]</p>
                <p><strong>Teacher Spoken Script (Say this):</strong> "[Generate the exact spoken script introducing the worksheet]"</p>
              </div>
            </div>
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">🧑‍🎓 Learner Active Tasks:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate description of learners completing the worksheet independently]</p>
              </div>
            </div>
          </div>
        </div>

        <!-- PHASE 5: CLOSURE & SUMMARY (15 Minutes) -->
        <div class="phase-row border-l-4 pl-6 relative pb-6 border-slate-200 last:pb-0">
          <div class="absolute -left-[18px] top-0 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md" style="background-color: \${primary};">5</div>
          <div class="mb-2">
            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold leading-none mb-2">PHASE 5: CLOSURE</span>
            <h3 class="text-lg font-extrabold text-slate-800 leading-tight">Interactive Summary & Exit Ticket <span class="text-slate-400 font-medium text-xs ml-2">(15 Minutes)</span></h3>
          </div>
          <div class="text-sm font-medium text-slate-700 space-y-4 pt-1 leading-relaxed">
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">👩‍🏫 Teacher Actions & Explanations:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate review of key vocabulary or a fast-paced summary game]</p>
                <p><strong>Teacher Spoken Script (Say this):</strong> "[Generate the exact exit ticket/review script]"</p>
              </div>
            </div>
            <div>
              <p class="font-bold mb-1" style="color: \${dark};">🧑‍🎓 Learner Active Tasks:</p>
              <div class="text-slate-650 ml-4 space-y-3 font-medium text-sm leading-relaxed">
                <p>[Generate description of learners participating in the thumbs-up/down review or handing in exit tickets]</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DIFFERENTIATION -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-3xl p-6 shadow-md border border-slate-100">
      <div class="rounded-2xl p-5 border border-purple-100 bg-purple-50/50">
        <h3 class="font-extrabold text-purple-900 mb-2 flex items-center gap-1.5">🧩 For Struggling Learners</h3>
        <p class="text-purple-800 text-sm font-semibold leading-relaxed">
          <!-- INSTRUCTIONS: Write 3-4 specific, actionable strategies to scaffold and simplify tasks for struggling learners in rich prose. No placeholders. -->
        </p>
      </div>
      <div class="rounded-2xl p-5 border border-indigo-100 bg-indigo-50/50">
        <h3 class="font-extrabold text-indigo-900 mb-2 flex items-center gap-1.5">🚀 For Advanced Learners</h3>
        <p class="text-indigo-800 text-sm font-semibold leading-relaxed">
          <!-- INSTRUCTIONS: Write 3-4 specific, actionable extension activities and advanced tasks for fast-finishers or highly capable learners. -->
        </p>
      </div>
    </div>

    <!-- REFLECTION BANNER -->
    <div class="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-200">
      <h3 class="text-lg font-bold text-slate-700 mb-2">📝 Teacher Reflection Notes</h3>
      <div class="h-16 bg-slate-50/50 border border-slate-200 rounded-xl mb-2 flex items-center justify-center text-xs text-slate-400 italic font-medium">Use this space after the lesson to denote what parts worked-well vs. what requires adjustment...</div>
    </div>

    <!-- APPENDED DIAGNOSTIC WORKSHEET -->
    <div class="bg-white rounded-3xl p-8 shadow-xl mt-12 border-t-[16px]" style="border-color: \${primary};">
      <div class="border-b-2 border-dashed border-slate-300 pb-6 mb-8 text-center">
        <span class="bg-orange-100 text-orange-800 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 inline-block">GRADE \${grade} \${subject}</span>
        <h2 class="text-3xl font-extrabold text-slate-800 mb-2">\${topic} Challenge</h2>
        <p class="text-slate-500 font-medium">Diagnostic Assessment & Worksheet</p>
        
        <div class="max-w-md mx-auto mt-6 flex justify-between items-end border-b-2 border-slate-800 pb-2">
          <div class="text-left w-full mr-4">
            <span class="text-sm font-bold text-slate-500">Learner Name:</span>
            <div class="w-full h-px bg-slate-400 mt-4 border-b border-dashed"></div>
          </div>
          <div class="text-center bg-slate-50 rounded-2xl border-4 border-slate-800 px-6 py-4 shadow-sm min-w-[120px]">
            <span class="text-xs font-bold text-orange-600 block mb-1 uppercase tracking-wider">Score</span>
            <span class="text-2xl font-black text-slate-800">______ / 15</span>
          </div>
        </div>
      </div>

      <div class="space-y-10">
        <!-- INSTRUCTIONS: YOU MUST Generate exactly 4 highly-detailed distinct worksheet questions with actual subject-specific content matching the lesson. -->
        <!-- Question 1: Matching / Column A and B -->
        <!-- Question 2: True or False Scenarios -->
        <!-- Question 3: Complete Sentences with Word Bank -->
        <!-- Question 4: Creative Drawing/Diagram box -->
      </div>
    </div>
  </div>

  <footer class="bg-slate-200 p-6 text-center text-xs text-slate-500 font-bold border-t border-slate-300">
    EduAI Companion • CAPS Aligned Lesson Material • eduai-companion.github.io
  </footer>
</article>

Return as JSON matching:
{
  "content": "<HTML CODE FOR THE MAIN DOCUMENT (enclosing the complete styled lesson plan) HERE>",
  "memo": "<HTML CODE FOR ANSWER MEMORANDUM KEY OF INTEGRATED WORK_SHEET (if applicable) HERE>",
  "rubric": "<HTML CODE FOR ANALYTICAL MARKING RUBRIC MATRIX OF WORKSHEET TABLE HERE>",
  "assessmentCriteria": "Detailed CAPS criteria tags...",
  "successIndicators": ["string", "string"],
  "imagePrompt": "Detailed classroom lesson visual aid image prompt..."
}
`;

export const REPORT_COMMENT_TEMPLATE = `
Generate personalized, strengths-based report card comments with this structure:

📝 REPORT COMMENT TEMPLATE:
<div class="report-comments max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
  
  <!-- STUDENT HEADER -->
  <header class="border-b-2 border-gray-200 pb-6 mb-6">
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">\${studentName}</h1>
        <p class="text-gray-600">Grade \${grade} • \${subject} • Term \${term} \${year}</p>
      </div>
      <div class="text-right">
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
          <p class="text-sm opacity-90">Achievement Level</p>
          <p class="text-3xl font-extrabold">\${achievementLevel}</p>
        </div>
      </div>
    </div>
  </header>

  <!-- STRENGTHS SECTION -->
  <section class="strengths bg-green-50 p-6 rounded-xl mb-6 border-l-4 border-green-500">
    <h2 class="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
      <span>✨</span> Strengths & Achievements
    </h2>
    <p class="text-green-800 leading-relaxed">\${strengths}</p>
  </section>

  <!-- AREAS FOR DEVELOPMENT -->
  <section class="development bg-blue-50 p-6 rounded-xl mb-6 border-l-4 border-blue-500">
    <h2 class="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
      <span>🌱</span> Areas for Development
    </h2>
    <p class="text-blue-800 leading-relaxed">\${areasForDevelopment}</p>
  </section>

  <!-- LEARNING BEHAVIORS -->
  <section class="behaviors bg-purple-50 p-6 rounded-xl mb-6 border-l-4 border-purple-500">
    <h2 class="text-xl font-bold text-purple-900 mb-3 flex items-center gap-2">
      <span>💪</span> Learning Behaviors & Attitudes
    </h2>
    <div class="grid md:grid-cols-2 gap-4 mt-3">
      \${learningBehaviors.map(behavior => \`
        <div class="bg-white p-3 rounded-lg border border-purple-200">
          <p class="font-medium text-purple-900">\${behavior.aspect}:</p>
          <p class="text-purple-700 text-sm mt-1">\${behavior.comment}</p>
        </div>
      \`).join('')}
    </div>
  </section>

  <!-- GOALS FOR NEXT TERM -->
  <section class="goals bg-orange-50 p-6 rounded-xl mb-6 border-l-4 border-orange-500">
    <h2 class="text-xl font-bold text-orange-900 mb-3 flex items-center gap-2">
      <span>🎯</span> Goals for Next Term
    </h2>
    <ul class="space-y-2">
      \${goals.map((goal, i) => \`
        <li class="flex items-start gap-3">
          <span class="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">\${i+1}</span>
          <span class="text-orange-800">\${goal}</span>
        </li>
      \`).join('')}
    </ul>
  </section>

  <!-- TEACHER SIGNATURE -->
  <div class="signature mt-8 pt-6 border-t border-gray-300">
    <div class="flex justify-between items-end">
      <div>
        <p class="text-gray-600 mb-8">Teacher's Signature: _______________________</p>
        <p class="font-medium text-gray-900">\${teacherName}</p>
        <p class="text-sm text-gray-600">\${subject} Teacher</p>
      </div>
      <div class="text-right">
        <p class="text-gray-600">Date: _______________</p>
        <p class="text-sm text-gray-500 mt-4">EduAI Companion • CAPS Aligned</p>
      </div>
    </div>
  </div>

</div>

Return as JSON: { content: "[HTML above]", parentMeetingNotes: "[suggested discussion points]", resourcesForHome: "[home support suggestions]" }
`;

export const CURRICULUM_MAP_TEMPLATE = `
Generate a term-long curriculum map with this comprehensive structure:

📅 CURRICULUM MAP TEMPLATE:
<article class="curriculum-map max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
  
  <!-- HEADER -->
  <header class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8">
    <h1 class="text-4xl font-extrabold mb-2">📅 Curriculum Map</h1>
    <p class="text-xl opacity-95">\${subject} • Grade \${grade} • Term \${term} \${year}</p>
    <p class="mt-2 text-white/90">CAPS Alignment: \${capsReference}</p>
  </header>

  <!-- TERM OVERVIEW -->
  <section class="overview bg-gray-50 p-6 border-b border-gray-200">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Term Overview</h2>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p class="text-sm text-gray-600 mb-1">Total Weeks</p>
        <p class="text-2xl font-bold text-gray-900">\${totalWeeks} weeks</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p class="text-sm text-gray-600 mb-1">Major Topics</p>
        <p class="text-2xl font-bold text-gray-900">\${topics.length} topics</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p class="text-sm text-gray-600 mb-1">Assessments</p>
        <p class="text-2xl font-bold text-gray-900">\${assessmentCount}</p>
      </div>
    </div>
  </section>

  <!-- WEEKLY BREAKDOWN -->
  <section class="weekly-breakdown p-8">
    <h2 class="text-3xl font-bold text-gray-900 mb-6">Weekly Breakdown</h2>
    
    <div class="space-y-4">
      \${weeks.map(week => \`
      <div class="week-card bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-emerald-400 transition">
        <div class="week-header bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <span class="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
              \${week.number}
            </span>
            <div>
              <h3 class="font-bold text-gray-900">Week \${week.number}: \${week.topic}</h3>
              <p class="text-sm text-gray-600">\${week.duration}</p>
            </div>
          </div>
          <div class="flex gap-2">
            \${week.tags.map(tag => \`
              <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                \${tag}
              </span>
            \`).join('')}
          </div>
        </div>
        
        <div class="week-content p-6 grid md:grid-cols-2 gap-6">
          <div>
            <p class="font-bold text-gray-800 mb-2">Learning Objectives:</p>
            <ul class="list-disc list-inside text-gray-700 space-y-1">
              \${week.objectives.map(obj => \`<li>\${obj}</li>\`).join('')}
            </ul>
          </div>
          <div>
            <p class="font-bold text-gray-800 mb-2">Key Activities:</p>
            <ul class="list-disc list-inside text-gray-700 space-y-1">
              \${week.activities.map(act => \`<li>\${act}</li>\`).join('')}
            </ul>
          </div>
        </div>
        
        \${week.assessment ? \`
        <div class="week-assessment bg-yellow-50 px-6 py-3 border-t border-yellow-200">
          <p class="text-sm font-medium text-yellow-900">📊 Assessment: \${week.assessment}</p>
        </div>\` : ''}
      </div>
      \`).join('')}
    </div>
  </section>

  <!-- ASSESSMENT SCHEDULE -->
  <section class="assessments bg-blue-50 p-8 border-t border-blue-100">
    <h2 class="text-2xl font-bold text-blue-900 mb-4">📋 Assessment Schedule</h2>
    <div class="bg-white rounded-xl border border-blue-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-blue-100">
          <tr>
            <th class="text-left p-4 font-bold text-blue-900">Week</th>
            <th class="text-left p-4 font-bold text-blue-900">Assessment Type</th>
            <th class="text-left p-4 font-bold text-blue-900">Topic/Coverage</th>
            <th class="text-left p-4 font-bold text-blue-900">Weighting</th>
          </tr>
        </thead>
        <tbody>
          \${assessments.map((assess, i) => \`
            <tr class="\${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'} border-b border-blue-100">
              <td class="p-4 text-gray-800">Week \${assess.week}</td>
              <td class="p-4 text-gray-800">\${assess.type}</td>
              <td class="p-4 text-gray-800">\${assess.coverage}</td>
              <td class="p-4 text-gray-800">\${assess.weighting}%</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-gray-100 p-6 text-center text-sm text-gray-600">
    <p class="font-medium">EduAI Companion • CAPS Curriculum Map</p>
    <p class="text-xs mt-1">Generated: \${new Date().toLocaleDateString('en-ZA')} • eduai-companion.github.io</p>
  </footer>
</article>

Return as JSON: { content: "[HTML above]", resourcesList: "[required resources]", crossCurricularLinks: "[links to other subjects]" }
`;

export default {
  LESSON_PLAN_TEMPLATE,
  REPORT_COMMENT_TEMPLATE,
  CURRICULUM_MAP_TEMPLATE
};