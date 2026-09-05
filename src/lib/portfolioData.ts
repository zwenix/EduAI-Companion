// src/lib/portfolioData.ts
//
// Academic Portfolio record store.
//
// Portfolios used to be a hard-coded demo list inside StudentPortfolio.tsx, so
// a teacher opening "Learner Profiles & Portfolios" saw the same five showcase
// items for every learner and could not add anything. This module makes the
// portfolio a real, persisted, per-learner record:
//
//   * `portfolio_items`  — teacher-curated items (projects, tasks, awards)
//   * `auto_grading_reports` — OCR/auto-graded assessments folded in read-only
//   * localStorage mirror — keeps demo/offline sessions working exactly like
//     the rest of the app (interventions, custom plans, …)
//
// Permissions: only the owning teacher writes. Learners and parents read.
import { db, auth } from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import type { Subject } from '../types';

export type PortfolioItemType = 'project' | 'assignment' | 'assessment' | 'achievement';

export interface PortfolioRecord {
  id: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  title: string;
  type: PortfolioItemType;
  subject: string;
  capsAlignment: string;
  /** Human readable date, e.g. "12 Nov 2026". */
  date: string;
  /** "92%", "Gold", "Level 5" … kept as a string to match the existing UI. */
  grade: string;
  feedback?: string;
  featured?: boolean;
  /** Where the record came from — auto-graded reports are read-only. */
  source?: 'teacher' | 'autograded' | 'demo';
  createdAt?: any;
  updatedAt?: any;
}

const CACHE_KEY = 'eduai_portfolio_items';

/* -------------------------------------------------------------------------- */
/* Local cache                                                                 */
/* -------------------------------------------------------------------------- */

type CacheShape = Record<string, PortfolioRecord[]>;

function readCache(): CacheShape {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as CacheShape;
  } catch {
    return {};
  }
}

function writeCache(next: CacheShape) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Portfolio cache write failed:', e);
  }
}

export function readCachedPortfolio(studentId: string): PortfolioRecord[] {
  if (!studentId) return [];
  return readCache()[studentId] || [];
}

export function writeCachedPortfolio(studentId: string, items: PortfolioRecord[]) {
  if (!studentId) return;
  const cache = readCache();
  cache[studentId] = items;
  writeCache(cache);
}

/* -------------------------------------------------------------------------- */
/* Demo content (only used when a learner has no records at all)               */
/* -------------------------------------------------------------------------- */

const fmt = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function demoPortfolioFor(studentId: string, studentName: string, subjects?: Subject[]): PortfolioRecord[] {
  const list = subjects && subjects.length > 0 ? subjects : [
    { name: 'Mathematics', mark: 72, termHistory: [], assessments: [] },
    { name: 'Natural Sciences', mark: 68, termHistory: [], assessments: [] },
    { name: 'English First Additional Language', mark: 81, termHistory: [], assessments: [] }
  ];

  const records: PortfolioRecord[] = list.slice(0, 4).map((s, i) => ({
    id: `${studentId}-demo-${i + 1}`,
    studentId,
    studentName,
    title: `${s.name} Term ${Math.min(4, i + 2)} Portfolio Task`,
    type: i === 0 ? 'assessment' : i === 1 ? 'project' : 'assignment',
    subject: s.name,
    capsAlignment: `Term ${Math.min(4, i + 2)} • CAPS ${s.name} content area`,
    date: fmt(new Date(Date.now() - 86400000 * (12 * i + 6))),
    grade: `${s.mark || 70}%`,
    feedback: i === 0
      ? 'Solid conceptual understanding. Work carefully through multi-step problems and show all calculations.'
      : 'Neat, complete submission with clear evidence of the CAPS skill being assessed.',
    featured: i === 0,
    source: 'demo'
  }));

  if (records.length > 1) {
    records[1].type = 'achievement';
    records[1].title = 'Subject Improvement Award';
    records[1].grade = 'Silver';
    records[1].capsAlignment = 'Academic Excellence • Continuous Assessment';
    records[1].featured = true;
  }

  return records;
}

/* -------------------------------------------------------------------------- */
/* Mapping helpers                                                             */
/* -------------------------------------------------------------------------- */

function guessSubject(title: string, fallback = 'General'): string {
  const t = (title || '').toLowerCase();
  if (t.includes('math') || t.includes('algebra') || t.includes('number')) return 'Mathematics';
  if (t.includes('science') || t.includes('physics') || t.includes('chem') || t.includes('biology')) return 'Natural Sciences';
  if (t.includes('english') || t.includes('essay') || t.includes('writing') || t.includes('reading')) return 'English Home Language';
  if (t.includes('afrikaans') || t.includes('isizulu') || t.includes('language')) return 'Languages';
  if (t.includes('history') || t.includes('geography') || t.includes('social')) return 'Social Sciences';
  if (t.includes('life') || t.includes('art') || t.includes('music')) return 'Life Skills / Life Orientation';
  return fallback;
}

function toDateLabel(value: any): string {
  try {
    if (!value) return fmt(new Date());
    if (typeof value?.toDate === 'function') return fmt(value.toDate());
    const d = new Date(value);
    if (!isNaN(d.getTime())) return fmt(d);
  } catch { /* fall through */ }
  return fmt(new Date());
}

