// src/components/LearnerPortfolioHub.tsx
//
// "Learner Profiles & Portfolios" for teachers (and the read-only mirror for
// learners and parents).
//
// Before this existed the teacher's Portfolios tab rendered `<StudentPortfolio>`
// directly, which always showed the *signed-in* user's own portfolio — i.e. the
// same five hard-coded demo items no matter which teacher opened it, with no way
// to reach any learner. This hub:
//
//   • lists EVERY learner belonging to the signed-in teacher,
//   • groups them by Class / Alphabetically (A–Z) / Grade,
//   • opens a per-learner academic dossier (portfolio + IDP + reports),
//   • lets teachers edit the academic portfolio, while learners and parents get
//     an explicit read-only view (IDP included).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, Compass, FileText, FolderOpen,
  GraduationCap, Layers, Lock, Mail, Phone, Search, SortAsc, Trophy,
  Users, HeartHandshake, ClipboardList, Sparkles, BarChart3, Eye
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import StudentPortfolio from './StudentPortfolio';
import {
  DEMO_LEARNERS,
  LearnerSummary,
  groupLearnersAlphabetically,
  groupLearnersByClass,
  initialsOf,
  learnerAverage,
  sortLearnersAlphabetically
} from '../lib/learnerDirectory';
import { subscribeLearnerPortfolio, PortfolioRecord } from '../lib/portfolioData';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

type GroupMode = 'class' | 'alpha' | 'grade';
type DossierTab = 'portfolio' | 'records';

