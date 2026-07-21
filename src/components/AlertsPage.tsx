import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Filter, 
  BookOpen, 
  Sparkles, 
  CornerDownRight, 
  ArrowLeft 
} from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'caps' | 'student' | 'system';
  resolved: boolean;
  actionLabel?: string;
  actionTab?: string;
  actionCategory?: string;
}

interface AlertsPageProps {
  isDarkMode: boolean;
  onNavigate: (tabId: string, categoryId?: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const initialAlerts: AlertItem[] = [
  {
    id: '1',
    title: 'CAPS Curriculum Alignment Drift',
    message: 'Mathematics Term 3 Grade 7 fractions coverage is falling behind the ATP (Annual Teaching Plan) by 2 days.',
    timestamp: '10 mins ago',
    severity: 'critical',
    category: 'caps',
    resolved: false,
    actionLabel: 'Adjust ATP Pacing',
    actionTab: 'curriculum',
    actionCategory: 'class-analytics'
  },
  {
    id: '2',
    title: 'Student Assitance Required',
    message: 'Sibusiso Gumede has failed the "Equations Rocketry" quest 3 consecutive times. High risk of concept misunderstanding.',
    timestamp: '45 mins ago',
    severity: 'critical',
    category: 'student',
    resolved: false,
    actionLabel: 'Assign Remedial Lesson',
    actionTab: 'teaching',
    actionCategory: 'lesson-planning'
  },
  {
    id: '4',
    title: 'CAPS Grade 4 Resource Outdated',
    message: 'The Natural Sciences "Indigenous Plants" lesson plan needs term verification against new CAPS curriculum guidelines.',
    timestamp: '5 hours ago',
    severity: 'warning',
    category: 'caps',
    resolved: false,
    actionLabel: 'Re-generate Lesson',
    actionTab: 'teaching',
    actionCategory: 'lesson-planning'
  },
  {
    id: '5',
    title: 'Student Goal Reached',
    message: 'Zama Dlamini completed 100% of Term 2 Grammar revisions with exceptional marks!',
    timestamp: '1 day ago',
    severity: 'info',
    category: 'student',
    resolved: true,
    actionLabel: 'Award Star Badge',
    actionTab: 'class-management',
    actionCategory: 'class-management'
  },
  {
    id: '6',
    title: 'Class Average Warning',
    message: 'The overall average for History Grade 9 on "South African Democracy" has decreased by 4%. Check diagnostics.',
    timestamp: '2 days ago',
    severity: 'warning',
    category: 'student',
    resolved: false,
    actionLabel: 'View Analytics',
    actionTab: 'reports',
    actionCategory: 'class-analytics'
  }
];

export default function AlertsPage({ isDarkMode, onNavigate, triggerToast }: AlertsPageProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'critical' | 'caps' | 'student'>('all');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const notif = d.data();
        return {
          id: d.id,
          title: notif.title || 'System Notification',
          message: notif.message || '',
          timestamp: notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'Just now',
          severity: (notif.message?.includes('manual learner assignment') ? 'critical' : 'info') as AlertItem['severity'],
          category: 'system' as AlertItem['category'],
          resolved: notif.read,
          actionLabel: notif.message?.includes('manual learner assignment') ? 'Assign Learner' : 'View Logs',
          actionTab: 'ocr',
          actionCategory: 'intelligence-ai',
          sortTime: notif.createdAt?.seconds || 0
        };
      });
      
      data.sort((a, b) => b.sortTime - a.sortTime);
      
