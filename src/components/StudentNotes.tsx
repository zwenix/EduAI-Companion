import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BookOpen, Loader2, FileText, BrainCircuit, Download, History, ArrowRight, Eye } from 'lucide-react';
import { generateEducationalContent } from '../services/geminiService';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { educationalData } from '../lib/educational-data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import ReaderModeModal from './ReaderModeModal';

export default function StudentNotes({ isDarkMode }: { isDarkMode: boolean }) {
  const [grade, setGrade] = useState('10');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('Study Notes');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Archive and Reader states
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Fetch student study guides history from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setHistoryLoading(true);
    const q = query(
      collection(db, 'created_content'),
      where('teacherId', '==', user.uid),
      where('contentType', '==', 'Study Notes')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort items by date descending
      items.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setHistory(items);
      setHistoryLoading(false);
    }, (error) => {
      console.error("Error loading historical study notes", error);
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

  const generateNotes = async () => {
    setLoading(true);
    setProgress(0);
    setResult(null);
    
    // Simulate progress during API calling
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.floor(Math.random() * 15) + 8, 95));
    }, 450);

    try {
      const prompt = `Grade: ${grade}\nSubject: ${subject}\nTopic: ${topic}\nFormat: ${format}`;
      const res = await generateEducationalContent(`${format} aligned to CAPS`, prompt);
      clearInterval(progressInterval);
      setProgress(100);
      
      const parsedContent = res.content || res;

      // Save generated notes package directly to Firestore so they populate the Student's Archive
      const user = auth.currentUser;
      if (user) {
        const docId = `notes_${Date.now()}`;
        await setDoc(doc(db, 'created_content', docId), {
          title: `${format}: ${topic || 'General study notes'}`,
          subject: subject,
          grade: `Grade ${grade}`,
          contentType: 'Study Notes',
          content: parsedContent,
          teacherId: user.uid,
          isSystem: false,
          createdAt: serverTimestamp()
        });
      }

      setTimeout(() => {
         setResult(parsedContent);
         setLoading(false);
      }, 300);
    } catch (e) {
      console.error(e);
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    try {
      const restoreGetComputedStyle = patchOklchForHtml2canvas();
      let canvas;
      try {
        canvas = await html2canvas(printRef.current, { scale: 2 });
      } finally {
        restoreGetComputedStyle();
      }
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`${subject.replace(/\s+/g, '_')}_${topic.replace(/\s+/g, '_')}_Notes.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
        <h2 className={`text-3xl font-hand mb-2 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><BookOpen className="text-brand-cyan"/> Study Notes & Revision</h2>
        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Generate personalized, CAPS-aligned study notes, flashcards, mind-map outlines, and revision packs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1 border-0">
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] space-y-4 shadow-sm h-fit`}>
            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Setup Parameters</h3>
            
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800 focus:outline-none' : 'border-slate-200 bg-slate-50'}`}>
                <option value="Study Notes" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Comprehensive Study Notes</option>
                <option value="Revision Pack" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Revision Pack (Summary + Key Questions)</option>
                <option value="Flashcards Content" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Flashcards (Terms & Definitions)</option>
                <option value="Mind Map Outline" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Mind Map Outline</option>
              </select>
            </div>

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
            <button onClick={generateNotes} disabled={loading || !subject || !topic} className={`w-full ${isDarkMode ? 'bg-brand-cyan hover:bg-brand-cyan/80 text-navy-dark' : 'bg-slate-800 hover:bg-slate-700 text-white'} font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer transition-all`}>
              {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
              {loading ? 'Generating...' : `Generate ${format}`}
            </button>
            {loading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className={isDarkMode ? 'text-brand-cyan' : 'text-slate-600'}>Generating Content</span>
                  <span className={isDarkMode ? 'text-brand-cyan' : 'text-slate-600'}>{progress}%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                  <div 
                    className="h-full bg-brand-cyan transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Historical Saved Study Material Archive */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 rounded-[24px] shadow-sm space-y-4`}>
            <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
              <History size={16} className="text-brand-cyan" />
              Syllabus Notes Archive
            </h3>
            {historyLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-brand-cyan" />
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setResult(item.content || item);
                      setGrade(item.grade?.replace('Grade ', '') || '10');
                      setSubject(item.subject || '');
                      setTopic(item.title?.split(': ')[1] || item.title || '');
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
              <p className="text-xs text-slate-500 italic">No historical study materials found. Newly generated materials will automatically populate this cloud archive!</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-4">
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setIsReaderOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-cyan-500/20"
                >
                  <Eye size={16} /> 📖 Read in Reader Mode
                </button>
                <button 
                  onClick={handleExportPDF}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-150 hover:bg-slate-200 text-slate-700'}`}
                >
                  <Download size={16} /> Export to PDF
                </button>
              </div>
              <div ref={printRef} className={`${isDarkMode ? 'bg-slate-800 text-slate-200 border-white/10' : 'bg-white text-slate-900 border-slate-200'} p-8 rounded-[24px] border shadow-sm`}>
                <div 
                  dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(result.content || result) as string) }} 
                  className={`prose max-w-none ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-800'}`} 
                />
              </div>
            </div>
          ) : (
             <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-12 rounded-[24px] border border-dashed text-center flex flex-col items-center justify-center opacity-70`}>
               <FileText size={48} className={`${isDarkMode ? 'text-slate-500' : 'text-slate-300'} mb-4`} />
               <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your generated study materials will appear here.</p>
             </div>
          )}
        </div>
      </div>

      {/* Reader Mode Full Viewport Experience */}
      {result && (
        <ReaderModeModal 
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          title={`${topic || 'Syllabus Notes study Guide'}`}
          content={result.content || result}
          subject={subject}
          grade={grade}
        />
      )}
    </div>
  );
}