export function mapGradingReportToPortfolio(raw: any, id: string): PortfolioRecord {
  const title = raw?.assignmentTitle || raw?.fileName || 'Auto-Graded Assessment';
  return {
    id: `agr-${id}`,
    studentId: raw?.studentId || '',
    studentName: raw?.studentName || '',
    teacherId: raw?.teacherId,
    title,
    type: 'assessment',
    subject: raw?.subject || guessSubject(title),
    capsAlignment: raw?.capsAlignment || 'Auto-Graded Submission (OCR)',
    date: toDateLabel(raw?.createdAt),
    grade: raw?.totalScore != null ? String(raw.totalScore) : 'N/A',
    feedback: raw?.feedback || '',
    featured: false,
    source: 'autograded',
    createdAt: raw?.createdAt
  };
}

export function portfolioAverage(items: PortfolioRecord[]): number {
  const numeric = items
    .map(i => parseInt(String(i.grade), 10))
    .filter(n => !isNaN(n) && n > 0 && n <= 100);
  if (numeric.length === 0) return 0;
  return Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length);
}

/* -------------------------------------------------------------------------- */
/* Live subscriptions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Subscribe to a single learner's academic portfolio.
 * Merges teacher-curated `portfolio_items` with auto-graded assessments and
 * keeps a localStorage mirror so offline/demo sessions still show content.
 */
export function subscribeLearnerPortfolio(
  studentId: string,
  onChange: (items: PortfolioRecord[]) => void,
  opts?: { demoSubjects?: Subject[]; studentName?: string }
): () => void {
  if (!studentId) {
    onChange([]);
    return () => {};
  }

  let curated: PortfolioRecord[] = readCachedPortfolio(studentId);
  let graded: PortfolioRecord[] = [];
  let resolvedFromFirestore = false;

  const emit = () => {
    const merged = new Map<string, PortfolioRecord>();
    curated.forEach(i => merged.set(i.id, i));
    graded.forEach(i => { if (!merged.has(i.id)) merged.set(i.id, i); });

    let list = Array.from(merged.values());
    if (list.length === 0) {
      // Nothing curated or graded yet: show a realistic starter portfolio so the
      // screen is never empty (matches the rest of the app's demo-first design).
      list = demoPortfolioFor(studentId, opts?.studentName || 'Learner', opts?.demoSubjects);
    }
    list.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const dbb = new Date(b.date).getTime() || 0;
      return dbb - da;
    });
    onChange(list);
  };

  const unsubs: Array<() => void> = [];

  try {
    const qCurated = query(collection(db, 'portfolio_items'), where('studentId', '==', studentId));
    unsubs.push(onSnapshot(qCurated, (snap) => {
      resolvedFromFirestore = true;
      curated = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as PortfolioRecord[];
      writeCachedPortfolio(studentId, curated);
      emit();
    }, (err) => {
      console.warn('Portfolio items load note:', err);
      emit();
    }));
  } catch (err) {
    console.warn('Portfolio items subscription failed:', err);
    emit();
  }

  try {
    const qGraded = query(collection(db, 'auto_grading_reports'), where('studentId', '==', studentId));
    unsubs.push(onSnapshot(qGraded, (snap) => {
      resolvedFromFirestore = true;
      graded = snap.docs.map(d => mapGradingReportToPortfolio(d.data(), d.id));
      emit();
    }, (err) => {
      console.warn('Auto-graded reports load note:', err);
      emit();
    }));
  } catch (err) {
    console.warn('Auto-graded reports subscription failed:', err);
  }

  // Immediate paint from cache/demo; Firestore snapshots refine it.
  emit();
  void resolvedFromFirestore;

  return () => unsubs.forEach(u => { try { u(); } catch { /* noop */ } });
}

/** All auto-graded reports belonging to a teacher (used by the reports vault). */
export function subscribeTeacherReports(
  teacherId: string,
  onChange: (reports: any[]) => void
): () => void {
  if (!teacherId) { onChange([]); return () => {}; }
  try {
    const q = query(collection(db, 'auto_grading_reports'), where('teacherId', '==', teacherId));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const ta = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a?.createdAt || 0).getTime();
        const tb = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });
      onChange(list);
    }, (err) => { console.warn('Teacher reports load note:', err); onChange([]); });
  } catch (err) {
    console.warn('Teacher reports subscription failed:', err);
    onChange([]);
    return () => {};
  }
}

/* -------------------------------------------------------------------------- */
/* Writes (teacher only)                                                       */
/* -------------------------------------------------------------------------- */

export async function savePortfolioItem(record: PortfolioRecord): Promise<void> {
  const user = auth.currentUser;
  const payload = {
    ...record,
    teacherId: user?.uid || record.teacherId || null,
    updatedAt: serverTimestamp()
  };

  // Always mirror locally first so the UI updates even when offline.
  const cached = readCachedPortfolio(record.studentId).filter(i => i.id !== record.id);
  writeCachedPortfolio(record.studentId, [{ ...record, source: record.source || 'teacher' }, ...cached]);

  if (!user || record.studentId.startsWith('demo-')) return;

  try {
    await setDoc(doc(db, 'portfolio_items', record.id), payload);
  } catch (err) {
    console.warn('Portfolio item save note (cached locally):', err);
  }
}

export async function deletePortfolioItem(record: PortfolioRecord): Promise<void> {
  const cached = readCachedPortfolio(record.studentId).filter(i => i.id !== record.id);
  writeCachedPortfolio(record.studentId, cached);

  const user = auth.currentUser;
  if (!user || record.id.startsWith('demo-') || record.source === 'autograded') return;

  try {
    await deleteDoc(doc(db, 'portfolio_items', record.id.replace(/^agr-/, '')));
  } catch (err) {
    console.warn('Portfolio item delete note:', err);
  }
}

export function newPortfolioItemId(studentId: string): string {
  return `pf-${studentId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
}
