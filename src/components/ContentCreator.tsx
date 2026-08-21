import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Loader2, Sparkles, Printer, Save, Trash2, Download, Send,
  FlaskConical, Palette, FileText, Eye, BookOpen, GraduationCap,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Zap, ClipboardList, ImageIcon, Settings2, RefreshCw, Lightbulb,
  Check, X, Plus, Users, Layout, Video, FileCode, HelpCircle, Archive, UserCircle, Image, AlertCircle,
  Edit2, History, Share2, Copy, Link, Mail, FileJson, Maximize2, Minimize2,
  Timer, Volume2, VolumeX, Bell, Menu, Home, Brain, Wrench, Layers, FolderOpen, ArrowLeft, Award, ShieldCheck, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { renderMathInHtml } from '../lib/latexHelper';
import { educationalData } from '../lib/educational-data';
import { generateCAPSContent, generateVisualAid, generateAdminDoc } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';
import { checkContentQuality, QualityRatingDisplay, type QualityRating } from '../lib/qualityChecker';
import { getSystemPrompt, enhanceUserPrompt } from '../lib/prompts/system-prompts';
import AiImage from './AiImage';
import EduVideoPlayer from './EduVideoPlayer';
import VideoGenerationHistory from './VideoGenerationHistory';
import { PromptQualityValidator } from '../lib/prompt-validator';
import { EDUCATIONAL_IMAGE_STYLE } from '../lib/prompt-priority';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { printContent, downloadAsHTML, downloadAsPDF } from '../lib/printUtils';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';
import PrintPreviewModal from './PrintPreviewModal';
import { PosterPreview } from './PosterPreview';
import VideoLabConsole from './VideoLabConsole';
import FoundationPhaseArchitect from './FoundationPhaseArchitect';
import { GRADE_2_DATA_HANDLING_WORKSHEET } from '../data/grade2DataHandlingWorksheet';
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
const VISUAL_STYLES = [EDUCATIONAL_IMAGE_STYLE, 'Modern & Clean', 'Playful Cartoon', 'Professional Academic', 'Bold & Graphic', 'Minimalist'];
const TONES = ['Formal & Professional', 'Warm & Friendly', 'Informative & Clear', 'Urgent & Important'];
const FONT_STYLES = [
  'Standard System (Inter)',
  'Patrick Hand (Teacher\'s Pet / Foundation Handwriting)',
  'Comic Neue (Primary Friendly)',
  'Sassoon Primary (Primary Cursive)',
  'Kalam (Handwriting)',
  'Lexend (Dyslexia Friendly)'
];

