import { motion } from 'motion/react';
import { 
  ChevronRight, 
  Telescope, 
  Sparkles, 
  BookOpen, 
  GraduationCap,
  FlaskConical,
  FileText,
  Palette,
  Video,
  Archive,
  Database
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
  // Custom Edu-Tools Hub UI that matches the screenshot exactly
  if (categoryLabel === 'Edu-Tools Hub' || categoryLabel === 'Curriculum' || categoryLabel === 'Teachers Magic') {
    return (
      <div className="relative p-6 lg:p-12 overflow-hidden rounded-[40px] border border-cyan-500/20 bg-slate-950/80">
        {/* Retro Neon Grid Background & Waves */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1225] via-[#0d1225] to-[#030611] overflow-hidden -z-10 rounded-[40px]">
          {/* Grid Perspective */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .25) 25%, rgba(6, 182, 212, .25) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .25) 75%, rgba(6, 182, 212, .25) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .25) 25%, rgba(6, 182, 212, .25) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .25) 75%, rgba(6, 182, 212, .25) 76%, transparent 77%, transparent)
              `,
              backgroundSize: '50px 50px',
              transform: 'perspective(400px) rotateX(60deg) translateY(-80px) scale(2)',
              transformOrigin: 'top center',
            }}
          />
          {/* Sinuating light energy wave vectors using simple absolute circles & blurs */}
          <div className="absolute top-1/3 -left-1/4 w-[150%] h-48 bg-gradient-to-r from-cyan-500/20 via-emerald-400/20 to-indigo-500/10 blur-[120px] rounded-full transform -rotate-12 pointer-events-none" />
          <div className="absolute bottom-10 -right-1/4 w-[150%] h-48 bg-gradient-to-r from-emerald-500/10 via-cyan-500/15 to-purple-500/25 blur-[100px] rounded-full transform rotate-6 pointer-events-none" />
        </div>

        {/* Main Content Area: Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* LEFT: 3D Slanted Tablet Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group">
<ContentSlideshow />
            </div>
          </div>

          {/* RIGHT: Header, Subtitle and 3 Glowing Cards */}
          <div className="lg:col-span-7 space-y-10">
            {/* Title & Sub */}
            <div className="text-center lg:text-left space-y-4">
              <h1 className="text-5xl lg:text-7xl font-black font-display tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                Teacher Magic
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Unlock AI-powered tools for effortless planning, insights, and resources.
              </p>
            </div>

            {/* Three Vertical Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Card 1: AI Edu-Tools Architect */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                className="p-5 rounded-3xl border-2 border-emerald-500/30 bg-[#0d1225]/80 shadow-[0_0_20px_rgba(16,185,129,0.1)] text-left flex flex-col justify-between h-full group hover:border-emerald-400 transition-all duration-300"
              >
                <div className="space-y-4 w-full">
                  {/* Custom Icon Wrapper */}
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform">
                    <Sparkles size={22} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white font-display group-hover:text-emerald-300 transition-colors leading-tight">
                      AI Edu-Tools Architect
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      CAPS-aligned curriculum planning & school administration.
                    </p>
                  </div>
                  
                  {/* Submenu Options */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect('teaching');
                      }}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left flex items-start gap-2.5 group/opt cursor-pointer outline-none"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/opt:scale-105 transition-transform shrink-0">
                        <FlaskConical size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover/opt:text-emerald-300 transition-colors leading-tight">Content Studio</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Lesson & worksheet builder</p>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect('grade1');
                      }}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left flex items-start gap-2.5 group/opt cursor-pointer outline-none"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/opt:scale-105 transition-transform shrink-0">
                        <Sparkles size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover/opt:text-emerald-300 transition-colors leading-tight">Foundation Hub</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Literacy & numeracy tools (Grades R-3)</p>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect('admin');
                      }}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left flex items-start gap-2.5 group/opt cursor-pointer outline-none"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/opt:scale-105 transition-transform shrink-0">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover/opt:text-emerald-300 transition-colors leading-tight">Admin Lab</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Parent notices & newsletters</p>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: AI Media Wizard */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                className="p-5 rounded-3xl border-2 border-cyan-500/30 bg-[#0d1225]/80 shadow-[0_0_20px_rgba(6,182,212,0.1)] text-left flex flex-col justify-between h-full group hover:border-cyan-400 transition-all duration-300"
              >
                <div className="space-y-4 w-full">
                  {/* Custom Icon Wrapper */}
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform">
                    <Telescope size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white font-display group-hover:text-cyan-300 transition-colors leading-tight">
                      AI Media Wizard
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      Design rich diagrams, illustrations and audio-visual assets.
                    </p>
                  </div>

                  {/* Submenu Options */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect('visual');
                      }}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all text-left flex items-start gap-2.5 group/opt cursor-pointer outline-none"
                    >
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover/opt:scale-105 transition-transform shrink-0">
                        <Palette size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover/opt:text-cyan-300 transition-colors leading-tight">Visual Lab</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Flashcards, charts & posters</p>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect('video');
                      }}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all text-left flex items-start gap-2.5 group/opt cursor-pointer outline-none"
                    >
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover/opt:scale-105 transition-transform shrink-0">
                        <Video size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover/opt:text-cyan-300 transition-colors leading-tight">Video Lab</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">AI teacher avatar video animations</p>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Resource Vault */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                className="p-5 rounded-3xl border-2 border-emerald-500/30 bg-[#0d1225]/80 shadow-[0_0_20px_rgba(16,185,129,0.1)] text-left flex flex-col justify-between h-full group hover:border-emerald-400 transition-all duration-300"
              >
                <div className="space-y-4 w-full">
                  {/* Custom Icon Wrapper */}
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform">
                    <Database size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white font-display group-hover:text-emerald-300 transition-colors leading-tight">
                      Resource Vault
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      Manage generated worksheets, materials and illustrations.
                    </p>
                  </div>

                  {/* Submenu Options */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect('archive');
                      }}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left flex items-start gap-2.5 group/opt cursor-pointer outline-none"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/opt:scale-105 transition-transform shrink-0">
                        <Archive size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover/opt:text-emerald-300 transition-colors leading-tight">Content Archive</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Retrieve lesson notes & exams</p>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect('illustrations');
                      }}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left flex items-start gap-2.5 group/opt cursor-pointer outline-none"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/opt:scale-105 transition-transform shrink-0">
                        <BookOpen size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover/opt:text-emerald-300 transition-colors leading-tight">Illustration Library</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">Browse book visuals & assets</p>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Bottom links matching screenshot */}
            <div className="flex flex-wrap justify-center lg:justify-end items-center gap-6 text-sm font-black text-cyan-400 uppercase tracking-widest pt-4">
              <button 
                onClick={() => onSelect('teaching')}
                className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 bg-transparent border-0 outline-none font-bold"
              >
                <span>Get Started for Free</span>
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>

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
