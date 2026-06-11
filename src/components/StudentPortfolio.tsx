import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Star, BookOpen, Clock, FileText, Video, Trophy, Filter, X, Zap, Target } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface PortfolioItem {
  id: string;
  title: string;
  type: 'project' | 'assignment' | 'assessment' | 'achievement';
  subject: string;
  capsAlignment: string;
  date: string;
  grade: string;
  feedback?: string;
  icon: any;
  color: string;
  featured?: boolean;
}

const DEFAULT_ITEMS: PortfolioItem[] = [
  {
    id: '1',
    title: 'Solar System Diorama & Report',
    type: 'project',
    subject: 'Natural Sciences',
    capsAlignment: 'Term 4: Planet Earth and Beyond',
    date: '12 Nov 2026',
    grade: '95%',
    feedback: 'Outstanding attention to detail and excellent understanding of planetary orbits.',
    icon: Star,
    color: 'from-amber-400 to-orange-500',
    featured: true
  },
  {
    id: '2',
    title: 'Fractions & Decimals Mastery Test',
    type: 'assessment',
    subject: 'Mathematics',
    capsAlignment: 'Term 2: Numbers, Operations and Relationships',
    date: '05 Oct 2026',
    grade: '100%',
    feedback: 'Perfect score. You showed excellent logical progression in your working out.',
    icon: Target,
    color: 'from-emerald-400 to-teal-500',
    featured: true
  },
  {
    id: '3',
    title: 'Creative Writing: The African Fable',
    type: 'assignment',
    subject: 'English Home Language',
    capsAlignment: 'Term 3: Writing and Presenting',
    date: '22 Aug 2026',
    grade: '88%',
    feedback: 'Vivid imagery and strong narrative structure. Great use of metaphors.',
    icon: FileText,
    color: 'from-indigo-400 to-blue-500'
  },
  {
    id: '4',
    title: 'Top Achiever: Term 1',
    type: 'achievement',
    subject: 'General',
    capsAlignment: 'Academic Excellence',
    date: '30 Mar 2026',
    grade: 'Gold',
    icon: Trophy,
    color: 'from-yellow-300 to-yellow-500',
    featured: true
  },
  {
    id: '5',
    title: 'Data Collection & Bar Graphs',
    type: 'assignment',
    subject: 'Mathematics',
    capsAlignment: 'Term 1: Data Handling',
    date: '14 Feb 2026',
    grade: '92%',
    icon: FileText,
    color: 'from-indigo-400 to-blue-500'
  }
];

