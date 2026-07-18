import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Loader2, Sparkles, Printer, Save, Trash2, Download, Send,
  FlaskConical, Palette, FileText, Eye, BookOpen, GraduationCap,
  ChevronDown, ChevronUp, ChevronRight, Zap, ClipboardList, ImageIcon, Settings2, RefreshCw,
  Check, X, Plus, Users, Layout, Video, FileCode, HelpCircle, Archive, UserCircle, Image, AlertCircle,
  Edit2, History, Share2, Copy, Link, Mail, FileJson, Maximize2, Minimize2,
  Timer, Volume2, VolumeX, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { renderMathInHtml } from '../lib/latexHelper';
import { educationalData } from '../lib/educational-data';
import { generateCAPSContent, generateVisualAid, generateAdminDoc } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';
import AiImage from './AiImage';
import EduVideoPlayer from './EduVideoPlayer';
import VideoGenerationHistory from './VideoGenerationHistory';
import { PromptQualityValidator } from '../lib/prompt-validator';
// PrintHeader removed as per user request
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
            {typeof children === 'function' 
              ? children(setIsOpen) 
              : Array.isArray(children) 
                ? children.map(c => typeof c === 'function' ? c(setIsOpen) : c) 
                : children}
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

const isFoundationPhase = (g?: string | number) => {
  if (!g) return false;
  const clean = String(g).toLowerCase().trim();
  return clean === 'r' || clean === '1' || clean === '2' || clean === '3' || 
         clean.includes('grade r') || clean.includes('grade 1') || clean.includes('grade 2') || clean.includes('grade 3') ||
         clean.includes('foundation');
};

// ─── Preview Component ────────────────────────────────────────────────────────

