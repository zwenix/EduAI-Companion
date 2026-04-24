import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Loader2, Sparkles, Printer, Save, Trash2, Download, Send,
  FlaskConical, Palette, FileText, Eye, BookOpen, GraduationCap,
  ChevronDown, ChevronUp, Zap, ClipboardList, ImageIcon, Settings2, RefreshCw,
  Check, X, Plus, Users, Layout, Video, FileCode, HelpCircle, Archive, UserCircle, Image, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { educationalData } from '../lib/educational-data';
import { generateCAPSContent, generateVisualAid, generateAdminDoc } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';
import Grade1EnglishGenerator from "./Grade1EnglishGenerator";

// ─── Utility ───────────────────────────────────────────────────────────────
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// ─── Constants (Matched to User Requirements) ────────────────────────────────

const TEACHING_CATEGORIES: Record<string, string[]> = {
  'Lesson Plans & Notes': [
    'Lesson Plan', 'Daily Lesson Notes', 'Weekly Lesson Plan', 'Unit Plan',
    'Learning Activity', 'Study Guide / Learning Notes', 'Revision Pack',
  ],
  'Classroom Tasks & Exercises': [
    'Worksheet', 'Homework Task', 'Classroom Exercise', 'Group Activity',
    'Reading Comprehension', 'Writing Task', 'Research Task',
  ],
  'Assessments': [
    'Controlled Test', 'Examination', 'Formal Assessment Task (FAT)',
    'Investigation', 'Project Brief', 'Case Study', 'Oral/Speech Task',
    'Practical Task / Experiment', 'Portfolio Task', 'Diagnostic Assessment',
  ],
  'Memos & Rubrics': [
    'Marking Memo', 'Assessment Rubric', 'Analytical Rubric',
    'Holistic Rubric', 'Checklist / Self-Assessment',
  ],
};

const VISUAL_TYPES: Record<string, string[]> = {
  'Classroom Displays': [
    'Educational Poster', 'Word Wall', 'Vocabulary Display',
    'Alphabet Chart', 'Number Chart / Number Line', 'Times Tables Chart',
    'Classroom Rules Poster', 'Topic Anchor Chart',
  ],
  'Learning Cards': [
    'Flashcards (Term + Definition)', 'Vocabulary Cards', 'Formula Reference Cards',
    'Timeline Cards', 'Matching Cards', 'Cut-out Activity Cards',
  ],
  'Diagrams & Maps': [
    'Mind Map / Concept Map', 'Educational Diagram', 'Infographic',
    'Process Flow Diagram', 'Comparison Chart',
  ],
  'Labels & Organizers': [
    'Classroom Labels / Signs', 'Book Labels', 'Book Cover Design',
    'Certificate Template', 'Award / Sticker Template',
  ],
};

const ADMIN_TYPES: Record<string, string[]> = {
  'Parent Communication': [
    'Letter to Parents', 'General Notice to Parents', 'Permission Slip',
    'Meeting Invitation', 'Progress Update Letter', 'Report Comment Template',
  ],
  'School Administration': [
    'General School Notice', 'Timetable Template', 'Attendance Register',
    'Subject Improvement Plan', 'School Calendar Event Notice',
  ],
  'Learner-Facing': [
    'Disciplinary Notice', 'Classroom Rules', 'Homework Policy Letter',
    'Detention Notice', 'Achievement Certificate',
  ],
};

const LANGUAGES = ['English', 'Afrikaans', 'isiZulu', 'isiXhosa', 'Sesotho', 'Sepedi', 'Setswana'];
const DIFFICULTIES = ['Easy (Lower Order Thinking)', 'Medium (Mixed)', 'Challenging (Higher Order)', 'Mixed (Bloom\'s Progression)'];
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
const COLOR_SCHEMES = ['Bright Primary Colors', 'Pastel Soft', 'School Navy & Gold', 'Green & Nature', 'Monochrome Professional', 'Rainbow Fun'];
const VISUAL_STYLES = ['Modern & Clean', 'Playful Cartoon', 'Professional Academic', 'Bold & Graphic', 'Minimalist'];
const TONES = ['Formal & Professional', 'Warm & Friendly', 'Informative & Clear', 'Urgent & Important'];

