/**
 * EduAI Companion - Administrative Document Templates
 * Lesson Plans, Curriculum Maps, Report Comments, Meeting Notes
 */

export const LESSON_PLAN_TEMPLATE = `
Generate a comprehensive, CAPS-aligned lesson plan with this professional structure:

📋 LESSON PLAN TEMPLATE:
<article class="lesson-plan max-w-5xl mx-auto bg-white shadow-xl rounded-3xl overflow-hidden print:shadow-none">
  
  <!-- HEADER -->
  <header class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-4xl font-extrabold mb-2">📚 Lesson Plan</h1>
        <p class="text-xl opacity-95">\${topic}</p>
      </div>
      <div class="text-right">
        <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg mb-2">
          <p class="font-bold">Grade \${grade}</p>
        </div>
        <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p class="font-bold">\${subject}</p>
        </div>
      </div>
    </div>
    <div class="mt-6 flex flex-wrap gap-3">
      <span class="badge bg-white/20 px-3 py-1 rounded-full text-sm">Duration: \${duration}</span>
      <span class="badge bg-white/20 px-3 py-1 rounded-full text-sm">Term \${term}</span>
      <span class="badge bg-white/20 px-3 py-1 rounded-full text-sm">Week \${week}</span>
      <span class="badge bg-white/20 px-3 py-1 rounded-full text-sm">CAPS: \${capsCode}</span>
    </div>
  </header>

  <!-- LEARNING OBJECTIVES -->
  <section class="objectives bg-blue-50 p-6 border-b border-blue-100">
    <h2 class="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
      <span>🎯</span> Learning Objectives
    </h2>
    <p class="text-blue-800 font-medium mb-3">By the end of this lesson, learners will be able to:</p>
    <ul class="space-y-2">
      \${objectives.map(obj => \`
        <li class="flex items-start gap-3">
          <span class="bullet bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">✓</span>
          <span class="text-blue-900">\${obj}</span>
        </li>
      \`).join('')}
    </ul>
  </section>

  <!-- RESOURCES NEEDED -->
  <section class="resources bg-green-50 p-6 border-b border-green-100">
    <h2 class="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
      <span>📦</span> Resources & Materials
    </h2>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-lg border border-green-200">
        <p class="font-bold text-green-800 mb-2">Teacher Resources:</p>
        <ul class="list-disc list-inside text-green-700 space-y-1">
          \${teacherResources.map(r => \`<li>\${r}</li>\`).join('')}
        </ul>
      </div>
      <div class="bg-white p-4 rounded-lg border border-green-200">
        <p class="font-bold text-green-800 mb-2">Learner Materials:</p>
        <ul class="list-disc list-inside text-green-700 space-y-1">
          \${learnerMaterials.map(r => \`<li>\${r}</li>\`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <!-- LESSON SEQUENCE -->
  <section class="sequence p-8">
    <h2 class="text-3xl font-bold text-gray-900 mb-6">📖 Lesson Sequence</h2>
    
    \${phases.map((phase, idx) => \`
    <div class="phase mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
      <div class="flex items-center gap-4 mb-4">
        <div class="phase-number bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow">
          \${idx + 1}
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900">\${phase.name}</h3>
          <p class="text-gray-600">Duration: \${phase.duration}</p>
        </div>
      </div>
      
      <div class="phase-content space-y-4">
        <div>
          <p class="font-bold text-gray-800 mb-2">Teacher Activities:</p>
          <ul class="list-disc list-inside text-gray-700 space-y-1 ml-4">
            \${phase.teacherActivities.map(a => \`<li>\${a}</li>\`).join('')}
          </ul>
        </div>
        
        <div>
          <p class="font-bold text-gray-800 mb-2">Learner Activities:</p>
          <ul class="list-disc list-inside text-gray-700 space-y-1 ml-4">
            \${phase.learnerActivities.map(a => \`<li>\${a}</li>\`).join('')}
          </ul>
        </div>
        
        \${phase.assessment ? \`
        <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
          <p class="font-bold text-yellow-900">Assessment Opportunities:</p>
          <p class="text-yellow-800 mt-1">\${phase.assessment}</p>
        </div>\` : ''}
      </div>
    </div>
    \`).join('')}
  </section>

  <!-- DIFFERENTIATION -->
  <section class="differentiation bg-purple-50 p-6 border-t border-purple-100">
    <h2 class="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
      <span>🌈</span> Differentiation Strategies
    </h2>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-lg border border-purple-200">
        <p class="font-bold text-purple-800 mb-2">For Struggling Learners:</p>
        <p class="text-purple-700">\${differentiation.struggling}</p>
      </div>
      <div class="bg-white p-4 rounded-lg border border-purple-200">
        <p class="font-bold text-purple-800 mb-2">For On-Level Learners:</p>
        <p class="text-purple-700">\${differentiation.onLevel}</p>
      </div>
      <div class="bg-white p-4 rounded-lg border border-purple-200">
        <p class="font-bold text-purple-800 mb-2">For Advanced Learners:</p>
        <p class="text-purple-700">\${differentiation.advanced}</p>
      </div>
    </div>
  </section>

  <!-- ASSESSMENT & REFLECTION -->
  <section class="assessment bg-orange-50 p-6 border-t border-orange-100">
    <h2 class="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-2">
      <span>📊</span> Assessment & Reflection
    </h2>
    <div class="space-y-4">
      <div>
        <p class="font-bold text-orange-800 mb-2">Formative Assessment:</p>
        <p class="text-orange-700">\${assessment.formative}</p>
      </div>
      <div>
        <p class="font-bold text-orange-800 mb-2">Summative Assessment:</p>
        <p class="text-orange-700">\${assessment.summative}</p>
      </div>
      <div class="bg-white p-4 rounded-lg border border-orange-200 mt-4">
        <p class="font-bold text-orange-800 mb-2">Teacher Reflection Space:</p>
        <div class="min-h-[80px] border-2 border-dashed border-orange-300 rounded bg-orange-50/50"></div>
        <p class="text-xs text-orange-600 mt-2">What worked well? What needs adjustment for next time?</p>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-gray-100 p-6 text-center text-sm text-gray-600">
    <p class="font-medium">EduAI Companion • CAPS-Aligned Lesson Plan</p>
    <p class="text-xs mt-1">Generated: \${new Date().toLocaleDateString('en-ZA')} • eduai-companion.github.io</p>
  </footer>
</article>

Return as JSON: { content: "[HTML above]", imagePrompt: "[optional lesson illustration]", capsAlignment: "[codes]", assessmentRubric: "[rubric HTML]" }
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