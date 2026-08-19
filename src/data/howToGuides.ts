import imgContent from '../assets/images/howto_content_studio_1787492001.jpg';
import imgIntervention from '../assets/images/howto_intervention_1787492001.jpg';
import imgCalendar from '../assets/images/howto_calendar_1787492001.jpg';
import imgMessenger from '../assets/images/howto_messenger_1787492001.jpg';
import imgClasses from '../assets/images/howto_classes_1787492001.jpg';
import imgAutograde from '../assets/images/howto_autograde_1787492001.jpg';

export type HowToCategory =
  | 'start'
  | 'create'
  | 'learners'
  | 'plan'
  | 'message'
  | 'assess'
  | 'settings';

export interface HowToStep {
  title: string;
  body: string;
}

export interface HowToGuide {
  id: string;
  title: string;
  subtitle: string;
  category: HowToCategory;
  minutes: string;
  image: string;
  openTab?: string;
  openLabel?: string;
  what: string;
  steps: HowToStep[];
  tip: string;
}

export const HOW_TO_CATEGORIES: { id: HowToCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All guides' },
  { id: 'start', label: 'Getting started' },
  { id: 'create', label: 'Content creation' },
  { id: 'learners', label: 'Learners & SIAS' },
  { id: 'plan', label: 'Calendar & CAPS' },
  { id: 'message', label: 'Messenger' },
  { id: 'assess', label: 'Marking & reports' },
  { id: 'settings', label: 'Settings' },
];