// ─── Shared UI Components (Simulating Shadcn) ───────────────────────────────

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("text-xs font-semibold uppercase tracking-wider text-slate-400 block", className)}>
    {children}
  </label>
);

const Input = ({ className, ...props }: any) => (
  <input 
    className={cn("w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan transition-colors", className)} 
    {...props} 
  />
);

const Textarea = ({ className, ...props }: any) => (
  <textarea 
    className={cn("w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan transition-colors resize-none", className)} 
    {...props} 
  />
);

const Select = ({ value, onValueChange, children, placeholder, disabled }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between transition-all",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/20 active:scale-[0.99]",
          isOpen ? "border-brand-cyan shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]" : "text-white"
        )}
      >
        <span className={value ? "text-white" : "text-slate-500"}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 w-full mt-2 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[250px] overflow-y-auto scrollbar-hide py-2"
          >
            {children(setIsOpen)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SelectItem = ({ children, onClick, active }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between",
      active ? "bg-brand-cyan/20 text-brand-cyan" : "text-slate-300 hover:bg-white/5"
    )}
  >
    {children}
    {active && <Check size={14} />}
  </button>
);

const Switch = ({ checked, onCheckedChange, id }: any) => (
  <button 
    id={id}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "w-10 h-5 rounded-full transition-colors relative flex items-center px-1",
      checked ? "bg-brand-cyan" : "bg-slate-700"
    )}
  >
    <motion.div 
      animate={{ x: checked ? 18 : 0 }}
      className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"
    />
  </button>
);

// ─── Preview Component ────────────────────────────────────────────────────────

function ContentPreview({ html, label }: { html: string; label: string }) {
  if (!html) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        {label}
      </h3>
      <div className="bg-white rounded-[32px] overflow-hidden p-8 shadow-2xl relative">
        <div 
          className="prose prose-sm max-w-none text-slate-900"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="absolute top-4 right-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest pointer-events-none opacity-20">
          EduAI Companion Engine
        </div>
      </div>
    </div>
  );
}

// ─── Section Expander ─────────────────────────────────────────────────────────

