export const ALL_GRADES = ['R', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
export type Grade = typeof ALL_GRADES[number];

export const educationalData: Record<Grade, Record<string, string[]>> = {
  'R': {
    'Home Language': ['Listening and Speaking', 'Emergent Reading', 'Emergent Writing', 'Phonological Awareness'],
    'Mathematics': ['Numbers, Operations and Relationships', 'Patterns, Functions and Algebra', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Life Skills': ['Beginning Knowledge', 'Personal and Social Well-being', 'Creative Arts', 'Physical Education'],
  },
  '1': {
    'Home Language': ['Phonics', 'Reading', 'Handwriting', 'Listening and Speaking'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Life Skills': ['Beginning Knowledge', 'Personal and Social Well-being', 'Creative Arts', 'Physical Education'],
  },
  '2': {
    'Home Language': ['Phonics', 'Reading', 'Handwriting', 'Listening and Speaking'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Life Skills': ['Beginning Knowledge', 'Personal and Social Well-being', 'Creative Arts', 'Physical Education'],
  },
  '3': {
    'Home Language': ['Phonics', 'Reading', 'Handwriting', 'Listening and Speaking'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Life Skills': ['Beginning Knowledge', 'Personal and Social Well-being', 'Creative Arts', 'Physical Education'],
  },
  '4': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Natural Sciences and Technology': ['Life and Living', 'Matter and Materials', 'Energy and Change', 'Planet Earth and Beyond'],
    'Social Sciences': ['History', 'Geography'],
    'Life Skills': ['Personal and Social Well-being', 'Physical Education', 'Creative Arts'],
  },
  '5': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Natural Sciences and Technology': ['Life and Living', 'Matter and Materials', 'Energy and Change', 'Planet Earth and Beyond'],
    'Social Sciences': ['History', 'Geography'],
    'Life Skills': ['Personal and Social Well-being', 'Physical Education', 'Creative Arts'],
  },
  '6': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Natural Sciences and Technology': ['Life and Living', 'Matter and Materials', 'Energy and Change', 'Planet Earth and Beyond'],
    'Social Sciences': ['History', 'Geography'],
    'Life Skills': ['Personal and Social Well-being', 'Physical Education', 'Creative Arts'],
  },
  '7': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Natural Sciences': ['Life and Living', 'Matter and Materials', 'Energy and Change', 'Planet Earth and Beyond'],
    'Social Sciences': ['History', 'Geography'],
    'Technology': ['Design Process', 'Structures', 'Processing', 'Systems and Control'],
    'Economic and Management Sciences': ['The Economy', 'Financial Literacy', 'Entrepreneurship'],
    'Life Orientation': ['Development of the self in society', 'Health, social and environmental responsibility', 'Constitutional rights and responsibilities', 'Physical Education', 'World of work'],
    'Creative Arts': ['Dance', 'Drama', 'Music', 'Visual Arts'],
  },
  '8': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Natural Sciences': ['Life and Living', 'Matter and Materials', 'Energy and Change', 'Planet Earth and Beyond'],
    'Social Sciences': ['History', 'Geography'],
    'Technology': ['Design Process', 'Structures', 'Processing', 'Systems and Control'],
    'Economic and Management Sciences': ['The Economy', 'Financial Literacy', 'Entrepreneurship'],
    'Life Orientation': ['Development of the self in society', 'Health, social and environmental responsibility', 'Constitutional rights and responsibilities', 'Physical Education', 'World of work'],
    'Creative Arts': ['Dance', 'Drama', 'Music', 'Visual Arts'],
  },
  '9': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Numbers', 'Patterns', 'Space and Shape', 'Measurement', 'Data Handling'],
    'Natural Sciences': ['Life and Living', 'Matter and Materials', 'Energy and Change', 'Planet Earth and Beyond'],
    'Social Sciences': ['History', 'Geography'],
    'Technology': ['Design Process', 'Structures', 'Processing', 'Systems and Control'],
    'Economic and Management Sciences': ['The Economy', 'Financial Literacy', 'Entrepreneurship'],
    'Life Orientation': ['Development of the self in society', 'Health, social and environmental responsibility', 'Constitutional rights and responsibilities', 'Physical Education', 'World of work'],
    'Creative Arts': ['Dance', 'Drama', 'Music', 'Visual Arts'],
  },
  '10': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'First Additional Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Algebra', 'Functions', 'Geometry', 'Trigonometry', 'Statistics', 'Finance', 'Calculus', 'Probability'],
    'Mathematical Literacy': ['Finance', 'Measurement', 'Maps, plans and other representations', 'Data Handling'],
    'Physical Sciences': ['Mechanics', 'Waves, Sound and Light', 'Electricity and Magnetism', 'Matter and Materials', 'Chemical Change', 'Chemical Systems'],
    'Life Sciences': ['Molecules to Organs', 'Life Processes in Plants and Animals', 'Environmental Studies', 'Diversity, Change and Continuity'],
    'Agricultural Sciences': ['Agro-ecology', 'Agro-biology', 'Agro-economy', 'Sustainable Agriculture'],
    'Geography': ['Climatology', 'Geomorphology', 'Population', 'Water Resources'],
    'History': ['The world around 1600', 'Expansion and conquest', 'French Revolution', 'Industrial Revolution', 'Transformations in southern Africa'],
    'Accounting': ['Financial Accounting', 'Managerial Accounting', 'Managing Resources'],
    'Business Studies': ['Business Environments', 'Business Ventures', 'Business Roles', 'Business Operations'],
    'Economics': ['Macroeconomics', 'Microeconomics', 'Economic Pursuits', 'Contemporary Economic Issues'],
    'Consumer Studies': ['The Consumer', 'Food and Nutrition', 'Clothing', 'Housing and Interior', 'Entrepreneurship'],
    'Hospitality Studies': ['Hospitality Establishment', 'Health and Safety', 'Food Production', 'Service', 'Hygiene'],
    'Tourism': ['Tourism Sectors', 'Map Work', 'Foreign Exchange', 'Attractions', 'Culture and Heritage'],
    'CAT (Computer Applications Tech)': ['Solution Development', 'Systems Technologies', 'Network Technologies', 'Internet Technologies', 'Information Management', 'Social Implications'],
    'IT (Information Technology)': ['Solution Development', 'Systems Technologies', 'Network Technologies', 'Internet Technologies', 'Data and Information Management', 'Social Implications'],
    'Engineering Graphics and Design (EGD)': ['Analytical', 'Visualization', 'Freehand', 'Instrument Drawing', 'Civil Drawing', 'Mechanical Drawing', 'Electrical Drawing'],
    'Visual Arts': ['Personal Expression', 'Visual Culture Studies', 'Artmaking'],
    'Dramatic Arts': ['Personal Resource Development', 'Acting and Performance', 'Vocal and Physical Development'],
    'Music': ['Music Theory', 'Composition', 'Performance', 'Critical Listening'],
    'Dance Studies': ['Dance History', 'Anatomy and Health Care', 'Composition', 'Dance Performance'],
    'Life Orientation': ['Development of the self in society', 'Health, social and environmental responsibility', 'Constitutional rights and responsibilities', 'Physical Education', 'World of work'],
  },
  '11': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'First Additional Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Algebra', 'Functions', 'Geometry', 'Trigonometry', 'Statistics', 'Finance', 'Calculus', 'Probability'],
    'Mathematical Literacy': ['Finance', 'Measurement', 'Maps, plans and other representations', 'Data Handling'],
    'Physical Sciences': ['Mechanics', 'Waves, Sound and Light', 'Electricity and Magnetism', 'Matter and Materials', 'Chemical Change', 'Chemical Systems'],
    'Life Sciences': ['Molecules to Organs', 'Life Processes in Plants and Animals', 'Environmental Studies', 'Diversity, Change and Continuity'],
    'Agricultural Sciences': ['Agro-ecology', 'Agro-biology', 'Agro-economy', 'Sustainable Agriculture'],
    'Geography': ['Climatology', 'Geomorphology', 'Development Geography', 'Resources and Sustainability'],
    'History': ['Communism in Russia', 'Capitalism in USA', 'Ideas of Race in the late 19th and 20th Centuries', 'Nationalisms in South Africa, Middle East and Africa', 'Apartheid South Africa'],
    'Accounting': ['Financial Accounting', 'Managerial Accounting', 'Managing Resources'],
    'Business Studies': ['Business Environments', 'Business Ventures', 'Business Roles', 'Business Operations'],
    'Economics': ['Macroeconomics', 'Microeconomics', 'Economic Pursuits', 'Contemporary Economic Issues'],
    'Consumer Studies': ['The Consumer', 'Food and Nutrition', 'Clothing', 'Housing and Interior', 'Entrepreneurship'],
    'Hospitality Studies': ['Hospitality Establishment', 'Health and Safety', 'Food Production', 'Service', 'Hygiene'],
    'Tourism': ['Tourism Sectors', 'Map Work', 'Foreign Exchange', 'Attractions', 'Culture and Heritage'],
    'CAT (Computer Applications Tech)': ['Solution Development', 'Systems Technologies', 'Network Technologies', 'Internet Technologies', 'Information Management', 'Social Implications'],
    'IT (Information Technology)': ['Solution Development', 'Systems Technologies', 'Network Technologies', 'Internet Technologies', 'Data and Information Management', 'Social Implications'],
    'Engineering Graphics and Design (EGD)': ['Analytical', 'Visualization', 'Freehand', 'Instrument Drawing', 'Civil Drawing', 'Mechanical Drawing', 'Electrical Drawing'],
    'Life Orientation': ['Development of the self in society', 'Health, social and environmental responsibility', 'Constitutional rights and responsibilities', 'Physical Education', 'World of work'],
  },
  '12': {
    'Home Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'First Additional Language': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures'],
    'Mathematics': ['Algebra', 'Functions', 'Geometry', 'Trigonometry', 'Statistics', 'Finance', 'Calculus', 'Probability'],
    'Mathematical Literacy': ['Finance', 'Measurement', 'Maps, plans and other representations', 'Data Handling'],
    'Physical Sciences': ['Mechanics', 'Waves, Sound and Light', 'Electricity and Magnetism', 'Matter and Materials', 'Chemical Change', 'Chemical Systems'],
    'Life Sciences': ['DNA, RNA and Protein Synthesis', 'Meiosis', 'Reproduction', 'Genetics', 'Responding to the Environment', 'Human Endocrine System', 'Evolution'],
    'Agricultural Sciences': ['Animal nutrition', 'Animal production', 'Animal health and diseases', 'Animal reproduction'],
    'Geography': ['Climatology', 'Geomorphology', 'Rural Settlement', 'Urban Settlement', 'Economic Geography of South Africa'],
    'History': ['The Cold War', 'Independent Africa', 'Civil Society Protests', 'Civil Resistance in South Africa', 'The Coming of Democracy to South Africa', 'The End of the Cold War and a New World Order'],
    'Accounting': ['Financial Accounting', 'Managerial Accounting', 'Managing Resources'],
    'Business Studies': ['Business Environments', 'Business Ventures', 'Business Roles', 'Business Operations'],
    'Economics': ['Macroeconomics', 'Microeconomics', 'Economic Pursuits', 'Contemporary Economic Issues'],
    'Consumer Studies': ['The Consumer', 'Food and Nutrition', 'Clothing', 'Housing and Interior', 'Entrepreneurship'],
    'Hospitality Studies': ['Hospitality Establishment', 'Health and Safety', 'Food Production', 'Service', 'Hygiene'],
    'Tourism': ['Tourism Sectors', 'Map Work', 'Foreign Exchange', 'Attractions', 'Culture and Heritage'],
    'CAT (Computer Applications Tech)': ['Solution Development', 'Systems Technologies', 'Network Technologies', 'Internet Technologies', 'Information Management', 'Social Implications'],
    'IT (Information Technology)': ['Solution Development', 'Systems Technologies', 'Network Technologies', 'Internet Technologies', 'Data and Information Management', 'Social Implications'],
    'Engineering Graphics and Design (EGD)': ['Analytical', 'Visualization', 'Freehand', 'Instrument Drawing', 'Civil Drawing', 'Mechanical Drawing', 'Electrical Drawing'],
    'Life Orientation': ['Development of the self in society', 'Health, social and environmental responsibility', 'Constitutional rights and responsibilities', 'Physical Education', 'World of work'],
  },
};