export default function StudentPortfolio({ isDarkMode }: { isDarkMode: boolean }) {
  const [items, setItems] = useState<PortfolioItem[]>(DEFAULT_ITEMS);
  const [filter, setFilter] = useState<string>('All');
  
  const subjects = ['All', 'Mathematics', 'Natural Sciences', 'English Home Language', 'General'];

  const filteredItems = items.filter(item => filter === 'All' || item.subject === filter);
  
  const featuredItems = items.filter(item => item.featured);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Hero Section */}
      <div className={cn(
        "relative rounded-[36px] p-8 lg:p-12 overflow-hidden text-white flex flex-col justify-end min-h-[300px] border shadow-2xl",
        isDarkMode ? "bg-[#0B1122] border-white/10" : "bg-slate-900 border-slate-800"
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
           <Award size={200} />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
        
        <div className="relative z-10 max-w-3xl">
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-emerald-300 mb-6 shadow-sm">
             <Trophy size={16} className="text-emerald-400" /> Academic Portfolio
           </motion.div>
           <h1 className="text-4xl lg:text-6xl font-hand tracking-wide leading-tight mb-4 drop-shadow-md">
             My Hall of <span className="text-brand-cyan">Brilliance</span>
           </h1>
           <p className="text-slate-300 font-medium text-sm lg:text-base leading-relaxed max-w-lg">
             A curated collection of your best work, projects, and achievements, fully aligned strictly with the CAPS curriculum.
           </p>
        </div>
      </div>

      {/* Featured Showcase */}
      {featuredItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Star className="text-yellow-400" size={20} fill="currentColor" />
            <h2 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-slate-800")}>Featured Highlights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "rounded-[32px] p-6 lg:p-8 relative overflow-hidden shadow-xl border hover:scale-[1.02] transition-all group cursor-pointer flex flex-col",
                  isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                )}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-20 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110`} />
                
                <div className="relative z-10 flex-1">
                  <div className={cn("inline-block p-3 rounded-2xl mb-4 bg-gradient-to-br shadow-inner", item.color)}>
                    <item.icon size={24} className="text-white" />
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-[9px] uppercase tracking-widest font-black text-brand-cyan mb-1 block">
                      {item.type} • {item.subject}
                    </span>
                    <h3 className={cn("text-xl font-bold leading-tight", isDarkMode ? "text-white" : "text-slate-900")}>
                      {item.title}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md", isDarkMode ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500")}>
                      {item.capsAlignment}
                    </span>
                  </div>
                </div>
                
                <div className={cn("relative z-10 mt-6 pt-4 border-t flex justify-between items-end", isDarkMode ? "border-white/10" : "border-slate-100")}>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Score / Award</p>
                    <p className={cn("text-2xl font-black", item.type === 'achievement' ? "text-yellow-500" : "text-emerald-500")}>
                      {item.grade}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Full Library & Filtering */}
      <div className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className={cn("text-2xl font-hand px-2", isDarkMode ? "text-white" : "text-slate-800")}>Complete Portfolio</h2>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 custom-scrollbar">
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => setFilter(subj)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  filter === subj
                    ? "bg-brand-cyan text-navy-dark shadow-lg shadow-cyan-500/20"
                    : isDarkMode 
                      ? "bg-white/5 text-slate-400 hover:bg-white/10" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[32px] p-2 overflow-hidden shadow-sm">
           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse min-w-[600px]">
               <thead>
                 <tr className={isDarkMode ? "border-b border-white/10" : "border-b border-slate-200"}>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Activity</th>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Subject & CAPS</th>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Date</th>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Result</th>
                 </tr>
               </thead>
               <tbody>
                 <AnimatePresence>
                   {filteredItems.map((item, i) => (
                     <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key={item.id}
                        className={cn(
                          "group transition-all hover:bg-brand-cyan/5",
                          isDarkMode ? "border-b border-white/5 last:border-0" : "border-b border-slate-100 last:border-0"
                        )}
                     >
                       <td className="p-4">
                         <div className="flex items-center gap-3">
                           <div className={cn("p-2 rounded-lg bg-gradient-to-br", item.color)}>
                             <item.icon size={16} className="text-white" />
                           </div>
                           <div>
                             <p className={cn("text-sm font-bold leading-tight", isDarkMode ? "text-white" : "text-slate-800")}>{item.title}</p>
                             <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{item.type}</p>
                           </div>
                         </div>
                       </td>
                       <td className="p-4">
                         <p className={cn("text-xs font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{item.subject}</p>
                         <p className="text-[10px] text-slate-500 truncate max-w-[200px] mt-1">{item.capsAlignment}</p>
                       </td>
                       <td className="p-4 text-xs tracking-wider text-slate-400">{item.date}</td>
                       <td className="p-4">
                         <span className={cn(
                           "px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg flex items-center w-fit",
                           item.type === 'achievement' 
                             ? "bg-yellow-500/20 text-yellow-500" 
                             : "bg-emerald-500/20 text-emerald-500"
                         )}>
                           {item.grade}
                         </span>
                       </td>
                     </motion.tr>
                   ))}
                   {filteredItems.length === 0 && (
                     <tr>
                       <td colSpan={4} className="p-12 text-center text-slate-500 text-sm">
                         No portfolio items found for this subject.
                       </td>
                     </tr>
                   )}
                 </AnimatePresence>
               </tbody>
             </table>
           </div>
        </div>
      </div>
      
    </div>
  );
}
