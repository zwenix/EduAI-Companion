import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award, Star, BookOpen, FileText, Trophy, X, Zap, Target, Loader2,
  Plus, Pencil, Trash2, Lock, Compass, CheckCircle2, TrendingUp, Lightbulb,
  MessageSquareHeart, GraduationCap, Save
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import jsPDF from 'jspdf';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';
import { cleanupExportArtifacts } from '../lib/printUtils';
import {
  PortfolioRecord,
  PortfolioItemType,
  newPortfolioItemId,
  savePortfolioItem,
  deletePortfolioItem,
  subscribeLearnerPortfolio,
  portfolioAverage
} from '../lib/portfolioData';
import type { IdpModel } from '../types';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

/* -------------------------------------------------------------------------- */
/* Presentation metadata (kept out of the persisted record)                    */
/* -------------------------------------------------------------------------- */

const TYPE_META: Record<PortfolioItemType, { icon: any; color: string; label: string }> = {
  project: { icon: BookOpen, color: 'from-indigo-400 to-blue-500', label: 'Project' },
  assignment: { icon: FileText, color: 'from-indigo-400 to-blue-500', label: 'Assignment' },
  assessment: { icon: Target, color: 'from-emerald-400 to-teal-500', label: 'Assessment' },
  achievement: { icon: Trophy, color: 'from-yellow-300 to-yellow-500', label: 'Achievement' }
};

const TYPE_OPTIONS: PortfolioItemType[] = ['assessment', 'assignment', 'project', 'achievement'];

interface StudentProfileLite {
  name: string;
  email: string;
  grade: string;
  school?: string;
  idp?: IdpModel | null;
  subjects?: any[];
}

export interface StudentPortfolioProps {
  isDarkMode: boolean;
  /** Explicit learner. When omitted the signed-in learner's own portfolio loads. */
  studentId?: string | null;
  studentName?: string;
  studentGrade?: string;
  studentSchool?: string;
  learnerIdp?: IdpModel | null;
  learnerSubjects?: any[];
  /** Teachers (and admins) only — everyone else gets a read-only dossier. */
  canEdit?: boolean;
  /** Render without the full-height hero (used inside the Learner Portfolio hub). */
  compact?: boolean;
  /** Navigate to another app tab, e.g. the teacher IDP Lab. */
  onNavigateTab?: (tabId: string) => void;
  triggerToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const EMPTY_FORM = {
  title: '',
  type: 'assessment' as PortfolioItemType,
  subject: 'Mathematics',
  capsAlignment: '',
  date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  grade: '',
  feedback: '',
  featured: false
};

export default function StudentPortfolio({
  isDarkMode,
  studentId: studentIdProp,
  studentName: studentNameProp,
  studentGrade: studentGradeProp,
  studentSchool: studentSchoolProp,
  learnerIdp,
  learnerSubjects,
  canEdit = false,
  compact = false,
  onNavigateTab,
  triggerToast
}: StudentPortfolioProps) {
  const [items, setItems] = useState<PortfolioRecord[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [studentProfile, setStudentProfile] = useState<StudentProfileLite | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingHtmlPdf, setIsGeneratingHtmlPdf] = useState(false);
  const [resolvingSelf, setResolvingSelf] = useState(!studentIdProp);

  // Teacher editing state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PortfolioRecord | null>(null);

  /* ------------------------------------------------------------------ */
  /* Resolve whose portfolio this is                                     */
  /* ------------------------------------------------------------------ */
  const [resolvedStudentId, setResolvedStudentId] = useState<string | null>(studentIdProp || null);

  useEffect(() => {
    if (studentIdProp) {
      setResolvedStudentId(studentIdProp);
      setResolvingSelf(false);
      return;
    }

    let cancelled = false;
    const resolveSelf = async () => {
      const user = auth.currentUser;
      const email = (user?.email || localStorage.getItem('eduai_user_email') || '').toLowerCase().trim();
      if (!user || !email) {
        if (!cancelled) {
          setResolvedStudentId('self-demo');
          setResolvingSelf(false);
        }
        return;
      }
      try {
        const q = query(collection(db, 'students'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!cancelled) {
          setResolvedStudentId(snap.empty ? `self-${user.uid}` : snap.docs[0].id);
          setResolvingSelf(false);
        }
      } catch (err) {
        console.warn('Portfolio: could not resolve own learner record:', err);
        if (!cancelled) {
          setResolvedStudentId(`self-${user.uid}`);
          setResolvingSelf(false);
        }
      }
    };
    resolveSelf();
    return () => { cancelled = true; };
  }, [studentIdProp]);

  /* ------------------------------------------------------------------ */
  /* Learner profile + IDP                                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;

    const fallbackProfile: StudentProfileLite = {
      name: studentNameProp || auth.currentUser?.displayName || 'Learner',
      email: auth.currentUser?.email || '',
      grade: studentGradeProp || 'Grade 10',
      school: studentSchoolProp || 'EduAI Showcase Academy',
      idp: learnerIdp || null,
      subjects: learnerSubjects || []
    };

    if (!resolvedStudentId || resolvedStudentId.startsWith('self-') || resolvedStudentId === 'self-demo') {
      if (!cancelled) setStudentProfile(fallbackProfile);
      return;
    }

    // When the hub already handed us the learner record, paint instantly.
    if (studentNameProp) {
      if (!cancelled) setStudentProfile(fallbackProfile);
    }

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'students', resolvedStudentId));
        if (cancelled) return;
        if (snap.exists()) {
          const d = snap.data() as any;
          setStudentProfile({
            name: d.name || fallbackProfile.name,
            email: d.email || fallbackProfile.email,
            grade: d.grade || fallbackProfile.grade,
            school: d.school || fallbackProfile.school,
            idp: d.idp || fallbackProfile.idp || null,
            subjects: Array.isArray(d.subjects) ? d.subjects : fallbackProfile.subjects
          });
        } else if (!studentNameProp) {
          setStudentProfile(fallbackProfile);
        }
      } catch (err) {
        console.warn('Portfolio: learner profile load note:', err);
        if (!cancelled && !studentNameProp) setStudentProfile(fallbackProfile);
      }
    })();

    return () => { cancelled = true; };
  }, [resolvedStudentId, studentNameProp, studentGradeProp, studentSchoolProp, learnerIdp, learnerSubjects]);

  /* ------------------------------------------------------------------ */
  /* Portfolio records                                                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!resolvedStudentId) return;
    const unsub = subscribeLearnerPortfolio(
      resolvedStudentId,
      (next) => setItems(next),
      { studentName: studentNameProp || studentProfile?.name, demoSubjects: learnerSubjects as any }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedStudentId, studentNameProp]);

  const subjects = useMemo(() => {
    const set = new Set<string>(['All']);
    items.forEach(i => { if (i.subject) set.add(i.subject); });
    return Array.from(set);
  }, [items]);

  useEffect(() => {
    if (filter !== 'All' && !subjects.includes(filter)) setFilter('All');
  }, [subjects, filter]);

  const filteredItems = useMemo(
    () => items.filter(item => filter === 'All' || item.subject === filter),
    [items, filter]
  );
  const featuredItems = useMemo(() => items.filter(item => item.featured), [items]);
  const averageScore = useMemo(() => portfolioAverage(items), [items]);

  const idp = studentProfile?.idp || learnerIdp || null;
  const actionPlan = idp?.actionPlan || [];
  const completedMissions = actionPlan.filter(t => t.status === 'Completed').length;
  const planProgress = actionPlan.length > 0 ? Math.round((completedMissions / actionPlan.length) * 100) : 0;

  /* ------------------------------------------------------------------ */
  /* Teacher CRUD                                                        */
  /* ------------------------------------------------------------------ */
  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setEditorOpen(true);
  }, []);