      setAlerts(prev => {
        // Merge with initial alerts to retain the showcase data
        const initialFiltered = prev.filter(p => initialAlerts.some(i => i.id === p.id));
        return [...data, ...initialFiltered];
      });
    }, (error) => console.error("Notifications snapshot fail:", error));

    return () => unsubscribe();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      // If it's a firebase notification
      if (id.startsWith('notif_')) {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      }
      setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, resolved: true } : alert));
      triggerToast('Alert marked as resolved.', 'success');
    } catch(e) {
      console.warn(e);
    }
  };

  const handleClearAll = async () => {
    try {
      // Mark all firebase notifications as read
      const unread = alerts.filter(a => !a.resolved && a.id.startsWith('notif_'));
      for (const u of unread) {
        await updateDoc(doc(db, 'notifications', u.id), { read: true });
      }
      setAlerts(prev => prev.map(alert => ({ ...alert, resolved: true })));
      triggerToast('All alerts cleared successfully.', 'success');
    } catch(e) {
      console.warn(e);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'unread') return !alert.resolved;
    if (activeFilter === 'critical') return alert.severity === 'critical' && !alert.resolved;
    if (activeFilter === 'caps') return alert.category === 'caps';
    if (activeFilter === 'student') return alert.category === 'student';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer mr-1 border-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-2xl font-black font-display text-white tracking-tight flex items-center gap-2.5">
              <span>Alerts & Notifications Command Center</span>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-black animate-pulse">
                {unreadCount} Active
              </span>
            </h1>
          </div>
          <p className="text-slate-400 text-xs font-medium pl-9">
            Monitor CAPS curriculum alignment gaps, student performance alerts, and auto-grading feedback.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleClearAll}
            className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-all border border-white/10 cursor-pointer self-start sm:self-auto"
          >
            Mark All Resolved
          </button>
        )}
      </div>

      {/* Filter Tabs Grid */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: 'Unresolved Alerts' },
          { id: 'critical', label: '🔴 Critical Flags' },
          { id: 'caps', label: '🇿🇦 CAPS Compliance' },
          { id: 'student', label: '👥 Student Care' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 rounded-[32px] border border-white/5 bg-[#0c1225]/50 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckCircle2 size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white font-display">Sky Clear of Anomalies</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Excellent work! All student performances are stable, and your CAPS curriculum pacing is perfectly aligned with ATP standards.
                </p>
              </div>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              
              return (
                <motion.div
                  layout
                  key={alert.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`p-6 rounded-[32px] border-2 bg-[#0c1225]/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden ${
                    alert.resolved 
                      ? 'border-white/5 opacity-55' 
                      : isCritical 
                        ? 'border-pink-500/30 hover:border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                        : isWarning 
                          ? 'border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                          : 'border-cyan-500/25 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Category Side accent */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                    isCritical ? 'bg-pink-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
                  }`} />

                  {/* Left content block */}
                  <div className="flex items-start gap-4 pl-2">
                    <div className={`p-3.5 rounded-2xl shrink-0 mt-0.5 border ${
                      isCritical 
                        ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' 
                        : isWarning 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    }`}>
                      {alert.category === 'caps' ? (
                        <BookOpen size={20} />
                      ) : alert.category === 'student' ? (
                        <ShieldAlert size={20} />
                      ) : (
                        <Bell size={20} />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-black font-display tracking-tight ${alert.resolved ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {alert.title}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-500 font-mono">
                          {alert.timestamp}
                        </span>
                        {alert.category === 'caps' && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase text-blue-400 tracking-wider">
                            CAPS Compliance
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed max-w-2xl font-semibold ${alert.resolved ? 'text-slate-500' : 'text-slate-300'}`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions Block */}
                  <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end pl-14 md:pl-0 border-t border-white/5 pt-3 md:pt-0 md:border-0">
                    {alert.actionLabel && !alert.resolved && (
                      <button
                        onClick={() => {
                          if (alert.actionTab) {
                            onNavigate(alert.actionTab, alert.actionCategory);
                            triggerToast(`Redirecting to resolve: ${alert.title}`, 'info');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/25 text-cyan-300 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles size={12} />
                        <span>{alert.actionLabel}</span>
                      </button>
                    )}

                    {!alert.resolved ? (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 text-slate-400 text-xs font-bold transition-all cursor-pointer"
                        title="Mark Resolved"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 px-3">
                        <CheckCircle2 size={12} />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
