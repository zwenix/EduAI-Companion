/**
 * EduAI Companion - Content Generation Templates
 * Worksheets, Posters, Study Guides, Infographics
 */

export const WORKSHEET_PROMPT_TEMPLATE = `
Generate a highly descriptive, CAPS-aligned primary student activity worksheet. The content generated MUST be rich, complete, and fully fleshed out with actual, engaging questions tailored to Grade \${grade} \${subject}, with zero placeholders or standard summaries.

🎨 ULTRA-PREMIUM WORKSHEET DESIGN SYSTEM:

HEADER SECTION (Most Important Visual Element):
• Full-width gradient banner with subject-specific colors (use exact hex codes from Color System)
• Glassmorphism effect: backdrop-blur-md, bg-white/10, border border-white/20
• Title: text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-950
• Subtitle: text-xl text-slate-900/90 font-medium
• Grade badge: Circular design with shadow-lg, positioned top-right
  <div class="absolute top-6 right-6 bg-white/20 backdrop-blur-md rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl border-2 border-white/30">
    <span class="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">Grade</span>
    <span class="text-3xl font-black text-slate-950">\${grade}</span>
  </div>
• Metadata strip below header:
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
    <div class="flex items-center gap-2 text-slate-900/90">
      <span class="text-lg">📚</span>
      <span class="font-semibold">Subject:</span> \subGrade \${subject}
    </div>
    <div class="flex items-center gap-2 text-slate-900/90 font-mono">
      <span class="text-lg">📅</span>
      <span class="font-semibold">Term:</span> Term \${term}
    </div>
    <div class="flex items-center gap-2 text-slate-900/90">
      <span class="text-lg">🎯</span>
      <span class="font-semibold">Total Marks:</span> \${totalMarks}
    </div>
  </div>

METADATA INPUT SECTION:
• Beautiful card design with subtle shadow
• Input fields with dotted underlines and hover effects
• Score box: Elevated design with gradient border
  <div class="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Learner Name</p>
        <div class="border-b-2 border-dashed border-slate-300 pb-1 min-w-[200px]"></div>
      </div>
      <div class="text-right">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Date</p>
        <div class="border-b-2 border-dashed border-slate-300 pb-1 min-w-[120px]"></div>
      </div>
    </div>
    <div class="mt-4 pt-4 border-t border-slate-200">
      <div class="flex items-center justify-between bg-white rounded-xl p-3 shadow-inner">
        <span class="text-sm font-bold text-slate-600">TOTAL SCORE:</span>
        <div class="flex items-center gap-2">
          <div class="w-12 h-12 border-2 border-dashed border-slate-300 rounded-lg"></div>
          <span class="text-2xl font-black text-slate-400">/</span>
          <span class="text-2xl font-black text-slate-800">\${totalMarks}</span>
        </div>
      </div>
    </div>
  </div>

INSTRUCTIONS BOX:
• Eye-catching design with icon and colored border
• Background: bg-gradient-to-r from-amber-50 to-orange-50
• Border: border-l-4 border-amber-500
• Icon: Large emoji or custom SVG
• Typography: Clear, readable, encouraging tone
  <div class="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-2xl p-6 shadow-md mb-8">
    <div class="flex items-start gap-3">
      <span class="text-3xl">📋</span>
      <div>
        <h3 class="text-sm font-black uppercase tracking-wider text-amber-900 mb-2">Instructions & Guidelines</h3>
        <p class="text-amber-800 font-medium leading-relaxed">\${instructions}</p>
      </div>
    </div>
  </div>

QUESTION DESIGN SYSTEM:

Question Container:
• Card design with hover effect
• Background: bg-white with shadow-md
• Border: border border-slate-200
• Hover: hover:shadow-lg hover:-translate-y-1 transition-all duration-300
• Padding: p-6 to p-8

Question Number Badge:
• Circular design with gradient background
• Size: w-12 h-12
• Typography: font-black text-white text-lg
• Shadow: shadow-lg
  <div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-lg flex-shrink-0" style="background: \${primary};">
    \${i+1}
  </div>

Question Header:
• Title: text-lg font-bold text-slate-800
• Marks badge: Inline pill with subject color
  <span class="inline-block ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
    [\${q.marks} Marks]
  </span>

Question Types (Each with Unique Design):

1. MULTIPLE CHOICE:
   • Grid layout: grid-cols-1 md:grid-cols-2 gap-4
   • Option cards with hover effects
   • Radio buttons with custom styling
   • Selected state: border-2 border-blue-500 bg-blue-50
   • Hover state: border-2 border-blue-300 bg-blue-50/50
   <label class="flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md">
     <input type="radio" name="q\${i}" class="w-5 h-5 text-blue-600 focus:ring-blue-500">
     <span class="text-sm font-semibold text-slate-700">\${String.fromCharCode(65 + idx)}. \${opt}</span>
   </label>

2. TRUE/FALSE:
   • Pill-shaped buttons with color coding
   • True: bg-green-100 text-green-800 border-green-300
   • False: bg-red-100 text-red-800 border-red-300
   • Hover effects with scale transform
   <div class="flex gap-3">
     <button class="flex-1 px-6 py-3 bg-green-100 text-green-800 border-2 border-green-300 rounded-xl font-bold hover:bg-green-200 hover:scale-105 transition-all">
       ✓ True
     </button>
     <button class="flex-1 px-6 py-3 bg-red-100 text-red-800 border-2 border-red-300 rounded-xl font-bold hover:bg-red-200 hover:scale-105 transition-all">
       ✗ False
     </button>
   </div>

3. MATCHING/COLUMN A & B:
   • Side-by-side layout with connecting lines
   • Column A: bg-white border-2 border-slate-200
   • Column B: bg-slate-50 border-2 border-dashed border-slate-300
   • Connecting arrows or lines between items
   <div class="grid grid-cols-12 gap-4 items-center">
     <div class="col-span-5 p-4 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 shadow-sm">
       \${pair.colA}
     </div>
     <div class="col-span-2 flex items-center justify-center">
       <span class="text-2xl text-slate-400">→</span>
     </div>
     <div class="col-span-5 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center">
       <span class="text-xs font-bold text-slate-500 uppercase">Write letter:</span>
       <div class="mt-2 w-12 h-12 mx-auto border-2 border-slate-300 rounded-lg"></div>
     </div>
   </div>

4. FILL-IN-THE-BLANKS:
   • Inline blanks with dotted underlines
   • Word bank in elevated card
   • Hover effects on word bank items
   <p class="text-slate-700 leading-relaxed">
     The capital of South Africa is <span class="inline-block w-32 border-b-2 border-dashed border-slate-400 mx-1"></span>, and the country has <span class="inline-block w-20 border-b-2 border-dashed border-slate-400 mx-1"></span> official languages.
   </p>
   <div class="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
     <p class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Word Bank:</p>
     <div class="flex flex-wrap gap-2">
       <span class="px-3 py-1 bg-white border border-blue-300 rounded-lg text-sm font-semibold text-blue-700 cursor-pointer hover:bg-blue-100 transition">Pretoria</span>
       <span class="px-3 py-1 bg-white border border-blue-300 rounded-lg text-sm font-semibold text-blue-700 cursor-pointer hover:bg-blue-100 transition">11</span>
     </div>
   </div>

5. SHORT ANSWER:
   • Lined writing area with proper spacing
   • Character count or line indicators
   • Guidance text in light color
   <div class="space-y-3">
     <p class="text-xs text-slate-500 italic">Write your answer on the lines below:</p>
     <div class="border-b border-dashed border-slate-300 h-8"></div>
     <div class="border-b border-dashed border-slate-300 h-8"></div>
     <div class="border-b border-dashed border-slate-300 h-8"></div>
   </div>

6. DRAWING/ILLUSTRATION:
   • Large drawing area with dashed border
   • Light background color
   • Instruction text centered
   • Pencil icon or art supplies emoji
   <div class="border-2 border-dashed border-slate-300 rounded-2xl min-h-[200px] bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 text-center">
     <span class="text-5xl mb-3">🎨</span>
     <p class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">\subWorkedExample \${q.drawingInstructions}</p>
     <p class="text-xs text-slate-400">Use this space to draw your answer</p>
   </div>

7. TABLE/CHART COMPLETION:
   • Clean table design with alternating row colors
   • Header row with subject color
   • Empty cells with dotted borders
   • Hover effects on rows
   <table class="w-full border-collapse">
     <thead>
       <tr class="text-white" style="background: \${primary};">
         <th class="border-2 border-white p-3 text-left font-bold">Column 1</th>
         <th class="border-2 border-white p-3 text-left font-bold">Column 2</th>
       </tr>
     </thead>
     <tbody>
       <tr class="bg-white hover:bg-blue-50 transition">
         <td class="border-2 border-slate-200 p-3">Given data</td>
         <td class="border-2 border-slate-200 p-3 bg-slate-50"></td>
       </tr>
     </tbody>
   </table>

SUCCESS INDICATORS SECTION:
• Green-themed card with checklist
• Checkmark icons for each item
• Encouraging, positive language
  <div class="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 rounded-r-2xl p-6 my-8 shadow-md">
    <h3 class="text-sm font-black uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-2">
      <span class="text-xl">🌟</span> Checklist for Success
    </h3>
    <ul class="space-y-2">
      \${successIndicators.map(si => \`
        <li class="flex items-start gap-2.5">
          <span class="text-emerald-500 text-lg flex-shrink-0 mt-0.5">✓</span>
          <span class="text-emerald-800 font-medium">\${si}</span>
        </li>
      \`).join('')}
    </ul>
  </div>

FOOTER:
• Subtle design with branding
• Print instructions
• Contact/website info
  <footer class="mt-12 pt-6 border-t-2 border-dashed border-slate-200 text-center">
    <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">
      EduAI Companion • CAPS Aligned • eduai-companion.github.io
    </p>
    <p class="text-xs text-slate-400 mt-2">
      Print tip: Use "Fit to Page" for best results • 300 DPI recommended
    </p>
  </footer>

🎨 IMAGE PROMPT SPECIFICATION:
"Professional educational illustration for South African Grade [X] [Subject]: [Topic]. Style: Semi-realistic digital painting, children's non-fiction book aesthetic."

CRITICAL JSON OUTPUT:
{
  "content": "<Complete HTML for worksheet following all design rules above>",
  "memo": "<Complete HTML for answer memorandum with detailed marking guidelines>",
  "rubric": "<Complete HTML for analytical marking rubric with criteria and performance levels>",
  "successIndicators": ["string", "string"],
  "imagePrompt": "Ultra-detailed image prompt following the Master Prompt system"
}
`;

