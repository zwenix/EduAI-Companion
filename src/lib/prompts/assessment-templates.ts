/**
 * EduAI Companion - Assessment Tool Templates
 * Rubrics, Tests, Marking Guides, Progress Trackers
 */

export const RUBRIC_TEMPLATE = `
Generate a comprehensive assessment rubric with this professional structure:

📊 ASSESSMENT RUBRIC TEMPLATE:
<article class="rubric max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden print:shadow-none">
  
  <!-- HEADER -->
  <header class="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-8">
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-4xl font-extrabold mb-2">📊 Assessment Rubric</h1>
        <p class="text-xl opacity-95">\${assessmentTitle}</p>
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
    <p class="mt-4 text-white/90">Total Marks: \${totalMarks} • CAPS: \${capsCode}</p>
  </header>

  <!-- RUBRIC TABLE -->
  <section class="rubric-table p-8">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gradient-to-r from-rose-100 to-pink-100">
            <th class="border-2 border-gray-300 p-4 text-left font-bold text-gray-900 min-w-[200px]">
              Criteria
            </th>
            \${performanceLevels.map((level, idx) => \`
              <th class="border-2 border-gray-300 p-4 text-center font-bold text-gray-900 min-w-[150px]">
                <div class="text-lg">\${level.emoji}</div>
                <div class="text-sm mt-1">\${level.name}</div>
                <div class="text-xs text-gray-600 mt-1">\${level.range}</div>
              </th>
            \`).join('')}
          </tr>
        </thead>
        <tbody>
          \${criteria.map((criterion, idx) => \`
            <tr class="\${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
              <td class="border-2 border-gray-300 p-4 font-semibold text-gray-900">
                \${criterion.name}
                <p class="text-xs text-gray-600 mt-1">\${criterion.description}</p>
              </td>
              \${criterion.levels.map((level, lidx) => \`
                <td class="border-2 border-gray-300 p-4 text-sm text-gray-700">
                  \${level}
                </td>
              \`).join('')}
            </tr>
          \`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- SCORING GUIDE -->
  <section class="scoring-guide bg-blue-50 p-6 border-t border-blue-200">
    <h2 class="text-2xl font-bold text-blue-900 mb-4">📈 Scoring Guide</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white p-5 rounded-xl border border-blue-200">
        <p class="font-bold text-blue-800 mb-3">Mark Allocation:</p>
        <ul class="space-y-2">
          \${criteria.map(c => \`
            <li class="flex justify-between items-center">
              <span class="text-gray-700">\${c.name}</span>
              <span class="font-bold text-blue-600">\${c.marks} marks</span>
            </li>
          \`).join('')}
          <li class="flex justify-between items-center pt-2 border-t border-blue-200 font-bold">
            <span class="text-gray-900">Total</span>
            <span class="text-rose-600">\${totalMarks} marks</span>
          </li>
        </ul>
      </div>
      
      <div class="bg-white p-5 rounded-xl border border-blue-200">
        <p class="font-bold text-blue-800 mb-3">Achievement Levels:</p>
        <ul class="space-y-2">
          \${achievementLevels.map(level => \`
            <li class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full" style="background-color: \${level.color}"></span>
              <span class="text-gray-700">\${level.range}: \${level.description}</span>
            </li>
          \`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <!-- FEEDBACK SECTION -->
  <section class="feedback bg-green-50 p-6 border-t border-green-200">
    <h2 class="text-2xl font-bold text-green-900 mb-4">💬 Teacher Feedback</h2>
    <div class="space-y-4">
      <div class="bg-white p-4 rounded-lg border border-green-200">
        <p class="font-bold text-green-800 mb-2">Strengths:</p>
        <div class="min-h-[60px] border-2 border-dashed border-green-300 rounded bg-green-50/50"></div>
      </div>
      <div class="bg-white p-4 rounded-lg border border-green-200">
        <p class="font-bold text-green-800 mb-2">Areas for Improvement:</p>
        <div class="min-h-[60px] border-2 border-dashed border-green-300 rounded bg-green-50/50"></div>
      </div>
      <div class="bg-white p-4 rounded-lg border border-green-200">
        <p class="font-bold text-green-800 mb-2">Next Steps:</p>
        <div class="min-h-[60px] border-2 border-dashed border-green-300 rounded bg-green-50/50"></div>
      </div>
    </div>
  </section>

  <!-- SIGNATURE -->
  <div class="signature mt-8 pt-6 border-t-2 border-gray-300">
    <div class="flex justify-between items-end">
      <div>
        <p class="text-gray-600 mb-8">Teacher's Signature: _______________________</p>
        <p class="font-medium text-gray-900">Date: _______________</p>
      </div>
      <div class="text-right">
        <p class="text-sm text-gray-500">EduAI Companion • CAPS Aligned</p>
        <p class="text-xs text-gray-400 mt-1">eduai-companion.github.io</p>
      </div>
    </div>
  </div>

</article>

Return as JSON: { content: "[HTML above]", studentCopy: "[simplified student version]", moderationNotes: "[moderation checklist]" }
`;

