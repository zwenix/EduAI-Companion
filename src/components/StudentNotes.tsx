import React, { useState, useMemo, useRef } from 'react';
import { BookOpen, Loader2, FileText, BrainCircuit, Download } from 'lucide-react';
import { generateEducationalContent } from '../services/geminiService';
import { marked } from 'marked';
import { educationalData } from '../lib/educational-data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function StudentNotes({ isDarkMode }: { isDarkMode: boolean }) {
  const [grade, setGrade] = useState('10');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('Study Notes');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
      setProgress(prev => Math.min(prev + Math.floor(Math.random() * 10) + 5, 95));
    }, 500);

    try {
      const prompt = `Grade: ${grade}\nSubject: ${subject}\nTopic: ${topic}\nFormat: ${format}`;
      const res = await generateEducationalContent(`${format} aligned to CAPS`, prompt);
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
         setResult(res);
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
      const canvas = await html2canvas(printRef.current, { scale: 2 });
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
          <button onClick={generateNotes} disabled={loading || !subject || !topic} className={`w-full ${isDarkMode ? 'bg-brand-cyan hover:bg-brand-cyan/80 text-navy-dark' : 'bg-slate-800 hover:bg-slate-700 text-white'} font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-4 transition-all`}>
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

        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={handleExportPDF}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  <Download size={16} /> Export to PDF
                </button>
              </div>
              <div ref={printRef} className={`${isDarkMode ? 'bg-slate-800 text-slate-200 border-white/10' : 'bg-white text-slate-900 border-slate-200'} p-8 rounded-[24px] border shadow-sm`}>
                <div 
                  dangerouslySetInnerHTML={{ __html: marked.parse(result.content || result) as string }} 
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
    </div>
  );
}