function AdvancedSection({ children, label }: { children: React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-white/5 pt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <Settings2 size={14} />
          {label}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6">{children}</motion.div>}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ContentCreator({ isOpen, onClose, initialTab = 'teaching' }: { isOpen: boolean, onClose: () => void, initialTab?: string }) {
  const { provider } = useAi();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'content' | 'memo' | 'rubric' | 'assessment'>('content');

  // Results state
  const [teachingResult, setTeachingResult] = useState<any>(null);
  const [visualResult, setVisualResult] = useState<any>(null);
  const [adminResult, setAdminResult] = useState<any>(null);

  // ─── Teaching Tools State ─────────────────────────────────────────────────
  const [t_category, setT_Category] = useState('');
  const [t_type, setT_Type] = useState('');
  const [t_grade, setT_Grade] = useState('');
  const [t_subject, setT_Subject] = useState('');
  const [t_customSubject, setT_CustomSubject] = useState('');
  const [t_topic, setT_Topic] = useState('');
  const [t_customTopic, setT_CustomTopic] = useState('');
  const [t_term, setT_Term] = useState('');
  const [t_language, setT_Language] = useState('English');
  const [t_difficulty, setT_Difficulty] = useState('');
  const [t_duration, setT_Duration] = useState('');
  const [t_items, setT_Items] = useState('');
  const [t_objective, setT_Objective] = useState('');
  const [t_profile, setT_Profile] = useState('');
  const [t_differentiation, setT_Differentiation] = useState('');
  const [t_memo, setT_Memo] = useState(true);
  const [t_rubric, setT_Rubric] = useState(true);
  const [t_extraInstructions, setT_ExtraInstructions] = useState('');

  const t_subjects = useMemo(() => {
    if (!t_grade) return [];
    const gradeData = educationalData[t_grade];
    return gradeData ? Object.keys(gradeData) : [];
  }, [t_grade]);
  
  const t_topics = useMemo(() => {
    if (!t_grade || !t_subject) return [];
    const gradeData = educationalData[t_grade];
    return gradeData && gradeData[t_subject] ? gradeData[t_subject] : [];
  }, [t_grade, t_subject]);

  // ─── Visual Aids State ────────────────────────────────────────────────────
  const [v_category, setV_Category] = useState('');
  const [v_type, setV_Type] = useState('');
  const [v_grade, setV_Grade] = useState('');
  const [v_subject, setV_Subject] = useState('');
  const [v_customSubject, setV_CustomSubject] = useState('');
  const [v_topic, setV_Topic] = useState('');
  const [v_customTopic, setV_CustomTopic] = useState('');
  const [v_language, setV_Language] = useState('English');
  const [v_colorScheme, setV_ColorScheme] = useState('');
  const [v_style, setV_Style] = useState('');
  const [v_specificContent, setV_SpecificContent] = useState('');
  const [v_quantity, setV_Quantity] = useState('');
  const [v_generateImage, setV_GenerateImage] = useState(false);
  const [v_extraInstructions, setV_ExtraInstructions] = useState('');

  const v_subjects = useMemo(() => {
    if (!v_grade) return [];
    const gradeData = educationalData[v_grade];
    return gradeData ? Object.keys(gradeData) : [];
  }, [v_grade]);

  const v_topics = useMemo(() => {
    if (!v_grade || !v_subject) return [];
    const gradeData = educationalData[v_grade];
    return gradeData && gradeData[v_subject] ? gradeData[v_subject] : [];
  }, [v_grade, v_subject]);

  // ─── Admin Docs State ─────────────────────────────────────────────────────
  const [a_category, setA_Category] = useState('');
  const [a_type, setA_Type] = useState('');
  const [a_grade, setA_Grade] = useState('');
  const [a_subject, setA_Subject] = useState('');
  const [a_customSubject, setA_CustomSubject] = useState('');
  const [a_schoolName, setA_SchoolName] = useState('');
  const [a_teacherName, setA_TeacherName] = useState('');
  const [a_principalName, setA_PrincipalName] = useState('');
  const [a_date, setA_Date] = useState('');
  const [a_language, setA_Language] = useState('English');
  const [a_purpose, setA_Purpose] = useState('');
  const [a_keyPoints, setA_KeyPoints] = useState('');
  const [a_tone, setA_Tone] = useState('');
  const [a_replySlip, setA_ReplySlip] = useState(false);
  const [a_extraInstructions, setA_ExtraInstructions] = useState('');

  const a_subjects = useMemo(() => {
    if (!a_grade) return [];
    const gradeData = educationalData[a_grade];
    return gradeData ? Object.keys(gradeData) : [];
  }, [a_grade]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleGenerateTeaching = async () => {
    const finalSubject = t_subject === 'Other' ? t_customSubject : t_subject;
    const finalTopic = t_topic === 'Other' ? t_customTopic : t_topic;
    setIsLoading(true);
    setError(null);
    setTeachingResult(null);
    setActivePreviewTab('content');
    try {
      const result = await generateCAPSContent({
        category: t_category, contentType: t_type, grade: t_grade, subject: finalSubject,
        topic: finalTopic, term: t_term, language: t_language, objective: t_objective,
        learnerProfile: t_profile, additionalInstructions: t_extraInstructions
      }, provider);
      setTeachingResult(result);
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to fabricate teaching material.");
    } finally { setIsLoading(false); }
  };

  const handleGenerateVisual = async () => {
    const finalSubject = v_subject === 'Other' ? v_customSubject : v_subject;
    const finalTopic = v_topic === 'Other' ? v_customTopic : v_topic;
    setIsLoading(true);
    setError(null);
    setVisualResult(null);
    try {
      const result = await generateVisualAid({
        visualType: v_type, grade: v_grade, subject: finalSubject, topic: finalTopic,
        language: v_language, colorScheme: v_colorScheme, style: v_style,
        specificContent: v_specificContent, quantity: v_quantity,
        generateImage: v_generateImage, additionalInstructions: v_extraInstructions
      }, provider);
      setVisualResult(result);
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to design visual asset.");
    } finally { setIsLoading(false); }
  };

  const handleGenerateAdmin = async () => {
    const finalSubject = a_subject === 'Other' ? a_customSubject : a_subject;
    setIsLoading(true);
    setError(null);
    setAdminResult(null);
    try {
      const result = await generateAdminDoc({
        documentType: a_type, schoolName: a_schoolName, principalName: a_principalName,
        teacherName: a_teacherName, grade: a_grade, subject: finalSubject,
        date: a_date, language: a_language, purpose: a_purpose, keyPoints: a_keyPoints,
        tone: a_tone, includeReplySlip: a_replySlip, additionalInstructions: a_extraInstructions
      }, provider);
      setAdminResult(result);
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to draft official correspondence.");
    } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  const hasResult = (activeTab === 'teaching' && !!teachingResult) || (activeTab === 'visual' && !!visualResult) || (activeTab === 'admin' && !!adminResult);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-4 sm:inset-10 z-50 glass rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/5 px-10">
        <div className="flex items-center gap-4">
          <div className="bg-brand-cyan/20 p-2.5 rounded-2xl border border-brand-cyan/20 text-brand-cyan">
             <FlaskConical size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-hand text-white">Content Creator Studio</h2>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mt-1">CAPS Intelligence Matrix</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Labs Toggle */}
          <div className="bg-white/5 flex p-1.5 rounded-[24px] border border-white/5 gap-1 shadow-inner">
            {[
              { id: 'teaching', icon: FlaskConical, label: 'Content Studio' },
              { id: 'visual', icon: Palette, label: 'Visual Lab' },
              { id: 'admin', icon: FileText, label: 'Admin Lab' },
              { id: 'grade1', icon: Sparkles, label: 'Foundation' },
            ].map(lab => (
              <button 
                key={lab.id}
                onClick={() => setActiveTab(lab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === lab.id ? "bg-brand-cyan text-navy-dark shadow-xl" : "text-slate-400 hover:text-white"
                )}
              >
                <lab.icon size={16} />
                <span className="hidden md:inline">{lab.label}</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-all">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Form Panel */}
        <div className="w-full lg:w-[480px] bg-[#0B1122] border-r border-white/5 overflow-y-auto p-10 space-y-8 scrollbar-hide shrink-0">
          <AnimatePresence mode="wait">
            {activeTab === 'teaching' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <p className="text-[10px] text-brand-cyan font-black uppercase tracking-[0.2em] mb-2">🎓 Curriculum Architects</p>
                  <p className="text-sm text-slate-500 leading-relaxed">Lesson plans, worksheets, and rubrics — perfectly CAPS-aligned.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={t_category} onValueChange={setT_Category} placeholder="Pick Lab">
                      {(close: any) => Object.keys(TEACHING_CATEGORIES).map(cat => (
                        <SelectItem key={cat} onClick={() => { setT_Category(cat); setT_Type(''); close(); }} active={t_category === cat}>{cat}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={t_type} onValueChange={setT_Type} placeholder="Select Type" disabled={!t_category}>
                      {(close: any) => TEACHING_CATEGORIES[t_category]?.map(type => (
                        <SelectItem key={type} onClick={() => { setT_Type(type); close(); }} active={t_type === type}>{type}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select value={t_grade} onValueChange={setT_Grade} placeholder="Grade">
                      {(close: any) => Object.keys(educationalData).map(g => <SelectItem key={g} onClick={() => { setT_Grade(g); setT_Subject(''); setT_Topic(''); close(); }} active={t_grade === g}>Grade {g}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={t_term} onValueChange={setT_Term} placeholder="Select Term">
                      {(close: any) => TERMS.map(term => <SelectItem key={term} onClick={() => { setT_Term(term); close(); }} active={t_term === term}>{term}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={t_language} onValueChange={setT_Language} placeholder="Language">
                      {(close: any) => LANGUAGES.map(l => <SelectItem key={l} onClick={() => { setT_Language(l); close(); }} active={t_language === l}>{l}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={t_difficulty} onValueChange={setT_Difficulty} placeholder="Select Difficulty">
                      {(close: any) => DIFFICULTIES.map(diff => <SelectItem key={diff} onClick={() => { setT_Difficulty(diff); close(); }} active={t_difficulty === diff}>{diff}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={t_subject} onValueChange={setT_Subject} placeholder="Neural Topic" disabled={!t_grade}>
                    {(close: any) => t_subjects.map(s => <SelectItem key={s} onClick={() => { setT_Subject(s); setT_Topic(''); close(); }} active={t_subject === s}>{s}</SelectItem>)}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Topic / Strand</Label>
                  <Select value={t_topic} onValueChange={setT_Topic} placeholder="Specific Area" disabled={!t_subject}>
                    {(close: any) => t_topics.map(t => <SelectItem key={t} onClick={() => { setT_Topic(t); close(); }} active={t_topic === t}>{t}</SelectItem>)}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input placeholder="e.g. 45 min" value={t_duration} onChange={(e: any) => setT_Duration(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>No. of Questions</Label>
                     <Input placeholder="e.g. 15" value={t_items} onChange={(e: any) => setT_Items(e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-10 py-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={t_memo} onCheckedChange={setT_Memo} id="t-memo" />
                    <Label className="text-slate-200">Include Memo</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={t_rubric} onCheckedChange={setT_Rubric} id="t-rubric" />
                    <Label className="text-slate-200">Include Rubric</Label>
                  </div>
                </div>

                <AdvancedSection label="Advanced Neural Configuration">
                  <div className="space-y-4">
                    <Label>Learning Objective</Label>
                    <Textarea placeholder="What is the goal?" value={t_objective} onChange={(e: any) => setT_Objective(e.target.value)} />
                  </div>
                </AdvancedSection>

                <button 
                  onClick={handleGenerateTeaching}
                  disabled={isLoading}
                  className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                  {isLoading ? "Fabricating Material..." : `Generate ${t_type || "Content"}`}
                </button>
              </motion.div>
            )}

            {activeTab === 'visual' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em] mb-2">🎨 Visual Architects</p>
                  <p className="text-sm text-slate-500 leading-relaxed">Posters, diagrams, and cards for the modern classroom.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Visual Type</Label>
                    <Select value={v_type} onValueChange={setV_Type} placeholder="Select Type">
                      {(close: any) => Object.entries(VISUAL_TYPES).map(([cat, items]) => (
                        <div key={cat} className="space-y-1">
                          <p className="text-[8px] font-black text-slate-600 px-4 py-2 uppercase tracking-widest">{cat}</p>
                          {items.map(item => <SelectItem key={item} onClick={() => { setV_Type(item); close(); }} active={v_type === item}>{item}</SelectItem>)}
                        </div>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={v_language} onValueChange={setV_Language} placeholder="Language">
                      {(close: any) => LANGUAGES.map(l => <SelectItem key={l} onClick={() => { setV_Language(l); close(); }} active={v_language === l}>{l}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select value={v_grade} onValueChange={setV_Grade} placeholder="Grade">
                      {(close: any) => Object.keys(educationalData).map(g => <SelectItem key={g} onClick={() => { setV_Grade(g); setV_Subject(''); setV_Topic(''); close(); }} active={v_grade === g}>Grade {g}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={v_subject} onValueChange={setV_Subject} placeholder="Neural Topic" disabled={!v_grade}>
                      {(close: any) => v_subjects.map(s => <SelectItem key={s} onClick={() => { setV_Subject(s); setV_Topic(''); close(); }} active={v_subject === s}>{s}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Topic / Strand</Label>
                  <Select value={v_topic} onValueChange={setV_Topic} placeholder="Specific Area" disabled={!v_subject}>
                    {(close: any) => v_topics.map(t => <SelectItem key={t} onClick={() => { setV_Topic(t); close(); }} active={v_topic === t}>{t}</SelectItem>)}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <Select value={v_colorScheme} onValueChange={setV_ColorScheme} placeholder="Pick Colors">
                      {(close: any) => COLOR_SCHEMES.map(c => <SelectItem key={c} onClick={() => { setV_ColorScheme(c); close(); }} active={v_colorScheme === c}>{c}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visual Style</Label>
                    <Select value={v_style} onValueChange={setV_Style} placeholder="Select Style">
                      {(close: any) => VISUAL_STYLES.map(s => <SelectItem key={s} onClick={() => { setV_Style(s); close(); }} active={v_style === s}>{s}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Specific Content</Label>
                  <Textarea className="min-h-[80px]" placeholder="Specific words, concepts or numbers to include..." value={v_specificContent} onChange={(e: any) => setV_SpecificContent(e.target.value)} />
                </div>

                <button onClick={handleGenerateVisual} disabled={isLoading} className="w-full bg-purple-500 hover:bg-purple-600 text-white h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                  {isLoading ? <Loader2 className="animate-spin" /> : <ImageIcon size={18} />}
                  {isLoading ? "Designing..." : "Create Visual Aid"}
                </button>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">📋 Admin Architects</p>
                  <p className="text-sm text-slate-500 leading-relaxed">Professional school documentation made instant.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={a_type} onValueChange={setA_Type} placeholder="Select Doc">
                      {(close: any) => Object.entries(ADMIN_TYPES).map(([cat, items]) => (
                        <div key={cat} className="space-y-1">
                          <p className="text-[8px] font-black text-slate-600 px-4 py-2 uppercase tracking-widest">{cat}</p>
                          {items.map(item => <SelectItem key={item} onClick={() => { setA_Type(item); close(); }} active={a_type === item}>{item}</SelectItem>)}
                        </div>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={a_language} onValueChange={setA_Language} placeholder="Language">
                      {(close: any) => LANGUAGES.map(l => <SelectItem key={l} onClick={() => { setA_Language(l); close(); }} active={a_language === l}>{l}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select value={a_grade} onValueChange={setA_Grade} placeholder="Grade">
                      {(close: any) => Object.keys(educationalData).map(g => <SelectItem key={g} onClick={() => { setA_Grade(g); setA_Subject(''); close(); }} active={a_grade === g}>Grade {g}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={a_tone} onValueChange={setA_Tone} placeholder="Select Tone">
                      {(close: any) => TONES.map(t => <SelectItem key={t} onClick={() => { setA_Tone(t); close(); }} active={a_tone === t}>{t}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message Purpose</Label>
                  <Textarea className="min-h-[100px]" placeholder="What is the main goal of this correspondence?" value={a_purpose} onChange={(e: any) => setA_Purpose(e.target.value)} />
                </div>

                <button onClick={handleGenerateAdmin} disabled={isLoading} className="w-full bg-slate-700 hover:bg-slate-600 text-white h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                  {isLoading ? <Loader2 className="animate-spin" /> : <ClipboardList size={18} />}
                  {isLoading ? "Drafting..." : "Generate Admin Doc"}
                </button>
              </motion.div>
            )}

            {activeTab === 'grade1' && (
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                 <Grade1EnglishGenerator />
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Preview Panel */}
        <div className="flex-1 bg-navy-dark/40 overflow-y-auto p-12 scrollbar-hide relative">
           <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] flex items-center justify-between gap-4 text-red-400"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={24} className="shrink-0" />
                  <div>
                    <h4 className="font-hand text-xl text-white">Neural Interference</h4>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
                <button onClick={() => setError(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </motion.div>
            )}
           </AnimatePresence>

           {isLoading ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
               <div className="relative">
                 <div className="absolute inset-0 bg-brand-cyan/20 blur-[60px] animate-pulse"></div>
                 <FlaskConical size={80} className="text-brand-cyan animate-bounce" />
               </div>
               <div>
                 <h3 className="text-3xl text-white font-hand">Neural Fabrication Unit</h3>
                 <p className="text-slate-500 mt-2 font-medium">Calculating CAPS alignments and professional layout hooks...</p>
               </div>
             </div>
           ) : hasResult ? (
             <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-12">
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
                  <div className="flex gap-3">
                    {activeTab === 'teaching' && (
                      <>
                        <button onClick={() => setActivePreviewTab('content')} className={cn("px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest", activePreviewTab === 'content' ? "bg-brand-cyan text-navy-dark" : "text-slate-500 hover:text-white")}>Result</button>
                        {teachingResult.memo && <button onClick={() => setActivePreviewTab('memo')} className={cn("px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest", activePreviewTab === 'memo' ? "bg-brand-yellow text-navy-dark" : "text-slate-500 hover:text-white")}>Memo</button>}
                        {teachingResult.rubric && <button onClick={() => setActivePreviewTab('rubric')} className={cn("px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest", activePreviewTab === 'rubric' ? "bg-purple-500 text-white" : "text-slate-500 hover:text-white")}>Rubric</button>}
                      </>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white transition-all"><Printer size={18} /></button>
                    <button className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                       <Save size={16} /> Archive Stream
                    </button>
                  </div>
                </div>

                <div className="pb-20">
                  {activeTab === 'teaching' && (
                    <>
                      {activePreviewTab === 'content' && (
                        <div className="space-y-8">
                          <ContentPreview html={teachingResult.content} label="Integrated Material" />
                          {teachingResult.imagePrompt && (
                            <div className="glass p-8 rounded-[32px] border border-white/5 space-y-4">
                              <h3 className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em]">
                                Hero Illustration Blueprint
                              </h3>
                              <p className="text-xs text-slate-400 italic leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                                "{teachingResult.imagePrompt}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {activePreviewTab === 'memo' && <ContentPreview html={teachingResult.memo} label="Expert Answer Key" />}
                      {activePreviewTab === 'rubric' && <ContentPreview html={teachingResult.rubric} label="Marks Allocation Matrix" />}
                    </>
                  )}
                  {activeTab === 'visual' && (
                    <div className="space-y-8">
                      <ContentPreview html={visualResult.content} label="Digital Visual Asset" />
                      {visualResult.imagePrompt && (
                        <div className="glass p-8 rounded-[32px] border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em]">
                              Generated Visual Prompt
                            </h3>
                            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">
                              <RefreshCw size={12} />
                              Regenerate Asset
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 italic leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                            "{visualResult.imagePrompt}"
                          </p>
                          <div className="aspect-video bg-navy-deep rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center p-8 space-y-4 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-brand-cyan/10 opacity-50"></div>
                            <Sparkles size={40} className="text-brand-cyan animate-pulse relative z-10" />
                            <div className="relative z-10">
                              <p className="text-sm text-white font-bold mb-1">Visual Asset Blueprint Ready</p>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Connect to image fabrication engine to initialize</p>
                            </div>
                            <button className="relative z-10 mt-4 bg-brand-cyan text-navy-dark px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-cyan-500/20">
                              Generate Asset Now
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'admin' && <ContentPreview html={adminResult.content} label="Official Correspondence" />}
                </div>
             </motion.div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
               <div className="bg-white/5 p-10 rounded-[48px] border border-white/5">
                 <Eye size={100} className="text-slate-600" />
               </div>
               <div>
                  <h3 className="text-5xl font-hand text-slate-800">Neural Preview</h3>
                  <p className="text-slate-700 mt-4 max-w-sm mx-auto font-medium">Synchronize parameters on the left to initialize the preview stream.</p>
               </div>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