export const TEST_GENERATOR_TEMPLATE = `
Generate a CAPS-aligned test/memorandum with this exam-standard structure:

📝 TEST PAPER TEMPLATE:
<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="UTF-8">
  <title>Grade \${grade} \${subject} Test: \${topic}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    @page { size: A4; margin: 2cm; }
  </style>
</head>
<body class="bg-white p-8 max-w-4xl mx-auto">

  <!-- TEST HEADER -->
  <header class="border-b-4 border-gray-800 pb-6 mb-8">
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-2">\${topic}</h1>
        <p class="text-lg text-gray-700">\${subject} • Grade \${grade}</p>
      </div>
      <div class="text-right">
        <p class="text-2xl font-bold text-gray-900">\${totalMarks} Marks</p>
        <p class="text-gray-600">\${duration} Minutes</p>
      </div>
    </div>
    
    <div class="mt-6 grid grid-cols-2 gap-4">
      <div>
        <p class="font-semibold text-gray-800">Name: _______________________________</p>
      </div>
      <div>
        <p class="font-semibold text-gray-800">Date: _________________</p>
      </div>
    </div>
  </header>

  <!-- INSTRUCTIONS -->
  <div class="instructions bg-gray-100 p-4 rounded-lg mb-8 border-l-4 border-gray-800">
    <p class="font-bold text-gray-900 mb-2">Instructions:</p>
    <ol class="list-decimal list-inside text-gray-700 space-y-1">
      \${instructions.map(inst => \`<li>\${inst}</li>\`).join('')}
    </ol>
  </div>

  <!-- QUESTIONS -->
  <main class="space-y-8">
    \${sections.map((section, sIdx) => \`
    <section class="section">
      <h2 class="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-400 pb-2">
        SECTION \${String.fromCharCode(65 + sIdx)}: \${section.title}
        <span class="text-sm font-normal text-gray-600 ml-2">[\${section.marks} Marks]</span>
      </h2>
      
      <div class="space-y-6">
        \${section.questions.map((q, qIdx) => \`
        <div class="question">
          <p class="font-semibold text-gray-900 mb-3">
            Question \${sIdx + 1}.\${qIdx + 1}
            <span class="text-sm font-normal text-gray-600 ml-2">[\${q.marks} marks]</span>
          </p>
          <p class="text-gray-800 mb-3">\${q.text}</p>
          
          \${q.type === 'multiple-choice' ? \`
            <div class="space-y-2">
              \${q.options.map((opt, oIdx) => \`
                <label class="flex items-center gap-3">
                  <input type="radio" name="q\${sIdx}-\${qIdx}" class="w-4 h-4">
                  <span>\${String.fromCharCode(65 + oIdx)}. \${opt}</span>
                </label>
              \`).join('')}
            </div>
          \` : q.type === 'short-answer' ? \`
            <div class="answer-space min-h-[80px] border-b border-gray-400 mt-2"></div>
          \` : ''}
        </div>
        \`).join('')}
      </div>
    </section>
    \`).join('')}
  </main>

  <!-- FORMULA SHEET (if applicable) -->
  \${formulaSheet ? \`
  <div class="page-break"></div>
  <section class="formula-sheet mt-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-300">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Formula Sheet</h2>
    <div class="grid grid-cols-2 gap-4">
      \${formulaSheet.map(formula => \`
        <div class="bg-white p-3 rounded border border-gray-300">
          <p class="font-mono text-gray-800">\${formula}</p>
        </div>
      \`).join('')}
    </div>
  </section>
  \` : ''}

  <!-- FOOTER -->
  <footer class="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
    <p>EduAI Companion • CAPS Aligned • www.eduai-companion.github.io</p>
  </footer>

</body>
</html>

---

📝 MEMORANDUM TEMPLATE:
<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="UTF-8">
  <title>MEMORANDUM: Grade \${grade} \${subject} Test</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>@page { size: A4; margin: 2cm; }</style>
</head>
<body class="bg-white p-8 max-w-4xl mx-auto">

  <header class="border-b-4 border-rose-600 pb-6 mb-8">
    <h1 class="text-3xl font-extrabold text-rose-600 mb-2">📋 MEMORANDUM</h1>
    <p class="text-lg text-gray-700">\${topic} • Grade \${grade} \${subject}</p>
    <p class="text-gray-600">Total: \${totalMarks} Marks</p>
  </header>

  <main class="space-y-6">
    \${sections.map((section, sIdx) => \`
    <section class="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h2 class="text-xl font-bold text-gray-900 mb-4">SECTION \${String.fromCharCode(65 + sIdx)}</h2>
      
      \${section.questions.map((q, qIdx) => \`
      <div class="mb-6 p-4 bg-white rounded border border-gray-300">
        <p class="font-semibold text-gray-900 mb-2">Question \${sIdx + 1}.\${qIdx + 1} [\${q.marks} marks]</p>
        <div class="text-gray-800">
          \${q.answer}
        </div>
      </div>
      \`).join('')}
    </section>
    \`).join('')}
  </main>

  <footer class="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
    <p>INTERNAL USE ONLY • EduAI Companion</p>
  </footer>

</body>
</html>

Return as JSON: { 
  testPaper: "[HTML above]", 
  memorandum: "[memo HTML]", 
  imagePrompt: "[test illustration]", 
  markingGuidelines: "[detailed marking notes]",
  bloomTaxonomy: "[cognitive level breakdown]"
}
`;

