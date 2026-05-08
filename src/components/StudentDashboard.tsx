import React from 'react';
import { Target, BookOpen, CheckCircle, Flame, Star, Brain, Play } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-10 rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col justify-end min-h-[350px]">
         <div className="absolute top-0 right-0 p-8 opacity-20">
           <Brain size={250} />
         </div>
         <div className="relative z-10">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-yellow-300 mb-4 shadow-sm">
              <Star size={16} className="animate-pulse" /> Welcome back, Discovery Cadet! 🚀
            </motion.div>
            <h2 className="text-5xl lg:text-7xl font-hand mb-2 tracking-wide text-white drop-shadow-lg leading-tight">Ready for your <br/> next mission?</h2>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1 bg-white/20 h-4 rounded-full overflow-hidden border border-white/10">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: '65%' }}
                   transition={{ duration: 1.5, delay: 0.5, type: 'spring' }}
                   className="h-full bg-yellow-400 shadow-[0_0_15px_#facc15]" 
                 />
              </div>
              <span className="text-sm font-black text-white whitespace-nowrap uppercase tracking-widest text-[10px]">Level 12 • 65%</span>
            </div>
            <p className="text-lg text-blue-100 font-medium mt-4 group">Your learning path is glowing! <span className="text-yellow-400 font-black inline-block animate-bounce ml-1">7 Day Streak! 🔥</span></p>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         {[
           { label: 'Mastery Score', value: '84%', icon: Target, color: 'text-emerald-500' },
           { label: 'Modules Complete', value: '12', icon: CheckCircle, color: 'text-indigo-500' },
           { label: 'Current Streak', value: '7', icon: Flame, color: 'text-yellow-500' }
         ].map((stat, i) => (
           <div key={i} className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[32px] shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all`}>
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
         <h3 className={`text-2xl font-hand mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Upcoming Tasks & Missions</h3>
         <div className="space-y-4">
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5 hover:border-brand-cyan' : 'border-slate-100 bg-slate-50 hover:border-brand-cyan'} flex items-center justify-between transition-colors group cursor-pointer shadow-sm`}>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center shadow-inner"><BookOpen size={20}/></div>
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Math: Geometry Adventure</h4>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Practice Assessment Module</p>
                  </div>
               </div>
               <button className={`${isDarkMode ? 'bg-white/10 border-white/20 text-slate-300 hover:text-brand-cyan hover:border-brand-cyan' : 'bg-white border-slate-200 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan'} shadow-lg border p-2.5 rounded-full transition-all group-hover:scale-110 active:scale-95`}><Play size={20} className="fill-current"/></button>
            </div>
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5 hover:border-brand-cyan' : 'border-slate-100 bg-slate-50 hover:border-brand-cyan'} flex items-center justify-between transition-colors group cursor-pointer shadow-sm`}>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-inner"><Star size={20}/></div>
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Life Sciences: Genetics Discovery</h4>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Study Notes & Revision</p>
                  </div>
               </div>
               <button className={`${isDarkMode ? 'bg-white/10 border-white/20 text-slate-300 hover:text-brand-cyan hover:border-brand-cyan' : 'bg-white border-slate-200 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan'} shadow-lg border p-2.5 rounded-full transition-all group-hover:scale-110 active:scale-95`}><Play size={20} className="fill-current"/></button>
            </div>
         </div>
      </div>
    </div>
  );
}