export function getSubjects(grade: Grade): string[] {
  return Object.keys(educationalData[grade] || {});
}

export function getTopics(grade: Grade, subject: string): string[] {
  return educationalData[grade]?.[subject] || [];
}

// New Lesson Studio Data
export const capsTopics = {
  'Foundation Phase': {
    'Home Language': [
      'Listening and Speaking: Sounds and Phonemes',
      'Reading and Phonics: Letter-Sound Relationships',
      'Handwriting: Forming Letters',
      'Writing: Simple Sentences',
    ],
    'Mathematics': [
      'Numbers, Operations and Relationships: Counting',
      'Patterns, Functions and Algebra: Geometric Patterns',
      'Space and Shape (Geometry): 2D Shapes',
      'Measurement: Time (Days of the Week)',
      'Data Handling: Collecting and Sorting Objects',
    ],
    'Life Skills': [
      'Beginning Knowledge and Personal and Social Well-being: About Me',
      'Creative Arts: Drawing and Painting',
      'Physical Education: Gross Motor Skills',
    ],
  },
  'Intermediate Phase': {
    'Social Sciences': [
        'History: Map Skills - Africa and the World',
        'Geography: Physical Features of South Africa',
        'History: Ancient Civilizations (e.g., Egypt)',
    ],
    'Natural Sciences and Technology': [
        'Life and Living: Plants and Animals on Earth',
        'Matter and Materials: Properties of Materials',
        'Energy and Change: Energy for Life',
        'Planet Earth and Beyond: The Solar System',
    ],
    'Mathematics': [
        'Numbers, Operations and Relationships: Common Fractions',
        'Patterns, Functions and Algebra: Investigating Number Patterns',
        'Space and Shape (Geometry): 3D Objects',
        'Measurement: Length and Perimeter',
        'Data Handling: Interpreting Bar Graphs',
    ],
  },
  'Senior Phase': {
    'Economic and Management Sciences': [
        'The Economy: Needs and Wants',
        'Financial Literacy: Budgets and Saving',
        'Entrepreneurship: Starting a Business',
    ],
    'Technology': [
        'Structures: Forces and Materials',
        'Mechanical Systems and Control: Levers and Gears',
        'Electrical Systems and Control: Circuits',
    ],
    'Creative Arts': [
        'Visual Arts: The Elements of Art (Line, Shape, Colour)',
        'Drama: Improvisation and Characterisation',
        'Music: Rhythm and Melody',
        'Dance: Exploring Different Dance Styles',
    ],
  },
  'FET Phase': {
    'Physical Sciences': [
        'Mechanics: Vectors, Scalars and Motion',
        'Waves, Sound and Light: Geometrical Optics',
        'Chemical Change: Stoichiometry',
        'Matter and Materials: The Periodic Table',
    ],
    'Life Sciences': [
        'The Chemistry of Life: Organic Molecules',
        'Cells: The Basic Units of Life',
        'Genetics and Inheritance: DNA and RNA',
        'Diversity, Change and Continuity: Biodiversity and Classification',
    ],
    'History': [
      'The Cold War: Origins and Global Impact',
      'Independent Africa: Comparative Case Studies',
      'Civil Society Protests: The US Civil Rights Movement',
      'The End of the Cold War and a New World Order',
    ],
  },
};

export const lessonTypes = [
    'Direct Instruction', 'Inquiry-Based Learning', 'Cooperative Learning',
    'Project-Based Learning', 'Game-Based Learning (Gamification)', 'Flipped Classroom'
];

export const subjectsByGrade = {
    'Foundation Phase': ['Home Language', 'Mathematics', 'Life Skills'],
    'Intermediate Phase': ['Social Sciences', 'Natural Sciences and Technology', 'Mathematics'],
    'Senior Phase': ['Economic and Management Sciences', 'Technology', 'Creative Arts'],
    'FET Phase': ['Physical Sciences', 'Life Sciences', 'History'],
};

export const grades = ['Foundation Phase', 'Intermediate Phase', 'Senior Phase', 'FET Phase'];