  const openEdit = useCallback((item: PortfolioRecord) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      type: item.type || 'assessment',
      subject: item.subject || 'Mathematics',
      capsAlignment: item.capsAlignment || '',
      date: item.date || EMPTY_FORM.date,
      grade: item.grade || '',
      feedback: item.feedback || '',
      featured: !!item.featured
    });
    setEditorOpen(true);
  }, []);

  const handleSaveItem = async () => {
    if (!resolvedStudentId) return;
    if (!form.title.trim()) {
      triggerToast?.('Give the portfolio item a title first.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const record: PortfolioRecord = {
        id: editingId || newPortfolioItemId(resolvedStudentId),
        studentId: resolvedStudentId,
        studentName: studentProfile?.name || studentNameProp || 'Learner',
        teacherId: auth.currentUser?.uid,
        title: form.title.trim(),
        type: form.type,
        subject: form.subject.trim() || 'General',
        capsAlignment: form.capsAlignment.trim() || `${form.subject} • CAPS aligned task`,
        date: form.date.trim() || EMPTY_FORM.date,
        grade: form.grade.trim() || 'N/A',
        feedback: form.feedback.trim(),
        featured: form.featured,
        source: 'teacher'
      };
      await savePortfolioItem(record);
      setItems(prev => {
        const without = prev.filter(p => p.id !== record.id);
        return [record, ...without];
      });
      setEditorOpen(false);
      triggerToast?.(editingId ? 'Portfolio item updated.' : 'Portfolio item added.', 'success');
    } catch (err) {
      console.error('Portfolio save failed:', err);
      triggerToast?.('Could not save that portfolio item.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeatured = async (item: PortfolioRecord) => {
    const next = { ...item, featured: !item.featured };
    setItems(prev => prev.map(p => (p.id === item.id ? next : p)));
    if (!canEdit) return;
    await savePortfolioItem(next);
  };

  const handleDeleteItem = async (item: PortfolioRecord) => {
    if (item.source === 'autograded') {
      triggerToast?.('Auto-graded assessments are locked — they come from the OCR grading ledger.', 'info');
      setConfirmDelete(null);
      return;
    }
    setItems(prev => prev.filter(p => p.id !== item.id));
    setConfirmDelete(null);
    try {
      await deletePortfolioItem(item);
      triggerToast?.('Portfolio item removed.', 'success');
    } catch (err) {
      console.warn('Portfolio delete note:', err);
    }
  };

  /* ------------------------------------------------------------------ */
  /* PDF exports (unchanged behaviour, now per-learner)                  */
  /* ------------------------------------------------------------------ */
  const generateParentReportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const A4_WIDTH = pdf.internal.pageSize.getWidth();
      const A4_HEIGHT = pdf.internal.pageSize.getHeight();

      const name = studentProfile?.name || 'Learner';
      const grade = studentProfile?.grade || 'Grade 10';
      const school = studentProfile?.school || 'EduAI Showcase Academy';

      let pageNum = 1;

      const drawPageDecorations = (p: jsPDF, page: number) => {
        p.setDrawColor(6, 182, 212);
        p.setLineWidth(1.5);
        p.line(40, 45, A4_WIDTH - 40, 45);

        p.setFont('Helvetica', 'normal');
        p.setFontSize(8);
        p.setTextColor(148, 163, 184);
        p.text('EduAI South Africa • Learning Journey Digest & CAPS Showcase', 40, 36);
        p.text(`Student: ${name} (${grade})`, A4_WIDTH - 40, 36, { align: 'right' });

        p.setDrawColor(226, 232, 240);
        p.setLineWidth(0.5);
        p.line(40, A4_HEIGHT - 45, A4_WIDTH - 40, A4_HEIGHT - 45);

        p.setFontSize(8);
        p.setTextColor(148, 163, 184);
        p.text('CONFIDENTIAL • Official Parent Academic Portfolio Report', 40, A4_HEIGHT - 32);
        p.text(`Page ${page}`, A4_WIDTH - 40, A4_HEIGHT - 32, { align: 'right' });
      };

      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(40, 50, A4_WIDTH - 80, 95, 8, 8, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('LEARNING JOURNEY PORTFOLIO', 60, 90);

      pdf.setTextColor(6, 182, 212);
      pdf.setFontSize(10.5);
      pdf.text('Official Continuous Academic Showcase & CAPS Alignment Digest', 60, 110);

      pdf.setTextColor(203, 213, 225);
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('A curated collection of distinguished projects, continuous assessments, and academic milestones.', 60, 126);

      let currentY = 170;
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(1);
      pdf.roundedRect(40, currentY, A4_WIDTH - 80, 80, 8, 8, 'FD');

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('STUDENT PROFILE', 60, currentY + 22);
      pdf.text('REPORT CONTEXT', A4_WIDTH / 2 + 20, currentY + 22);

      pdf.setFontSize(11.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(name, 60, currentY + 41);
      pdf.text(grade, 60, currentY + 56);

      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`School: ${school}`, 60, currentY + 68);

      pdf.setFont('Helvetica', 'bold');
      pdf.text(`Date Generated:`, A4_WIDTH / 2 + 20, currentY + 41);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), A4_WIDTH / 2 + 20, currentY + 56);
      pdf.text(`Verification Ref: PTF-CAPS-${Math.floor(100000 + Math.random() * 900000)}`, A4_WIDTH / 2 + 20, currentY + 68);

      currentY += 105;
      const numFeatured = items.filter(i => i.featured).length;
      const totalItems = items.length;
      const numAverages = averageScore || 85;

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(40, currentY, (A4_WIDTH - 100) / 3, 55, 6, 6, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text(totalItems.toString(), 56, currentY + 25);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('TOTAL PORTFOLIO TASKS', 56, currentY + 39);

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(40 + (A4_WIDTH - 100) / 3 + 10, currentY, (A4_WIDTH - 100) / 3, 55, 6, 6, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(245, 158, 11);
      pdf.text(`${numFeatured} Highlighted`, 40 + (A4_WIDTH - 100) / 3 + 20, currentY + 25);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('FEATURED BY EDUCATOR', 40 + (A4_WIDTH - 100) / 3 + 20, currentY + 39);

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(40 + ((A4_WIDTH - 100) / 3) * 2 + 20, currentY, (A4_WIDTH - 100) / 3, 55, 6, 6, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(16, 185, 129);
      pdf.text(`${numAverages}%`, 40 + ((A4_WIDTH - 100) / 3) * 2 + 30, currentY + 25);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('AVG PORTFOLIO SCORE', 40 + ((A4_WIDTH - 100) / 3) * 2 + 30, currentY + 39);

      currentY += 80;
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('DETAILED ACADEMIC SHOWCASE RECORDS', 40, currentY);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Every activity below aligns closely with South African CAPS curriculum units and has direct educator validation.', 40, currentY + 12);

      currentY += 25;
      drawPageDecorations(pdf, pageNum);

      items.forEach((item) => {
        if (currentY + 105 > A4_HEIGHT - 65) {
          pdf.addPage();
          pageNum++;
          drawPageDecorations(pdf, pageNum);
          currentY = 65;
        }

        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(40, currentY, A4_WIDTH - 80, 92, 6, 6, 'FD');

        let col = [14, 165, 233];
        if (item.type === 'achievement') col = [245, 158, 11];
        else if (item.type === 'assessment') col = [16, 185, 129];
        else if (item.type === 'project') col = [99, 102, 241];

        pdf.setFillColor(col[0], col[1], col[2]);
        pdf.rect(40, currentY, 4, 92, 'F');

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(col[0], col[1], col[2]);
        pdf.text(`${item.type.toUpperCase()} • ${(item.subject || '').toUpperCase()}`, 56, currentY + 18);

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text('GRADE / RATING', A4_WIDTH - 140, currentY + 18);

        pdf.setFontSize(14);
        pdf.setTextColor(col[0], col[1], col[2]);
        pdf.text(String(item.grade || 'N/A'), A4_WIDTH - 140, currentY + 34);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(item.date || '', A4_WIDTH - 140, currentY + 48);

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(pdf.splitTextToSize(item.title || '', A4_WIDTH - 240)[0], 56, currentY + 34);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.text('CAPS Section Alignment:', 56, currentY + 48);

        pdf.setFont('Helvetica', 'bold');
        pdf.text(pdf.splitTextToSize(item.capsAlignment || '', A4_WIDTH - 320)[0], 155, currentY + 48);

        pdf.setDrawColor(241, 245, 249);
        pdf.line(56, currentY + 54, A4_WIDTH - 160, currentY + 54);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(100, 116, 139);
        const feedbackStr = item.feedback || 'Exceptional classroom leadership, consistent revision habits, and high practical engagement logged.';
        const feedbackLines = pdf.splitTextToSize(`Educator Comments: "${feedbackStr}"`, A4_WIDTH - 230);
        pdf.text(feedbackLines, 56, currentY + 68);

        currentY += 102;
      });

      // IDP page — parents now receive the development plan with the portfolio.
      if (idp) {
        pdf.addPage();
        pageNum++;
        drawPageDecorations(pdf, pageNum);
        currentY = 70;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(15, 23, 42);
        pdf.text('INDIVIDUAL DEVELOPMENT PLAN (IDP) — READ ONLY', 40, currentY);
        currentY += 18;

        const blocks: Array<[string, string[]]> = [
          ['STRENGTHS', idp.strengths || []],
          ['FOCUS AREAS', idp.weaknesses || []],
          ['RECOMMENDATIONS', idp.recommendations || []],
          ['ACTION PLAN', (idp.actionPlan || []).map(t => `• ${t.task} (${t.milestone}) — ${t.status}`)]
        ];

        blocks.forEach(([heading, lines]) => {
          if (currentY + 60 > A4_HEIGHT - 70) {
            pdf.addPage();
            pageNum++;
            drawPageDecorations(pdf, pageNum);
            currentY = 70;
          }
          pdf.setFont('Helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(6, 182, 212);
          pdf.text(heading, 40, currentY);
          currentY += 13;
          pdf.setFont('Helvetica', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(71, 85, 105);
          const wrapped = pdf.splitTextToSize(lines.length ? lines.join('\n') : 'None recorded.', A4_WIDTH - 100);
          pdf.text(wrapped, 46, currentY);
          currentY += wrapped.length * 10 + 12;
        });
      }

      pdf.save(`Learning_Journey_Report_${name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate parent portfolio PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateStudentJourneyPDF = async () => {
    setIsGeneratingHtmlPdf(true);
    try {
      const name = studentProfile?.name || 'Learner';
      const grade = studentProfile?.grade || 'Grade 10';
      const school = studentProfile?.school || 'EduAI Showcase Academy';
      const email = studentProfile?.email || '';

      const element = document.createElement('div');
      element.className = 'pdf-container';
      element.style.background = '#020617';
      element.style.color = '#ffffff';
      element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      element.style.width = '794px';
      element.style.padding = '40px';
      element.style.boxSizing = 'border-box';

      const totalTasks = items.length;
      const highlightCount = items.filter(i => i.featured).length;
      const averageMarks = averageScore || 85;

      const idpBlock = idp ? `
          <div style="margin-top: 24px; padding: 20px; border-radius: 18px; background-color: rgba(15,23,42,0.6); border: 1px solid rgba(6,182,212,0.18);">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #22d3ee; margin: 0 0 12px 0;">Individual Development Plan (Read Only)</h3>
            <p style="font-size: 10.5px; color: #cbd5e1; margin: 0 0 8px 0;"><strong>Strengths:</strong> ${(idp.strengths || []).join(' • ') || 'None recorded.'}</p>
            <p style="font-size: 10.5px; color: #cbd5e1; margin: 0 0 8px 0;"><strong>Focus areas:</strong> ${(idp.weaknesses || []).join(' • ') || 'None recorded.'}</p>
            <p style="font-size: 10.5px; color: #cbd5e1; margin: 0 0 8px 0;"><strong>Recommendations:</strong> ${(idp.recommendations || []).join(' • ') || 'None recorded.'}</p>
            <p style="font-size: 10.5px; color: #cbd5e1; margin: 0;"><strong>Action plan progress:</strong> ${completedMissions}/${actionPlan.length} milestones complete (${planProgress}%).</p>
          </div>` : '';

      element.innerHTML = `
        <div style="border: 2px solid rgba(6, 182, 212, 0.15); border-radius: 24px; padding: 35px; background-color: #0b1329; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 28px;">
            <div>
              <p style="font-size: 10px; color: #22d3ee; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 800; margin: 0 0 6px 0;">Learner Continuous CAPS Assessment Portfolio</p>
              <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0 0 6px 0;">LEARNING JOURNEY DOSSIER</h1>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">An official, compiled report summarizing featured learning activities, continuous feedback, and curriculum objectives.</p>
            </div>
            <div style="background-color: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); padding: 12px 18px; border-radius: 14px; text-align: right;">
              <span style="font-size: 8px; color: #a5b4fc; font-weight: 800; display: block; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px;">SECURE RECORD</span>
              <span style="font-size: 12px; font-weight: 900; color: #ffffff;">STUDENT JOURNEY</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background-color: rgba(15, 23, 42, 0.6); padding: 22px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.04); margin-bottom: 28px;">
            <div>
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 800; margin: 0 0 10px 0;">STUDENT PROFILE</p>
              <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 4px 0;">${name}</h2>
              <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 4px 0;">${grade} • ${school}</p>
              <p style="font-size: 11px; color: #64748b; margin: 0;">${email}</p>
            </div>
            <div>
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 800; margin: 0 0 10px 0;">EVALUATION INSIGHTS</p>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 6px 0;"><strong>Generated Date:</strong> ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 6px 0;"><strong>National Standard:</strong> CAPS Curriculum Aligned</p>
              <p style="font-size: 11px; color: #34d399; font-weight: 800; margin: 0;">Record ID: RC-PORT-${Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 30px;">
            <div style="background-color: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.18); padding: 16px; border-radius: 14px; text-align: center;">
              <span style="font-size: 26px; font-weight: 900; color: #818cf8; display: block; line-height: 1.1;">${totalTasks}</span>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 800; display: block; margin-top: 6px;">Total Assessments</span>
            </div>
            <div style="background-color: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.18); padding: 16px; border-radius: 14px; text-align: center;">
              <span style="font-size: 26px; font-weight: 900; color: #fbbf24; display: block; line-height: 1.1;">${highlightCount}</span>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 800; display: block; margin-top: 6px;">Featured Milestones</span>
            </div>
            <div style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.18); padding: 16px; border-radius: 14px; text-align: center;">
              <span style="font-size: 26px; font-weight: 900; color: #34d399; display: block; line-height: 1.1;">${averageMarks}%</span>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 800; display: block; margin-top: 6px;">Mastery Average</span>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin: 0 0 16px 0;">Portfolio Achievements & Educator Comments</h3>

            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${items.map(item => {
                let borderCol = 'rgba(6, 182, 212, 0.2)';
                let tagCol = '#06b6d4';
                if (item.type === 'achievement') { borderCol = 'rgba(245, 158, 11, 0.2)'; tagCol = '#f59e0b'; }
                else if (item.type === 'assessment') { borderCol = 'rgba(16, 185, 129, 0.2)'; tagCol = '#10b981'; }
                else if (item.type === 'project') { borderCol = 'rgba(99, 102, 241, 0.2)'; tagCol = '#6366f1'; }

                return `
                  <div style="padding: 16px 20px; border-radius: 14px; background-color: rgba(15, 23, 42, 0.45); border: 1px solid ${borderCol}; border-left: 5px solid ${tagCol}; page-break-inside: avoid;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                      <div>
                        <span style="font-size: 9px; text-transform: uppercase; font-weight: 800; color: ${tagCol}; letter-spacing: 1px;">${item.type} • ${item.subject}</span>
                        <h4 style="font-size: 14px; font-weight: 800; color: #ffffff; margin: 2px 0 0 0; letter-spacing: -0.2px;">${item.title}</h4>
                      </div>
                      <div style="text-align: right;">
                        <span style="font-size: 16px; font-weight: 900; color: #34d399;">${item.grade}</span>
                        <p style="font-size: 9px; color: #64748b; margin: 1px 0 0 0;">${item.date}</p>
                      </div>
                    </div>

                    <p style="font-size: 10.5px; color: #94a3b8; margin: 0 0 6px 0;"><strong>CAPS Standards Mapping:</strong> <span style="color: #cbd5e1; font-weight: 600;">${item.capsAlignment}</span></p>
                    ${item.feedback ? `
                      <div style="padding: 10px 14px; border-radius: 10px; background-color: rgba(2, 6, 23, 0.7); border: 1px solid rgba(255,255,255,0.02); margin-top: 10px; font-style: italic; font-size: 11px; color: #e2e8f0; line-height: 1.45;">
                        "<strong>Teacher's Dialogue:</strong> ${item.feedback}"
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ${idpBlock}

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 28px; font-size: 9px; color: #475569;">
            <p>© Continuous Evaluation Portfolio Registry • EduAI Analytics</p>
            <p style="letter-spacing: 0.5px; font-family: monospace;">STAMP: DEEP-VAL-${new Date().toISOString().replace('T', '_').split('.')[0]}</p>
          </div>
        </div>
      `;

      document.body.appendChild(element);

      const opt = {
        margin: 15,
        filename: `Academic_Journey_${name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'pt' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all' as const, 'css' as const, 'legacy' as const] }
      };

      const restoreGetComputedStyle = patchOklchForHtml2canvas();
      try {
        await html2pdf().from(element).set(opt).save();
      } finally {
        restoreGetComputedStyle();
        cleanupExportArtifacts();
      }

      if (document.body.contains(element)) document.body.removeChild(element);
    } catch (err) {
      console.error('Failed to generate student continuous journey PDF:', err);
    } finally {
      setIsGeneratingHtmlPdf(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  const displayName = studentProfile?.name || studentNameProp || 'Learner';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Hero Section */}
      <div className={cn(
        'relative rounded-[36px] overflow-hidden text-white flex flex-col justify-end border shadow-2xl',
        compact ? 'p-6 lg:p-8 min-h-[190px]' : 'p-8 lg:p-12 min-h-[300px]',
        // Light/peach themes: keep a solid dark plate so the white display type
        // never lands on the pale page background (it used to be unreadable).
        isDarkMode ? 'bg-transparent border-white/10' : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-700'
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Award size={compact ? 120 : 200} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/25 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />

        <div className="relative z-10 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/55 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-emerald-300 mb-6 shadow-sm">
            <Trophy size={16} className="text-emerald-400" />
            {canEdit ? 'Academic Portfolio (Teacher Edit)' : 'Academic Portfolio (Read Only)'}
          </motion.div>
          <h1 className={cn('font-hand tracking-wide leading-tight mb-4 art-title', compact ? 'text-3xl lg:text-4xl' : 'text-4xl lg:text-6xl')}>
            {compact ? `${displayName}'s Portfolio` : <>My Hall of <span className="text-brand-cyan">Brilliance</span></>}
          </h1>
          <p className="text-slate-200 font-medium text-sm lg:text-base leading-relaxed max-w-lg art-body">
            {compact
              ? `${studentProfile?.grade || studentGradeProp || ''} • ${items.length} portfolio records • ${averageScore || '—'}% average. Curated against the CAPS curriculum.`
              : 'A curated collection of your best work, projects, and achievements, fully aligned strictly with the CAPS curriculum.'}
          </p>

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={generateStudentJourneyPDF}
              disabled={isGeneratingHtmlPdf}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-black uppercase text-[10px] tracking-wider rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed border border-indigo-300/40"
            >
              {isGeneratingHtmlPdf ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} className="text-yellow-300 animate-pulse" />}
              {isGeneratingHtmlPdf ? 'Compiling Rich PDF...' : 'Download Learning Journey (HTML-Rich PDF)'}
            </button>
            <button
              onClick={generateParentReportPDF}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-brand-cyan hover:bg-cyan-400 disabled:bg-cyan-900 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed disabled:text-slate-300 border border-cyan-200/40"
            >
              {isGeneratingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {isGeneratingPdf ? 'Generating Journey PDF...' : 'Export Journey Report for Parents'}
            </button>
            {canEdit && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-wider rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all cursor-pointer border border-emerald-300/40"
              >
                <Plus size={14} strokeWidth={3} /> Add Portfolio Item
              </button>
            )}
          </div>

          {!canEdit && (
            <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-200 bg-slate-950/60 border border-amber-400/30 rounded-full px-4 py-2">
              <Lock size={12} /> Read-only — academic portfolios are edited by teachers only
            </p>
          )}
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Portfolio Records', value: String(items.length), icon: BookOpen, tint: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
          { label: 'Featured Highlights', value: String(featuredItems.length), icon: Star, tint: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
          { label: 'Portfolio Average', value: averageScore ? `${averageScore}%` : '—', icon: TrendingUp, tint: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
          { label: 'IDP Status', value: idp ? `${planProgress}% done` : 'Not started', icon: Compass, tint: 'text-purple-400 bg-purple-500/10 border-purple-500/30' }
        ].map(stat => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-2xl border flex items-center gap-3',
              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            )}
          >
            <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', stat.tint)}>
              <stat.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className={cn('text-lg font-black leading-none truncate', isDarkMode ? 'text-white' : 'text-slate-900')}>{stat.value}</p>
              <p className={cn('text-[10px] uppercase tracking-widest font-black mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Showcase */}
      {featuredItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Star className="text-yellow-400" size={20} fill="currentColor" />
            <h2 className={cn('text-lg font-bold', isDarkMode ? 'text-white' : 'text-slate-800')}>Featured Highlights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item, i) => {
              const meta = TYPE_META[item.type] || TYPE_META.assignment;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    'rounded-[32px] p-6 lg:p-8 relative overflow-hidden shadow-xl border hover:scale-[1.02] transition-all group flex flex-col',
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                  )}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${meta.color} opacity-20 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110`} />

                  <div className="relative z-10 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn('inline-block p-3 rounded-2xl mb-4 bg-gradient-to-br shadow-inner', meta.color)}>
                        <Icon size={24} className="text-white" />
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit item"
                            className={cn('p-2 rounded-lg border transition-all cursor-pointer', isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900')}
                          >
                            <Pencil size={14} />
                          </button>
                          {item.source !== 'autograded' && (
                            <button
                              onClick={() => setConfirmDelete(item)}
                              title="Delete item"
                              className={cn('p-2 rounded-lg border transition-all cursor-pointer', isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:text-rose-400' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-500')}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <span className={cn('text-[9px] uppercase tracking-widest font-black mb-1 block', isDarkMode ? 'text-brand-cyan' : 'text-cyan-700')}>
                        {meta.label} • {item.subject}
                      </span>
                      <h3 className={cn('text-xl font-bold leading-tight', isDarkMode ? 'text-white' : 'text-slate-900')}>
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md', isDarkMode ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-600')}>
                        {item.capsAlignment}
                      </span>
                      {item.source === 'autograded' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                          Auto-graded
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={cn('relative z-10 mt-6 pt-4 border-t flex justify-between items-end', isDarkMode ? 'border-white/10' : 'border-slate-100')}>
                    <div>
                      <p className={cn('text-[10px] uppercase font-black tracking-widest mb-1', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Score / Award</p>
                      <p className={cn('text-2xl font-black', item.type === 'achievement' ? 'text-yellow-500' : 'text-emerald-500')}>
                        {item.grade}
                      </p>
                    </div>
                    <span className={cn('text-[10px] font-bold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{item.date}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Library & Filtering */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className={cn('text-2xl font-hand px-2', isDarkMode ? 'text-white' : 'text-slate-800')}>Complete Portfolio</h2>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 custom-scrollbar">
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => setFilter(subj)}
                className={cn(
                  'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border cursor-pointer',
                  filter === subj
                    ? 'bg-brand-cyan text-navy-dark shadow-lg shadow-cyan-500/20 border-cyan-300/50'
                    : isDarkMode
                      ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                )}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <div className={cn('rounded-[32px] p-2 overflow-hidden shadow-sm border', isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className={isDarkMode ? 'border-b border-white/10' : 'border-b border-slate-200'}>
                  <th className={cn('p-4 text-[10px] uppercase tracking-widest font-black', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>Activity</th>
                  <th className={cn('p-4 text-[10px] uppercase tracking-widest font-black', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>Subject & CAPS</th>
                  <th className={cn('p-4 text-[10px] uppercase tracking-widest font-black', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>Date</th>
                  <th className={cn('p-4 text-[10px] uppercase tracking-widest font-black', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>Result</th>
                  {canEdit && <th className={cn('p-4 text-[10px] uppercase tracking-widest font-black text-right', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>Manage</th>}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredItems.map((item) => {
                    const meta = TYPE_META[item.type] || TYPE_META.assignment;
                    const Icon = meta.icon;
                    return (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key={item.id}
                        className={cn(
                          'group transition-all hover:bg-brand-cyan/5',
                          isDarkMode ? 'border-b border-white/5 last:border-0' : 'border-b border-slate-100 last:border-0'
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg bg-gradient-to-br shrink-0', meta.color)}>
                              <Icon size={16} className="text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className={cn('text-sm font-bold leading-tight', isDarkMode ? 'text-white' : 'text-slate-800')}>{item.title}</p>
                              <p className={cn('text-[10px] uppercase tracking-widest mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                {meta.label}{item.source === 'autograded' ? ' • auto-graded' : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className={cn('text-xs font-bold', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>{item.subject}</p>
                          <p className={cn('text-[10px] truncate max-w-[220px] mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{item.capsAlignment}</p>
                        </td>
                        <td className={cn('p-4 text-xs tracking-wider', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>{item.date}</td>
                        <td className="p-4">
                          <span className={cn(
                            'px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg flex items-center w-fit border',
                            item.type === 'achievement'
                              ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                              : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                          )}>
                            {item.grade}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleFeatured(item)}
                                title={item.featured ? 'Remove from featured' : 'Feature this item'}
                                className={cn(
                                  'p-2 rounded-lg border transition-all cursor-pointer',
                                  item.featured
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                    : isDarkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-amber-600'
                                )}
                              >
                                <Star size={14} fill={item.featured ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={() => openEdit(item)}
                                title="Edit item"
                                className={cn('p-2 rounded-lg border transition-all cursor-pointer', isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900')}
                              >
                                <Pencil size={14} />
                              </button>
                              {item.source !== 'autograded' && (
                                <button
                                  onClick={() => setConfirmDelete(item)}
                                  title="Delete item"
                                  className={cn('p-2 rounded-lg border transition-all cursor-pointer', isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:text-rose-400' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-500')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className={cn('p-12 text-center text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                        No portfolio items found for this subject.
                        {canEdit && (
                          <button onClick={openCreate} className="ml-2 text-brand-cyan font-bold underline cursor-pointer">Add one now</button>
                        )}
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Individual Development Plan — visible to teachers, learners &       */}
      {/* parents. Always read-only here; teachers edit it in the IDP Lab.    */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <h2 className={cn('text-2xl font-hand flex items-center gap-2', isDarkMode ? 'text-white' : 'text-slate-800')}>
            <Compass size={22} className="text-purple-400" /> Individual Development Plan (IDP)
          </h2>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border', isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600')}>
              <Lock size={11} /> Read-only for learners & parents
            </span>
            {canEdit && onNavigateTab && (
              <button
                onClick={() => onNavigateTab('reports')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest border border-purple-300/40 transition-all cursor-pointer"
              >
                <Pencil size={12} /> Edit in IDP Lab
              </button>
            )}
          </div>
        </div>

        {!idp ? (
          <div className={cn('p-10 rounded-[28px] border-2 border-dashed text-center space-y-3', isDarkMode ? 'border-white/15 bg-white/[0.03]' : 'border-slate-300 bg-slate-50')}>
            <GraduationCap size={38} className={cn('mx-auto', isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
            <p className={cn('text-sm font-bold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
              No Individual Development Plan has been created for {displayName} yet.
            </p>
            <p className={cn('text-xs max-w-md mx-auto', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
              {canEdit
                ? 'Generate one from Analytics & Reports → Individual IDP Lab, or from the Learner Intervention Hub.'
                : 'Your teacher will publish one soon — it will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {actionPlan.length > 0 && (
              <div className={cn('p-5 rounded-[28px] border space-y-3', isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={cn('text-xs font-black uppercase tracking-widest', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                    Action plan progress — {completedMissions} of {actionPlan.length} milestones
                  </p>
                  <span className="text-xs font-black text-purple-400">{planProgress}%</span>
                </div>
                <div className={cn('w-full h-2.5 rounded-full overflow-hidden', isDarkMode ? 'bg-slate-800' : 'bg-slate-200')}>
                  <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-700" style={{ width: `${planProgress}%` }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {actionPlan.map((task, idx) => (
                    <div
                      key={`${task.task}-${idx}`}
                      className={cn(
                        'p-3 rounded-xl border flex items-start gap-2.5',
                        task.status === 'Completed'
                          ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
                          : isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-slate-50 border-slate-200'
                      )}
                    >
                      <CheckCircle2 size={16} className={cn('mt-0.5 shrink-0', task.status === 'Completed' ? 'text-emerald-400' : task.status === 'In Progress' ? 'text-sky-400' : 'text-amber-400')} />
                      <div className="min-w-0">
                        <p className={cn('text-xs font-bold leading-snug', isDarkMode ? 'text-white' : 'text-slate-800')}>{task.task}</p>
                        <p className={cn('text-[10px] font-semibold uppercase tracking-wide mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                          {task.milestone} • {task.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { title: 'Strengths', icon: Star, tint: 'text-emerald-400', list: idp.strengths || [], empty: 'No strengths recorded yet.' },
                { title: 'Focus Areas', icon: Target, tint: 'text-amber-400', list: idp.weaknesses || [], empty: 'No focus areas recorded yet.' },
                { title: 'Recommendations', icon: Lightbulb, tint: 'text-purple-400', list: idp.recommendations || [], empty: 'No recommendations recorded yet.' }
              ].map(card => (
                <div key={card.title} className={cn('p-5 rounded-[28px] border space-y-3', isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                  <div className="flex items-center gap-2">
                    <card.icon size={17} className={card.tint} />
                    <h3 className={cn('text-sm font-black uppercase tracking-widest', isDarkMode ? 'text-white' : 'text-slate-800')}>{card.title}</h3>
                  </div>
                  {card.list.length === 0 ? (
                    <p className={cn('text-xs italic', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>{card.empty}</p>
                  ) : (
                    <ul className="space-y-2">
                      {card.list.map((line, i) => (
                        <li key={i} className={cn('text-xs leading-relaxed font-medium flex gap-2', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>
                          <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', card.tint.replace('text-', 'bg-'))} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {idp.parentNote && (
              <div className={cn('p-5 rounded-[28px] border flex items-start gap-3', isDarkMode ? 'bg-pink-500/10 border-pink-500/25' : 'bg-pink-50 border-pink-200')}>
                <MessageSquareHeart size={20} className="text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', isDarkMode ? 'text-pink-300' : 'text-pink-700')}>Note from home</p>
                  <p className={cn('text-sm italic leading-relaxed', isDarkMode ? 'text-slate-200' : 'text-slate-700')}>"{idp.parentNote}"</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Teacher editor modal                                                */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {editorOpen && canEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditorOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0b1224] border border-white/15 rounded-[28px] shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
                <div>
                  <h3 className="text-lg font-black font-display text-white flex items-center gap-2">
                    {editingId ? <Pencil size={17} className="text-cyan-400" /> : <Plus size={17} className="text-cyan-400" />}
                    {editingId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">For {displayName} • saved to the learner's academic portfolio</p>
                </div>
                <button onClick={() => setEditorOpen(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Activity title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Fractions & Decimals Mastery Test"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as PortfolioItemType })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Subject</label>
                    <input
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Mathematics"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Result / Grade</label>
                    <input
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      placeholder="88% or Gold"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
                    <input
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      placeholder="12 Nov 2026"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">CAPS alignment</label>
                  <input
                    value={form.capsAlignment}
                    onChange={(e) => setForm({ ...form, capsAlignment: e.target.value })}
                    placeholder="Term 2: Numbers, Operations and Relationships"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Educator feedback</label>
                  <textarea
                    rows={3}
                    value={form.feedback}
                    onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                    placeholder="Vivid imagery and strong narrative structure. Great use of metaphors."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500 leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => setForm({ ...form, featured: !form.featured })}
                  className={cn(
                    'w-full p-3.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer',
                    form.featured
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                      : 'bg-slate-900 border-white/15 text-slate-300 hover:bg-white/10'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Star size={15} fill={form.featured ? 'currentColor' : 'none'} /> Feature in the highlight showcase
                  </span>
                  {form.featured && <CheckCircle2 size={15} className="text-amber-300" />}
                </button>
              </div>

              <div className="p-5 border-t border-white/10 flex items-center justify-end gap-3 bg-slate-900/60">
                <button onClick={() => setEditorOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingId ? 'Save Changes' : 'Add to Portfolio'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0b1224] border border-rose-500/30 rounded-[24px] p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-black font-display text-white">Remove portfolio item?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                "<span className="font-bold text-white">{confirmDelete.title}</span>" will be removed from {displayName}'s academic portfolio for learners and parents too.
              </p>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider cursor-pointer">Keep</button>
                <button onClick={() => handleDeleteItem(confirmDelete)} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer">Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {resolvingSelf && (
        <div className="flex items-center justify-center gap-3 py-6">
          <Loader2 size={18} className="animate-spin text-brand-cyan" />
          <span className={cn('text-xs font-bold uppercase tracking-widest', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Loading portfolio…</span>
        </div>
      )}
    </div>
  );
}
