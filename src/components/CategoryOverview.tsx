import { motion } from 'framer-motion';
import { useState } from 'react';
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
  User
} from 'lucide-react';
import ContentSlideshow from './ContentSlideshow';

interface SubTabItem {
  id: string;
  label: string;
  icon: any;
  desc?: string;
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

  // Custom Edu-Tools Hub UI matching Screenshot 1 ("Your Magic Toolbox")
  if (categoryLabel === 'Edu-Tools Hub' || categoryLabel === 'Curriculum' || categoryLabel === 'Teachers Magic' || categoryLabel === 'lesson-planning') {
    return (
      <div className="relative p-6 lg:p-10 overflow-hidden rounded-[40px] border border-indigo-500/30 bg-[#080b22] text-white min-h-[85vh] flex flex-col justify-between font-sans">
        
        {/* Deep Cosmic Background & Subtle Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.8)_0%,rgba(8,11,34,1)_100%)] pointer-events-none rounded-[40px]" />
        
        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* TOP HEADER BAR (Matching Screenshot 1) */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-indigo-500/20">
          
          {/* Brand Pill */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-indigo-500/40 rounded-full px-4 py-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center text-slate-950 font-black text-xs">
              E
            </div>
            <span className="font-display font-black text-xs tracking-wider text-slate-100 uppercase">
              EduAI Companion
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search magic tools..." 
              className="w-full bg-slate-900/90 border border-indigo-500/30 focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,211,238,0.4)] rounded-full pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Right User & CTA Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSelect('teaching')}
              className="w-8 h-8 rounded-full bg-slate-800/90 border border-indigo-500/30 flex items-center justify-center text-indigo-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
              title="Profile"
            >
              <User className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onSelect('teaching')}
              className="text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors px-2 py-1 cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => onSelect('teaching')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-xs px-5 py-2 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:shadow-[0_0_20px_rgba(251,191,36,0.8)] hover:scale-[1.03] transition-all cursor-pointer"
            >
              Get Started!
            </button>
          </div>

        </div>

        {/* MAIN TITLE SECTION (Matching Screenshot 1: "Your Magic Toolbox") */}
        <div className="relative z-10 text-center my-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-xl sm:text-2xl font-display font-bold text-slate-100 tracking-tight">
              Your Magic
            </span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-black text-amber-300 tracking-tight leading-none drop-shadow-[0_0_25px_rgba(252,211,77,0.6)]">
            Toolbox
          </h1>
        </div>

        {/* 2x2 NEON GLOW CARDS GRID (Matching Screenshot 1) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto w-full my-4">
          
          {/* CARD 1: Auto-Lesson Maker (Pink/Magenta Border Glow) */}
          <motion.div
            whileHover={{ y: -5, scale: 1.015 }}
            onClick={() => onSelect('teaching')}
            className="rounded-[32px] border-2 border-pink-500/90 bg-[#0e122e]/90 shadow-[0_0_30px_rgba(236,72,153,0.35)] p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:border-pink-400 hover:shadow-[0_0_45px_rgba(236,72,153,0.6)] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4 w-full flex flex-col items-center">
              {/* Custom Pink Monitor Icon */}
              <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border-2 border-pink-500/50 flex items-center justify-center text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)] group-hover:scale-110 transition-transform duration-300">
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
                  Auto-Lesson Maker
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Create amazing lesson plans in a flash like a super lesson builder! Perfect for your first subject.
                </p>
              </div>

              {/* Quick Sub-action Pills for Migrated Functions */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('teaching'); }}
                  className="px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/40 text-[11px] font-bold text-pink-300 hover:text-white transition-all cursor-pointer"
                >
                  ✨ Content Studio
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('grade1'); }}
                  className="px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/40 text-[11px] font-bold text-pink-300 hover:text-white transition-all cursor-pointer"
                >
                  🎒 Foundation Hub (R-3)
                </button>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: Quiz Wizard (Orange/Amber Border Glow) */}
          <motion.div
            whileHover={{ y: -5, scale: 1.015 }}
            onClick={() => onSelect('student-practice')}
            className="rounded-[32px] border-2 border-orange-500/90 bg-[#0e122e]/90 shadow-[0_0_30px_rgba(249,115,22,0.35)] p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:border-orange-400 hover:shadow-[0_0_45px_rgba(249,115,22,0.6)] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4 w-full flex flex-col items-center">
              {/* Custom Orange Clipboard Icon */}
              <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border-2 border-orange-500/50 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:scale-110 transition-transform duration-300">
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
                  Quiz worksheets and exercises to test prior knowledge. Benefits of quizzes in the magic today!
                </p>
              </div>

              {/* Quick Sub-action Pills for Migrated Functions */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('student-practice'); }}
                  className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/40 text-[11px] font-bold text-orange-300 hover:text-white transition-all cursor-pointer"
                >
                  📝 Practice Zone
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('ocr'); }}
                  className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/40 text-[11px] font-bold text-orange-300 hover:text-white transition-all cursor-pointer"
                >
                  ⚡ Auto-Grading OCR
                </button>
              </div>
            </div>
          </motion.div>

          {/* CARD 3: Report Card Spark (Cyan/Blue Border Glow) */}
          <motion.div
            whileHover={{ y: -5, scale: 1.015 }}
            onClick={() => onSelect('admin')}
            className="rounded-[32px] border-2 border-cyan-400/90 bg-[#0e122e]/90 shadow-[0_0_30px_rgba(34,211,238,0.35)] p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:border-cyan-300 hover:shadow-[0_0_45px_rgba(34,211,238,0.6)] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4 w-full flex flex-col items-center">
              {/* Custom Cyan Document Icon */}
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform duration-300">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#22d3ee" strokeWidth="2" />
                  <polyline points="14 2 14 8 20 8" stroke="#22d3ee" strokeWidth="2" />
                  <path d="M12 18l3-3-3-3" stroke="#22d3ee" strokeWidth="2" />
                  <line x1="9" y1="15" x2="15" y2="15" stroke="#22d3ee" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-cyan-200 transition-colors mb-2">
                  Report Card Spark
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Create your report card summaries, worksheets and exercises for use and report cards!
                </p>
              </div>

              {/* Quick Sub-action Pills for Migrated Functions */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('admin'); }}
                  className="px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 hover:text-white transition-all cursor-pointer"
                >
                  📋 Admin Lab & Notices
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('reports'); }}
                  className="px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 hover:text-white transition-all cursor-pointer"
                >
                  📊 Analytics & Comments
                </button>
              </div>
            </div>
          </motion.div>

          {/* CARD 4: Classroom Gamify (Emerald/Green Border Glow) */}
          <motion.div
            whileHover={{ y: -5, scale: 1.015 }}
            onClick={() => onSelect('visual')}
            className="rounded-[32px] border-2 border-emerald-400/90 bg-[#0e122e]/90 shadow-[0_0_30px_rgba(52,211,153,0.35)] p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:border-emerald-300 hover:shadow-[0_0_45px_rgba(52,211,153,0.6)] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4 w-full flex flex-col items-center">
              {/* Custom Emerald Classroom Icon */}
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)] group-hover:scale-110 transition-transform duration-300">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="#34d399" strokeWidth="2" />
                  <path d="M8 21l4-6 4 6" stroke="#34d399" strokeWidth="2" />
                  <circle cx="12" cy="9" r="2" stroke="#34d399" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-display font-extrabold text-white group-hover:text-emerald-200 transition-colors mb-2">
                  Classroom Gamify
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                  Make your classroom gamify! Make beautiful posters for your room and classroom.
                </p>
              </div>

              {/* Quick Sub-action Pills for Migrated Functions */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('visual'); }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white transition-all cursor-pointer"
                >
                  🎨 Visual Lab Posters
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('video'); }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white transition-all cursor-pointer"
                >
                  🎬 Video Avatars
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect('archive'); }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white transition-all cursor-pointer"
                >
                  📂 Vault & Library
                </button>
              </div>
            </div>
          </motion.div>

        </div>

        {/* BOTTOM QUICK SHORTCUTS STRIP (Ensuring 100% feature migration) */}
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
        bg: 'bg-[#00d2ff]/15', 
        border: 'border-[#00d2ff]/20 shadow-cyan-500/5',
        gradLight: 'bg-gradient-to-br from-cyan-50/70 via-cyan-50/30 to-white hover:from-cyan-100/80 hover:to-white border-cyan-100/65',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-[#00d2ff]/10 hover:from-slate-900/80 hover:to-[#00d2ff]/20 border-[#00d2ff]/25'
      },
      { 
        color: 'text-brand-purple', 
        bg: 'bg-[#8e44ad]/15', 
        border: 'border-[#8e44ad]/20 shadow-purple-500/5',
        gradLight: 'bg-gradient-to-br from-purple-50/70 via-purple-50/30 to-white hover:from-purple-100/80 hover:to-white border-purple-100/65',
        gradDark: 'bg-gradient-to-br from-slate-900/60 to-[#8e44ad]/10 hover:from-slate-900/80 hover:to-[#8e44ad]/20 border-[#8e44ad]/25'
      },
      { 
        color: 'text-brand-yellow', 
        bg: 'bg-[#ffdf40]/15', 
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
    </div>
  );
}