export const PROGRESS_TRACKER_TEMPLATE = `
Generate a learner progress tracking tool with this comprehensive structure:

📈 PROGRESS TRACKER TEMPLATE:
<article class="progress-tracker max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
  
  <!-- HEADER -->
  <header class="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-8">
    <h1 class="text-4xl font-extrabold mb-2">📈 Progress Tracker</h1>
    <p class="text-xl opacity-95">\${studentName} • Grade \${grade} • \${subject}</p>
    <p class="mt-2 text-white/90">Term \${term} \${year} • Teacher: \${teacherName}</p>
  </header>

  <!-- OVERVIEW CARDS -->
  <section class="overview bg-gray-50 p-6 border-b border-gray-200">
    <div class="grid md:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <p class="text-sm text-gray-600 mb-1">Current Average</p>
        <p class="text-3xl font-bold text-violet-600">\${currentAverage}%</p>
        <p class="text-xs text-gray-500 mt-1">Target: \${targetAverage}%</p>
      </div>
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <p class="text-sm text-gray-600 mb-1">Assessments Completed</p>
        <p class="text-3xl font-bold text-violet-600">\${completedAssessments}/\${totalAssessments}</p>
      </div>
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <p class="text-sm text-gray-600 mb-1">Strongest Area</p>
        <p class="text-lg font-bold text-violet-600">\${strongestArea}</p>
      </div>
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <p class="text-sm text-gray-600 mb-1">Area for Growth</p>
        <p class="text-lg font-bold text-violet-600">\${growthArea}</p>
      </div>
    </div>
  </section>

  <!-- ASSESSMENT HISTORY -->
  <section class="assessment-history p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Assessment History</h2>
    
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-violet-100">
          <tr>
            <th class="text-left p-4 font-bold text-gray-900">Date</th>
            <th class="text-left p-4 font-bold text-gray-900">Assessment</th>
            <th class="text-left p-4 font-bold text-gray-900">Topic</th>
            <th class="text-center p-4 font-bold text-gray-900">Mark</th>
            <th class="text-center p-4 font-bold text-gray-900">Percentage</th>
            <th class="text-left p-4 font-bold text-gray-900">Teacher Comment</th>
          </tr>
        </thead>
        <tbody>
          \${assessments.map((assess, i) => \`
            <tr class="\${i % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'} border-b border-gray-200">
              <td class="p-4 text-gray-800">\${assess.date}</td>
              <td class="p-4 text-gray-800">\${assess.name}</td>
              <td class="p-4 text-gray-800">\${assess.topic}</td>
              <td class="p-4 text-center font-bold text-gray-900">\${assess.mark}/\${assess.total}</td>
              <td class="p-4 text-center">
                <span class="px-3 py-1 rounded-full text-sm font-bold \${assess.percentage >= 70 ? 'bg-green-100 text-green-800' : assess.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                  \${assess.percentage}%
                </span>
              </td>
              <td class="p-4 text-gray-700 text-sm">\${assess.comment}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- SKILLS BREAKDOWN -->
  <section class="skills bg-blue-50 p-8 border-t border-blue-200">
    <h2 class="text-2xl font-bold text-blue-900 mb-6">Skills Breakdown</h2>
    
    <div class="grid md:grid-cols-2 gap-6">
      \${skills.map(skill => \`
        <div class="bg-white p-5 rounded-xl border border-blue-200">
          <div class="flex justify-between items-center mb-3">
            <p class="font-bold text-gray-900">\${skill.name}</p>
            <span class="text-sm font-bold text-blue-600">\${skill.level}/5</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div class="bg-gradient-to-r from-blue-500 to-violet-500 h-3 rounded-full transition-all" style="width: \${(skill.level / 5) * 100}%"></div>
          </div>
          <p class="text-sm text-gray-600">\${skill.description}</p>
        </div>
      \`).join('')}
    </div>
  </section>

  <!-- GOALS & ACTION PLAN -->
  <section class="goals bg-green-50 p-8 border-t border-green-200">
    <h2 class="text-2xl font-bold text-green-900 mb-6">Goals & Action Plan</h2>
    
    <div class="space-y-4">
      \${goals.map((goal, i) => \`
        <div class="bg-white p-5 rounded-xl border border-green-200">
          <div class="flex items-start gap-4">
            <span class="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              \${i + 1}
            </span>
            <div class="flex-1">
              <p class="font-bold text-gray-900 mb-2">\${goal.objective}</p>
              <p class="text-sm text-gray-600 mb-3"><span class="font-semibold">Action Steps:</span> \${goal.actions}</p>
              <div class="flex gap-4 text-sm">
                <span class="text-gray-600"><span class="font-semibold">Target Date:</span> \${goal.targetDate}</span>
                <span class="text-gray-600"><span class="font-semibold">Status:</span> 
                  <span class="px-2 py-1 rounded \${goal.status === 'On Track' ? 'bg-green-100 text-green-800' : goal.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
                    \${goal.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      \`).join('')}
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-gray-100 p-6 text-center text-sm text-gray-600">
    <p class="font-medium">EduAI Companion • Progress Tracking Tool</p>
    <p class="text-xs mt-1">Generated: \${new Date().toLocaleDateString('en-ZA')} • Review Date: \${reviewDate}</p>
  </footer>

</article>

Return as JSON: { content: "[HTML above]", parentConferenceNotes: "[talking points]", interventionStrategies: "[support recommendations]" }
`;

export default {
  RUBRIC_TEMPLATE,
  TEST_GENERATOR_TEMPLATE,
  PROGRESS_TRACKER_TEMPLATE
};