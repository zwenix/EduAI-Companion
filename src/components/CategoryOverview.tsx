import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  GraduationCap,
  FlaskConical,
  FileText,
  Palette,
  Video,
  Archive,
  Search,
  User,
  QrCode,
  Camera,
  Zap,
  CheckCircle2,
  FileCheck,
  Brain,
  ScanLine,
  Calendar,
  Bell,
  Layers,
  TrendingUp,
  Award,
  Trophy,
  FileSpreadsheet,
  UserCheck,
  FolderKanban,
  BarChart3,
  PieChart,
  Medal
} from 'lucide-react';
import ContentSlideshow, { INTELLIGENT_AI_SLIDES } from './ContentSlideshow';
import WorksheetQRScannerModal from './WorksheetQRScannerModal';

// Generated background images for interactive showcases
import bgContentStudio from '../assets/images/content_studio_bg_1785652440860.jpg';
import bgFoundationHub from '../assets/images/foundation_hub_bg_1785652450982.jpg';
import bgPracticeZone  from '../assets/images/practice_zone_bg_1785652462543.jpg';
import bgOcrGrading    from '../assets/images/ocr_grading_bg_1785652474254.jpg';
import bgAdminLab      from '../assets/images/admin_lab_bg_1785652489555.jpg';
import bgAnalytics     from '../assets/images/analytics_bg_1785652499527.jpg';
import bgVisualPosters from '../assets/images/visual_posters_bg_1785652509797.jpg';
import bgVideoAvatars  from '../assets/images/video_avatars_bg_1785652522004.jpg';
import bgVaultLibrary  from '../assets/images/vault_library_bg_1785652535683.jpg';
import imgAssessment   from '../assets/images/assessment_screenshot_1784286266626.jpg';
import imgGames        from '../assets/images/games_overlay_1785535062476.jpg';
import imgPersonalized from '../assets/images/personalized_overlay_1785535051900.jpg';
const overlayTeachersToolbox = 'https://i.ibb.co/RGmCJ3jh/teachers-toolbox.png';
const overlayIntelligentAi = 'https://i.ibb.co/22bDqWm/intelligent-ai.png';
const overlayMessageCollaborate = 'https://i.ibb.co/SXyQK2df/message-collaborate.png';

interface SubTabItem {
  id: string;
  label: string;
  icon: any;
  desc?: string;
}

interface InteractiveShowcaseSlide {
  image: string;
  title: string;
  description: string;
}

interface InteractiveShowcaseCardProps {
  slides: InteractiveShowcaseSlide[];
  borderColorClass: string;
  shadowColorClass: string;
  hoverBorderColorClass: string;
  hoverShadowColorClass: string;
  glowColorClass: string;
  onClick: () => void;
  children?: React.ReactNode;
}

function InteractiveShowcaseCard({
  slides,
  borderColorClass,
  shadowColorClass,
  hoverBorderColorClass,
  hoverShadowColorClass,
  glowColorClass,
  onClick,
  children
}: InteractiveShowcaseCardProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[slideIndex];

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`rounded-[32px] border-2 bg-slate-900/85 p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:brightness-110 transition-all duration-300 cursor-pointer relative overflow-hidden h-full min-h-[340px] select-none ${borderColorClass} ${shadowColorClass} ${hoverBorderColorClass} ${hoverShadowColorClass}`}
    >
      {/* Background Slideshow using Framer Motion (matching the main ContentSlideshow) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slideIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <motion.img
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: 'easeOut' }}
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-cover opacity-[0.40] filter brightness-95 group-hover:scale-105 transition-transform duration-[6000ms]"
            referrerPolicy="no-referrer"
          />
          {/* Gradient Overlays for optimal readability matching ContentSlideshow */}
          <div className="absolute inset-0 bg-slate-900/40 pointer-events-none z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/50 to-transparent pointer-events-none z-0" />
        </motion.div>
      </AnimatePresence>

      {/* Foreground Interactive Layout */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}

const CAPS_TOOLS_SLIDES = [
  { image: bgContentStudio, title: 'Content Studio', description: 'Create rich CAPS lesson plans and curriculum booklets.' },
  { image: bgFoundationHub, title: 'Foundation Hub (R-3)', description: 'Primary grade templates, trace-and-copy tracing sheets.' }
];

const QUIZ_WIZARD_SLIDES = [
  { image: bgPracticeZone, title: 'Practice Zone', description: 'Engage students with diagnostic quizzes and practice drills.' },
  { image: bgOcrGrading, title: 'Auto-Grading OCR', description: 'Scan physical printed answer sheets using camera in seconds.' }
];

const ADMIN_REPORTS_SLIDES = [
  { image: bgAdminLab, title: 'Admin Lab & Notices', description: 'Draft newsletter letters to parents and administrative announcements.' },
  { image: bgAnalytics, title: 'Analytics & Comments', description: 'Generate individual learner comments and track key performance metrics.' }
];

const MEDIA_TOOLS_SLIDES = [
  { image: bgVisualPosters, title: 'Visual Lab Posters', description: 'Design educational infographics and vivid classroom science posters.' },
  { image: bgVideoAvatars, title: 'Video Avatars', description: 'Produce captivating teacher video guides using digital presentation avatars.' },
  { image: bgVaultLibrary, title: 'Vault & Library', description: 'Securely archive all generated templates, rubrics, and study guides.' }
];