export interface LearnerPortfolioHubProps {
  isDarkMode: boolean;
  userRole?: string | null;
  onNavigateTab?: (tabId: string) => void;
  triggerToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

/* -------------------------------------------------------------------------- */
/* Small presentational helpers                                                */
/* -------------------------------------------------------------------------- */

function AvatarTile({ name, tint }: { name: string; tint: string }) {
  return (
    <div className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center text-sm font-black shrink-0', tint)}>
      {initialsOf(name)}
    </div>
  );
}

const AVATAR_TINTS = [
  'bg-cyan-500/15 border-cyan-400/35 text-cyan-200',
  'bg-purple-500/15 border-purple-400/35 text-purple-200',
  'bg-emerald-500/15 border-emerald-400/35 text-emerald-200',
  'bg-amber-500/15 border-amber-400/35 text-amber-200',
  'bg-pink-500/15 border-pink-400/35 text-pink-200',
  'bg-indigo-500/15 border-indigo-400/35 text-indigo-200'
];

function tintFor(seed: string) {
  let h = 0;
  for (let i = 0; i < (seed || '').length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function LearnerPortfolioHub({
  isDarkMode,
  userRole = 'teacher',
  onNavigateTab,
  triggerToast
}: LearnerPortfolioHubProps) {
  const canEdit = userRole === 'teacher' || userRole === 'admin';

  const [learners, setLearners] = useState<LearnerSummary[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; subject?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [groupMode, setGroupMode] = useState<GroupMode>('class');
  const [selectedLearner, setSelectedLearner] = useState<LearnerSummary | null>(null);
  const [dossierTab, setDossierTab] = useState<DossierTab>('portfolio');
  // Learners (and parents with a single child) should land straight inside their
  // own dossier instead of staring at a one-card roster.
  const autoOpened = useRef(false);
  const dismissedAutoOpen = useRef(false);

  // Per-learner record counts (portfolio size) so the roster can show real stats.
  const [portfolioCounts, setPortfolioCounts] = useState<Record<string, { items: number; featured: number; average: number }>>({});

  /* ---------------------------------------------------------------- */
  /* Load the directory for this role                                  */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    let active = true;
    let unsubLearners: (() => void) | null = null;
    let unsubClasses: (() => void) | null = null;
    // Guards the 6s safety-net timeout: once real Firestore learners have
    // landed we must never overwrite them with the demo roster.
    let gotRealData = false;

    const demoFallback = () => {
      if (!active || gotRealData) return;
      if (userRole === 'student') {
        setLearners([DEMO_LEARNERS[DEMO_LEARNERS.length - 1]]);
        setClasses([{ id: 'demo-class', name: DEMO_LEARNERS[DEMO_LEARNERS.length - 1].grade }]);
      } else if (userRole === 'parent') {
        setLearners(DEMO_LEARNERS.slice(0, 2));
        setClasses(DEMO_LEARNERS.slice(0, 2).map((l, i) => ({ id: `demo-class-${i}`, name: l.grade })));
      } else {
        setLearners(DEMO_LEARNERS);
        setClasses(Array.from(new Set(DEMO_LEARNERS.map(l => l.className))).map((name, i) => ({ id: `demo-class-${i}`, name })));
      }
      setLoading(false);
    };

    const timer = setTimeout(() => {
      if (active) demoFallback();
    }, 6000);

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubLearners) { unsubLearners(); unsubLearners = null; }
      if (unsubClasses) { unsubClasses(); unsubClasses = null; }

      if (!user) {
        demoFallback();
        return;
      }

      const email = (user.email || localStorage.getItem('eduai_user_email') || '').toLowerCase().trim();

      try {
        if (canEdit) {
          unsubClasses = onSnapshot(
            query(collection(db, 'classes'), where('teacherId', '==', user.uid)),
            (snap) => {
              if (!active) return;
              setClasses(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
            },
            (err) => console.warn('Portfolio hub: classes note:', err)
          );

          unsubLearners = onSnapshot(
            query(collection(db, 'students'), where('teacherId', '==', user.uid)),
            (snap) => {
              if (!active) return;
              const list = snap.docs.map(d => {
                const raw: any = d.data();
                const subjects = Array.isArray(raw.subjects) ? raw.subjects : [];
                return {
                  id: raw.id || d.id,
                  name: raw.name || 'Unnamed Learner',
                  grade: raw.grade || 'Unassigned',
                  email: raw.email || '',
                  status: raw.status || 'Active',
                  teacherId: raw.teacherId,
                  className: (raw.className || raw.class || raw.grade || 'Unassigned').trim(),
                  subjects,
                  idp: raw.idp || null,
                  parentName: raw.parentName || '',
                  parentEmail: raw.parentEmail || '',
                  parentPhone: raw.parentPhone || '',
                  notes: raw.notes || '',
                  average: learnerAverage(subjects)
                } as LearnerSummary;
              });
              if (list.length > 0) {
                gotRealData = true;
                setLearners(sortLearnersAlphabetically(list));
              } else {
                demoFallback();
              }
              setLoading(false);
            },
            (err) => { console.warn('Portfolio hub: learners note:', err); demoFallback(); }
          );
        } else if (userRole === 'parent') {
          if (!email) { demoFallback(); return; }
          unsubLearners = onSnapshot(
            query(collection(db, 'students'), where('parentEmail', '==', email)),
            (snap) => {
              if (!active) return;
              const list = snap.docs.map(d => {
                const raw: any = d.data();
                const subjects = Array.isArray(raw.subjects) ? raw.subjects : [];
                return {
                  id: raw.id || d.id,
                  name: raw.name || 'Learner',
                  grade: raw.grade || 'Unassigned',
                  email: raw.email || '',
                  className: (raw.className || raw.grade || 'Unassigned').trim(),
                  subjects,
                  idp: raw.idp || null,
                  average: learnerAverage(subjects)
                } as LearnerSummary;
              });
              if (list.length > 0) { gotRealData = true; setLearners(sortLearnersAlphabetically(list)); }
              else demoFallback();
              setLoading(false);
            },
            (err) => { console.warn('Portfolio hub: children note:', err); demoFallback(); }
          );
        } else {
          if (!email) { demoFallback(); return; }
          unsubLearners = onSnapshot(
            query(collection(db, 'students'), where('email', '==', email)),
            (snap) => {
              if (!active) return;
              if (!snap.empty) {
                gotRealData = true;
                const raw: any = snap.docs[0].data();
                const subjects = Array.isArray(raw.subjects) ? raw.subjects : [];
                setLearners([{
                  id: raw.id || snap.docs[0].id,
                  name: raw.name || 'Learner',
                  grade: raw.grade || 'Unassigned',
                  email: raw.email || email,
                  className: (raw.className || raw.grade || 'Unassigned').trim(),
                  subjects,
                  idp: raw.idp || null,
                  average: learnerAverage(subjects)
                } as LearnerSummary]);
              } else {
                demoFallback();
              }
              setLoading(false);
            },
            (err) => { console.warn('Portfolio hub: self note:', err); demoFallback(); }
          );
        }
      } catch (err) {
        console.warn('Portfolio hub: subscription failed:', err);
        demoFallback();
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
      unsubAuth();
      if (unsubLearners) unsubLearners();
      if (unsubClasses) unsubClasses();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, canEdit]);

  /* ---------------------------------------------------------------- */
  /* Portfolio counts for the roster (subscribes once per learner)      */
  /* ---------------------------------------------------------------- */
  const learnerIdsKey = learners.map(l => l.id).join(',');
  useEffect(() => {
    if (learners.length === 0) return;
    const unsubs = learners.map(l =>
      subscribeLearnerPortfolio(l.id, (items: PortfolioRecord[]) => {
        const numeric = items
          .map(i => parseInt(String(i.grade), 10))
          .filter(n => !isNaN(n) && n > 0 && n <= 100);
        setPortfolioCounts(prev => ({
          ...prev,
          [l.id]: {
            items: items.length,
            featured: items.filter(i => i.featured).length,
            average: numeric.length ? Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length) : 0
          }
        }));
      }, { studentName: l.name, demoSubjects: l.subjects })
    );
    return () => unsubs.forEach(u => { try { u(); } catch { /* noop */ } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerIdsKey]);

  useEffect(() => {
    if (autoOpened.current || dismissedAutoOpen.current) return;
    if (!canEdit && learners.length === 1) {
      autoOpened.current = true;
      setSelectedLearner(learners[0]);
    }
  }, [learners, canEdit]);

  const closeDossier = () => {
    dismissedAutoOpen.current = true;
    setSelectedLearner(null);
    setDossierTab('portfolio');
  };

  /* ---------------------------------------------------------------- */
  /* Filtering + grouping                                              */
  /* ---------------------------------------------------------------- */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return learners.filter(l => {
      const matchesSearch = !q
        || l.name.toLowerCase().includes(q)
        || (l.email || '').toLowerCase().includes(q)
        || (l.grade || '').toLowerCase().includes(q)
        || (l.className || '').toLowerCase().includes(q);
      const matchesClass = classFilter === 'All' || l.className === classFilter || l.grade === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [learners, searchQuery, classFilter]);

  const groups = useMemo(() => {
    if (groupMode === 'alpha') return groupLearnersAlphabetically(filtered);
    if (groupMode === 'grade') {
      const buckets = new Map<string, LearnerSummary[]>();
      sortLearnersAlphabetically(filtered).forEach(l => {
        const key = l.grade || 'Unassigned';
        if (!buckets.has(key)) buckets.set(key, []);
        (buckets.get(key) as LearnerSummary[]).push(l);
      });
      return Array.from(buckets.entries())
        .map(([label, items]) => ({ key: `grade-${label}`, label, learners: items }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    }
    return groupLearnersByClass(filtered, classes);
  }, [filtered, groupMode, classes]);

  const classOptions = useMemo(() => {
    const set = new Set<string>(['All']);
    learners.forEach(l => { if (l.className) set.add(l.className); });
    classes.forEach(c => set.add(c.name));
    return Array.from(set);
  }, [learners, classes]);

  const totalFeatured = Object.values(portfolioCounts).reduce((a, b) => a + (b.featured || 0), 0);
  const learnersWithIdp = learners.filter(l => !!l.idp).length;

  /* ---------------------------------------------------------------- */
  /* Loading / empty states                                            */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <p className={cn('text-sm font-bold uppercase tracking-widest', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          Loading learner portfolios…
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Dossier (single learner)                                          */
  /* ---------------------------------------------------------------- */
  if (selectedLearner) {
    return (
      <LearnerDossier
        learner={selectedLearner}
        isDarkMode={isDarkMode}
        canEdit={canEdit}
        tab={dossierTab}
        setTab={setDossierTab}
        onBack={closeDossier}
        onNavigateTab={onNavigateTab}
        triggerToast={triggerToast}
      />
    );
  }

  /* ---------------------------------------------------------------- */
  /* Roster                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HERO */}
      <div className={cn(
        'relative overflow-hidden rounded-[32px] p-6 lg:p-8 border shadow-2xl',
        isDarkMode
          ? 'bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.9)_0%,rgba(8,11,34,1)_100%)] border-cyan-500/30'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-700'
      )}>
        <div className="absolute -top-10 -right-6 opacity-[0.07] pointer-events-none select-none">
          <Trophy size={220} className="text-cyan-300" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-[11px] font-black uppercase tracking-widest">
              <FolderOpen size={14} />
              {canEdit ? 'Teacher Academic Portfolio Vault' : 'Family Portfolio View'}
            </span>
            <span className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border',
              canEdit
                ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                : 'bg-amber-500/15 border-amber-400/35 text-amber-200'
            )}>
              {canEdit ? <><Sparkles size={13} /> Full edit access</> : <><Lock size={13} /> Read-only access</>}
            </span>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-3xl lg:text-5xl font-black font-display tracking-tight text-white art-title flex items-center gap-3">
              Learner Academic Portfolios
              <GraduationCap size={28} className="text-cyan-300" />
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed font-medium art-body">
              {canEdit
                ? 'Every learner on your register, grouped by class or alphabetically. Open a learner to curate their academic portfolio, review the IDP, and export the parent journey report.'
                : 'Browse the academic portfolio and Individual Development Plan (IDP). Portfolios are curated by teachers, so this view is read-only.'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {[
              { label: 'Learners', value: learners.length, icon: Users, tint: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/25' },
              { label: 'Classes / Groups', value: classOptions.length - 1, icon: Layers, tint: 'text-purple-300 bg-purple-500/10 border-purple-400/25' },
              { label: 'Portfolio Records', value: Object.values(portfolioCounts).reduce((a, b) => a + (b.items || 0), 0), icon: BookOpen, tint: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/25' },
              { label: 'IDPs Published', value: learnersWithIdp, icon: Compass, tint: 'text-amber-300 bg-amber-500/10 border-amber-400/25' }
            ].map(s => (
              <div key={s.label} className={cn('p-3.5 rounded-2xl border flex items-center gap-3 bg-slate-950/45', s.tint)}>
                <s.icon size={18} />
                <div>
                  <p className="text-xl font-black leading-none text-white">{s.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-90">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className={cn(
        'p-4 rounded-[24px] border flex flex-col lg:flex-row lg:items-center gap-4',
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
      )}>
        <div className="relative w-full lg:w-80">
          <Search className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learner, class or email…"
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500',
              isDarkMode ? 'bg-slate-900 border-white/15 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
            )}
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className={cn(
            'w-full lg:w-56 px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer',
            isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
          )}
        >
          {classOptions.map(c => <option key={c} value={c}>{c === 'All' ? 'All classes' : c}</option>)}
        </select>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            <SortAsc size={13} /> Group by
          </span>
          {([
            { id: 'class' as GroupMode, label: 'Classes' },
            { id: 'alpha' as GroupMode, label: 'Alphabetical' },
            { id: 'grade' as GroupMode, label: 'Grade' }
          ]).map(mode => (
            <button
              key={mode.id}
              onClick={() => setGroupMode(mode.id)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer',
                groupMode === mode.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md'
                  : isDarkMode
                    ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="lg:ml-auto">
          <span className={cn('text-[11px] font-bold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            Showing <span className={cn('font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>{filtered.length}</span> of {learners.length} learners
            {totalFeatured > 0 && <> • <span className="text-amber-400 font-black">{totalFeatured}</span> featured</>}
          </span>
        </div>
      </div>

      {/* GROUPED ROSTER */}
      {filtered.length === 0 ? (
        <div className={cn('p-14 rounded-[28px] border-2 border-dashed text-center space-y-3', isDarkMode ? 'border-white/15 bg-white/[0.03]' : 'border-slate-300 bg-slate-50')}>
          <Users size={40} className={cn('mx-auto', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
          <h3 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-800')}>
            {learners.length === 0 ? 'No learners on your register yet' : 'No learners match that search'}
          </h3>
          <p className={cn('text-xs max-w-md mx-auto leading-relaxed', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            {learners.length === 0
              ? 'Add learners (manually or by CSV bulk import) from Classes & Learners → Class Management and their portfolios will appear here instantly.'
              : 'Try a different name, class or clear the search box.'}
          </p>
          {learners.length === 0 && canEdit && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('class-management')}
              className="mt-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Users size={14} /> Open Class Management
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => {
            const groupAverage = Math.round(
              group.learners.reduce((a, l) => a + (portfolioCounts[l.id]?.average || l.average || 0), 0) / Math.max(1, group.learners.length)
            );
            return (
              <section key={group.key} className="space-y-3">
                {/* Group header */}
                <div className={cn(
                  'flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border',
                  isDarkMode ? 'bg-slate-900/70 border-white/10' : 'bg-slate-100 border-slate-200'
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', isDarkMode ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300' : 'bg-cyan-100 border-cyan-300 text-cyan-700')}>
                      {groupMode === 'alpha' ? <SortAsc size={16} /> : <Layers size={16} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className={cn('text-base font-black font-display truncate', isDarkMode ? 'text-white' : 'text-slate-900')}>
                        {groupMode === 'alpha' ? `Surname "${group.label}"` : group.label}
                      </h3>
                      <p className={cn('text-[10px] font-bold uppercase tracking-widest mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                        {group.learners.length} learner{group.learners.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border', isDarkMode ? 'bg-emerald-500/10 border-emerald-400/25 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                      <BarChart3 size={11} className="inline mr-1" />{groupAverage || '—'}% avg
                    </span>
                    <span className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border', isDarkMode ? 'bg-purple-500/10 border-purple-400/25 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700')}>
                      {group.learners.filter(l => l.idp).length} IDP
                    </span>
                  </div>
                </div>

                {/* Learner cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.learners.map(learner => {
                    const counts = portfolioCounts[learner.id];
                    return (
                      <motion.button
                        key={learner.id}
                        whileHover={{ y: -3 }}
                        onClick={() => { setSelectedLearner(learner); setDossierTab('portfolio'); }}
                        className={cn(
                          'text-left p-5 rounded-[24px] border transition-all cursor-pointer space-y-3.5 group',
                          isDarkMode
                            ? 'bg-white/[0.04] border-white/10 hover:border-cyan-400/50 hover:bg-white/[0.07] shadow-lg'
                            : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm hover:shadow-md'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <AvatarTile name={learner.name} tint={tintFor(learner.name)} />
                            <div className="min-w-0">
                              <h4 className={cn('text-sm font-black truncate', isDarkMode ? 'text-white group-hover:text-cyan-200' : 'text-slate-900 group-hover:text-cyan-700')}>
                                {learner.name}
                              </h4>
                              <p className={cn('text-[11px] font-semibold truncate mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                {learner.className || learner.grade}
                              </p>
                            </div>
                          </div>
                          {learner.idp ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-300 text-[9px] font-black uppercase tracking-wider">
                              <Compass size={10} /> IDP
                            </span>
                          ) : (
                            <span className={cn('shrink-0 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider', isDarkMode ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400')}>
                              No IDP
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Records', value: counts?.items ?? '—' },
                            { label: 'Average', value: counts?.average || learner.average ? `${counts?.average || learner.average}%` : '—' },
                            { label: 'Featured', value: counts?.featured ?? 0 }
                          ].map(stat => (
                            <div key={stat.label} className={cn('p-2 rounded-xl border text-center', isDarkMode ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200')}>
                              <p className={cn('text-sm font-black leading-none', isDarkMode ? 'text-white' : 'text-slate-900')}>{stat.value}</p>
                              <p className={cn('text-[8px] font-black uppercase tracking-widest mt-1', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{stat.label}</p>
                            </div>
                          ))}
                        </div>

                        <div className={cn('flex items-center justify-between pt-2.5 border-t', isDarkMode ? 'border-white/10' : 'border-slate-100')}>
                          <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold truncate', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                            {canEdit ? <Eye size={12} className="text-cyan-400" /> : <Lock size={12} className="text-amber-400" />}
                            {canEdit ? 'Open & edit portfolio' : 'View portfolio'}
                          </span>
                          {learner.parentEmail ? (
                            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold truncate max-w-[45%]', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                              <Mail size={11} /> linked parent
                            </span>
                          ) : (
                            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold', isDarkMode ? 'text-slate-600' : 'text-slate-400')}>
                              <Mail size={11} /> no parent link
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Permission explainer */}
      <div className={cn(
        'p-5 rounded-[24px] border flex flex-col sm:flex-row items-start gap-3',
        isDarkMode ? 'bg-amber-500/[0.07] border-amber-500/25' : 'bg-amber-50 border-amber-200'
      )}>
        <Lock size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className={cn('text-xs font-black uppercase tracking-widest', isDarkMode ? 'text-amber-300' : 'text-amber-700')}>Who can edit what</p>
          <p className={cn('text-xs leading-relaxed', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
            Teachers (and administrators) curate academic portfolios: add, edit, feature and remove portfolio records.
            Learners and parents can always <strong>view</strong> the academic portfolio and the Individual Development Plan (IDP),
            but every control is locked for them. Parents may still add their own motivational note to the IDP from the Parent Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dossier                                                                     */
/* -------------------------------------------------------------------------- */

interface DossierProps {
  learner: LearnerSummary;
  isDarkMode: boolean;
  canEdit: boolean;
  tab: DossierTab;
  setTab: (t: DossierTab) => void;
  onBack: () => void;
  onNavigateTab?: (tabId: string) => void;
  triggerToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function LearnerDossier({ learner, isDarkMode, canEdit, tab, setTab, onBack, onNavigateTab, triggerToast }: DossierProps) {
  const [gradingReports, setGradingReports] = useState<any[]>([]);
  const [publishedReports, setPublishedReports] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    const safe = (fn: () => void) => { try { fn(); } catch (err) { console.warn('Dossier subscription note:', err); } };

    safe(() => unsubs.push(onSnapshot(
      query(collection(db, 'auto_grading_reports'), where('studentId', '==', learner.id)),
      (snap) => setGradingReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => setGradingReports([])
    )));

    safe(() => unsubs.push(onSnapshot(
      query(collection(db, 'published_reports'), where('studentId', '==', learner.id)),
      (snap) => setPublishedReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => setPublishedReports([])
    )));

    safe(() => unsubs.push(onSnapshot(
      query(collection(db, 'student_records'), where('studentId', '==', learner.id)),
      (snap) => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => setRecords([])
    )));

    // Interventions are written by the Learner Intervention Hub under the
    // teacher's uid and reference the learner by name (and sometimes by id).
    safe(() => unsubs.push(onSnapshot(
      query(collection(db, 'learner_interventions')),
      (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setInterventions(all.filter((iv: any) =>
          iv.studentId === learner.id ||
          (iv.learnerName || '').trim().toLowerCase() === (learner.name || '').trim().toLowerCase()
        ));
      },
      () => setInterventions([])
    )));

    return () => unsubs.forEach(u => { try { u(); } catch { /* noop */ } });
  }, [learner.id, learner.name]);

  const dateLabel = (value: any) => {
    try {
      if (!value) return '—';
      if (typeof value.toDate === 'function') return value.toDate().toLocaleDateString('en-ZA');
      const d = new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-ZA');
    } catch { return '—'; }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Dossier header */}
      <div className={cn(
        'relative overflow-hidden rounded-[28px] p-5 lg:p-6 border shadow-2xl',
        isDarkMode
          ? 'bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.9)_0%,rgba(8,11,34,1)_100%)] border-white/10'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-700'
      )}>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0 border border-white/15"
              title="Back to all learners"
            >
              <ArrowLeft size={17} />
            </button>
            <AvatarTile name={learner.name} tint={tintFor(learner.name)} />
            <div className="min-w-0">
              <h2 className="text-xl lg:text-2xl font-black font-display text-white truncate art-title">{learner.name}</h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300 mt-0.5 truncate">
                {learner.className || learner.grade} {learner.email ? `• ${learner.email}` : ''}
              </p>
              {learner.parentEmail && (
                <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1"><Mail size={10} /> {learner.parentEmail}</span>
                  {learner.parentPhone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {learner.parentPhone}</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border',
              canEdit ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200' : 'bg-amber-500/15 border-amber-400/35 text-amber-200'
            )}>
              {canEdit ? (<><Sparkles size={12} /> Teacher edit mode</>) : (<><Lock size={12} /> Read-only</>)}
            </span>
            {canEdit && onNavigateTab && (
              <>
                <button
                  onClick={() => onNavigateTab('learner-intervention')}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <HeartHandshake size={12} /> Intervention Hub
                </button>
                <button
                  onClick={() => onNavigateTab('reports')}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Compass size={12} /> IDP Lab
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dossier tabs */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 pt-5 mt-5 border-t border-white/10">
          {([
            { id: 'portfolio' as DossierTab, label: 'Academic Portfolio & IDP', icon: BookOpen },
            { id: 'records' as DossierTab, label: `Reports, Marks & Interventions (${gradingReports.length + publishedReports.length + interventions.length + records.length})`, icon: ClipboardList }
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer inline-flex items-center gap-2',
                tab === t.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              )}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'portfolio' ? (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StudentPortfolio
              isDarkMode={isDarkMode}
              studentId={learner.id}
              studentName={learner.name}
              studentGrade={learner.grade}
              learnerIdp={learner.idp}
              learnerSubjects={learner.subjects}
              canEdit={canEdit}
              compact
              onNavigateTab={onNavigateTab}
              triggerToast={triggerToast}
            />
          </motion.div>
        ) : (
          <motion.div
            key="records"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Subject marks */}
            <RecordSection
              title="Current Subject Marks"
              icon={BarChart3}
              isDarkMode={isDarkMode}
              empty="No subject marks captured yet — add them from Analytics & Reports."
              items={(learner.subjects || []).map((s: any, i: number) => ({
                id: `subj-${i}`,
                heading: s.name,
                meta: `${s.mark}% • ${(s.assessments || []).length} assessments logged`,
                badge: `${s.mark}%`,
                badgeTone: s.mark >= 70 ? 'good' : s.mark >= 50 ? 'warn' : 'bad',
                detail: (s.assessments || []).map((a: any) => `${a.title}: ${a.score}% (${a.type})`).join('  •  ')
              }))}
            />

            {/* Auto-graded reports */}
            <RecordSection
              title="Auto-Graded Assessments (OCR Ledger)"
              icon={FileText}
              isDarkMode={isDarkMode}
              empty="No OCR/auto-graded papers for this learner yet."
              items={gradingReports.map((r: any) => ({
                id: r.id,
                heading: r.assignmentTitle || r.fileName || 'Auto-graded submission',
                meta: `Graded ${dateLabel(r.createdAt)}${r.studentName ? ` • ${r.studentName}` : ''}`,
                badge: r.totalScore != null ? String(r.totalScore) : 'N/A',
                badgeTone: 'good',
                detail: r.feedback || ''
              }))}
            />

            {/* Published progress reports */}
            <RecordSection
              title="Published Progress Reports"
              icon={Award}
              isDarkMode={isDarkMode}
              empty="No official progress report has been published to this learner's parents yet."
              items={publishedReports.map((r: any) => ({
                id: r.id,
                heading: `${r.term || 'Term Report'} • Official Progress Report`,
                meta: `Published ${dateLabel(r.publishedAt)}${r.parentEmail ? ` • sent to ${r.parentEmail}` : ''}`,
                badge: r.idp ? 'IDP included' : 'Report',
                badgeTone: 'info',
                detail: Array.isArray(r.subjects)
                  ? r.subjects.map((s: any) => `${s.name}: ${s.mark}%`).join('  •  ')
                  : ''
              }))}
            />

            {/* Interventions */}
            <RecordSection
              title="SIAS Interventions & Support Plans"
              icon={HeartHandshake}
              isDarkMode={isDarkMode}
              empty="No intervention plans recorded for this learner."
              items={interventions.map((iv: any) => ({
                id: iv.id,
                heading: `${iv.subject || 'General'} intervention — ${iv.learnerName || learner.name}`,
                meta: `${iv.siasLevel || 'SIAS'} • created ${iv.createdAt || '—'} • ${iv.durationWeeks || 6} weeks`,
                badge: iv.status || 'Active',
                badgeTone: iv.status === 'Completed' ? 'good' : iv.status === 'Under Review' ? 'warn' : 'info',
                detail: iv.targetGoal || iv.barrierDescription || ''
              }))}
            />

            {/* Attendance / conduct records */}
            <RecordSection
              title="Attendance, Conduct & Welfare Records"
              icon={CheckCircle2}
              isDarkMode={isDarkMode}
              empty="No attendance or conduct records logged."
              items={records.map((r: any) => ({
                id: r.id,
                heading: r.title || r.type || 'Record',
                meta: `${r.recordType || r.type || 'Record'} • ${dateLabel(r.date || r.createdAt)}`,
                badge: r.status || 'Logged',
                badgeTone: 'info',
                detail: r.notes || r.comment || ''
              }))}
            />

            {!canEdit && (
              <p className={cn('text-[11px] font-bold uppercase tracking-widest text-center', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>
                <Lock size={11} className="inline mr-1.5" /> Records are published by teachers and cannot be edited from this view
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RecordSection({
  title, icon: Icon, items, empty, isDarkMode
}: {
  title: string;
  icon: any;
  isDarkMode: boolean;
  empty: string;
  items: Array<{ id: string; heading: string; meta?: string; badge?: string; badgeTone?: 'good' | 'warn' | 'bad' | 'info'; detail?: string }>;
}) {
  const toneClass = (tone?: string) => {
    switch (tone) {
      case 'good': return 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300';
      case 'warn': return 'bg-amber-500/15 border-amber-400/30 text-amber-300';
      case 'bad': return 'bg-rose-500/15 border-rose-400/30 text-rose-300';
      default: return 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300';
    }
  };

  return (
    <div className={cn('rounded-[24px] border overflow-hidden', isDarkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
      <div className={cn('px-5 py-3.5 border-b flex items-center gap-2.5', isDarkMode ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-slate-50')}>
        <Icon size={16} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-600'} />
        <h3 className={cn('text-xs font-black uppercase tracking-widest', isDarkMode ? 'text-white' : 'text-slate-800')}>{title}</h3>
        <span className={cn('ml-auto text-[10px] font-black px-2 py-0.5 rounded-md border', isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600')}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className={cn('px-5 py-6 text-xs italic text-center', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{empty}</p>
      ) : (
        <div className="divide-y divide-white/5">
          {items.map(item => (
            <div key={item.id} className={cn('px-5 py-3.5 flex flex-wrap items-start gap-3', !isDarkMode && 'border-b border-slate-100 last:border-0')}>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-bold leading-tight', isDarkMode ? 'text-white' : 'text-slate-800')}>{item.heading}</p>
                {item.meta && <p className={cn('text-[10px] font-semibold uppercase tracking-wide mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{item.meta}</p>}
                {item.detail && <p className={cn('text-xs mt-1.5 leading-relaxed line-clamp-3', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{item.detail}</p>}
              </div>
              {item.badge && (
                <span className={cn('shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border', toneClass(item.badgeTone))}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
