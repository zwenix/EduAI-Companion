import React, { useState, useMemo } from 'react';
import { BookOpen, CheckCircle, FileText, Loader2, Target, BrainCircuit, Scan } from 'lucide-react';
import { generateEducationalContent, runOCRAndGrade } from '../services/geminiService';
import OCRScanner from './OCRScanner';
import { marked } from 'marked';
import { educationalData } from '../lib/educational-data';

export default function StudentPractice({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeTab, setActiveTab] = useState<'create'|'autograde'|'custom'>('create');
  const [grade, setGrade] = useState('10');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const [customQuestions, setCustomQuestions] = useState<{question: string, memo: string}[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newMemo, setNewMemo] = useState('');

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
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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
    setCustomQuestions([...customQuestions, { question: newQuestion, memo: newMemo }]);
    setNewQuestion('');
    setNewMemo('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
        <h2 className={`text-3xl font-hand mb-2 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><Target className="text-brand-cyan"/> Practice & Exercises</h2>
        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Generate CAPs-aligned mock assessments, practice your skills, and get instant AI feedback on your handwritten answers.</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={() => setActiveTab('create')} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'create' ? 'bg-brand-cyan text-white shadow-lg' : isDarkMode ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Generate Practice</button>
        <button onClick={() => setActiveTab('custom')} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'custom' ? 'bg-brand-cyan text-white shadow-lg' : isDarkMode ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Custom Questions</button>
        <button onClick={() => setActiveTab('autograde')} className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'autograde' ? 'bg-brand-cyan text-white shadow-lg' : isDarkMode ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Autograde Answers</button>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

          <div className="lg:col-span-2">
            {result ? (
              <div className={`${isDarkMode ? 'bg-slate-800 text-slate-200 border-white/10' : 'bg-white text-slate-900 border-slate-200'} p-8 rounded-[24px] border shadow-sm`}>
                <div 
                  dangerouslySetInnerHTML={{ __html: marked.parse(result.content || result) as string }} 
                  className={`prose max-w-none ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-800'}`} 
                />
                {result.memo && (
                  <div className={`mt-8 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'} pt-8`}>
                     <h3 className={`text-2xl font-hand mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Memo & Rubric</h3>
                     <div 
                        dangerouslySetInnerHTML={{ __html: marked.parse(result.memo) as string }} 
                        className={`prose max-w-none ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-800'}`} 
                     />
                  </div>
                )}
              </div>
            ) : (
               <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-12 rounded-[24px] border border-dashed text-center flex flex-col items-center justify-center opacity-70`}>
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
                    <div className={`p-4 rounded-xl border prose prose-sm max-w-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 prose-invert' : 'bg-slate-50 border-slate-100 text-slate-800'}`} dangerouslySetInnerHTML={{ __html: marked.parse(ocrResult.feedback) as string }} />
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
    </div>
  );
}
