import React from 'react';
import { ShieldAlert, Users, School, Activity, Server, FileText, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const userGrowthData = [
  { name: 'Jan', students: 1200, teachers: 80 },
  { name: 'Feb', students: 1400, teachers: 85 },
  { name: 'Mar', students: 1600, teachers: 95 },
  { name: 'Apr', students: 2100, teachers: 110 },
  { name: 'May', students: 2800, teachers: 130 },
  { name: 'Jun', students: 3200, teachers: 142 },
];

const resourceData = [
  { name: 'Database', value: 400 },
  { name: 'Storage', value: 300 },
  { name: 'API Compute', value: 300 },
  { name: 'Bandwidth', value: 200 },
];
const COLORS = ['#06b6d4', '#10b981', '#6366f1', '#f59e0b'];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: User Growth */}
        <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm flex flex-col`}>
          <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>User Growth Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke={isDarkMode ? '#475569' : '#94a3b8'} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis stroke={isDarkMode ? '#475569' : '#94a3b8'} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a', borderRadius: '16px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="students" stroke="#06b6d4" fillOpacity={1} fill="url(#colorStudents)" name="Students" />
                <Area type="monotone" dataKey="teachers" stroke="#6366f1" fillOpacity={1} fill="url(#colorTeachers)" name="Educators" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Resource Utilization */}
        <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm flex flex-col`}>
          <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Resource Utilization</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a', borderRadius: '16px' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
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
            <div className={`p-8 rounded-[36px] shadow-lg ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-800' } text-white h-full`}>
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
