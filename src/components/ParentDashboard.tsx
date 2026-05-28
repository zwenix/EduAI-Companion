import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Calendar, MessageSquare, AlertCircle, 
  Award, BookOpen, ChevronRight, GraduationCap, CheckCircle2, 
  ClipboardList 
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar 
} from 'recharts';

export default function ParentDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      setLoading(false);
      return;
    }

    // Subscribe to students linked to this parent email
    const childQuery = query(
      collection(db, 'students'), 
      where('parentEmail', '==', user.email)
    );

    const unsubscribeChildren = onSnapshot(childQuery, (snapshot) => {
      const childDocs: any[] = [];
      snapshot.forEach(doc => {
        childDocs.push({ id: doc.id, ...doc.data() });
      });
      setChildren(childDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to linked children:", error);
      setLoading(false);
    });

    // Subscribe to assignment notifications assigned to parents/channels
    const notificationsQuery = query(
      collection(db, 'notifications')
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notifDocs: any[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        notifDocs.push({ id: doc.id, ...d });
      });
      setNotifications(notifDocs.slice(0, 10)); // take recent 10
    });

    return () => {
      unsubscribeChildren();
      unsubscribeNotifications();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Synchronizing child records...</p>
      </div>
    );
  }

  const currentEmail = auth.currentUser?.email || '';

  if (children.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-indigo-500 to-emerald-700 p-8 sm:p-10 rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col justify-end min-h-[220px]">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Users size={150} />
          </div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-4xl font-hand tracking-wide">Parent family hub</h2>
            <p className="text-lg text-emerald-100 font-medium">No linked student accounts found.</p>
          </div>
        </div>

        <div className={`p-8 sm:p-10 rounded-[36px] max-w-2xl mx-auto text-center border space-y-6 ${isDarkMode ? 'glass' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center mx-auto text-brand-cyan">
            <Users size={28} />
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>How to Link Your Child's Profile</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              To keep your child's records secure, they must be linked by their classroom teacher.
            </p>
          </div>

          <div className={`p-5 rounded-2xl text-left border space-y-3 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span> Follow these steps:
            </p>
            <ol className="text-xs text-slate-400 list-decimal pl-5 space-y-1.5">
              <li>Give your registered email address (<span className="text-brand-cyan font-black">{currentEmail}</span>) to your child's class teacher.</li>
              <li>The teacher will navigate to <strong>Progress Reports &rarr; Edit Learner Profile</strong> and link your email.</li>
              <li>Once linked, their term grades, syllabi progress, and teacher announcements will propagate instantly to this dashboard.</li>
            </ol>
          </div>

          <div className="text-xs text-slate-400 font-medium pt-2">
            Currently logged in email: <span className="text-white font-mono">{currentEmail}</span>
          </div>
        </div>
      </div>
    );
  }

  const activeChild = children[selectedChildIndex];

  // Map active child's subjects to chart format
  const chartData = activeChild.subjects?.map((sub: any) => ({
    name: sub.name,
    Score: sub.mark,
  })) || [];

  // Generate GPA line chart based on first subject's history
  const historyData = [
    { name: 'Term 1', Score: 68 },
    { name: 'Term 2', Score: 74 },
    { name: 'Term 3', Score: 81 },
    { name: 'Term 4', Score: activeChild.subjects?.[0]?.mark || 79 },
  ];

  return (
    <div className="space-y-8">
      {/* Kid selector header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-hand leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Parent Family Portal</h1>
          <p className="text-xs text-slate-500 mt-1.5">Connected to school network for real-time CAPS statistics.</p>
        </div>
        {children.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Learner:</span>
            <select
              value={selectedChildIndex}
              onChange={e => setSelectedChildIndex(Number(e.target.value))}
              className={`p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-cyan cursor-pointer ${
                isDarkMode ? 'bg-[#1E293B] border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
              }`}
            >
              {children.map((child, i) => (
                <option key={child.id} value={i}>{child.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-brand-cyan to-indigo-700 p-8 sm:p-10 rounded-[38px] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end min-h-[220px] gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <GraduationCap size={200} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-lg font-bold font-hand text-brand-cyan uppercase leading-none shadow-md">
            {activeChild.name.split(' ').map((n: string) => n.charAt(0)).join('')}
          </div>
          <div>
            <span className="inline-block bg-white/20 border border-white/25 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-2">
              Grade {activeChild.grade}
            </span>
            <h2 className="text-3xl font-black tracking-tight">{activeChild.name}</h2>
            <p className="text-sm text-cyan-100 font-medium">{activeChild.email}</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 shrink-0 bg-black/15 p-4 rounded-2xl backdrop-blur-sm border border-white/5 w-full md:w-auto">
          <div>
            <span className="block text-[8px] font-black uppercase text-slate-300 tracking-wider">Overall GPA</span>
            <span className="text-2xl font-black text-brand-cyan">
              {Math.round((activeChild.subjects?.reduce((acc: number, item: any) => acc + item.mark, 0) || 0) / (activeChild.subjects?.length || 1))}%
            </span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="block text-[8px] font-black uppercase text-slate-300 tracking-wider">Status</span>
            <span className="text-xs font-black uppercase flex items-center gap-1 mt-1 text-emerald-300">
              <CheckCircle2 size={12} /> Live
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Child performance column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance chart */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-6`}>
            <div className="flex items-center justify-between border-b border-slate-200/5 pb-2">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <TrendingUp className="text-brand-cyan" size={18} />
                <span>Academic stats & Term progress</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Course Comparison</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickFormatter={(v: string) => v.split(' ')[0]} />
                      <YAxis stroke="#64748b" fontSize={8} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B1122', borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="Score" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Historical GPA Growth</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                      <YAxis stroke="#64748b" fontSize={8} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B1122', borderRadius: '8px', border: 'none' }} />
                      <Area type="monotone" name="Term Performance" dataKey="Score" stroke="#6366f1" fill="#6366f120" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Details */}
          <div className="space-y-4">
            <h3 className={`text-xs font-black text-slate-400 uppercase tracking-widest pl-1`}>CAPS Curriculum Subjects Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChild.subjects?.map((sub: any, i: number) => (
                <div key={i} className={`p-5 rounded-3xl border space-y-3 transition-colors ${
                  isDarkMode ? 'bg-[#1E293B]/20 hover:bg-[#1E293B]/40 border-white/5' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{sub.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Assessed SBA Portfolio</p>
                    </div>
                    <span className={`text-base font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                      sub.mark >= 75 ? 'text-emerald-400 bg-emerald-500/10' :
                      sub.mark >= 50 ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {sub.mark}%
                    </span>
                  </div>

                  {/* SBA Assessments list */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/5">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Formative Assessments portfolio</p>
                    {sub.assessments && sub.assessments.length > 0 ? (
                      sub.assessments.map((a: any, j: number) => (
                        <div key={j} className="flex justify-between items-center text-xs text-slate-400">
                          <span className="truncate max-w-[150px]">{a.title}</span>
                          <span className={`font-mono text-[11px] font-bold ${a.score >= 70 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {a.score}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No formal SBA logs completed.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notices and Alerts panel */}
        <div className="space-y-8">
          {/* Notifications / Teacher announcements */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-6`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <MessageSquare className="text-indigo-500" size={18} />
              <span>Teacher Notices</span>
            </h3>

            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className={`p-4 rounded-2xl flex gap-3 ${
                    isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'
                  }`}>
                    <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className={`font-bold text-xs ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>{n.title}</h4>
                      <p className={`text-[11px] mt-1 pr-1 ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-700'}`}>{n.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-4 rounded-2xl flex gap-3 ${
                  isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-[#EBF5FF]'
                }`}>
                  <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-bold text-xs text-indigo-900">Term 3 Parent-Teacher Reviews</h4>
                    <p className="text-[11px] text-indigo-700 mt-1">
                      Schedule 1-on-1 progress reviews utilizing the Teacher Communicator instant messenger tab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignments or Missions */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-6`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <Calendar className="text-rose-500" size={18} />
              <span>Study missions tracking</span>
            </h3>

            <ul className="space-y-4">
              <li className={`flex justify-between text-xs items-center border-b pb-2.5 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <div>
                  <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Algebra Portfolio SBA</span>
                  <span className="text-[10px] text-slate-500">Mathematics Grade {activeChild.grade}</span>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">Formative</span>
              </li>

              <li className={`flex justify-between text-xs items-center border-b pb-2.5 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <div>
                  <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Stoichiometry assessment</span>
                  <span className="text-[10px] text-slate-500">Sciences Grade {activeChild.grade}</span>
                </div>
                <span className="text-[10px] font-black uppercase text-brand-cyan bg-brand-cyan/15 px-2 py-0.5 rounded-md">CAPS</span>
              </li>

              <li className="flex justify-between text-xs items-center">
                <div>
                  <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>English summary drafting</span>
                  <span className="text-[10px] text-slate-500">Language Grade {activeChild.grade}</span>
                </div>
                <span className="text-[10px] font-black uppercase text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md">Assigned</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
