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
  GraduationCap,
  Download,
  Upload,
  X,
  FileText,
  Camera,
  Inbox
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
  doc,
  setDoc,
  serverTimestamp
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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionPhoto, setSubmissionPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

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
      if (Array.isArray(item.targetStudentIds) && item.targetStudentIds.includes(student.id)) return true;
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

  // ── Assignment completion workflow ──
  const openAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubmissionPhoto(null);
    setSubmitMessage(null);
    setShowCompletionModal(true);
  };

  const closeAssignment = () => {
    setShowCompletionModal(false);
    setSelectedAssignment(null);
    setSubmissionPhoto(null);
    setSubmitMessage(null);
  };

  const downloadAssignment = (assignment: any) => {
    if (!assignment) return;
    const blob = new Blob([assignment.content || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(assignment.title || 'assignment').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSubmissionPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Submits the learner's work. `method` = 'digital' (finished on app) or 'photo' (OCR).
  const submitAssignment = async (method: 'digital' | 'photo') => {
    if (!selectedAssignment || !student) return;
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const subRef = doc(collection(db, 'submissions'));
      await setDoc(subRef, {
        id: subRef.id,
        assignmentId: selectedAssignment.id,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email || '',
        studentGrade: student.grade || selectedAssignment.grade || '',
        teacherId: selectedAssignment.teacherId || '',
        teacherName: selectedAssignment.teacherName || 'Teacher',
        title: selectedAssignment.title || 'Untitled Task',
        subject: selectedAssignment.subject || 'General',
        grade: selectedAssignment.grade || student.grade || 'All Grades',
        contentType: selectedAssignment.contentType || 'task',
        assignmentTitle: selectedAssignment.title || 'Untitled Task',
        status: 'submitted',
        submissionMethod: method,
        ...(method === 'photo' && submissionPhoto ? { imageDataUrl: submissionPhoto } : {}),
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Mark the assignment's notification as read so the task chip clears.
      const relatedNotif = notifications.find(n => n.assignmentId === selectedAssignment.id);
      if (relatedNotif && !relatedNotif.read) {
        try { await updateDoc(doc(db, 'notifications', relatedNotif.id), { read: true }); } catch (e) { /* noop */ }
      }

      setSubmitMessage(
        method === 'digital'
          ? '✅ Sent to your teacher for marking — great work!'
          : '📸 Photo submitted — your teacher will auto-grade it with OCR.'
      );
      // Refresh local submissions list immediately for snappy UI.
      setSubmissions(prev => prev.some(s => s.assignmentId === selectedAssignment.id)
        ? prev
        : [...prev, { id: subRef.id, assignmentId: selectedAssignment.id, studentId: student.id, status: 'submitted', submittedAt: new Date().toISOString() }]
      );
    } catch (err) {
      console.error('Error submitting work', err);
      setSubmitMessage('⚠️ Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSubmitted = (assignmentId: string) =>
    submissions.some(s => s.assignmentId === assignmentId);

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
                            {assignment.dueDate ? ` • Due ${new Date(assignment.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}` : ''}
                            {assignment.createdAt ? ` • ${formatWhen(assignment.createdAt)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isDone ? (
                            <>
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-black uppercase tracking-wide">
                                <Trophy size={13} />
                                {submission?.totalScore != null ? `Graded • ${submission.totalScore}` : 'Submitted'}
                              </span>
                              <button
                                onClick={() => openAssignment(assignment)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-600/20 text-slate-500 text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer hover:scale-105 hover:bg-indigo-600 hover:text-white"
                              >
                                View <ArrowRight size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-500 text-[11px] font-black uppercase tracking-wide">
                                <Clock size={13} /> To Do
                              </span>
                              <button
                                onClick={() => openAssignment(assignment)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer hover:scale-105"
                              >
                                Open & Complete <ArrowRight size={13} />
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

      {/* ── Assignment completion / submission modal ── */}
      <AnimatePresence>
        {showCompletionModal && selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
            onClick={closeAssignment}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="kid-panel w-full max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden"
              style={{ ['--kid-1' as any]: '#6366F1', ['--kid-2' as any]: '#A855F7' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kid-panel-head">
                <div className="min-w-0">
                  <span className="kid-chip mb-2 inline-flex" style={{ ['--kid-2' as any]: '#6366F1' }}>
                    {selectedAssignment.subject || 'General'} • {selectedAssignment.grade || 'All Grades'}
                  </span>
                  <h3 className="kid-title text-xl sm:text-2xl font-hand truncate">
                    {selectedAssignment.title || 'Untitled Task'}
                  </h3>
                  <p className="kid-sub text-[12px] mt-0.5 truncate">
                    From {selectedAssignment.teacherName || 'Teacher'}
                    {selectedAssignment.dueDate ? ` • Due ${new Date(selectedAssignment.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </p>
                </div>
                <button
                  onClick={closeAssignment}
                  className="shrink-0 w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/40 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="kid-panel-body flex-1 min-h-0 overflow-y-auto space-y-4">
                {/* Read the task content on the app */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 overflow-x-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                    <Inbox size={13} /> Read on the app
                  </p>
                  {selectedAssignment.content ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-800 [&_h1]:text-slate-900 [&_h2]:text-slate-900 [&_h3]:text-slate-900 [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:p-2"
                      dangerouslySetInnerHTML={{ __html: selectedAssignment.content }}
                    />
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <FileText className="mx-auto mb-2" size={32} />
                      <p className="text-sm font-bold">This task has no on-screen content.</p>
                      <p className="text-xs mt-1">Download it below to complete it by hand, or submit a photo.</p>
                    </div>
                  )}
                </div>

                {submitMessage && (
                  <div className="p-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-bold animate-in fade-in duration-300">
                    {submitMessage}
                  </div>
                )}

                {hasSubmitted(selectedAssignment.id) && (
                  <div className="p-3 rounded-2xl border-2 border-indigo-300 bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> You've already submitted this task. You may still download it to complete by hand.
                  </div>
                )}

                {/* Photo upload for OCR auto-grading */}
                <div className="rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-1.5">
                    <Camera size={13} /> Complete by hand & upload for OCR auto-grading
                  </p>
                  <label className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white border border-indigo-200 text-indigo-600 font-black text-xs uppercase tracking-wide cursor-pointer hover:bg-indigo-100 transition-all text-center">
                    <Upload size={16} />
                    {submissionPhoto ? 'Change photo' : 'Upload a photo of your finished work'}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickPhoto} />
                  </label>
                  {submissionPhoto && (
                    <div className="mt-3 flex items-start gap-3">
                      <img src={submissionPhoto} alt="Submitted work" className="w-24 h-24 object-cover rounded-xl border-2 border-indigo-300" />
                      <div className="text-xs text-slate-500 font-semibold">Photo ready — submit to have your teacher auto-grade it with OCR.</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="kid-panel-body border-t border-slate-200 pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => downloadAssignment(selectedAssignment)}
                  className="kid-btn grow"
                  style={{ ['--kid-1' as any]: '#F59E0B', ['--kid-2' as any]: '#F97316' }}
                >
                  <Download size={15} /> Download & print
                </button>
                {!hasSubmitted(selectedAssignment.id) && (
                  <>
                    <button
                      onClick={() => submitAssignment('photo')}
                      disabled={!submissionPhoto || submitting}
                      className="kid-btn grow"
                      style={{ ['--kid-1' as any]: '#10B981', ['--kid-2' as any]: '#0EA5E9' }}
                    >
                      <Camera size={15} /> Upload & submit
                    </button>
                    <button
                      onClick={() => submitAssignment('digital')}
                      disabled={submitting}
                      className="kid-btn grow bg-emerald-600 hover:bg-emerald-500 border-emerald-700/40"
                      style={{ ['--kid-1' as any]: '#10B981', ['--kid-2' as any]: '#059669' }}
                    >
                      <CheckCircle2 size={15} /> I finished it on the app
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
