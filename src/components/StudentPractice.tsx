import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, CheckCircle, FileText, Loader2, Target, BrainCircuit, Scan, History, ArrowRight, Download, Printer, Award, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { generateEducationalContent, runOCRAndGrade } from '../services/geminiService';
import OCRScanner from './OCRScanner';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { educationalData } from '../lib/educational-data';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import html2pdf from 'html2pdf.js';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';
import PrintPreviewModal from './PrintPreviewModal';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function StudentPractice({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeTab, setActiveTab] = useState<'create'|'autograde'|'custom'>('create');
  const [grade, setGrade] = useState('10');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

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
    if (!result) return;
    const contentString = result.content || result;
    const memoString = result.memo;
    const filename = `${(subject || 'Subject').replace(/\s+/g, '_')}_${(topic || 'Topic').replace(/\s+/g, '_')}_Practice.pdf`;

    // Create offscreen container
    const tempContainer = document.createElement('div');
    tempContainer.className = 'bg-white text-slate-900 p-8 markdown-body';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px'; 
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";

    // Convert potential markdown to HTML first if it's not raw HTML
    let bodyHtml = typeof contentString === 'string' ? contentString.trim() : '';
    if (bodyHtml && !bodyHtml.startsWith('<')) {
      bodyHtml = marked.parse(bodyHtml) as string;
    }
    bodyHtml = replaceImagePlaceholders(bodyHtml);

    let memoHtml = typeof memoString === 'string' ? memoString.trim() : '';
    if (memoHtml) {
      if (!memoHtml.startsWith('<')) {
        memoHtml = marked.parse(memoHtml) as string;
      }
      memoHtml = replaceImagePlaceholders(memoHtml);
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'space-y-6 text-slate-800';
    contentEl.innerHTML = `
      <div style="margin-bottom: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 12px;">
        <h1 style="font-size: 24px; font-weight: 800; color: #1e3a8a; margin: 0;">${subject || 'CAPS Practice Session'}</h1>
        <p style="font-size: 14px; color: #4b5563; margin: 4px 0 0 0;">Topic: ${topic || 'Practice exercises'} • EduAI Companion</p>
      </div>
      <div>
        ${bodyHtml}
      </div>
      ${memoHtml ? `
        <div class="print-page-break" style="page-break-before: always; margin-top: 40px; border-top: 2px dashed #94a3b8; padding-top: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #059669; margin-bottom: 16px;">Memo & Answer Guidelines</h2>
          ${memoHtml}
        </div>
      ` : ''}
    `;
    tempContainer.appendChild(contentEl);
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
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    });
  };
  
  const handleScanAndGrade = async (imageData: string) => {
    if (!result?.memo && customQuestions.length === 0) {
      alert("Please generate a practice assessment first or add custom questions with memos to grade against.");
      return;
    }
    setOcrLoading(true);
    try {
      const rubricSource = result?.memo || customQuestions.map((q, i) => `Q${i+1}: ${q.question}\nMemo: ${q.memo}`).join('\n\n');
      const graded = await runOCRAndGrade(imageData, rubricSource);
      setOcrResult(graded);
    } catch (error) {
      console.error(error);
      alert("Autograding failed.");
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
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className={cn(
        "relative rounded-[36px] p-8 lg:p-12 overflow-hidden text-white flex flex-col justify-end min-h-[300px] border shadow-2xl",
        isDarkMode ? "bg-[#0B1122] border-white/10" : "bg-slate-900 border-slate-800"
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
           <Target size={200} />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
        
        <div className="relative z-10 max-w-3xl">
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-emerald-300 mb-6 shadow-sm">
             <Trophy size={16} className="text-emerald-400" /> Practice Zone
           </motion.div>
           <h1 className="text-4xl lg:text-6xl font-hand tracking-wide leading-tight mb-4 drop-shadow-md">
             Practice & <span className="text-brand-cyan">Exercises</span>
           </h1>
           <p className="text-slate-300 font-medium text-sm lg:text-base leading-relaxed max-w-lg">
             Generate CAPS-aligned mock assessments, practice your skills, and get instant, detailed feedback on your handwritten answers.
           </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={() => setActiveTab('create')} className={cn("px-6 py-3 rounded-full font-bold transition-all border cursor-pointer", activeTab === 'create' ? 'bg-brand-cyan text-slate-950 border-brand-cyan/20 shadow-lg shadow-cyan-500/20' : isDarkMode ? 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>Generate Practice</button>
        <button onClick={() => setActiveTab('custom')} className={cn("px-6 py-3 rounded-full font-bold transition-all border cursor-pointer", activeTab === 'custom' ? 'bg-brand-cyan text-slate-950 border-brand-cyan/20 shadow-lg shadow-cyan-500/20' : isDarkMode ? 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>Custom Questions</button>
        <button onClick={() => setActiveTab('autograde')} className={cn("px-6 py-3 rounded-full font-bold transition-all border cursor-pointer", activeTab === 'autograde' ? 'bg-brand-cyan text-slate-950 border-brand-cyan/20 shadow-lg shadow-cyan-500/20' : isDarkMode ? 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>Autograde Answers</button>
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
                          ? 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-slate-300'
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
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-150 hover:bg-slate-200 text-slate-700'}`}
                  >
                    <Download size={16} /> Export Practice to PDF
                  </button>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-white text-slate-900 border-slate-200'} p-8 rounded-[36px] border shadow-sm`}>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: (result.content || result).trim().startsWith('<') 
                        ? replaceImagePlaceholders(result.content || result)
                        : replaceImagePlaceholders(marked.parse(result.content || result) as string)
                    }} 
                    className={`prose max-w-none ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-850'}`} 
                  />
                  {result.memo && (
                    <div className={`mt-8 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'} pt-8`}>
                       <h3 className={`text-2xl font-hand mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Memo & Rubric</h3>
                       <div 
                          dangerouslySetInnerHTML={{ 
                            __html: result.memo.trim().startsWith('<') 
                              ? replaceImagePlaceholders(result.memo)
                              : replaceImagePlaceholders(marked.parse(result.memo) as string)
                          }} 
                          className={`prose max-w-none ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-800'}`} 
                       />
                    </div>
                  )}
                </div>
              </div>
            ) : (
               <div className={`${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-slate-50 border-slate-200'} p-12 rounded-[36px] border border-dashed text-center flex flex-col items-center justify-center opacity-70`}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
            <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}><Scan size={20}/> Submit Your Work</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Take a photo of your handwritten answers or upload a screenshot to get instant AI grading against the memo.</p>
            <div className="mt-4">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      if (typeof e.target?.result === 'string') {
                        handleScanAndGrade(e.target.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                disabled={ocrLoading}
                className={`w-full p-4 border-2 border-dashed rounded-[20px] text-center cursor-pointer transition-all ${isDarkMode ? 'border-slate-700 hover:border-brand-cyan text-slate-300' : 'border-slate-300 hover:border-brand-cyan text-slate-600'}`}
              />
            </div>
          </div>
          
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
            <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}><CheckCircle size={20}/> Detailed Feedback</h3>
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
