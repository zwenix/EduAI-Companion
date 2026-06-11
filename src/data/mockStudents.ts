export const MOCK_STUDENTS = [
  {
    id: 'mock-1',
    name: 'Sibusiso Dube',
    grade: 'Grade 10A',
    email: 'sibu.dube@school.za',
    status: 'Active',
    subjects: [
      { name: 'Mathematics', mark: 82, termHistory: [70, 75, 80, 82], assessments: [ { title: 'Algebra Portfolio', score: 85, type: 'SBA' }, { title: 'Geometry Test', score: 78, type: 'Test' }, { title: 'Class Project', score: 83, type: 'Project' } ] },
      { name: 'Physical Sciences', mark: 59, termHistory: [50, 52, 55, 59], assessments: [ { title: 'Vector lab practical', score: 60, type: 'Practical' }, { title: 'Stoichiometry SBA', score: 54, type: 'SBA' }, { title: 'Energy Quiz', score: 63, type: 'Quiz' } ] },
      { name: 'Life Sciences', mark: 88, termHistory: [80, 82, 85, 88], assessments: [ { title: 'Cellular anatomy', score: 90, type: 'Test' }, { title: 'Genetics SBA', score: 86, type: 'SBA' } ] },
      { name: 'History', mark: 76, termHistory: [72, 73, 75, 76], assessments: [ { title: 'Cold War research', score: 80, type: 'Project' }, { title: 'Source-based test', score: 72, type: 'SBA' } ] }
    ]
  },
  {
    id: 'mock-2',
    name: 'Amara Patel',
    grade: 'Grade 10B',
    email: 'amara.patel@educate.za',
    status: 'Active',
    subjects: [
      { name: 'Mathematics', mark: 64, termHistory: [55, 58, 60, 64], assessments: [ { title: 'Linear functions SBA', score: 68, type: 'SBA' }, { title: 'Trigonometry exam', score: 60, type: 'Test' } ] },
      { name: 'Physical Sciences', mark: 72, termHistory: [68, 70, 71, 72], assessments: [ { title: 'Electromagnetism Lab', score: 75, type: 'Practical' }, { title: 'Chemistry quiz', score: 69, type: 'Quiz' } ] },
      { name: 'Life Sciences', mark: 61, termHistory: [58, 62, 59, 61], assessments: [ { title: 'Plant reproduction SBA', score: 64, type: 'SBA' }, { title: 'Tissue structure test', score: 58, type: 'Test' } ] },
      { name: 'Geography', mark: 85, termHistory: [80, 82, 84, 85], assessments: [ { title: 'Climatology essay', score: 88, type: 'Project' }, { title: 'Mapwork calculations', score: 82, type: 'SBA' } ] }
    ]
  },
  {
    id: 'mock-3',
    name: 'Thabo Naidoo',
    grade: 'Grade 11C',
    email: 'thabo.naidoo@school.org',
    status: 'Active',
    subjects: [
      { name: 'Mathematics', mark: 94, termHistory: [88, 90, 92, 94], assessments: [ { title: 'Calculus SBA', score: 96, type: 'SBA' }, { title: 'Analytical geometry', score: 92, type: 'Test' } ] },
      { name: 'Physical Sciences', mark: 91, termHistory: [85, 88, 89, 91], assessments: [ { title: 'Organic Chemistry Lab', score: 93, type: 'Practical' }, { title: 'Wave properties', score: 89, type: 'Test' } ] },
      { name: 'Geography', mark: 78, termHistory: [74, 75, 77, 78], assessments: [ { title: 'Geomorphology project', score: 80, type: 'Project' }, { title: 'GIS map revision', score: 76, type: 'SBA' } ] }
    ]
  },
  {
    id: 'mock-4',
    name: 'Isabella Meyer',
    grade: 'Grade 9A',
    email: 'isabella.m@academy.za',
    status: 'Active',
    subjects: [
      { name: 'Mathematics', mark: 52, termHistory: [44, 46, 48, 52], assessments: [ { title: 'Fraction algebra', score: 55, type: 'Test' }, { title: 'Geometric basics', score: 49, type: 'SBA' } ] },
      { name: 'History', mark: 68, termHistory: [60, 62, 65, 68], assessments: [ { title: 'Apartheid SBA research', score: 70, type: 'Project' }, { title: 'Map work reading', score: 66, text: 'Test' } ] },
      { name: 'Natural Sciences', mark: 45, termHistory: [40, 42, 44, 45], assessments: [ { title: 'Photosynthesis lab', score: 48, type: 'Practical' }, { title: 'Periodic table test', score: 42, type: 'SBA' } ] }
    ]
  },
  {
    id: 'mock-5',
    name: 'Emily Johnson',
    grade: 'Grade 10A',
    email: 'emily.j@outlook.com',
    status: 'Active',
    subjects: [
      { name: 'Mathematics', mark: 78, termHistory: [72, 74, 76, 78], assessments: [ { title: 'Algebra Equations', score: 81, type: 'SBA' }, { title: 'Euclidean geometry', score: 75, type: 'Test' } ] },
      { name: 'Life Sciences', mark: 80, termHistory: [75, 78, 79, 80], assessments: [ { title: 'DNA structure SBA', score: 83, type: 'SBA' }, { title: 'Plant reproduction lab', score: 77, type: 'Practical' } ] }
    ]
  }
];

