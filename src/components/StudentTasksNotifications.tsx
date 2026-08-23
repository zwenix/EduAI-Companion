import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  ClipboardList,
  CheckCircle2,
  Clock,
  BookOpen,
  Trophy,
  ArrowRight,
  Check,
  Trash2,
  Star,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { StudentDoc, MilestoneTask } from '../types';
import LoadingMascot from './LoadingMascot';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const formatWhen = (createdAt: any): string => {
  try {
    if (!createdAt) return '';
    const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' • ' + date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function StudentTasksNotifications({
  isDarkMode,
  onNavigate
}: {
  isDarkMode: boolean;
  onNavigate?: (tabId: string, categoryId?: string) => void;
}) {
  const [activeView, setActiveView] = useState<'tasks' | 'notifications'>('tasks');
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [myStudyGroupIds, setMyStudyGroupIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // ── Resolve the logged-in learner's student document ──
  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      const email = user?.email || localStorage.getItem('userEmail') || '';
      if (!email) {
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'students'), where('email', '==', email.toLowerCase().trim()));
      unsubscribeSnap = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setStudent({ ...(docSnap.data() as StudentDoc), id: docSnap.id });
        }
        setLoading(false);
      }, (error) => {
        console.error('Student tasks page snapshot error', error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  // ── Assignments, submissions & study groups ──
  useEffect(() => {
    if (!student?.id) return;

    const unsubAssignments = onSnapshot(query(collection(db, 'assignments')), (snapshot) => {
      setAssignments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error('Error loading assignments', error));

    const unsubSubmissions = onSnapshot(
      query(collection(db, 'submissions'), where('studentId', '==', student.id)),
      (snapshot) => setSubmissions(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => console.error('Error loading submissions', error)
    );

    const unsubGroups = onSnapshot(
      query(collection(db, 'study_groups'), where('members', 'array-contains', student.id)),
      (snapshot) => setMyStudyGroupIds(snapshot.docs.map(d => d.id)),
      (error) => console.error('Error loading groups', error)
    );

    return () => {
      unsubAssignments();
      unsubSubmissions();
      unsubGroups();
    };
  }, [student?.id]);

  // ── Notifications for this account ──
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(data);
    }, (error) => console.error('Notifications snapshot fail:', error));

    return () => unsubscribe();
  }, [student?.id]);

  const myAssignments = useMemo(() => {
    if (!student) return [];
    return assignments.filter(item => {
      if (item.assigneeType === 'all' || item.assigneeId === 'all') return true;
      if (item.assigneeType === 'student' && item.assigneeId === student.id) return true;
      if (item.assigneeType === 'class' && (item.assigneeId === student.grade || item.grade === student.grade)) return true;
      if (item.assigneeType === 'group' && myStudyGroupIds.includes(item.assigneeId)) return true;
      if (item.grade && (item.grade === student.grade || student.grade?.includes(item.grade))) return true;
      if (!item.assigneeType && !item.assigneeId) return true;
      return false;
    });
  }, [assignments, student, myStudyGroupIds]);

  const pendingAssignments = myAssignments.filter(a => !submissions.find(s => s.assignmentId === a.id));
  const completedAssignments = myAssignments.filter(a => submissions.find(s => s.assignmentId === a.id));
  const missions: MilestoneTask[] = student?.idp?.actionPlan || [];
  const pendingMissions = missions.filter(m => m.status !== 'Completed');
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try { await updateDoc(doc(db, 'notifications', id), { read: true }); } catch (e) { /* noop */ }
  };

  const markAllAsRead = async () => {
    try {
      for (const n of notifications.filter(n => !n.read)) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (e) { /* noop */ }
  };

  const removeNotification = async (id: string) => {
    try { await deleteDoc(doc(db, 'notifications', id)); } catch (e) { /* noop */ }
  };

  if (loading) {
    return (
      <LoadingMascot
        message="Fetching your tasks & alerts..."
        subtitle="Collecting assigned work and fresh notifications"
      />
    );
  }

  return (
    <div className="kid-portal space-y-6 animate-in fade-in duration-700">
      {/* Compact header banner */}
      <div
        className="kid-card kid-pop relative p-5 sm:p-6 overflow-hidden"
        style={{ ['--kid-1' as any]: '#EC4899', ['--kid-2' as any]: '#8B5CF6' }}
      >
        <div className="absolute -top-4 -right-2 text-[80px] opacity-20 select-none pointer-events-none kid-bob">🔔</div>
        <div className="relative z-10">
          <h1 className="kid-title text-2xl sm:text-3xl lg:text-4xl font-hand tracking-wide leading-tight">
            Assigned Tasks & Notifications
          </h1>
          <p className="kid-sub text-sm mt-1">
            Everything your teachers have assigned to you, plus all your alerts — in one place.
          </p>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: 'tasks' as const, label: 'Assigned Tasks', icon: ClipboardList, count: pendingAssignments.length + pendingMissions.length },
          { id: 'notifications' as const, label: 'Notifications', icon: Bell, count: unreadCount }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wide border-2 transition-all cursor-pointer',
              activeView === tab.id
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-[1.02]'
                : isDarkMode
                  ? 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-indigo-500/40 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-slate-900'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                'min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-black flex items-center justify-center',
                activeView === tab.id ? 'bg-white text-indigo-600' : 'bg-pink-500 text-white'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'tasks' ? (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Teacher assigned work */}
            <div className="kid-panel" style={{ ['--kid-1' as any]: '#6366F1', ['--kid-2' as any]: '#A855F7' }}>
              <div className="kid-panel-head">
                <div>
                  <h3 className="kid-title text-xl sm:text-2xl font-hand flex items-center gap-2">
                    <span className="kid-bob inline-block">📝</span> Teacher Assigned Tasks
                  </h3>
                  <p className="kid-sub text-[12px] mt-0.5">Worksheets, assessments, and homework from your teachers</p>
                </div>
                <span className="kid-chip hidden sm:inline-flex" style={{ ['--kid-2' as any]: '#6366F1' }}>
                  {pendingAssignments.length} to complete
                </span>
              </div>
              <div className="kid-panel-body space-y-3">
                {myAssignments.length === 0 ? (
                  <div className="text-center p-8 rounded-[24px] border-4 border-dashed border-indigo-300 bg-indigo-50/60">
                    <BookOpen className="mx-auto mb-3 text-indigo-400" size={36} />
                    <p className="font-bold text-indigo-500">No tasks assigned yet — enjoy the free time! 🎉</p>
                  </div>
                ) : (
                  [...pendingAssignments, ...completedAssignments].map((assignment) => {
                    const submission = submissions.find(s => s.assignmentId === assignment.id);
                    const isDone = !!submission;
                    return (
                      <div
                        key={assignment.id}
                        className={cn(
                          'p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center gap-3 transition-all',
                          isDone
                            ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                            : isDarkMode ? 'bg-slate-900/70 border-white/10 hover:border-indigo-500/40' : 'bg-white border-slate-200 hover:border-indigo-300'
                        )}
                      >
                        <div className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                          isDone ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
                        )}>
                          {isDone ? <CheckCircle2 size={22} /> : <ClipboardList size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('font-bold text-sm truncate', isDarkMode ? 'text-white' : 'text-slate-800')}>
                            {assignment.title || 'Untitled Task'}
                          </p>
                          <p className={cn('text-[11px] font-semibold uppercase tracking-wide mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            {assignment.subject || 'General'} • {assignment.grade || 'All Grades'} • from {assignment.teacherName || 'Teacher'}
                            {assignment.createdAt ? ` • ${formatWhen(assignment.createdAt)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isDone ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-black uppercase tracking-wide">
                              <Trophy size={13} />
                              {submission?.totalScore != null ? `Graded • ${submission.totalScore}` : 'Submitted'}
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-500 text-[11px] font-black uppercase tracking-wide">
                                <Clock size={13} /> To Do
                              </span>
                              <button
                                onClick={() => onNavigate && onNavigate('dashboard', 'teacher-dashboard-menu')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer hover:scale-105"
                              >
                                Complete It <ArrowRight size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* IDP mission tasks */}
            <div className="kid-panel" style={{ ['--kid-1' as any]: '#10B981', ['--kid-2' as any]: '#0EA5E9' }}>
              <div className="kid-panel-head">
                <div>
                  <h3 className="kid-title text-xl sm:text-2xl font-hand flex items-center gap-2">
                    <span className="kid-bob inline-block">🎯</span> My Learning Missions
                  </h3>
                  <p className="kid-sub text-[12px] mt-0.5">Action-plan tasks from your Individual Development Plan</p>
                </div>
                <span className="kid-chip hidden sm:inline-flex" style={{ ['--kid-2' as any]: '#10B981' }}>
                  {pendingMissions.length} active
                </span>
              </div>
              <div className="kid-panel-body space-y-3">
                {missions.length === 0 ? (
                  <div className="text-center p-8 rounded-[24px] border-4 border-dashed border-emerald-300 bg-emerald-50/60">
                    <Star className="mx-auto mb-3 text-emerald-400" size={36} />
                    <p className="font-bold text-emerald-500">No missions yet. Your teacher will add development goals soon!</p>
                  </div>
                ) : (
                  missions.map((mission, idx) => (
                    <div
                      key={`${mission.task}-${idx}`}
                      className={cn(
                        'p-4 rounded-2xl border-2 flex items-center gap-3',
                        mission.status === 'Completed'
                          ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                          : isDarkMode ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        mission.status === 'Completed' ? 'bg-emerald-500 text-white' : mission.status === 'In Progress' ? 'bg-sky-500 text-white' : 'bg-slate-400 text-white'
                      )}>
                        {mission.status === 'Completed' ? <Check size={20} /> : <GraduationCap size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-bold text-sm', isDarkMode ? 'text-white' : 'text-slate-800', mission.status === 'Completed' && 'line-through opacity-70')}>
                          {mission.task}
                        </p>
                        <p className={cn('text-[11px] font-semibold uppercase tracking-wide mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                          Milestone: {mission.milestone}
                        </p>
                      </div>
                      <span className={cn(
                        'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide shrink-0',
                        mission.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500'
                          : mission.status === 'In Progress' ? 'bg-sky-500/15 text-sky-500'
                          : 'bg-amber-500/15 text-amber-500'
                      )}>
                        {mission.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="kid-panel" style={{ ['--kid-1' as any]: '#EC4899', ['--kid-2' as any]: '#8B5CF6' }}>
              <div className="kid-panel-head">
                <div>
                  <h3 className="kid-title text-xl sm:text-2xl font-hand flex items-center gap-2">
                    <span className="kid-bob inline-block">🔔</span> My Notifications
                  </h3>
                  <p className="kid-sub text-[12px] mt-0.5">Alerts about new tasks, messages, marks, and school updates</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="kid-btn shrink-0"
                    style={{ ['--kid-1' as any]: '#8B5CF6', ['--kid-2' as any]: '#EC4899' }}
                  >
                    <Check size={13} strokeWidth={3} /> Mark all read
                  </button>
                )}
              </div>
              <div className="kid-panel-body space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center p-8 rounded-[24px] border-4 border-dashed border-pink-300 bg-pink-50/60">
                    <Bell className="mx-auto mb-3 text-pink-400" size={36} />
                    <p className="font-bold text-pink-500">No notifications yet — you're all caught up! ✨</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 rounded-2xl border-2 flex items-start gap-3 transition-all',
                        !notif.read
                          ? isDarkMode ? 'bg-pink-500/10 border-pink-500/30' : 'bg-pink-50 border-pink-200'
                          : isDarkMode ? 'bg-slate-900/70 border-white/10 opacity-80' : 'bg-white border-slate-200 opacity-80'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                        !notif.read ? 'bg-pink-500 text-white' : 'bg-slate-400 text-white'
                      )}>
                        {!notif.read ? <AlertCircle size={20} /> : <Bell size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-bold text-sm', isDarkMode ? 'text-white' : 'text-slate-800')}>
                          {notif.title || 'Notification'}
                          {!notif.read && (
                            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-black uppercase tracking-wider align-middle">New</span>
                          )}
                        </p>
                        <p className={cn('text-xs mt-1 leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                          {notif.message || notif.body || ''}
                        </p>
                        {notif.createdAt && (
                          <p className={cn('text-[10px] font-semibold uppercase tracking-wide mt-1.5', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                            {formatWhen(notif.createdAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            title="Mark as read"
                            className={cn(
                              'p-2 rounded-xl transition-all cursor-pointer',
                              isDarkMode ? 'hover:bg-emerald-500/20 text-emerald-400' : 'hover:bg-emerald-100 text-emerald-600'
                            )}
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notif.id)}
                          title="Delete"
                          className={cn(
                            'p-2 rounded-xl transition-all cursor-pointer',
                            isDarkMode ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-500'
                          )}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
