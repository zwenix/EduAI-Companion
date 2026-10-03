import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, FileText, Loader2, Target, BrainCircuit, Scan, History, ArrowRight, Download, Printer, Award, Trophy, ChevronRight, ListChecks, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { generateEducationalContent, runOCRAndGrade } from '../services/geminiService';
import OCRScanner from './OCRScanner';
import { marked } from 'marked';

const stripMarkdownWrapper = (text: string) => {
  if (!text) return text;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    if (lines.length > 1 && lines[0].startsWith('```')) {
      lines.shift();
    }
    if (lines.length > 0 && lines[lines.length - 1].startsWith('```')) {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }
  return cleaned;
};

import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { educationalData } from '../lib/educational-data';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import html2pdf from 'html2pdf.js';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';
import { cleanupExportArtifacts } from '../lib/printUtils';
import { wrapWithTemplate } from '../lib/contentTemplate';
import PrintPreviewModal from './PrintPreviewModal';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function StudentPractice({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeTab, setActiveTab] = useState<'create'|'autograde'|'custom'>('create');
  const [grade, setGrade] = useState('10');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const practiceMarkup = useMemo(() => {
    if (!result) return '';
    const toHtml = (value: any): string => {
      const raw = stripMarkdownWrapper(String(value || ''));
      if (!raw) return '';
      return raw.trim().startsWith('<') || /<\/?[a-z][\s\S]*>/i.test(raw)
        ? replaceImagePlaceholders(raw)
        : replaceImagePlaceholders(marked.parse(raw) as string);
    };
    const content = toHtml(result.content || result);
    const memo = result.memo ? `<section class="practice-memo" style="page-break-before:always;margin-top:40px;border-top:2px dashed #94a3b8;padding-top:24px;"><h2>Memo &amp; Rubric</h2>${toHtml(result.memo)}</section>` : '';
    return wrapWithTemplate(`${content}${memo}`, {
      title: topic || 'Practice Assessment',
      subject,
      grade,
      term: 'Term 1',
      contentType: 'Practice Assessment'
    });
  }, [result, topic, subject, grade]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  // Autograde dropzone: a real <button> drives a hidden file input so the
  // learner gets the same visible upload target as the Auto-Grading Lab
  // instead of the browser's default "Choose File  No file chosen" widget.
  const autogradeInputRef = useRef<HTMLInputElement | null>(null);
  const [submittedPreview, setSubmittedPreview] = useState<string | null>(null);
  const [gradeNotice, setGradeNotice] = useState<string | null>(null);

  const [customQuestions, setCustomQuestions] = useState<{question: string, memo: string}[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newMemo, setNewMemo] = useState('');

  // Practice History States
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load customQuestions on mount
  useEffect(() => {
    const saved = localStorage.getItem('eduai_student_custom_questions');
    if (saved) {
      try {
        setCustomQuestions(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  // Sync customQuestions locally
  const saveCustomQuestionsLocally = (updatedList: any[]) => {
    setCustomQuestions(updatedList);
    localStorage.setItem('eduai_student_custom_questions', JSON.stringify(updatedList));
  };

  // Fetch real practice history from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setHistoryLoading(true);
    const q = query(
      collection(db, 'created_content'),
      where('teacherId', '==', user.uid),
      where('contentType', '==', 'Practice Exercise')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort items by createdAt descending
      items.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setHistory(items);
      setHistoryLoading(false);
    }, (error) => {
      console.error("Error loading historical practices", error);
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const subjects = useMemo(() => {
    if (!grade) return [];
    const gradeData = educationalData[grade as keyof typeof educationalData];
    return gradeData ? Object.keys(gradeData) : [];
  }, [grade]);

  const topics = useMemo(() => {
    if (!grade || !subject) return [];
    const gradeData = educationalData[grade as keyof typeof educationalData];
    return gradeData && gradeData[subject] ? gradeData[subject] : [];
  }, [grade, subject]);
  
  const generatePractice = async () => {
    setLoading(true);
    setResult(null);
    try {
      const prompt = `Grade: ${grade}\nSubject: ${subject}\nTopic: ${topic}`;
      const res = await generateEducationalContent('Practice Assessment & Exercises with Memo & Rubric. Make sure it is aligned to CAPS.', prompt);
      setResult(res);

      // Persist generated practice to Firestore
      const user = auth.currentUser;
      if (user) {
        const docId = `practice_${Date.now()}`;
        await setDoc(doc(db, 'created_content', docId), {
          title: `Practice: ${topic || 'General Practice'}`,
          subject: subject,
          grade: `Grade ${grade}`,
          contentType: 'Practice Exercise',
          content: res,
          teacherId: user.uid,
          isSystem: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleExportPDF = async () => {
    if (!result || !practiceMarkup) return;
    const filename = `${(subject || 'Subject').replace(/\s+/g, '_')}_${(topic || 'Topic').replace(/\s+/g, '_')}_Practice.pdf`;

    // Export the exact canonical preview markup. Keeping this path on the
    // shared wrapper prevents the old ad-hoc header and memo export from
    // bypassing the single compliance banner/footer contract.
    const tempContainer = document.createElement('div');
    tempContainer.className = 'bg-white text-slate-900';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.zIndex = '-9999';
    tempContainer.innerHTML = practiceMarkup;
    document.body.appendChild(tempContainer);

    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak:    { mode: ['avoid-all' as const, 'css' as const, 'legacy' as const] }
    };

    const restoreGetComputedStyle = patchOklchForHtml2canvas();
    
    html2pdf().from(tempContainer).set(opt).save().catch((err: any) => {
      console.error("PDF download failed:", err);
    }).finally(() => {
      restoreGetComputedStyle();
      // A failed render can leave html2pdf's invisible full-screen overlay (and a
      // cloned-iframe DOM copy) behind — sweep them so the app stays tappable.
      cleanupExportArtifacts();
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    });
  };
  
  const handleScanAndGrade = async (imageData: string) => {
    // `window.alert()` is a bare, unstyled dialog (and is suppressed outright
    // in some Android WebView builds), so the learner never saw why grading was
    // refused. Surface it as an inline banner in the panel instead.
    if (!result?.memo && customQuestions.length === 0) {
      setSubmittedPreview(null);
      setOcrResult(null);
      setGradeNotice(
        'Nothing to grade against yet. Generate a practice assessment first, or add custom questions with memos \u2014 the memo is the marking rubric.'
      );
      return;
    }
    setGradeNotice(null);
    setSubmittedPreview(imageData);
    setOcrLoading(true);
    try {
      const rubricSource = result?.memo || customQuestions.map((q, i) => `Q${i+1}: ${q.question}\nMemo: ${q.memo}`).join('\n\n');
      const graded = await runOCRAndGrade(imageData, rubricSource);
      setOcrResult(graded);
    } catch (error) {
      console.error(error);
      setGradeNotice('Autograding failed. Check the image is clear and well lit, then try again.');
    }
    setOcrLoading(false);
  };

  const addCustomQuestion = () => {
    if (!newQuestion.trim()) return;
    const updated = [...customQuestions, { question: newQuestion, memo: newMemo }];
    saveCustomQuestionsLocally(updated);
    setNewQuestion('');
    setNewMemo('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 pb-12 animate-in fade-in duration-700">
      {/* ── Practice Zone Landing Hero ────────────────────────────────────────
          The old hero was `bg-transparent` with a `from-slate-900 → transparent`
          veil and a remote `transparenttextures.com` overlay, so it rendered as
          an empty see-through box (and the texture silently 404'd offline / in
          the Android WebView). A 200px `Target` icon sat in the corner and the
          three tab pills below were `bg-transparent border-white/10` — nearly
          invisible against the navy shell.

          It now uses the same hero plate the rest of the app ships (see the
          Auto-Grading Lab banner and the hub showcase cards): a solid navy
          gradient card, ambient glow blobs, a badge chip, art-title/art-body
          copy on that solid plate, and a filled segmented tab bar with icons.
          The remote texture image is gone (it was an extra third-party request
          that 404'd offline). The accent
          is amber/orange to match the "Quiz Wizard / Practice Zone" showcase
          card in CategoryOverview, keeping the hub → page colour story intact.
      */}
      <div className="relative overflow-hidden rounded-[32px] border-2 border-amber-500/25 bg-gradient-to-br from-[#1b1024] via-[#0a0b1e] to-[#2a1508] p-6 sm:p-8 lg:p-9 shadow-[0_0_40px_rgba(249,115,22,0.16)]">
        <div className="absolute -top-24 -right-16 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-16 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
          {/* Copy */}
          <div className="min-w-0 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-300 art-chip"
            >
              <Trophy size={14} className="shrink-0 text-amber-400" />
              <span>Practice Zone · CAPS Aligned</span>
            </motion.div>

            <h1 className="mt-4 font-hand text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-wide text-white art-title">
              Practice &amp; <span className="text-amber-300">Exercises</span>
            </h1>

            <p className="mt-3 max-w-lg text-xs sm:text-sm lg:text-base font-medium leading-relaxed text-slate-300 art-body">
              Generate CAPS-aligned mock assessments, drill your skills with custom questions, and
              get instant, detailed feedback on your handwritten answers.
            </p>

            {/* Quick-start CTA — gives the landing page one obvious action */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition-all hover:from-amber-300 hover:to-orange-400 hover:shadow-[0_0_36px_rgba(249,115,22,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 active:scale-[0.97]"
              >
                <BrainCircuit size={17} className="shrink-0" />
                <span className="whitespace-nowrap">Start Practising</span>
                <ChevronRight size={15} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('autograde')}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 transition-all hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-200 active:scale-[0.97]"
              >
                <Scan size={16} className="shrink-0 text-amber-400" />
                <span className="whitespace-nowrap">Autograde My Answers</span>
              </button>
            </div>
          </div>

          {/* Three-step panel — replaces the oversized decorative Target icon */}
          <div className="w-full shrink-0 xl:w-72">
            <div className="rounded-2xl border border-white/10 bg-[#070914]/70 p-4 backdrop-blur-sm">
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                How the zone works
              </p>
              <ol className="space-y-2.5">
                {[
                  { icon: BrainCircuit, label: 'Generate', note: 'AI builds a CAPS paper + memo', tone: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
                  { icon: ListChecks, label: 'Practise', note: 'Add your own questions & answers', tone: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' },
                  { icon: Scan, label: 'Autograde', note: 'Snap your script for instant marks', tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
                ].map((step, i) => (
                  <li key={step.label} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${step.tone}`}>
                      <step.icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black uppercase tracking-wider text-white">
                        {i + 1}. {step.label}
                      </span>
                      <span className="block text-[11px] leading-snug text-slate-300">{step.note}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* ── Segmented tab bar ─────────────────────────────────────────────────
          Mirrors the Auto-Grading Lab navigation: one contained rail with a
          filled active pill (icon + label) instead of three floating
          transparent pills, so the current section is unmistakable and the
          inactive ones are still clearly tappable. */}
      <div className={cn(
        "flex flex-wrap gap-2 rounded-2xl border p-1.5 shadow-lg",
        isDarkMode ? "border-amber-500/20 bg-[#0c1024]/90" : "border-slate-200 bg-white"
      )}>
        {[
          { id: 'create' as const, label: 'Generate Practice', icon: BrainCircuit, badge: 0 },
          // Only a real count is badged — a "1" on Autograde would read as a
          // queue length. A graded result is confirmed in its own panel below.
          { id: 'custom' as const, label: 'Custom Questions', icon: ListChecks, badge: customQuestions.length },
          { id: 'autograde' as const, label: 'Autograde Answers', icon: Scan, badge: 0 },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all min-w-[150px] sm:min-w-[180px] active:scale-[0.98]",
                isActive
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.35)]"
                  : isDarkMode
                    ? "text-slate-400 hover:bg-white/5 hover:text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon size={16} className={cn("shrink-0", isActive ? "text-slate-950" : "text-amber-500")} />
              <span className="truncate">{tab.label}</span>
              {tab.badge ? (
                <span className={cn(
                  "ml-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none",
                  isActive ? "bg-slate-950/20 text-slate-950" : isDarkMode ? "bg-white/10 text-slate-300" : "bg-slate-200 text-slate-600"
                )}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6 lg:col-span-1">
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] space-y-4 shadow-sm h-fit`}>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Setup Parameters</h3>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Grade</label>
                <select value={grade} onChange={e => { setGrade(e.target.value); setSubject(''); setTopic(''); }} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800 focus:outline-none' : 'border-slate-200 bg-slate-50'}`}>
                  {Object.keys(educationalData).map(g => <option key={g} value={g} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Grade {g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Subject</label>
                {subject === 'Other' ? (
                  <input type="text" placeholder="Type custom subject..." onChange={e => setSubject(e.target.value)} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 bg-slate-50'}`} autoFocus />
                ) : (
                  <select value={subject} onChange={e => { setSubject(e.target.value); setTopic(''); }} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 bg-slate-50'}`}>
                    <option value="" className={isDarkMode ? 'bg-slate-800' : ''}>Select a subject...</option>
                    {subjects.map(s => <option key={s} value={s} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>{s}</option>)}
                    <option value="Other" className={isDarkMode ? 'bg-slate-800 text-brand-cyan font-bold' : 'text-brand-cyan font-bold'}>+ Custom Subject...</option>
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Topic / Focus</label>
                {topic === 'Other' ? (
                  <input type="text" placeholder="Type custom topic..." onChange={e => setTopic(e.target.value)} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 bg-slate-50'}`} autoFocus />
                ) : (
                  <select value={topic} onChange={e => setTopic(e.target.value)} disabled={!subject} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white disabled:opacity-50' : 'border-slate-200 bg-slate-50 disabled:opacity-50'}`}>
                     <option value="" className={isDarkMode ? 'bg-slate-800' : ''}>Select a topic...</option>
                     {topics.map(t => <option key={t} value={t} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>{t}</option>)}
                     <option value="Other" className={isDarkMode ? 'bg-slate-800 text-brand-cyan font-bold' : 'text-brand-cyan font-bold'}>+ Custom Topic...</option>
                  </select>
                )}
              </div>
              <button onClick={generatePractice} disabled={loading || !subject || !topic} className={`w-full ${isDarkMode ? 'bg-brand-cyan hover:bg-brand-cyan/80 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'} font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-4`}>
                {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                Generate Practice
              </button>
            </div>

            {/* Historical Exercises */}
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
              <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                <History size={16} className="text-brand-cyan" />
                Practice History
              </h3>
              {historyLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-brand-cyan" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setResult(item.content);
                        setGrade(item.grade?.replace('Grade ', '') || '10');
                        setSubject(item.subject || 'Mathematics');
                        setTopic(item.title?.replace('Practice: ', '') || '');
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                        isDarkMode
                          ? 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-transparent text-slate-300'
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="font-bold truncate">{item.title}</p>
                        <p className="text-[10px] opacity-75">{item.subject} • {item.grade}</p>
                      </div>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-cyan shrink-0 animate-bounce" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No saved practices found yet. Generated sessions are automatically persisted.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {result ? (
              <div className="space-y-4">
                <div className="flex justify-end gap-2 flex-wrap">
                  <button 
                    onClick={() => setShowPrintModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/20"
                  >
                    <Printer size={16} /> Print / Preview (A4)
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${isDarkMode ? 'bg-transparent hover:bg-transparent text-white' : 'bg-slate-150 hover:bg-slate-200 text-slate-700'}`}
                  >
                    <Download size={16} /> Export Practice to PDF
                  </button>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-900/90 border-white/10 text-slate-200' : 'bg-white text-slate-900 border-slate-200'} p-8 rounded-[36px] border shadow-sm`}>
                  <div
                    dangerouslySetInnerHTML={{ __html: practiceMarkup }}
                    className={`prose max-w-none ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-850'}`}
                  />
                </div>
              </div>
            ) : (
               <div className={`${isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-slate-50 border-slate-200'} p-12 rounded-[36px] border border-dashed text-center flex flex-col items-center justify-center opacity-70`}>
                 <FileText size={48} className={`${isDarkMode ? 'text-slate-500' : 'text-slate-300'} mb-4`} />
                 <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your generated practice content will appear here.</p>
               </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
            <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Create Custom Question</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Question text</label>
                <textarea 
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'} min-h-[100px]`}
                  placeholder="E.g., What are the three states of matter?"
                />
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Expected Answer / Memo</label>
                <textarea 
                  value={newMemo}
                  onChange={e => setNewMemo(e.target.value)}
                  className={`w-full p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'} min-h-[100px]`}
                  placeholder="E.g., Solid, Liquid, Gas. Allocate 1 mark for each."
                />
              </div>
              <button onClick={addCustomQuestion} disabled={!newQuestion.trim()} className={`w-full ${isDarkMode ? 'bg-brand-cyan hover:bg-brand-cyan/80 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'} font-bold py-4 rounded-xl transition-all disabled:opacity-50`}>
                Add to List
              </button>
            </div>
          </div>
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
            <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Your Custom List ({customQuestions.length})</h3>
            {customQuestions.length > 0 ? (
              <div className="space-y-4 h-full max-h-[400px] overflow-y-auto pr-2">
                {customQuestions.map((q, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Q{i+1}: {q.question}</h4>
                    {q.memo && <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} italic`}>Memo: {q.memo}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-12 rounded-[24px] border border-dashed text-center flex flex-col items-center justify-center h-full min-h-[250px] opacity-70`}>
                <FileText size={40} className={`${isDarkMode ? 'text-slate-500' : 'text-slate-300'} mb-4`} />
                <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your custom questions will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'autograde' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className={`font-bold flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
                  <Scan size={17} />
                </span>
                Submit Your Work
              </h3>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                Step 1 · Upload script
              </span>
            </div>

            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Take a photo of your handwritten answers or upload a screenshot to get instant AI
              grading against the memo.
            </p>

            {gradeNotice && (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 text-xs font-medium leading-relaxed ${isDarkMode ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{gradeNotice}</span>
              </div>
            )}

            {/* Dropzone button (was a bare <input type="file">) */}
            <button
              type="button"
              onClick={() => autogradeInputRef.current?.click()}
              disabled={ocrLoading}
              className={cn(
                "group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed p-8 text-center transition-all active:scale-[0.99] disabled:cursor-wait disabled:opacity-70",
                isDarkMode
                  ? "border-amber-500/35 bg-slate-900/60 hover:border-amber-400 hover:bg-amber-500/[0.07]"
                  : "border-amber-400/60 bg-amber-50/40 hover:border-amber-500 hover:bg-amber-50"
              )}
            >
              {ocrLoading ? (
                <Loader2 size={30} className="animate-spin text-amber-500" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-md transition-transform group-hover:scale-110">
                  <Target size={26} />
                </span>
              )}
              <span className={`block font-display text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {ocrLoading ? 'Reading your answers…' : 'Snap or upload your answers'}
              </span>
              <span className={`block max-w-xs text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {ocrLoading
                  ? 'Matching each answer against the memorandum and rubric.'
                  : 'Keep the page flat, well lit and in focus for the best marks.'}
              </span>
              {!ocrLoading && (
                <span className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  {['Camera', 'JPG / PNG', 'Instant marks'].map((fmt) => (
                    <span
                      key={fmt}
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider",
                        isDarkMode ? "border-white/10 bg-white/5 text-slate-400" : "border-slate-200 bg-white text-slate-500"
                      )}
                    >
                      {fmt}
                    </span>
                  ))}
                </span>
              )}
            </button>

            <input
              ref={autogradeInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    if (typeof evt.target?.result === 'string') {
                      handleScanAndGrade(evt.target.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }
                // Reset so re-submitting the same file still fires onChange.
                e.target.value = '';
              }}
            />

            {submittedPreview && (
              <div className="space-y-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Submitted script
                </p>
                <img
                  src={submittedPreview}
                  alt="Your submitted answer script"
                  className="max-h-52 w-full rounded-2xl border border-black/10 object-contain"
                />
              </div>
            )}
          </div>
          
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className={`font-bold flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                  <CheckCircle size={17} />
                </span>
                Detailed Feedback
              </h3>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Step 2 · Your marks
              </span>
            </div>
            {ocrLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                 <Loader2 size={40} className="animate-spin text-brand-cyan mb-4" />
                 <p className={`font-medium animate-pulse ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Analyzing answers & evaluating rubric...</p>
              </div>
            ) : ocrResult ? (
              <div className="space-y-6">
                 <div>
                    <h4 className={`text-sm font-bold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>AI Feedback</h4>
                    <div className={`p-4 rounded-xl border prose prose-sm max-w-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 prose-invert' : 'bg-slate-50 border-slate-100 text-slate-800'}`} dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(ocrResult.feedback) as string) }} />
                 </div>
                 {ocrResult.marksPerQuestion && (
                   <div>
                      <h4 className={`text-sm font-bold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Marks Breakdown</h4>
                      <ul className="space-y-2">
                        {ocrResult.marksPerQuestion.map((m: string, i: number) => (
                           <li key={i} className={`p-3 rounded-lg border flex items-center justify-between text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                             <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{m.split(':')[0] || `Q${i+1}`}</span>
                             <span className="font-bold text-brand-cyan">{m.split(':')[1] || m}</span>
                           </li>
                        ))}
                      </ul>
                   </div>
                 )}
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-12 rounded-[24px] border border-dashed text-center flex flex-col items-center justify-center opacity-70 h-full min-h-[300px]`}>
                <CheckCircle size={48} className={`${isDarkMode ? 'text-slate-500' : 'text-slate-300'} mb-4`} />
                <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your grading results and feedback will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive A4 Print Preview Modal */}
      {result && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={topic || 'Practice Assessment'}
          content={result.content || result}
          memo={result.memo}
          rubric={result.rubric}
          options={{
            subject: subject || 'General',
            grade: grade || 'All',
            contentType: 'Practice Exercise',
            title: topic || 'Practice session'
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
