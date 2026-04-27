import React from 'react';
import { Users, TrendingUp, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function ParentDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-10 rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col justify-end min-h-[250px]">
         <div className="absolute top-0 right-0 p-8 opacity-20">
           <Users size={200} />
         </div>
         <div className="relative z-10">
           <h2 className="text-4xl font-hand mb-2 tracking-wide text-white">Parent Portal</h2>
           <p className="text-xl text-green-100 font-medium">Stay updated on your child's academic journey.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm space-y-6`}>
          <h3 className={`text-2xl font-hand flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><TrendingUp className="text-emerald-500"/> Recent Progress Reports</h3>
          <div className="space-y-4">
             <div className={`p-4 border rounded-2xl relative overflow-hidden ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Mathematics</h4>
                  <span className="text-emerald-500 font-black">A- (85%)</span>
                </div>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Term 2 Assessment. Great improvement in geometry.</p>
             </div>
             <div className={`p-4 border rounded-2xl relative overflow-hidden ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Physical Sciences</h4>
                  <span className="text-yellow-500 font-black">B (71%)</span>
                </div>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Needs focus on Chemistry practicals.</p>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
            <h3 className={`text-2xl font-hand flex items-center gap-2 mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><MessageSquare className="text-indigo-500"/> Messages from Teachers</h3>
            <div className={`p-4 rounded-2xl flex gap-4 ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
               <AlertCircle className="text-indigo-500 shrink-0 mt-1"/>
               <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>Parent-Teacher Meeting next week</h4>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-700'}`}>Please schedule your slot via the communicator tab for next Thursday afternoon.</p>
               </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
            <h3 className={`text-2xl font-hand flex items-center gap-2 mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><Calendar className="text-rose-500"/> Upcoming Assignments</h3>
            <ul className="space-y-3">
               <li className={`flex justify-between text-sm items-center border-b pb-2 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                 <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>English Essay Final Draft</span>
                 <span className="text-xs font-bold text-rose-500">Tomorrow</span>
               </li>
               <li className="flex justify-between text-sm items-center pb-2">
                 <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>History Project</span>
                 <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>In 3 Days</span>
               </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
