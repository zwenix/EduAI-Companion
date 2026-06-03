import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, School, Activity, Server, FileText, Calendar,
  Terminal, Bug, RefreshCw, Trash2, AlertTriangle, CheckCircle, Copy, ChevronDown, ChevronUp 
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'system' | 'debug'>('system');
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/debug-errors");
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors || []);
      }
    } catch (err) {
      console.error("Failed to fetch debug errors:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = async () => {
    try {
      const res = await fetch("/api/admin/debug-errors/clear", { method: "POST" });
      if (res.ok) {
        setErrors([]);
        setConfirmClear(false);
      }
    } catch (err) {
      console.error("Failed to clear debug errors:", err);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const handleCopy = (id: string, obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredErrors = providerFilter === 'all' 
    ? errors 
    : errors.filter((err: any) => err.provider === providerFilter);

  // Group count for visual reference
  const getProviderBadgeStyle = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/25';
      case 'qwen-primary':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'qwen-secondary':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-10 rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between min-h-[200px] gap-6">
        <div className="relative z-10">
          <h2 className="text-4xl font-hand mb-2 tracking-wide text-white">System Administration</h2>
          <p className="text-lg text-slate-300 font-medium">Manage deployment, system health, and school configurations.</p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-3">
          <button 
            onClick={() => setActiveTab('system')}
            className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 border shadow-lg ${
              activeTab === 'system'
                ? 'bg-brand-cyan text-slate-900 border-brand-cyan scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Activity size={16} /> System Operations
          </button>
          <button 
            onClick={() => setActiveTab('debug')}
            className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 border shadow-lg ${
              activeTab === 'debug'
                ? 'bg-brand-cyan text-slate-900 border-brand-cyan scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <Terminal size={16} /> Debug Console
            {errors.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {errors.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'system' ? (
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Users', value: '3,492', icon: Users, color: 'text-blue-400' },
              { label: 'System Health', value: '99.9%', icon: Activity, color: 'text-emerald-400' },
              { label: 'Classes', value: '86', icon: School, color: 'text-indigo-400' },
              { label: 'API Status', value: errors.length > 0 ? 'Errors Buffered' : 'Optimal', icon: Server, color: errors.length > 0 ? 'text-amber-500' : 'text-brand-cyan' }
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

          {/* Recharts System Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm flex flex-col`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>User Growth Trends</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
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

            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm flex flex-col`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Resource Utilization</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
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

          {/* Recent Logs & Quick Actions */}
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
        </>
      ) : (
        /* Debug Console Tab */
        <div className="space-y-6">
          {/* Explanation panel */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm space-y-2`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                <Bug size={24} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>AI Provider Live Failures Diagnostic</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Captures real-time network request errors and API exceptions triggered from AI models inside server routing.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[28px]`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Captured Errors</p>
              <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
                <AlertTriangle size={20} className={errors.length > 0 ? "text-amber-500 animate-bounce" : "text-emerald-500"} />
                {errors.length} / 50 <span className="text-xs font-normal text-slate-400">buffered</span>
              </h3>
            </div>
            
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[28px]`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Current Filter</p>
              <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'} uppercase font-mono`}>
                {providerFilter}
              </h3>
            </div>

            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[28px] flex flex-col justify-between`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Diagnostic Actions</p>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={fetchErrors}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-cyan hover:bg-brand-cyan/80 text-slate-900 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
                {confirmClear ? (
                  <div className="flex gap-1.5 items-center">
                    <button 
                      onClick={clearErrors} 
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      Confirm Clear
                    </button>
                    <button 
                      onClick={() => setConfirmClear(false)} 
                      className="px-2 py-2 rounded-xl text-xs font-medium border border-slate-300 dark:border-white/10 text-slate-500 hover:text-slate-700 dark:text-slate-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmClear(true)}
                    disabled={errors.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 dark:text-white text-slate-700 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Trash2 size={13} />
                    Clear Buffer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filtering Tab Pills */}
          <div className="flex flex-wrap gap-2 pb-2">
            {['all', 'gemini', 'qwen-primary', 'qwen-secondary'].map((prov) => {
              const count = prov === 'all' 
                ? errors.length 
                : errors.filter(e => e.provider === prov).length;
              return (
                <button
                  key={prov}
                  onClick={() => setProviderFilter(prov)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                    providerFilter === prov
                      ? 'bg-brand-cyan text-slate-900 border-brand-cyan'
                      : isDarkMode 
                        ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {prov.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          {/* Main Error Log output */}
          <div className="space-y-4">
            {filteredErrors.length === 0 ? (
              <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-12 rounded-[36px] text-center space-y-4`}>
                <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
                  <CheckCircle size={36} />
                </div>
                <h4 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>All Systems Nominal</h4>
                <p className={`text-slate-400 max-w-md mx-auto text-sm leading-normal`}>
                  No server-side AI provider failures have been logged in the diagnostic memory buffer for {providerFilter === 'all' ? 'any provider' : `provider [${providerFilter}]`}.
                </p>
                <button
                  onClick={fetchErrors}
                  className="px-5 py-2.5 rounded-full bg-brand-cyan hover:bg-brand-cyan/80 text-slate-900 font-bold text-xs shadow transition-all"
                >
                  Check Live Status
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredErrors.map((err) => {
                  const isExpanded = expandedId === err.id;
                  return (
                    <div 
                      key={err.id}
                      className={`border transition-all duration-200 rounded-3xl overflow-hidden ${
                        isDarkMode 
                          ? 'bg-slate-900/60 border-white/10 hover:border-white/20' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Accordion header click wrapper */}
                      <div 
                        onClick={() => setExpandedId(isExpanded ? null : err.id)}
                        className="p-5 flex items-center justify-between cursor-pointer select-none gap-4 hover:bg-slate-500/5 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`p-2 rounded-2xl border text-xs font-mono font-bold tracking-wide uppercase ${getProviderBadgeStyle(err.provider)}`}>
                            {err.provider}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`font-bold text-sm tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                              {err.error}
                            </h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono bg-slate-500/10 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                                {err.endpoint}
                              </span>
                              &bull;
                              <span>
                                {new Date(err.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(err.id, err);
                            }}
                            className={`p-2.5 rounded-xl border transition-all ${
                              copiedId === err.id 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                            title="Copy error details as JSON"
                          >
                            {copiedId === err.id ? <CheckCircle size={15} /> : <Copy size={15} />}
                          </button>
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Accordion detail pane */}
                      {isExpanded && (
                        <div className={`p-6 border-t border-dashed space-y-5 text-sm ${
                          isDarkMode ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50/50'
                        }`}>
                          {/* Request parameters brief box */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Request Model Context</span>
                              <div className={`p-3 rounded-2xl font-mono text-xs ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} text-slate-300 font-bold`}>
                                {err.model || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Method Timestamp</span>
                              <div className={`p-3 rounded-2xl font-mono text-xs ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} text-slate-300`}>
                                {new Date(err.timestamp).toString()}
                              </div>
                            </div>
                          </div>

                          {/* Request Payload Summary */}
                          {err.requestPayload && (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Sanitized Payload</span>
                              <pre className={`p-4 rounded-2xl font-mono text-xs overflow-x-auto text-cyan-400 ${
                                isDarkMode ? 'bg-black/40' : 'bg-slate-900'
                              }`}>
                                {JSON.stringify(err.requestPayload, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Raw response view */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Raw Stack / JSON Response</span>
                              <button
                                onClick={() => handleCopy(err.id, err.rawResponse)}
                                className="text-xs text-brand-cyan hover:underline hover:text-brand-cyan/80 flex items-center gap-1 font-bold"
                              >
                                <Copy size={12} /> Copy Raw Output
                              </button>
                            </div>
                            <pre className={`p-4 rounded-2xl font-mono text-xs overflow-x-auto text-rose-400 ${
                              isDarkMode ? 'bg-black/40' : 'bg-slate-900'
                            } max-h-[300px] overflow-y-auto`}>
                              {typeof err.rawResponse === 'object' 
                                ? JSON.stringify(err.rawResponse, null, 2) 
                                : String(err.rawResponse)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