export const HOW_TO_GUIDES: HowToGuide[] = [
  {
    id: 'first-login',
    title: 'Your first 5 minutes',
    subtitle: 'Sign in, pick a role, and find every hub',
    category: 'start',
    minutes: '4 min',
    image: imgClasses,
    what: 'EduAI Companion is organised as hubs in the left sidebar. Teachers land on the Dashboard, then open Toolbox, Classes, Planning, Messenger, or Help.',
    steps: [
      { title: 'Sign in', body: 'Use Google Sign-In or email. After login, choose Teacher, Student, Parent, or Admin. You can switch role later from your profile menu.' },
      { title: 'Read the sidebar', body: 'Dashboard • Teacher’s Toolbox • Curriculum & Planning • Intelligent AI • Classes & Learners • Analytics • Message & Collaborate • Help/Support Desk.' },
      { title: 'Open a hub, then a tool', body: 'Click a sidebar item to see its landing page. Then tap a neon card (for example Content Studio or Classrooms Manager) to open the real tool.' },
      { title: 'Use Home, Back, and Up', body: 'The top bar Home icon returns to Dashboard. Back walks your last screens. Up returns to the hub landing for the current category.' },
    ],
    tip: 'On a phone, tap the menu icon to open the sidebar. The Tools button in the header holds theme, AI engines, and accessibility.',
  },
  {
    id: 'content-studio',
    title: 'Create a CAPS lesson or worksheet',
    subtitle: 'Content Studio — plans, tasks, tests, memos',
    category: 'create',
    minutes: '6 min',
    image: imgContent,
    openTab: 'teaching',
    openLabel: 'Open Content Studio',
    what: 'Content Studio (Teacher’s Toolbox → Content Factory) writes CAPS-aligned lesson plans, worksheets, exams, study guides, memos and rubrics in South African classroom language.',
    steps: [
      { title: 'Open the studio', body: 'Sidebar → Teacher’s Toolbox → Content Studio, or tap New Mission in the top bar. The studio opens as a full overlay.' },
      { title: 'Choose the lab', body: 'Content Studio = lessons & worksheets. Visual Lab = posters. Video Lab = teacher videos. Admin Lab = parent letters. Foundation Phase = Grades R–3.' },
      { title: 'Set Grade, Subject, Type, Topic', body: 'Tap the four setup chips. Pick Grade R–12, a CAPS subject, a type (Lesson Plan, Worksheet, Controlled Test…), then a topic from the list or type your own.' },
      { title: 'Optional extras', body: 'Open Advanced Parameters to set language (isiZulu, Afrikaans, etc.), term, duration, learner count, CAPS pacing, differentiation, SIAS adaptations, and AI illustrations.' },
      { title: 'Generate, then save', body: 'Press GENERATE. Watch the live preview. Use Print, PDF, Edit, Assign to a class, or Archive. Memos and rubrics appear as extra tabs when the type includes assessment.' },
    ],
    tip: 'Keep CAPS Alignment ticked. The quality banner after generation shows how well the document matches CAPS, pedagogy, and South African context.',
  },
  {
    id: 'visual-admin',
    title: 'Posters, letters and foundation sheets',
    subtitle: 'Visual Lab, Admin Lab, Foundation Hub',
    category: 'create',
    minutes: '4 min',
    image: imgContent,
    openTab: 'visual',
    openLabel: 'Open Visual Lab',
    what: 'Use Visual Lab for classroom posters and flashcards, Admin Lab for parent notices and certificates, and Foundation Hub for large-print Grade R–3 work.',
    steps: [
      { title: 'Visual Lab', body: 'Pick a visual type (Educational Poster, Flashcards, Infographic). Set grade, subject, topic, colour scheme and paper size, then GENERATE.' },
      { title: 'Admin Lab', body: 'Choose Letter to Parents, Permission Slip, Notice, or Certificate. Fill school name, date, recipient, venue, teacher and principal so the letter is not generic.' },
      { title: 'Foundation Hub (R–3)', body: 'Open Foundation Phase from the studio tabs. Use large handwriting fonts, tracer lines, and picture-led tasks for young learners.' },
      { title: 'Find it later', body: 'Everything you generate can be archived. Open Teacher’s Toolbox → Content Archive to reprint or re-assign.' },
    ],
    tip: 'Admin letters must use the real school name and date you typed — never leave those fields blank if you need a ready-to-send notice.',
  },
  {
    id: 'intervention',
    title: 'Learner Intervention Hub (SIAS)',
    subtitle: 'Diagnose barriers and build an ILP',
    category: 'learners',
    minutes: '8 min',
    image: imgIntervention,
    openTab: 'learner-intervention',
    openLabel: 'Open Intervention Hub',
    what: 'The Learner Intervention Hub is the SIAS / SBST workspace. It builds an Individualized Learning Plan, remedial worksheet, 6-week timetable and parent guide for one learner.',
    steps: [
      { title: 'Open the hub', body: 'Sidebar → Classes & Learners → Learner Intervention Hub (or the cyan card on the landing page).' },
      { title: 'Guided wizard (5 steps)', body: '1 Context (name, grade, subject, SIAS level, home language, LOLT). 2 Barriers (tags + written description). 3 Records (upload a report or type marks). 4 Goals & accommodations. 5 Review and Launch AI Package.' },
      { title: 'Or Quick-Load', body: 'Use Natural Language Quick-Load. Paste a paragraph such as “Sipho, Grade 4 Maths, 38%, struggles with word problems in English FAL…” and generate the full pack.' },
      { title: 'Library & exercises', body: 'Intervention Library stores every pack. Exercise Generator makes a one-off remedial worksheet. Schedule & SBST Log shows weekly support slots.' },
      { title: 'Print for SBST', body: 'Open a learner card → View Full ILP Package → Print / Export PDF for the file, parents, or the district.' },
    ],
    tip: 'SIAS Level 1 = classroom differentiation. Level 2 = SBST plan. Level 3 = district support. Choose the level that matches the official case.',
  },
  {
    id: 'calendar',
    title: 'How the CAPS calendar works',
    subtitle: 'Weekly Planner — schedule lessons and assessments',
    category: 'plan',
    minutes: '6 min',
    image: imgCalendar,
    openTab: 'weekly-planner',
    openLabel: 'Open Weekly Planner',
    what: 'The Weekly Planner is a live CAPS timetable stored in Firestore. Teachers schedule lessons, assessments, homework, meetings and school events. Students only see events marked for them or for everyone.',
    steps: [
      { title: 'Open the planner', body: 'Sidebar → Curriculum & Planning → Weekly Planner (also listed under Teacher’s Toolbox). You see Monday–Sunday of the current week.' },
      { title: 'Understand event types', body: 'CAPS Lesson (blue), Assessment (amber), Homework (green), Study Group (purple), Meeting (indigo), School Event (rose). Filter chips at the top show one type at a time.' },
      { title: 'Add a lesson', body: 'Click Add Event, or tap an empty day / time cell. Enter title (e.g. “CAPS Maths: Fractions”), date, start and end time, category, and who should see it (All / Teacher only / Student only). Save — it syncs instantly.' },
      { title: 'Two views', body: 'Day Columns = seven day cards. Time Table = hours down the side and days across. Switch with the toggle. Use Current Week / arrows to move weeks.' },
      { title: 'Edit or delete', body: 'Click any event to change times or notes. Delete removes it from the shared calendar. Role filter “My Teacher Events” hides student-only items.' },
    ],
    tip: 'Think of it as the official week grid, not a private diary. Put ATP-paced CAPS lessons and SBA dates here so the class and your own planning stay aligned.',
  },
  {
    id: 'diary',
    title: 'Teacher’s Planner & Diary',
    subtitle: 'Personal notes beside the shared calendar',
    category: 'plan',
    minutes: '3 min',
    image: imgCalendar,
    openTab: 'planner',
    openLabel: 'Open Teacher’s Diary',
    what: 'The Teacher’s Planner & Diary is your private log: reflections, reminders, and class notes. It sits next to the shared Weekly Planner but is not the class timetable.',
    steps: [
      { title: 'Open it', body: 'Curriculum & Planning hub → Teacher’s Planner & Diary (or Alerts & Diary Planner landing).' },
      { title: 'Write the day', body: 'Add what happened, who needs follow-up, and CAPS pages you covered. Use it after a lesson, not instead of the Weekly Planner.' },
      { title: 'Pair with alerts', body: 'ATP deadline warnings and learner-risk flags appear under Alerts & Reminders so the diary and the calendar stay honest.' },
    ],
    tip: 'Shared timetable = Weekly Planner. Private thoughts = Diary. Parents never see the diary.',
  },
  {
    id: 'messenger',
    title: 'Use Messenger with parents and staff',
    subtitle: 'Chats, groups, and presence',
    category: 'message',
    minutes: '5 min',
    image: imgMessenger,
    openTab: 'messenger',
    openLabel: 'Open Messenger',
    what: 'Messenger is the POPIA-minded school chat. You get a General Classroom Hub, study-group channels, collaboration workspaces, and one-to-one chats with enrolled learners, colleagues and parents.',
    steps: [
      { title: 'Open Message & Collaborate', body: 'Sidebar → Message & Collaborate → Communicator Hub Chat (or Chat & Messenger for students).' },
      { title: 'Find people', body: 'Left column has Chats, Collaborations, and Contacts. Search by name. Green / amber / grey dots show online, inactive, or offline.' },
      { title: 'Start a chat', body: 'Tap New Chat, pick a contact, type and Send. Use the paperclip to note an attached file name. The General Classroom Hub is the school-wide channel and cannot be deleted.' },
      { title: 'Groups & projects', body: 'Study groups created in Class Management appear as group threads. Collaborative Workspace projects appear under Collaborations. Collaborate on Lesson opens a shared session for that thread.' },
      { title: 'Parents', body: 'Parents only see their linked children and the teacher. Keep learner marks and SIAS details out of the public hub — use a direct chat instead.' },
    ],
    tip: 'If a name is missing, enrol the learner first under Classes & Learners. Messenger only lists people already in your class or school list.',
  },
  {
    id: 'classes',
    title: 'Register classes and learners',
    subtitle: 'Classrooms Manager — lists, seats, parents',
    category: 'learners',
    minutes: '5 min',
    image: imgClasses,
    openTab: 'class-management',
    openLabel: 'Open Classrooms Manager',
    what: 'Classrooms Manager holds digital registers, class lists, parent contacts and seating. It is the source of names used by Messenger, portfolios and intervention.',
    steps: [
      { title: 'Open the hub', body: 'Sidebar → Classes & Learners → Classrooms Manager.' },
      { title: 'Create a class', body: 'Classes & Subjects → Create Class. Name it (e.g. Grade 5A) and set the subject.' },
      { title: 'Add learners', body: 'Learners Roster → Add Learner (name, email, class) or CSV Bulk Upload with columns Name, Email, Class.' },
      { title: 'Study groups', body: 'Create a group and tick members. Those groups appear in Messenger automatically.' },
      { title: 'Profiles', body: 'Open a learner’s eye icon to add notes and manual marks. Portfolios collect the work and feedback in one place.' },
    ],
    tip: 'Use a school email or a parent email you are allowed to store. EduAI is designed to stay POPIA-safe — do not paste ID numbers into notes.',
  },
  {
    id: 'autograde',
    title: 'Scan and auto-grade worksheets',
    subtitle: 'QR scanner and OCR Autograder',
    category: 'assess',
    minutes: '5 min',
    image: imgAutograde,
    openTab: 'ocr',
    openLabel: 'Open Autograder',
    what: 'Print a worksheet from Content Studio (it can carry a QR). Scan the paper with the camera, or upload a photo. The Autograder reads handwriting against your memo.',
    steps: [
      { title: 'QR path', body: 'Teacher’s Toolbox landing → Launch Camera QR Scanner. Point the phone or laptop camera at the printed QR. Scores can go to the gradebook.' },
      { title: 'OCR path', body: 'Intelligent AI → Autograder (or Toolbox → Auto-Grading OCR). Upload a clear photo of the answer sheet and paste or generate a rubric.' },
      { title: 'Photo tips', body: 'Even light, one page, no blur, handwriting inside the boxes. Crooked or dark photos lower accuracy.' },
      { title: 'Check the memo', body: 'Always review the AI mark before you publish it to a learner portfolio.' },
    ],
    tip: 'Generate the worksheet and the memo together in Content Studio so the Autograder has a matching key.',
  },
  {
    id: 'tutor',
    title: 'AI Tutor Companion',
    subtitle: 'Homework help in SA languages',
    category: 'create',
    minutes: '3 min',
    image: imgContent,
    openTab: 'ai-tutor',
    openLabel: 'Open AI Tutor',
    what: 'The tutor explains CAPS topics, drills skills, and can speak. It uses rands, local names and South African examples.',
    steps: [
      { title: 'Open Intelligent AI', body: 'Sidebar → Intelligent AI → AI Tutor Companion (or Launch AI Tutor on the hub).' },
      { title: 'Ask in context', body: 'Name the grade and subject: “Grade 7 Natural Sciences — explain energy transfer with a kettle example.”' },
      { title: 'Languages & voice', body: 'Ask in isiZulu or Afrikaans. Use voice playback from the tutor panel if sound is not muted in Accessibility.' },
    ],
    tip: 'If an answer looks wrong, switch the text engine under Tools → AI Engines, or report the message.',
  },
  {
    id: 'reports',
    title: 'Reports, portfolios and analytics',
    subtitle: 'Marks, comments, living portfolios',
    category: 'assess',
    minutes: '4 min',
    image: imgIntervention,
    openTab: 'reports',
    openLabel: 'Open Analytics',
    what: 'Analytics & Reports shows class trends. Learner Portfolios collect homework, marks and teacher comments in one living file.',
    steps: [
      { title: 'Analytics', body: 'Sidebar → Analytics & Reports → Progress Reports. Use charts to spot who needs intervention.' },
      { title: 'Portfolios', body: 'Classes & Learners → Learner Profiles & Portfolios, or Analytics → Portfolios. Open a learner to add feedback.' },
      { title: 'Comments', body: 'From Toolbox Admin / Reports you can draft CAPS-style report comments, then copy them into the official school report.' },
    ],
    tip: 'After auto-grading, drop the score into the learner profile so the portfolio stays complete.',
  },
  {
    id: 'settings',
    title: 'Settings, theme and accessibility',
    subtitle: 'Make the app readable and fast',
    category: 'settings',
    minutes: '3 min',
    image: imgClasses,
    openTab: 'settings',
    openLabel: 'Open Settings',
    what: 'Settings hold account, theme, and privacy. The header Tools tray holds AI engines and accessibility so you can change them on any page.',
    steps: [
      { title: 'Theme', body: 'Header sun/moon menu: Light, Dark, or Peach. Night Vision in the sidebar also toggles dark mode.' },
      { title: 'Accessibility', body: 'Header Accessibility button: Dyslexia Font, Magnify Text, High Contrast, Mute Sounds.' },
      { title: 'AI engines', body: 'Tools / sliders: Primary Text Engine (Gemini recommended), OCR engine, image generator, voice engine. Zap runs a speed test and picks the fastest.' },
      { title: 'Offline', body: 'If you see INSTALL OFFLINE APP, add EduAI to the home screen. Students can Sync lessons into the Offline Vault.' },
    ],
    tip: 'POPIA: learner photos and marks stay in your school workspace. Do not export class lists to public chat.',
  },
];