export const VISUAL_AID_PROMPT_TEMPLATE = `
Design a breathtaking, classroom-ready educational poster/infographic that looks like it belongs in a world-class museum or textbook. This must be the most visually appealing educational poster a learner has ever seen.

🎨 ULTRA-PREMIUM POSTER DESIGN SYSTEM:

CONTAINER STRUCTURE:
<article class="poster-container max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">

TOP BANNER (Hero Section):
• Full-width gradient with subject colors
• Glassmorphism effects for metadata
• Large, impactful title
• Decorative elements (subtle patterns, icons)
  <div class="banner bg-gradient-to-br from-[subject-start] via-[subject-mid] to-[subject-end] p-8 md:p-12 text-slate-950 relative overflow-hidden" style="background: linear-gradient(135deg, \${primary}, \${dark});">
    <!-- Decorative background pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
    </div>
    
    <div class="relative z-10">
      <div class="flex justify-between items-start mb-6">
        <div>
          <span class="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4 font-mono">
            Educational Poster
          </span>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-3">
            \${title}
          </h1>
          <p class="text-xl md:text-2xl text-slate-900/90 font-medium">
            \${subtitle}
          </p>
        </div>
        <div class="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border-2 border-white/30 flex-shrink-0">
          <span class="block text-xs font-bold uppercase tracking-wider opacity-80 font-mono">Grade</span>
          <span class="text-4xl font-black">\${grade}</span>
        </div>
      </div>
      
      <div class="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-semibold">
        <div class="flex items-center gap-2">
          <span class="text-xl">📚</span>
          <span class="font-semibold">\${subject}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl">🎯</span>
          <span class="font-semibold">CAPS Aligned</span>
        </div>
        <div class="flex items-center gap-2 font-mono">
          <span class="text-xl">📅</span>
          <span class="font-semibold">Term \${term}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl">🖨️</span>
          <span class="font-semibold">Print-Ready</span>
        </div>
      </div>
    </div>
  </div>

HERO ILLUSTRATION SECTION (30% of poster):
• Large, eye-catching illustration placeholder
• Beautiful frame with shadow and border
• Contextual information about the image
  <div class="hero-section p-8 md:p-12 animate-fade-in" style="background: linear-gradient(135deg, \subAccent \${light}, #ffffff);">
    <div class="illustration-frame max-w-4xl mx-auto aspect-[16/9] bg-white rounded-3xl shadow-2xl border-4 border-dashed flex items-center justify-center overflow-hidden" style="border-color: \${accent};">
      <div class="text-center p-8">
        <div class="text-7xl mb-4">🎨</div>
        <p class="text-lg font-bold text-gray-700 mb-2">[Illustration: \${imagePrompt}]</p>
        <p class="text-sm text-gray-500">
          Professional educational artwork • South African context • 300 DPI print quality
        </p>
      </div>
    </div>
  </div>

CONTENT GRID SECTION:
• Responsive grid layout (2-3 columns)
• Beautiful content cards with hover effects
• Icons, colors, and typography hierarchy
  <div class="content-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 md:p-12">
    \${contentBlocks.map(block => \`
      <div class="content-card bg-white rounded-2xl p-6 border-2 border-gray-100 hover:shadow-xl transition-all duration-300 group hover:border-indigo-100">
        <!-- Card Header -->
        <div class="card-header flex items-center gap-3 mb-4">
          <div class="icon-bubble text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform" style="background: linear-gradient(135deg, \${primary}, \${dark});">
            \${block.icon}
          </div>
          <h3 class="font-bold text-xl text-gray-800 transition-colors">
            \${block.title}
          </h3>
        </div>
        
        <!-- Inline Illustration -->
        <div class="my-4 bg-gradient-to-br from-gray-50 to-white p-1 rounded-xl shadow-inner border border-gray-100">
          <div class="bg-white rounded-lg aspect-[4/3] flex items-center justify-center">
            <p class="text-xs text-gray-500 text-center px-4">
              [Mini-Illustration: \${block.title} concept for Grade \${grade}]
            </p>
          </div>
        </div>
        
        <!-- Card Body -->
        <div class="card-body text-gray-700 leading-relaxed font-medium text-sm space-y-3">
          \${block.content}
        </div>
        
        <!-- Callout Box -->
        \${block.callout ? \`
          <div class="callout mt-4 p-4 rounded-xl border-l-4 shadow-sm" style="background: \subAccent \${light}; border-color: \${accent};">
            <p class="text-sm font-semibold flex items-start gap-2">
              <span class="text-lg">💡</span>
              <span>\subLabel \subCallout \${block.callout}</span>
            </p>
          </div>
        \` : ''}
      </div>
    \`).join('')}
  </div>

KEY TAKEAWAYS SECTION:
• Highlighted section with subject color
• Pill-shaped tags for key points
• Eye-catching design
  <div class="takeaways p-8 md:p-12 border-t-2" style="background: linear-gradient(to right, \${light}, #ffffff); border-color: \${accent};">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-black mb-6 flex items-center gap-3">
        <span class="text-3xl">🔑</span>
        <span>Key Takeaways</span>
      </h2>
      <div class="flex flex-wrap gap-3">
        \${keyPoints.map(kp => \`
          <span class="pill bg-white px-5 py-3 rounded-full text-sm font-bold shadow-md border-2 hover:shadow-lg transition-all cursor-default" style="border-color: \${light};">
            \${kp}
          </span>
        \`).join('')}
      </div>
    </div>
  </div>

QUICK FACTS SECTION:
  <div class="quick-facts bg-gray-50 p-8 md:p-12">
    <h2 class="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
      <span class="text-3xl">⚡</span>
      <span>Quick Facts</span>
    </h2>
    <div class="grid md:grid-cols-3 gap-4">
      \${quickFacts.map(fact => \`
        <div class="fact-card bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all">
          <div class="text-3xl mb-2">\subIcon \${fact.icon}</div>
          <p class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">\${fact.label}</p>
          <p class="text-2xl font-black text-gray-800">\${fact.value}</p>
          <p class="text-sm text-gray-600 mt-2">\${fact.description}</p>
        </div>
      \`).join('')}
    </div>
  </div>

  <footer class="footer bg-gradient-to-r from-gray-100 to-gray-50 p-6 text-center border-t-2 border-gray-200">
    <p class="text-sm font-bold text-gray-700 uppercase tracking-wider">
      EduAI Companion • CAPS Curriculum • Print-Ready Design
    </p>
    <p class="text-xs text-gray-500 mt-2">
      Optimized for A3/A2 printing • 300 DPI • CMYK color space
    </p>
  </footer>
</article>

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
Create a comprehensive, textbook-quality study guide with sophisticated design that rivals professional educational publishers. This must be so well-designed that learners want to keep it as a reference book.

📖 ULTRA-PREMIUM STUDY GUIDE DESIGN SYSTEM:

<article class="study-guide max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden font-sans">

COVER SECTION:
• Stunning gradient cover with depth
• Large title with professional typography
• Subject icon and badges
• Professional layout
  <header class="cover text-slate-950 p-12 md:p-16 text-center relative overflow-hidden" style="background: linear-gradient(135deg, \${primary}, \${dark});">
    <!-- Decorative elements -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
      <div class="absolute bottom-10 right-10 w-48 h-48 border-4 border-white rounded-full"></div>
    </div>
    
    <div class="relative z-10">
      <div class="subject-icon text-7xl mb-6">📚</div>
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight leading-tight">
        \subTitle \${title}
      </h1>
      <p class="text-2xl md:text-3xl opacity-95 mb-3 font-medium">
        \${subject} • Grade \subGrade \${grade}
      </p>
      <p class="text-lg opacity-90 mb-8 font-mono">
        \${capsCode}
      </p>
      
      <div class="mt-8 flex flex-wrap justify-center gap-4">
        <span class="badge bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold border border-white/30">
          ✓ CAPS Aligned
        </span>
        <span class="badge bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold border border-white/30 font-mono">
          📅 Term \subTerm \${term}
        </span>
      </div>
    </div>
  </header>

HERO ILLUSTRATION:
• Large, professional illustration
• Beautiful frame with shadow
• Contextual information
  <div class="hero-illustration p-12" style="background: linear-gradient(135deg, \${light}, #ffffff);">
    <div class="illustration-container max-w-4xl mx-auto aspect-video bg-white rounded-3xl shadow-2xl border-4 border-dashed flex items-center justify-center" style="border-color: \${accent};">
      <div class="text-center p-8">
        <p class="text-6xl mb-4">🖼️</p>
        <p class="text-xl font-bold text-gray-800 mb-2">[Concept Illustration: \${imagePrompt}]</p>
        <p class="text-sm text-gray-500">
          Professional educational artwork • South African context • Print-ready 300 DPI
        </p>
      </div>
    </div>
  </div>

TABLE OF CONTENTS:
• Clean, professional design
• Clickable links (if digital)
• Page estimates
• Visual hierarchy
  <nav class="toc bg-gradient-to-br from-gray-50 to-white border-y-2 border-gray-200 p-8 md:p-12">
    <h2 class="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
      <span class="text-3xl">📑</span>
      <span>Table of Contents</span>
    </h2>
    <ol class="space-y-3">
      \${sections.map((s, i) => \`
        <li class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
          <div class="flex items-center gap-4">
            <span class="text-white w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background: \${primary};">
              \${i+1}
            </span>
            <span class="text-lg font-semibold text-gray-800">
              \${s.title}
            </span>
          </div>
          <span class="text-sm text-gray-500 font-medium">
            • \${s.pageEstimate} min read
          </span>
        </li>
      \`).join('')}
    </ol>
  </nav>

MAIN CONTENT SECTIONS:
• Professional textbook-style layout
• Rich typography and spacing
• Visual aids and diagrams
• Interactive elements
  <main class="content p-8 md:p-12 space-y-16">
    \${sections.map((section, idx) => \`
      <section id="section-\${idx+1}" class="section scroll-mt-24">
        <!-- Section Header -->
        <div class="section-header flex items-center gap-4 mb-8 pb-4 border-b-4" style="border-color: \subAccent \${light};">
          <span class="section-number text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg" style="background: linear-gradient(135deg, \${primary}, \${dark});">
            \${idx+1}
          </span>
          <h2 class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            \subTitle \${section.title}
          </h2>
        </div>
        
        <!-- Key Concept Box -->
        \${section.keyConcept ? \`
          <div class="key-concept border-l-4 p-6 rounded-r-2xl mb-8 shadow-md" style="background: linear-gradient(to right, \${light}, #ffffff); border-color: \${primary};">
            <p class="font-black flex items-center gap-2 text-lg mb-3">
              <span class="text-2xl">💡</span>
              <span>Key Concept</span>
            </p>
            <p class="leading-relaxed font-medium text-lg text-slate-800">
              \${section.keyConcept}
            </p>
          </div>
        \` : ''}
        
        <!-- Core Explanation -->
        <div class="explanation prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4 mb-8">
          \${section.content}
        </div>
        
        <!-- Visual Aid / Diagram -->
        \${section.diagram ? \`
          <div class="diagram-frame my-8 p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300 shadow-inner">
            <div class="text-center">
              <p class="text-5xl mb-4">📊</p>
              <p class="text-lg font-bold text-gray-700 mb-2">[Diagram: \subDiagramDescription \${section.diagramDescription}]</p>
              <p class="text-sm text-gray-500">
                Labelled educational diagram • High contrast for projection
              </p>
            </div>
          </div>
        \` : ''}
        
        <!-- Worked Example -->
        \subWorkedExample \${section.example ? \`
          <div class="example border-l-4 p-6 rounded-r-2xl my-8 shadow-md" style="background: linear-gradient(to right, #f0fdf4, #ffffff); border-color: #22c55e;">
            <p class="font-black text-green-900 mb-4 flex items-center gap-2 text-lg">
              <span class="text-2xl">✨</span>
              <span>Worked Example</span>
            </p>
            <div class="example-content bg-white p-6 rounded-xl shadow-sm border border-green-200">
              \subWorkedExample \${section.example}
            </div>
          </div>
        \` : ''}
        
        <!-- Check Your Understanding -->
        <div class="check-understanding mt-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-md">
          <p class="font-black text-purple-900 mb-4 flex items-center gap-2 text-lg">
            <span class="text-2xl">🤔</span>
            <span>Check Your Understanding</span>
          </p>
          <ul class="space-y-3">
            \${section.checkQuestions.map((q, i) => \`
              <li class="flex gap-3 p-3 bg-white rounded-xl border border-purple-100">
                <span class="bullet bg-purple-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  \${i+1}
                </span>
                <span class="question text-purple-800 font-medium leading-relaxed">\${q}</span>
              </li>
            \`).join('')}
          </ul>
        </div>
      </section>
    \`).join('')}
  </main>

QUICK REFERENCE SECTION:
  <aside class="quick-ref p-8 md:p-12 border-t-2" style="background: linear-gradient(to right, \${light}, #ffffff); border-color: \${accent};">
    <h3 class="text-2xl font-black mb-4 flex items-center gap-2">
      <span>🔖</span> Quick Reference
    </h3>
    <div class="grid md:grid-cols-2 gap-4">
      \subQuickFacts \${quickFacts.map(fact => \`
        <div class="ref-card bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
          <p class="font-bold text-gray-800 mb-2">\${fact.label}:</p>
          <p class="text-gray-700 font-medium">\${fact.value}</p>
        </div>
      \`).join('')}
    </div>
  </aside>

  <footer class="footer bg-gradient-to-r from-gray-100 to-gray-50 p-8 text-center border-t-2 border-gray-200">
    <p class="text-sm font-bold text-gray-700 uppercase tracking-wider">
      EduAI Companion • CAPS Curriculum Study Guide
    </p>
    <p class="text-xs text-gray-500 mt-2">
      Print tip: Use "Fit to Page" • For best results, print on A4 at 300 DPI
    </p>
  </footer>
</article>

🎨 HERO IMAGE PROMPT:
"Educational textbook-style illustration: [Core concept of study guide] for South African Grade [X] [Subject]. Style: Semi-realistic digital painting."

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
