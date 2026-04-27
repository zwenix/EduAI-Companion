import React from 'react';
import { Target, BookOpen, CheckCircle, Flame, Star, Brain, Play } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-10 rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col justify-end min-h-[300px]">
         <div className="absolute top-0 right-0 p-8 opacity-20">
           <Brain size={250} />
         </div>
         <div className="relative z-10">
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-yellow-300 mb-4 shadow-sm">
             <Star size={16} /> Welcome back, Learner!
           </motion.div>
           <h2 className="text-5xl font-hand mb-2 tracking-wide text-white">Ready to ace your subjects?</h2>
           <p className="text-xl text-blue-100 font-medium">Your daily streak is <span className="text-yellow-400 font-black">7 Days!</span> Keep it up.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         {[
           { label: 'Mastery Score', value: '84%', icon: Target, color: 'text-emerald-500' },
           { label: 'Modules Complete', value: '12', icon: CheckCircle, color: 'text-indigo-500' },
           { label: 'Current Streak', value: '7', icon: Flame, color: 'text-yellow-500' }
         ].map((stat, i) => (
           <div key={i} className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[32px] shadow-sm flex items-center justify-between`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                <h3 className={`text-3xl font-hand mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} border flex flex-col items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
           </div>
         ))}
      </div>

      <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
         <h3 className={`text-2xl font-hand mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Upcoming Tasks & Revisions</h3>
         <div className="space-y-4">
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5 hover:border-brand-cyan' : 'border-slate-100 bg-slate-50 hover:border-brand-cyan'} flex items-center justify-between transition-colors group cursor-pointer`}>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><BookOpen size={20}/></div>
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Math: Geometry Mock Test</h4>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Practice Assessment Module</p>
                  </div>
               </div>
               <button className={`${isDarkMode ? 'bg-white/10 border-white/20 text-slate-300 hover:text-brand-cyan hover:border-brand-cyan' : 'bg-white border-slate-200 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan'} shadow-sm border p-2 rounded-full transition-colors`}><Play size={20} className="fill-current"/></button>
            </div>
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5 hover:border-brand-cyan' : 'border-slate-100 bg-slate-50 hover:border-brand-cyan'} flex items-center justify-between transition-colors group cursor-pointer`}>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center"><Star size={20}/></div>
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Life Sciences: Genetics Notes</h4>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Study Notes & Revision</p>
                  </div>
               </div>
               <button className={`${isDarkMode ? 'bg-white/10 border-white/20 text-slate-300 hover:text-brand-cyan hover:border-brand-cyan' : 'bg-white border-slate-200 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan'} shadow-sm border p-2 rounded-full transition-colors`}><Play size={20} className="fill-current"/></button>
            </div>
         </div>
      </div>
    </div>
  );
}
