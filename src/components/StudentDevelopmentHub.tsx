import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Sparkles,
  Target,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
  Clock,
  GraduationCap,
  MessageSquareHeart,
  Compass,
  Star,
  BookOpen,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { StudentDoc, MilestoneTask } from '../types';
import LoadingMascot from './LoadingMascot';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function StudentDevelopmentHub({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeView, setActiveView] = useState<'idp' | 'interventions'>('idp');
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState<any[]>([]);

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
        console.error('Student development snapshot error', error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  // ── Interventions assigned to this learner (by id or by name) ──
  useEffect(() => {
    if (!student?.id) return;

    const merge = (prev: any[], docs: any[]) => {
      const map = new Map<string, any>();
      [...prev, ...docs].forEach(item => map.set(item.id, item));
      return Array.from(map.values());
    };

    const unsubById = onSnapshot(
      query(collection(db, 'interventions'), where('studentId', '==', student.id)),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setInterventions(prev => merge(prev.filter((p: any) => p.__src !== 'id'), docs.map(d => ({ ...d, __src: 'id' }))));
      },
      (error) => console.warn('Interventions (by id) load note:', error)
    );

    const unsubByName = student.name
      ? onSnapshot(
          query(collection(db, 'interventions'), where('learnerName', '==', student.name)),
          (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setInterventions(prev => merge(prev.filter((p: any) => p.__src !== 'name'), docs.map(d => ({ ...d, __src: 'name' }))));
          },
          (error) => console.warn('Interventions (by name) load note:', error)
        )
      : null;

    return () => {
      unsubById();
      if (unsubByName) unsubByName();
    };
  }, [student?.id, student?.name]);

  if (loading) {
    return (
      <LoadingMascot
        message="Opening your development plan..."
        subtitle="Loading your IDP goals, strengths, and support interventions"
      />
    );
  }

  const idp = student?.idp;
  const actionPlan: MilestoneTask[] = idp?.actionPlan || [];
  const completedCount = actionPlan.filter(t => t.status === 'Completed').length;
  const planProgress = actionPlan.length > 0 ? Math.round((completedCount / actionPlan.length) * 100) : 0;

  return (
    <div className="kid-portal space-y-6 animate-in fade-in duration-700">
      {/* Compact header banner */}
      <div
        className="kid-card kid-pop relative p-5 sm:p-6 overflow-hidden"
        style={{ ['--kid-1' as any]: '#10B981', ['--kid-2' as any]: '#6366F1' }}
      >
        <div className="absolute -top-4 -right-2 text-[80px] opacity-20 select-none pointer-events-none kid-bob">🌱</div>
        <div className="relative z-10">
          <h1 className="kid-title text-2xl sm:text-3xl lg:text-4xl font-hand tracking-wide leading-tight">
            Individual Learning Development
          </h1>
          <p className="kid-sub text-sm mt-1">
            Your personal growth plan — IDP goals, strengths, focus areas, and support interventions.
          </p>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: 'idp' as const, label: 'My IDP', icon: Compass },
          { id: 'interventions' as const, label: 'Interventions & Support', icon: HeartHandshake }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wide border-2 transition-all cursor-pointer',
              activeView === tab.id
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg scale-[1.02]'
                : isDarkMode
                  ? 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-emerald-500/40 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-slate-900'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'idp' ? (
          <motion.div
            key="idp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!idp ? (
              <div className="kid-panel" style={{ ['--kid-1' as any]: '#6366F1', ['--kid-2' as any]: '#10B981' }}>
                <div className="kid-panel-body">
                  <div className="text-center p-10 rounded-[24px] border-4 border-dashed border-indigo-300 bg-indigo-50/60">
                    <Compass className="mx-auto mb-3 text-indigo-400" size={40} />
                    <p className="font-bold text-indigo-500">
                      Your Individual Development Plan hasn't been created yet.
                      <br />Your teacher will set it up with you soon!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Progress overview */}
                <div className="kid-panel" style={{ ['--kid-1' as any]: '#0EA5E9', ['--kid-2' as any]: '#10B981' }}>
                  <div className="kid-panel-head">
                    <div>
                      <h3 className="kid-title text-xl sm:text-2xl font-hand flex items-center gap-2">
                        <span className="kid-bob inline-block">🚀</span> Action Plan Progress
                      </h3>
                      <p className="kid-sub text-[12px] mt-0.5">
                        {completedCount} of {actionPlan.length} missions complete
                      </p>
                    </div>
                    <span className="kid-chip hidden sm:inline-flex" style={{ ['--kid-2' as any]: '#0EA5E9' }}>
                      {planProgress}% done
                    </span>
                  </div>
                  <div className="kid-panel-body space-y-4">
                    <div className="kid-track">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${planProgress}%` }}
                        transition={{ duration: 1.2, type: 'spring' }}
                        className="kid-fill"
                      />
                    </div>
                    <div className="space-y-3">
                      {actionPlan.length === 0 ? (
                        <p className={cn('text-sm italic text-center p-4', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                          No action-plan missions yet.
                        </p>
                      ) : (
                        actionPlan.map((task, idx) => (
                          <div
                            key={`${task.task}-${idx}`}
                            className={cn(
                              'p-4 rounded-2xl border-2 flex items-center gap-3',
                              task.status === 'Completed'
                                ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                                : isDarkMode ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
                            )}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                              task.status === 'Completed' ? 'bg-emerald-500 text-white' : task.status === 'In Progress' ? 'bg-sky-500 text-white' : 'bg-slate-400 text-white'
                            )}>
                              {task.status === 'Completed' ? <Check size={20} /> : <Target size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('font-bold text-sm', isDarkMode ? 'text-white' : 'text-slate-800', task.status === 'Completed' && 'line-through opacity-70')}>
                                {task.task}
                              </p>
                              <p className={cn('text-[11px] font-semibold uppercase tracking-wide mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                Milestone: {task.milestone}
                              </p>
                            </div>
                            <span className={cn(
                              'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide shrink-0',
                              task.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500'
                                : task.status === 'In Progress' ? 'bg-sky-500/15 text-sky-500'
                                : 'bg-amber-500/15 text-amber-500'
                            )}>
                              {task.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Strengths / Focus areas / Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    {
                      title: 'My Superpowers',
                      subtitle: 'Strengths',
                      emoji: '💪',
                      icon: Star,
                      items: idp.strengths || [],
                      empty: 'Strengths will appear here soon!',
                      c1: '#10B981', c2: '#0EA5E9'
                    },
                    {
                      title: 'Focus Areas',
                      subtitle: 'Things to level up',
                      emoji: '🎯',
                      icon: TrendingUp,
                      items: idp.weaknesses || [],
                      empty: 'No focus areas listed yet.',
                      c1: '#F59E0B', c2: '#F43F5E'
                    },
                    {
                      title: 'Coach Tips',
                      subtitle: 'Recommendations',
                      emoji: '💡',
                      icon: Lightbulb,
                      items: idp.recommendations || [],
                      empty: 'Recommendations from your teacher will show here.',
                      c1: '#8B5CF6', c2: '#EC4899'
                    }
                  ].map(card => (
                    <div
                      key={card.title}
                      className="kid-panel"
                      style={{ ['--kid-1' as any]: card.c1, ['--kid-2' as any]: card.c2 }}
                    >
                      <div className="kid-panel-head">
                        <div>
                          <h3 className="kid-title text-lg sm:text-xl font-hand flex items-center gap-2">
                            <span className="kid-bob inline-block">{card.emoji}</span> {card.title}
                          </h3>
                          <p className="kid-sub text-[11px] mt-0.5 uppercase tracking-widest font-black">{card.subtitle}</p>
                        </div>
                      </div>
                      <div className="kid-panel-body">
                        {card.items.length === 0 ? (
                          <p className={cn('text-xs italic', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{card.empty}</p>
                        ) : (
                          <ul className="space-y-2.5">
                            {card.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <card.icon size={15} className="mt-0.5 shrink-0" style={{ color: card.c1 }} />
                                <span className={cn('text-[13px] leading-snug font-semibold', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Parent note */}
                {idp.parentNote && (
                  <div className="kid-panel" style={{ ['--kid-1' as any]: '#EC4899', ['--kid-2' as any]: '#F59E0B' }}>
                    <div className="kid-panel-head">
                      <h3 className="kid-title text-lg sm:text-xl font-hand flex items-center gap-2">
                        <span className="kid-bob inline-block">💌</span> Note From Home
                      </h3>
                      <MessageSquareHeart size={22} className="text-pink-400" />
                    </div>
                    <div className="kid-panel-body">
                      <p className={cn('text-sm leading-relaxed italic', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>
                        “{idp.parentNote}”
                      </p>
                      {idp.parentNoteTimestamp && (
                        <p className={cn('text-[10px] font-semibold uppercase tracking-wide mt-2', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                          {idp.parentNoteTimestamp}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="interventions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="kid-panel" style={{ ['--kid-1' as any]: '#F43F5E', ['--kid-2' as any]: '#8B5CF6' }}>
              <div className="kid-panel-head">
                <div>
                  <h3 className="kid-title text-xl sm:text-2xl font-hand flex items-center gap-2">
                    <span className="kid-bob inline-block">🤝</span> My Support Interventions
                  </h3>
                  <p className="kid-sub text-[12px] mt-0.5">
                    Extra help programmes your teachers set up to support your learning
                  </p>
                </div>
                <span className="kid-chip hidden sm:inline-flex" style={{ ['--kid-2' as any]: '#F43F5E' }}>
                  {interventions.length} active
                </span>
              </div>
              <div className="kid-panel-body space-y-3">
                {interventions.length === 0 ? (
                  <div className="text-center p-10 rounded-[24px] border-4 border-dashed border-rose-300 bg-rose-50/60">
                    <HeartHandshake className="mx-auto mb-3 text-rose-400" size={40} />
                    <p className="font-bold text-rose-500">
                      No support interventions right now — you're doing great! 🌟
                    </p>
                    <p className="text-xs font-semibold text-rose-400 mt-2 max-w-md mx-auto">
                      If your teacher creates a support plan for you (extra lessons, accommodations, or remedial
                      exercises), it will appear here automatically.
                    </p>
                  </div>
                ) : (
                  interventions.map((iv: any) => (
                    <div
                      key={iv.id}
                      className={cn(
                        'p-5 rounded-2xl border-2 space-y-3',
                        isDarkMode ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                            <ShieldAlert size={22} />
                          </div>
                          <div className="min-w-0">
                            <p className={cn('font-bold text-sm truncate', isDarkMode ? 'text-white' : 'text-slate-800')}>
                              {iv.title || `${iv.subject || 'Learning'} Support Plan`}
                            </p>
                            <p className={cn('text-[11px] font-semibold uppercase tracking-wide mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                              {iv.subject || 'General'} {iv.grade ? `• ${iv.grade}` : ''} {iv.siasLevel ? `• ${iv.siasLevel}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide shrink-0',
                          iv.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500'
                            : iv.status === 'Under Review' ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-sky-500/15 text-sky-500'
                        )}>
                          {iv.status || 'Active'}
                        </span>
                      </div>

                      {iv.targetGoal && (
                        <p className={cn('text-[13px] leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                          <span className="font-black uppercase text-[10px] tracking-widest mr-1.5" style={{ color: '#F43F5E' }}>Goal:</span>
                          {iv.targetGoal}
                        </p>
                      )}

                      {Array.isArray(iv.accommodations) && iv.accommodations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {iv.accommodations.map((acc: string, i: number) => (
                            <span
                              key={i}
                              className={cn(
                                'px-2.5 py-1 rounded-full text-[10px] font-bold border',
                                isDarkMode ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-600'
                              )}
                            >
                              {acc}
                            </span>
                          ))}
                        </div>
                      )}

                      {typeof iv.progressPercentage === 'number' && (
                        <div className="flex items-center gap-3">
                          <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDarkMode ? 'bg-slate-800' : 'bg-slate-200')}>
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, iv.progressPercentage))}%` }}
                            />
                          </div>
                          <span className={cn('text-[11px] font-black', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                            {iv.progressPercentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* How support works explainer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: BookOpen, emoji: '📖', title: 'Extra Practice', desc: 'Targeted exercises to strengthen tricky topics.', c1: '#0EA5E9', c2: '#6366F1' },
                { icon: Clock, emoji: '⏰', title: 'Accommodations', desc: 'Extra time, scaffolding, and language support when you need it.', c1: '#F59E0B', c2: '#F43F5E' },
                { icon: GraduationCap, emoji: '🎓', title: 'Progress Reviews', desc: 'Your teachers check in regularly to celebrate your growth.', c1: '#10B981', c2: '#0EA5E9' }
              ].map((card, i) => (
                <div
                  key={card.title}
                  className="kid-card kid-pop p-5 flex flex-col gap-2"
                  style={{ ['--kid-1' as any]: card.c1, ['--kid-2' as any]: card.c2, animationDelay: `${0.08 * (i + 1)}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="kid-badge" style={{ ['--kid-2' as any]: card.c2 }}>
                      <card.icon size={24} strokeWidth={2.6} />
                    </div>
                    <span className="text-2xl select-none kid-bob">{card.emoji}</span>
                  </div>
                  <h4 className="kid-title text-lg font-display leading-tight">{card.title}</h4>
                  <p className="kid-sub text-[12px] leading-snug">{card.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
