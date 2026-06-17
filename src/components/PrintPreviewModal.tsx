import React, { useState, useMemo, useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Info, 
  Sparkles, 
  FileText, 
  Eye, 
  Check, 
  Percent, 
  MousePointerClick, 
  Ruler,
  AlertTriangle
} from 'lucide-react';
import { printContent, downloadAsHTML, PrintOptions, removeLegacyHeader } from '../lib/printUtils';
import { replaceImagePlaceholders } from '../lib/imageReplacer';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  memo?: string;
  rubric?: string;
  options: PrintOptions;
  isDarkMode?: boolean;
}

export default function PrintPreviewModal({
  isOpen,
  onClose,
  title,
  content,
  memo,
  rubric,
  options,
  isDarkMode = true
}: PrintPreviewModalProps) {
  const [selectedSection, setSelectedSection] = useState<'content' | 'memo' | 'rubric'>('content');
  const paperRef = useRef<HTMLDivElement>(null);

  // Subject color palette coding based on our South African CAPS visual styling guidelines
  const subjectStyling = useMemo(() => {
    const s = (options.subject || "").toLowerCase();
    if (s.includes('math')) {
      return {
        gradient: "from-blue-600 to-teal-500",
        bg: "bg-blue-600",
        accent: "#2563eb",
        textColor: "text-blue-800",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-800",
        category: "Mathematics",
        icon: "﹢﹣×﹦"
      };
    } else if (s.includes('science') || s.includes('nature') || s.includes('biology') || s.includes('physics')) {
      return {
        gradient: "from-emerald-600 to-teal-700",
        bg: "bg-emerald-600",
        accent: "#059669",
        textColor: "text-emerald-800",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-800",
        category: "Natural Sciences",
        icon: "🧬🧪"
      };
    } else if (s.includes('language') || s.includes('literacy') || s.includes('english') || s.includes('afrikaans') || s.includes('isi') || s.includes('read') || s.includes('write')) {
      return {
        gradient: "from-purple-600 to-indigo-600",
        bg: "bg-purple-600",
        accent: "#7c3aed",
        textColor: "text-purple-800",
        badgeBg: "bg-purple-100",
        badgeText: "text-purple-800",
        category: "Languages & Literacy",
        icon: "📚🖋"
      };
    } else {
      return {
        gradient: "from-amber-600 to-red-600",
        bg: "bg-amber-600",
        accent: "#f97316",
        textColor: "text-amber-800",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-800",
        category: options.subject || "Life Skills",
        icon: "🎯🎨"
      };
    }
  }, [options.subject]);

  // Read current display markup based on selection and replace text placeholders with images
  const activeHTML = useMemo(() => {
    const rawHTML = selectedSection === 'memo' ? (memo || '') : selectedSection === 'rubric' ? (rubric || '') : content;
    return removeLegacyHeader(replaceImagePlaceholders(rawHTML));
  }, [selectedSection, memo, rubric, content]);

  if (!isOpen) return null;

  const handleTriggerPrint = () => {
    // Generate printed PDF with correct options
    const printTitle = `${options.title || title} - ${selectedSection.toUpperCase()}`;
    const printOptions: PrintOptions = {
      ...options,
      contentType: selectedSection === 'memo' ? 'Memorandum Key' : selectedSection === 'rubric' ? 'Assessment Rubric' : options.contentType,
      title: printTitle
    };
    printContent(paperRef, printTitle, printOptions);
  };

  const handleTriggerDownloadHTML = () => {
    const filename = `${(options.title || title).replace(/\s+/g, '_')}_${selectedSection}.html`;
    const printOptions: PrintOptions = {
      ...options,
      contentType: selectedSection === 'memo' ? 'Memorandum Key' : selectedSection === 'rubric' ? 'Assessment Rubric' : options.contentType
    };
    downloadAsHTML(paperRef, filename, printOptions);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 lg:p-10 font-sans">
      <div className={`w-full h-full max-w-7xl flex flex-col rounded-[32px] overflow-hidden border ${isDarkMode ? 'bg-[#0B1122]/98 border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)]' : 'bg-white border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)]'}`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-4 lg:p-6 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'} shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${subjectStyling.gradient} text-white font-mono text-sm flex items-center justify-center font-bold shadow-md`}>
              <Printer size={18} />
            </div>
            <div>
              <h2 className={`text-lg lg:text-xl font-display font-black leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                South African A4 Print Simulation Studio
              </h2>
              <p className={`text-[10px] font-black tracking-widest uppercase ${isDarkMode ? 'text-indigo-200/50' : 'text-slate-500'} mt-0.5`}>
                CAPS Layout & Print Verification Suite
              </p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 border ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Side-by-Side Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Interactive Controller Panel (Left Side on Desktop) */}
          <div className={`w-full md:w-[360px] lg:w-[400px] p-6 border-b md:border-b-0 md:border-r overflow-y-auto shrink-0 flex flex-col justify-between ${isDarkMode ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <div className="space-y-6">
              
              {/* Document Overview Badge */}
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <h3 className={`text-xs font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Document Properties
                </h3>
                <div className="space-y-2 text-xs font-bold font-sans">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-800/20 dark:border-white/5">
                    <span className="text-slate-400">Resource Title:</span>
                    <span className={`text-right truncate max-w-[180px] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{options.title || title}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-800/20 dark:border-white/5">
                    <span className="text-slate-400">Subject:</span>
                    <span className={`font-mono text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md ${subjectStyling.badgeBg} ${subjectStyling.badgeText}`}>
                      {subjectStyling.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-800/20 dark:border-white/5">
                    <span className="text-slate-400">Grade Level:</span>
                    <span className={`px-2 py-0.5 rounded-md bg-slate-900 border text-white text-[10px] font-black border-white/5`}>
                      Grade {options.grade || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">CAPS Standard:</span>
                    <span className="text-[#00d2ff] flex items-center gap-1 font-black text-[10px] uppercase tracking-wider bg-[#00d2ff]/10 px-2 py-0.5 rounded-md">
                      <Sparkles size={10} /> Compliant
                    </span>
                  </div>
                </div>
              </div>

              {/* Section Selector Toggle Button */}
              <div className="space-y-2">
                <label className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Print Target Section
                </label>
                <div className={`grid grid-cols-3 gap-1 p-1 rounded-2xl ${isDarkMode ? 'bg-slate-950 border border-white/5' : 'bg-slate-200 shadow-inner'}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedSection('content')}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${selectedSection === 'content' ? (isDarkMode ? 'bg-brand-cyan text-navy-dark shadow-md' : 'bg-white text-slate-800 shadow-md') : 'text-slate-400 hover:text-white'}`}
                  >
                    <FileText size={14} />
                    <span>Worksheet</span>
                  </button>
                  <button
                    type="button"
                    disabled={!memo}
                    onClick={() => setSelectedSection('memo')}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${!memo ? 'opacity-40 cursor-not-allowed' : ''} ${selectedSection === 'memo' ? (isDarkMode ? 'bg-brand-cyan text-navy-dark shadow-md' : 'bg-white text-slate-800 shadow-md') : 'text-slate-400 hover:text-white'}`}
                    title={!memo ? "No Answer Key available for this material" : "View Answer Key memorandum"}
                  >
                    <Check size={14} />
                    <span>Memo</span>
                  </button>
                  <button
                    type="button"
                    disabled={!rubric}
                    onClick={() => setSelectedSection('rubric')}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${!rubric ? 'opacity-40 cursor-not-allowed' : ''} ${selectedSection === 'rubric' ? (isDarkMode ? 'bg-brand-cyan text-navy-dark shadow-md' : 'bg-white text-slate-800 shadow-md') : 'text-slate-400 hover:text-white'}`}
                    title={!rubric ? "No Grading Rubric available for this material" : "View assessment rubrics guidelines"}
                  >
                    <Percent size={14} />
                    <span>Rubric</span>
                  </button>
                </div>
              </div>

              {/* Layout Quality Integrity Information */}
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-100'}`}>
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Ruler size={14} className="text-emerald-400 animate-pulse" /> Custom ink-safe metrics
                </h4>
                <div className="space-y-2 text-[11px] font-bold text-slate-400 dark:text-emerald-200/80 leading-relaxed font-sans">
                  <div className="flex gap-2 items-start">
                    <span className="text-emerald-400">✔</span>
                    <span><strong>True A4 Canvas</strong> simulates physical margins of 20mm, providing a flawless print page structure.</span>
                  </div>
                  <div className="flex gap-2 items-start mt-2">
                    <span className="text-emerald-400">✔</span>
                    <span><strong>Break Prevention Rule</strong> binds the elements like <code className="font-mono text-xs text-brand-cyan bg-[#00d2ff]/10 px-1 py-0.25 rounded">.page-break-avoid</code> to secure complete question cards from splits.</span>
                  </div>
                  <div className="flex gap-2 items-start mt-2">
                    <span className="text-emerald-400">✔</span>
                    <span><strong>Form Tracing Bars</strong> inserts dotted slots ready for student handwriting exercises and dates.</span>
                  </div>
                </div>
              </div>

              {/* Quick interactive checklist */}
              <div className="space-y-2 text-left">
                <span className={`text-[10px] uppercase font-black tracking-widest ${isDarkMode ? 'text-indigo-200/50' : 'text-slate-500'}`}>
                  Teacher Checklist Prior to Print
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-400 cursor-pointer hover:text-white">
                    <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-900 text-brand-cyan focus:ring-brand-cyan" />
                    <span>Marks slot matches task weight?</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-400 cursor-pointer hover:text-white">
                    <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-900 text-brand-cyan focus:ring-brand-cyan" />
                    <span>Dotted names line is legible?</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-400 cursor-pointer hover:text-white">
                    <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-900 text-brand-cyan focus:ring-brand-cyan" />
                    <span>CAPS core content covered?</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Action buttons list */}
            <div className="space-y-3 mt-6">
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-cyan hover:bg-cyan-500 text-navy-dark rounded-2xl font-sans font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-cyan/20 cursor-pointer"
              >
                <Printer size={16} strokeWidth={2.5} />
                <span>Simulate & Print (PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerDownloadHTML}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-sans font-black uppercase tracking-widest text-xs transition-all border hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'}`}
              >
                <Download size={16} />
                <span>Download HTML Source</span>
              </button>
            </div>

          </div>

          {/* Simulated A4 Paper Live View (Right Side on Desktop / Bottom on Mobile) */}
          <div className={`flex-1 p-4 sm:p-6 lg:p-10 overflow-auto flex justify-center bg-slate-950/40 relative`}>
            
            {/* Visual Margin Indicators overlay */}
            <div className="absolute top-2 left-6 right-6 hidden xl:flex justify-between text-[10px] font-mono font-bold text-slate-500 select-none pointer-events-none">
              <span>🡐 A4 Landscape View Limit</span>
              <span>20mm Printable Margin Locked 🡒</span>
            </div>

            {/* Simulated Printed Page Sheet (Forcing bright high-contrast theme layout always since print uses black ink on white paper) */}
            <div 
              ref={paperRef}
              className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-800 p-[20mm] shadow-2xl rounded-sm border border-slate-200 text-left relative flex flex-col shrink-0 overflow-visible select-text"
              style={{
                boxSizing: 'border-box',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
              }}
            >
              {/* Paper Top Branding Header (on-screen 1/2 line watermark) */}
              <div className="mb-6 pb-2 border-b border-slate-200 select-none flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <span>EduAI Companion PRO v2.0 - CAPS Aligned South African Educational Resource</span>
                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[8px]">
                  {subjectStyling.category} {options.grade && `• Gr ${options.grade}`}
                </span>
              </div>

              {/* Dynamic generated content inside paper wrapper */}
              <div 
                className="prose max-w-none text-slate-800 text-sm leading-relaxed flex-1"
                dangerouslySetInnerHTML={{ __html: activeHTML }}
              />

              {/* Paper Footer information */}
              <div className="mt-12 pt-4 border-t border-dashed border-slate-200 flex justify-between items-center text-[8px] font-semibold text-slate-400 uppercase tracking-widest select-none">
                <span>EduAI Companion • CAPS Aligned • Developer & Owner: Z. Msuthu © 2026</span>
                <span>eduai-companion.vercel.app</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
