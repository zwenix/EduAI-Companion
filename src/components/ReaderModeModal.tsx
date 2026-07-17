import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Play, Pause, Square, Type, Minus, Plus, 
  Volume2, Download, List, Check, Sparkles, BookOpen, ChevronRight, Mic
} from 'lucide-react';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { renderMathInHtml } from '../lib/latexHelper';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';
import { cleanTextForSpeech } from '../services/ttsService';

interface ReaderModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  subject?: string;
  grade?: string;
}

type ReaderTheme = 'light' | 'sepia' | 'charcoal' | 'cyber';
type ReaderFont = 'sans' | 'serif' | 'dyslexic';

export default function ReaderModeModal({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  subject = 'Educational Resource', 
  grade 
}: ReaderModeModalProps) {
  const isFoundation = useMemo(() => {
    if (!grade) return false;
    const clean = String(grade).toLowerCase().trim();
    return clean === 'r' || clean === '1' || clean === '2' || clean === '3' || 
           clean.includes('grade r') || clean.includes('grade 1') || clean.includes('grade 2') || clean.includes('grade 3') ||
           clean.includes('foundation');
  }, [grade]);

  // Read choices from local storage or defaults
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem('eduai_reader_theme') as ReaderTheme) || 'sepia';
  });
  const [font, setFont] = useState<ReaderFont>(() => {
    return (localStorage.getItem('eduai_reader_font') as ReaderFont) || 'sans';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('eduai_reader_font_size')) || 18;
  });
  const [lineHeight, setLineHeight] = useState<string>(() => {
    return localStorage.getItem('eduai_reader_line_height') || 'relaxed';
  });

  // Sidebar Outline state
  const [showOutline, setShowOutline] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Speech Synthesizer states
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // PDF variables
  const [isExporting, setIsExporting] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save changes to localStorage on change
  useEffect(() => {
    localStorage.setItem('eduai_reader_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('eduai_reader_font', font);
  }, [font]);
  useEffect(() => {
    localStorage.setItem('eduai_reader_font_size', String(fontSize));
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem('eduai_reader_line_height', lineHeight);
  }, [lineHeight]);

  // Handle scroll progress within the container scrollpane
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target) {
      const winScroll = target.scrollTop;
      const height = target.scrollHeight - target.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    }
  };

  // Setup Web Speech Synth
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Parse HTML for rendering
  const activeHTML = useMemo(() => {
    if (!content) return '';
    try {
      const parsed = marked.parse(content) as string;
      return renderMathInHtml(replaceImagePlaceholders(parsed));
    } catch (e) {
      return renderMathInHtml(content);
    }
  }, [content]);

  // Extract outline section headers dynamically to build internal jumped links
  const outlines = useMemo(() => {
    if (!content) return [];
    
    // Look for lines beginning with #, ## or ###
    const lines = content.split('\n');
    const list: { id: string; text: string; level: number }[] = [];
    
    let headingCount = 0;
    lines.forEach(line => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        headingCount++;
        const hashes = match[1];
        const text = match[2].replace(/[_*`[\]()]/g, '').trim();
        const id = `heading-${headingCount}`;
        list.push({ id, text, level: hashes.length });
      }
    });

    return list;
  }, [content]);

  // Speak Aloud helper
  const handleSpeak = () => {
    if (!synthRef.current) return;

    if (paused) {
      synthRef.current.resume();
      setSpeaking(true);
      setPaused(false);
      return;
    }

    synthRef.current.cancel();

    // Strip markdown HTML, styling, structures, and metadata tags
    const element = document.createElement('div');
    element.innerHTML = activeHTML;
    const rawText = element.textContent || element.innerText || content;
    const cleanText = cleanTextForSpeech(rawText);
    
    // Limit speaking length to avoid burning standard resource limits
    const textToSpeak = cleanText.substring(0, 4000);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };

    setSpeaking(true);
    setPaused(false);
    synthRef.current.speak(utterance);
  };

  const handlePause = () => {
    if (synthRef.current && speaking) {
      synthRef.current.pause();
      setPaused(true);
      setSpeaking(false);
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeaking(false);
      setPaused(false);
    }
  };

  // Jump smoothly to elements
  const handleJumpToSection = (indexText: string) => {
    if (!docRef.current) return;
    
    // Find heading containing the exact text
    const headings = docRef.current.querySelectorAll('h1, h2, h3, h4');
    let foundElement: Element | null = null;
    
    headings.forEach(hn => {
      if (hn.textContent?.toLowerCase().trim().includes(indexText.toLowerCase().trim())) {
        foundElement = hn;
      }
    });

    if (foundElement) {
      (foundElement as Element).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!docRef.current) return;
    setIsExporting(true);

    try {
      const originalStyle = patchOklchForHtml2canvas();
      let canvas;
      try {
        canvas = await html2canvas(docRef.current, { scale: 1.5, useCORS: true });
      } finally {
        originalStyle();
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

      pdf.save(`${title.replace(/\s+/g, '_')}_Reader_Copy.pdf`);
    } catch (err) {
      console.error("PDF generator inside Reader Mode failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  // Visual Theme mapping
  const themeClasses: Record<ReaderTheme, string> = {
    sepia: 'bg-[#FAF4E8] text-[#5C3E21] border-[#E8DFC8]',
    charcoal: 'bg-[#181C25] text-slate-100 border-[#252C3E]',
    light: 'bg-white text-slate-800 border-slate-200',
    cyber: 'bg-slate-950 text-emerald-400 border-zinc-800 font-mono'
  };

  // Theme header/accent classes
  const secondaryThemeClasses: Record<ReaderTheme, string> = {
    sepia: 'bg-[#EADCBF] border-[#E2D2B0] text-[#7A5734]',
    charcoal: 'bg-[#212737] border-[#2B344A] text-slate-200',
    light: 'bg-slate-50 border-slate-100 text-slate-600',
    cyber: 'bg-slate-900 border-zinc-800 text-emerald-300'
  };

  // Font classes mapping
  const fontClasses: Record<ReaderFont, string> = {
    sans: 'font-sans',
    serif: 'font-serif text-[106%]',
    // Friendly accessible dyslexia letters with Comic Neue
    dyslexic: 'font-comic tracking-wide leading-loose word-spacing-0.12'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-black/75 backdrop-blur-md p-0 sm:p-5">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className={`w-full h-full max-h-screen sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border ${themeClasses[theme]}`}
        >
          
          {/* Top Progress Bar */}
          <div className="w-full h-1 bg-white/10 shrink-0">
            <div 
              className={`h-full transition-all duration-100 ${
                theme === 'cyber' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-cyan-500'
              }`}
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          {/* Reader Top Bar Controls */}
          <div className={`p-4 border-b ${secondaryThemeClasses[theme]} shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between`}>
            
            {/* Title / Info */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-500 rounded-2xl hidden sm:block shrink-0">
                <BookOpen size={20} className="not-sketchy" />
              </div>
              <div className="truncate text-left">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#00d2ff]">
                  Syllabus Reader Mode 🎙️
                </p>
                <h2 className="text-sm sm:text-lg font-black truncate max-w-[280px] sm:max-w-[400px]">
                  {title}
                </h2>
              </div>
            </div>

            {/* Personalization & Control Dashboard */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end w-full md:w-auto shrink-0 select-none">
              
              {/* Text Size adjust */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-current/10 text-xs font-bold leading-none">
                <Type size={14} className="opacity-70 not-sketchy" />
                <button 
                  onClick={() => setFontSize(prev => Math.max(13, prev - 1))}
                  className="p-1 hover:bg-current/15 rounded-lg border-0 outline-none cursor-pointer"
                  title="Smaller Font Size"
                >
                  <Minus size={12} className="not-sketchy" />
                </button>
                <span className="min-w-[32px] text-center font-mono text-[11px] font-black">
                  {fontSize}px
                </span>
                <button 
                  onClick={() => setFontSize(prev => Math.min(30, prev + 1))}
                  className="p-1 hover:bg-current/15 rounded-lg border-0 outline-none cursor-pointer"
                  title="Larger Font Size"
                >
                  <Plus size={12} className="not-sketchy" />
                </button>
              </div>

              {/* Font Choice Select */}
              <div className="flex bg-current/10 rounded-xl p-1 text-xs">
                {(['sans', 'serif', 'dyslexic'] as ReaderFont[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFont(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider outline-none border-0 transition-all ${
                      font === f 
                        ? (theme === 'charcoal' ? 'bg-[#FAF4E8] text-[#181C25] font-black shadow-lg shadow-black/10' : 'bg-slate-800 text-white font-black shadow-lg') 
                        : 'opacity-65 hover:opacity-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Theme Selector */}
              <div className="flex gap-1">
                {(['light', 'sepia', 'charcoal', 'cyber'] as ReaderTheme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      backgroundColor: t === 'light' ? '#fff' : t === 'sepia' ? '#F4ECD8' : t === 'charcoal' ? '#1E293B' : '#090d16',
                      borderColor: theme === t ? '#00d2ff' : 'rgba(0,0,0,0.15)'
                    }}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all hover:scale-115 relative flex items-center justify-center outline-none`}
                    title={`Switch to ${t} theme`}
                  >
                    {theme === t && (
                      <span className={`w-2 h-2 rounded-full ${t === 'light' || t === 'sepia' ? 'bg-slate-900' : 'bg-emerald-400'}`} />
                    )}
                  </button>
                ))}
              </div>

              {/* Read Aloud controls */}
              <div className="flex items-center gap-1 bg-current/10 rounded-xl p-1">
                {!speaking || paused ? (
                  <button
                    onClick={handleSpeak}
                    className="p-1.5 hover:bg-current/15 rounded-lg text-xs font-black uppercase text-emerald-500 border-0 outline-none cursor-pointer"
                    title="Speak notes aloud"
                  >
                    <Play size={14} className="fill-current not-sketchy" />
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="p-1.5 hover:bg-current/15 rounded-lg text-xs font-black uppercase text-amber-500 border-0 outline-none cursor-pointer"
                    title="Pause speech"
                  >
                    <Pause size={14} className="fill-current not-sketchy" />
                  </button>
                )}
                {(speaking || paused) && (
                  <button
                    onClick={handleStop}
                    className="p-1.5 hover:bg-current/15 rounded-lg text-xs font-black uppercase text-rose-500 border-0 outline-none cursor-pointer"
                    title="Stop read aloud"
                  >
                    <Square size={14} className="fill-current not-sketchy" />
                  </button>
                )}
                <span className="text-[10px] uppercase font-black tracking-widest pl-1 pr-2 opacity-80 flex items-center gap-1">
                  <Volume2 size={11} className="not-sketchy" /> Speech
                </span>
              </div>

              {/* Outline toggle button */}
              <button 
                onClick={() => setShowOutline(prev => !prev)}
                className={`p-2 rounded-xl transition-all outline-none border cursor-pointer ${
                  showOutline ? 'bg-cyan-500 border-cyan-400 text-white shadow-md' : 'btn border-current/15 bg-transparent opacity-80 hover:opacity-100'
                }`}
                title="Toggle outline index map"
              >
                <List size={16} className="not-sketchy" />
              </button>

              {/* Export to PDF */}
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="p-2 border border-current/15 bg-transparent rounded-xl transition-all hover:bg-current/5 outline-none cursor-pointer flex items-center justify-center disabled:opacity-40 shrink-0"
                title="Export clean reading draft to PDF"
              >
                {isExporting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                ) : (
                  <Download size={16} className="not-sketchy" />
                )}
              </button>

              {/* Close Button */}
              <button 
                onClick={onClose}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all border border-rose-500/20 cursor-pointer text-xs outline-none flex items-center justify-center shrink-0"
                title="Exit Reader Mode"
              >
                <X size={16} className="not-sketchy" />
              </button>
            </div>
          </div>

          {/* Reader Body area */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            
            {/* Left Drawer Outline Panel */}
            <AnimatePresence>
              {showOutline && outlines.length > 0 && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`h-full shrink-0 border-r border-current/10 hidden md:flex flex-col overflow-hidden text-left`}
                >
                  <div className="p-4 border-b border-current/10 shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-[#00d2ff]" /> Table of Contents
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                    {outlines.map((out, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleJumpToSection(out.text)}
                        style={{ paddingLeft: `${(out.level - 1) * 12 + 8}px` }}
                        className={`w-full text-left text-xs py-2 hover:bg-current/10 rounded-xl transition-all flex items-start gap-1.5 border-0 bg-transparent cursor-pointer font-bold`}
                      >
                        <ChevronRight size={12} className="shrink-0 mt-0.5 opacity-60 not-sketchy" />
                        <span className="truncate leading-normal">{out.text}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main scroll box containing document content */}
            <div 
              ref={containerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-10 select-text outline-none custom-scrollbar"
            >
              {/* Document Paper Centered */}
              <div 
                ref={docRef}
                style={{ 
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight === 'loose' ? '2' : lineHeight === 'relaxed' ? '1.75' : '1.5'
                }}
                className={`max-w-3xl mx-auto p-8 sm:p-14 rounded-3xl shadow-sm border ${themeClasses[theme]} ${fontClasses[font]} select-text`}
              >
                {/* School Grade Header */}
                <div className="border-b-2 border-current/15 pb-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-[11px] font-black uppercase tracking-widest text-[#00d2ff]">
                  <div className="flex items-center gap-2">
                    <Mic size={11} className="not-sketchy text-brand-green" />
                    <span>CAPS Aligned study notes</span>
                  </div>
                  <div className="px-3 py-1 bg-current/10 rounded-full text-[10px]">
                    {grade ? `Grade ${grade}` : 'Resource'} • {subject}
                  </div>
                </div>

                {/* Main Heading title */}
                <h1 className="text-3xl sm:text-5xl font-black mb-6 leading-tight tracking-tight mt-2 select-text">
                  {title}
                </h1>

                {/* Subtitle / Timestamp */}
                <p className="text-[11px] font-mono font-bold opacity-60 mb-10 pb-4 border-b border-dashed border-current/10 select-text">
                  EduAI Companion Study Vault • Generated: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Render Processed HTML */}
                <div 
                  className={`prose prose-sm sm:prose-base max-w-none select-text ${
                    theme === 'charcoal' ? 'prose-invert text-slate-200' : 'text-inherit'
                  } ${
                    font === 'dyslexic' ? 'font-comic tracking-wide lg:word-spacing-0.12' : ''
                  }`}
                  style={{
                    fontSize: isFoundation ? '1.35rem' : 'inherit',
                    lineHeight: 'inherit',
                    fontFamily: isFoundation 
                      ? '"Patrick Hand", "Comic Neue", cursive, sans-serif'
                      : 'inherit'
                  }}
                  dangerouslySetInnerHTML={{ __html: activeHTML }}
                />

                {/* Paper Footer signoff */}
                <div className="border-t border-dashed border-current/15 mt-16 pt-6 text-center text-[10px] font-mono opacity-50 uppercase tracking-widest">
                  End of study guide • Keep up the great work! 🚀
                </div>
              </div>
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