export const PRELOADED_PLANS: Record<string, any> = {
  'mock-1': {
    strengths: [
      "Outstanding logical reasoning and high marks in Life Sciences (88%) and Mathematics (82%).",
      "Stellar practical experimentation conceptualization and recall.",
      "Clear upward trajectory in overall term performance."
    ],
    weaknesses: [
      "Subject of concern: Physical Sciences (59%), particularly vector analyses and chemistry stoichiometry chemical formulas.",
      "Vulnerable under intensive pressure on timed question papers."
    ],
    recommendations: [
      "Dedicate targeted daily time for science practice available inside the lessons catalogue.",
      "Consult the AI Tutor to do a detailed, 1-on-1 walkthrough of force vectors using visual tools.",
      "Collaborate with classmates inside Study Groups to review CAPS metrics."
    ],
    actionPlan: [
      { task: "Master Physical Sciences force vectors rules", milestone: "Next 2 weeks", status: "In Progress" },
      { task: "Complete 3 Chemistry quiz practice sheets on AI Tutor", milestone: "Next Month", status: "Pending" },
      { task: "Achieve a minimum of 65% in next Science SBA submission", milestone: "Before major exam", status: "Pending" }
    ]
  },
  'mock-2': {
    strengths: [
      "Superb long-form article writing and history sources criticism in Geography (85%).",
      "Consistent experimental accuracy in Physical Sciences practicals (72%)."
    ],
    weaknesses: [
      "Underperforming in Mathematics (64%) due to foundational gaps in quadratic formulas.",
      "Struggling in Life Sciences cellular structures vocabulary (61%)."
    ],
    recommendations: [
      "Engage on interactive linear algebraic functions inside Content Studio.",
      "Generate 12 Life Sciences cell anatomy flashcards using visual models.",
      "Utilize geographical scale calculators to improve Mapwork processing speeds."
    ],
    actionPlan: [
      { task: "Review quadratic equations and double bracket factorization rules", milestone: "Next 10 days", status: "Completed" },
      { task: "Establish cellular structures dictionary guide", milestone: "Within 3 weeks", status: "In Progress" }
    ]
  },
  'mock-3': {
    strengths: [
      "Excellent logical flow and perfect calculation capabilities across Mathematics (94%) and Science (91%).",
      "Incredible homework precision and zero late-tasks record."
    ],
    weaknesses: [
      "Needs slight speed acceleration in Geography Mapwork GIS calculations (78%)."
    ],
    recommendations: [
      "Provide high-level calculus extension exercises from Content Studio.",
      "Assign Mapwork navigation exercises using scale conversion formulas.",
      "Lead small peer Math circles in Study Groups to reinforce top concepts."
    ],
    actionPlan: [
      { task: "Begin advanced trigonometric and algebraic extensions", milestone: "Ongoing", status: "In Progress" },
      { task: "Complete 2 Geography SBA Mapwork papers", milestone: "Within 2 weeks", status: "In Progress" }
    ]
  }
};
