import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Loader2, Sparkles, Printer, Save, Trash2, Download, Send,
  FlaskConical, Palette, FileText, Eye, BookOpen, GraduationCap,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Zap, ClipboardList, ImageIcon, Settings2, RefreshCw,
  Check, X, Plus, Users, Layout, Video, FileCode, HelpCircle, Archive, UserCircle, Image, AlertCircle,
  Edit2, History, Share2, Copy, Link, Mail, FileJson, Maximize2, Minimize2,
  Timer, Volume2, VolumeX, Bell, Menu, Home, Brain, Wrench, Layers, FolderOpen, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { renderMathInHtml } from '../lib/latexHelper';
import { educationalData, subjectsByGrade, capsTopics } from '../lib/educational-data';
import { generateCAPSContent, generateVisualAid, generateAdminDoc } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';
import { checkContentQuality, QualityRatingDisplay, type QualityRating } from '../lib/qualityChecker';
import { getSystemPrompt, enhanceUserPrompt } from '../lib/prompts/system-prompts';
import AiImage from './AiImage';
import EduVideoPlayer from './EduVideoPlayer';
import VideoGenerationHistory from './VideoGenerationHistory';
import { PromptQualityValidator } from '../lib/prompt-validator';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { printContent, downloadAsHTML } from '../lib/printUtils';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';
import PrintPreviewModal from './PrintPreviewModal';
import { PosterPreview } from './PosterPreview';
import VideoLabConsole from './VideoLabConsole';
import FoundationPhaseArchitect from './FoundationPhaseArchitect';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';

// ─── Utility ───────────────────────────────────────────────────────────────
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const getGradeKey = (gradeStr: string) => {
  if (!gradeStr) return null;
  if (gradeStr === 'Reception') return 'R';
  return gradeStr.replace('Grade ', '') as any;
};

const getPhaseForGrade = (gradeStr: string): string => {
  if (!gradeStr) return '';
  if (gradeStr === 'Reception' || gradeStr === 'Grade R' || gradeStr === 'R' || gradeStr === 'Grade 1' || gradeStr === 'Grade 2' || gradeStr === 'Grade 3' || gradeStr === '1' || gradeStr === '2' || gradeStr === '3') {
    return 'Foundation Phase';
  }
  if (gradeStr === 'Grade 4' || gradeStr === 'Grade 5' || gradeStr === 'Grade 6' || gradeStr === '4' || gradeStr === '5' || gradeStr === '6') {
    return 'Intermediate Phase';
  }
  if (gradeStr === 'Grade 7' || gradeStr === 'Grade 8' || gradeStr === 'Grade 9' || gradeStr === '7' || gradeStr === '8' || gradeStr === '9') {
    return 'Senior Phase';
  }
  if (gradeStr === 'Grade 10' || gradeStr === 'Grade 11' || gradeStr === 'Grade 12' || gradeStr === '10' || gradeStr === '11' || gradeStr === '12') {
    return 'FET Phase';
  }
  return '';
};

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

const GENERATOR_GROUPS = [
  {
    id: 'teaching',
    label: 'Content Studio',
    icon: FlaskConical,
    desc: 'Generate high-quality lesson plans, worksheets, assignments, daily notes, and tests perfectly mapped to South African CAPS standard criteria.',
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/20 shadow-cyan-500/5',
  },
  {
    id: 'visual',
    label: 'Visual Lab',
    icon: Palette,
    desc: 'Craft striking educational displays, printable flashcards, timeline cards, process flowmaps, mind maps, and interactive signs.',
    color: 'text-brand-purple',
    bg: 'bg-brand-purple/10',
    border: 'border-brand-purple/20 shadow-purple-500/5',
  },
  {
    id: 'video',
    label: 'Video Lab',
    icon: Video,
    desc: 'Create captivating AI teacher avatars, lesson explainer animations, video guidelines, and dynamic digital slideshows.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20 shadow-orange-500/5',
  },
  {
    id: 'admin',
    label: 'Admin Lab',
    icon: FileText,
    desc: 'Draft school correspondence including custom parental permission notices, newsletters, calendars, and certificates of attendance.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20 shadow-blue-500/5',
  },
  {
    id: 'grade1',
    label: 'Foundation Hub',
    icon: Sparkles,
    desc: 'Design foundational literacy and numeracy lessons, phonics flash exercises, spelling tables, and early learning games.',
    color: 'text-brand-yellow',
    bg: 'bg-brand-yellow/10',
    border: 'border-brand-yellow/20 shadow-brand-yellow/5',
  }
];

