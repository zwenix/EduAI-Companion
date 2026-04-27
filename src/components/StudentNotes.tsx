import React, { useState, useMemo } from 'react';
import { BookOpen, Loader2, FileText, BrainCircuit } from 'lucide-react';
import { generateEducationalContent } from '../services/geminiService';
import { marked } from 'marked';
import { educationalData } from '../lib/educational-data';

export default function StudentNotes({ isDarkMode }: { isDarkMode: boolean }) {
  const [grade, setGrade] = useState('10');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('Study Notes');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    setResult(null);
    try {
      const prompt = `Grade: ${grade}\nSubject: ${subject}\nTopic: ${topic}\nFormat: ${format}`;
      const res = await generateEducationalContent(`${format} aligned to CAPS`, prompt);
      setResult(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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
            <select value={subject} onChange={e => { setSubject(e.target.value); setTopic(''); }} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-200 bg-slate-50'}`}>
              <option value="" className={isDarkMode ? 'bg-slate-800' : ''}>Select a subject...</option>
              {subjects.map(s => <option key={s} value={s} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Topic / Focus</label>
            <select value={topic} onChange={e => setTopic(e.target.value)} disabled={!subject} className={`w-full p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white disabled:opacity-50' : 'border-slate-200 bg-slate-50 disabled:opacity-50'}`}>
               <option value="" className={isDarkMode ? 'bg-slate-800' : ''}>Select a topic...</option>
               {topics.map(t => <option key={t} value={t} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>{t}</option>)}
            </select>
          </div>
          <button onClick={generateNotes} disabled={loading || !subject || !topic} className={`w-full ${isDarkMode ? 'bg-brand-cyan hover:bg-brand-cyan/80 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'} font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-4`}>
            {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
            Generate {format}
          </button>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[24px] shadow-sm content-preview-html text-slate-800 ${isDarkMode ? 'dark-preview-rendered' : ''}`}>
              <div dangerouslySetInnerHTML={{ __html: marked.parse(result.content || result) as string }} className={isDarkMode ? 'text-slate-200' : 'text-slate-800'} />
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