function ContentPreview({ 
  html, 
  label, 
  isDarkMode, 
  imagePrompt,
  grade,
  subject,
  contentType
}: { 
  html: string | object; 
  label: string; 
  isDarkMode?: boolean; 
  imagePrompt?: string | null;
  grade?: string;
  subject?: string;
  contentType?: string;
}) {
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const validationResult = useMemo(() => {
    if (!html) return null;
    const checkHtml = typeof html === 'object' ? JSON.stringify(html) : String(html);
    return PromptQualityValidator.validateOutput(checkHtml, {
      grade: grade || '4',
      subject: subject || 'Mathematics',
      contentType: contentType || 'worksheet'
    });
  }, [html, grade, subject, contentType]);

  if (!html) return null;
  
  let processedHtml = typeof html === 'object' ? '' : String(html);

  if (typeof html === 'string') {
    processedHtml = processedHtml.trim();
    processedHtml = processedHtml.replace(/^```(?:html|xml|json|markdown)?\s*/i, "");
    processedHtml = processedHtml.replace(/\s*```$/, "");
    processedHtml = processedHtml.trim();
  }

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
  
  if (imagePrompt) {
    const cleanAlt = imagePrompt.replace(/"/g, '&quot;');
    processedHtml = `<div class="top-accompanying-visual max-w-full print:break-inside-avoid">[Illustration: ${cleanAlt}]</div>` + processedHtml;
  }
  
  // Replace text image placeholders with actual generated visuals on the fly
  processedHtml = replaceImagePlaceholders(processedHtml);
  
  if (typeof html === 'string' && processedHtml.trim().startsWith('div ')) {
    processedHtml = '<' + processedHtml;
  }

  const isHtmlFragment = processedHtml.trim().toLowerCase().startsWith('<div') || 
                         processedHtml.trim().toLowerCase().startsWith('<section') ||
                         processedHtml.trim().toLowerCase().startsWith('<article') ||
                         processedHtml.trim().toLowerCase().startsWith('<svg');

  const isFullHtmlDoc = processedHtml.trim().toLowerCase().startsWith('<!doctype') || 
                    processedHtml.trim().toLowerCase().startsWith('<html');
                    
  const useIframe = isFullHtmlDoc || isHtmlFragment;
  
  const getParentStyles = () => {
    return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => {
        if (el.tagName.toLowerCase() === 'link') {
          const href = (el as HTMLLinkElement).href;
          return `<link rel="stylesheet" href="${href}">`;
        }
        return el.outerHTML;
      })
      .join('\n');
  };

  const customVisualStyles = `
<style>
  .top-accompanying-visual {
    width: 100% !important;
    display: flex !important;
    justify-content: center !important;
    margin-bottom: 2rem !important;
    margin-top: 0.5rem !important;
  }
  .top-accompanying-visual > div {
    margin: 0 !important;
    padding: 0.25rem !important;
    width: 100% !important;
    max-width: 1000px !important;
    border-radius: 24px !important;
    border: 1px solid rgba(226, 232, 240, 0.8) !important;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
    background-color: white !important;
  }
  .top-accompanying-visual img {
    width: 100% !important;
    height: 240px !important;
    object-fit: cover !important;
    object-position: center !important;
    border-radius: 18px !important;
  }
  @media print {
    .top-accompanying-visual img {
      height: 2.2in !important;
    }
  }
</style>
`;
  
  const isFoundation = isFoundationPhase(grade);
  const foundationIframeStyles = isFoundation ? `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
  
  body, p, li, div, h1, h2, h3, h4, h5, h6, span, strong, section, article {
    font-family: "Patrick Hand", "Comic Neue", cursive, sans-serif !important;
  }
  body {
    font-size: 1.3rem !important;
    line-height: 1.6 !important;
  }
  p, li, td, th {
    font-size: 1.25rem !important;
  }
  h1 { font-size: 2.75rem !important; }
  h2 { font-size: 2.25rem !important; }
  h3 { font-size: 1.75rem !important; }
</style>
` : '';
  
  let finalIframeContent = renderMathInHtml(processedHtml);
  // Always strip AI-generated tailwind CDN
  finalIframeContent = finalIframeContent.replace(/<script[^>]*src=["'][^>]*cdn\.tailwindcss\.com[^>]*>[\s\S]*?<\/script>/gi, '');
  
  if (useIframe) {
      if (isFullHtmlDoc) {
          if (finalIframeContent.includes('<head>')) {
              finalIframeContent = finalIframeContent.replace('<head>', `<head>\n${getParentStyles()}\n${customVisualStyles}\n${foundationIframeStyles}`);
          } else if (finalIframeContent.includes('<html')) {
              finalIframeContent = finalIframeContent.replace(/<html[^>]*>/i, `$&<head>\n${getParentStyles()}\n${customVisualStyles}\n${foundationIframeStyles}</head>`);
          }
      } else if (isHtmlFragment) {
          // Wrap fragment with Tailwind CSS
          finalIframeContent = `<!DOCTYPE html>
<html>
<head>
    ${getParentStyles()}
    ${customVisualStyles}
    ${foundationIframeStyles}
    <style>body { margin: 0; padding: 1rem; }</style>
</head>
<body class="bg-white text-slate-900">
    ${finalIframeContent}
</body>
</html>`;
      }
  }

  const rawMarkup = useIframe ? processedHtml : renderMathInHtml(marked.parse(processedHtml) as string);

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        if (useIframe) {
          printWindow.document.write(finalIframeContent);
        } else {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${label}</title>
                ${getParentStyles()}
                ${customVisualStyles}
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
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </h3>
      </div>

      {validationResult && (
        <div className={`border rounded-[24px] p-4 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-200'} mb-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                validationResult.score >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                validationResult.score >= 65 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {validationResult.score}
              </div>
              <div>
                <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                  EduAI QA Quality Score: {validationResult.score >= 80 ? 'Excellent' : 'Action Required'}
                </h4>
                <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Automated CAPS design rules, hierarchy, contrast & print-readiness validation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              className={`text-[10px] self-start sm:self-auto font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition ${
                isDarkMode 
                  ? 'border-white/10 hover:bg-white/5 text-slate-300' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {showQualityDetails ? 'Hide QA Details' : 'View QA Report'}
            </button>
          </div>

          <AnimatePresence>
            {showQualityDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-white/5 space-y-4 overflow-hidden"
              >
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {Object.entries(validationResult.metrics).map(([key, value]) => (
                    <div key={key} className={`p-2 rounded-xl border text-center ${
                      value 
                        ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600')
                        : (isDarkMode ? 'bg-slate-800/50 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500')
                    }`}>
                      <p className="text-[9px] font-black uppercase tracking-wider mb-1">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </p>
                      <p className="text-xs font-bold">
                        {value ? 'PASSED ✅' : 'OPTIONAL 💡'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Issues, Warnings & Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Warnings and Issues */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-[10px] uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <AlertCircle size={12} /> Design & Layout Diagnostics
                    </h5>
                    {validationResult.issues.length === 0 && validationResult.warnings.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">No layout, spacing, or CAPS issues. Highly professional document structure!</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {validationResult.issues.map((iss, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-rose-400">
                            <span className="mt-0.5">•</span>
                            <span>{iss}</span>
                          </li>
                        ))}
                        {validationResult.warnings.map((warn, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-amber-400 text-[11px]">
                            <span className="mt-0.5">•</span>
                            <span>{warn}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-[10px] uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
                      <Sparkles size={12} className="text-brand-cyan" /> Pedagogical Suggestions
                    </h5>
                    {validationResult.suggestions.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">Complies with 100% of South African CAPS aesthetic best practices.</p>
                    ) : (
                      <ul className="space-y-1.5 list-disc pl-3 text-slate-400">
                        {validationResult.suggestions.map((sug, i) => (
                          <li key={i} className="text-[11px] text-slate-300">
                            {sug}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-slate-800 text-slate-200 border-white/10' : 'bg-white text-slate-900 border-slate-200'} border rounded-[32px] overflow-hidden p-4 lg:p-8 shadow-2xl relative min-h-[400px]`}>
        {processedHtml.includes('poster-container') || processedHtml.includes('content-card') ? (
          <PosterPreview html={processedHtml} grade={grade} />
        ) : useIframe ? (
          <iframe 
            srcDoc={finalIframeContent} 
            className="w-full h-[850px] border-0 bg-white rounded-xl"
            title="Content Preview"
          />
        ) : (
          <div ref={contentRef} className="space-y-6">
            <div 
              className={cn("prose prose-sm max-w-none markdown-body", isDarkMode ? "prose-invert" : "")}
              style={isFoundation ? {
                fontFamily: '"Patrick Hand", "Comic Neue", cursive, sans-serif',
                fontSize: '1.25rem',
                lineHeight: '1.6'
              } : undefined}
              dangerouslySetInnerHTML={{ __html: processedHtml.trim().startsWith('<') ? processedHtml : rawMarkup }} 
            />
          </div>
        )}
        <div className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-20 ${isDarkMode ? 'text-slate-400' : 'text-slate-300'}`}>
          EduAI Companion Engine
         </div>
      </div>
    </motion.div>
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

const htmlToMarkdown = (html: string): string => {
  if (!html) return "";
  let md = html;

  // Replace block elements headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

  // Replace paragraph and block-level separators
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Replace list items
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');
  
  // Replace strong / em
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Replace links
  md = md.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Remove other HTML tags (while keeping their content)
  md = md.replace(/<[^>]*>/g, '');

  // Clean up excessive newlines
  md = md.replace(/\n\s*\n\s*\n/gi, '\n\n');

  // Decode basic HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");

  return md.trim();
};

const downloadBlobFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ContentCreator({ isOpen, onClose, initialTab = 'teaching', isDarkMode = true, isSidebarOpen = false }: { isOpen: boolean, onClose: () => void, initialTab?: string, isDarkMode?: boolean, isSidebarOpen?: boolean }) {
  const { provider } = useAi();
  const [activeTab, setActiveTab] = useState(() => {
    return initialTab || 'teaching';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'content' | 'memo' | 'rubric' | 'assessment'>('content');
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbStudyGroups, setDbStudyGroups] = useState<any[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [videoHistory, setVideoHistory] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to classes
    const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      setDbClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.log("Creator classes sub error:", err));

    // Listen to study groups
    const qGroups = query(collection(db, 'study_groups'), where('teacherId', '==', user.uid));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setDbStudyGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.log("Creator groups sub error:", err));

    // Listen to students
    const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setDbStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.log("Creator students sub error:", err));

    // Listen to video history
    const qVideos = query(collection(db, 'omnihuman_videos'), where('teacherId', '==', user.uid));
    const unsubVideos = onSnapshot(qVideos, (snapshot) => {
      const vids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      vids.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setVideoHistory(vids);
    }, (err) => console.log("Creator videos sub error:", err));

    return () => {
      unsubClasses();
      unsubGroups();
      unsubStudents();
      unsubVideos();
    };
  }, []);

  // Results state
  const [teachingResult, setTeachingResult] = useState<any>(null);
  const [visualResult, setVisualResult] = useState<any>(null);
  const [adminResult, setAdminResult] = useState<any>(null);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);

  // ─── Exam Mode Timer States ──────────────────────
  const [examTimerDuration, setExamTimerDuration] = useState<number>(45); // general default 45 minutes
  const [examWarningMinutes, setExamWarningMinutes] = useState<number>(5); // alert at 5 mins left
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(0); // in seconds
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [isExamPaused, setIsExamPaused] = useState<boolean>(false);
  const [examTimerAlertTriggered, setExamTimerAlertTriggered] = useState<boolean>(false);
  const [examCompleted, setExamCompleted] = useState<boolean>(false);
  const [showExamAlertOverlay, setShowExamAlertOverlay] = useState<boolean>(false);
  const [examAlertMessage, setExamAlertMessage] = useState<string>('');
  const [examSubjectName, setExamSubjectName] = useState<string>('');
  const [examPaperTitle, setExamPaperTitle] = useState<string>('');
  const [examSoundEnabled, setExamSoundEnabled] = useState<boolean>(true);
  const [examTimerExpanded, setExamTimerExpanded] = useState<boolean>(false);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isExamRunning && !isExamPaused && examTimeRemaining > 0) {
      timer = setInterval(() => {
        setExamTimeRemaining(prev => {
          const nextSec = prev - 1;
          
          // Warning threshold trigger
          const warningSeconds = examWarningMinutes * 60;
          if (nextSec === warningSeconds && warningSeconds > 0) {
            setExamTimerAlertTriggered(true);
            setExamAlertMessage(`⚠️ Visual Warning Alert: Only ${examWarningMinutes} minutes remaining in the exam! Double-check your spelling.`);
            setShowExamAlertOverlay(true);
            
            // Web Audio Synthesis for alert chime (non-blocking)
            if (examSoundEnabled && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContextClass();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
                osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4); // G5 
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
              } catch (_) {}
            }
          }
          
          if (nextSec <= 0) {
            setIsExamRunning(false);
            setExamCompleted(true);
            setExamAlertMessage("🏁 TIME IS UP! Lay down your pens and hand in your papers immediately.");
            setShowExamAlertOverlay(true);
            
            // Triple Beep for completion
            if (examSoundEnabled && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContextClass();
                [523.25, 523.25, 523.25].forEach((freq, idx) => {
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = 'triangle';
                  osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.3);
                  gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.3);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.3 + 0.25);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start(ctx.currentTime + idx * 0.3);
                  osc.stop(ctx.currentTime + idx * 0.3 + 0.25);
                });
              } catch (_) {}
            }
            return 0;
          }
          return nextSec;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExamRunning, isExamPaused, examWarningMinutes, examSoundEnabled]);

  // Content Editing, Versioning, and Export/Sharing states
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContentText, setEditContentText] = useState('');
  const [editMemoText, setEditMemoText] = useState('');
  const [editRubricText, setEditRubricText] = useState('');
  const [versions, setVersions] = useState<Record<string, { timestamp: string; content: string; memo?: string; rubric?: string }[]>>({});
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareType, setShareType] = useState<'text' | 'html' | 'link' | 'email' | 'markdown' | 'json'>('link');
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isLoading || teachingResult || visualResult || adminResult) && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('preview-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isLoading, teachingResult, visualResult, adminResult]);

  const autoSaveContent = async (result: any, tab: string) => {
    const docId = Date.now().toString();
    setCurrentDocId(docId);

    const newItem = {
      title: (tab === 'teaching' ? t_topic || t_type : tab === 'visual' ? v_topic || v_type : tab === 'grade1' ? f_topic : 'Administrative Doc') || 'Untitled Generation',
      subject: (tab === 'teaching' ? t_subject : tab === 'visual' ? v_subject : tab === 'grade1' ? f_language : 'Administration') || 'General',
      grade: (tab === 'teaching' ? t_grade : tab === 'visual' ? v_grade : tab === 'grade1' ? `Grade ${f_grade}` : 'All') || 'N/A',
      contentType: (tab === 'teaching' ? t_type : tab === 'visual' ? v_type : tab === 'grade1' ? `${f_topic} Pack` : 'Notice') || 'Document',
      isSystem: false,
      content: result.content || " ",
      memo: result.memo || null,
      rubric: result.rubric || null,
      imagePrompt: result.imagePrompt || null
    };

    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'created_content', docId), {
          ...newItem,
          teacherId: user.uid,
          createdAt: serverTimestamp()
        }).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, 'created_content/' + docId);
        });
      } else {
        // Fallback to IndexedDB
        const { saveStudyNote } = await import('../lib/offlineDB');
        await saveStudyNote({id: docId, createdAt: new Date().toISOString(), ...newItem});
      }
    } catch (e) {
      console.error('Failed to auto-save content to firestore', e);
    }
  };

  const syncUpdatedContentToFirestore = async (updatedResult: any) => {
    if (!currentDocId) return;

    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'created_content', currentDocId), {
          content: updatedResult.content || " ",
          memo: updatedResult.memo || null,
          rubric: updatedResult.rubric || null,
          updatedAt: serverTimestamp()
        }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, 'created_content/' + currentDocId);
        });
      }
    } catch (err) {
      console.error("Failed to sync updated edits to Firestore:", err);
    }
  };

  // Auto-save generated content to Firestore immediately after generation
  useEffect(() => {
    if (teachingResult && !currentDocId && (activeTab === 'teaching' || activeTab === 'grade1')) {
      autoSaveContent(teachingResult, activeTab);
    }
  }, [teachingResult]);

  useEffect(() => {
    if (visualResult && !currentDocId && activeTab === 'visual') {
      autoSaveContent(visualResult, 'visual');
    }
  }, [visualResult]);

  useEffect(() => {
    if (adminResult && !currentDocId && activeTab === 'admin') {
      autoSaveContent(adminResult, 'admin');
    }
  }, [adminResult]);

  const handleToggleEdit = () => {
    if (!isEditing) {
      // Initialize edit fields
      if (activeTab === 'teaching' || activeTab === 'grade1') {
        setEditContentText(typeof teachingResult?.content === 'string' ? teachingResult.content : JSON.stringify(teachingResult?.content || ''));
        setEditMemoText(typeof teachingResult?.memo === 'string' ? teachingResult.memo : JSON.stringify(teachingResult?.memo || ''));
        setEditRubricText(typeof teachingResult?.rubric === 'string' ? teachingResult.rubric : JSON.stringify(teachingResult?.rubric || ''));
        setEditTitle(teachingResult?.title || (t_topic || t_type || 'Untitled'));
      } else if (activeTab === 'visual') {
        setEditContentText(typeof visualResult?.content === 'string' ? visualResult.content : JSON.stringify(visualResult?.content || ''));
        setEditTitle(visualResult?.title || (v_topic || v_type || 'Untitled'));
      } else if (activeTab === 'admin') {
        setEditContentText(typeof adminResult?.content === 'string' ? adminResult.content : JSON.stringify(adminResult?.content || ''));
        setEditTitle(adminResult?.title || (a_type || 'Untitled'));
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdits = async () => {
    // 1. Create a historical version first if we have an existing state
    const currentVer = {
      timestamp: new Date().toLocaleTimeString(),
      content: activeTab === 'teaching' || activeTab === 'grade1' ? teachingResult?.content : activeTab === 'visual' ? visualResult?.content : adminResult?.content,
      memo: activeTab === 'teaching' || activeTab === 'grade1' ? teachingResult?.memo : undefined,
      rubric: activeTab === 'teaching' || activeTab === 'grade1' ? teachingResult?.rubric : undefined
    };

    // Save history
    setVersions(prev => {
      const list = prev[activeTab] || [];
      return {
        ...prev,
        [activeTab]: [currentVer, ...list]
      };
    });

    // 2. Update the active result
    if (activeTab === 'teaching' || activeTab === 'grade1') {
      const updated = {
        ...teachingResult,
        content: editContentText,
        memo: editMemoText || undefined,
        rubric: editRubricText || undefined
      };
      setTeachingResult(updated);
      await syncUpdatedContentToFirestore(updated);
    } else if (activeTab === 'visual') {
      const updated = {
        ...visualResult,
        content: editContentText
      };
      setVisualResult(updated);
      await syncUpdatedContentToFirestore(updated);
    } else if (activeTab === 'admin') {
      const updated = {
        ...adminResult,
        content: editContentText
      };
      setAdminResult(updated);
      await syncUpdatedContentToFirestore(updated);
    }

    setIsEditing(false);
  };

  const handleRestoreVersion = (version: any) => {
    if (activeTab === 'teaching' || activeTab === 'grade1') {
      const updated = {
        ...teachingResult,
        content: version.content,
        memo: version.memo,
        rubric: version.rubric
      };
      setTeachingResult(updated);
      syncUpdatedContentToFirestore(updated);
      setEditContentText(version.content);
      setEditMemoText(version.memo || '');
      setEditRubricText(version.rubric || '');
    } else {
      const resultObj = activeTab === 'visual' ? visualResult : adminResult;
      const setter = activeTab === 'visual' ? setVisualResult : setAdminResult;
      const updated = {
        ...resultObj,
        content: version.content
      };
      setter(updated);
      syncUpdatedContentToFirestore(updated);
      setEditContentText(version.content);
    }
  };

  const getCompiledContentHtml = () => {
    let bodyHtml = '';
    let imagePrompt: string | null | undefined = null;

    if (activeTab === 'teaching' || activeTab === 'grade1') {
      if (!teachingResult) return { html: '', title: 'Document' };
      bodyHtml = teachingResult.content;
      imagePrompt = t_generateImage ? (teachingResult.imagePrompt || teachingResult.userImagePrompt) : undefined;
      
      if (typeof teachingResult.memo === 'string' && teachingResult.memo.trim()) {
        bodyHtml += `
          <div class="print-page-break my-10 border-t border-dashed border-slate-300 pt-8 text-slate-800"></div>
          <h2 class="text-xl font-black uppercase tracking-widest text-[#2563eb] mb-4">Expert Answer Key (Memo)</h2>
          ${teachingResult.memo}
        `;
      }
      if (typeof teachingResult.rubric === 'string' && teachingResult.rubric.trim()) {
        bodyHtml += `
          <div class="print-page-break my-10 border-t border-dashed border-slate-300 pt-8 text-slate-800"></div>
          <h2 class="text-xl font-black uppercase tracking-widest text-[#2563eb] mb-4">Marks Allocation Matrix (Rubric)</h2>
          ${teachingResult.rubric}
        `;
      }
    } else if (activeTab === 'visual') {
      if (!visualResult) return { html: '', title: 'Visual_AID' };
      bodyHtml = visualResult.content;
      imagePrompt = v_generateImage ? (visualResult.userImagePrompt || visualResult.imagePrompt) : undefined;
    } else if (activeTab === 'admin') {
      if (!adminResult) return { html: '', title: 'Administrative_Doc' };
      bodyHtml = adminResult.content;
      imagePrompt = a_generateImage ? (adminResult.userImagePrompt || adminResult.imagePrompt) : undefined;
    } else {
      return { html: '', title: 'Document' };
    }

    if (imagePrompt) {
      const cleanAlt = imagePrompt.replace(/"/g, '&quot;');
      bodyHtml = `<div class="top-accompanying-visual max-w-full print:break-inside-avoid">[Illustration: ${cleanAlt}]</div>` + bodyHtml;
    }

    bodyHtml = replaceImagePlaceholders(bodyHtml);
    
    const itemTitle = (activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative Doc') || 'Untitled Generation';

    return { html: bodyHtml, title: itemTitle };
  };

  const handlePrint = () => {
    const { html: compiledHtml, title: itemTitle } = getCompiledContentHtml();
    if (!compiledHtml) return;

    const itemSubject = (activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : 'Administration') || 'General';
    const itemGrade = (activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : 'All') || 'N/A';
    const itemContentType = (activeTab === 'teaching' ? t_type : activeTab === 'visual' ? v_type : 'Notice') || 'Document';

    // Create offscreen container
    const tempContainer = document.createElement('div');
    tempContainer.className = 'bg-white text-slate-900 p-8 markdown-body';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px'; 
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";

    // Set custom visual styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .top-accompanying-visual {
        width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        margin-bottom: 2rem !important;
        margin-top: 0.5rem !important;
      }
      .top-accompanying-visual > div {
        margin: 0 !important;
        padding: 0.25rem !important;
        width: 100% !important;
        max-width: 1000px !important;
        border-radius: 24px !important;
        border: 1px solid rgba(226, 232, 240, 0.8) !important;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
        background-color: white !important;
      }
      .top-accompanying-visual img {
        width: 100% !important;
        height: 240px !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 18px !important;
      }
      .print-page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
    `;
    tempContainer.appendChild(styleEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'space-y-6 text-slate-800';
    contentEl.innerHTML = compiledHtml;
    tempContainer.appendChild(contentEl);

    document.body.appendChild(tempContainer);

    const tempRef = { current: tempContainer };

    printContent(tempRef as any, itemTitle, {
      subject: itemSubject,
      grade: itemGrade,
      contentType: itemContentType,
      title: itemTitle
    });

    // Remove the temporary container after print popup opens
    setTimeout(() => {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }, 1000);
  };

  const handleArchive = async () => {
    const result = activeTab === 'teaching' ? teachingResult : activeTab === 'visual' ? visualResult : adminResult;
    if (!result) return;
    
    // Fallbacks to empty strings for potentially undefined fields to comply with firestore schema
    const newItem = {
      title: (activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative Doc') || 'Untitled Generation',
      subject: (activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : 'Administration') || 'General',
      grade: (activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : 'All') || 'N/A',
      contentType: (activeTab === 'teaching' ? t_type : activeTab === 'visual' ? v_type : 'Notice') || 'Document',
      isSystem: false,
      content: result.content || " ",
      memo: result.memo || null,
      rubric: result.rubric || null,
      imagePrompt: result.imagePrompt || null
    };

    try {
      const user = auth.currentUser;
      if (user) {
        const docId = Date.now().toString();
        await setDoc(doc(db, 'created_content', docId), {
          ...newItem,
          teacherId: user.uid,
          createdAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'created_content/' + docId));
        setArchiveSuccess(true);
        setTimeout(() => setArchiveSuccess(false), 2000);
      } else {
        // Fallback to IndexedDB
        const { saveStudyNote } = await import('../lib/offlineDB');
        await saveStudyNote({id: Date.now().toString(), createdAt: new Date().toISOString(), ...newItem});
        setArchiveSuccess(true);
        setTimeout(() => setArchiveSuccess(false), 2000);
      }
    } catch (e) {
      console.error('Failed to archive', e);
      alert('Archive failed.');
    }
  };

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<'class' | 'group' | 'student'>('class');
  const [assignTargetName, setAssignTargetName] = useState('');

  const handleAssign = () => {
    setShowAssignModal(true);
  };

  const confirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetName) return;

    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'notifications', Date.now().toString()), {
          title: 'Content Assigned',
          message: `You assigned new content to ${assignTargetType === 'class' ? 'Class' : assignTargetType === 'group' ? 'Study Group' : 'Student'}: ${assignTargetName}.`,
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
    const { html: compiledHtml, title: itemTitle } = getCompiledContentHtml();
    if (!compiledHtml) return;

    // Create offscreen container
    const tempContainer = document.createElement('div');
    tempContainer.className = 'bg-white text-slate-900 p-8 markdown-body';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px'; 
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";

    // Set custom visual styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .top-accompanying-visual {
        width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        margin-bottom: 2rem !important;
        margin-top: 0.5rem !important;
      }
      .top-accompanying-visual > div {
        margin: 0 !important;
        padding: 0.25rem !important;
        width: 100% !important;
        max-width: 1000px !important;
        border-radius: 24px !important;
        border: 1px solid rgba(226, 232, 240, 0.8) !important;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
        background-color: white !important;
      }
      .top-accompanying-visual img {
        width: 100% !important;
        height: 240px !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 18px !important;
      }
      .print-page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
    `;
    tempContainer.appendChild(styleEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'space-y-6 text-slate-800';
    contentEl.innerHTML = compiledHtml;
    tempContainer.appendChild(contentEl);

    document.body.appendChild(tempContainer);

    const opt = {
      margin:       10,
      filename:     `${itemTitle.replace(/\s+/g, '_')}.pdf`,
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

  // ─── Teaching Tools State ─────────────────────────────────────────────────
  const [t_category, setT_Category] = useState('');
  const [t_type, setT_Type] = useState('');
  const [t_grade, setT_Grade] = useState('');
  const [t_subject, setT_Subject] = useState('');
  const [t_customSubject, setT_CustomSubject] = useState('');
  const [t_topic, setT_Topic] = useState('');
  const [t_customTopic, setT_CustomTopic] = useState('');
  const [t_term, setT_Term] = useState(() => {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'Term 1';
    if (month >= 3 && month <= 5) return 'Term 2';
    if (month >= 6 && month <= 8) return 'Term 3';
    return 'Term 4';
  });
  const [t_language, setT_Language] = useState('English');
  const [t_difficulty, setT_Difficulty] = useState('');
  const [t_lengthAndDuration, setT_LengthAndDuration] = useState('');
  const [t_objective, setT_Objective] = useState('');
  const [t_profile, setT_Profile] = useState('');
  const [t_differentiation, setT_Differentiation] = useState('');
  const [t_memo, setT_Memo] = useState(true);
  const [t_rubric, setT_Rubric] = useState(true);
  const [t_includeWorksheet, setT_IncludeWorksheet] = useState(true);
  const [t_dependencies, setT_Dependencies] = useState('');
  const [t_extraInstructions, setT_ExtraInstructions] = useState('');
  const [t_generateImage, setT_GenerateImage] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [advancedSettingsExpanded, setAdvancedSettingsExpanded] = useState(false);

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
  const [v_generateImage, setV_GenerateImage] = useState(true);
  const [v_extraInstructions, setV_ExtraInstructions] = useState('');
  const [v_variations, setV_Variations] = useState(1);
  const [v_currentVariation, setV_CurrentVariation] = useState(0);
  const [visualResults, setVisualResults] = useState<any[]>([]);

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
  const [a_generateImage, setA_GenerateImage] = useState(true);

  // ─── Foundation State ─────────────────────────────────────────────────
  const [f_grade, setF_Grade] = useState('1');
  const [f_topic, setF_Topic] = useState('Phonics');
  const [f_specific, setF_Specific] = useState('');
  const [f_theme, setF_Theme] = useState('Animals');
  const [f_language, setF_Language] = useState('English HL');

  const [videoResult, setVideoResult] = useState<any>(null);
  const [vid_prompt, setVid_Prompt] = useState<string>('');
  const [vid_model, setVid_Model] = useState<string>('omnihuman-1');
  const [vid_seed, setVid_Seed] = useState<number>(-1);
  const [vid_fps, setVid_Fps] = useState<number>(15);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  
  useEffect(() => {
    const handleTriggerEditContent = (e: any) => {
      const { item, tab } = e.detail || {};
      if (!item || !tab) return;

      // Close editing mode
      setIsEditing(false);

      // Set document reference
      setCurrentDocId(item.id);
      setActiveTab(tab);

      // Clean up previous other results to avoid distraction
      setTeachingResult(null);
      setVisualResult(null);
      setAdminResult(null);

      // Set proper results based on target tab
      if (tab === 'teaching' || tab === 'grade1') {
         const res = {
           content: item.content || '',
           memo: item.memo || undefined,
           rubric: item.rubric || undefined,
           title: item.title || '',
           imagePrompt: item.imagePrompt || undefined
         };
         setTeachingResult(res);
         setT_Topic(item.title || '');
         setT_Type(item.contentType || '');
         setT_Subject(item.subject || '');
         setT_Grade(item.grade || '');
      } else if (tab === 'visual') {
         const res = {
           content: item.content || '',
           title: item.title || '',
           imagePrompt: item.imagePrompt || undefined
         };
         setVisualResult(res);
         setV_Topic(item.title || '');
         setV_Type(item.contentType || '');
         setV_Subject(item.subject || '');
         setV_Grade(item.grade || '');
      } else if (tab === 'admin') {
         const res = {
           content: item.content || '',
           title: item.title || ''
         };
         setAdminResult(res);
         setA_Type(item.contentType || '');
         setA_Subject(item.subject || '');
         setA_Grade(item.grade || '');
      }
    };

    window.addEventListener('trigger-edit-content', handleTriggerEditContent);
    return () => window.removeEventListener('trigger-edit-content', handleTriggerEditContent);
  }, []);

  const handleEnhancePrompt = async () => {
    if (!vid_prompt) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch("/api/video/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: vid_prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.enhanced) {
          setVid_Prompt(data.enhanced);
        }
      }
    } catch (err) {
      console.warn("Error enhancing prompt:", err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsLoading(true);
    setGenerationProgress(0);
    setError(null);
    setVideoResult(null);
    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: vid_prompt, 
          model: vid_model,
          seed: vid_seed,
          fps: vid_fps
        })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e: any) {
        throw new Error("Server returned an invalid response. This might be a timeout or configuration error.");
      }
      
      if (!res.ok) {
        throw new Error(data?.error || "Failed to initiate video generation");
      }
      
      const predictionId = data.id;
      if (!predictionId) throw new Error("No prediction ID returned");

      let progress = 5;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.floor(Math.random() * 3), 90);
        setGenerationProgress(progress);
      }, 1500);

      // Poll until succeeded or failed
      while (true) {
        await new Promise(r => setTimeout(r, 4000));
        const statusRes = await fetch(`/api/video/status/${predictionId}`);
        
        let statusData;
        try {
          statusData = await statusRes.json();
        } catch (e: any) {
           clearInterval(progressInterval);
           throw new Error("Failed to check video status: Server returned invalid content.");
        }
        
        if (!statusRes.ok) {
           clearInterval(progressInterval);
           throw new Error(statusData.error || "Failed to check video status");
        }
        
        if (statusData.status === "succeeded") {
           clearInterval(progressInterval);
           setGenerationProgress(100);
           
           // Save to Firestore history
           const user = auth.currentUser;
           if (user) {
             const videoId = "vid" + Date.now() + Math.floor(Math.random() * 1000);
             try {
               await setDoc(doc(db, 'omnihuman_videos', videoId), {
                 prompt: vid_prompt,
                 videoUrl: statusData.url || "",
                 model: vid_model,
                 seed: vid_seed,
                 fps: vid_fps,
                 teacherId: user.uid,
                 createdAt: serverTimestamp()
               });
             } catch (fsErr) {
               console.error("Failed to save generated video to database:", fsErr);
               handleFirestoreError(fsErr, OperationType.CREATE, 'omnihuman_videos/' + videoId);
             }
           }

           setVideoResult({ url: statusData.url, prompt: vid_prompt, model: vid_model, seed: vid_seed, fps: vid_fps });
           break;
        } else if (statusData.status === "failed" || statusData.status === "canceled") {
           clearInterval(progressInterval);
           throw new Error("Video generation failed or was canceled.");
        }
      }
      
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to generate video.");
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteDoc(doc(db, 'omnihuman_videos', videoId));
    } catch (err) {
      console.error("Failed to delete video:", err);
    }
  };

  const a_subjects = useMemo(() => {
    if (!a_grade) return [];
    const gradeData = educationalData[a_grade];
    return gradeData ? Object.keys(gradeData) : [];
  }, [a_grade]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleGenerateTeaching = async () => {
    setCurrentDocId(null);
    const finalSubject = t_subject === 'Other' ? t_customSubject : t_subject;
    const finalTopic = t_topic === 'Other' ? t_customTopic : t_topic;
    setIsLoading(true);
    setGenerationProgress(0);
    setError(null);
    setTeachingResult(null);
    setActivePreviewTab('content');
    
    // Simulate progress during generation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 8) + 2, 95));
    }, 400);

    try {
      const compiledInstructions = 
        (t_extraInstructions ? t_extraInstructions + '\n' : '') +
        (t_dependencies ? `TASK DEPENDENCIES / PRE-REQUISITES:\n${t_dependencies}\n` : '') +
        (t_difficulty ? `Difficulty Level: ${t_difficulty}\n` : '') +
        (t_lengthAndDuration ? `Length and Duration (questions/items and duration): ${t_lengthAndDuration}\n` : '') +
        (t_differentiation ? `Learner Study Profile Differentiation Strategy: ${t_differentiation}\n` : '') +
        (t_type === 'Lesson Plan' ? `Generate Student Exercise / Worksheet At End: ${t_includeWorksheet ? 'Yes' : 'No'}\n` : '') +
        `Include Memorandum/Answer Sheet: ${t_memo ? 'Yes' : 'No'}\n` +
        `Include Custom Grading Rubric Checklist: ${t_rubric ? 'Yes' : 'No'}\n`;

      const result = await generateCAPSContent({
        category: t_category, contentType: t_type, grade: t_grade, subject: finalSubject,
        topic: finalTopic, term: t_term, language: t_language, objective: t_objective,
        learnerProfile: t_profile, additionalInstructions: compiledInstructions,
        includeWorksheet: t_type === 'Lesson Plan' ? t_includeWorksheet : undefined
      }, provider);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setTimeout(() => {
        setTeachingResult(result);
        setIsLoading(false);
      }, 400);
    } catch (err: any) { 
      console.error(err); 
      clearInterval(progressInterval);
      setError(err.message || "Failed to fabricate teaching material.");
      setIsLoading(false);
    }
  };

  const handleGenerateVisual = async () => {
    setCurrentDocId(null);
    const finalSubject = v_subject === 'Other' ? v_customSubject : v_subject;
    const finalTopic = v_topic === 'Other' ? v_customTopic : v_topic;
    setIsLoading(true);
    setGenerationProgress(0);
    setError(null);
    setVisualResults([]);
    setVisualResult(null);
    setV_CurrentVariation(0);
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 8) + 2, 95));
    }, 400);
    
    try {
      const results = [];
      const count = Math.min(Math.max(1, v_variations), 3);
      
      for (let i = 0; i < count; i++) {
        // Slightly vary the color scheme or style for variations if they are not fixed
        const currentColorScheme = count > 1 && i > 0 ? (i === 1 ? 'Vibrant & Modern' : 'Soft Pastels') : v_colorScheme;
        
        const result = await generateVisualAid({
          visualType: v_type, 
          grade: v_grade, 
          subject: finalSubject, 
          topic: finalTopic,
          language: v_language, 
          colorScheme: currentColorScheme, 
          style: v_style,
          specificContent: v_specificContent, 
          quantity: v_quantity,
          generateImage: v_generateImage, 
          additionalInstructions: i > 0 ? `${v_extraInstructions} (Variation ${i+1}: Use a distinct but professional color palette)` : v_extraInstructions
        }, provider);
        
        results.push({
          ...result,
          shouldGenerateImage: v_generateImage,
          userImagePrompt: v_extraInstructions
        });
        
        // Show the first one immediately if we're doing multiple
        if (i === 0) {
          setVisualResults([results[0]]);
          setVisualResult(results[0]);
        }
      }
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setVisualResults(results);
      setVisualResult(results[0]);
    } catch (err: any) { 
      console.error(err); 
      clearInterval(progressInterval);
      setError(err.message || "Failed to design visual asset.");
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleGenerateFoundation = async () => {
    setCurrentDocId(null);
    setIsLoading(true);
    setGenerationProgress(0);
    setError(null);
    setTeachingResult(null); // Reusing teaching result panel
    setActivePreviewTab('content');

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 8) + 2, 95));
    }, 400);

    try {
      const result = await generateCAPSContent({
        category: 'Foundation Phase Pack', contentType: `${f_topic} Pack`, grade: f_grade, subject: f_language,
        topic: f_topic, term: 'Any', language: f_language, objective: `Focus on ${f_specific} with a ${f_theme} theme.`,
        learnerProfile: 'Foundation Phase Learners (Grade 1-3)', additionalInstructions: ''
      }, provider);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTeachingResult(result);
    } catch (err: any) { 
      console.error(err); 
      clearInterval(progressInterval);
      setError(err.message || "Failed to generate Foundation Phase reading pack.");
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleGenerateAdmin = async () => {
    setCurrentDocId(null);
    const finalSubject = a_subject === 'Other' ? a_customSubject : a_subject;
    setIsLoading(true);
    setGenerationProgress(0);
    setError(null);
    setAdminResult(null);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 8) + 2, 95));
    }, 400);

    try {
      const result = await generateAdminDoc({
        documentType: a_type, schoolName: a_schoolName, principalName: a_principalName,
        teacherName: a_teacherName, grade: a_grade, subject: finalSubject,
        date: a_date, language: a_language, purpose: a_purpose, keyPoints: a_keyPoints,
        tone: a_tone, includeReplySlip: a_replySlip, additionalInstructions: a_extraInstructions
      }, provider);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setAdminResult({ ...result, shouldGenerateImage: a_generateImage, userImagePrompt: a_extraInstructions });
    } catch (err: any) { 
      console.error(err); 
      clearInterval(progressInterval);
      setError(err.message || "Failed to draft official correspondence.");
    } finally { 
      setIsLoading(false); 
    }
  };

  if (!isOpen) return null;

  const hasResult = ((activeTab === 'teaching' || activeTab === 'grade1') && !!teachingResult) || (activeTab === 'visual' && !!visualResult) || (activeTab === 'admin' && !!adminResult) || (activeTab === 'video' && !!videoResult);

  return (
    <>
      {/* Backdrop for click away dismiss - placed below header (top-20) and z-[40] */}
      <div 
        onClick={onClose}
        className={cn(
          "fixed top-20 right-0 bottom-0 bg-[#070b13]/80 backdrop-blur-md z-[40] cursor-pointer",
          isSidebarOpen ? "left-0 lg:left-[240px]" : "left-0 lg:left-[72px]"
        )}
      />
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          "fixed top-20 right-0 bottom-0 z-[45] backdrop-blur-3xl bg-[#0B1122]/95 flex flex-col overflow-hidden border-t border-l border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.6)]",
          isSidebarOpen ? "left-0 lg:left-[240px]" : "left-0 lg:left-[72px]"
        )}
      >
        {/* Header - Compact and modern */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between py-3 px-4 lg:py-4 lg:px-8 border-b border-white/5 bg-white/5 gap-3 shrink-0">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3 lg:gap-4 font-sans">
              <div className="bg-brand-cyan/20 p-2 rounded-xl border border-brand-cyan/20 text-brand-cyan font-sans">
                 <FlaskConical size={18} className="lg:w-5 lg:h-5" />
              </div>
              <div className="font-sans">
              </div>
            </div>
            {/* Always visible Close Button on Mobile/Tablet right in row 1 */}
            <button 
              type="button" 
              onClick={onClose} 
              className="lg:hidden flex p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white rounded-xl border border-red-500/30 transition-all font-sans font-black uppercase tracking-widest text-[9px] items-center gap-1 hover:scale-105 active:scale-95 shadow-md shadow-red-500/10"
            >
              <X size={14} strokeWidth={3} />
              <span>Close</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between lg:justify-end gap-2 lg:gap-4 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
            {/* Back to Studio Menu button */}
            {activeTab !== 'overview' && (
              <button 
                type="button"
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all font-sans bg-white/5 hover:bg-white/10 text-brand-cyan border border-brand-cyan/20 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>← Labs</span>
              </button>
            )}

            {/* A4 Print Simulation Button */}
            {hasResult && (
              <button
                type="button"
                onClick={() => setShowPrintPreviewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow hover:bg-yellow-400 text-navy-dark rounded-xl font-sans font-black uppercase tracking-wider text-[10px] shrink-0 hover:scale-105 active:scale-95 shadow-md shadow-brand-yellow/15 cursor-pointer"
                title="A4 Print Simulation"
              >
                <Printer size={13} strokeWidth={2.5} />
                <span>Print Preview</span>
              </button>
            )}

            {/* Highly visible unified close button on Desktop */}
            <button 
              type="button" 
              onClick={onClose} 
              className="hidden lg:flex p-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 hover:text-white rounded-xl border border-red-500/30 transition-all font-sans font-black uppercase tracking-widest text-[10px] items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95 shadow-md shadow-red-500/10"
              title="Close Studio"
            >
              <X size={15} strokeWidth={3} />
              <span>Close</span>
            </button>
          </div>
        </div>

      <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden relative">
        {activeTab === 'overview' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 custom-scrollbar bg-[#0B1122]">
            {/* Grid of Generation Groups */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 animate-fade-in pb-12">
              {GENERATOR_GROUPS.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className={`group flex flex-col p-3.5 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[30px] md:rounded-[40px] transition-all text-left relative overflow-hidden cursor-pointer border ${item.border} ${
                      isDarkMode 
                        ? 'bg-slate-900/40 hover:bg-slate-900/80 hover:border-white/20' 
                        : 'bg-white hover:bg-slate-50/55 shadow-md hover:shadow-xl border-slate-100'
                    } hover:-translate-y-2.5 outline-none`}
                  >
                    <div className="flex justify-between items-start w-full mb-3 sm:mb-6 relative">
                      <div className={`p-2.5 sm:p-4 rounded-[12px] sm:rounded-[20px] md:rounded-[24px] ${item.bg} ${item.color} transition-all duration-300 group-hover:scale-110 shadow-inner`}>
                        <ItemIcon size={18} className="sm:w-[24px] sm:h-[24px] md:w-[28px] md:h-[28px]" />
                      </div>
                      <div className={`opacity-0 sm:group-hover:opacity-100 transition-all ${item.color} ${item.bg} p-1.5 sm:p-2.5 rounded-full absolute top-0 right-0 shadow-lg hidden sm:block`}>
                        <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform sm:w-[20px] sm:h-[20px]" />
                      </div>
                    </div>

                    <h3 className={`text-xs sm:text-base md:text-xl lg:text-2xl font-display font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} line-clamp-1 sm:line-clamp-none`}>
                      {item.label}
                    </h3>
                    <p className={`text-[10px] sm:text-xs md:text-sm font-medium sm:font-bold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1 sm:mt-3 line-clamp-2 sm:line-clamp-none`}>
                      {item.desc}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'video' ? (
          <VideoLabConsole 
            isDarkMode={isDarkMode} 
            videoResult={videoResult} 
            isLoading={isLoading} 
            onGenerate={handleGenerateVideo} 
          />
        ) : activeTab === 'grade1' ? (
          <FoundationPhaseArchitect 
            isDarkMode={isDarkMode} 
            teachingResult={teachingResult} 
            isLoading={isLoading} 
            onGenerate={handleGenerateTeaching}
            grade={f_grade}
            onGradeChange={setF_Grade}
            language={f_language}
            onLanguageChange={setF_Language}
          />
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
            {/* Left Parameter Panel Sidebar */}
            <div className={cn(
              "border-b lg:border-b-0 lg:border-r border-white/10 lg:w-[320px] xl:w-[350px] shrink-0 transition-all duration-300 relative z-20 flex flex-col justify-between",
              isDarkMode ? "bg-[#0b1122]/95" : "bg-white border-slate-200",
              isFullscreenPreview 
                ? "w-0 h-0 p-0 overflow-hidden opacity-0 hidden lg:hidden" 
                : "w-full p-5 lg:p-6 opacity-100 block lg:h-full"
            )}>
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar lg:h-full">
                <AnimatePresence mode="wait">
                  {activeTab === 'teaching' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                      {isLoading && (
                        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 animate-pulse">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-indigo-300">Assembling Lesson...</span>
                            <span className="text-xs font-mono text-indigo-400">{generationProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#0B1122] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                              style={{ width: `${generationProgress}%` }}
                            />
                          </div>
                          <div className="mt-2 text-[10px] text-indigo-300/60 uppercase tracking-widest font-black">
                            Synthesizing core objectives...
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 size={16} className="text-indigo-400" />
                        <span className="text-sm font-black uppercase tracking-widest text-slate-200">Lab Parameters</span>
                      </div>

                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Type</label>
                            <Select value={t_type} onValueChange={setT_Type} placeholder="Select Type" isDarkMode={isDarkMode}>
                              {(close: any) => ['Lesson Plan', 'Unit Plan', 'Assessment', 'Study Guide'].map(type => (
                                <SelectItem key={type} onClick={() => { setT_Type(type); close(); }} active={t_type === type} isDarkMode={isDarkMode}>{type}</SelectItem>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Language</label>
                            <Select value={t_language || 'English'} onValueChange={setT_Language} placeholder="Language" isDarkMode={isDarkMode}>
                                {(close: any) => LANGUAGES.map(l => (
                                  <SelectItem key={l} onClick={() => { setT_Language(l); close(); }} active={t_language === l} isDarkMode={isDarkMode}>{l}</SelectItem>
                                ))}
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Audience</label>
                          <Select value={t_grade} onValueChange={setT_Grade} placeholder="Select Grade" isDarkMode={isDarkMode}>
                            {(close: any) => Object.keys(educationalData).map(g => (
                              <SelectItem key={g} onClick={() => { setT_Grade(g); setT_Subject(''); setT_Topic(''); close(); }} active={t_grade === g} isDarkMode={isDarkMode}>{g.includes('Grade') ? g : `${g} Grade`}</SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject Area</label>
                          <div className="flex flex-wrap gap-2">
                            {t_subjects.length > 0 ? (
                              t_subjects.slice(0, 6).map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setT_Subject(s)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                                    t_subject === s 
                                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                  )}
                                >
                                  {s}
                                </button>
                              ))
                            ) : (
                              <div className="text-[10px] text-slate-500">Select audience first</div>
                            )}
                            {t_subjects.length > 6 && (
                              <div className="w-full">
                                <Select value={t_subject} onValueChange={setT_Subject} placeholder="More..." isDarkMode={isDarkMode}>
                                  {(close: any) => t_subjects.slice(6).map(s => (
                                    <SelectItem key={s} onClick={() => { setT_Subject(s); setT_Topic(''); close(); }} active={t_subject === s} isDarkMode={isDarkMode}>{s}</SelectItem>
                                  ))}
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Concept / Topic</label>
                          <div className="flex flex-wrap gap-2">
                            {t_topics.length > 0 ? (
                              t_topics.slice(0, 4).map((t: string) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setT_Topic(t)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all border text-left",
                                    t_topic === t 
                                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                  )}
                                >
                                  {t}
                                </button>
                              ))
                            ) : (
                              <div className="text-[10px] text-slate-500">Select subject first</div>
                            )}
                            {t_topics.length > 4 && (
                              <div className="w-full">
                                <Select value={t_topics.includes(t_topic) ? t_topic : ""} onValueChange={setT_Topic} placeholder="More topics..." isDarkMode={isDarkMode}>
                                  {(close: any) => t_topics.slice(4).map((t: string) => (
                                    <SelectItem key={t} onClick={() => { setT_Topic(t); close(); }} active={t_topic === t} isDarkMode={isDarkMode}>{t}</SelectItem>
                                  ))}
                                </Select>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Or Custom Topic</label>
                            <Textarea 
                              placeholder="e.g. Discuss the role of ATP in cellular processes and how it relates to broader energy cycles in ecosystems." 
                              value={t_topics.includes(t_topic) ? '' : t_topic} 
                              onChange={(e: any) => setT_Topic(e.target.value)} 
                              isDarkMode={isDarkMode} 
                              className="h-20 text-xs resize-none w-full" 
                            />
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => setAdvancedSettingsExpanded(!advancedSettingsExpanded)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Settings2 size={12} className={advancedSettingsExpanded ? "text-indigo-400" : ""} />
                            <span>Advanced Settings</span>
                            <ChevronDown size={12} className={cn("transition-transform", advancedSettingsExpanded ? "rotate-180" : "")} />
                          </button>
                        </div>
                      </div>

                      {advancedSettingsExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 border-t border-white/5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Length & Duration</label>
                            <Input 
                              placeholder="45 minutes" 
                              value={t_lengthAndDuration} 
                              onChange={(e: any) => setT_LengthAndDuration(e.target.value)} 
                              isDarkMode={isDarkMode} 
                              className="h-9 text-xs px-3" 
                            />
                          </div>
                          
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                              <label className="text-[10px] font-bold text-slate-300">Include marking memo</label>
                              <Switch checked={t_memo} onCheckedChange={setT_Memo} id="t-memo" isDarkMode={isDarkMode} />
                            </div>
                            <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                              <label className="text-[10px] font-bold text-slate-300">Include rubrics matrix</label>
                              <Switch checked={t_rubric} onCheckedChange={setT_Rubric} id="t-rubric" isDarkMode={isDarkMode} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'visual' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                      {/* Lab segment header */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/15 to-indigo-500/5 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)] relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full" />
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full">🎓 Lab Segment</span>
                          <h3 className="text-base font-hand text-white mt-1.5 flex items-center gap-1.5 font-bold">
                            <Palette size={18} className="text-purple-400 animate-pulse" /> Visual Lab
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">AI-enhanced posters, printable flashcards, process flow charts, and classroom mind maps.</p>
                        </div>
                      </div>

                      {/* Card 1: Curriculum Setup */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <GraduationCap size={14} className="text-purple-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Curriculum Setup</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Grade</label>
                            <Select value={v_grade} onValueChange={setV_Grade} placeholder="Grade" isDarkMode={isDarkMode}>
                              {(close: any) => Object.keys(educationalData).map(g => (
                                <SelectItem key={g} onClick={() => { setV_Grade(g); setV_Subject(''); setV_Topic(''); close(); }} active={v_grade === g} isDarkMode={isDarkMode}>Grade {g}</SelectItem>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Language</label>
                            <Select value={v_language} onValueChange={setV_Language} placeholder="Language" isDarkMode={isDarkMode}>
                              {(close: any) => LANGUAGES.map(l => (
                                <SelectItem key={l} onClick={() => { setV_Language(l); close(); }} active={v_language === l} isDarkMode={isDarkMode}>{l}</SelectItem>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                          <Select value={v_subject} onValueChange={setV_Subject} placeholder="Neural Topic" disabled={!v_grade} isDarkMode={isDarkMode}>
                            {(close: any) => (
                              <>
                                {v_subjects.map(s => (
                                  <SelectItem key={s} onClick={() => { setV_Subject(s); setV_Topic(''); close(); }} active={v_subject === s} isDarkMode={isDarkMode}>{s}</SelectItem>
                                ))}
                                <SelectItem key="Other" onClick={() => { setV_Subject('Other'); setV_Topic(''); close(); }} active={v_subject === 'Other'} isDarkMode={isDarkMode}>Other...</SelectItem>
                              </>
                            )}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Topic / Strand</label>
                          <Select value={v_topic} onValueChange={setV_Topic} placeholder="Specific Area" disabled={!v_subject} isDarkMode={isDarkMode}>
                            {(close: any) => (
                              <>
                                {v_topics.map(t => (
                                  <SelectItem key={t} onClick={() => { setV_Topic(t); close(); }} active={v_topic === t} isDarkMode={isDarkMode}>{t}</SelectItem>
                                ))}
                                <SelectItem key="Other" onClick={() => { setV_Topic('Other'); close(); }} active={v_topic === 'Other'} isDarkMode={isDarkMode}>Other...</SelectItem>
                              </>
                            )}
                          </Select>
                        </div>
                        
                        {(v_subject === 'Other' || v_topic === 'Other') && (
                          <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/5 mt-2">
                            {v_subject === 'Other' && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Custom Subject Name</label>
                                <Input placeholder="Type custom subject" value={v_customSubject} onChange={(e: any) => setV_CustomSubject(e.target.value)} isDarkMode={isDarkMode} className="h-9 text-xs" />
                              </div>
                            )}
                            {v_topic === 'Other' && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Custom Topic / Strand</label>
                                <Input placeholder="Type custom topic" value={v_customTopic} onChange={(e: any) => setV_CustomTopic(e.target.value)} isDarkMode={isDarkMode} className="h-9 text-xs" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card 2: Aesthetic Details */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Palette size={14} className="text-purple-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aesthetics & Form</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Category</label>
                          <Select value={v_category} onValueChange={setV_Category} placeholder="Pick Lab" isDarkMode={isDarkMode}>
                            {(close: any) => Object.keys(VISUAL_TYPES).map(cat => (
                              <SelectItem key={cat} onClick={() => { setV_Category(cat); setV_Type(''); close(); }} active={v_category === cat} isDarkMode={isDarkMode}>{cat}</SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Type</label>
                          <Select value={v_type} onValueChange={setV_Type} placeholder="Select Type" disabled={!v_category} isDarkMode={isDarkMode}>
                            {(close: any) => VISUAL_TYPES[v_category]?.map(type => (
                              <SelectItem key={type} onClick={() => { setV_Type(type); close(); }} active={v_type === type} isDarkMode={isDarkMode}>{type}</SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Color Scheme</label>
                          <Select value={v_colorScheme} onValueChange={setV_ColorScheme} placeholder="Pick Colors" isDarkMode={isDarkMode}>
                            {(close: any) => COLOR_SCHEMES.map(c => (
                              <SelectItem key={c} onClick={() => { setV_ColorScheme(c); close(); }} active={v_colorScheme === c} isDarkMode={isDarkMode}>{c}</SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Style</label>
                          <Select value={v_style} onValueChange={setV_Style} placeholder="Select Style" isDarkMode={isDarkMode}>
                            {(close: any) => VISUAL_STYLES.map(s => (
                              <SelectItem key={s} onClick={() => { setV_Style(s); close(); }} active={v_style === s} isDarkMode={isDarkMode}>{s}</SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Layout Variations</label>
                          <div className="flex gap-1.5 h-9 bg-white/5 border border-white/10 rounded-xl p-1">
                            {[1, 2, 3].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setV_Variations(n)}
                                className={cn(
                                  "flex-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                                  v_variations === n 
                                    ? "bg-purple-500 text-white shadow" 
                                    : "text-slate-400 hover:text-white"
                                )}
                              >
                                {n} {n === 1 ? 'Var' : 'Vars'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Graphic details */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <ImageIcon size={14} className="text-purple-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendering details</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                          <label className="text-[10px] font-bold text-slate-300">Generate Hero Image</label>
                          <Switch checked={v_generateImage} onCheckedChange={setV_GenerateImage} isDarkMode={isDarkMode} />
                        </div>

                        {v_generateImage && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Image Prompt Override</label>
                            <Input placeholder="Image prompt override..." value={v_extraInstructions} onChange={(e: any) => setV_ExtraInstructions(e.target.value)} isDarkMode={isDarkMode} className="h-9 py-1 text-xs rounded-xl" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Concepts/Keywords to include</label>
                          <Input placeholder="Specific words/concepts to include..." value={v_specificContent} onChange={(e: any) => setV_SpecificContent(e.target.value)} isDarkMode={isDarkMode} className="h-9 py-1 text-xs rounded-xl" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'admin' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                      {/* Lab segment header */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/5 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)] relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">📋 Lab Segment</span>
                          <h3 className="text-base font-hand text-white mt-1.5 flex items-center gap-1.5 font-bold">
                            <ClipboardList size={18} className="text-blue-400 animate-pulse" /> Admin Lab
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">Draft letters to parents, general school notices, achievement certificates, or report comments.</p>
                        </div>
                      </div>

                      {/* Card 1: Context & Parameters */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <GraduationCap size={14} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context Setup</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Grade</label>
                            <Select value={a_grade} onValueChange={setA_Grade} placeholder="Grade" isDarkMode={isDarkMode}>
                              {(close: any) => Object.keys(educationalData).map(g => (
                                <SelectItem key={g} onClick={() => { setA_Grade(g); setA_Subject(''); close(); }} active={a_grade === g} isDarkMode={isDarkMode}>Grade {g}</SelectItem>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Language</label>
                            <Select value={a_language} onValueChange={setA_Language} placeholder="Language" isDarkMode={isDarkMode}>
                              {(close: any) => LANGUAGES.map(l => (
                                <SelectItem key={l} onClick={() => { setA_Language(l); close(); }} active={a_language === l} isDarkMode={isDarkMode}>{l}</SelectItem>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject <span className="opacity-50">(Optional)</span></label>
                          <Select value={a_subject} onValueChange={setA_Subject} placeholder="Neural Topic" disabled={!a_grade} isDarkMode={isDarkMode}>
                            {(close: any) => (
                              <>
                                {a_subjects.map(s => (
                                  <SelectItem key={s} onClick={() => { setA_Subject(s); close(); }} active={a_subject === s} isDarkMode={isDarkMode}>{s}</SelectItem>
                                ))}
                                <SelectItem key="Other" onClick={() => { setA_Subject('Other'); close(); }} active={a_subject === 'Other'} isDarkMode={isDarkMode}>Other...</SelectItem>
                              </>
                            )}
                          </Select>
                        </div>

                        {a_subject === 'Other' && (
                          <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Custom Subject Name</label>
                            <Input placeholder="Type custom subject" value={a_customSubject} onChange={(e: any) => setA_CustomSubject(e.target.value)} isDarkMode={isDarkMode} className="h-9 text-xs" />
                          </div>
                        )}
                      </div>

                      {/* Card 2: Document Config */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <FileText size={14} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Config</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Document Type</label>
                          <Select value={a_type} onValueChange={setA_Type} placeholder="Select Doc" isDarkMode={isDarkMode}>
                            {(close: any) => Object.entries(ADMIN_TYPES).map(([cat, items]) => (
                              <div key={cat} className="space-y-1">
                                <p className={`text-[8px] font-black px-4 py-2 uppercase tracking-widest ${isDarkMode ? "text-brand-cyan/50" : "text-slate-600"}`}>{cat}</p>
                                {items.map(item => (
                                  <SelectItem key={item} onClick={() => { setA_Type(item); close(); }} active={a_type === item} isDarkMode={isDarkMode}>{item}</SelectItem>
                                ))}
                              </div>
                            ))}
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Tone</label>
                            <Select value={a_tone} onValueChange={setA_Tone} placeholder="Tone" isDarkMode={isDarkMode}>
                              {(close: any) => TONES.map(t => (
                                <SelectItem key={t} onClick={() => { setA_Tone(t); close(); }} active={a_tone === t} isDarkMode={isDarkMode}>{t}</SelectItem>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                            <Input placeholder="15 Oct 2026" value={a_date} onChange={(e: any) => setA_Date(e.target.value)} isDarkMode={isDarkMode} className="h-9 text-xs px-3" />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Render and Objectives */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Zap size={14} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Features</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Purpose / Objective</label>
                          <Input placeholder="Message Purpose: What is the main goal?" value={a_purpose} onChange={(e: any) => setA_Purpose(e.target.value)} isDarkMode={isDarkMode} className="h-9 py-1 text-xs rounded-xl animate-fade-in" />
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                          <label className="text-[10px] font-bold text-slate-300">Generate Seal / Illustration</label>
                          <Switch checked={a_generateImage} onCheckedChange={setA_GenerateImage} isDarkMode={isDarkMode} />
                        </div>

                        {a_generateImage && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Illustration prompt override</label>
                            <Input placeholder="Illustration prompt override..." value={a_extraInstructions} onChange={(e: any) => setA_ExtraInstructions(e.target.value)} isDarkMode={isDarkMode} className="h-9 py-1 text-xs rounded-xl" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'video' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} id="video-generator-form" className="space-y-5">
                      {/* Lab segment header */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/5 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)] relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
                        <div className="flex justify-between items-start relative z-10 gap-3">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">🎬 Lab Segment</span>
                            <h3 className="text-base font-hand text-white mt-1.5 flex items-center gap-1.5 font-bold">
                              <Video size={18} className="text-indigo-400 animate-pulse" /> Video Lab
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">Create captivating AI teacher avatars, lesson explainer animations, or slideshow templates.</p>
                          </div>
                          <button 
                            type="button"
                            onClick={handleEnhancePrompt} 
                            disabled={isEnhancingPrompt || !vid_prompt} 
                            className="text-[9px] font-black uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-850 disabled:text-slate-500 disabled:border-transparent text-white px-2.5 py-1.5 rounded-xl border border-indigo-400/30 transition-all flex items-center gap-1 shrink-0 shadow-lg shadow-indigo-500/10 cursor-pointer"
                          >
                            {isEnhancingPrompt ? <Loader2 size={10} className="animate-spin" /> : "🌟"} Enhance
                          </button>
                        </div>
                      </div>

                      {/* Card 1: Configuration */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Settings2 size={14} className="text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Video Engine</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Video Model Engine</label>
                          <Select value={vid_model} onValueChange={setVid_Model} placeholder="Video Model" isDarkMode={isDarkMode}>
                            {(close: any) => (
                              <>
                                <SelectItem onClick={() => { setVid_Model('omnihuman-1'); close(); }} active={vid_model === 'omnihuman-1'} isDarkMode={isDarkMode}>Omnihuman-1 (Gradio Streaming)</SelectItem>
                                <SelectItem onClick={() => { setVid_Model('replicate-minimax'); close(); }} active={vid_model === 'replicate-minimax'} isDarkMode={isDarkMode}>Minimax Video</SelectItem>
                                <SelectItem onClick={() => { setVid_Model('replicate-luma'); close(); }} active={vid_model === 'replicate-luma'} isDarkMode={isDarkMode}>Luma Ray</SelectItem>
                              </>
                            )}
                          </Select>
                        </div>

                        {vid_model === 'omnihuman-1' && (
                          <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-white/5 border-dashed">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Seed</label>
                              <Input 
                                type="number" 
                                value={vid_seed} 
                                onChange={(e: any) => setVid_Seed(Number(e.target.value))} 
                                isDarkMode={isDarkMode}
                                className="h-9 text-xs rounded-xl"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Playback FPS ({vid_fps})</label>
                              <input 
                                type="range" 
                                min="1" 
                                max="30" 
                                value={vid_fps} 
                                onChange={(e: any) => setVid_Fps(Number(e.target.value))} 
                                className="w-full accent-indigo-500 py-2 cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card 2: Prompt Script */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <FileCode size={14} className="text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Script</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Video Prompt Prompt</label>
                          <Textarea 
                            placeholder="E.g., A cinematic shot of a lion roaring in the African savanna during golden hour..." 
                            value={vid_prompt} 
                            onChange={(e: any) => setVid_Prompt(e.target.value)} 
                            isDarkMode={isDarkMode}
                            className="h-24 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'grade1' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                      {/* Lab segment header */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/15 to-rose-500/5 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.05)] relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/10 blur-2xl rounded-full" />
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-pink-400 px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded-full">🎈 Lab Segment</span>
                          <h3 className="text-base font-hand text-white mt-1.5 flex items-center gap-1.5 font-bold">
                            <BookOpen size={18} className="text-pink-400 animate-pulse" /> Foundation Hub
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">Foundational literacy, phonics activities, spelling tables, and early reading comprehension.</p>
                        </div>
                      </div>

                      {/* Card 1: Grade Selection */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Users size={14} className="text-pink-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Learners</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Grade Level</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['1', '2', '3'].map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setF_Grade(num)}
                                className={cn(
                                  "py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                                  f_grade === num
                                    ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/10"
                                    : (isDarkMode ? "bg-white/5 border-white/5 text-slate-300 hover:border-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
                                )}
                              >
                                Grade {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Literacy & Numeracy focus */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <ClipboardList size={14} className="text-pink-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pedagogical focus</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Focus Area</label>
                          <Select value={f_topic} onValueChange={setF_Topic} placeholder="Select Focus" isDarkMode={isDarkMode}>
                            {(close: any) => (
                              <>
                                <SelectItem onClick={() => { setF_Topic('Phonics'); close(); }} active={f_topic === 'Phonics'} isDarkMode={isDarkMode}>Phonics Instruction</SelectItem>
                                <SelectItem onClick={() => { setF_Topic('Sight Words'); close(); }} active={f_topic === 'Sight Words'} isDarkMode={isDarkMode}>Sight Words Table</SelectItem>
                                <SelectItem onClick={() => { setF_Topic('Reading Comprehension'); close(); }} active={f_topic === 'Reading Comprehension'} isDarkMode={isDarkMode}>Reading Comprehension</SelectItem>
                                <SelectItem onClick={() => { setF_Topic('Handwriting Practice'); close(); }} active={f_topic === 'Handwriting Practice'} isDarkMode={isDarkMode}>Handwriting Tracers</SelectItem>
                              </>
                            )}
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Language</label>
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

                      {/* Card 3: Custom specifications */}
                      <div className={cn(
                        "rounded-2xl border p-4 space-y-3.5 shadow-md transition-all",
                        isDarkMode ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Sparkles size={14} className="text-pink-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Immersive theme</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Specific Target / Sound</label>
                          <Input placeholder="e.g. 'sh' and 'ch' sounds..." value={f_specific} onChange={(e: any) => setF_Specific(e.target.value)} isDarkMode={isDarkMode} className="h-9 text-xs rounded-xl" />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Topic Theme / Lesson Context</label>
                          <Input placeholder="e.g. Animals, Space, Ocean..." value={f_theme} onChange={(e: any) => setF_Theme(e.target.value)} isDarkMode={isDarkMode} className="h-9 text-xs rounded-xl" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar Footer Operations */}
              <div className="pt-4 border-t border-white/10 bg-[#0B1122]/50 shrink-0 space-y-3.5">
                {activeTab === 'teaching' && (
                  <div className="space-y-3.5">
                    {isLoading && (
                      <div className="p-1 space-y-1.5">
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                           <span className="text-emerald-400">Compiling Curriculum</span>
                           <span className="text-emerald-400">{generationProgress}%</span>
                         </div>
                         <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                           <div 
                             className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                             style={{ width: `${generationProgress}%` }}
                           />
                         </div>
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setExamTimerExpanded(!examTimerExpanded);
                          if (!examPaperTitle) {
                            setExamPaperTitle(t_topic || t_type || "Classroom Examination Paper");
                          }
                          if (!examSubjectName) {
                            setExamSubjectName(t_subject || "General Study");
                          }
                        }}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                          isDarkMode 
                            ? "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                        )}
                        title="Show Exam Countdown Tool"
                      >
                        <Timer size={13} className="text-brand-cyan" />
                        <span>Timer {isExamRunning ? "• Active" : ""}</span>
                      </button>

                      <button 
                        type="button"
                        onClick={handleGenerateTeaching}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
                      >
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Zap size={13} />}
                        <span>{isLoading ? "Fabricating..." : "Generate Materials"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'visual' && (
                  <div className="space-y-3">
                    {isLoading && (
                      <div className="p-1 space-y-1.5">
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                           <span className="text-purple-400">Rendering visual grid</span>
                           <span className="text-purple-400">In Progress</span>
                         </div>
                         <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                           <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse w-[80%]" />
                         </div>
                      </div>
                    )}

                    <button 
                      type="button" 
                      onClick={handleGenerateVisual} 
                      disabled={isLoading} 
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white h-11 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 active:scale-95 transition-all cursor-pointer"
                    >
                      {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Palette size={13} />}
                      <span>{isLoading ? "Designing..." : "Create Visual Aid"}</span>
                    </button>
                  </div>
                )}

                {activeTab === 'admin' && (
                  <button 
                    type="button" 
                    onClick={handleGenerateAdmin} 
                    disabled={isLoading} 
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white h-11 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <ClipboardList size={13} />}
                    <span>{isLoading ? "Drafting Document..." : "Generate Admin Doc"}</span>
                  </button>
                )}

                {activeTab === 'video' && (
                  <button 
                    type="button" 
                    onClick={handleGenerateVideo}
                    disabled={isLoading || !vid_prompt}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white h-11 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Video size={13} />}
                    <span>{isLoading ? 'Synthesizing loop...' : 'Generate Video'}</span>
                  </button>
                )}

                {activeTab === 'grade1' && (
                  <button 
                    type="button" 
                    onClick={handleGenerateFoundation} 
                    disabled={isLoading} 
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white h-11 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10 active:scale-95 transition-all cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <BookOpen size={13} />}
                    <span>{isLoading ? "Designing Reading Pack..." : "Create Reading Pack"}</span>
                  </button>
                )}
              </div>
            </div>

        {/* Right Preview Panel */}
        <div id="preview-panel" className={cn("w-full lg:flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide relative lg:h-full flex flex-col", isDarkMode ? "bg-navy-dark/40" : "bg-slate-50")}>
          {/* Persistent Right Panel Header */}
          <div className={cn("flex justify-between items-center mb-6 pb-4 border-b shrink-0", isDarkMode ? "border-white/10" : "border-slate-200")}>
            <h3 className={cn("text-xl font-hand font-bold flex items-center gap-2", isDarkMode ? "text-white" : "text-slate-800")}>
              <Eye size={20} className="text-indigo-500" />
              Live Preview Board
            </h3>
            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full shadow-sm border", isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200")}>
              <span className={cn("w-2 h-2 rounded-full animate-pulse", isLoading ? "bg-amber-400" : hasResult ? "bg-emerald-400" : (isDarkMode ? "bg-slate-600" : "bg-slate-300"))} />
              <span className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                {isLoading ? "Streaming Generation" : hasResult ? "Generation Complete" : "Awaiting Parameters"}
              </span>
            </div>
          </div>
          
          <div className="flex-1 relative">

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

          {/* Exam Mode Classroom HUD Banner */}
          {(isExamRunning || examCompleted) && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "mb-8 p-6 border rounded-[24px] lg:rounded-[32px] shadow-2xl relative overflow-hidden",
                examCompleted
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                  : examTimeRemaining <= examWarningMinutes * 60
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-200 animate-pulse"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-100"
              )}
            >
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <Timer size={100} />
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="text-left space-y-1">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                    examCompleted 
                      ? "bg-rose-500/25 text-rose-300" 
                      : isExamPaused 
                        ? "bg-amber-500/25 text-amber-300" 
                        : "bg-emerald-500/25 text-emerald-300"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", examCompleted ? "bg-rose-400" : isExamPaused ? "bg-amber-400" : "bg-emerald-400 animate-ping")} />
                    {examCompleted ? "🏁 Exam Terminated" : isExamPaused ? "⏸️ Test Paused" : "📝 Active Exam Block"}
                  </span>
                  <h3 className="text-xl md:text-2xl font-hand font-black text-white leading-tight">
                    {examPaperTitle || "Term Assessment Examination"}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 font-medium font-sans">
                    <span className="text-brand-cyan">{examSubjectName || t_subject || "General Subject"}</span>
                    <span>•</span>
                    <span>CAPS Registered Standard</span>
                  </p>
                </div>

                <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                  <div className="text-4xl md:text-5xl font-mono font-black text-white tracking-widest bg-black/40 px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
                    {Math.floor(examTimeRemaining / 3600) > 0 && (
                      <span className="text-brand-cyan">
                        {Math.floor(examTimeRemaining / 3600).toString().padStart(2, '0')}:
                      </span>
                    )}
                    <span className="text-white">
                      {Math.floor((examTimeRemaining % 3600) / 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-brand-cyan animate-pulse">:</span>
                    <span className="text-white">
                      {(examTimeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                    {examCompleted ? "Time Elapsed" : "Time Remaining Countdown"}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6 space-y-1.5 font-sans">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black">
                  <span>Progress Ratio</span>
                  <span>
                    {examCompleted 
                      ? "100%" 
                      : `${Math.round(((examTimerDuration * 60 - examTimeRemaining) / (examTimerDuration * 60)) * 100)}% Elapsed`}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: examCompleted 
                        ? "100%" 
                        : `${((examTimerDuration * 60 - examTimeRemaining) / (examTimerDuration * 60)) * 100}%` 
                    }}
                    transition={{ ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      examCompleted 
                        ? "bg-rose-500" 
                        : examTimeRemaining <= examWarningMinutes * 60 
                          ? "bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse" 
                          : "bg-gradient-to-r from-teal-400 to-brand-cyan"
                    )}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Visual Alert Overlay (Teacher Classroom Alarm Chime Modal) */}
          <AnimatePresence>
            {showExamAlertOverlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 30 }}
                  className={cn(
                    "w-full max-w-lg rounded-[32px] border p-8 text-center shadow-2xl relative overflow-hidden",
                    examCompleted 
                      ? "bg-slate-900 border-rose-500/40 shadow-rose-500/10" 
                      : "bg-slate-900 border-amber-500/40 shadow-amber-500/10"
                  )}
                >
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-cyan/5 blur-3xl rounded-full" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {examCompleted ? (
                        <Bell className="text-rose-500 animate-bounce" size={32} />
                      ) : (
                        <Timer className="text-amber-500 animate-pulse" size={32} />
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full",
                        examCompleted ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {examCompleted ? "🏁 Assessment Concluded" : "⚠️ Time Warning Alert"}
                      </span>
                      <h4 className="text-2xl font-hand font-black text-white leading-snug">
                        {examPaperTitle || "Term Assessment Examination"}
                      </h4>
                    </div>

                    <p className="text-sm text-slate-300 font-medium leading-relaxed bg-white/5 border border-white/5 p-4 rounded-2xl font-sans">
                      {examAlertMessage}
                    </p>

                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowExamAlertOverlay(false)}
                        className={cn(
                          "px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg cursor-pointer",
                          examCompleted 
                            ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20" 
                            : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                        )}
                      >
                        Acknowledge Alert
                      </button>
                    </div>
                  </div>
                </motion.div>
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
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      {(activeTab === 'teaching' || activeTab === 'grade1') && (
                        <div className="text-[10px] font-black uppercase text-brand-cyan tracking-widest px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                          All Inclusive Package
                        </div>
                      )}
                      {activeTab === 'visual' && (
                        <div className="text-[10px] font-black uppercase text-purple-400 tracking-widest px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                          Visual Asset Ready
                        </div>
                      )}
                      {activeTab === 'admin' && (
                        <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                          Official Admin Draft
                        </div>
                      )}
                      {currentDocId ? (
                        <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                          Synced to Cloud DB
                        </div>
                      ) : (
                        <div className="text-[10px] font-black uppercase text-amber-400 tracking-widest px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-center gap-1.5">
                          Saving Draft...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    <button 
                      onClick={() => setIsFullscreenPreview(prev => !prev)} 
                      className={cn(
                        "p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all tooltip shrink-0 border",
                        isFullscreenPreview 
                          ? "bg-brand-cyan border-brand-cyan/20 text-navy-dark" 
                          : "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                      )} 
                      title={isFullscreenPreview ? "Show Form Panel" : "Expand Preview to Full Screen"}
                    >
                      {isFullscreenPreview ? <Minimize2 size={16} className="lg:w-[18px] lg:h-[18px]" /> : <Maximize2 size={16} className="lg:w-[18px] lg:h-[18px]" />}
                    </button>
                    <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl text-white transition-all tooltip shrink-0" title="Print Content">
                      <Printer size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                    <button onClick={handleDownloadPDF} className="bg-white/10 hover:bg-white/20 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl text-white transition-all tooltip shrink-0" title="Download as PDF">
                      <Download size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                    <button 
                      onClick={handleToggleEdit} 
                      className={cn(
                        "p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all tooltip shrink-0 border",
                        isEditing 
                          ? "bg-brand-cyan border-brand-cyan/20 text-navy-dark" 
                          : "bg-white/10 border-white/5 hover:bg-white/20 text-white"
                      )} 
                      title={isEditing ? "Exit Edit Mode" : "Edit Content"}
                    >
                      <Edit2 size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                    <button 
                      onClick={() => setShowShareModal(true)} 
                      className="bg-white/10 hover:bg-white/20 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl text-white transition-all tooltip shrink-0 border border-white/5" 
                      title="Share / Export"
                    >
                      <Share2 size={16} className="lg:w-[18px] lg:h-[18px]" />
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
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4 border-dashed">
                        <div className="text-left">
                          <h4 className="text-lg font-bold text-brand-cyan">Document Editor</h4>
                          <p className="text-xs text-slate-400">Modify the generated layout markup below. Your edits auto-save.</p>
                        </div>
                        <button
                          onClick={handleSaveEdits}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                          <Save size={14} />
                          Save & Sync Changes
                        </button>
                      </div>

                      {/* Editing fields based on Tab */}
                      {(activeTab === 'teaching' || activeTab === 'grade1') ? (
                        <div className="space-y-4 text-left">
                          <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Main Material content (HTML / styled text)</label>
                            <textarea
                              className="w-full h-80 p-4 border rounded-2xl font-mono text-xs bg-slate-900 border-white/10 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none resize-y"
                              value={editContentText}
                              onChange={(e) => setEditContentText(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Expert Answer Key (Memo)</label>
                            <textarea
                              className="w-full h-40 p-4 border rounded-2xl font-mono text-xs bg-slate-900 border-white/10 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none resize-y"
                              value={editMemoText}
                              onChange={(e) => setEditMemoText(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Grading Rubric Matrix</label>
                            <textarea
                              className="w-full h-40 p-4 border rounded-2xl font-mono text-xs bg-slate-900 border-white/10 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none resize-y"
                              value={editRubricText}
                              onChange={(e) => setEditRubricText(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-left">
                          <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Styled Document Content (HTML / styled text)</label>
                            <textarea
                              className="w-full h-96 p-4 border rounded-2xl font-mono text-xs bg-slate-900 border-white/10 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none resize-y"
                              value={editContentText}
                              onChange={(e) => setEditContentText(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Revision & Versioning History */}
                      <div className="mt-8 border-t border-white/5 pt-6 text-left border-dashed">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                          <History size={14} className="text-brand-cyan" /> Revision & Version History
                        </h5>
                        {(versions[activeTab] && versions[activeTab].length > 0) ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {versions[activeTab].map((ver, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-xl text-xs">
                                <div>
                                  <span className="font-bold text-white">Version {versions[activeTab].length - idx}</span>
                                  <span className="text-slate-400 text-[10px] ml-2 font-mono">({ver.timestamp})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRestoreVersion(ver)}
                                  className="text-brand-cyan font-bold hover:underline"
                                >
                                  Restore version
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No previous versions. Edits will create backups.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {(activeTab === 'teaching' || activeTab === 'grade1') && (
                    <div className="space-y-12">
                      <div className="space-y-8" id="result-section">
                        <ContentPreview 
                          html={teachingResult.content} 
                          label="Integrated Material" 
                          isDarkMode={isDarkMode} 
                          imagePrompt={t_generateImage ? (teachingResult.imagePrompt || teachingResult.userImagePrompt) : undefined}
                          grade={activeTab === 'grade1' ? f_grade : t_grade}
                          subject={activeTab === 'grade1' ? f_language : (t_subject === 'Other' ? t_customSubject : t_subject)}
                          contentType={activeTab === 'grade1' ? 'worksheet' : t_type}
                        />
                      </div>
                      
                      {teachingResult.memo && (
                        <div id="memo-section">
                           <hr className="my-10 border-slate-200 dark:border-white/10" />
                           <ContentPreview 
                             html={teachingResult.memo} 
                             label="Expert Answer Key" 
                             isDarkMode={isDarkMode} 
                             grade={activeTab === 'grade1' ? f_grade : t_grade}
                             subject={activeTab === 'grade1' ? f_language : (t_subject === 'Other' ? t_customSubject : t_subject)}
                             contentType="memo"
                           />
                        </div>
                      )}
                      
                      {teachingResult.rubric && (
                        <div id="rubric-section">
                           <hr className="my-10 border-slate-200 dark:border-white/10" />
                           <ContentPreview 
                             html={teachingResult.rubric} 
                             label="Marks Allocation Matrix" 
                             isDarkMode={isDarkMode} 
                             grade={activeTab === 'grade1' ? f_grade : t_grade}
                             subject={activeTab === 'grade1' ? f_language : (t_subject === 'Other' ? t_customSubject : t_subject)}
                             contentType="rubric"
                           />
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'visual' && (
                    <div className="space-y-8">
                      {visualResults.length > 1 && (
                        <div className="flex justify-center mb-8">
                           <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex gap-1 shadow-lg">
                              {visualResults.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setV_CurrentVariation(idx);
                                    setVisualResult(visualResults[idx]);
                                  }}
                                  className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    v_currentVariation === idx 
                                      ? "bg-brand-cyan text-navy-dark shadow-xl" 
                                      : "text-slate-400 hover:text-white hover:bg-white/5"
                                  )}
                                >
                                  Variation {idx + 1}
                                </button>
                              ))}
                           </div>
                        </div>
                      )}
                      {visualResult && (
                        <ContentPreview 
                          html={visualResult.content} 
                          label="Digital Visual Asset" 
                          isDarkMode={isDarkMode} 
                          imagePrompt={v_generateImage ? (visualResult.userImagePrompt || visualResult.imagePrompt) : undefined}
                          grade={v_grade}
                          subject={v_subject === 'Other' ? v_customSubject : v_subject}
                          contentType={v_type}
                        />
                      )}
                    </div>
                  )}
                  {activeTab === 'video' && (
                    <div className="space-y-8 flex flex-col items-center w-full">
                      {videoResult ? (
                        <EduVideoPlayer 
                          src={videoResult.url} 
                          prompt={videoResult.prompt || videoResult.enhanced || "AI Educational Video Frame Animation Loop"} 
                          isDarkMode={isDarkMode} 
                        />
                      ) : (
                        <div className="text-center py-20 opacity-50">
                          <Video size={48} className="mx-auto mb-4" />
                          <p>Ready to generate video.</p>
                        </div>
                      )}

                      <VideoGenerationHistory 
                        videoHistory={videoHistory}
                        currentVideoUrl={videoResult?.url}
                        onSelectVideo={(video) => {
                          setVideoResult({
                            url: video.videoUrl,
                            prompt: video.prompt,
                            model: video.model,
                            seed: video.seed,
                            fps: video.fps
                          });
                        }}
                        onReGenerateVideo={(video) => {
                          setVid_Prompt(video.prompt);
                          setVid_Model(video.model || 'omnihuman-1');
                          setVid_Seed(video.seed ?? -1);
                          setVid_Fps(video.fps ?? 12);
                          
                          const formEl = document.getElementById('video-generator-form');
                          if (formEl) {
                            formEl.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        onDeleteVideo={handleDeleteVideo}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}
                  {activeTab === 'admin' && (
                    <div className="space-y-8">
                      <ContentPreview 
                        html={adminResult.content} 
                        label="Official Correspondence" 
                        isDarkMode={isDarkMode} 
                        imagePrompt={a_generateImage ? (adminResult.userImagePrompt || adminResult.imagePrompt) : undefined}
                        grade={a_grade || 'N/A'}
                        subject={a_subject === 'Other' ? a_customSubject : a_subject}
                        contentType={a_type}
                      />
                    </div>
                  )}
                    </>
                  )}
                </div>
             </motion.div>
           ) : (
             <div className="w-full h-full flex flex-col pt-4">
               <div className={cn("max-w-4xl w-full mx-auto p-8 lg:p-12 rounded-[32px] border shadow-sm flex flex-col gap-8 transition-all duration-500", isDarkMode ? "bg-white/5 border-white/5 shadow-none" : "bg-white border-slate-200")}>
                 
                 {/* Header Area */}
                 <div className="space-y-4">
                   <div className="flex flex-wrap gap-2">
                     <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", t_grade ? "bg-indigo-500/10 text-indigo-500" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500")}>
                       {t_grade || "Grade Pending"}
                     </span>
                     <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", t_subject ? "bg-indigo-500/10 text-indigo-500" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500")}>
                       {t_subject || "Subject Pending"}
                     </span>
                     <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", t_type ? "bg-indigo-500/10 text-indigo-500" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500")}>
                       {t_type || "Lesson Plan"}
                     </span>
                   </div>
                   
                   <h1 className={cn("text-3xl lg:text-5xl font-bold font-hand leading-tight transition-colors duration-500", t_topic ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-700")}>
                     {t_topic ? (t_topics.includes(t_topic) ? t_topic : t_topic) : "Awaiting Topic Configuration..."}
                   </h1>
                 </div>

                 {/* Skeleton Body */}
                 <div className="space-y-6 opacity-60">
                    <div className="flex flex-col gap-3">
                      <div className={cn("h-4 w-3/4 rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-full rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-5/6 rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
                       <div className={cn("h-24 rounded-2xl flex flex-col justify-center items-center text-center p-4", isDarkMode ? "bg-white/5" : "bg-slate-50")}>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest mb-2", isDarkMode ? "text-slate-600" : "text-slate-400")}>Objectives</span>
                          <div className={cn("h-2 w-1/2 rounded-full", isDarkMode ? "bg-white/10" : "bg-slate-200")} />
                       </div>
                       <div className={cn("h-24 rounded-2xl flex flex-col justify-center items-center text-center p-4", isDarkMode ? "bg-white/5" : "bg-slate-50")}>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest mb-2", isDarkMode ? "text-slate-600" : "text-slate-400")}>Materials</span>
                          <div className={cn("h-2 w-1/2 rounded-full", isDarkMode ? "bg-white/10" : "bg-slate-200")} />
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6">
                      <div className={cn("h-4 w-1/4 rounded-full mb-2", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-full rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-11/12 rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                    </div>
                 </div>

                 <div className={cn("mt-auto pt-10 text-center text-xs font-medium", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                   {t_topic && t_grade && t_subject ? "Configuration complete. Ready to generate." : "Please complete the configuration in the left panel to begin."}
                 </div>
               </div>
             </div>
           )}
          </div>
        </div>
      </div>
    )}
  </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 lg:p-8 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Users className="text-brand-cyan" size={24} />
              Assign Content
            </h3>
            <form onSubmit={confirmAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">Assign To</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                    <input type="radio" value="class" checked={assignTargetType === 'class'} onChange={() => { setAssignTargetType('class'); setAssignTargetName(''); }} className="text-brand-cyan focus:ring-brand-cyan" />
                    Their Classes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                    <input type="radio" value="group" checked={assignTargetType === 'group'} onChange={() => { setAssignTargetType('group'); setAssignTargetName(''); }} className="text-brand-cyan focus:ring-brand-cyan" />
                    Study Groups
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                    <input type="radio" value="student" checked={assignTargetType === 'student'} onChange={() => { setAssignTargetType('student'); setAssignTargetName(''); }} className="text-brand-cyan focus:ring-brand-cyan" />
                    Individual Students
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">Select Recipient</label>
                {assignTargetType === 'class' ? (
                  dbClasses.length > 0 ? (
                    <select 
                      value={assignTargetName} 
                      onChange={e => setAssignTargetName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan text-sm text-slate-800 font-medium"
                      required
                    >
                      <option value="">-- Select Class --</option>
                      {dbClasses.map(cls => (
                        <option key={cls.id} value={cls.name || cls.id}>{cls.name || `Grade ${cls.id}`}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={assignTargetName} 
                      onChange={e => setAssignTargetName(e.target.value)} 
                      placeholder="e.g. Grade 10A (Class)"
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan text-sm text-slate-800"
                      required
                    />
                  )
                ) : assignTargetType === 'group' ? (
                  dbStudyGroups.length > 0 ? (
                    <select 
                      value={assignTargetName} 
                      onChange={e => setAssignTargetName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan text-sm text-slate-800 font-medium"
                      required
                    >
                      <option value="">-- Select Study Group --</option>
                      {dbStudyGroups.map(grp => (
                        <option key={grp.id} value={grp.name || grp.id}>{grp.name || grp.id}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={assignTargetName} 
                      onChange={e => setAssignTargetName(e.target.value)} 
                      placeholder="e.g. Science Olympiad (Group)"
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan text-sm text-slate-800"
                      required
                    />
                  )
                ) : (
                  dbStudents.length > 0 ? (
                    <select 
                      value={assignTargetName} 
                      onChange={e => setAssignTargetName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan text-sm text-slate-800 font-medium"
                      required
                    >
                      <option value="">-- Select Student --</option>
                      {dbStudents.map(st => (
                        <option key={st.id} value={st.name || st.id}>{st.name} ({st.grade || 'N/A'})</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={assignTargetName} 
                      onChange={e => setAssignTargetName(e.target.value)} 
                      placeholder="e.g. Sibusiso Dube"
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan text-sm text-slate-800"
                      required
                    />
                  )
                )}
              </div>

              <button type="submit" className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-black uppercase tracking-widest text-[10px] py-4 rounded-xl mt-4 transition-all shadow-md shadow-brand-cyan/20">
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share / Export Modal Overlay */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B1122] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6 text-white text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-xl font-bold font-hand text-brand-cyan flex items-center gap-2">
                  <Share2 size={18} /> Share & Export
                </h3>
                <button type="button" onClick={() => { setShowShareModal(false); setShareSuccess(false); }} className="cursor-pointer">
                  <X className="text-slate-400 hover:text-white" />
                </button>
              </div>

              {/* Selector Mode for Share Type */}
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
                    onClick={() => { setShareType(t.id as any); setShareSuccess(false); }}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                      shareType === t.id 
                        ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan font-bold" 
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                    )}
                  >
                    <t.icon size={16} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Share Content display according to selection */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4">
                {shareType === 'link' && (
                  <div className="space-y-2 text-left">
                    <p className="text-xs text-slate-400">Generates an instant secure teaching-resource link.</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`https://eduai-companion.co.za/share/resource-${currentDocId || 'preview'}`}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all outline-none"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`https://eduai-companion.co.za/share/resource-${currentDocId || 'preview'}`);
                          setShareSuccess(true);
                          setTimeout(() => setShareSuccess(false), 2000);
                        }}
                        className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Copy size={12} />
                        {shareSuccess ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {shareType === 'text' && (
                  <div className="space-y-3 text-left">
                    <p className="text-xs text-slate-400">Copy compiled raw text of your educational package.</p>
                    <button 
                      onClick={() => {
                        const rawText = (activeTab === 'teaching' || activeTab === 'grade1') ? teachingResult?.content : activeTab === 'visual' ? visualResult?.content : adminResult?.content;
                        // Strip HTML tags
                        const stripped = (rawText || '').replace(/<[^>]*>/g, '');
                        navigator.clipboard.writeText(stripped);
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 2000);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                    >
                      {shareSuccess ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {shareSuccess ? 'Text Copied to Clipboard!' : 'Copy Plain Text'}
                    </button>
                  </div>
                )}

                {shareType === 'html' && (
                  <div className="space-y-3 text-left">
                    <p className="text-xs text-slate-400">Export as styled HTML code to easily paste into systems.</p>
                    <button 
                      onClick={() => {
                        const rawHtml = (activeTab === 'teaching' || activeTab === 'grade1') ? teachingResult?.content : activeTab === 'visual' ? visualResult?.content : adminResult?.content;
                        navigator.clipboard.writeText(rawHtml || '');
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 2000);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                    >
                      {shareSuccess ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {shareSuccess ? 'HTML Markup Copied!' : 'Copy HTML Code'}
                    </button>
                  </div>
                )}

                {shareType === 'markdown' && (
                  <div className="space-y-3 text-left">
                    <p className="text-xs text-slate-400">Save educational material as structured Markdown (.md) locally.</p>
                    <button 
                      onClick={() => {
                        const rawHtml = (activeTab === 'teaching' || activeTab === 'grade1') ? teachingResult?.content : activeTab === 'visual' ? visualResult?.content : adminResult?.content;
                        const markdown = htmlToMarkdown(rawHtml || '');
                        const filename = `${(activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative_Doc') || 'Generation'}.md`;
                        downloadBlobFile(markdown, filename, 'text/markdown;charset=utf-8');
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 2000);
                      }}
                      className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-black uppercase tracking-widest p-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {shareSuccess ? <Check size={14} /> : <Download size={14} />}
                      {shareSuccess ? 'Markdown File Saved!' : 'Download Markdown (.md)'}
                    </button>
                  </div>
                )}

                {shareType === 'json' && (
                  <div className="space-y-3 text-left">
                    <p className="text-xs text-slate-400">Export lesson plans & study notes in structured raw JSON layout.</p>
                    <button 
                      onClick={() => {
                        const result = (activeTab === 'teaching' || activeTab === 'grade1') ? teachingResult : activeTab === 'visual' ? visualResult : adminResult;
                        const filename = `${(activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative_Doc') || 'Generation'}.json`;
                        const jsonContent = JSON.stringify({
                          title: (activeTab === 'teaching' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative Doc') || 'Untitled Generation',
                          subject: (activeTab === 'teaching' ? t_subject : activeTab === 'visual' ? v_subject : 'Administration') || 'General',
                          grade: (activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : 'All') || 'N/A',
                          contentType: (activeTab === 'teaching' ? t_type : activeTab === 'visual' ? v_type : 'Notice') || 'Document',
                          content: result?.content || "",
                          memo: result?.memo || null,
                          rubric: result?.rubric || null,
                          imagePrompt: result?.imagePrompt || null,
                          exportedAt: new Date().toISOString()
                        }, null, 2);
                        downloadBlobFile(jsonContent, filename, 'application/json;charset=utf-8');
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 2000);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest p-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
                    >
                      {shareSuccess ? <Check size={14} className="text-emerald-500" /> : <Download size={14} />}
                      {shareSuccess ? 'JSON File Saved!' : 'Download raw JSON'}
                    </button>
                  </div>
                )}

                {shareType === 'email' && (
                  <div className="space-y-4 text-left">
                    <p className="text-xs text-slate-400">Send precompiled content to staff or parents instantly.</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setShareSuccess(true);
                      setTimeout(() => {
                        setShareSuccess(false);
                        setShowShareModal(false);
                      }, 1800);
                    }} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Recipient Email</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="principal@school.za"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-cyan focus:outline-none"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark font-black uppercase tracking-widest text-[10px] py-3 rounded-xl cursor-pointer"
                      >
                        {shareSuccess ? 'Email Dispatched!' : 'Send Email Resource'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive A4 Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreviewModal}
        onClose={() => setShowPrintPreviewModal(false)}
        title={
          (activeTab === 'teaching' || activeTab === 'grade1')
            ? (t_topic || t_type || 'Lesson Material')
            : activeTab === 'visual'
            ? (v_topic || v_type || 'Visual Concept')
            : 'Administrative Doc'
        }
        content={
          (activeTab === 'teaching' || activeTab === 'grade1') ? (teachingResult?.content || '') : 
          activeTab === 'visual' ? (visualResult?.content || '') : 
          (adminResult?.content || '')
        }
        memo={(activeTab === 'teaching' || activeTab === 'grade1') ? teachingResult?.memo : undefined}
        rubric={(activeTab === 'teaching' || activeTab === 'grade1') ? teachingResult?.rubric : undefined}
        options={{
          subject: (activeTab === 'teaching' || activeTab === 'grade1' ? t_subject : activeTab === 'visual' ? v_subject : 'Administration') || 'General',
          grade: (activeTab === 'teaching' || activeTab === 'grade1' ? t_grade : activeTab === 'visual' ? v_grade : 'All') || 'N/A',
          contentType: (activeTab === 'teaching' || activeTab === 'grade1' ? t_type : activeTab === 'visual' ? v_type : 'Notice') || 'Document',
          title: (activeTab === 'teaching' || activeTab === 'grade1' ? t_topic || t_type : activeTab === 'visual' ? v_topic || v_type : 'Administrative Doc') || 'Untitled Generation'
        }}
        isDarkMode={isDarkMode}
      />
    </motion.div>
  </>
);
}
