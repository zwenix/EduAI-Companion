import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, BookOpen, Award, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';

const DATA = [
  { name: 'Term 1', math: 65, sci: 70, eng: 80 },
  { name: 'Term 2', math: 72, sci: 75, eng: 82 },
  { name: 'Term 3', math: 80, sci: 85, eng: 88 },
  { name: 'Term 4', math: 85, sci: 92, eng: 90 },
];

export default function ProgressReports() {
  return (
    <div className="space-y-8 pb-20 custom-scrollbar">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-[10px] text-brand-cyan font-black uppercase tracking-[0.3em] mb-2">📊 Analytics Unit</p>
          <h2 className="text-4xl font-hand text-white">Progress Reports</h2>
        </div>
        <div className="flex gap-4">
          <button className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Download PDF
          </button>
          <button className="bg-brand-cyan text-navy-dark px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20">
            Send to Parents
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-[48px] border border-white/5 h-[400px]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Academic Performance Baseline</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B1122', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="math" stroke="#06B6D4" strokeWidth={4} dot={{ r: 6, fill: '#06B6D4', strokeWidth: 0 }} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="sci" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 6, fill: '#8B5CF6', strokeWidth: 0 }} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="eng" stroke="#FBBF24" strokeWidth={4} dot={{ r: 6, fill: '#FBBF24', strokeWidth: 0 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-[40px] border border-white/5">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              Highest Growth
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white font-bold">Mathematics</span>
                <span className="text-emerald-400 font-bold">+18%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-brand-cyan w-[75%] rounded-full shadow-[0_0_10px_#06B6D4]"></div>
              </div>
              <p className="text-[10px] text-slate-500">Learners showing significant improvement in Algebra.</p>
            </div>
          </div>

          <div className="glass p-8 rounded-[40px] border border-white/5">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertCircle size={14} className="text-brand-yellow" />
              Attention Required
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-yellow">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-white font-bold">12 Learners</p>
                <p className="text-[10px] text-slate-500">Falling behind in Term 3 Science goals.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Pass Rate', value: '94%', icon: CheckCircle, color: 'text-emerald-400' },
           { label: 'Distinctions', value: '42', icon: Award, color: 'text-brand-yellow' },
           { label: 'Avg Attendance', value: '98%', icon: Clock, color: 'text-brand-cyan' },
           { label: 'SBA Average', value: '68%', icon: BookOpen, color: 'text-purple-400' },
         ].map((stat, i) => (
           <div key={i} className="glass p-7 rounded-[32px] border border-white/5">
              <stat.icon size={20} className={`${stat.color} mb-3`} />
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
              <h4 className="text-3xl font-hand text-white mt-1">{stat.value}</h4>
           </div>
         ))}
      </div>
    </div>
  );
}