/* ---------------------------------------------------------------------------
   REPORTS & PORTFOLIOS HUB — hero slideshow + per-module showcase slides
--------------------------------------------------------------------------- */
const REPORTS_HERO_SLIDES = [
  {
    title: 'Progress Analytics Dashboard',
    tag: 'PERFORMANCE',
    badgeColor: 'from-cyan-500 to-blue-600',
    description: 'Visualize continuous class performance metrics with mark distribution charts, term trends, and achievement baselines for targeted interventions.',
    image: bgAnalytics,
  },
  {
    title: 'Assessment Insights & Mark Book',
    tag: 'SBA & EXAMS',
    badgeColor: 'from-emerald-500 to-teal-600',
    description: 'Drill into assessment scores, SBA portfolios, formal tests, and answer memorandums to spot strengths and support gaps across every learner.',
    image: imgAssessment,
  },
  {
    title: 'Learner Personal Portfolios',
    tag: 'SHOWCASE WORK',
    badgeColor: 'from-amber-500 to-orange-600',
    description: 'Browse continuous learner homework submissions, academic portfolios, custom marks, and personalized teacher feedback in one living portfolio.',
    image: imgPersonalized,
  },
  {
    title: 'CAPS & Gamification Hub',
    tag: 'REWARDS',
    badgeColor: 'from-purple-500 to-indigo-600',
    description: 'Map CAPS outcomes to engaging gamified quests and reward systems that keep learners motivated while you track curriculum mastery.',
    image: imgGames,
  },
];

const REPORTS_CARD_SLIDES = [
  { image: bgAnalytics, title: 'Progress Analytics', description: 'Continuous performance tracking, charts and baselines.' },
  { image: imgAssessment, title: 'Assessments', description: 'Term trends, mark distribution and SBA insights.' },
];

const PORTFOLIOS_CARD_SLIDES = [
  { image: imgPersonalized, title: 'Learner Portfolios', description: 'Living collections of work, marks and feedback.' },
  { image: bgVaultLibrary, title: 'Vault & Library', description: 'Safely archived academic artefacts and study guides.' },
];

const GAMIFICATION_CARD_SLIDES = [
  { image: imgGames, title: 'Gamification Hub', description: 'Quests, badges and reward systems for motivation.' },
  { image: bgPracticeZone, title: 'Practice Zone', description: 'Diagnostic quizzes and skill-mastery drills.' },
];

interface ReportsCardTheme {
  borderColorClass: string;
  shadowColorClass: string;
  hoverBorderColorClass: string;
  hoverShadowColorClass: string;
  iconWrapClass: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  pillBg: string;
  pillText: string;
}

const REPORTS_THEME: Record<string, ReportsCardTheme> = {
  cyan: {
    borderColorClass: 'border-cyan-400/90',
    shadowColorClass: 'shadow-[0_0_30px_rgba(34,211,238,0.35)]',
    hoverBorderColorClass: 'hover:border-cyan-300',
    hoverShadowColorClass: 'hover:shadow-[0_0_50px_rgba(34,211,238,0.65)]',
    iconWrapClass: 'border-cyan-400/50 text-cyan-300 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.4)]',
    accentText: 'group-hover:text-cyan-200 text-cyan-300',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-400/40',
    pillBg: 'bg-cyan-500/10',
    pillText: 'text-cyan-300',
  },
  emerald: {
    borderColorClass: 'border-emerald-400/90',
    shadowColorClass: 'shadow-[0_0_30px_rgba(52,211,153,0.35)]',
    hoverBorderColorClass: 'hover:border-emerald-300',
    hoverShadowColorClass: 'hover:shadow-[0_0_50px_rgba(52,211,153,0.65)]',
    iconWrapClass: 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.4)]',
    accentText: 'group-hover:text-emerald-200 text-emerald-300',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-400/40',
    pillBg: 'bg-emerald-500/10',
    pillText: 'text-emerald-300',
  },
  amber: {
    borderColorClass: 'border-amber-400/90',
    shadowColorClass: 'shadow-[0_0_30px_rgba(251,191,36,0.35)]',
    hoverBorderColorClass: 'hover:border-amber-300',
    hoverShadowColorClass: 'hover:shadow-[0_0_50px_rgba(251,191,36,0.65)]',
    iconWrapClass: 'border-amber-400/50 text-amber-300 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    accentText: 'group-hover:text-amber-200 text-amber-300',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-400/40',
    pillBg: 'bg-amber-500/10',
    pillText: 'text-amber-300',
  },
  pink: {
    borderColorClass: 'border-pink-500/90',
    shadowColorClass: 'shadow-[0_0_30px_rgba(236,72,153,0.35)]',
    hoverBorderColorClass: 'hover:border-pink-400',
    hoverShadowColorClass: 'hover:shadow-[0_0_50px_rgba(236,72,153,0.65)]',
    iconWrapClass: 'border-pink-500/50 text-pink-300 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.4)]',
    accentText: 'group-hover:text-pink-200 text-pink-300',
    accentBg: 'bg-pink-500/10',
    accentBorder: 'border-pink-500/40',
    pillBg: 'bg-pink-500/10',
    pillText: 'text-pink-300',
  },
  purple: {
    borderColorClass: 'border-purple-500/90',
    shadowColorClass: 'shadow-[0_0_30px_rgba(168,85,247,0.35)]',
    hoverBorderColorClass: 'hover:border-purple-300',
    hoverShadowColorClass: 'hover:shadow-[0_0_50px_rgba(168,85,247,0.65)]',
    iconWrapClass: 'border-purple-500/50 text-purple-300 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    accentText: 'group-hover:text-purple-200 text-purple-300',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/40',
    pillBg: 'bg-purple-500/10',
    pillText: 'text-purple-300',
  },
};

function getReportsCardConfig(id: string, label: string) {
  switch (id) {
    case 'reports':
      return {
        themeKey: 'cyan',
        title: 'Progress Reports & Analytics',
        icon: BarChart3,
        desc: 'Analyze continuous class performance analytics, export detailed spreadsheets, and locate performance baselines for custom interventions.',
        slides: REPORTS_CARD_SLIDES,
        pills: [
          { id: 'reports', label: '📊 Progress Reports' },
          { id: 'reports', label: '📈 Analytics & Comments' },
        ],
      };
    case 'portfolios':
      return {
        themeKey: 'emerald',
        title: 'Learner Personal Portfolios',
        icon: FolderKanban,
        desc: 'Browse continuous student homework submissions, academic portfolios, custom marks, and personalized teacher feedback.',
        slides: PORTFOLIOS_CARD_SLIDES,
        pills: [
          { id: 'portfolios', label: '🗂️ Learner Portfolios' },
          { id: 'portfolios', label: '📚 Assignments' },
        ],
      };
    case 'curriculum':
      return {
        themeKey: 'amber',
        title: 'CAPS & Gamification Hub',
        icon: Trophy,
        desc: 'Map CAPS outcomes to engaging quests, badges and reward systems while tracking curriculum mastery across your classroom.',
        slides: GAMIFICATION_CARD_SLIDES,
        pills: [
          { id: 'curriculum', label: '🎮 Gamification Hub' },
          { id: 'curriculum', label: '📋 CAPS Alignment' },
        ],
      };
    default:
      return {
        themeKey: 'purple',
        title: label,
        icon: FileSpreadsheet,
        desc: `Access and manage ${label} tools and educational aids securely.`,
        slides: REPORTS_CARD_SLIDES,
        pills: [{ id, label: `Open ${label}` }],
      };
  }
}

