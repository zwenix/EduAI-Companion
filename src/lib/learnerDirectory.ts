// src/lib/learnerDirectory.ts
//
// One shared "who are my learners?" data layer for every role.
//
// Why this exists: the Intervention Hub, the Learner Portfolio hub, Progress
// Reports and Class Management each re-implemented their own Firestore query
// for `students`, and the portfolio/IDP screens had no learner list at all —
// teachers could not see their learners' academic portfolios and parents saw
// demo data instead of their own child. This module gives all of them a single
// role-aware source of truth (with a deterministic demo fallback so the app is
// never an empty shell when signed in anonymously / offline).
import { useEffect, useMemo, useState } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { IdpModel, Subject } from '../types';

export type DirectoryRole = 'teacher' | 'admin' | 'parent' | 'student' | null;

export interface ClassSummary {
  id: string;
  name: string;
  subject?: string;
  teacherId?: string;
}

export interface LearnerSummary {
  id: string;
  name: string;
  grade: string;
  email: string;
  status?: string;
  teacherId?: string;
  /** Resolved class/room label used for "group by class" (falls back to grade). */
  className: string;
  classId?: string | null;
  subjects: Subject[];
  idp?: IdpModel | null;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  notes?: string;
  /** Mean of the learner's subject marks (0 when unknown). */
  average: number;
  /** True for the built-in demo roster (no Firestore document behind it). */
  isDemo?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic demo roster                                                   */
/* -------------------------------------------------------------------------- */

function seededSubjects(name: string): Subject[] {
  const seed = (name || 'Learner').charCodeAt(0) + (name || 'L').length;
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
  const maths = clamp((seed % 38) + 48, 38, 95);
  const science = clamp(((seed + 7) % 40) + 45, 40, 94);
  const english = clamp(((seed + 15) % 30) + 58, 45, 93);

  return [
    {
      name: 'Mathematics',
      mark: maths,
      termHistory: [clamp(maths - 9, 20, 100), clamp(maths - 4, 20, 100), clamp(maths - 2, 20, 100), maths],
      assessments: [
        { title: 'Algebra Portfolio Task', score: clamp(maths + 4, 0, 100), type: 'SBA' },
        { title: 'Diagnostic Control Test', score: clamp(maths - 5, 0, 100), type: 'Test' }
      ]
    },
    {
      name: 'Natural Sciences',
      mark: science,
      termHistory: [clamp(science - 11, 20, 100), clamp(science - 6, 20, 100), clamp(science - 1, 20, 100), science],
      assessments: [
        { title: 'Energy Transfer Practical', score: clamp(science + 5, 0, 100), type: 'Practical' },
        { title: 'Matter & Materials SBA', score: clamp(science - 3, 0, 100), type: 'SBA' }
      ]
    },
    {
      name: 'English First Additional Language',
      mark: english,
      termHistory: [clamp(english - 5, 20, 100), clamp(english - 2, 20, 100), clamp(english - 1, 20, 100), english],
      assessments: [
        { title: 'Summary & Comprehension', score: clamp(english + 2, 0, 100), type: 'SBA' },
        { title: 'Creative Writing: The African Fable', score: clamp(english - 4, 0, 100), type: 'Project' }
      ]
    }
  ];
}

const DEMO_ROSTER: Array<{ name: string; grade: string; idp?: boolean }> = [
  { name: 'Sipho Ndlovu', grade: 'Grade 4A', idp: true },
  { name: 'Amahle Khumalo', grade: 'Grade 4A' },
  { name: 'Keira van der Merwe', grade: 'Grade 4A', idp: true },
  { name: 'Thabo Mokoena', grade: 'Grade 4A' },
  { name: 'Lesedi Mabuza', grade: 'Grade 5B' },
  { name: 'Ruan Botha', grade: 'Grade 5B', idp: true },
  { name: 'Naledi Dlamini', grade: 'Grade 5B' },
  { name: 'Ayaab Petersen', grade: 'Grade 5B' },
  { name: 'Zanele Mthembu', grade: 'Grade 7C' },
  { name: 'Kagiso Selepe', grade: 'Grade 7C', idp: true },
  { name: 'Emma Naidoo', grade: 'Grade 7C' },
  { name: 'Sibusiso Dube', grade: 'Grade 7C' }
];

function demoIdp(name: string): IdpModel {
  const subjects = seededSubjects(name);
  const weakest = [...subjects].sort((a, b) => a.mark - b.mark)[0];
  const strongest = [...subjects].sort((a, b) => b.mark - a.mark)[0];
  return {
    strengths: [
      `Consistent, well-presented work in ${strongest.name} (${strongest.mark}%).`,
      'Attends every support session and asks clarifying questions.'
    ],
    weaknesses: [
      `${weakest.name} sits at ${weakest.mark}% — below the CAPS 40% promotion benchmark safety margin.`,
      'Rushes multi-step word problems and skips showing working out.'
    ],
    recommendations: [
      `Two 20-minute ${weakest.name} scaffolded drills per week from the Content Studio.`,
      'Use the AI Tutor for step-by-step worked examples before each test.',
      'Parent: 10 minutes of nightly times-table / vocabulary recall.'
    ],
    actionPlan: [
      { task: `Complete ${weakest.name} remedial worksheet set 1-3`, milestone: 'Week 1-2', status: 'Completed' },
      { task: 'Rewrite diagnostic test with marking memo', milestone: 'Week 3', status: 'In Progress' },
      { task: 'SBST review meeting with parent', milestone: 'Week 6', status: 'Pending' }
    ],
    parentNote: 'Thank you for the extra support — we are doing the home games every evening.',
    parentNoteTimestamp: new Date(Date.now() - 86400000 * 4).toISOString()
  };
}

function buildDemoLearners(): LearnerSummary[] {
  return DEMO_ROSTER.map((r, i) => {
    const subjects = seededSubjects(r.name);
    const learner: LearnerSummary = {
      id: `demo-learner-${i + 1}`,
      name: r.name,
      grade: r.grade,
      email: `${r.name.replace(/[^a-zA-Z]/g, '.').toLowerCase()}@school.za`,
      status: 'Active',
      className: r.grade,
      subjects,
      idp: r.idp ? demoIdp(r.name) : null,
      parentName: `Parent of ${r.name.split(' ')[0]}`,
      parentEmail: `${r.name.split(' ')[0].toLowerCase()}.parent@school.za`,
      average: Math.round(subjects.reduce((a, s) => a + s.mark, 0) / subjects.length),
      isDemo: true
    };
    return learner;
  });
}

export const DEMO_LEARNERS: LearnerSummary[] = buildDemoLearners();

export const DEMO_CLASSES: ClassSummary[] = Array.from(new Set(DEMO_ROSTER.map(r => r.grade))).map((name, i) => ({
  id: `demo-class-${i + 1}`,
  name,
  subject: 'Class Register'
}));

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function learnerAverage(subjects?: Subject[] | null): number {
  if (!subjects || subjects.length === 0) return 0;
  const total = subjects.reduce((acc, s) => acc + (Number(s.mark) || 0), 0);
  return Math.round(total / subjects.length);
}

export function initialsOf(name: string): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Natural grade ordering: Grade R, 1..12 (with letter suffixes) then anything else. */
export function gradeSortValue(grade: string): number {
  const g = (grade || '').toLowerCase();
  if (g.includes('grade r') || g === 'r' || g.includes('gr r')) return 0;
  const match = g.match(/(\d{1,2})/);
  return match ? parseInt(match[1], 10) : 99;
}

export function sortLearnersAlphabetically(list: LearnerSummary[]): LearnerSummary[] {
  return [...list].sort((a, b) => {
    const aSurname = (a.name || '').trim().split(/\s+/).pop() || '';
    const bSurname = (b.name || '').trim().split(/\s+/).pop() || '';
    const cmp = aSurname.localeCompare(bSurname, 'en', { sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' });
  });
}

export function sortClasses(list: ClassSummary[]): ClassSummary[] {
  return [...list].sort((a, b) => {
    const d = gradeSortValue(a.name) - gradeSortValue(b.name);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  });
}

export function groupLearnersByClass(
  learners: LearnerSummary[],
  classes: ClassSummary[]
): Array<{ key: string; label: string; learners: LearnerSummary[] }> {
  const known = new Map<string, ClassSummary>();
  classes.forEach(c => known.set(c.name.trim().toLowerCase(), c));

  const buckets = new Map<string, LearnerSummary[]>();
  learners.forEach(l => {
    const raw = (l.className || l.grade || 'Unassigned').trim();
    const key = known.has(raw.toLowerCase()) ? (known.get(raw.toLowerCase()) as ClassSummary).name : raw || 'Unassigned';
    if (!buckets.has(key)) buckets.set(key, []);
    (buckets.get(key) as LearnerSummary[]).push(l);
  });

  return Array.from(buckets.entries())
    .map(([label, items]) => ({
      key: label,
      label,
      learners: sortLearnersAlphabetically(items)
    }))
    .sort((a, b) => {
      const d = gradeSortValue(a.label) - gradeSortValue(b.label);
      if (d !== 0) return d;
      return a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
    });
}

export function groupLearnersAlphabetically(
  learners: LearnerSummary[]
): Array<{ key: string; label: string; learners: LearnerSummary[] }> {
  const buckets = new Map<string, LearnerSummary[]>();
  sortLearnersAlphabetically(learners).forEach(l => {
    const surname = (l.name || '?').trim().split(/\s+/).pop() || '?';
    const letter = (surname[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!buckets.has(key)) buckets.set(key, []);
    (buckets.get(key) as LearnerSummary[]).push(l);
  });

  return Array.from(buckets.entries())
    .map(([label, items]) => ({ key: `alpha-${label}`, label, learners: items }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

interface DirectoryState {
  learners: LearnerSummary[];
  classes: ClassSummary[];
  loading: boolean;
  /** True when nothing came back from Firestore and the demo roster is shown. */
  usingDemoData: boolean;
}

function resolveClassName(raw: any, classes: ClassSummary[]): string {
  const explicit = raw?.className || raw?.class || raw?.classRoom || raw?.classroom;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  if (raw?.classId) {
    const match = classes.find(c => c.id === raw.classId);
    if (match) return match.name;
  }
  return (raw?.grade || 'Unassigned').trim();
}

function mapStudent(raw: any, id: string, classes: ClassSummary[]): LearnerSummary {
  const subjects: Subject[] = Array.isArray(raw?.subjects) ? raw.subjects : [];
  return {
    id: raw?.id || id,
    name: raw?.name || 'Unnamed Learner',
    grade: raw?.grade || 'Unassigned',
    email: raw?.email || '',
    status: raw?.status || 'Active',
    teacherId: raw?.teacherId,
    className: resolveClassName(raw, classes),
    classId: raw?.classId || null,
    subjects,
    idp: raw?.idp || null,
    parentName: raw?.parentName || '',
    parentEmail: raw?.parentEmail || '',
    parentPhone: raw?.parentPhone || '',
    notes: raw?.notes || '',
    average: learnerAverage(subjects)
  };
}

/**
 * Role-aware learner directory.
 *
 * - teacher / admin → every learner where `teacherId == uid`
 * - parent          → every learner where `parentEmail == user's email`
 * - student         → the learner document that matches the signed-in email
 *
 * Falls back to the deterministic demo roster when Firestore is unreachable or
 * empty so the teacher-facing hubs never render as a blank page.
 */
export function useLearnerDirectory(role: DirectoryRole, opts?: { demoFallback?: boolean }): DirectoryState {
  const demoFallback = opts?.demoFallback ?? true;
  const [remoteLearners, setRemoteLearners] = useState<LearnerSummary[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [settled, setSettled] = useState(false);

  const wantsTeacherView = role === 'teacher' || role === 'admin' || role === null;

  useEffect(() => {
    let active = true;
    let unsubLearners: (() => void) | null = null;
    let unsubClasses: (() => void) | null = null;

    const finish = () => {
      if (!active) return;
      setLoading(false);
      setSettled(true);
    };

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubLearners) { unsubLearners(); unsubLearners = null; }
      if (unsubClasses) { unsubClasses(); unsubClasses = null; }

      if (!user) {
        if (active) { setRemoteLearners([]); setClasses([]); }
        finish();
        return;
      }

      const email = (user.email || localStorage.getItem('eduai_user_email') || '').toLowerCase().trim();

      try {
        if (wantsTeacherView) {
          const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
          unsubClasses = onSnapshot(qClasses, (snap) => {
            if (!active) return;
            setClasses(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
          }, (err) => { console.warn('Directory: classes load note:', err); });

          const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid));
          unsubLearners = onSnapshot(qStudents, (snap) => {
            if (!active) return;
            setRemoteLearners(snap.docs.map(d => mapStudent(d.data(), d.id, [])));
            finish();
          }, (err) => { console.warn('Directory: students load note:', err); finish(); });
        } else if (role === 'parent') {
          if (!email) { finish(); return; }
          const q = query(collection(db, 'students'), where('parentEmail', '==', email));
          unsubLearners = onSnapshot(q, (snap) => {
            if (!active) return;
            setRemoteLearners(snap.docs.map(d => mapStudent(d.data(), d.id, [])));
            finish();
          }, (err) => { console.warn('Directory: parent children load note:', err); finish(); });
        } else {
          if (!email) { finish(); return; }
          const q = query(collection(db, 'students'), where('email', '==', email));
          unsubLearners = onSnapshot(q, (snap) => {
            if (!active) return;
            setRemoteLearners(snap.docs.map(d => mapStudent(d.data(), d.id, [])));
            finish();
          }, (err) => { console.warn('Directory: self load note:', err); finish(); });
        }
      } catch (err) {
        console.warn('Directory: subscription failed, using cache/demo:', err);
        finish();
      }
    });

    // Safety net: if Firestore never answers (offline first paint), stop the spinner.
    const timeout = setTimeout(() => finish(), 6000);

    return () => {
      active = false;
      clearTimeout(timeout);
      unsubAuth();
      if (unsubLearners) unsubLearners();
      if (unsubClasses) unsubClasses();
    };
  }, [role, wantsTeacherView]);

  // Re-resolve class labels once the class list lands (students link by grade == class name).
  const learners = useMemo(() => {
    if (remoteLearners.length > 0) {
      return remoteLearners.map(l => ({ ...l, className: resolveClassName({ grade: l.grade, className: l.className, classId: l.classId }, classes) }));
    }
    return [];
  }, [remoteLearners, classes]);

  const usingDemoData = settled && learners.length === 0 && demoFallback;

  const finalLearners = useMemo(() => {
    if (learners.length > 0) return sortLearnersAlphabetically(learners);
    if (!demoFallback) return [];
    if (role === 'student') return [DEMO_LEARNERS[DEMO_LEARNERS.length - 1]];
    if (role === 'parent') return DEMO_LEARNERS.slice(0, 2);
    return DEMO_LEARNERS;
  }, [learners, demoFallback, role]);

  const finalClasses = useMemo(() => {
    if (classes.length > 0) return sortClasses(classes);
    if (!demoFallback) return [];
    const fromLearners = Array.from(new Set(finalLearners.map(l => l.className).filter(Boolean)));
    return sortClasses(fromLearners.map((name, i) => ({ id: `derived-${i}`, name })));
  }, [classes, finalLearners, demoFallback]);

  return { learners: finalLearners, classes: finalClasses, loading: loading && !settled, usingDemoData };
}