// Sidebar menu items matching the screenshot
const SIDEBAR_MENU = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'magic-lessons', label: 'Magic Lessons', icon: Sparkles },
  { id: 'super-worksheets', label: 'Super Worksheets', icon: FileText },
  { id: 'smart-bot-tutor', label: 'Smart Bot Tutor', icon: Brain },
  { id: 'personalized-learning', label: 'Personalized Learning', icon: UserCircle },
  { id: 'educational-games', label: 'Educational Games', icon: Zap },
  { id: 'class-manager', label: 'Class Manager', icon: Users },
  { id: 'resource-library', label: 'Resource Library', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

// Top navigation tabs
const TOP_TABS = ['DASHBOARD', 'CLASSROOMS', 'ARCHIVE'];

// ─── Shared UI Components (Simulating Shadcn) ───────────────────────────────

const HtmlPreviewFrame = ({ html, minHeight = "550px", className = "" }: { html: string; minHeight?: string; className?: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!html || !html.trim()) {
    return (
      <div className={cn("w-full h-full min-h-[450px] rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-cyan-500/20 bg-slate-950/40", className)}>
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Sparkles size={28} className="animate-pulse" />
        </div>
        <h4 className="text-base font-bold text-slate-200 font-display">No Preview Document Available</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          Select your CAPS curriculum parameters on the left and click <strong className="text-cyan-400">GENERATE</strong> to create your custom teaching material.
        </p>
      </div>
    );
  }

  const fullDocument = useMemo(() => {
    const isFullDoc = html.includes('<html') || html.includes('<!DOCTYPE');
    if (isFullDoc) return html;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #ffffff;
      color: #0f172a;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 1.5rem;
      line-height: 1.6;
      font-size: 14px;
    }
    h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 0.5rem; margin-top: 0; }
    h2 { font-size: 1.35rem; font-weight: 700; color: #0369a1; margin-top: 1.25rem; }
    h3 { font-size: 1.1rem; font-weight: 700; color: #0284c7; margin-top: 1rem; }
    p { margin-bottom: 0.75rem; font-size: 0.95rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 700; color: #1e293b; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.35rem; }
    img { max-width: 100%; height: auto; border-radius: 0.5rem; display: block; margin: 1rem 0; }
    .score-badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-weight: 800; border: 2px solid #f59e0b; background: #fef3c7; color: #92400e; }
    .header-badge { border: 1px solid #94a3b8; padding: 8px 12px; border-radius: 6px; font-weight: 600; background: #f8fafc; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={fullDocument}
      title="CAPS Document Preview"
      className={cn("w-full border-0 rounded-2xl bg-white shadow-inner transition-all", className)}
      style={{ minHeight }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
};

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5", className)}>
    {children}
  </label>
);

const getCurrentTerm = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return 'Term 1';
  if (month >= 4 && month <= 6) return 'Term 2';
  if (month >= 7 && month <= 9) return 'Term 3';
  if (month >= 10 && month <= 12) return 'Term 4';
  return 'Term 1';
};

const Input = ({ className, isDarkMode = true, ...props }: any) => (
  <input
    className={cn(
      "w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold transition-all shadow-sm",
      isDarkMode !== false
        ? "bg-gradient-to-r from-[#0d152a] via-[#09152a] to-[#0d152a] border-cyan-500/30 text-white placeholder-slate-500 hover:border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        : "bg-[#0d152a] border-slate-700 text-white placeholder-slate-400 hover:border-cyan-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
      className
    )}
    {...props}
  />
);

const Textarea = ({ className, isDarkMode = true, ...props }: any) => (
  <textarea
    className={cn(
      "w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-medium transition-all resize-y shadow-sm",
      isDarkMode !== false
        ? "bg-gradient-to-r from-[#0d152a] via-[#09152a] to-[#0d152a] border-cyan-500/30 text-white placeholder-slate-500 hover:border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        : "bg-[#0d152a] border-slate-700 text-white placeholder-slate-400 hover:border-cyan-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
      className
    )}
    {...props}
  />
);

const Select = ({ className, isDarkMode = true, children, ...props }: any) => (
  <select
    className={cn(
      "w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-bold transition-all appearance-none cursor-pointer shadow-sm [&>option]:bg-[#0d152a] [&>option]:text-slate-100 [&>optgroup]:bg-[#080d1a] [&>optgroup]:text-cyan-400",
      isDarkMode !== false
        ? "bg-gradient-to-r from-[#0d152a] via-[#13203c] to-[#0d152a] border-cyan-500/30 text-cyan-100 hover:border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        : "bg-[#0d152a] border-slate-700 text-cyan-100 hover:border-cyan-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
      className
    )}
    {...props}
  >
    {children}
  </select>
);

const Button = ({ className, children, ...props }: any) => (
  <button
    className={cn(
      "px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

// ─── Section Expander ─────────────────────────────────────────────────────────

function AdvancedSection({ children, label, isDarkMode }: { children: React.ReactNode; label: string; isDarkMode?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border-t pt-3 mt-3", isDarkMode ? "border-cyan-500/20" : "border-slate-200")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between text-[11px] font-black uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all cursor-pointer border shadow-sm",
          isDarkMode
            ? "bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-slate-900 border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
            : "bg-gradient-to-r from-cyan-50 via-purple-50 to-slate-50 border-cyan-200 text-cyan-800 hover:border-cyan-300"
        )}
      >
        <span className="flex items-center gap-2">
          <Wrench size={13} className="text-cyan-400" />
          {label}
        </span>
        {open ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
      </button>
      
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-3 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface ContentCreatorProps {
  isDarkMode: boolean;
  userName: string;
  userRole: string | null;
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: string;
  isSidebarOpen?: boolean;
}

export default function ContentCreator({ isDarkMode, userName, userRole, isOpen, onClose, initialTab, isSidebarOpen }: ContentCreatorProps) {
  // ─── State Management ────────────────────────────────────────────────────
  
  // UI State
  const [activeTab, setActiveTab] = useState(initialTab || 'teaching');
  const [activeTopTab, setActiveTopTab] = useState('DASHBOARD');
  const [activePreviewTab, setActivePreviewTab] = useState<'content' | 'memo' | 'rubric'>('content');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssessingQuality, setIsAssessingQuality] = useState(false);
  const [qualityRating, setQualityRating] = useState<QualityRating | null>(null);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [shareType, setShareType] = useState<'link' | 'text' | 'html' | 'markdown' | 'json' | 'email'>('link');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<'class' | 'group' | 'student'>('class');
  const [assignTargetName, setAssignTargetName] = useState('');
  const [shareTypeMode, setShareTypeMode] = useState<'link' | 'download' | 'email'>('link');
  
  // Teaching Tab State
  const [t_grade, setT_Grade] = useState('');
  const [t_subject, setT_Subject] = useState('');
  const [t_customSubject, setT_CustomSubject] = useState('');
  const [t_type, setT_Type] = useState('');
  const [t_topic, setT_Topic] = useState('');
  const [t_topics, setT_Topics] = useState<string[]>([]);
  const [t_language, setT_Language] = useState('English');
  const [t_difficulty, setT_Difficulty] = useState('Medium (Mixed)');
  const [t_term, setT_Term] = useState(getCurrentTerm());
  const [t_duration, setT_Duration] = useState('45 minutes');
  const [t_learners, setT_Learners] = useState('30');
  const [t_capsAlignment, setT_CapsAlignment] = useState(true);
  const [t_differentiation, setT_Differentiation] = useState(true);
  const [t_ictIntegration, setT_IctIntegration] = useState(false);
  const [t_inclusiveEd, setT_InclusiveEd] = useState(false);
  const [t_generateImage, setT_GenerateImage] = useState(false);
  const [teachingResult, setTeachingResult] = useState<any>({ content: '', memo: '', rubric: '' });
  const [editContentText, setEditContentText] = useState('');
  const [editMemoText, setEditMemoText] = useState('');
  const [editRubricText, setEditRubricText] = useState('');
  
  // Visual Tab State
  const [v_grade, setV_Grade] = useState('');
  const [v_subject, setV_Subject] = useState('');
  const [v_customSubject, setV_CustomSubject] = useState('');
  const [v_type, setV_Type] = useState('');
  const [v_topic, setV_Topic] = useState('');
  const [v_colorScheme, setV_ColorScheme] = useState('Bright Primary Colors');
  const [v_visualStyle, setV_VisualStyle] = useState('Modern & Clean');
  const [v_dimensions, setV_Dimensions] = useState('A4');
  const [v_generateImage, setV_GenerateImage] = useState(false);
  const [v_currentVariation, setV_CurrentVariation] = useState(0);
  const [visualResults, setVisualResults] = useState<any[]>([]);
  const [visualResult, setVisualResult] = useState<any>(null);
  
  // Video Tab State
  const [vid_prompt, setVid_Prompt] = useState('');
  const [vid_model, setVid_Model] = useState('omnihuman-1');
  const [vid_seed, setVid_Seed] = useState(-1);
  const [vid_fps, setVid_Fps] = useState(12);
  const [vid_duration, setVid_Duration] = useState(5);
  const [vid_aspectRatio, setVid_AspectRatio] = useState('16:9');
  const [videoResult, setVideoResult] = useState<any>(null);
  const [videoHistory, setVideoHistory] = useState<any[]>([]);
  
  // Admin Tab State
  const [a_grade, setA_Grade] = useState('');
  const [a_subject, setA_Subject] = useState('');
  const [a_customSubject, setA_CustomSubject] = useState('');
  const [a_type, setA_Type] = useState('');
  const [a_topic, setA_Topic] = useState('');
  const [a_tone, setA_Tone] = useState('Formal & Professional');
  const [a_generateImage, setA_GenerateImage] = useState(false);
  const [adminResult, setAdminResult] = useState<any>({ content: '' });
  
  // Foundation Phase State
  const [f_grade, setF_Grade] = useState('Grade R');
  const [f_language, setF_Language] = useState('English');
  const [f_topic, setF_Topic] = useState('');
  const [f_skillFocus, setF_SkillFocus] = useState('Phonics');
  
  // Firebase & Data State
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbStudyGroups, setDbStudyGroups] = useState<any[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [versions, setVersions] = useState<any>({});
  const [currentDocId, setCurrentDocId] = useState('');
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const { provider } = useAi();

  // ─── Effects ──────────────────────────────────────────────────────────────
  
  useEffect(() => {
    // Load user data from Firebase
    const userId = auth.currentUser?.uid;
    if (userId) {
      const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', userId));
      const groupsQuery = query(collection(db, 'study_groups'), where('teacherId', '==', userId));
      const studentsQuery = query(collection(db, 'students'), where('teacherId', '==', userId));
      
      const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
        setDbClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Error listening to classes:", err);
      });
      
      const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
        setDbStudyGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Error listening to study groups:", err);
      });
      
      const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
        setDbStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Error listening to students:", err);
      });

      return () => {
        unsubscribeClasses();
        unsubscribeGroups();
        unsubscribeStudents();
      };
    }
  }, []);

  useEffect(() => {
    // Update topics when subject changes
    const phase = getPhaseForGrade(t_grade);
    if (phase && (capsTopics as any)[phase] && t_subject && (capsTopics as any)[phase][t_subject]) {
      setT_Topics((capsTopics as any)[phase][t_subject]);
    } else {
      setT_Topics([]);
    }
  }, [t_grade, t_subject]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  
  const handleGenerateTeaching = async () => {
    if (!t_grade || !t_subject || !t_topic || !t_type) return;
    
    setIsGenerating(true);
    try {
      const result = await generateCAPSContent({
        grade: t_grade,
        subject: t_subject === 'Other' ? t_customSubject : t_subject,
        topic: t_topic,
        contentType: t_type,
        language: t_language,
        difficulty: t_difficulty,
        term: t_term,
        duration: t_duration,
        learners: t_learners,
        capsAlignment: t_capsAlignment,
        differentiation: t_differentiation,
        ictIntegration: t_ictIntegration,
        inclusiveEd: t_inclusiveEd,
        generateImage: t_generateImage
      }, provider);
      setTeachingResult(result);
      setCurrentDocId(`teaching-${Date.now()}`);
      
      // Save to versions
      setVersions((prev: any) => ({
        ...prev,
        teaching: [...(prev.teaching || []), {
          content: result.content,
          memo: result.memo,
          rubric: result.rubric,
          timestamp: new Date().toLocaleString()
        }]
      }));

      // Trigger automatic content quality check in background
      setIsAssessingQuality(true);
      checkContentQuality({
        contentType: t_type,
        grade: t_grade,
        subject: t_subject === 'Other' ? t_customSubject : t_subject,
        topic: t_topic,
        content: result.content,
        language: t_language,
        term: t_term
      }).then(rating => {
        setTeachingResult((prev: any) => ({ ...prev, qualityRating: rating }));
        setIsAssessingQuality(false);
      }).catch(e => {
        console.error("Auto quality assessment failed:", e);
        setIsAssessingQuality(false);
      });
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVisual = async () => {
    if (!v_grade || !v_subject || !v_topic || !v_type) return;
    
    setIsGenerating(true);
    try {
      const result = await generateVisualAid({
        grade: v_grade,
        subject: v_subject === 'Other' ? v_customSubject : v_subject,
        visualType: v_type,
        topic: v_topic,
        colorScheme: v_colorScheme,
        style: v_visualStyle,
        dimensions: v_dimensions,
        generateImage: v_generateImage
      }, provider);
      setVisualResults([result]);
      setVisualResult(result);
      setCurrentDocId(`visual-${Date.now()}`);

      // Trigger automatic content quality check in background
      setIsAssessingQuality(true);
      checkContentQuality({
        contentType: v_type,
        grade: v_grade,
        subject: v_subject === 'Other' ? v_customSubject : v_subject,
        topic: v_topic,
        content: result.content
      }).then(rating => {
        setVisualResult((prev: any) => ({ ...prev, qualityRating: rating }));
        setIsAssessingQuality(false);
      }).catch(e => {
        console.error("Auto quality assessment failed:", e);
        setIsAssessingQuality(false);
      });
    } catch (error) {
      console.error('Visual generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAdmin = async () => {
    if (!a_type || !a_topic) return;
    
    setIsGenerating(true);
    try {
      const result = await generateAdminDoc({
        grade: a_grade,
        subject: a_subject === 'Other' ? a_customSubject : a_subject,
        adminType: a_type,
        topic: a_topic,
        tone: a_tone,
        generateImage: a_generateImage
      }, provider);
      setAdminResult(result);
      setCurrentDocId(`admin-${Date.now()}`);

      // Trigger automatic content quality check in background
      setIsAssessingQuality(true);
      checkContentQuality({
        contentType: a_type,
        grade: a_grade,
        subject: a_subject === 'Other' ? a_customSubject : a_subject,
        topic: a_topic,
        content: result.content
      }).then(rating => {
        setAdminResult((prev: any) => ({ ...prev, qualityRating: rating }));
        setIsAssessingQuality(false);
      }).catch(e => {
        console.error("Auto quality assessment failed:", e);
        setIsAssessingQuality(false);
      });
    } catch (error) {
      console.error('Admin generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleForge = async () => {
    if (activeTab === 'teaching' || activeTab === 'grade1') {
      await handleGenerateTeaching();
    } else if (activeTab === 'visual') {
      await handleGenerateVisual();
    } else if (activeTab === 'admin') {
      await handleGenerateAdmin();
    }
  };

  const handleQualityCheck = async () => {
    let contentToCheck = '';
    let typeToCheck = '';
    let gradeToCheck = '';
    let subjectToCheck = '';
    let topicToCheck = '';
    let languageToCheck = 'English';
    let termToCheck = undefined;

    if (activeTab === 'teaching' || activeTab === 'grade1') {
      contentToCheck = teachingResult?.content || '';
      typeToCheck = t_type;
      gradeToCheck = t_grade;
      subjectToCheck = t_subject === 'Other' ? t_customSubject : t_subject;
      topicToCheck = t_topic;
      languageToCheck = t_language;
      termToCheck = t_term;
    } else if (activeTab === 'visual') {
      contentToCheck = visualResult?.content || '';
      typeToCheck = v_type;
      gradeToCheck = v_grade;
      subjectToCheck = v_subject === 'Other' ? v_customSubject : v_subject;
      topicToCheck = v_topic;
    } else if (activeTab === 'admin') {
      contentToCheck = adminResult?.content || '';
      typeToCheck = a_type;
      gradeToCheck = a_grade;
      subjectToCheck = a_subject === 'Other' ? a_customSubject : a_subject;
      topicToCheck = a_topic;
    }

    if (!contentToCheck) {
      return;
    }

    setShowQualityCheck(true);
    setIsGenerating(true);

    try {
      const rating = await checkContentQuality({
        contentType: typeToCheck,
        grade: gradeToCheck,
        subject: subjectToCheck,
        topic: topicToCheck,
        content: contentToCheck,
        language: languageToCheck,
        term: termToCheck
      });

      setQualityRating(rating);
    } catch (error) {
      console.error('Quality check failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (contentRef) {
      printContent(contentRef, activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : a_topic);
    }
  };

  const handleDownloadPDF = async () => {
    if (contentRef.current) {
      patchOklchForHtml2canvas();
      const element = contentRef.current;
      const opt = {
        margin: 0.5,
        filename: `${activeTab}-${Date.now()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(element).save();
    }
  };

  const handleToggleEdit = () => {
    if (!isEditing) {
      // Populate edit fields
      if (activeTab === 'teaching' || activeTab === 'grade1') {
        setEditContentText(teachingResult.content || '');
        setEditMemoText(teachingResult.memo || '');
        setEditRubricText(teachingResult.rubric || '');
      } else {
        setEditContentText((activeTab === 'visual' ? visualResult?.content : adminResult?.content) || '');
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdits = () => {
    if (activeTab === 'teaching' || activeTab === 'grade1') {
      setTeachingResult({
        ...teachingResult,
        content: editContentText,
        memo: editMemoText,
        rubric: editRubricText
      });
    } else if (activeTab === 'visual') {
      setVisualResult({ ...visualResult, content: editContentText });
    } else {
      setAdminResult({ ...adminResult, content: editContentText });
    }
    setIsEditing(false);
  };

  const handleRestoreVersion = (version: any) => {
    if (activeTab === 'teaching' || activeTab === 'grade1') {
      setTeachingResult({
        content: version.content,
        memo: version.memo,
        rubric: version.rubric
      });
    }
  };

  const handleArchive = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const docData = {
        type: activeTab,
        content: activeTab === 'teaching' || activeTab === 'grade1' ? teachingResult : 
                 activeTab === 'visual' ? visualResult : adminResult,
        timestamp: serverTimestamp(),
        metadata: {
          grade: activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade,
          subject: activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : a_subject,
          topic: activeTab === 'teaching' ? t_topic : activeTab === 'visual' ? v_topic : a_topic,
        }
      };
      
      await setDoc(doc(db, 'users', userId, 'archive', currentDocId), docData);
      setArchiveSuccess(true);
      setTimeout(() => setArchiveSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'archive');
    }
  };

  const handleAssign = () => {
    setShowAssignModal(true);
  };

  const confirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSuccess(true);
    setTimeout(() => {
      setAssignSuccess(false);
      setShowAssignModal(false);
    }, 2000);
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      await deleteDoc(doc(db, 'users', userId, 'videoHistory', videoId));
      setVideoHistory(prev => prev.filter(v => v.id !== videoId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'videoHistory');
    }
  };

  const downloadBlobFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const htmlToMarkdown = (html: string) => {
    return html
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '# $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────
  
  const ContentPreview = ({ html, label, isDarkMode, imagePrompt, grade, subject, contentType, qualityRating, isAssessing, onViewReport, allowImages = false }: any) => {
    const getScoreColor = (score: number) => {
      if (score >= 85) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      if (score >= 70) return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10';
      if (score >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    };

    return (
      <div className={cn(
        "rounded-2xl border p-6 space-y-4 overflow-hidden",
        isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
      )}>
        {/* Inline Quality Assessment Status or Score Panel */}
        {isAssessing ? (
          <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-cyan-400" size={18} />
              <span className="text-xs font-semibold text-cyan-300 font-mono tracking-wider">
                AUTO-ASSESSING CAPS ALIGNMENT...
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Curriculum QA Bot</span>
          </div>
        ) : qualityRating ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/5 shadow-md">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-xl border font-bold text-lg shadow-sm font-sans shrink-0",
                getScoreColor(qualityRating.overall)
              )}>
                <span>{qualityRating.overall}%</span>
                <span className="text-[8px] uppercase tracking-wider font-extrabold opacity-75">QA Score</span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className={cn("text-sm font-bold font-sans", isDarkMode ? "text-white" : "text-slate-900")}>
                    CAPS Quality Verified
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wide">
                    CAPS Aligned
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5">
                    CAPS: <strong className="text-cyan-300">{qualityRating.capsCompliance}%</strong>
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5">
                    Pedagogy: <strong className="text-purple-300">{qualityRating.pedagogicalQuality}%</strong>
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5">
                    SA Context: <strong className="text-amber-300">{qualityRating.culturalRelevance}%</strong>
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onViewReport(qualityRating)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>View Detailed QA Report</span>
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <FileText size={18} className="text-cyan-400" />
          <h3 className={cn("text-sm font-bold uppercase tracking-widest", isDarkMode ? "text-white" : "text-slate-900")}>
            {label}
          </h3>
        </div>
        
        <div 
          className={cn(
            "prose prose-sm max-w-none overflow-x-auto",
            isDarkMode ? "text-slate-300" : "text-slate-700"
          )}
          dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(html, allowImages) }}
        />
        
        {imagePrompt && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <AiImage prompt={imagePrompt} />
          </div>
        )}
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────
  
  return (
    <div className={cn(
      "fixed inset-0 z-40 flex flex-col overflow-hidden transition-all duration-300",
      isDarkMode ? "bg-[#0a0f21]" : "bg-slate-50",
      isSidebarOpen ? "lg:pl-[240px]" : "lg:pl-[84px]"
    )}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full max-h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <header className={cn(
          "sticky top-0 z-40 border-b backdrop-blur-xl shrink-0",
          isDarkMode 
            ? "bg-[#0d1221]/80 border-white/10" 
            : "bg-white/80 border-slate-200"
        )}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-3 sm:py-4">
            {/* Top Tabs & Exit Button */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2 px-3 rounded-xl transition-all flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest border cursor-pointer shrink-0",
                    isDarkMode 
                      ? "border-white/10 hover:bg-white/5 text-slate-300 hover:text-white"
                      : "border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                  )}
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">Exit Studio</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
                {TOP_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTopTab(tab)}
                    className={cn(
                      "px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      activeTopTab === tab
                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                        : isDarkMode
                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* User Profile & Notifications */}
            <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0">
              <button className={cn(
                "relative p-2 rounded-xl transition-all shrink-0",
                isDarkMode ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-600"
              )}>
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
              
              <div className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border shrink-0",
                isDarkMode 
                  ? "bg-white/5 border-white/10" 
                  : "bg-slate-100 border-slate-200"
              )}>
                <UserCircle size={24} className="text-cyan-400" />
                <span className={cn(
                  "text-xs sm:text-sm font-bold hidden md:inline",
                  isDarkMode ? "text-white" : "text-slate-900"
                )}>
                  Commander {userName}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* Content Factory Title */}
          <div className="text-center mb-6 sm:mb-10">
            <h1 className={cn(
              "text-3xl sm:text-5xl font-black mb-2 sm:mb-3 tracking-tight uppercase",
              isDarkMode ? "text-white" : "text-slate-900"
            )}>
              Content Factory
            </h1>
            <p className={cn(
              "text-xs sm:text-sm",
              isDarkMode ? "text-slate-400" : "text-slate-600"
            )}>
              Create immersive educational content with AI-powered precision
            </p>
          </div>

          {/* Studio Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            {GENERATOR_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.id)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer",
                  activeTab === group.id
                    ? (isDarkMode 
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold shadow-lg shadow-cyan-500/10" 
                      : "bg-cyan-50 border-cyan-200 text-cyan-700 font-bold shadow-md")
                    : (isDarkMode 
                      ? "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10" 
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50")
                )}
              >
                <group.icon size={14} className="sm:size-4" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">{group.label}</span>
              </button>
            ))}
          </div>

          {/* Module-specific Layout routing */}
          {activeTab === 'video' ? (
            <div className="max-w-6xl mx-auto">
              <VideoLabConsole isDarkMode={isDarkMode} onClose={onClose} />
            </div>
          ) : activeTab === 'grade1' ? (
            <div className="max-w-6xl mx-auto">
              <FoundationPhaseArchitect isDarkMode={isDarkMode} onClose={onClose} />
            </div>
          ) : (
            /* Main Content Grid for Teaching, Visual, Admin */
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lesson Creation Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "rounded-3xl border p-6 backdrop-blur-xl",
                  isDarkMode
                    ? "bg-white/5 border-white/10 shadow-2xl shadow-black/20"
                    : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
                )}
              >
                <h2 className={cn(
                  "text-xl font-bold mb-6 flex items-center gap-2",
                  isDarkMode ? "text-white" : "text-slate-900"
                )}>
                  <Wrench size={20} className="text-cyan-400" />
                  {activeTab === 'teaching' && "Content Studio Setup"}
                  {activeTab === 'visual' && "Visual Lab Studio"}
                  {activeTab === 'admin' && "Admin Correspondence Creator"}
                </h2>

                <div className="space-y-4">
                  {/* Phase Quick-Select Pill Buttons (only for teaching/visual) */}
                  {activeTab !== 'admin' && (
                    <div className="space-y-1.5">
                      <Label>Quick Phase Preset</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Foundation (R-3)', grade: 'Grade 1', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300' },
                          { label: 'Intermediate (4-6)', grade: 'Grade 4', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300' },
                          { label: 'Senior (7-9)', grade: 'Grade 8', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300' },
                          { label: 'FET Phase (10-12)', grade: 'Grade 10', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300' },
                        ].map((phase) => {
                          const currentGrade = activeTab === 'teaching' ? t_grade : v_grade;
                          const isSelected = getPhaseForGrade(currentGrade) === (
                            phase.grade === 'Grade 1' ? 'Foundation Phase' :
                            phase.grade === 'Grade 4' ? 'Intermediate Phase' :
                            phase.grade === 'Grade 8' ? 'Senior Phase' : 'FET Phase'
                          );
                          return (
                            <button
                              key={phase.label}
                              type="button"
                              onClick={() => {
                                if (activeTab === 'teaching') {
                                  setT_Grade(phase.grade);
                                  setT_Subject('');
                                  setT_Topic('');
                                } else {
                                  setV_Grade(phase.grade);
                                  setV_Subject('');
                                  setV_Topic('');
                                }
                              }}
                              className={cn(
                                "py-1.5 px-2.5 rounded-xl border text-[10px] font-bold tracking-tight transition-all text-center cursor-pointer bg-gradient-to-r shadow-xs hover:scale-[1.02] active:scale-95 truncate",
                                phase.color,
                                isSelected ? "ring-2 ring-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] opacity-100" : "opacity-80 hover:opacity-100"
                              )}
                            >
                              {phase.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Primary Parameters Grid: 2 Side-by-Side Controls per Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Grade Selector (only for teaching/visual) */}
                    {activeTab !== 'admin' && (
                      <div>
                        <Label>Grade Level (R-12)</Label>
                        <Select
                          isDarkMode={isDarkMode}
                          value={activeTab === 'teaching' ? t_grade : v_grade}
                          className={cn(
                            (activeTab === 'teaching' ? t_grade : v_grade) && (isDarkMode ? "border-cyan-400/60 bg-cyan-950/30 text-cyan-200" : "border-cyan-300 bg-cyan-50/80")
                          )}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            if (activeTab === 'teaching') {
                              setT_Grade(val);
                              setT_Subject('');
                              setT_Topic('');
                            } else {
                              setV_Grade(val);
                              setV_Subject('');
                              setV_Topic('');
                            }
                          }}
                        >
                          <option value="">Choose Grade</option>
                          {['Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
                            'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
                            'Grade 11', 'Grade 12'].map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* Subject Area */}
                    <div className={activeTab === 'admin' ? "col-span-1" : ""}>
                      <Label>Subject Area</Label>
                      <Select
                        isDarkMode={isDarkMode}
                        value={activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : a_subject}
                        className={cn(
                          (activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : a_subject) && (isDarkMode ? "border-purple-400/60 bg-purple-950/30 text-purple-200" : "border-purple-300 bg-purple-50/80")
                        )}
                        onChange={(e: any) => {
                          const val = e.target.value;
                          if (activeTab === 'teaching') {
                            setT_Subject(val);
                            setT_Topic('');
                          } else if (activeTab === 'visual') {
                            setV_Subject(val);
                            setV_Topic('');
                          } else {
                            setA_Subject(val);
                            setA_Topic('');
                          }
                        }}
                      >
                        <option value="">Choose Subject</option>
                        {activeTab === 'admin' ? (
                          ['Mathematics', 'Physical Sciences', 'Life Sciences', 'English', 
                           'Afrikaans', 'History', 'Geography', 'Economic Management Sciences',
                           'Natural Sciences', 'Technology', 'Creative Arts', 'Other'].map(subj => (
                            <option key={subj} value={subj}>{subj}</option>
                          ))
                        ) : (
                          (() => {
                            const currentGrade = activeTab === 'teaching' ? t_grade : v_grade;
                            const phase = getPhaseForGrade(currentGrade);
                            const subjects = phase && (subjectsByGrade as any)[phase]
                              ? (subjectsByGrade as any)[phase]
                              : [];
                            return [...subjects, 'Other'].map(subj => (
                              <option key={subj} value={subj}>{subj}</option>
                            ));
                          })()
                        )}
                      </Select>
                    </div>

                    {/* Custom Subject (if 'Other' is chosen) */}
                    {((activeTab === 'teaching' && t_subject === 'Other') ||
                      (activeTab === 'visual' && v_subject === 'Other') ||
                      (activeTab === 'admin' && a_subject === 'Other')) && (
                      <div className="col-span-1 sm:col-span-2">
                        <Label>Specify Custom Subject</Label>
                        <Input
                          isDarkMode={isDarkMode}
                          type="text"
                          value={activeTab === 'teaching' ? t_customSubject : activeTab === 'visual' ? v_customSubject : a_customSubject}
                          onChange={(e: any) => {
                            if (activeTab === 'teaching') setT_CustomSubject(e.target.value);
                            else if (activeTab === 'visual') setV_CustomSubject(e.target.value);
                            else setA_CustomSubject(e.target.value);
                          }}
                          placeholder="Enter custom subject name..."
                        />
                      </div>
                    )}

                    {/* Content / Visual / Admin Type */}
                    {activeTab === 'teaching' && (
                      <div>
                        <Label>Content Type</Label>
                        <Select
                          isDarkMode={isDarkMode}
                          value={t_type}
                          onChange={(e: any) => setT_Type(e.target.value)}
                        >
                          <option value="">Choose Type</option>
                          {Object.entries(TEACHING_CATEGORIES).map(([cat, types]) => (
                            <optgroup key={cat} label={cat}>
                              {types.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                      </div>
                    )}

                    {activeTab === 'visual' && (
                      <div>
                        <Label>Visual Type</Label>
                        <Select
                          isDarkMode={isDarkMode}
                          value={v_type}
                          onChange={(e: any) => setV_Type(e.target.value)}
                        >
                          <option value="">Choose Type</option>
                          {Object.entries(VISUAL_TYPES).map(([cat, types]) => (
                            <optgroup key={cat} label={cat}>
                              {types.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                      </div>
                    )}

                    {activeTab === 'admin' && (
                      <div>
                        <Label>Administration Type</Label>
                        <Select
                          isDarkMode={isDarkMode}
                          value={a_type}
                          onChange={(e: any) => setA_Type(e.target.value)}
                        >
                          <option value="">Choose Type</option>
                          {Object.entries(ADMIN_TYPES).map(([cat, types]) => (
                            <optgroup key={cat} label={cat}>
                              {types.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* Topic Field */}
                    <div>
                      <Label>Topic</Label>
                      {activeTab !== 'admin' ? (
                        (() => {
                          const currentGrade = activeTab === 'teaching' ? t_grade : v_grade;
                          const currentSubject = activeTab === 'teaching' ? t_subject : v_subject;
                          const phase = getPhaseForGrade(currentGrade);
                          const topics = phase && currentSubject && (capsTopics as any)[phase] && (capsTopics as any)[phase][currentSubject]
                            ? (capsTopics as any)[phase][currentSubject] as string[]
                            : [];
                          
                          const currentTopicValue = activeTab === 'teaching' ? t_topic : v_topic;
                          
                          if (topics.length > 0) {
                            return (
                              <div className="space-y-2">
                                <Select
                                  isDarkMode={isDarkMode}
                                  value={topics.includes(currentTopicValue) ? currentTopicValue : (currentTopicValue ? "Other" : "")}
                                  onChange={(e: any) => {
                                    const val = e.target.value;
                                    if (val === 'Other') {
                                      if (activeTab === 'teaching') setT_Topic('');
                                      else setV_Topic('');
                                    } else {
                                      if (activeTab === 'teaching') setT_Topic(val);
                                      else setV_Topic(val);
                                    }
                                  }}
                                >
                                  <option value="">Choose Topic</option>
                                  {topics.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                  ))}
                                  <option value="Other">Other (Custom)</option>
                                </Select>
                                
                                {(!topics.includes(currentTopicValue) || currentTopicValue === '') && (
                                  <Input
                                    isDarkMode={isDarkMode}
                                    type="text"
                                    value={currentTopicValue}
                                    onChange={(e: any) => {
                                      if (activeTab === 'teaching') setT_Topic(e.target.value);
                                      else setV_Topic(e.target.value);
                                    }}
                                    placeholder="Type custom topic..."
                                  />
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <Input
                                isDarkMode={isDarkMode}
                                type="text"
                                value={currentTopicValue}
                                onChange={(e: any) => {
                                  if (activeTab === 'teaching') setT_Topic(e.target.value);
                                  else setV_Topic(e.target.value);
                                }}
                                placeholder="e.g., Fractions, Periodic Table"
                              />
                            );
                          }
                        })()
                      ) : (
                        <Input
                          isDarkMode={isDarkMode}
                          type="text"
                          value={a_topic}
                          onChange={(e: any) => setA_Topic(e.target.value)}
                          placeholder="e.g., Parent Newsletter"
                        />
                      )}
                    </div>
                  </div>

                  {/* Embedded Advanced Section based on mode */}
                  {activeTab === 'teaching' && (
                    <AdvancedSection label="Advanced Parameters" isDarkMode={isDarkMode}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Language</Label>
                          <Select
                            isDarkMode={isDarkMode}
                            value={t_language}
                            onChange={(e: any) => setT_Language(e.target.value)}
                          >
                            {LANGUAGES.map(lang => (
                              <option key={lang} value={lang}>{lang}</option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <Label>Difficulty</Label>
                          <Select
                            isDarkMode={isDarkMode}
                            value={t_difficulty}
                            onChange={(e: any) => setT_Difficulty(e.target.value)}
                          >
                            {DIFFICULTIES.map(diff => (
                              <option key={diff} value={diff}>{diff}</option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <Label>Duration</Label>
                          <Input
                            isDarkMode={isDarkMode}
                            type="text"
                            value={t_duration}
                            onChange={(e: any) => setT_Duration(e.target.value)}
                            placeholder="e.g. 45 minutes"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>No. of Learners</Label>
                          <Input
                            isDarkMode={isDarkMode}
                            type="number"
                            value={t_learners}
                            onChange={(e: any) => setT_Learners(e.target.value)}
                            placeholder="e.g. 30"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-6">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Generate Accompanying AI Illustration</span>
                          <input
                            type="checkbox"
                            checked={t_generateImage}
                            onChange={(e) => setT_GenerateImage(e.target.checked)}
                            className="w-5 h-5 accent-cyan-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider cursor-pointer text-slate-400">
                          <input
                            type="checkbox"
                            checked={t_capsAlignment}
                            onChange={(e) => setT_CapsAlignment(e.target.checked)}
                            className="w-4 h-4 accent-cyan-400 animate-pulse"
                          />
                          Enforce CAPS Curriculum Pacing Alignment
                        </label>

                        <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider cursor-pointer text-slate-400">
                          <input
                            type="checkbox"
                            checked={t_differentiation}
                            onChange={(e) => setT_Differentiation(e.target.checked)}
                            className="w-4 h-4 accent-cyan-400"
                          />
                          Include Differentiated Learning Strategies
                        </label>

                        <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider cursor-pointer text-slate-400">
                          <input
                            type="checkbox"
                            checked={t_ictIntegration}
                            onChange={(e) => setT_IctIntegration(e.target.checked)}
                            className="w-4 h-4 accent-cyan-400"
                          />
                          Add ICT (e-Learning) Resource Integration
                        </label>

                        <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider cursor-pointer text-slate-400">
                          <input
                            type="checkbox"
                            checked={t_inclusiveEd}
                            onChange={(e) => setT_InclusiveEd(e.target.checked)}
                            className="w-4 h-4 accent-cyan-400"
                          />
                          South African Inclusive Education Policy (SIAS) Adaptations
                        </label>
                      </div>
                    </AdvancedSection>
                  )}

                  {activeTab === 'visual' && (
                    <AdvancedSection label="Visual Settings" isDarkMode={isDarkMode}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Color Scheme</Label>
                          <Select
                            isDarkMode={isDarkMode}
                            value={v_colorScheme}
                            onChange={(e: any) => setV_ColorScheme(e.target.value)}
                          >
                            {COLOR_SCHEMES.map(color => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <Label>Visual Style</Label>
                          <Select
                            isDarkMode={isDarkMode}
                            value={v_visualStyle}
                            onChange={(e: any) => setV_VisualStyle(e.target.value)}
                          >
                            {VISUAL_STYLES.map(style => (
                              <option key={style} value={style}>{style}</option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Paper Size / Dimensions</Label>
                          <Select
                            isDarkMode={isDarkMode}
                            value={v_dimensions}
                            onChange={(e: any) => setV_Dimensions(e.target.value)}
                          >
                            {['A4 Portrait', 'A4 Landscape', 'A3 Poster', 'Standard Card'].map(dim => (
                              <option key={dim} value={dim}>{dim}</option>
                            ))}
                          </Select>
                        </div>

                        <div className="flex items-center justify-between pt-6">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Generate Accompanying AI Illustration</span>
                          <input
                            type="checkbox"
                            checked={v_generateImage}
                            onChange={(e) => setV_GenerateImage(e.target.checked)}
                            className="w-5 h-5 accent-cyan-400"
                          />
                        </div>
                      </div>
                    </AdvancedSection>
                  )}

                  {activeTab === 'admin' && (
                    <AdvancedSection label="Administration Settings" isDarkMode={isDarkMode}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tone</Label>
                          <Select
                            isDarkMode={isDarkMode}
                            value={a_tone}
                            onChange={(e: any) => setA_Tone(e.target.value)}
                          >
                            {TONES.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </Select>
                        </div>

                        <div className="flex items-center justify-between pt-6">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Generate Accompanying AI Illustration</span>
                          <input
                            type="checkbox"
                            checked={a_generateImage}
                            onChange={(e) => setA_GenerateImage(e.target.checked)}
                            className="w-5 h-5 accent-cyan-400"
                          />
                        </div>
                      </div>
                    </AdvancedSection>
                  )}
                </div>
              </motion.div>

              {/* Magic Preview Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn(
                  "rounded-3xl border p-6 backdrop-blur-xl flex flex-col justify-between",
                  isDarkMode
                    ? "bg-white/5 border-white/10 shadow-2xl shadow-black/20"
                    : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"
                )}
                id="preview-panel"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn(
                      "text-xl font-bold flex items-center gap-2",
                      isDarkMode ? "text-white" : "text-slate-900"
                    )}>
                      <Sparkles size={20} className="text-purple-400" />
                      Magic Preview
                    </h2>

                    {/* Fullscreen Button */}
                    {((activeTab === 'teaching' && (teachingResult?.content || teachingResult?.memo || teachingResult?.rubric)) ||
                      (activeTab === 'visual' && visualResult?.content) ||
                      (activeTab === 'admin' && adminResult?.content)) && !isGenerating && (
                      <button
                        onClick={() => setIsFullscreenPreview(true)}
                        className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Maximize2 size={14} /> Fullscreen View
                      </button>
                    )}
                  </div>

                  {/* Preview Area */}
                  {(() => {
                    const hasContent = (activeTab === 'teaching' && (teachingResult?.content || teachingResult?.memo || teachingResult?.rubric)) ||
                                       (activeTab === 'visual' && visualResult?.content) ||
                                       (activeTab === 'admin' && adminResult?.content);
                    
                    if (!hasContent && isGenerating) {
                      return (
                        <div className={cn(
                          "rounded-3xl border shadow-2xl overflow-hidden flex flex-col min-h-[420px] items-center justify-center p-8 text-center relative",
                          isDarkMode ? "bg-[#050a18] border-white/10" : "bg-slate-50 border-slate-200"
                        )}>
                          {/* Scanning Sweep Overlay */}
                          <motion.div
                            className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.9)] z-20"
                            animate={{ top: ["4%", "96%", "4%"] }}
                            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                          />
                          <div className="text-center z-10 bg-[#070b19]/80 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/20 max-w-[280px] shadow-2xl">
                            <Loader2 className="animate-spin mx-auto mb-3 text-cyan-400" size={40} />
                            <p className="text-sm font-black uppercase tracking-widest text-cyan-400">Forging Content</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-sans">Applying South African CAPS pedagogic rules...</p>
                          </div>
                        </div>
                      );
                    }

                    if (!hasContent) {
                      return (
                        <div className={cn(
                          "rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-12 text-center min-h-[400px]",
                          isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                        )}>
                          <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 flex items-center justify-center mb-4 text-cyan-400">
                            <Zap size={32} />
                          </div>
                          <h3 className={cn("text-lg font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>Ready to Forge?</h3>
                          <p className="text-sm text-slate-400 max-w-xs mx-auto">
                            Select your CAPS parameters on the left and click "GENERATE" to witness AI education magic.
                          </p>
                        </div>
                      );
                    }

                    const activeHtml = activeTab === 'teaching' 
                      ? (activePreviewTab === 'content' ? (teachingResult?.content || '') : activePreviewTab === 'memo' ? (teachingResult?.memo || '') : (teachingResult?.rubric || ''))
                      : activeTab === 'visual' ? (visualResult?.content || '')
                      : (adminResult?.content || '');

                    const currentGrade = activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade;
                    const currentSubject = (activeTab === 'teaching' ? (t_subject === 'Other' ? t_customSubject : t_subject) : activeTab === 'visual' ? (v_subject === 'Other' ? v_customSubject : v_subject) : (a_subject === 'Other' ? a_customSubject : a_subject)) || 'General';
                    const currentTopic = activeTab === 'teaching' ? t_topic : activeTab === 'visual' ? v_topic : a_topic;
                    const currentType = activeTab === 'teaching' ? t_type : activeTab === 'visual' ? v_type : a_type;

                    return (
                      <div className="space-y-4">
                        <div className={cn(
                          "rounded-3xl border shadow-2xl overflow-hidden flex flex-col min-h-[550px]",
                          isDarkMode ? "bg-[#050a18] border-white/10" : "bg-white border-slate-200"
                        )}>
                          {/* Document Viewer Frame */}
                          <div className={cn(
                            "p-1 flex items-center gap-2 border-b",
                            isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                          )}>
                            <div className="flex gap-1.5 ml-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
                            </div>
                            <div className="flex-1 text-center">
                              <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">eduai-preview-viewport.caps</span>
                            </div>
                          </div>

                          {/* Interactive Page Viewport */}
                          <div className="flex-1 max-h-[650px] overflow-y-auto scrollbar-thin p-3 sm:p-4">
                            <HtmlPreviewFrame
                              html={replaceImagePlaceholders(activeHtml, activeTab === 'teaching' ? t_generateImage : activeTab === 'visual' ? v_generateImage : a_generateImage)}
                              minHeight="550px"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* GENERATE Button */}
                <button
                  onClick={handleForge}
                  disabled={
                    (activeTab === 'teaching' && (!t_grade || !t_subject || !t_topic || !t_type)) ||
                    (activeTab === 'visual' && (!v_grade || !v_subject || !v_topic || !v_type)) ||
                    (activeTab === 'admin' && (!a_type || !a_topic)) ||
                    isGenerating
                  }
                  className={cn(
                    "mt-6 w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg",
                    ((activeTab === 'teaching' && (!t_grade || !t_subject || !t_topic || !t_type)) ||
                    (activeTab === 'visual' && (!v_grade || !v_subject || !v_topic || !v_type)) ||
                    (activeTab === 'admin' && (!a_type || !a_topic)) ||
                    isGenerating)
                      ? "opacity-50 cursor-not-allowed bg-slate-700 text-slate-400"
                      : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="group-hover:animate-pulse" />
                      GENERATE
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          )}

          {/* Results Section - RESTORED to the bottom */}
          {((activeTab === 'teaching' && (teachingResult?.content || teachingResult?.memo || teachingResult?.rubric)) ||
            (activeTab === 'visual' && visualResult?.content) ||
            (activeTab === 'admin' && adminResult?.content)) && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-6xl mx-auto mt-8 pb-12"
            >
              <div className={cn(
                "rounded-3xl border p-8 backdrop-blur-xl",
                isDarkMode
                  ? "bg-[#0d1221]/90 border-white/10 shadow-2xl"
                  : "bg-white border-slate-200 shadow-xl"
              )}>
                {/* Result Tabs Selector (Teaching) */}
                {activeTab === 'teaching' && (
                  <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
                    <button
                      onClick={() => setActivePreviewTab('content')}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        activePreviewTab === 'content'
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      Lesson Material
                    </button>
                    {teachingResult.memo && (
                      <button
                        onClick={() => setActivePreviewTab('memo')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                          activePreviewTab === 'memo'
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        Expert Memo
                      </button>
                    )}
                    {teachingResult.rubric && (
                      <button
                        onClick={() => setActivePreviewTab('rubric')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                          activePreviewTab === 'rubric'
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        Marks Rubric
                      </button>
                    )}
                  </div>
                )}

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-white/5">
                  <Button
                    onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                    className={cn(
                      "border text-[10px] font-black uppercase tracking-widest",
                      isDarkMode 
                        ? "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900"
                    )}
                  >
                    {isFullscreenPreview ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    {isFullscreenPreview ? 'Minimize' : 'Fullscreen'}
                  </Button>
                  
                  <Button
                    onClick={handlePrint}
                    className={cn(
                      "border text-[10px] font-black uppercase tracking-widest",
                      isDarkMode 
                        ? "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900"
                    )}
                  >
                    <Printer size={14} />
                    Print File
                  </Button>
                  
                  <Button
                    onClick={handleDownloadPDF}
                    className={cn(
                      "border text-[10px] font-black uppercase tracking-widest",
                      isDarkMode 
                        ? "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900"
                    )}
                  >
                    <Download size={14} />
                    PDF Download
                  </Button>
                  
                  <Button
                    onClick={handleToggleEdit}
                    className={cn(
                      "border text-[10px] font-black uppercase tracking-widest",
                      isEditing
                        ? "bg-cyan-400 border-cyan-400/20 text-slate-900"
                        : isDarkMode
                        ? "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900"
                    )}
                  >
                    <Edit2 size={14} />
                    {isEditing ? 'Save Sandbox' : 'Edit Document'}
                  </Button>

                  <Button
                    onClick={handleQualityCheck}
                    className={cn(
                      "border text-[10px] font-black uppercase tracking-widest",
                      showQualityCheck && qualityRating
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isDarkMode 
                        ? "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900"
                    )}
                  >
                    <ClipboardList size={14} />
                    Quality Check
                  </Button>
                  
                  <Button
                    onClick={() => setShowShareModal(true)}
                    className={cn(
                      "border text-[10px] font-black uppercase tracking-widest",
                      isDarkMode 
                        ? "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900"
                    )}
                  >
                    <Share2 size={14} />
                    Export
                  </Button>
                  
                  <Button
                    onClick={handleArchive}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest ml-auto",
                      archiveSuccess
                        ? "bg-emerald-500 text-white border-0"
                        : "bg-cyan-400 hover:bg-cyan-500 text-slate-900 border-0 shadow-lg shadow-cyan-500/20"
                    )}
                  >
                    {archiveSuccess ? <Check size={14} /> : <Save size={14} />}
                    {archiveSuccess ? 'Archived ✅' : 'Archive to Library'}
                  </Button>
                </div>

                {/* Quality Badge if checked */}
                {(teachingResult?.qualityRating || visualResult?.qualityRating || adminResult?.qualityRating) && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
                    <span className="flex items-center gap-2">
                      <Check className="text-emerald-400" size={16} />
                      CAPS Quality Score: {((teachingResult?.qualityRating || visualResult?.qualityRating || adminResult?.qualityRating)?.capsAlignmentScore || 95)}% (CAPS Aligned)
                    </span>
                    <button
                      onClick={() => {
                        setQualityRating(teachingResult?.qualityRating || visualResult?.qualityRating || adminResult?.qualityRating);
                        setShowQualityCheck(true);
                      }}
                      className="text-[10px] underline uppercase tracking-wider text-emerald-300 hover:text-white cursor-pointer"
                    >
                      View Full Breakdown
                    </button>
                  </div>
                )}

                {/* Editable Editor */}
                {isEditing && (
                  <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-cyan-400">Sandbox Editor</h4>
                        <p className="text-[10px] text-slate-400">Modify the generation directly.</p>
                      </div>
                      <Button
                        onClick={handleSaveEdits}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-2"
                      >
                        <Save size={12} />
                        Apply Edits
                      </Button>
                    </div>
                    
                    <Textarea
                      isDarkMode={isDarkMode}
                      value={activeTab === 'teaching' ? (activePreviewTab === 'content' ? editContentText : activePreviewTab === 'memo' ? editMemoText : editRubricText) : editContentText}
                      onChange={(e: any) => {
                        const val = e.target.value;
                        if (activeTab === 'teaching') {
                          if (activePreviewTab === 'content') setEditContentText(val);
                          else if (activePreviewTab === 'memo') setEditMemoText(val);
                          else setEditRubricText(val);
                        } else {
                          setEditContentText(val);
                        }
                      }}
                      className="h-64 font-mono text-[11px] leading-relaxed"
                    />
                  </div>
                )}

                <div className="text-center text-[10px] text-slate-500 font-mono italic">
                  Use the tools above to print, download, edit, or archive your generated CAPS document.
                </div>
              </div>
            </motion.div>
          )}

          {/* Dedicated Fullscreen Preview Modal */}
          <AnimatePresence>
            {isFullscreenPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex flex-col p-4 sm:p-8"
              >
                <div className="flex justify-between items-center bg-slate-900/80 border border-white/10 rounded-2xl p-4 mb-4 backdrop-blur-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-cyan-400" size={20} />
                    <div>
                      <h3 className="text-white font-bold text-sm">
                        {activeTab === 'teaching' ? (t_topic || t_type || 'Lesson Material') : activeTab === 'visual' ? (v_topic || v_type) : a_topic}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Grade {activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade} • {activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : a_subject}
                      </p>
                    </div>
                  </div>

                  {/* Tab Switcher in Fullscreen */}
                  {activeTab === 'teaching' && (
                    <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => setActivePreviewTab('content')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                          activePreviewTab === 'content' ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                        )}
                      >
                        Lesson Material
                      </button>
                      {teachingResult.memo && (
                        <button
                          onClick={() => setActivePreviewTab('memo')}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                            activePreviewTab === 'memo' ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Memo
                        </button>
                      )}
                      {teachingResult.rubric && (
                        <button
                          onClick={() => setActivePreviewTab('rubric')}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                            activePreviewTab === 'rubric' ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Rubric
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={14} /> Print
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> PDF
                    </button>
                    <button
                      onClick={() => setIsFullscreenPreview(false)}
                      className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex justify-center">
                  <HtmlPreviewFrame
                    html={replaceImagePlaceholders(
                      activeTab === 'teaching' 
                        ? (activePreviewTab === 'content' ? teachingResult.content : activePreviewTab === 'memo' ? teachingResult.memo : teachingResult.rubric)
                        : activeTab === 'visual' ? visualResult?.content : adminResult.content,
                      activeTab === 'teaching' ? t_generateImage : activeTab === 'visual' ? v_generateImage : a_generateImage
                    )}
                    minHeight="100%"
                    className="w-full h-full max-w-5xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={cn(
                "rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl relative",
                isDarkMode ? "bg-[#0d1221] border border-white/10" : "bg-white"
              )}
            >
              <button
                onClick={() => setShowAssignModal(false)}
                className={cn(
                  "absolute top-6 right-6",
                  isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <X size={20} />
              </button>
              
              <h3 className={cn(
                "text-2xl font-bold mb-6 flex items-center gap-3",
                isDarkMode ? "text-white" : "text-slate-900"
              )}>
                <Users className="text-brand-cyan" size={24} />
                Assign Content
              </h3>
              
              <form onSubmit={confirmAssign} className="space-y-4">
                <div>
                  <Label>Assign To</Label>
                  <div className="flex flex-col gap-2">
                    {['class', 'group', 'student'].map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm cursor-pointer capitalize text-slate-400">
                        <input
                          type="radio"
                          value={type}
                          checked={assignTargetType === type}
                          onChange={() => {
                            setAssignTargetType(type as any);
                            setAssignTargetName('');
                          }}
                          className="text-brand-cyan focus:ring-brand-cyan"
                        />
                        {type === 'class' ? 'Classes' : type === 'group' ? 'Study Groups' : 'Individual Students'}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Select Recipient</Label>
                  <Input
                    isDarkMode={isDarkMode}
                    type="text"
                    value={assignTargetName}
                    onChange={(e: any) => setAssignTargetName(e.target.value)}
                    placeholder={`Enter ${assignTargetType} name...`}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-black uppercase tracking-widest text-[10px] py-4 mt-4"
                >
                  Confirm Assignment
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality Check Modal */}
      <AnimatePresence>
        {showQualityCheck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4"
            onClick={() => {
              setShowQualityCheck(false);
              setQualityRating(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={cn(
                "rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl",
                isDarkMode ? "bg-[#0d1221] border border-white/10" : "bg-white border border-slate-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={cn(
                  "text-2xl font-bold font-sans tracking-tight",
                  isDarkMode ? "text-white" : "text-slate-900"
                )}>
                  Content Quality Assessment
                </h3>
                <button
                  onClick={() => {
                    setShowQualityCheck(false);
                    setQualityRating(null);
                  }}
                  className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"}
                >
                  <X size={24} />
                </button>
              </div>
              
              {isGenerating && !qualityRating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-cyan-400 mb-4" size={48} />
                  <p className={cn("text-sm font-medium", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    Analyzing CAPS alignment and teaching quality...
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Evaluating cognitive levels, resources, and inclusive strategies
                  </p>
                </div>
              ) : qualityRating ? (
                <QualityRatingDisplay rating={qualityRating} />
              ) : (
                <div className="text-center py-6 text-slate-400">
                  Failed to run quality assessment. Please try again.
                </div>
              )}
              
              <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
                <Button
                  onClick={() => {
                    setShowQualityCheck(false);
                    setQualityRating(null);
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl",
                    isDarkMode 
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  )}
                >
                  Close
                </Button>
                {qualityRating && (
                  <Button
                    onClick={() => {
                      setIsEditing(true);
                      setShowQualityCheck(false);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Improve Content
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={cn(
                "border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6",
                isDarkMode ? "bg-[#0B1122] border-white/10" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className={cn(
                  "text-xl font-bold flex items-center gap-2",
                  isDarkMode ? "text-brand-cyan" : "text-slate-900"
                )}>
                  <Share2 size={18} />
                  Share & Export
                </h3>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShareSuccess(false);
                  }}
                  className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"}
                >
                  <X />
                </button>
              </div>
              
              {/* Share Type Selector */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-wider">
                {[
                  { id: 'link', label: 'Link', icon: Link },
                  { id: 'text', label: 'Plain Text', icon: FileText },
                  { id: 'html', label: 'HTML', icon: FileCode },
                  { id: 'markdown', label: 'Markdown', icon: FileText },
                  { id: 'json', label: 'JSON', icon: FileJson },
                  { id: 'email', label: 'Email', icon: Mail }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setShareType(t.id as any);
                      setShareSuccess(false);
                    }}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                      shareType === t.id
                        ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan font-bold"
                        : isDarkMode
                        ? "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <t.icon size={16} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Share Content */}
              <div className={cn(
                "rounded-2xl p-4 border space-y-4",
                isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"
              )}>
                {shareType === 'link' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Generate a shareable link</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://eduai-companion.co.za/share/resource-${currentDocId || 'preview'}`}
                        className={cn(
                          "flex-1 rounded-xl px-3 py-2 text-xs font-mono select-all outline-none",
                          isDarkMode
                            ? "bg-slate-900 border border-white/10 text-slate-300"
                            : "bg-white border border-slate-200 text-slate-800"
                        )}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://eduai-companion.co.za/share/resource-${currentDocId || 'preview'}`);
                          setShareSuccess(true);
                          setTimeout(() => setShareSuccess(false), 2000);
                        }}
                        className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={12} />
                        {shareSuccess ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
                
                {shareType === 'text' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">Copy as plain text</p>
                    <button
                      onClick={() => {
                        const rawText = activeTab === 'teaching'
                          ? teachingResult?.content 
                          : activeTab === 'visual' 
                          ? visualResult?.content 
                          : adminResult?.content;
                        const stripped = (rawText || '').replace(/<[^>]*>/g, '');
                        navigator.clipboard.writeText(stripped);
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 2000);
                      }}
                      className={cn(
                        "w-full font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 border cursor-pointer",
                        isDarkMode
                          ? "bg-slate-800 hover:bg-slate-700 text-white border-white/10"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200"
                      )}
                    >
                      {shareSuccess ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {shareSuccess ? 'Text Copied!' : 'Copy Plain Text'}
                    </button>
                  </div>
                )}
                
                {shareType === 'email' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">Send via email</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setShareSuccess(true);
                      setTimeout(() => {
                        setShareSuccess(false);
                        setShowShareModal(false);
                      }, 1800);
                    }} className="space-y-3">
                      <div>
                        <Label>Recipient Email</Label>
                        <input
                          type="email"
                          required
                          placeholder="principal@school.za"
                          className={cn(
                            "w-full rounded-xl px-3 py-2 text-xs focus:outline-none",
                            isDarkMode
                              ? "bg-slate-900 border border-white/10 text-white focus:border-brand-cyan"
                              : "bg-white border-slate-200 text-slate-900 focus:border-brand-cyan"
                          )}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-black uppercase tracking-widest text-[10px] py-3 rounded-xl cursor-pointer"
                      >
                        {shareSuccess ? 'Email Sent!' : 'Send Email'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreviewModal}
        onClose={() => setShowPrintPreviewModal(false)}
        title={
          activeTab === 'teaching'
            ? (t_topic || t_type || 'Lesson Material')
            : activeTab === 'visual'
            ? (v_topic || v_type || 'Visual Concept')
            : 'Administrative Doc'
        }
        content={
          activeTab === 'teaching' ? (teachingResult?.content || '') :
          activeTab === 'visual' ? (visualResult?.content || '') :
          (adminResult?.content || '')
        }
        memo={activeTab === 'teaching' ? teachingResult?.memo : undefined}
        rubric={activeTab === 'teaching' ? teachingResult?.rubric : undefined}
        options={{
          subject: (activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : 'Administration') || 'General',
          grade: (activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : 'All') || 'N/A',
          contentType: (activeTab === 'teaching' ? t_type : activeTab === 'visual' ? v_type : 'Notice') || 'Document',
          title: (activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative Doc') || 'Untitled Generation'
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