interface CategoryOverviewProps {
  categoryLabel: string;
  categoryIcon: any;
  subTabs: SubTabItem[];
  onSelect: (tabId: string) => void;
  isDarkMode: boolean;
}

export default function CategoryOverview({
  categoryLabel,
  categoryIcon: Icon,
  subTabs,
  onSelect,
  isDarkMode,
}: CategoryOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Custom Intelligent AI Hub UI (matching Teacher's Toolbox design)
  if (categoryLabel === 'Intelligent AI' || categoryLabel === 'Intelligence AI' || categoryLabel === "AI Tutor's Class") {
    return (
      <div className="relative p-6 lg:p-10 overflow-hidden rounded-2xl text-white flex flex-col justify-between font-sans" style={{ minHeight: 'calc(100dvh - 130px)' }}>
        
        {/* Deep Cosmic Background & Subtle Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.8)_0%,rgba(8,11,34,1)_100%)] pointer-events-none rounded-2xl" />

        {/* Intelligent AI Background Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${overlayIntelligentAi})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* MAIN TITLE SECTION ("Intelligent AI") */}
        <div className="relative z-10 text-center my-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-xl sm:text-2xl font-display font-bold text-slate-100 tracking-tight">
              Intelligent
            </span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-amber-300 tracking-tight leading-none drop-shadow-[0_0_25px_rgba(252,211,77,0.6)]">
            AI Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto font-medium">
            Personalized AI Tutoring • Optical Script Analysis • Adaptive Curriculum Support
          </p>
        </div>

        {/* HERO SHOWCASE SECTION: SLIDESHOW & FEATURE BANNER */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 max-w-6xl mx-auto w-full items-stretch">
          
          {/* LEFT: Intelligent AI Slideshow */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <ContentSlideshow slides={INTELLIGENT_AI_SLIDES} />
          </div>

          {/* RIGHT: AI Tutor Featured Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onSelect('ai-tutor')}
            className="lg:col-span-5 flex flex-col justify-between p-6 rounded-[32px] bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-indigo-950/80 border-2 border-amber-500/40 hover:border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)] hover:brightness-110 relative overflow-hidden group transition-all duration-300 cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                  <Brain size={12} className="text-amber-300" />
                  ADAPTIVE TUTORING
                </span>
                <Brain size={24} className="text-amber-400 animate-pulse group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div>
                <h3 className="text-2xl font-display font-black text-white group-hover:text-amber-200 transition-colors">
                  AI Tutor Companion
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Engage with our localized AI tutor for homework help, syllabus explanations, and personalized study drills tailored to your unique learning style!
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Multilingual support (isiZulu, Afrikaans, etc.)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Voice interaction & Smart Playback</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Topic-specific image generation</span>
                </div>
              </div>
            </div>

            <button
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 hover:from-amber-400 hover:to-orange-500 text-white font-display font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.7)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300/40"
            >
              <Sparkles size={16} />
              <span>Launch AI Tutor Now</span>
            </button>
          </motion.div>

        </div>

        {/* Feature Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto w-full my-4 items-stretch">
          
          {/* CARD 1: AI Tutor (Orange/Amber Border Glow) */}
          <motion.div
            whileHover={{ scale: 1.03, y: -6 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onSelect('ai-tutor')}
            className="rounded-[32px] border-2 border-orange-500/90 bg-transparent shadow-[0_0_30px_rgba(249,115,22,0.35)] p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:border-orange-400 hover:bg-[#141a42] hover:brightness-110 hover:shadow-[0_0_50px_rgba(249,115,22,0.65)] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
              <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border-2 border-orange-500/50 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:scale-110 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300">
                <Brain size={44} />
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-orange-300 transition-colors mb-2">
                  AI Tutor Companion
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Personalized 1-on-1 tutoring sessions with adaptive support for various subjects and learning phases.
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/30 border border-orange-500/40 text-[11px] font-bold text-orange-300 hover:text-white hover:scale-105 transition-all cursor-pointer"
                >
                  🤖 Chat with Elly
                </button>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: OCR Auto-Grading (Cyan/Blue Border Glow) */}
          <motion.div
            whileHover={{ scale: 1.03, y: -6 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onSelect('ocr')}
            className="rounded-[32px] border-2 border-cyan-400/90 bg-transparent shadow-[0_0_30px_rgba(34,211,238,0.35)] p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:border-cyan-300 hover:bg-[#141a42] hover:brightness-110 hover:shadow-[0_0_50px_rgba(34,211,238,0.65)] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-300">
                <ScanLine size={44} />
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-cyan-200 transition-colors mb-2">
                  OCR Auto-Grading
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Leverage AI vision to scan physical student answer sheets and provide instant, objective auto-grading.
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  className="px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 hover:text-white hover:scale-105 transition-all cursor-pointer"
                >
                  ⚡ AI Vision Scanner
                </button>
              </div>
            </div>
          </motion.div>

        </div>

        {/* BOTTOM QUICK SHORTCUTS STRIP */}
        <div className="relative z-10 pt-6 border-t border-indigo-500/20 text-center">
          <p className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest mb-3">
            Intelligent AI Modules
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {[
              { id: 'ai-tutor', label: 'AI Tutor', icon: Brain },
              { id: 'ocr', label: 'OCR Grading', icon: ScanLine },
              { id: 'student-practice', label: 'Practice Zone', icon: Zap },
            ].map(tool => {
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelect(tool.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-cyan-400 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ToolIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // Custom Message & Collaborate Hub UI (matching Screenshot 3)
  if (
    categoryLabel === 'Message & Collaborate' || 
    categoryLabel === 'Chat & Messenger' || 
    categoryLabel === 'Communicator Hub' || 
    categoryLabel === 'Communicator Hub Chat' || 
    categoryLabel === 'Teacher Chat & Contacts'
  ) {
    return (
      <div className="relative p-6 sm:p-8 lg:p-10 overflow-hidden rounded-2xl text-white flex flex-col justify-start font-sans" style={{ minHeight: 'calc(100dvh - 130px)' }}>
        {/* Glowing cosmic curves/waves in background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,60,0.8)_0%,rgba(7,10,24,1)_100%)] pointer-events-none" />
        
        {/* Message Collaborate Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${overlayMessageCollaborate})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8 my-auto py-8">
          {/* Top Main Banner Card */}
          <div className="p-8 sm:p-12 rounded-[32px] bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-white/15 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Icon size={36} className="text-white" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white mb-3">
              {categoryLabel === 'Message & Collaborate' ? 'Message & Collaborate Hub' : categoryLabel}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal max-w-xl mx-auto">
              Connect with parents, students, and faculty. Share updates, assignments, and class resources in real-time.
            </p>
          </div>

          {/* Subtabs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subTabs.map((item) => {
              const ItemIcon = item.icon;
              const desc = item.id === 'messenger' 
                ? 'Real-time messaging channels for faculty, parents, and student classroom coordination.'
                : item.id === 'collaborative-workspace'
                ? 'Live multiplayer whiteboard and shared document editing for interactive group projects.'
                : item.id === 'student-practice'
                ? 'Interactive AI-guided practice exercises, quizzes, and skill mastery drills.'
                : item.desc || 'Explore collaborative tools and live communication channels.';

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  whileHover={{ y: -4 }}
                  className="group flex flex-col p-6 sm:p-8 rounded-[28px] bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all duration-300 text-left cursor-pointer shadow-xl relative overflow-hidden backdrop-blur-xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-white/15 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <ItemIcon size={26} className="text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                      {item.label}
                    </h3>
                  </div>

                  <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                    {desc}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Curriculum & Planning Landing Page
  if (categoryLabel === 'Curriculum and Planning' || categoryLabel === 'Curriculum & Planning') {
    return (
      <div className="relative p-6 lg:p-10 overflow-hidden rounded-2xl text-white flex flex-col justify-between font-sans" style={{ minHeight: 'calc(100dvh - 130px)' }}>
        
        {/* Deep Cosmic Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.9)_0%,rgba(6,11,25,1)_100%)] pointer-events-none rounded-2xl" />
        
        {/* Background Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-30 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url(${overlayTeachersToolbox})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* MAIN TITLE SECTION ("Curriculum & Planning") */}
        <div className="relative z-10 text-center my-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-xl sm:text-2xl font-display font-bold text-slate-100 tracking-tight">
              Curriculum &
            </span>
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-cyan-400 tracking-tight leading-none drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">
            Planning Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto font-medium">
            CAPS Syllabus Hub • Weekly Planner • Teacher's Planner & Diary • Lesson Architect & Alerts
          </p>
        </div>

        {/* HERO SHOWCASE SECTION */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 max-w-6xl mx-auto w-full items-stretch">
          
          {/* LEFT: Restored Interactive Content Slideshow */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <ContentSlideshow />
          </div>

          {/* RIGHT: Quick Launch Weekly Planner & Syllabus Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lg:col-span-5 flex flex-col justify-between p-6 rounded-[32px] bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-cyan-950/80 border-2 border-cyan-500/40 hover:border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:brightness-110 relative overflow-hidden group transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                  <Zap size={12} className="text-amber-300" />
                  CAPS & WEEKLY PACING
                </span>
                <Calendar size={24} className="text-cyan-400 animate-pulse group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div>
                <h3 className="text-2xl font-display font-black text-white group-hover:text-cyan-200 transition-colors">
                  Weekly Planner & Syllabus
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Organize term topics, ATP progress, weekly lesson schedules, daily task reminders, and notifications seamlessly in one place.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Interactive weekly lesson calendar & diary notes</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>South African CAPS syllabus alignment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Integrated planning notifications & alerts</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelect('weekly-planner')}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-cyan-300/40"
            >
              <Calendar size={16} />
              <span>Launch Weekly Planner</span>
            </button>
          </motion.div>

        </div>

        {/* CURRICULUM & PLANNING FEATURES GRID */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full my-4 items-stretch">
          
          {/* CARD 1: Weekly Planner */}
          <div 
            onClick={() => onSelect('weekly-planner')}
            className="p-6 rounded-[28px] bg-slate-900/80 border-2 border-cyan-500/50 hover:border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-white group-hover:text-cyan-300">Weekly Planner</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Schedule weekly lesson milestones, timetable periods, and term pacing.</p>
            </div>
            <button className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all text-center">
              Open Weekly Planner →
            </button>
          </div>

          {/* CARD 2: Lesson Planner / Content Studio */}
          <div 
            onClick={() => onSelect('teaching')}
            className="p-6 rounded-[28px] bg-slate-900/80 border-2 border-pink-500/50 hover:border-pink-300 shadow-[0_0_25px_rgba(236,72,153,0.2)] hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/40 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-white group-hover:text-pink-300">Lesson Architect</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Create step-by-step CAPS lesson plans, worksheets, and teaching aids.</p>
            </div>
            <button className="mt-4 px-4 py-2 rounded-xl bg-pink-500/20 text-pink-300 font-bold text-xs hover:bg-pink-500/30 transition-all text-center">
              Open Lesson Architect →
            </button>
          </div>

          {/* CARD 3: Teacher's Planner & Diary */}
          <div 
            onClick={() => onSelect('planner')}
            className="p-6 rounded-[28px] bg-slate-900/80 border-2 border-purple-500/50 hover:border-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-white group-hover:text-purple-300">Teacher's Diary</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Personal teaching log, daily reflections, reminders, and class task lists.</p>
            </div>
            <button className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs hover:bg-purple-500/30 transition-all text-center">
              Open Teacher's Diary →
            </button>
          </div>

          {/* CARD 4: CAPS Syllabus Hub */}
          <div 
            onClick={() => onSelect('curriculum')}
            className="p-6 rounded-[28px] bg-slate-900/80 border-2 border-emerald-500/50 hover:border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Layers size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-white group-hover:text-emerald-300">CAPS Syllabus Hub</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Full South African CAPS curriculum documents, assessment plans, and topics.</p>
            </div>
            <button className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-all text-center">
              Explore CAPS Hub →
            </button>
          </div>

          {/* CARD 5: Notifications & Alerts */}
          <div 
            onClick={() => onSelect('alerts')}
            className="p-6 rounded-[28px] bg-slate-900/80 border-2 border-amber-500/50 hover:border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Bell size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-white group-hover:text-amber-300">Notifications & Alerts</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Stay updated with planning reminders, assignment deadlines, and alerts.</p>
            </div>
            <button className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-all text-center">
              View Notifications →
            </button>
          </div>

          {/* CARD 6: Content Archive */}
          <div 
            onClick={() => onSelect('archive')}
            className="p-6 rounded-[28px] bg-slate-900/80 border-2 border-indigo-500/50 hover:border-indigo-300 shadow-[0_0_25px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Archive size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-white group-hover:text-indigo-300">Content Archive</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Access all saved plans, exported workbooks, and generated teaching resources.</p>
            </div>
            <button className="mt-4 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs hover:bg-indigo-500/30 transition-all text-center">
              Open Archive →
            </button>
          </div>

        </div>

      </div>
    );
  }

  // Custom Reports & Portfolios Hub UI (mirrors Teacher's Toolbox design language)
  if (categoryLabel === 'Reports & Portfolios' || categoryLabel === 'Reports & Portfolio') {
    return (
      <div className="relative p-6 lg:p-10 overflow-hidden rounded-2xl text-white flex flex-col justify-between font-sans" style={{ minHeight: 'calc(100dvh - 130px)' }}>
        
        {/* Deep Cosmic Background & Subtle Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.8)_0%,rgba(8,11,34,1)_100%)] pointer-events-none rounded-2xl" />
        
        {/* Analytics Background Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url(${bgAnalytics})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* MAIN TITLE SECTION ("Reports & Portfolios") */}
        <div className="relative z-10 text-center my-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
            <span className="text-xl sm:text-2xl font-display font-bold text-slate-100 tracking-tight">
              Reports &
            </span>
            <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-cyan-300 tracking-tight leading-none drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">
            Portfolios
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto font-medium">
            Progress Reports • Learner Portfolios • CAPS & Gamification
          </p>
        </div>

        {/* HERO SHOWCASE SECTION: SLIDESHOW & FEATURED REPORT CARD */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 max-w-6xl mx-auto w-full items-stretch">
          
          {/* LEFT: Interactive Reports Slideshow */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <ContentSlideshow slides={REPORTS_HERO_SLIDES} />
          </div>

          {/* RIGHT: Featured Report Launch Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lg:col-span-5 flex flex-col justify-between p-6 rounded-[32px] bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-cyan-950/80 border-2 border-cyan-500/40 hover:border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:brightness-110 relative overflow-hidden group transition-all duration-300 cursor-pointer"
            onClick={() => onSelect('reports')}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                  <Zap size={12} className="text-amber-300" />
                  LIVE PERFORMANCE
                </span>
                <BarChart3 size={24} className="text-cyan-400 animate-pulse group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div>
                <h3 className="text-2xl font-display font-black text-white group-hover:text-cyan-200 transition-colors">
                  Progress Reports Hub
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Track learner marks, SBA assessments, term trends, and achievement baselines — then generate detailed, comment-ready CAPS report notes.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Interactive mark distribution & term charts</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Exportable spreadsheets & PDF reports</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Individual learner dossiers & comments</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onSelect('reports'); }}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-cyan-300/40"
            >
              <TrendingUp size={16} />
              <span>Open Progress Reports</span>
            </button>
          </motion.div>

        </div>

        {/* MODULES GRID — each integrated menu is a showcase card */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto w-full my-4 items-stretch">
          {subTabs.map((item) => {
            const cfg = getReportsCardConfig(item.id, item.label);
            const theme = REPORTS_THEME[cfg.themeKey] || REPORTS_THEME.purple;
            const CardIcon = cfg.icon || item.icon;
            return (
              <InteractiveShowcaseCard
                key={item.id}
                slides={cfg.slides}
                borderColorClass={theme.borderColorClass}
                shadowColorClass={theme.shadowColorClass}
                hoverBorderColorClass={theme.hoverBorderColorClass}
                hoverShadowColorClass={theme.hoverShadowColorClass}
                glowColorClass="shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                onClick={() => onSelect(item.id)}
              >
                <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
                  <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${theme.iconWrapClass}`}>
                    <CardIcon size={44} />
                  </div>

                  <div>
                    <h2 className={`text-2xl font-display font-extrabold text-white mb-2 ${theme.accentText} transition-colors`}>
                      {cfg.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                      {cfg.desc}
                    </p>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                    {cfg.pills.map((pill, pi) => (
                      <button
                        key={pi}
                        onClick={(e) => { e.stopPropagation(); onSelect(pill.id); }}
                        className={`px-3 py-1.5 rounded-full border hover:scale-105 transition-all cursor-pointer relative z-20 ${theme.pillBg} ${theme.accentBorder} ${theme.pillText} hover:text-white`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
              </InteractiveShowcaseCard>
            );
          })}
        </div>

        {/* BOTTOM QUICK SHORTCUTS STRIP */}
        <div className="relative z-10 pt-6 border-t border-cyan-500/20 text-center">
          <p className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest mb-3">
            Reports & Portfolios Modules
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {subTabs.map((tool) => {
              const cfg = getReportsCardConfig(tool.id, tool.label);
              const ToolIcon = cfg.icon || tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelect(tool.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-600/30 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ToolIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // Custom Teacher's Toolbox / Edu-Tools Hub UI
  if (
    categoryLabel === 'Edu-Tools Hub' || 
    categoryLabel === "Teacher's Toolbox" || 
    categoryLabel === "Teacher'sToolBox" || 
    categoryLabel === "Teacher's ToolBox" || 
    categoryLabel === 'TeachersToolBox' || 
    categoryLabel === 'Curriculum' || 
    categoryLabel === 'Teachers Magic' || 
    categoryLabel === 'lesson-planning'
  ) {
    return (
      <div className="relative p-6 lg:p-10 overflow-hidden rounded-2xl text-white flex flex-col justify-between font-sans" style={{ minHeight: 'calc(100dvh - 130px)' }}>
        
        {/* Deep Cosmic Background & Subtle Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.8)_0%,rgba(8,11,34,1)_100%)] pointer-events-none rounded-2xl" />
        
        {/* Teachers Toolbox Background Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url(${overlayTeachersToolbox})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />


        {/* MAIN TITLE SECTION ("Teacher's Toolbox") */}
        <div className="relative z-10 text-center my-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-xl sm:text-2xl font-display font-bold text-slate-100 tracking-tight">
              Teacher's
            </span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-amber-300 tracking-tight leading-none drop-shadow-[0_0_25px_rgba(252,211,77,0.6)]">
            Toolbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto font-medium">
            CAPS Lesson Architect • Instant QR Camera Auto-Grading • Creative Media Suite
          </p>
        </div>

        {/* HERO SHOWCASE SECTION: RESTORED CONTENT SLIDESHOW & QR SCANNER BANNER */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 max-w-6xl mx-auto w-full items-stretch">
          
          {/* LEFT: Restored Interactive Content Slideshow */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <ContentSlideshow />
          </div>

          {/* RIGHT: Camera QR Scanner Instant Feature Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lg:col-span-5 flex flex-col justify-between p-6 rounded-[32px] bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-indigo-950/80 border-2 border-cyan-500/40 hover:border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:brightness-110 relative overflow-hidden group transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                  <Zap size={12} className="text-amber-300" />
                  INSTANT CAMERA GRADING
                </span>
                <QrCode size={24} className="text-cyan-400 animate-pulse group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div>
                <h3 className="text-2xl font-display font-black text-white group-hover:text-cyan-200 transition-colors">
                  Worksheet QR Scanner
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Scan physical printed worksheet QR codes using your phone or laptop camera for instant diagnostic scoring, student mark recording, and memorandum breakdown!
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Camera QR detection in 0.5 seconds</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Automatic score calculation & answer memo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>Direct export to Teacher Gradebook</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-cyan-300/40"
            >
              <Camera size={16} />
              <span>Launch Camera QR Scanner</span>
            </button>
          </motion.div>

        </div>

        {/* 2x2 NEON GLOW CARDS GRID (With Interactive Slideshow Showcases) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto w-full my-4 items-stretch">
          
          {/* CARD 1: CAPS Tools Factory (Pink/Magenta Border Glow) */}
          <InteractiveShowcaseCard
            slides={CAPS_TOOLS_SLIDES}
            borderColorClass="border-pink-500/90"
            shadowColorClass="shadow-[0_0_30px_rgba(236,72,153,0.35)]"
            hoverBorderColorClass="hover:border-pink-400"
            hoverShadowColorClass="hover:shadow-[0_0_50px_rgba(236,72,153,0.65)]"
            glowColorClass="shadow-[0_0_20px_rgba(236,72,153,0.4)] group-hover:bg-pink-500/20 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]"
            onClick={() => onSelect('teaching')}
          >
            <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
              {/* Custom Pink Monitor Icon */}
              <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border-2 border-pink-500/50 flex items-center justify-center text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)] group-hover:scale-110 group-hover:bg-pink-500/20 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all duration-300">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="3" stroke="#ec4899" strokeWidth="2" />
                  <line x1="8" y1="21" x2="16" y2="21" stroke="#ec4899" strokeWidth="2" />
                  <line x1="12" y1="17" x2="12" y2="21" stroke="#ec4899" strokeWidth="2" />
                  <path d="M7 8l3 3-3 3" stroke="#ec4899" strokeWidth="2" />
                  <line x1="12" y1="14" x2="16" y2="14" stroke="#ec4899" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-pink-300 transition-colors mb-2">
                  CAPS Tools Factory
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Generate detailed CAPS-aligned lesson plans, unit planners, and foundation phase learning materials in seconds!
                </p>
              </div>

              {/* Sub-action Pills */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('teaching'); }}
                  className="px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/30 border border-pink-500/40 text-[11px] font-bold text-pink-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  ✨ Content Studio
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('grade1'); }}
                  className="px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/30 border border-pink-500/40 text-[11px] font-bold text-pink-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  🎒 Foundation Hub (R-3)
                </button>
              </div>
            </div>
          </InteractiveShowcaseCard>

          {/* CARD 2: Quiz Wizard (Orange/Amber Border Glow) */}
          <InteractiveShowcaseCard
            slides={QUIZ_WIZARD_SLIDES}
            borderColorClass="border-orange-500/90"
            shadowColorClass="shadow-[0_0_30px_rgba(249,115,22,0.35)]"
            hoverBorderColorClass="hover:border-orange-400"
            hoverShadowColorClass="hover:shadow-[0_0_50px_rgba(249,115,22,0.65)]"
            glowColorClass="shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:bg-orange-500/20 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]"
            onClick={() => onSelect('student-practice')}
          >
            <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
              {/* Custom Orange Clipboard Icon */}
              <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border-2 border-orange-500/50 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:scale-110 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="#f97316" strokeWidth="2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" stroke="#f97316" strokeWidth="2" />
                  <path d="M9 12l2 2 4-4" stroke="#f97316" strokeWidth="2" />
                  <line x1="9" y1="17" x2="15" y2="17" stroke="#f97316" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-orange-300 transition-colors mb-2">
                  Quiz Wizard
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Interactive diagnostic quizzes, formal exam papers, answer memorandums, and student practice exercises.
                </p>
              </div>

              {/* Sub-action Pills */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('student-practice'); }}
                  className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/30 border border-orange-500/40 text-[11px] font-bold text-orange-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  📝 Practice Zone
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('ocr'); }}
                  className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/30 border border-orange-500/40 text-[11px] font-bold text-orange-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  ⚡ Auto-Grading OCR
                </button>
              </div>
            </div>
          </InteractiveShowcaseCard>

          {/* CARD 3: Admin & Reports Cabinet (Cyan/Blue Border Glow) */}
          <InteractiveShowcaseCard
            slides={ADMIN_REPORTS_SLIDES}
            borderColorClass="border-cyan-400/90"
            shadowColorClass="shadow-[0_0_30px_rgba(34,211,238,0.35)]"
            hoverBorderColorClass="hover:border-cyan-300"
            hoverShadowColorClass="hover:shadow-[0_0_50px_rgba(34,211,238,0.65)]"
            glowColorClass="shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
            onClick={() => onSelect('admin')}
          >
            <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
              {/* Custom Cyan Document Icon */}
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-300">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#22d3ee" strokeWidth="2" />
                  <polyline points="14 2 14 8 20 8" stroke="#22d3ee" strokeWidth="2" />
                  <path d="M12 18l3-3-3-3" stroke="#22d3ee" strokeWidth="2" />
                  <line x1="9" y1="15" x2="15" y2="15" stroke="#22d3ee" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-cyan-200 transition-colors mb-2">
                  Admin & Reports Cabinet
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Generate learner report comments, parent communication notices, newsletters, and administrative logs.
                </p>
              </div>

              {/* Sub-action Pills */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('admin'); }}
                  className="px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  📋 Admin Lab & Notices
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('reports'); }}
                  className="px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  📊 Analytics & Comments
                </button>
              </div>
            </div>
          </InteractiveShowcaseCard>

          {/* CARD 4: Media Tools Designer (Emerald/Green Border Glow) */}
          <InteractiveShowcaseCard
            slides={MEDIA_TOOLS_SLIDES}
            borderColorClass="border-emerald-400/90"
            shadowColorClass="shadow-[0_0_30px_rgba(52,211,153,0.35)]"
            hoverBorderColorClass="hover:border-emerald-300"
            hoverShadowColorClass="hover:shadow-[0_0_50px_rgba(52,211,153,0.65)]"
            glowColorClass="shadow-[0_0_20px_rgba(52,211,153,0.4)] group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.6)]"
            onClick={() => onSelect('visual')}
          >
            <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
              {/* Custom Emerald Classroom Icon */}
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)] group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.6)] transition-all duration-300">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="#34d399" strokeWidth="2" />
                  <path d="M8 21l4-6 4 6" stroke="#34d399" strokeWidth="2" />
                  <circle cx="12" cy="9" r="2" stroke="#34d399" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-emerald-200 transition-colors mb-2">
                  Media Tools Designer
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Design rich classroom posters, educational infographics, AI teacher video avatars, and visual flashcards.
                </p>
              </div>

              {/* Sub-action Pills */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('visual'); }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  🎨 Visual Lab Posters
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('video'); }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  🎬 Video Avatars
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('archive'); }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20"
                >
                  📂 Vault & Library
                </button>
              </div>
            </div>
          </InteractiveShowcaseCard>

        </div>

        {/* BOTTOM QUICK SHORTCUTS STRIP */}
        <div className="relative z-10 pt-6 border-t border-indigo-500/20 text-center">
          <p className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest mb-3">
            Direct Tool Access
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {[
              { id: 'teaching', label: 'Content Studio', icon: FlaskConical },
              { id: 'grade1', label: 'Foundation Hub (R-3)', icon: Sparkles },
              { id: 'admin', label: 'Admin Lab', icon: FileText },
              { id: 'visual', label: 'Visual Lab', icon: Palette },
              { id: 'video', label: 'Video Lab', icon: Video },
              { id: 'archive', label: 'Content Archive', icon: Archive },
              { id: 'illustrations', label: 'Illustration Library', icon: BookOpen },
            ].map(tool => {
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelect(tool.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-cyan-400 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ToolIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WORKSHEET CAMERA QR SCANNER MODAL */}
        <WorksheetQRScannerModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onGradingComplete={(result) => {
            console.log('Grading result:', result);
          }}
        />

      </div>
    );
  }

  // Rich descriptions dynamically matched to IDs
  const getRichDescription = (id: string, label: string) => {
    switch (id) {
      case 'teaching':
        return 'Generate high-quality, CAPS-aligned lesson plans, dynamic worksheets, interactive rubrics, and educational aids tailored to South African Grade standards instantaneously.';
      case 'archive':
        return 'Retrieve and manage your secure digital files, saved class resources, posters, and educational charts from past sessions.';
      case 'ai-tutor':
        return 'Launch the localized AI Tutor companion to assist with homework grading, textbook concept explanations, and curriculum support.';
      case 'ocr':
        return 'Leverage AI vision engine to scan physical student answer sheets, detect handwritten text, and perform objective autograding automatically.';
      case 'reports':
        return 'Analyze continuous class performance analytics, export detailed spreadsheets, and locate performance baselines for custom interventions.';
      case 'portfolios':
        return 'Browse through continuous student homework submissions, academic portfolios, custom marks, and personalized teacher feedback.';
      case 'class-management':
        return 'Configure and manage active classrooms, register lists of learners, edit parent information, and design student seats profiles.';
      case 'messenger':
        return 'Connect instantly with parents and other educators in a unified POPIA-compliant school communication center.';
      case 'settings':
        return 'Configure default AI providers, secure API quotas, application privacy toggles, accessibility controls, and custom model nodes.';
      case 'helpdesk':
        return 'Submit priority educator support queries and explore comprehensive platform usage guidelines.';
      case 'faq':
        return 'Read common questions regarding CAPS curriculum alignment, offline availability, security compliance, and platform specifications.';
      case 'student-practice':
        return 'Engage in custom-designed quizzes, educational games, and learning exercises synced to active curriculum files.';
      case 'student-notes':
        return 'Build and curate personalized textbook summaries, revision flashcards, and concept structures for active courses.';
      default:
        return `Access and manage ${label} tools and educational aids securely.`;
    }
  };

  const getCardTheme = (id: string, idx: number) => {
    const colorThemes = [
      { 
        color: 'text-brand-cyan', 
        bg: 'bg-transparent', 
        border: 'border-[#00d2ff]/20 shadow-cyan-500/5',
        gradLight: 'bg-gradient-to-br from-cyan-50/70 via-cyan-50/30 to-white hover:from-cyan-100/80 hover:to-white border-cyan-100/65',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-[#00d2ff]/10 hover:from-slate-900/80 hover:to-[#00d2ff]/20 border-[#00d2ff]/25'
      },
      { 
        color: 'text-brand-purple', 
        bg: 'bg-transparent', 
        border: 'border-[#8e44ad]/20 shadow-purple-500/5',
        gradLight: 'bg-gradient-to-br from-purple-50/70 via-purple-50/30 to-white hover:from-purple-100/80 hover:to-white border-purple-100/65',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-[#8e44ad]/10 hover:from-slate-900/80 hover:to-[#8e44ad]/20 border-[#8e44ad]/25'
      },
      { 
        color: 'text-brand-yellow', 
        bg: 'bg-transparent', 
        border: 'border-[#ffdf40]/20 shadow-yellow-500/5',
        gradLight: 'bg-gradient-to-br from-yellow-50/70 via-yellow-50/30 to-white hover:from-yellow-100/80 hover:to-white border-yellow-200/50',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-[#ffdf40]/10 hover:from-slate-900/80 hover:to-[#ffdf40]/20 border-[#ffdf40]/25'
      },
      { 
        color: 'text-brand-pink', 
        bg: 'bg-pink-500/15', 
        border: 'border-pink-500/20 shadow-pink-500/5',
        gradLight: 'bg-gradient-to-br from-pink-50/70 via-pink-50/30 to-white hover:from-pink-100/80 hover:to-white border-pink-100/65',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-pink-500/10 hover:from-slate-900/80 hover:to-pink-500/20 border-pink-500/25'
      },
      { 
        color: 'text-orange-400', 
        bg: 'bg-orange-500/15', 
        border: 'border-orange-500/20 shadow-orange-500/5',
        gradLight: 'bg-gradient-to-br from-orange-50/70 via-orange-50/30 to-white hover:from-orange-100/80 hover:to-white border-orange-200/40',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-orange-500/10 hover:from-slate-900/80 hover:to-orange-500/20 border-orange-500/25'
      },
      { 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/15', 
        border: 'border-emerald-500/20 shadow-emerald-500/5',
        gradLight: 'bg-gradient-to-br from-emerald-50/70 via-emerald-50/30 to-white hover:from-emerald-100/80 hover:to-white border-emerald-100/65',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-emerald-500/10 hover:from-slate-900/80 hover:to-emerald-500/20 border-emerald-500/25'
      },
    ];
    return colorThemes[idx % colorThemes.length];
  };

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className={`p-8 rounded-[40px] relative overflow-hidden border ${
        isDarkMode ? 'bg-indigo-950/20 border-indigo-500/25' : 'bg-[#fff5ee] border-[#ffebd6] shadow-sm'
      }`}>
        <div className="relative z-10 flex items-center gap-4">
          <div className={`p-4 rounded-[24px] ${isDarkMode ? 'bg-indigo-500/10 text-brand-cyan' : 'bg-brand-yellow/20 text-slate-700'}`}>
            <Icon size={32} />
          </div>
          <div>
            <h2 className={`text-2xl sm:text-3xl font-display font-black tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {categoryLabel}
            </h2>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-indigo-200' : 'text-slate-500'} mt-1`}>
              Explore available modules and smart aids in this curriculum hub.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid of Options */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
        {subTabs.map((item, idx) => {
          const ItemIcon = item.icon;
          const { color, bg, gradLight, gradDark } = getCardTheme(item.id, idx);
          const desc = item.desc || getRichDescription(item.id, item.label);

          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`group flex flex-col p-3 sm:p-4 md:p-5 rounded-[16px] sm:rounded-[24px] md:rounded-[28px] transition-all text-left relative overflow-hidden cursor-pointer border hover:-translate-y-1.5 outline-none shadow-sm hover:shadow-md ${
                isDarkMode ? gradDark : gradLight
              }`}
            >
              <div className="flex justify-between items-start w-full mb-2 sm:mb-4 relative">
                <div className={`p-2 sm:p-3 rounded-[10px] sm:rounded-[16px] md:rounded-[18px] ${bg} ${color} transition-all duration-300 group-hover:scale-110 shadow-inner`}>
                  <ItemIcon size={16} className="sm:w-[20px] sm:h-[20px] md:w-[22px] md:h-[22px]" />
                </div>
                <div className={`opacity-0 sm:group-hover:opacity-100 transition-all ${color} ${bg} p-1 sm:p-2 rounded-full absolute top-0 right-0 hidden sm:block`}>
                  <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>

              <h3 className={`text-[11px] sm:text-sm md:text-base lg:text-lg font-display font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} line-clamp-1 sm:line-clamp-none`}>
                {item.label}
              </h3>
              <p className={`text-[9px] sm:text-[11px] md:text-xs font-medium sm:font-bold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-none`}>
                {desc}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* WORKSHEET CAMERA QR SCANNER MODAL */}
      <WorksheetQRScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
