import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

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
      { color: 'text-brand-cyan', bg: 'bg-[#00d2ff]/10', border: 'border-[#00d2ff]/10 shadow-cyan-500/5' },
      { color: 'text-brand-purple', bg: 'bg-[#8e44ad]/10', border: 'border-[#8e44ad]/10 shadow-purple-500/5' },
      { color: 'text-brand-yellow', bg: 'bg-[#ffdf40]/10', border: 'border-[#ffdf40]/10 shadow-yellow-500/5' },
      { color: 'text-brand-pink', bg: 'bg-pink-500/10', border: 'border-pink-500/20 shadow-pink-500/5' },
      { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20 shadow-orange-500/5' },
      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20 shadow-emerald-500/5' },
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subTabs.map((item, idx) => {
          const ItemIcon = item.icon;
          const { color, bg, border } = getCardTheme(item.id, idx);
          const desc = item.desc || getRichDescription(item.id, item.label);

          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`group flex flex-col p-8 rounded-[40px] transition-all text-left relative overflow-hidden cursor-pointer border ${border} ${
                isDarkMode 
                  ? 'bg-slate-900/40 hover:bg-slate-900/80 hover:border-white/20' 
                  : 'bg-white hover:bg-slate-50/50 shadow-md hover:shadow-xl border-slate-100'
              } hover:-translate-y-2.5 outline-none`}
            >
              <div className="flex justify-between items-start w-full mb-6 relative">
                <div className={`p-4 rounded-[24px] ${bg} ${color} transition-all duration-300 group-hover:scale-110 shadow-inner`}>
                  <ItemIcon size={28} />
                </div>
                <div className={`opacity-0 group-hover:opacity-100 transition-all ${color} ${bg} p-2.5 rounded-full absolute top-0 right-0`}>
                  <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <h3 className={`text-xl lg:text-2xl font-display font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {item.label}
              </h3>
              <p className={`text-xs lg:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-3`}>
                {desc}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
