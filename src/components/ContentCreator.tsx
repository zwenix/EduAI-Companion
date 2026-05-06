import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Loader2, Sparkles, Printer, Save, Trash2, Download, Send,
  FlaskConical, Palette, FileText, Eye, BookOpen, GraduationCap,
  ChevronDown, ChevronUp, Zap, ClipboardList, ImageIcon, Settings2, RefreshCw,
  Check, X, Plus, Users, Layout, Video, FileCode, HelpCircle, Archive, UserCircle, Image, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { educationalData } from '../lib/educational-data';
import { generateCAPSContent, generateVisualAid, generateAdminDoc } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';
import AiImage from './AiImage';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { printContent, downloadAsHTML } from '../lib/printUtils';

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
  'Certificates & Stationery': [
    'Academic Achievement Certificate', 'Participation Certificate',
    'Custom Seal / Emblem', 'Official School Letterhead',
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
  <label className={cn("text-xs font-semibold uppercase tracking-wider block", className)}>
    {children}
  </label>
);

const Input = ({ className, isDarkMode, ...props }: any) => (
  <input 
    className={cn(
      "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-cyan transition-colors",
      isDarkMode ? "bg-white/5 border-white/10 text-white focus:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-800",
      className
    )} 
    {...props} 
  />
);

const Textarea = ({ className, isDarkMode, ...props }: any) => (
  <textarea 
    className={cn(
      "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-cyan transition-colors resize-none",
      isDarkMode ? "bg-white/5 border-white/10 text-white focus:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-800",
      className
    )} 
    {...props} 
  />
);

const Select = ({ value, onValueChange, children, placeholder, disabled, isDarkMode }: any) => {
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
          "w-full border rounded-xl px-4 py-2.5 text-sm flex items-center justify-between transition-all",
          isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-200 text-slate-800",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-slate-300 active:scale-[0.99]",
          isOpen ? "border-brand-cyan shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]" : ""
        )}
      >
        <span className={value ? (isDarkMode ? "text-white" : "text-slate-800") : "text-slate-500"}>
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
            className={cn(
              "absolute top-full left-0 w-full mt-2 border rounded-xl shadow-2xl z-50 max-h-[250px] overflow-y-auto scrollbar-hide py-2",
              isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
            )}
          >
            {children(setIsOpen)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SelectItem = ({ children, onClick, active, isDarkMode }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between font-medium",
      active 
        ? (isDarkMode ? "bg-brand-cyan/20 text-brand-cyan" : "bg-brand-cyan/10 text-brand-cyan") 
        : (isDarkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50")
    )}
  >
    {children}
    {active && <Check size={14} />}
  </button>
);

const Switch = ({ checked, onCheckedChange, id, isDarkMode }: any) => (
  <button 
    id={id}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "w-10 h-5 rounded-full transition-colors relative flex items-center px-1",
      checked ? "bg-brand-cyan" : (isDarkMode ? "bg-slate-800" : "bg-slate-300")
    )}
  >
    <motion.div 
      animate={{ x: checked ? 18 : 0 }}
      className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"
    />
  </button>
);

// ─── Preview Component ────────────────────────────────────────────────────────