export const HOW_TO_FAQS: { q: string; a: string; tags: string }[] = [
  { q: 'How do I add learners to a class?', a: 'Classes & Learners → Classrooms Manager → Add Learner, or upload a CSV with Name, Email, Class.', tags: 'class register csv' },
  { q: 'Where do generated lesson plans go?', a: 'Use Archive in Content Studio, then open Teacher’s Toolbox → Content Archive to reprint or assign.', tags: 'archive content studio' },
  { q: 'What is SIAS Level 2?', a: 'School-Based Support Team targeted support. Use it in the Intervention Hub when classroom differentiation (Level 1) is not enough.', tags: 'sias sbst intervention' },
  { q: 'How does the calendar differ from the diary?', a: 'Weekly Planner is the shared CAPS timetable (lessons, tests, meetings). Teacher’s Diary is your private notes.', tags: 'calendar planner diary caps' },
  { q: 'Who can see Messenger chats?', a: 'Direct chats are only you and that person. The General Classroom Hub is visible to the school channel. Keep SIAS detail in direct chat.', tags: 'messenger popia' },
  { q: 'Scan & Autograde failed. What now?', a: 'Retake the photo in even light, one page, no blur. Confirm the memo matches the worksheet. Try the QR scanner if the page has a code.', tags: 'ocr scan grade' },
  { q: 'Can I work offline?', a: 'Install the PWA from the sidebar. Students tap Sync to cache lessons in the Offline Vault.', tags: 'offline pwa' },
  { q: 'Is content CAPS aligned?', a: 'Yes. Studio documents target DBE CAPS for Grades R–12. The quality score after generation reports CAPS, pedagogy and SA context.', tags: 'caps dbe' },
  { q: 'The AI answer looks wrong.', a: 'Switch model under Tools → AI Engines, or rephrase with grade + subject. You can also report the tutor message.', tags: 'tutor ai model' },
  { q: 'Which AI models power EduAI?', a: 'Primary text is Gemini. You can switch to NVIDIA Llama 3.3 Nemotron Super 49B or Nemotron-3 Ultra 550B under Tools → AI Engines. The tutor uses South African examples (rands, local names, CAPS topics).', tags: 'gemini nvidia model tutor' },
  { q: 'How is learner data protected?', a: 'We follow POPIA. Do not store ID numbers in notes. Marks and photos stay in your signed-in workspace.', tags: 'popia privacy' },
];