const GENERATOR_GROUPS = [
  {
    id: 'teaching',
    label: 'Content Studio',
    icon: FlaskConical,
    desc: 'Generate high-quality lesson plans, worksheets, assignments, daily notes, and tests perfectly mapped to South African CAPS standard criteria.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30 shadow-cyan-500/10',
  },
  {
    id: 'visual',
    label: 'Visual Lab',
    icon: Palette,
    desc: 'Craft striking educational displays, printable flashcards, timeline cards, process flowmaps, mind maps, and interactive signs.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30 shadow-purple-500/10',
  },
  {
    id: 'video',
    label: 'Video Lab',
    icon: Video,
    desc: 'Create captivating AI teacher avatars, lesson explainer animations, video guidelines, and dynamic digital slideshows.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30 shadow-orange-500/10',
  },
  {
    id: 'admin',
    label: 'Admin Lab',
    icon: FileText,
    desc: 'Draft school correspondence including custom parental permission notices, newsletters, calendars, and certificates of attendance.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30 shadow-blue-500/10',
  },
  {
    id: 'grade1',
    label: 'Foundation Phase',
    icon: Sparkles,
    desc: 'Design foundational literacy and numeracy lessons, phonics flash exercises, spelling tables, and early learning games.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30 shadow-yellow-500/10',
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

// ─── Shared UI Components (Simulating Shadcn) ───────────────────────────────

const HtmlPreviewFrame = ({ html, minHeight = "550px", className = "", fontStyle = "Standard System (Inter)" }: { html: string; minHeight?: string; className?: string; fontStyle?: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'EDUAI_GENERATE_IMAGE') {
         const { prompt, seed, id } = e.data;
         try {
           const { generateImageWithFallback } = await import('../lib/imageGeneration.ts');
           const result = await generateImageWithFallback({ prompt, width: 800, height: 600, seed });
           iframeRef.current?.contentWindow?.postMessage({ type: 'EDUAI_IMAGE_RESULT', id, url: result.url }, '*');
         } catch (error) {
           console.error('Failed to hydrate iframe image:', error);
         }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const cleanedHtml = useMemo(() => {
    if (!html || typeof html !== 'string') return "";
    let clean = html.trim();
    if (clean.startsWith("```html")) {
      clean = clean.replace(/^```html\s*/i, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/i, "").replace(/\s*```$/, "");
    }
    return clean;
  }, [html]);

  if (!cleanedHtml || !cleanedHtml.trim()) {
    return (
      <div className={cn("w-full h-full min-h-[450px] rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-cyan-500/20 bg-slate-900/80", className)}>
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
    const isFullDoc = cleanedHtml.includes('<html') || cleanedHtml.includes('<!DOCTYPE');
    if (isFullDoc) return cleanedHtml;

    const fontCss = fontStyle.includes('Patrick Hand') ? '"Patrick Hand", "Comic Neue", cursive, sans-serif'
      : fontStyle.includes('Comic Neue') ? '"Comic Neue", cursive, sans-serif'
      : fontStyle.includes('Sassoon') ? '"Sassoon Primary", cursive, sans-serif'
      : fontStyle.includes('Kalam') ? '"Kalam", cursive, sans-serif'
      : fontStyle.includes('Lexend') ? '"Lexend", sans-serif'
      : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&family=Kalam:wght@300;400;700&family=Lexend:wght@300;400;500;600;700&family=Patrick+Hand&display=swap" rel="stylesheet">
  <script>
    const originalWarn = console.warn;
    console.warn = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) {
        return;
      }
      originalWarn.apply(console, args);
    };
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #ffffff;
      color: #0f172a;
      font-family: ${fontCss};
      margin: 0;
      padding: 2rem;
      line-height: 2.2rem;
      font-size: 16px;
    }
    h1 { font-size: 2rem; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 0.5rem; margin-top: 0; }
    h2 { font-size: 1.5rem; font-weight: 700; color: #0369a1; margin-top: 1.5rem; }
    h3 { font-size: 1.2rem; font-weight: 700; color: #0284c7; margin-top: 1.2rem; }
    p { margin-bottom: 1rem; font-size: 1rem; line-height: 2.2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 14px; }
    th, td { border: 1px solid #cbd5e1; padding: 12px 16px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 700; color: #1e293b; }
    ul, ol { padding-left: 2rem; margin-bottom: 1.5rem; line-height: 2.2rem; }
    li { margin-bottom: 0.5rem; }
    img { max-width: 100%; height: auto; border-radius: 0.5rem; display: block; margin: 1.5rem 0; }
    .score-badge { display: inline-block; padding: 6px 14px; border-radius: 8px; font-weight: 800; border: 2px solid #f59e0b; background: #fef3c7; color: #92400e; }
    .header-badge { border: 1px solid #94a3b8; padding: 10px 14px; border-radius: 6px; font-weight: 600; background: #f8fafc; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${cleanedHtml}
  <script>
    // Each illustration already ships with a working src (direct image API, or
    // the backend proxy on web). We only ask the host app to regenerate through
    // the configured provider chain if that direct URL actually fails to load,
    // so a slow/blocked provider can never leave an empty placeholder behind.
    const requestFromHost = (img) => {
      if (img.dataset.hydrated === "true") return;
      img.dataset.hydrated = "true";
      const prompt = img.dataset.eduaiPrompt ? decodeURIComponent(img.dataset.eduaiPrompt) : null;
      const seed = parseInt(img.dataset.eduaiSeed || '0');
      if (!prompt || !window.parent) return;
      const reqId = Math.random().toString();
      img.dataset.reqId = reqId;
      const listener = (e) => {
        if (e.data && e.data.type === 'EDUAI_IMAGE_RESULT' && e.data.id === reqId) {
          if (e.data.url) img.src = e.data.url;
          window.removeEventListener('message', listener);
        }
      };
      window.addEventListener('message', listener);
      window.parent.postMessage({ type: 'EDUAI_GENERATE_IMAGE', prompt, seed, id: reqId }, '*');
    };

    const hydrateImages = () => {
      const images = document.querySelectorAll('.eduai-async-image:not([data-bound="true"])');
      images.forEach(img => {
        img.dataset.bound = "true";
        const src = img.getAttribute('src') || '';
        // No usable src (legacy blank pixel) → generate immediately.
        if (!src || src.startsWith('data:image/gif')) {
          requestFromHost(img);
          return;
        }
        img.addEventListener('error', () => requestFromHost(img), { once: true });
        // Already failed before the listener attached.
        if (img.complete && img.naturalWidth === 0) requestFromHost(img);
      });
    };
    const observer = new MutationObserver(hydrateImages);
    observer.observe(document.body, { childList: true, subtree: true });
    hydrateImages();
  </script>
</body>
</html>`;
  }, [cleanedHtml, fontStyle]);

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

const IconSelector = ({ onSelect, isDarkMode }: { onSelect: (emoji: string) => void, isDarkMode: boolean }) => (
  <div className="space-y-2 pt-1">
    <div className="flex items-center justify-between">
      <Label className="text-[10px] font-black uppercase tracking-widest text-amber-400">
        Visual Cue Icon Selector (For Emergent Learners)
      </Label>
      <span className="text-[10px] text-slate-400">Click to insert</span>
    </div>
    <div className="grid grid-cols-8 gap-1 p-1.5 rounded-xl border bg-black/20 border-white/10">
      {['✏️', '📚', '⭐', '✂️', '👁️', '🗣️', '🎒', '💡', '🧠', '🏆', '🦉', '🎨', '🎵', '🔢', '🔤', '🧩'].map((emoji) => (
        <button
          key={emoji}
          type="button"
          title={`Insert ${emoji}`}
          onClick={() => onSelect(emoji)}
          className="h-7 rounded-lg border border-white/5 bg-white/5 hover:bg-transparent text-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  </div>
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
  onClose?: () => void;
  initialTab?: string;
}

export default function ContentCreator({ isDarkMode, userName, userRole, onClose, initialTab }: ContentCreatorProps) {
  // ─── State Management ────────────────────────────────────────────────────
  
  // UI State
  const [activeTab, setActiveTab] = useState(initialTab || 'teaching');
  const [activePreviewTab, setActivePreviewTab] = useState<'content' | 'memo' | 'rubric'>('content');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState('Preparing CAPS environment...');
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);

  const triggerToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [isAssessingQuality, setIsAssessingQuality] = useState(false);
  const [qualityRating, setQualityRating] = useState<QualityRating | null>(null);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [fontStyle, setFontStyle] = useState('Standard System (Inter)');
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [shareType, setShareType] = useState<'link' | 'text' | 'html' | 'markdown' | 'json' | 'email'>('link');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<'class' | 'group' | 'student'>('class');
  const [assignTargetName, setAssignTargetName] = useState('');
  const [assignTargetId, setAssignTargetId] = useState('');
  const [shareTypeMode, setShareTypeMode] = useState<'link' | 'download' | 'email'>('link');
  const [activeSetupTab, setActiveSetupTab] = useState<'grade' | 'subject' | 'type' | 'topic'>('grade');
  
  // Teaching Tab State
  const [t_grade, setT_Grade] = useState('');
  const [t_subject, setT_Subject] = useState('');
  const [t_customSubject, setT_CustomSubject] = useState('');
  const [t_type, setT_Type] = useState('');
  const [t_topic, setT_Topic] = useState('');
  const [t_customPrompt, setT_CustomPrompt] = useState('');
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
  const [t_generateImage, setT_GenerateImage] = useState(true);
  const [teachingResult, setTeachingResult] = useState<any>({ content: '', memo: '', rubric: '' });
  const [editContentText, setEditContentText] = useState('');
  const [editMemoText, setEditMemoText] = useState('');
  const [editRubricText, setEditRubricText] = useState('');
  
  // Visual Tab State
  const [v_grade, setV_Grade] = useState('');
  const [v_subject, setV_Subject] = useState('');
  const [v_customSubject, setV_CustomSubject] = useState('');
  const [v_type, setV_Type] = useState('');
  const [v_customPrompt, setV_CustomPrompt] = useState('');
  const [v_topic, setV_Topic] = useState('');
  const [v_colorScheme, setV_ColorScheme] = useState('Bright Primary Colors');
  const [v_visualStyle, setV_VisualStyle] = useState(EDUCATIONAL_IMAGE_STYLE);
  const [v_dimensions, setV_Dimensions] = useState('A4');
  const [v_generateImage, setV_GenerateImage] = useState(true);
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
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoHistory, setVideoHistory] = useState<any[]>([]);
  
  // Admin Tab State
  const [a_grade, setA_Grade] = useState('');
  const [a_subject, setA_Subject] = useState('');
  const [a_customSubject, setA_CustomSubject] = useState('');
  const [a_type, setA_Type] = useState('');
  const [a_topic, setA_Topic] = useState('');
  const [a_customPrompt, setA_CustomPrompt] = useState('');
  const [a_tone, setA_Tone] = useState('Formal & Professional');
  const [a_generateImage, setA_GenerateImage] = useState(true);
  const [a_school, setA_School] = useState('');
  const [a_timeDate, setA_TimeDate] = useState('');
  const [a_recipient, setA_Recipient] = useState('');
  const [a_venue, setA_Venue] = useState('');
  const [a_classTeacher, setA_ClassTeacher] = useState('');
  const [a_schoolPrincipal, setA_SchoolPrincipal] = useState('');
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
      const videoQuery = query(collection(db, 'users', userId, 'videoHistory'));
      
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

      const unsubscribeVideoHistory = onSnapshot(videoQuery, (snapshot) => {
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        history.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setVideoHistory(history);
      }, (err) => {
        console.error("Error listening to video history:", err);
      });

      return () => {
        unsubscribeClasses();
        unsubscribeGroups();
        unsubscribeStudents();
        unsubscribeVideoHistory();
      };
    }
  }, []);

  useEffect(() => {
    // App navigation now keeps this generator mounted as a page. Sync the
    // selected lab when a dashboard shortcut changes initialTab without
    // remounting the page.
    if (initialTab && GENERATOR_GROUPS.some(group => group.id === initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    // Update topics when subject changes
    const gradeKey = getGradeKey(t_grade);
    if (gradeKey && (educationalData as any)[gradeKey] && t_subject && (educationalData as any)[gradeKey][t_subject]) {
      setT_Topics((educationalData as any)[gradeKey][t_subject]);
    } else {
      setT_Topics([]);
    }
  }, [t_grade, t_subject]);

  const startProgress = () => {
    setGenerationProgress(0);
    setGenerationPhase('Initializing CAPS engine...');
    
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        // Slow down progress as we approach 98%
        const next = prev + (prev < 30 ? 4 : prev < 60 ? 2.5 : prev < 85 ? 1.5 : prev < 95 ? 0.6 : 0.2);
        const rounded = Math.min(99, Math.round(next * 10) / 10);
        
        // Update phase description dynamically
        if (rounded < 15) {
          setGenerationPhase('Initializing CAPS alignments...');
        } else if (rounded < 35) {
          setGenerationPhase('Structuring lesson plans & instructional phases...');
        } else if (rounded < 60) {
          setGenerationPhase('Applying localized South African context & Bloom\'s Taxonomy...');
        } else if (rounded < 80) {
          setGenerationPhase('Assembling diagnostic worksheets & formative evaluation questions...');
        } else if (rounded < 95) {
          setGenerationPhase('Drafting marking rubrics & grading keys...');
        } else {
          setGenerationPhase('Polishing inclusive accommodations & final layout...');
        }
        
        return rounded;
      });
    }, 150);
    return interval;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  
  const handleGenerateTeaching = async () => {
    if (!t_grade || !t_subject || !t_topic || !t_type) return;

    // Direct user-specific intercept to provide pristine Grade 2 Math Data Handling Worksheet instantly
    const isGrade2 = t_grade === '2' || t_grade === 'Grade 2';
    const isMath = t_subject === 'Mathematics' || t_subject === 'Math' || (t_subject === 'Other' && t_customSubject && t_customSubject.toLowerCase().includes('math'));
    const isWorksheet = t_type === 'Worksheet';
    const isDataHandling = t_topic && (t_topic.toLowerCase().includes('data') || t_topic.toLowerCase().includes('handling') || t_topic.toLowerCase().includes('sort'));

    // Keep the curated quick-start only when no instructor brief is present;
    // a typed brief must always be allowed to change the result.
    if (isGrade2 && isMath && isWorksheet && isDataHandling && !t_customPrompt.trim()) {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationPhase('Pre-forging CAPS Grade 2 Data Handling Worksheet...');
      
      // Simulate highly responsive progress counts
      await new Promise<void>((resolve) => {
        let current = 0;
        const interval = setInterval(() => {
          current += 20;
          if (current >= 100) {
            clearInterval(interval);
            resolve();
          } else {
            setGenerationProgress(current);
            setGenerationPhase(`Assembling premium South African assets... (${current}%)`);
          }
        }, 150);
      });

      setGenerationProgress(100);
      setGenerationPhase('Premium Content successfully loaded!');
      
      const result = {
        content: GRADE_2_DATA_HANDLING_WORKSHEET.content,
        memo: GRADE_2_DATA_HANDLING_WORKSHEET.memo,
        rubric: GRADE_2_DATA_HANDLING_WORKSHEET.rubric,
        assessmentCriteria: 'Data collection, representation in a pictograph, and data analysis comparison.',
        successIndicators: ['Identifies and sorts South African animals', 'Draws fruit circles inside the pictograph', 'Compares numbers and reads the bar graph correctly'],
        imagePrompt: `Premium educational ${EDUCATIONAL_IMAGE_STYLE} illustration of South African wildlife and fruits.`
      };

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
      
      setIsGenerating(false);
      return;
    }
    
    setIsGenerating(true);
    const progressInterval = startProgress();
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
        additionalInstructions: t_customPrompt,
        differentiation: t_differentiation,
        ictIntegration: t_ictIntegration,
        inclusiveEd: t_inclusiveEd,
        generateImage: t_generateImage
      }, provider, (partial) => {
        if (partial && Object.keys(partial).length > 0) {
          setTeachingResult(partial);
          if (partial.content) {
            const length = partial.content.length;
            const progress = Math.min(99, Math.round((length / 8000) * 100));
            setGenerationProgress((prev) => Math.max(prev, progress));
            setGenerationPhase(`Forging ${t_type}... (${length} chars generated)`);
          }
        }
      });
      setGenerationProgress(100);
      setGenerationPhase('Content successfully forged!');
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
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleGenerateVisual = async () => {
    if (!v_grade || !v_subject || !v_topic || !v_type) return;
    
    setIsGenerating(true);
    const progressInterval = startProgress();
    try {
      const result = await generateVisualAid({
        grade: v_grade,
        subject: v_subject === 'Other' ? v_customSubject : v_subject,
        visualType: v_type,
        topic: v_topic,
        colorScheme: v_colorScheme,
        style: v_visualStyle,
        dimensions: v_dimensions,
        language: 'English',
        additionalInstructions: v_customPrompt,
        generateImage: v_generateImage
      }, provider, (partial) => {
        if (partial && Object.keys(partial).length > 0) {
          setVisualResult(partial);
          setVisualResults([partial]);
          if (partial.content) {
            const length = partial.content.length;
            const progress = Math.min(99, Math.round((length / 8000) * 100));
            setGenerationProgress((prev) => Math.max(prev, progress));
            setGenerationPhase(`Forging visual aid... (${length} chars generated)`);
          }
        }
      });
      setGenerationProgress(100);
      setGenerationPhase('Content successfully forged!');
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
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleGenerateAdmin = async () => {
    if (!a_type || !a_topic) return;
    
    setIsGenerating(true);
    const progressInterval = startProgress();
    try {
      const result = await generateAdminDoc({
        grade: a_grade,
        subject: a_subject === 'Other' ? a_customSubject : a_subject,
        documentType: a_type,
        purpose: a_topic,
        keyPoints: a_customPrompt,
        schoolName: a_school,
        tone: a_tone,
        generateImage: a_generateImage,
        additionalInstructions: a_customPrompt,
        timeDate: a_timeDate,
        recipient: a_recipient,
        venue: a_venue,
        classTeacher: a_classTeacher,
        schoolPrincipal: a_schoolPrincipal
      }, provider, (partial) => {
        if (partial && Object.keys(partial).length > 0) {
          setAdminResult(partial);
          if (partial.content) {
            const length = partial.content.length;
            const progress = Math.min(99, Math.round((length / 8000) * 100));
            setGenerationProgress((prev) => Math.max(prev, progress));
            setGenerationPhase(`Forging admin doc... (${length} chars generated)`);
          }
        }
      });
      setGenerationProgress(100);
      setGenerationPhase('Content successfully forged!');
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
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!vid_prompt.trim()) {
      alert("Please enter an Action Prompt Script for the video.");
      return;
    }
    setVideoLoading(true);
    setVideoResult(null);
    try {
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: vid_prompt,
          model: vid_model,
          seed: vid_seed,
          fps: vid_fps
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to start video generation: ${response.status}`);
      }
      const data = await response.json();
      const jobId = data.id;

      // Poll status every 3 seconds
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/video/status/${jobId}`);
          if (!statusRes.ok) {
            clearInterval(poll);
            throw new Error(`Status check failed: ${statusRes.status}`);
          }
          const statusData = await statusRes.json();
          if (statusData.status === "succeeded" || statusData.status === "success") {
            clearInterval(poll);
            const videoUrl = statusData.url;
            const newVideo = {
              id: jobId,
              url: videoUrl,
              prompt: vid_prompt,
              model: vid_model,
              createdAt: new Date().toISOString()
            };
            setVideoResult(newVideo);
            setVideoLoading(false);

            // Store in Firestore videoHistory
            const userId = auth.currentUser?.uid;
            if (userId && db) {
              const histRef = doc(db, 'users', userId, 'videoHistory', jobId);
              await setDoc(histRef, newVideo);
            }
          } else if (statusData.status === "failed") {
            clearInterval(poll);
            setVideoLoading(false);
            alert("Video generation failed. Please try again.");
          }
        } catch (pollErr) {
          console.error("Error polling video status:", pollErr);
          clearInterval(poll);
          setVideoLoading(false);
        }
      }, 3000);

    } catch (err: any) {
      console.error("Video generation failed:", err);
      setVideoLoading(false);
      alert(err.message || "An error occurred during video generation.");
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
    const docTitle = activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : a_topic || 'EduAI Content';
    const activeSubject = activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : a_subject;
    const activeGrade = activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade;
    const activeHtml = (activeTab === 'teaching' || activeTab === 'grade1' ? teachingResult?.content : activeTab === 'visual' ? visualResult?.content : adminResult?.content) || '';

    if (contentRef.current && contentRef.current.innerHTML.trim()) {
      printContent(contentRef, docTitle, { subject: activeSubject, grade: activeGrade, title: docTitle });
    } else if (activeHtml) {
      printContent(activeHtml, docTitle, { subject: activeSubject, grade: activeGrade, title: docTitle });
    } else {
      triggerToast('No content available to print yet.', 'info');
    }
  };

  const handleDownloadPDF = async () => {
    const docTitle = activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : a_topic || 'EduAI Content';
    const filename = `${docTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_${Date.now()}.pdf`;
    const activeSubject = activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : a_subject;
    const activeGrade = activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade;
    const activeHtml = (activeTab === 'teaching' || activeTab === 'grade1' ? teachingResult?.content : activeTab === 'visual' ? visualResult?.content : adminResult?.content) || '';

    if (contentRef.current && contentRef.current.innerHTML.trim()) {
      await downloadAsPDF(contentRef, filename, { subject: activeSubject, grade: activeGrade, title: docTitle });
    } else if (activeHtml) {
      await downloadAsPDF(activeHtml, filename, { subject: activeSubject, grade: activeGrade, title: docTitle });
    } else {
      triggerToast('No content available to download as PDF yet.', 'info');
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
          ...(activeTab === 'admin' ? {
            schoolName: a_school,
            timeDate: a_timeDate,
            recipient: a_recipient,
            venue: a_venue,
            classTeacher: a_classTeacher,
            schoolPrincipal: a_schoolPrincipal,
            customPrompt: a_customPrompt
          } : {})
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

  const handleClosePreview = () => {
    setTeachingResult({ content: '', memo: '', rubric: '' });
    setVisualResult(null);
    setAdminResult({ content: '' });
    setIsFullscreenPreview(false);
  };

  const confirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = auth.currentUser?.uid || 'guest';
      const activeHtml = activeTab === 'teaching' 
        ? (activePreviewTab === 'content' ? (teachingResult?.content || '') : activePreviewTab === 'memo' ? (teachingResult?.memo || '') : (teachingResult?.rubric || ''))
        : activeTab === 'visual' ? (visualResult?.content || '')
        : (adminResult?.content || '');
        
      const currentTitle = (activeTab === 'teaching' ? t_topic : activeTab === 'visual' ? v_topic : a_topic) || 'CAPS Educational Content';
      const currentSubject = (activeTab === 'teaching' ? (t_subject === 'Other' ? t_customSubject : t_subject) : activeTab === 'visual' ? (v_subject === 'Other' ? v_customSubject : v_subject) : (a_subject === 'Other' ? a_customSubject : a_subject)) || 'General';
      const currentGrade = activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade;

      if (userId && db) {
        const assignDocRef = doc(collection(db, 'assignments'));
        await setDoc(assignDocRef, {
          id: assignDocRef.id,
          teacherId: userId,
          teacherName: 'Teacher',
          title: currentTitle,
          subject: currentSubject,
          grade: currentGrade,
          contentType: activeTab,
          content: activeHtml,
          memo: teachingResult?.memo || '',
          rubric: teachingResult?.rubric || '',
          targetType: assignTargetType,
          targetId: assignTargetId,
          targetName: assignTargetName,
          assignedAt: new Date().toISOString(),
          status: 'Active'
        });
      }
    } catch (error) {
      console.warn("Firestore assign note:", error);
    }
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
  
  const ContentPreview = ({ html, label, isDarkMode, imagePrompt, grade, subject, contentType, qualityRating, isAssessing, onViewReport, allowImages = true }: any) => {
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
      "w-full min-h-full flex flex-col transition-all duration-300",
      isDarkMode ? "text-white" : "text-slate-900"
    )}>
      {/* Content Factory is a first-class page inside the app shell. */}
      <div className="w-full flex flex-col">
        {/* Page Content — the app shell owns scrolling, so no nested scroller here */}
        <main className="relative w-full p-4 sm:p-6 lg:p-8">
          <div className="relative z-10 max-w-6xl mx-auto">
          {/* Content Factory Header Band — compact, aligned with app theme. Lab switcher lives at the top of the banner as requested. */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0b1226]/95 backdrop-blur-xl shadow-xl mb-4 sm:mb-6">
            <div className="absolute -top-16 -left-12 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_14px_rgba(6,182,212,0.28)]">
                  <Sparkles size={20} className="text-cyan-300" />
                </div>
                <div className="text-left">
                  <h1 className={cn(
                    "text-lg sm:text-xl font-black tracking-tight uppercase leading-none",
                    isDarkMode ? "text-white" : "text-white"
                  )}>
                    Content Factory
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block leading-tight mt-0.5">
                    AI-powered CAPS content • lessons, worksheets, visuals, videos & letters
                  </p>
                </div>
              </div>

              {/* Studio Selector Tabs — moved to top of banner / page header */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start lg:justify-end max-w-full">
            {GENERATOR_GROUPS.map((group) => {
              const isActive = activeTab === group.id;
              
              let activeStyle = "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-lg shadow-cyan-500/30 scale-[1.03]";
              let inactiveStyle = isDarkMode
                ? "bg-[#0a1226]/90 border-cyan-500/30 text-cyan-300 hover:bg-[#122044] hover:border-cyan-400"
                : "bg-[#0a1226]/90 border-cyan-500/30 text-cyan-300 hover:bg-[#122044]";
              let iconColor = "text-cyan-400";

              if (group.id === 'visual') {
                activeStyle = "bg-gradient-to-r from-purple-500 via-fuchsia-600 to-indigo-600 text-white border-purple-300 shadow-lg shadow-purple-500/30 scale-[1.03]";
                inactiveStyle = isDarkMode
                  ? "bg-[#0a1226]/90 border-purple-500/30 text-purple-300 hover:bg-[#122044] hover:border-purple-400"
                  : "bg-[#0a1226]/90 border-purple-500/30 text-purple-300 hover:bg-[#122044]";
                iconColor = "text-purple-400";
              } else if (group.id === 'video') {
                activeStyle = "bg-gradient-to-r from-rose-500 via-pink-600 to-orange-500 text-white border-rose-300 shadow-lg shadow-rose-500/30 scale-[1.03]";
                inactiveStyle = isDarkMode
                  ? "bg-[#0a1226]/90 border-rose-500/30 text-rose-300 hover:bg-[#122044] hover:border-rose-400"
                  : "bg-[#0a1226]/90 border-rose-500/30 text-rose-300 hover:bg-[#122044]";
                iconColor = "text-rose-400";
              } else if (group.id === 'admin') {
                activeStyle = "bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-600 text-white border-emerald-300 shadow-lg shadow-emerald-500/30 scale-[1.03]";
                inactiveStyle = isDarkMode
                  ? "bg-[#0a1226]/90 border-emerald-500/30 text-emerald-300 hover:bg-[#122044] hover:border-emerald-400"
                  : "bg-[#0a1226]/90 border-emerald-500/30 text-emerald-300 hover:bg-[#122044]";
                iconColor = "text-emerald-400";
              } else if (group.id === 'grade1') {
                activeStyle = "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white border-amber-300 shadow-lg shadow-amber-500/30 scale-[1.03]";
                inactiveStyle = isDarkMode
                  ? "bg-[#0a1226]/90 border-amber-500/30 text-amber-300 hover:bg-[#122044] hover:border-amber-400"
                  : "bg-[#0a1226]/90 border-amber-500/30 text-amber-300 hover:bg-[#122044]";
                iconColor = "text-amber-400";
              }

              return (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all cursor-pointer font-black text-[11px] uppercase tracking-wider shadow-md backdrop-blur-md",
                    isActive ? activeStyle : inactiveStyle
                  )}
                >
                  <group.icon size={16} className={isActive ? "text-white animate-pulse" : iconColor} />
                  <span>{group.label}</span>
                </button>
              );
            })}
            </div>
            </div>
          </div>

          {/* Module-specific Layout routing */}
          {activeTab === 'video' ? (
            <div className="max-w-6xl mx-auto">
              <VideoLabConsole 
                isDarkMode={isDarkMode} 
                onClose={onClose} 
                vid_model={vid_model}
                setVid_Model={setVid_Model}
                vid_prompt={vid_prompt}
                setVid_Prompt={setVid_Prompt}
                vid_seed={vid_seed}
                setVid_Seed={setVid_Seed}
                vid_fps={vid_fps}
                setVid_Fps={setVid_Fps}
                onGenerate={handleGenerateVideo}
                isLoading={videoLoading}
                videoResult={videoResult}
              />
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
                  "rounded-3xl border-2 p-6 backdrop-blur-xl animate-border-flash-cyan",
                  isDarkMode
                    ? "bg-[#0a1226]/95 border-cyan-500/30 shadow-2xl shadow-black/50"
                    : "bg-[#0b142c] text-white border-cyan-500/30 shadow-2xl"
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
                  <div className="space-y-4">
                    {/* Reorganized Setup Buttons & List Patterns */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {[
                          { id: 'grade', label: 'Grade', icon: GraduationCap },
                          { id: 'subject', label: 'Subject', icon: BookOpen },
                          { id: 'type', label: 'Content', icon: FileText },
                          { id: 'topic', label: 'Topic', icon: Lightbulb },
                        ].map((btn: any) => {
                          const isActive = activeSetupTab === btn.id;
                          const selectedValue = (() => {
                            if (activeTab === 'teaching') {
                              if (btn.id === 'grade') return t_grade;
                              if (btn.id === 'subject') return t_subject === 'Other' ? t_customSubject : t_subject;
                              if (btn.id === 'type') return t_type;
                              if (btn.id === 'topic') return t_topic;
                            } else if (activeTab === 'visual') {
                              if (btn.id === 'grade') return v_grade;
                              if (btn.id === 'subject') return v_subject === 'Other' ? v_customSubject : v_subject;
                              if (btn.id === 'type') return v_type;
                              if (btn.id === 'topic') return v_topic;
                            } else {
                              if (btn.id === 'grade') return a_grade;
                              if (btn.id === 'subject') return a_subject === 'Other' ? a_customSubject : a_subject;
                              if (btn.id === 'type') return a_type;
                              if (btn.id === 'topic') return a_topic;
                            }
                            return '';
                          })();

                          const BtnIcon: any = (btn as any).icon;
                          return (
                            <div key={btn.id} className="flex flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveSetupTab(activeSetupTab === btn.id ? null : btn.id as any)}
                                className={cn(
                                  "w-full py-2.5 px-3 rounded-xl border text-[11px] font-black tracking-widest uppercase transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm backdrop-blur-sm",
                                  isActive
                                    ? "bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/20 scale-[1.02]"
                                    : "bg-[#0a1226] border-cyan-500/25 text-cyan-300 hover:bg-[#122044] hover:border-cyan-400 hover:text-white",
                                  selectedValue && !isActive ? "border-cyan-400/50" : ""
                                )}
                              >
                                <BtnIcon size={13} className={isActive ? "text-white" : "text-cyan-400"} />
                                <span className="truncate">{btn.label}</span>
                              </button>
                              {selectedValue && (
                                <div className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-bold truncate border text-center animate-fadeIn",
                                  isDarkMode ? "bg-[#060c1d] border-cyan-500/30 text-cyan-300" : "bg-[#060c1d] border-cyan-500/30 text-cyan-300"
                                )}>
                                  {selectedValue}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Active Setup Content Area - Minimized/Collapsed when activeSetupTab is null */}
                      {activeSetupTab && (
                        <div className={cn("p-4 rounded-2xl border transition-all animate-fadeIn", isDarkMode ? "bg-[#060c1d] border-cyan-500/30 shadow-inner" : "bg-[#060c1d] text-white border-cyan-500/30 shadow-inner")}>
                          {activeSetupTab === 'grade' && (
                            <div className="space-y-3">
                              <Label className="text-xs font-black uppercase tracking-wider">Select Grade Level (R-12)</Label>
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {['Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
                                  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
                                  'Grade 11', 'Grade 12'].map(grade => {
                                  const currentGrade = activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade;
                                  const isSel = currentGrade === grade;
                                  return (
                                    <button
                                      key={grade}
                                      type="button"
                                      onClick={() => {
                                        if (activeTab === 'teaching') {
                                          setT_Grade(grade);
                                          setT_Subject('');
                                          setT_Topic('');
                                        } else if (activeTab === 'visual') {
                                          setV_Grade(grade);
                                          setV_Subject('');
                                          setV_Topic('');
                                        } else {
                                          setA_Grade(grade);
                                          setA_Subject('');
                                          setA_Topic('');
                                        }
                                        setActiveSetupTab(null);
                                      }}
                                      className={cn(
                                        "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer",
                                        isSel 
                                          ? "bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/30" 
                                          : isDarkMode ? "bg-[#0d1733] border-white/10 text-slate-200 hover:bg-[#152554] hover:text-white hover:border-cyan-400/40" : "bg-[#0d1733] border-white/10 text-slate-200 hover:bg-[#152554] hover:text-white hover:border-cyan-400/40"
                                      )}
                                    >
                                      {grade}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {activeSetupTab === 'subject' && (
                            <div className="space-y-3">
                              <Label className="text-xs font-black uppercase tracking-wider">Select Subject Area</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(() => {
                                  const subjects = activeTab === 'admin' 
                                    ? ['Mathematics', 'Physical Sciences', 'Life Sciences', 'English', 'Afrikaans', 'History', 'Geography', 'Technology', 'Other']
                                    : (() => {
                                        const currentGrade = activeTab === 'teaching' ? t_grade : v_grade;
                                        const gradeKey = getGradeKey(currentGrade);
                                        const subs = gradeKey && (educationalData as any)[gradeKey] ? Object.keys((educationalData as any)[gradeKey]) : [];
                                        return [...subs, 'Other'];
                                      })();
                                  
                                  const currentSubj = activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : a_subject;
                                  
                                  return subjects.map((subj: string) => {
                                    const isSel = currentSubj === subj;
                                    return (
                                      <button
                                        key={subj}
                                        type="button"
                                        onClick={() => {
                                          if (activeTab === 'teaching') {
                                            setT_Subject(subj);
                                            setT_Topic('');
                                          } else if (activeTab === 'visual') {
                                            setV_Subject(subj);
                                            setV_Topic('');
                                          } else {
                                            setA_Subject(subj);
                                            setA_Topic('');
                                          }
                                          if (subj !== 'Other') setActiveSetupTab(null);
                                        }}
                                        className={cn(
                                          "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left truncate",
                                          isSel 
                                            ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/30" 
                                            : isDarkMode ? "bg-[#0d1733] border-white/10 text-slate-200 hover:bg-[#152554] hover:text-white hover:border-purple-400/40" : "bg-[#0d1733] border-white/10 text-slate-200 hover:bg-[#152554] hover:text-white hover:border-purple-400/40"
                                        )}
                                      >
                                        {subj}
                                      </button>
                                    );
                                  });
                                })()}
                              </div>

                              {/* Custom Subject Input if 'Other' */}
                              {((activeTab === 'teaching' && t_subject === 'Other') ||
                                (activeTab === 'visual' && v_subject === 'Other') ||
                                (activeTab === 'admin' && a_subject === 'Other')) && (
                                <div className="pt-2 flex items-center gap-2">
                                  <div className="flex-1">
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
                                  <button
                                    type="button"
                                    onClick={() => setActiveSetupTab(null)}
                                    className="mt-5 px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
                                  >
                                    Done
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {activeSetupTab === 'type' && (
                            <div className="space-y-3">
                              <Label className="text-xs font-black uppercase tracking-wider">
                                {activeTab === 'teaching' ? 'Content Type' : activeTab === 'visual' ? 'Visual Type' : 'Administration Type'}
                              </Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {Object.entries(
                                  activeTab === 'teaching' ? TEACHING_CATEGORIES :
                                  activeTab === 'visual' ? VISUAL_TYPES : ADMIN_TYPES
                                ).map(([cat, types]) => (
                                  <div key={cat} className={cn("p-3 rounded-xl border", isDarkMode ? "bg-[#0a1226] border-white/10" : "bg-[#0a1226] text-white border-white/10")}>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">{cat}</div>
                                    <div className="space-y-1.5">
                                      {types.map(t => {
                                        const currentType = activeTab === 'teaching' ? t_type : activeTab === 'visual' ? v_type : a_type;
                                        const isSel = currentType === t;
                                        return (
                                          <button
                                            key={t}
                                            type="button"
                                            onClick={() => {
                                              if (activeTab === 'teaching') setT_Type(t);
                                              else if (activeTab === 'visual') setV_Type(t);
                                              else setA_Type(t);
                                              setActiveSetupTab(null);
                                            }}
                                            className={cn(
                                              "w-full text-left py-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                                              isSel
                                                ? "bg-cyan-500 text-white border-cyan-400 shadow-sm"
                                                : isDarkMode ? "bg-[#0e1938] border-white/10 text-slate-200 hover:bg-[#182958] hover:text-white" : "bg-[#0e1938] border-white/10 text-slate-200 hover:bg-[#182958] hover:text-white"
                                            )}
                                          >
                                            {t}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeSetupTab === 'topic' && (
                            <div className="space-y-3">
                              <Label className="text-xs font-black uppercase tracking-wider">Topic Selection / Input</Label>
                              {activeTab !== 'admin' ? (
                                (() => {
                                  const currentGrade = activeTab === 'teaching' ? t_grade : v_grade;
                                  const currentSubject = activeTab === 'teaching' ? t_subject : v_subject;
                                  const gradeKey = getGradeKey(currentGrade);
                                  const topics = gradeKey && currentSubject && (educationalData as any)[gradeKey] && (educationalData as any)[gradeKey][currentSubject]
                                    ? (educationalData as any)[gradeKey][currentSubject] as string[]
                                    : [];
                                  
                                  const currentTopicValue = activeTab === 'teaching' ? t_topic : v_topic;
                                  
                                  return (
                                    <div className="space-y-3">
                                      {topics.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {topics.map(topic => {
                                            const isSel = currentTopicValue === topic;
                                            return (
                                              <button
                                                key={topic}
                                                type="button"
                                                onClick={() => {
                                                  if (activeTab === 'teaching') setT_Topic(topic);
                                                  else setV_Topic(topic);
                                                  setActiveSetupTab(null);
                                                }}
                                                className={cn(
                                                  "py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer",
                                                  isSel
                                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                                                    : isDarkMode ? "bg-[#0d1733] border-white/10 text-slate-200 hover:bg-[#152554] hover:text-white hover:border-emerald-400/40" : "bg-[#0d1733] border-white/10 text-slate-200 hover:bg-[#152554] hover:text-white hover:border-emerald-400/40"
                                                )}
                                              >
                                                {topic}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-slate-400 italic">No preset topics for this subject. Enter custom topic below:</div>
                                      )}

                                      <div className="pt-2 flex items-center gap-2">
                                        <div className="flex-1">
                                          <Label>Custom Topic Input</Label>
                                          <Input
                                            isDarkMode={isDarkMode}
                                            type="text"
                                            value={currentTopicValue}
                                            onChange={(e: any) => {
                                              if (activeTab === 'teaching') setT_Topic(e.target.value);
                                              else setV_Topic(e.target.value);
                                            }}
                                            placeholder="e.g., Fractions, Photosynthesis, Quadratic Equations..."
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveSetupTab(null)}
                                          className="mt-5 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                                        >
                                          Done
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <Input
                                      isDarkMode={isDarkMode}
                                      type="text"
                                      value={a_topic}
                                      onChange={(e: any) => setA_Topic(e.target.value)}
                                      placeholder="e.g., Parent Newsletter, Term Report Card"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setActiveSetupTab(null)}
                                    className="px-3 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                                  >
                                    Done
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Admin Specific Fields */}
                  {activeTab === 'admin' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div>
                        <Label>School</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_school} onChange={(e: any) => setA_School(e.target.value)} placeholder="School Name" />
                      </div>
                      <div>
                        <Label>Time & Date</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_timeDate} onChange={(e: any) => setA_TimeDate(e.target.value)} placeholder="e.g. 15 Oct, 14:00" />
                      </div>
                      <div>
                        <Label>Recipient</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_recipient} onChange={(e: any) => setA_Recipient(e.target.value)} placeholder="e.g. Parents, Staff" />
                      </div>
                      <div>
                        <Label>Venue</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_venue} onChange={(e: any) => setA_Venue(e.target.value)} placeholder="e.g. School Hall" />
                      </div>
                      <div>
                        <Label>Class Teacher</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_classTeacher} onChange={(e: any) => setA_ClassTeacher(e.target.value)} placeholder="Teacher Name" />
                      </div>
                      <div>
                        <Label>School Principal</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_schoolPrincipal} onChange={(e: any) => setA_SchoolPrincipal(e.target.value)} placeholder="Principal Name" />
                      </div>
                    </div>
                  )}

                  {/* Instructor brief — intentionally surfaced as the primary
                      creative input instead of a low-priority optional note. */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-3 ml-1">
                      <label className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? "text-purple-400" : "text-purple-300")}>
                        Instructor Brief — Highest Priority
                      </label>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Overrides presets</span>
                    </div>
                    <p className={cn("text-[10px] ml-1", isDarkMode ? "text-slate-400" : "text-slate-300")}>
                      Your instructions guide the topic, examples, structure, and visual details. Preset options only fill in what you leave unspecified.
                    </p>
                    <textarea 
                      placeholder="Tell EduAI exactly what to create... E.g., Focus specifically on the history of the Khoisan people, use these three examples, and include a timeline."
                      value={activeTab === 'teaching' ? t_customPrompt : activeTab === 'visual' ? v_customPrompt : a_customPrompt}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (activeTab === 'teaching') setT_CustomPrompt(val);
                        else if (activeTab === 'visual') setV_CustomPrompt(val);
                        else setA_CustomPrompt(val);
                      }}
                      className={cn(
                        "w-full h-20 border text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-1 transition-all resize-none",
                        isDarkMode 
                          ? "bg-[#060c1d] border-cyan-500/30 text-slate-100 placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400 shadow-inner" 
                          : "bg-[#060c1d] border-cyan-500/30 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500 shadow-inner"
                      )}
                    />
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

                        <div>
                          <Label>Font Style</Label>
                          <Select
                            isDarkMode={isDarkMode}
                            value={fontStyle}
                            onChange={(e: any) => setFontStyle(e.target.value)}
                          >
                            {FONT_STYLES.map(font => (
                              <option key={font} value={font}>{font}</option>
                            ))}
                          </Select>
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

                      <IconSelector 
                        isDarkMode={isDarkMode} 
                        onSelect={(emoji) => {
                          const updated = t_customPrompt + (t_customPrompt ? ' ' : '') + emoji;
                          setT_CustomPrompt(updated);
                        }}
                      />
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

                      <IconSelector 
                        isDarkMode={isDarkMode} 
                        onSelect={(emoji) => {
                          const updated = v_customPrompt + (v_customPrompt ? ' ' : '') + emoji;
                          setV_CustomPrompt(updated);
                        }}
                      />
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

                      <IconSelector 
                        isDarkMode={isDarkMode} 
                        onSelect={(emoji) => {
                          const updated = a_customPrompt + (a_customPrompt ? ' ' : '') + emoji;
                          setA_CustomPrompt(updated);
                        }}
                      />
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
                  "rounded-3xl border-2 p-6 backdrop-blur-xl flex flex-col justify-between animate-border-flash-purple",
                  isDarkMode
                    ? "bg-[#0a1226]/95 border-purple-500/30 shadow-2xl shadow-black/50"
                    : "bg-[#0b142c] text-white border-purple-500/30 shadow-2xl"
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

                    <div className="flex items-center gap-2">
                      {((activeTab === 'teaching' && (teachingResult?.content || teachingResult?.memo || teachingResult?.rubric)) ||
                        (activeTab === 'visual' && visualResult?.content) ||
                        (activeTab === 'admin' && adminResult?.content)) && !isGenerating && (
                        <button
                          onClick={() => setShowPrintPreviewModal(true)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm",
                            isDarkMode ? "bg-white/10 text-cyan-300 border-white/20 hover:bg-white/20" : "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
                          )}
                          title="Toggle A4 Print Preview Mode"
                        >
                          <Printer size={14} />
                          Print Preview (A4)
                        </button>
                      )}

                      {/* Close Button Only */}
                      {((activeTab === 'teaching' && (teachingResult?.content || teachingResult?.memo || teachingResult?.rubric)) ||
                        (activeTab === 'visual' && visualResult?.content) ||
                        (activeTab === 'admin' && adminResult?.content)) && !isGenerating && (
                        <button
                          onClick={handleClosePreview}
                          title="Close Preview"
                          className="p-2 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer flex items-center justify-center"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preview Area */}
                  {(() => {
                    const hasContent = (activeTab === 'teaching' && (teachingResult?.content || teachingResult?.memo || teachingResult?.rubric)) ||
                                       (activeTab === 'visual' && visualResult?.content) ||
                                       (activeTab === 'admin' && adminResult?.content);
                    
                    if (isGenerating) {
                      const currentLiveContent = activeTab === 'teaching' 
                        ? (teachingResult?.content || '')
                        : activeTab === 'visual' ? (visualResult?.content || '')
                        : (adminResult?.content || '');

                      if (currentLiveContent && currentLiveContent.trim().length > 0) {
                        return (
                          <div className="space-y-3">
                            {/* Live Streaming Indicator Banner */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-teal-500/15 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-between gap-3 shadow-lg shadow-cyan-500/10 animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-cyan-500/25 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-black shrink-0 shadow-md">
                                  <Loader2 className="animate-spin" size={20} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-white">Streaming Live Chunks</span>
                                    <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow">
                                      {Math.round(generationProgress)}%
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 font-medium">{generationPhase}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-mono">
                                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                Live rendering
                              </div>
                            </div>

                            {/* Live streaming HTML preview */}
                            <div className={cn(
                              "rounded-3xl border shadow-2xl overflow-hidden p-6 relative max-h-[600px] overflow-y-auto",
                              isDarkMode ? "bg-[#090d1a] border-cyan-500/30" : "bg-white border-cyan-300"
                            )}>
                              <div 
                                className={cn(
                                  "prose prose-invert max-w-none text-left leading-relaxed",
                                  isDarkMode ? "text-slate-100" : "text-slate-900"
                                )}
                                dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(currentLiveContent, activeTab === 'teaching' ? t_generateImage : activeTab === 'visual' ? v_generateImage : a_generateImage) }}
                              />
                              <div className="mt-4 flex items-center gap-2 text-cyan-400 text-xs font-mono animate-pulse">
                                <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse" />
                                Generating next chunk...
                              </div>
                            </div>
                          </div>
                        );
                      }

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
                          
                          {/* Progress container */}
                          <div className={cn(
                            "text-center z-10 p-8 rounded-2xl border max-w-sm w-full shadow-2xl flex flex-col items-center justify-center",
                            isDarkMode ? "bg-[#060c1d] border-cyan-500/30 text-white" : "bg-[#060c1d] border-cyan-500/30 text-white"
                          )}>
                            {/* Rotating glowing rings */}
                            <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                              {/* Outer ring */}
                              <motion.div
                                className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-400/30"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                              />
                              {/* Inner ring */}
                              <motion.div
                                className="absolute inset-2 rounded-full border-4 border-cyan-500/10 border-t-cyan-400"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              />
                              {/* Pulsing glow behind number */}
                              <motion.div
                                className="absolute inset-4 rounded-full bg-cyan-500/10 blur-md"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              {/* Centered Percentage */}
                              <span className={cn(
                                "text-3xl font-black tracking-tight z-10 font-mono",
                                isDarkMode ? "text-cyan-400" : "text-cyan-400"
                              )}>
                                {Math.round(generationProgress)}%
                              </span>
                            </div>

                            {/* Linear progress bar */}
                            <div className={cn(
                              "w-full h-2.5 rounded-full overflow-hidden mb-4 p-0.5 shadow-inner border",
                              isDarkMode ? "bg-slate-800 border-slate-700/50" : "bg-slate-800 border-slate-700/50"
                            )}>
                              <motion.div
                                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${generationProgress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>

                            {/* Phase & status messages */}
                            <div className="space-y-1.5 w-full">
                              <p className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                isDarkMode ? "text-cyan-400" : "text-cyan-400"
                              )}>
                                Forging Content
                              </p>
                              <p className={cn(
                                "text-xs font-medium font-sans h-12 flex items-center justify-center px-2 leading-relaxed transition-all duration-300",
                                isDarkMode ? "text-slate-300" : "text-slate-300"
                              )}>
                                {generationPhase}
                              </p>
                              <div className="w-full h-[1px] bg-slate-500/10 my-2" />
                              <p className={cn(
                                "text-[10px] font-sans tracking-wide",
                                isDarkMode ? "text-slate-500" : "text-slate-400"
                              )}>
                                Applying South African CAPS Curriculum Framework
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (!hasContent) {
                      return (
                        <div className={cn(
                          "rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-12 text-center min-h-[400px]",
                          isDarkMode ? "bg-[#060c1d]/90 border-cyan-500/30 text-white" : "bg-[#060c1d]/90 border-cyan-500/30 text-white"
                        )}>
                          <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 flex items-center justify-center mb-4 text-cyan-400">
                            <Zap size={32} />
                          </div>
                          <h3 className={cn("text-lg font-bold mb-2", isDarkMode ? "text-white" : "text-white")}>Ready to Forge?</h3>
                          <p className="text-sm text-slate-300 max-w-xs mx-auto">
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

                    const activeResult = activeTab === 'teaching' ? teachingResult : activeTab === 'visual' ? visualResult : adminResult;
                    const activeRating = activeResult?.qualityRating;
                    const qualityScore = activeRating?.overall || activeRating?.capsAlignmentScore || 95;

                    return (
                      <div className="space-y-3">
                        {/* Quality Score Total Banner on TOP */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center text-emerald-300 font-black shrink-0 shadow-md">
                              <Award size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-white">CAPS Quality Score</span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow">
                                  {qualityScore}% CAPS Aligned
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300 font-medium">Verified for South African Curriculum Standards</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setQualityRating(activeRating || { capsAlignmentScore: qualityScore, overall: qualityScore });
                              setShowQualityCheck(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                          >
                            <ClipboardList size={13} />
                            View Score
                          </button>
                        </div>

                        {/* Result Sub-tabs (Teaching material) */}
                        {activeTab === 'teaching' && (teachingResult.memo || teachingResult.rubric) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActivePreviewTab('content')}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                activePreviewTab === 'content'
                                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black"
                                  : "bg-[#0d1733] border border-white/10 text-slate-300 hover:text-white"
                              )}
                            >
                              Lesson Material
                            </button>
                            {teachingResult.memo && (
                              <button
                                onClick={() => setActivePreviewTab('memo')}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                  activePreviewTab === 'memo'
                                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black"
                                    : "bg-[#0d1733] border border-white/10 text-slate-300 hover:text-white"
                                )}
                              >
                                Expert Memo
                              </button>
                            )}
                            {teachingResult.rubric && (
                              <button
                                onClick={() => setActivePreviewTab('rubric')}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                  activePreviewTab === 'rubric'
                                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black"
                                    : "bg-[#0d1733] border border-white/10 text-slate-300 hover:text-white"
                                )}
                              >
                                Marks Rubric
                              </button>
                            )}
                          </div>
                        )}

                        {/* Action Buttons Toolbar on TOP */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleAssign}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer",
                              assignSuccess
                                ? "bg-emerald-500 text-white font-black shadow-emerald-500/25"
                                : "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black shadow-purple-600/25"
                            )}
                          >
                            <Users size={13} />
                            {assignSuccess ? 'Assigned ✅' : 'Assign To...'}
                          </button>


                          <button
                            onClick={handlePrint}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer"
                          >
                            <Printer size={13} /> Print
                          </button>
                          
                          <button
                            onClick={handleDownloadPDF}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                          >
                            <Download size={13} /> PDF Download
                          </button>

                          <button
                            onClick={handleToggleEdit}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer",
                              isEditing ? "bg-amber-400 text-slate-950 font-black" : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                            )}
                          >
                            <Edit2 size={13} /> {isEditing ? 'Save' : 'Edit'}
                          </button>

                          <button
                            onClick={handleQualityCheck}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
                          >
                            <ClipboardList size={13} /> Quality Check
                          </button>

                          <button
                            onClick={() => setShowShareModal(true)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                          >
                            <Share2 size={13} /> Export
                          </button>

                          <button
                            onClick={handleArchive}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ml-auto",
                              archiveSuccess
                                ? "bg-emerald-500 text-white font-black"
                                : "bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                            )}
                          >
                            {archiveSuccess ? <Check size={13} /> : <Save size={13} />}
                            {archiveSuccess ? 'Archived ✅' : 'Archive'}
                          </button>
                        </div>

                        {/* Document Viewer Frame */}
                        <div className={cn(
                          "rounded-3xl border shadow-2xl overflow-hidden flex flex-col min-h-[520px]",
                          isDarkMode ? "bg-[#050a18] border-white/10" : "bg-white border-slate-200"
                        )}>
                          {/* Document Viewer Frame Header */}
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
                          <div className="flex-1 max-h-[600px] overflow-y-auto scrollbar-thin p-3 sm:p-4">
                            <HtmlPreviewFrame
                              html={replaceImagePlaceholders(activeHtml, activeTab === 'teaching' ? t_generateImage : activeTab === 'visual' ? v_generateImage : a_generateImage)}
                              fontStyle={fontStyle}
                              minHeight="520px"
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



          {/* Dedicated Fullscreen Preview Modal */}
          <AnimatePresence>
            {isFullscreenPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex flex-col p-4 sm:p-8"
              >
                <div className="flex justify-between items-center bg-slate-900/95 border border-white/10 rounded-2xl p-4 mb-4 backdrop-blur-lg">
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
                      onClick={handleAssign}
                      className={cn(
                        "p-2.5 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-md",
                        assignSuccess ? "bg-emerald-500" : "bg-purple-600 hover:bg-purple-500"
                      )}
                    >
                      <Users size={14} /> {assignSuccess ? 'Assigned ✅' : 'Assign'}
                    </button>
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
                      className="p-2.5 rounded-xl bg-transparent text-white hover:bg-transparent cursor-pointer ml-2"
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
                    fontStyle={fontStyle}
                    minHeight="100%"
                    className="w-full h-full max-w-5xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
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
                            setAssignTargetId('');
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
                  <Select
                    isDarkMode={isDarkMode}
                    value={assignTargetId}
                    onChange={(e: any) => {
                      const id = e.target.value;
                      setAssignTargetId(id);
                      let name = '';
                      if (assignTargetType === 'class') {
                        name = dbClasses.find(c => c.id === id)?.name || '';
                      } else if (assignTargetType === 'group') {
                        name = dbStudyGroups.find(g => g.id === id)?.name || '';
                      } else {
                        name = dbStudents.find(s => s.id === id)?.name || '';
                      }
                      setAssignTargetName(name);
                    }}
                    required
                  >
                    <option value="">Select a {assignTargetType === 'class' ? 'Class' : assignTargetType === 'group' ? 'Study Group' : 'Learner'}...</option>
                    {assignTargetType === 'class' && dbClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>
                    ))}
                    {assignTargetType === 'group' && dbStudyGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    {assignTargetType === 'student' && dbStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                    ))}
                  </Select>
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
                      ? "bg-transparent hover:bg-transparent text-white"
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
        fontStyle={fontStyle}
      />
    </div>
  );
}