function ContentPreview({ html, label, isDarkMode }: { html: string | object; label: string, isDarkMode?: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!html) return null;
  
  let processedHtml = typeof html === 'object' ? '' : String(html);

  if (typeof html === 'object' && html !== null) {
    const formatObjectToHtml = (obj: any, depth = 1): string => {
      let result = '';
      const headingLevel = Math.min(depth + 1, 6);
      const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-800';
      const headingColor = isDarkMode ? 'text-white' : 'text-slate-900';
      const strongColor = isDarkMode ? 'text-brand-cyan' : 'text-slate-700';

      for (const [key, value] of Object.entries(obj)) {
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            result += `<h${headingLevel} class="font-bold mt-4 mb-2 ${headingColor}">${displayKey}</h${headingLevel}>`;
            result += `<ul class="list-disc pl-5 mb-4 ${textColor}">`;
            value.forEach((v: any) => {
              result += `<li class="mb-2">${typeof v === 'object' ? formatObjectToHtml(v, depth + 1) : v}</li>`;
            });
            result += `</ul>`;
          } else {
            result += `<h${headingLevel} class="font-bold mt-4 mb-2 ${headingColor}">${displayKey}</h${headingLevel}>`;
            result += `<div class="pl-4 border-l-2 ${isDarkMode ? 'border-white/10' : 'border-slate-200'} ${textColor}">${formatObjectToHtml(value, depth + 1)}</div>`;
          }
        } else {
          if (key.toLowerCase() === 'title' || key.toLowerCase() === 'heading') {
             result += `<h${Math.max(1, headingLevel - 1)} class="font-black text-2xl mb-4 ${headingColor}">${value}</h${Math.max(1, headingLevel - 1)}>`;
          } else {
             result += `<p class="mb-2 ${textColor}"><strong class="${strongColor}">${displayKey}:</strong> ${value}</p>`;
          }
        }
      }
      return result;
    };
    processedHtml = formatObjectToHtml(html);
  }
  
  if (typeof html === 'string' && processedHtml.trim().startsWith('div ')) {
    processedHtml = '<' + processedHtml;
  }

  const isHtmlDoc = processedHtml.trim().toLowerCase().startsWith('<!doctype') || processedHtml.trim().toLowerCase().startsWith('<html');
  const rawMarkup = isHtmlDoc ? processedHtml : marked.parse(processedHtml) as string;

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        if (isHtmlDoc) {
          printWindow.document.write(rawMarkup);
        } else {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${label}</title>
                <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
                <style>
                    @media print {
                        @page { margin: 15mm; }
                        body { -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body class="p-8 prose max-w-none text-slate-800 bg-white">
                ${rawMarkup}
            </body>
            </html>
          `);
        }
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      } else {
        alert("Print popup blocked by browser. Please allow popups for this site, or open the app in a new window/tab.");
      }
    } catch (e) {
      console.error("Print failed", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </h3>
        <button
          onClick={handlePrint}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${
            isDarkMode ? 'bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/30' : 'bg-brand-cyan hover:bg-brand-cyan/90 text-white shadow-brand-cyan/20'
          }`}
        >
          <Printer size={14} />
          Print / Save PDF
        </button>
      </div>
      <div className={`${isDarkMode ? 'bg-slate-800 text-slate-200 border-white/10' : 'bg-white text-slate-900 border-slate-200'} border rounded-[32px] overflow-hidden p-4 lg:p-8 shadow-2xl relative`}>
        <div 
          ref={contentRef}
          className={cn(isHtmlDoc ? "" : "prose prose-sm max-w-none markdown-body", isDarkMode ? "prose-invert" : "")}
          dangerouslySetInnerHTML={{ __html: rawMarkup }} 
        />
        <div className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-20 ${isDarkMode ? 'text-slate-400' : 'text-slate-300'}`}>
          EduAI Companion Engine
        </div>
      </div>
    </div>
  );
}

// ─── Section Expander ─────────────────────────────────────────────────────────

function AdvancedSection({ children, label, isDarkMode }: { children: React.ReactNode; label: string; isDarkMode?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border-t pt-4", isDarkMode ? "border-white/5" : "border-slate-100")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between text-xs font-black uppercase tracking-widest transition-colors",
          isDarkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"
        )}
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

export default function ContentCreator({ isOpen, onClose, initialTab = 'teaching', isDarkMode = true }: { isOpen: boolean, onClose: () => void, initialTab?: string, isDarkMode?: boolean }) {
  const { provider } = useAi();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'content' | 'memo' | 'rubric' | 'assessment'>('content');
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Results state
  const [teachingResult, setTeachingResult] = useState<any>(null);
  const [visualResult, setVisualResult] = useState<any>(null);
  const [adminResult, setAdminResult] = useState<any>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isLoading || teachingResult || visualResult || adminResult) && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('preview-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isLoading, teachingResult, visualResult, adminResult]);

  const handlePrint = () => {
    printContent(contentRef, "EduAI-Output");
  };

  const handleArchive = () => {
    const result = activeTab === 'teaching' ? teachingResult : activeTab === 'visual' ? visualResult : adminResult;
    if (!result) return;
    
    const newItem = {
      id: Date.now().toString(),
      title: (activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative Doc') || 'Untitled Generation',
      subject: (activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : 'Administration') || 'General',
      grade: (activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : 'All') || 'N/A',
      contentType: (activeTab === 'teaching' ? t_type : activeTab === 'visual' ? v_type : 'Notice') || 'Document',
      isSystem: false,
      createdAt: new Date().toISOString(),
      content: result.content,
      memo: result.memo,
      rubric: result.rubric,
      imagePrompt: result.imagePrompt
    };

    try {
      const existing = JSON.parse(localStorage.getItem('eduai_archive') || '[]');
      localStorage.setItem('eduai_archive', JSON.stringify([newItem, ...existing]));
      setArchiveSuccess(true);
      setTimeout(() => setArchiveSuccess(false), 2000);
    } catch (e) {
      console.error('Failed to archive', e);
      alert('Archive failed: storage might be full.');
    }
  };

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<'class' | 'group'>('class');
  const [assignTargetName, setAssignTargetName] = useState('');

  const handleAssign = () => {
    setShowAssignModal(true);
  };

  const confirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetName) return;

    try {
      const { auth, db } = await import('../lib/firebase');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'notifications', Date.now().toString()), {
          title: 'Content Assigned',
          message: `You assigned new content to ${assignTargetType === 'class' ? 'Class' : 'Study Group'}: ${assignTargetName}.`,
          read: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e: any) {
      console.warn("Failed to notify", e);
    }
    setShowAssignModal(false);
    setAssignSuccess(true);
    setTimeout(() => setAssignSuccess(false), 2000);
  };

  const handleDownloadPDF = () => {
    downloadAsHTML(contentRef, "EduAI-Generated-Content.html");
  };

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
  const [a_generateImage, setA_GenerateImage] = useState(false);

  // ─── Foundation State ─────────────────────────────────────────────────
  const [f_grade, setF_Grade] = useState('1');
  const [f_topic, setF_Topic] = useState('Phonics');
  const [f_specific, setF_Specific] = useState('');
  const [f_theme, setF_Theme] = useState('Animals');
  const [f_language, setF_Language] = useState('English HL');

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
      setVisualResult({
         ...result,
         shouldGenerateImage: v_generateImage,
         userImagePrompt: v_extraInstructions
      });
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to design visual asset.");
    } finally { setIsLoading(false); }
  };

  const handleGenerateFoundation = async () => {
    setIsLoading(true);
    setError(null);
    setTeachingResult(null); // Reusing teaching result panel
    setActivePreviewTab('content');
    try {
      const result = await generateCAPSContent({
        category: 'Foundation Phase Pack', contentType: `${f_topic} Pack`, grade: f_grade, subject: f_language,
        topic: f_topic, term: 'Any', language: f_language, objective: `Focus on ${f_specific} with a ${f_theme} theme.`,
        learnerProfile: 'Foundation Phase Learners (Grade 1-3)', additionalInstructions: ''
      }, provider);
      setTeachingResult(result);
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to generate Foundation Phase reading pack.");
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
      setAdminResult({ ...result, shouldGenerateImage: a_generateImage, userImagePrompt: a_extraInstructions });
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to draft official correspondence.");
    } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  const hasResult = ((activeTab === 'teaching' || activeTab === 'grade1') && !!teachingResult) || (activeTab === 'visual' && !!visualResult) || (activeTab === 'admin' && !!adminResult);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 sm:inset-4 lg:inset-10 z-[70] backdrop-blur-3xl bg-[#0B1122]/95 sm:glass sm:bg-transparent rounded-none sm:rounded-[32px] lg:rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden border-0 sm:border border-white/10"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-4 lg:p-8 border-b border-white/5 bg-white/5 px-4 lg:px-10 gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="bg-brand-cyan/20 p-2 lg:p-2.5 rounded-xl lg:rounded-2xl border border-brand-cyan/20 text-brand-cyan">
               <FlaskConical size={20} className="lg:w-6 lg:h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-hand text-white">Content Creator Studio</h2>
              <p className="hidden lg:block text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mt-1">CAPS Intelligence Matrix</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl border border-white/10 lg:border-transparent text-slate-400 hover:text-white transition-all lg:hidden flex items-center justify-center shrink-0 min-w-[40px] min-h-[40px]">
             <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
          {/* Labs Toggle */}
          <div className="bg-white/5 flex p-1.5 rounded-[24px] border border-white/5 gap-1 shadow-inner shrink-0">
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
                  "flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-[18px] text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === lab.id ? "bg-brand-cyan text-navy-dark shadow-xl" : "text-slate-400 hover:text-white"
                )}
              >
                <lab.icon size={14} className="lg:w-4 lg:h-4" />
                <span className="whitespace-nowrap hidden sm:inline">{lab.label}</span>
                <span className="whitespace-nowrap sm:hidden">{lab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="hidden lg:flex p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-all shrink-0">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        {/* Left Form Panel */}
        <div className="w-full lg:w-[480px] bg-[#0B1122] lg:border-r border-white/5 lg:overflow-y-auto p-4 lg:p-10 space-y-6 lg:space-y-8 scrollbar-hide shrink-0 h-max lg:h-full">
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
                    <Select value={t_category} onValueChange={setT_Category} placeholder="Pick Lab" isDarkMode={isDarkMode}>
                      {(close: any) => Object.keys(TEACHING_CATEGORIES).map(cat => (
                        <SelectItem key={cat} onClick={() => { setT_Category(cat); setT_Type(''); close(); }} active={t_category === cat} isDarkMode={isDarkMode}>{cat}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={t_type} onValueChange={setT_Type} placeholder="Select Type" disabled={!t_category} isDarkMode={isDarkMode}>
                      {(close: any) => TEACHING_CATEGORIES[t_category]?.map(type => (
                        <SelectItem key={type} onClick={() => { setT_Type(type); close(); }} active={t_type === type} isDarkMode={isDarkMode}>{type}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Grade</Label>
                    <Select value={t_grade} onValueChange={setT_Grade} placeholder="Grade" isDarkMode={isDarkMode}>
                      {(close: any) => Object.keys(educationalData).map(g => <SelectItem key={g} onClick={() => { setT_Grade(g); setT_Subject(''); setT_Topic(''); close(); }} active={t_grade === g} isDarkMode={isDarkMode}>Grade {g}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Term</Label>
                    <Select value={t_term} onValueChange={setT_Term} placeholder="Select Term" isDarkMode={isDarkMode}>
                      {(close: any) => TERMS.map(term => <SelectItem key={term} onClick={() => { setT_Term(term); close(); }} active={t_term === term} isDarkMode={isDarkMode}>{term}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Language</Label>
                    <Select value={t_language} onValueChange={setT_Language} placeholder="Language" isDarkMode={isDarkMode}>
                      {(close: any) => LANGUAGES.map(l => <SelectItem key={l} onClick={() => { setT_Language(l); close(); }} active={t_language === l} isDarkMode={isDarkMode}>{l}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Difficulty</Label>
                    <Select value={t_difficulty} onValueChange={setT_Difficulty} placeholder="Select Difficulty" isDarkMode={isDarkMode}>
                      {(close: any) => DIFFICULTIES.map(diff => <SelectItem key={diff} onClick={() => { setT_Difficulty(diff); close(); }} active={t_difficulty === diff} isDarkMode={isDarkMode}>{diff}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Subject</Label>
                  <Select value={t_subject} onValueChange={setT_Subject} placeholder="Neural Topic" disabled={!t_grade} isDarkMode={isDarkMode}>
                    {(close: any) => (
                      <>
                        {t_subjects.map(s => <SelectItem key={s} onClick={() => { setT_Subject(s); setT_Topic(''); close(); }} active={t_subject === s} isDarkMode={isDarkMode}>{s}</SelectItem>)}
                        <SelectItem key="Other" onClick={() => { setT_Subject('Other'); setT_Topic(''); close(); }} active={t_subject === 'Other'} isDarkMode={isDarkMode}>Other...</SelectItem>
                      </>
                    )}
                  </Select>
                  {t_subject === 'Other' && <Input placeholder="Type custom subject" value={t_customSubject} onChange={(e: any) => setT_CustomSubject(e.target.value)} isDarkMode={isDarkMode} />}
                </div>

                <div className="space-y-2">
                  <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Topic / Strand</Label>
                  <Select value={t_topic} onValueChange={setT_Topic} placeholder="Specific Area" disabled={!t_subject} isDarkMode={isDarkMode}>
                    {(close: any) => (
                      <>
                        {t_topics.map(t => <SelectItem key={t} onClick={() => { setT_Topic(t); close(); }} active={t_topic === t} isDarkMode={isDarkMode}>{t}</SelectItem>)}
                        <SelectItem key="Other" onClick={() => { setT_Topic('Other'); close(); }} active={t_topic === 'Other'} isDarkMode={isDarkMode}>Other...</SelectItem>
                      </>
                    )}
                  </Select>
                  {t_topic === 'Other' && <Input placeholder="Type custom topic" value={t_customTopic} onChange={(e: any) => setT_CustomTopic(e.target.value)} isDarkMode={isDarkMode} />}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Duration</Label>
                    <Input placeholder="e.g. 45 min" value={t_duration} onChange={(e: any) => setT_Duration(e.target.value)} isDarkMode={isDarkMode} />
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>No. of Questions</Label>
                     <Input placeholder="e.g. 15" value={t_items} onChange={(e: any) => setT_Items(e.target.value)} isDarkMode={isDarkMode} />
                  </div>
                </div>

                <div className="flex gap-10 py-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={t_memo} onCheckedChange={setT_Memo} id="t-memo" isDarkMode={isDarkMode} />
                    <Label className={isDarkMode ? "text-slate-300" : "text-slate-600"}>Include Memo</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={t_rubric} onCheckedChange={setT_Rubric} id="t-rubric" isDarkMode={isDarkMode} />
                    <Label className={isDarkMode ? "text-slate-300" : "text-slate-600"}>Include Rubric</Label>
                  </div>
                </div>

                <AdvancedSection label="Advanced Neural Configuration">
                  <div className="space-y-4">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Learning Objective</Label>
                    <Textarea placeholder="What is the goal?" value={t_objective} onChange={(e: any) => setT_Objective(e.target.value)} isDarkMode={isDarkMode} />
                  </div>
                </AdvancedSection>

                <button 
                  type="button"
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
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Visual Type</Label>
                    <Select value={v_type} onValueChange={setV_Type} placeholder="Select Type" isDarkMode={isDarkMode}>
                      {(close: any) => Object.entries(VISUAL_TYPES).map(([cat, items]) => (
                        <div key={cat} className="space-y-1">
                          <p className={`text-[8px] font-black px-4 py-2 uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{cat}</p>
                          {items.map(item => <SelectItem key={item} onClick={() => { setV_Type(item); close(); }} active={v_type === item} isDarkMode={isDarkMode}>{item}</SelectItem>)}
                        </div>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Language</Label>
                    <Select value={v_language} onValueChange={setV_Language} placeholder="Language" isDarkMode={isDarkMode}>
                      {(close: any) => LANGUAGES.map(l => <SelectItem key={l} onClick={() => { setV_Language(l); close(); }} active={v_language === l} isDarkMode={isDarkMode}>{l}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Grade</Label>
                    <Select value={v_grade} onValueChange={setV_Grade} placeholder="Grade" isDarkMode={isDarkMode}>
                      {(close: any) => Object.keys(educationalData).map(g => <SelectItem key={g} onClick={() => { setV_Grade(g); setV_Subject(''); setV_Topic(''); close(); }} active={v_grade === g} isDarkMode={isDarkMode}>Grade {g}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Subject</Label>
                    <Select value={v_subject} onValueChange={setV_Subject} placeholder="Neural Topic" disabled={!v_grade} isDarkMode={isDarkMode}>
                      {(close: any) => (
                        <>
                          {v_subjects.map(s => <SelectItem key={s} onClick={() => { setV_Subject(s); setV_Topic(''); close(); }} active={v_subject === s} isDarkMode={isDarkMode}>{s}</SelectItem>)}
                          <SelectItem key="Other" onClick={() => { setV_Subject('Other'); setV_Topic(''); close(); }} active={v_subject === 'Other'} isDarkMode={isDarkMode}>Other...</SelectItem>
                        </>
                      )}
                    </Select>
                    {v_subject === 'Other' && <Input placeholder="Type custom subject" value={v_customSubject} onChange={(e: any) => setV_CustomSubject(e.target.value)} isDarkMode={isDarkMode} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Topic / Strand</Label>
                  <Select value={v_topic} onValueChange={setV_Topic} placeholder="Specific Area" disabled={!v_subject}>
                    {(close: any) => (
                      <>
                        {v_topics.map(t => <SelectItem key={t} onClick={() => { setV_Topic(t); close(); }} active={v_topic === t}>{t}</SelectItem>)}
                        <SelectItem key="Other" onClick={() => { setV_Topic('Other'); close(); }} active={v_topic === 'Other'}>Other...</SelectItem>
                      </>
                    )}
                  </Select>
                  {v_topic === 'Other' && <Input placeholder="Type custom topic" value={v_customTopic} onChange={(e: any) => setV_CustomTopic(e.target.value)} />}
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

                <div className={cn("space-y-4 p-4 rounded-xl border transition-colors", isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Generate Hero Image</Label>
                      <p className={cn("text-[10px] mt-1", isDarkMode ? "text-slate-500" : "text-slate-500")}>Use AI to generate an illustration for this visual aid</p>
                    </div>
                    <Switch checked={v_generateImage} onCheckedChange={setV_GenerateImage} isDarkMode={isDarkMode} />
                  </div>
                  {v_generateImage && (
                    <div className="space-y-2 pt-2">
                       <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Image Prompt Override <span className="opacity-50">(Optional)</span></Label>
                       <Textarea className="min-h-[80px]" placeholder="Specific instructions for the AI image generator..." value={v_extraInstructions} onChange={(e: any) => setV_ExtraInstructions(e.target.value)} isDarkMode={isDarkMode} />
                    </div>
                  )}
                </div>

                <button type="button" onClick={handleGenerateVisual} disabled={isLoading} className="w-full bg-purple-500 hover:bg-purple-600 text-white h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
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
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Document Type</Label>
                    <Select value={a_type} onValueChange={setA_Type} placeholder="Select Doc" isDarkMode={isDarkMode}>
                      {(close: any) => Object.entries(ADMIN_TYPES).map(([cat, items]) => (
                        <div key={cat} className="space-y-1">
                          <p className={`text-[8px] font-black px-4 py-2 uppercase tracking-widest ${isDarkMode ? "text-brand-cyan/50" : "text-slate-600"}`}>{cat}</p>
                          {items.map(item => <SelectItem key={item} onClick={() => { setA_Type(item); close(); }} active={a_type === item} isDarkMode={isDarkMode}>{item}</SelectItem>)}
                        </div>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Language</Label>
                    <Select value={a_language} onValueChange={setA_Language} placeholder="Language" isDarkMode={isDarkMode}>
                      {(close: any) => LANGUAGES.map(l => <SelectItem key={l} onClick={() => { setA_Language(l); close(); }} active={a_language === l} isDarkMode={isDarkMode}>{l}</SelectItem>)}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Grade</Label>
                    <Select value={a_grade} onValueChange={setA_Grade} placeholder="Grade" isDarkMode={isDarkMode}>
                      {(close: any) => Object.keys(educationalData).map(g => <SelectItem key={g} onClick={() => { setA_Grade(g); setA_Subject(''); close(); }} active={a_grade === g} isDarkMode={isDarkMode}>Grade {g}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Subject <span className="opacity-50">(Optional)</span></Label>
                    <Select value={a_subject} onValueChange={setA_Subject} placeholder="Neural Topic" disabled={!a_grade} isDarkMode={isDarkMode}>
                      {(close: any) => (
                        <>
                          {a_subjects.map(s => <SelectItem key={s} onClick={() => { setA_Subject(s); close(); }} active={a_subject === s} isDarkMode={isDarkMode}>{s}</SelectItem>)}
                          <SelectItem key="Other" onClick={() => { setA_Subject('Other'); close(); }} active={a_subject === 'Other'} isDarkMode={isDarkMode}>Other...</SelectItem>
                        </>
                      )}
                    </Select>
                    {a_subject === 'Other' && <Input placeholder="Type custom subject" value={a_customSubject} onChange={(e: any) => setA_CustomSubject(e.target.value)} isDarkMode={isDarkMode} />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Tone</Label>
                    <Select value={a_tone} onValueChange={setA_Tone} placeholder="Select Tone" isDarkMode={isDarkMode}>
                      {(close: any) => TONES.map(t => <SelectItem key={t} onClick={() => { setA_Tone(t); close(); }} active={a_tone === t} isDarkMode={isDarkMode}>{t}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Date <span className="opacity-50">(Optional)</span></Label>
                    <Input placeholder="e.g. 15 October 2024" value={a_date} onChange={(e: any) => setA_Date(e.target.value)} isDarkMode={isDarkMode} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Message Purpose</Label>
                  <Textarea className="min-h-[100px]" placeholder="What is the main goal of this correspondence?" value={a_purpose} onChange={(e: any) => setA_Purpose(e.target.value)} isDarkMode={isDarkMode} />
                </div>

                <div className={cn("space-y-4 p-4 rounded-xl border transition-colors", isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Generate Seal / Illustration</Label>
                      <p className={cn("text-[10px] mt-1", isDarkMode ? "text-slate-500" : "text-slate-500")}>Use AI to generate a custom emblem or visual for this</p>
                    </div>
                    <Switch checked={a_generateImage} onCheckedChange={setA_GenerateImage} isDarkMode={isDarkMode} />
                  </div>
                  {a_generateImage && (
                    <div className="space-y-2 pt-2">
                       <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Image Prompt Override <span className="opacity-50">(Optional)</span></Label>
                       <Textarea className="min-h-[80px]" placeholder="Specific instructions for the AI image generator..." value={a_extraInstructions} onChange={(e: any) => setA_ExtraInstructions(e.target.value)} isDarkMode={isDarkMode} />
                    </div>
                  )}
                </div>

                <button type="button" onClick={handleGenerateAdmin} disabled={isLoading} className="w-full bg-slate-700 hover:bg-slate-600 text-white h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                  {isLoading ? <Loader2 className="animate-spin" /> : <ClipboardList size={18} />}
                  {isLoading ? "Drafting..." : "Generate Admin Doc"}
                </button>
              </motion.div>
            )}

            {activeTab === 'grade1' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.2em] mb-2">🎈 Early Learners</p>
                  <p className="text-sm text-slate-500 leading-relaxed">Phonics, sight words, and reading comprehension specifically mapped for Grades 1 - 3.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Grade Level</Label>
                    <Select value={f_grade} onValueChange={setF_Grade} placeholder="Grade" isDarkMode={isDarkMode}>
                      {(close: any) => (
                        <>
                          <SelectItem onClick={() => { setF_Grade('1'); close(); }} active={f_grade === '1'} isDarkMode={isDarkMode}>Grade 1</SelectItem>
                          <SelectItem onClick={() => { setF_Grade('2'); close(); }} active={f_grade === '2'} isDarkMode={isDarkMode}>Grade 2</SelectItem>
                          <SelectItem onClick={() => { setF_Grade('3'); close(); }} active={f_grade === '3'} isDarkMode={isDarkMode}>Grade 3</SelectItem>
                        </>
                      )}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Focus Area</Label>
                    <Select value={f_topic} onValueChange={setF_Topic} placeholder="Select Focus" isDarkMode={isDarkMode}>
                      {(close: any) => (
                        <>
                          <SelectItem onClick={() => { setF_Topic('Phonics'); close(); }} active={f_topic === 'Phonics'} isDarkMode={isDarkMode}>Phonics</SelectItem>
                          <SelectItem onClick={() => { setF_Topic('Sight Words'); close(); }} active={f_topic === 'Sight Words'} isDarkMode={isDarkMode}>Sight Words</SelectItem>
                          <SelectItem onClick={() => { setF_Topic('Reading Comprehension'); close(); }} active={f_topic === 'Reading Comprehension'} isDarkMode={isDarkMode}>Reading Comp</SelectItem>
                          <SelectItem onClick={() => { setF_Topic('Handwriting Practice'); close(); }} active={f_topic === 'Handwriting Practice'} isDarkMode={isDarkMode}>Handwriting</SelectItem>
                        </>
                      )}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Specific Target</Label>
                  <Input placeholder="e.g. 'sh' and 'ch' sounds, or specific sight words..." value={f_specific} onChange={(e: any) => setF_Specific(e.target.value)} isDarkMode={isDarkMode} />
                  <p className="text-[10px] text-slate-500">Optional: specify exactly what to focus on.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Theme / Context</Label>
                    <Input placeholder="e.g. Space, Animals..." value={f_theme} onChange={(e: any) => setF_Theme(e.target.value)} isDarkMode={isDarkMode} />
                  </div>
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Language</Label>
                    <Select value={f_language} onValueChange={setF_Language} placeholder="Language" isDarkMode={isDarkMode}>
                      {(close: any) => (
                        <>
                          <SelectItem onClick={() => { setF_Language('English HL'); close(); }} active={f_language === 'English HL'} isDarkMode={isDarkMode}>English HL</SelectItem>
                          <SelectItem onClick={() => { setF_Language('English FAL'); close(); }} active={f_language === 'English FAL'} isDarkMode={isDarkMode}>English FAL</SelectItem>
                          <SelectItem onClick={() => { setF_Language('Afrikaans HT'); close(); }} active={f_language === 'Afrikaans HT'} isDarkMode={isDarkMode}>Afrikaans HT</SelectItem>
                        </>
                      )}
                    </Select>
                  </div>
                </div>

                <button type="button" onClick={handleGenerateFoundation} disabled={isLoading} className="w-full bg-pink-500 hover:bg-pink-600 text-white h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                  {isLoading ? <Loader2 className="animate-spin" /> : <BookOpen size={18} />}
                  {isLoading ? "Designing..." : "Create Reading Pack"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Preview Panel */}
        <div id="preview-panel" className="w-full lg:flex-1 bg-navy-dark/40 lg:overflow-y-auto p-4 sm:p-8 lg:p-12 scrollbar-hide relative lg:h-full">
           <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-4 lg:p-6 bg-red-500/10 border border-red-500/20 rounded-2xl lg:rounded-[32px] flex items-center justify-between gap-4 text-red-400"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={24} className="shrink-0" />
                  <div>
                    <h4 className="font-hand text-lg lg:text-xl text-white">Neural Interference</h4>
                    <p className="text-xs lg:text-sm font-medium">{error}</p>
                  </div>
                </div>
                <button onClick={() => setError(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </motion.div>
            )}
           </AnimatePresence>

           {isLoading ? (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-8">
               <div className="relative">
                 <div className="absolute inset-0 bg-brand-cyan/20 blur-[60px] animate-pulse"></div>
                 <FlaskConical size={60} className="text-brand-cyan animate-bounce lg:w-[80px] lg:h-[80px]" />
               </div>
               <div>
                 <h3 className="text-2xl lg:text-3xl text-white font-hand">Neural Fabrication Unit</h3>
                 <p className="text-slate-500 mt-2 font-medium text-sm lg:text-base">Calculating CAPS alignments and professional layout hooks...</p>
               </div>
             </div>
           ) : hasResult ? (
             <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8 lg:space-y-12 pb-12">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/5 p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border border-white/5 gap-4">
                  <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    {(activeTab === 'teaching' || activeTab === 'grade1') && (
                      <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide text-[10px] font-black uppercase text-brand-cyan tracking-widest px-4 py-2 bg-white/5 rounded-xl border border-white/10 items-center justify-center">
                        All Inclusive Package Generated
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl text-white transition-all tooltip shrink-0" title="Print Content">
                      <Printer size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                    <button onClick={handleDownloadPDF} className="bg-white/10 hover:bg-white/20 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl text-white transition-all tooltip shrink-0" title="Download as PDF">
                      <Download size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                    <button 
                      onClick={handleAssign}
                      className={cn(
                        "transition-all border px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[9px] lg:text-[10px] flex items-center gap-2 shrink-0",
                        assignSuccess ? "bg-emerald-500 border-emerald-500 text-white" : "bg-transparent hover:bg-white/10 border-white/20 text-white"
                      )} 
                      title="Assign to learners"
                    >
                       {assignSuccess ? <Check size={14} className="lg:w-4 lg:h-4" /> : <Users size={14} className="lg:w-4 lg:h-4" />}
                       {assignSuccess ? 'Assigned' : 'Assign'}
                    </button>
                    <button 
                      onClick={handleArchive}
                      className={cn(
                        "transition-all px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[9px] lg:text-[10px] flex items-center gap-2 shrink-0",
                        archiveSuccess ? "bg-emerald-500 text-white" : "bg-brand-cyan hover:bg-cyan-500 text-navy-dark"
                      )}
                    >
                       {archiveSuccess ? <Check size={14} className="lg:w-4 lg:h-4" /> : <Save size={14} className="lg:w-4 lg:h-4" />}
                       {archiveSuccess ? 'Archived' : 'Archive'}
                    </button>
                  </div>
                </div>

                <div className={cn(
                  "pb-20 rounded-[32px] p-4 lg:p-6 printable-doc transition-colors",
                  isDarkMode ? "bg-navy-dark text-white" : "bg-white text-slate-900"
                )} ref={contentRef}>
                  {(activeTab === 'teaching' || activeTab === 'grade1') && (
                    <div className="space-y-12">
                      <div className="space-y-8" id="result-section">
                        {teachingResult.imagePrompt && (
                          <AiImage 
                            prompt={teachingResult.imagePrompt} 
                            aspectRatio="video"
                            className="w-full mb-8"
                          />
                        )}
                        <ContentPreview html={teachingResult.content} label="Integrated Material" isDarkMode={isDarkMode} />
                      </div>
                      
                      {teachingResult.memo && (
                        <div id="memo-section">
                           <hr className="my-10 border-slate-200 dark:border-white/10" />
                           <ContentPreview html={teachingResult.memo} label="Expert Answer Key" isDarkMode={isDarkMode} />
                        </div>
                      )}
                      
                      {teachingResult.rubric && (
                        <div id="rubric-section">
                           <hr className="my-10 border-slate-200 dark:border-white/10" />
                           <ContentPreview html={teachingResult.rubric} label="Marks Allocation Matrix" isDarkMode={isDarkMode} />
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'visual' && (
                    <div className="space-y-8">
                      {visualResult.shouldGenerateImage && (visualResult.userImagePrompt || visualResult.imagePrompt) && (
                        <AiImage 
                          prompt={visualResult.userImagePrompt || visualResult.imagePrompt} 
                          aspectRatio="portrait"
                          className="w-full max-w-2xl mx-auto mb-8"
                        />
                      )}
                      <ContentPreview html={visualResult.content} label="Digital Visual Asset" isDarkMode={isDarkMode} />
                    </div>
                  )}
                  {activeTab === 'admin' && (
                    <div className="space-y-8">
                      {adminResult.shouldGenerateImage && (adminResult.userImagePrompt || adminResult.imagePrompt) && (
                        <AiImage 
                          prompt={adminResult.userImagePrompt || adminResult.imagePrompt} 
                          aspectRatio="square"
                          className="w-1/2 max-w-sm mx-auto mb-8"
                        />
                      )}
                      <ContentPreview html={adminResult.content} label="Official Correspondence" isDarkMode={isDarkMode} />
                    </div>
                  )}
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

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Users className="text-brand-cyan" />
              Assign Content
            </h3>
            <form onSubmit={confirmAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Assign To</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input type="radio" value="class" checked={assignTargetType === 'class'} onChange={() => setAssignTargetType('class')} className="text-brand-cyan focus:ring-brand-cyan" />
                    Class
                  </label>
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input type="radio" value="group" checked={assignTargetType === 'group'} onChange={() => setAssignTargetType('group')} className="text-brand-cyan focus:ring-brand-cyan" />
                    Study Group
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Name</label>
                <input 
                  type="text" 
                  value={assignTargetName} 
                  onChange={e => setAssignTargetName(e.target.value)} 
                  placeholder={assignTargetType === 'class' ? "e.g. Grade 10A" : "e.g. Math Olympiad Prep"}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-black uppercase tracking-widest text-xs py-4 rounded-xl mt-4 transition-all">
                Create Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
