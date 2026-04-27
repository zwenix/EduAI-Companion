import React from 'react';
import { ShieldAlert, Users, School, Activity, Server, FileText, Calendar } from 'lucide-react';

export default function AdminDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-10 rounded-[36px] text-white shadow-xl relative overflow-hidden flex items-center justify-between min-h-[200px]">
         <div className="relative z-10 w-full flex justify-between items-center">
           <div>
             <h2 className="text-4xl font-hand mb-2 tracking-wide text-white">System Administration</h2>
             <p className="text-lg text-slate-300 font-medium">Manage deployment, system health, and school configurations.</p>
           </div>
           <div className="hidden md:flex gap-4">
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-full font-bold transition-all border border-white/20 flex items-center gap-2">
                 <FileText size={18}/> Generate Official Docs
              </button>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Active Users', value: '3,492', icon: Users, color: 'text-blue-400' },
           { label: 'System Health', value: '99.9%', icon: Activity, color: 'text-emerald-400' },
           { label: 'Classes', value: '86', icon: School, color: 'text-indigo-400' },
           { label: 'API Status', value: 'Optimal', icon: Server, color: 'text-brand-cyan' }
         ].map((stat, i) => (
           <div key={i} className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[28px] shadow-sm`}>
             <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
             </div>
             <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
             <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stat.value}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-6">
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
               <h3 className={`text-2xl font-hand mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><ShieldAlert className="text-rose-500" /> Recent Security & Admin Logs</h3>
               <div className="space-y-4">
                  {[
                    { action: 'New Teacher Account Provisioned', user: 'Admin', time: '10 mins ago', status: 'Success' },
                    { action: 'Bulk Learner Import (Grade 8)', user: 'Admin', time: '1 hour ago', status: 'Success' },
                    { action: 'API Key Rotation (Groq)', user: 'System', time: '5 hours ago', status: 'Warning' },
                  ].map((log, i) => (
                     <div key={i} className={`flex justify-between items-center p-3 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'} last:border-0 text-sm`}>
                        <div>
                          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{log.action}</p>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{log.user}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${log.status === 'Success' ? 'text-emerald-500' : 'text-amber-500'}`}>{log.status}</p>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{log.time}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         <div className="lg:col-span-4 space-y-6">
            <div className={`p-8 rounded-[36px] shadow-lg ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-800' } text-white`}>
               <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
               <div className="space-y-3">
                  <button className="w-full bg-slate-700 hover:bg-slate-600 transition-colors p-4 rounded-2xl text-left font-medium text-sm flex justify-between items-center">
                    Manage Roles <Users size={16}/>
                  </button>
                  <button className="w-full bg-slate-700 hover:bg-slate-600 transition-colors p-4 rounded-2xl text-left font-medium text-sm flex justify-between items-center">
                    School Academic Calendar <Calendar size={16}/>
                  </button>
                  <button className="w-full bg-slate-700 hover:bg-slate-600 transition-colors p-4 rounded-2xl text-left font-medium text-sm flex justify-between items-center">
                    Official Certificates <FileText size={16}/>
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
