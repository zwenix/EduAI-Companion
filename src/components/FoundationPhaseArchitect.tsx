import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Settings2, 
  RotateCcw, 
  RotateCw,
  Plus,
  X,
  ChevronDown,
  Play,
  FlaskConical,
  Sparkles,
  Minus,
  Loader2,
  Check,
  Copy,
  Gamepad2,
  Volume2,
  Shuffle
} from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const PRESET_CHALLENGES = [
  { hint: "Spell the word (feline pet 🐱)", start: "C", valid: ["CAT", "CAP", "COT", "CUP"], letters: ["A", "T", "O", "P", "U", "N"] },
  { hint: "Spell the word (barking friend 🐶)", start: "D", valid: ["DOG", "DOT", "DIG", "DAM"], letters: ["O", "G", "T", "I", "M", "A"] },
  { hint: "Spell the word (shines bright ☀️)", start: "S", valid: ["SUN", "SIT", "SAD", "SAP"], letters: ["U", "N", "I", "T", "A", "D"] },
  { hint: "Spell the word (farm bird 🐔)", start: "H", valid: ["HEN", "HAT", "HOP", "HUG"], letters: ["E", "N", "A", "T", "O", "P"] }
];

const SUGGESTED_GOALS = [
  'Rhyming Words',
  'Short Vowel Sounds',
  'Consonant Digraphs',
  'Number Bonds to 10',
  'Sight Words Table',
  'Sentence Starters'
];

const INTERACTION_MODES = [
  'Drag and Drop',
  'Tap & Spell',
  'Phonics Matching',
  'Tracer Lines',
  'Flashcards & Voice'
];

interface FoundationPhaseArchitectProps {
  isDarkMode?: boolean;
  teachingResult?: any;
  isLoading?: boolean;
  onGenerate?: (options?: { goals?: string[]; difficulty?: 'linear' | 'adaptive' | 'stepped'; interactionMode?: string }) => void;
  grade?: string;
  onGradeChange?: (g: string) => void;
  language?: string;
  onLanguageChange?: (l: string) => void;
  onBack?: () => void;
  onClose?: () => void;
}

export default function FoundationPhaseArchitect({ 
  isDarkMode = true, 
  teachingResult, 
  isLoading = false, 
  onGenerate,
  grade = "Grade 2",
  onGradeChange,
  language = "English",
  onLanguageChange,
  onBack,
  onClose
}: FoundationPhaseArchitectProps) {
  const [difficulty, setDifficulty] = useState<'linear' | 'adaptive' | 'stepped'>('adaptive');
  const [goals, setGoals] = useState<string[]>(['Phonetic Blending', 'Sight Words', 'CVC Patterns']);
  const [interactionMode, setInteractionMode] = useState('Drag and Drop');
  const [isInteractionModeOpen, setIsInteractionModeOpen] = useState(false);
  const [genProgress, setGenProgress] = useState(teachingResult ? 100 : 0);
  const [showSandboxAlways, setShowSandboxAlways] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sandbox interactive state
  const [challengeIndex, setChallengeIndex] = useState(0);
  const currentChallenge = PRESET_CHALLENGES[challengeIndex % PRESET_CHALLENGES.length];
  const [slots, setSlots] = useState<string[]>([currentChallenge.start, '', '']);
  const [spelledWord, setSpelledWord] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setSlots([currentChallenge.start, '', '']);
    setIsSuccess(false);
  }, [challengeIndex]);

  useEffect(() => {
    if (isLoading) {
      setGenProgress(0);
      const interval = setInterval(() => {
        setGenProgress(prev => Math.min(prev + Math.floor(Math.random() * 6) + 3, 95));
      }, 350);
      return () => clearInterval(interval);
    } else if (teachingResult) {
      setGenProgress(100);
    }
  }, [isLoading, teachingResult]);

  // Check word in slots
  useEffect(() => {
    const fullWord = slots.join('');
    setSpelledWord(fullWord);
    if (slots[1] && slots[2]) {
      if (currentChallenge.valid.includes(fullWord.toUpperCase())) {
        setIsSuccess(true);
      } else {
        setIsSuccess(false);
      }
    } else {
      setIsSuccess(false);
    }
  }, [slots, currentChallenge]);

  const removeGoal = (goalToRemove: string) => {
    setGoals(goals.filter(g => g !== goalToRemove));
  };

  const addGoal = () => {
    const newGoal = prompt("Enter new learning goal (e.g. CVC Words, Rhyming, Phonics):");
    if (newGoal && newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()]);
    }
  };

  const addPresetGoal = (preset: string) => {
    if (!goals.includes(preset)) {
      setGoals([...goals, preset]);
    }
  };

  const handleLetterClick = (letter: string) => {
    if (slots[1] === '') {
      setSlots([slots[0], letter, slots[2]]);
    } else if (slots[2] === '') {
      setSlots([slots[0], slots[1], letter]);
    }
  };

  const handleSlotClick = (index: number) => {
    if (index === 0) return; // keep first letter
    const nextSlots = [...slots];
    nextSlots[index] = '';
    setSlots(nextSlots);
    setIsSuccess(false);
  };

  const resetSlots = () => {
    setSlots([currentChallenge.start, '', '']);
    setIsSuccess(false);
  };

  const nextChallenge = () => {
    setChallengeIndex(prev => prev + 1);
  };

  const grades = ['Grade R', 'Grade 1', 'Grade 2', 'Grade 3'];
  const handleGradeStep = (step: number) => {
    const currentIdx = grades.indexOf(grade);
    const newIdx = Math.max(0, Math.min(grades.length - 1, (currentIdx === -1 ? 2 : currentIdx) + step));
    onGradeChange?.(grades[newIdx]);
  };

  const handleCopyContent = () => {
    if (teachingResult?.content) {
      const stripped = teachingResult.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      navigator.clipboard.writeText(stripped || teachingResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const triggerGenerate = () => {
    onGenerate?.({
      goals,
      difficulty,
      interactionMode
    });
  };

  const hasGeneratedContent = !!teachingResult?.content && !showSandboxAlways;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 font-sans w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
            <BookOpen size={12} />
            <span>CURRICULUM ARCHITECT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Core Mechanics & Game Logic</h1>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Back Button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>← Labs</span>
            </button>
          )}

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]", isLoading ? "bg-amber-400 animate-pulse" : "bg-cyan-400")} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isLoading ? 'Architecting Logic...' : 'Draft Auto-Saved'}
                </span>
             </div>
             <button 
               onClick={triggerGenerate}
               disabled={isLoading}
               className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border border-cyan-400/40 rounded-full transition-all group disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95"
             >
                {isLoading ? (
                  <Loader2 size={14} className="text-white animate-spin" />
                ) : (
                  <Play size={14} className="text-white fill-current group-hover:scale-110 transition-all" />
                )}
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {isLoading ? 'Generating Logic' : 'Test Game'}
                </span>
             </button>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 hover:text-white rounded-full border border-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Close"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1">
        {/* Left Column: Parameters */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Global Parameters */}
          <div className="bg-[#0a1226]/95 border border-cyan-500/30 rounded-[32px] p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl">
             <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-4">
              <Settings2 size={14} className="text-cyan-400" />
              <span>Global Parameters</span>
            </div>

            <div className="space-y-6">
              {/* Difficulty Curve */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty Curve</label>
                 <div className="grid grid-cols-3 gap-1 bg-[#060c1d] p-1 rounded-2xl border border-cyan-500/20">
                    {(['linear', 'adaptive', 'stepped'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setDifficulty(mode)}
                        className={cn(
                          "py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                          difficulty === mode 
                            ? "bg-cyan-500/20 text-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] border border-cyan-400/20 font-bold"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Vocabulary Level */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Vocabulary Level</label>
                 <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={() => handleGradeStep(-1)}
                      className="w-10 h-10 flex items-center justify-center bg-[#0d1733] hover:bg-[#152554] border border-white/10 rounded-xl transition-all text-slate-300 cursor-pointer active:scale-95"
                      title="Previous Grade"
                    >
                       <Minus size={16} />
                    </button>
                    <div className="flex-1 h-10 flex items-center justify-center bg-[#060c1d] border border-cyan-500/20 rounded-xl">
                       <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{grade}</span>
                    </div>
                    <button 
                      onClick={() => handleGradeStep(1)}
                      className="w-10 h-10 flex items-center justify-center bg-[#0d1733] hover:bg-[#152554] border border-white/10 rounded-xl transition-all text-slate-300 cursor-pointer active:scale-95"
                      title="Next Grade"
                    >
                       <Plus size={16} />
                    </button>
                 </div>
                 {/* Quick Grade Selector Pills */}
                 <div className="flex items-center justify-between gap-1 pt-1">
                    {grades.map(g => (
                      <button
                        key={g}
                        onClick={() => onGradeChange?.(g)}
                        className={cn(
                          "px-2 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer",
                          grade === g 
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                            : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Interaction Mode */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interaction Mode</label>
                 <div className="relative">
                    <button 
                      onClick={() => setIsInteractionModeOpen(!isInteractionModeOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#060c1d] hover:bg-[#0d1733] border border-cyan-500/20 rounded-xl text-left transition-all group cursor-pointer"
                    >
                       <span className="text-xs font-bold text-slate-300">{interactionMode}</span>
                       <ChevronDown size={14} className={cn("text-slate-500 group-hover:text-slate-300 transition-transform", isInteractionModeOpen ? "rotate-180" : "")} />
                    </button>

                    <AnimatePresence>
                      {isInteractionModeOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-30 left-0 right-0 mt-2 bg-[#0d1733] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden p-1.5 space-y-1"
                        >
                          {INTERACTION_MODES.map(mode => (
                            <button
                              key={mode}
                              onClick={() => {
                                setInteractionMode(mode);
                                setIsInteractionModeOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-all cursor-pointer flex items-center justify-between",
                                interactionMode === mode 
                                  ? "bg-cyan-500/20 text-cyan-300 font-bold" 
                                  : "text-slate-300 hover:bg-white/5"
                              )}
                            >
                              <span>{mode}</span>
                              {interactionMode === mode && <Check size={14} className="text-cyan-400" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
            </div>
          </div>

          {/* Learning Goals */}
          <div className="bg-[#0a1226]/95 border border-cyan-500/30 rounded-[32px] p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl flex-1">
             <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-4">
              <Sparkles size={14} className="text-purple-400" />
              <span>Learning Goals</span>
            </div>

            <div className="flex flex-wrap gap-2">
               {goals.map(goal => (
                 <div key={goal} className="flex items-center gap-2 px-3 py-2 bg-[#0d1733] border border-white/10 rounded-xl group hover:border-cyan-400/40 transition-all">
                    <span className="text-[10px] font-bold text-slate-300">{goal}</span>
                    <button onClick={() => removeGoal(goal)} className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer" title="Remove Goal">
                       <X size={12} />
                    </button>
                 </div>
               ))}
               <button onClick={addGoal} className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer">
                  <Plus size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Goal</span>
               </button>
            </div>

            {/* Suggested Goals Quick Add */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Quick Suggestions</span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_GOALS.filter(sg => !goals.includes(sg)).map(sg => (
                  <button
                    key={sg}
                    onClick={() => addPresetGoal(sg)}
                    className="text-[9px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer"
                  >
                    + {sg}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <FlaskConical size={12} className="text-cyan-400" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">
                       {isLoading ? 'Generating Logic...' : 'Logic Engine Status'}
                     </span>
                  </div>
                  <span className="text-[11px] font-black text-cyan-400 font-mono">{genProgress}%</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${genProgress}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview Area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
           <div className="w-full bg-[#0a1226]/95 border border-cyan-500/30 rounded-2xl sm:rounded-[32px] p-1 flex flex-col overflow-hidden shadow-2xl relative min-h-[420px] sm:min-h-[540px]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 px-6 border-b border-white/5 bg-[#081024]/80">
                 <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                    <FlaskConical size={14} className="text-purple-400" />
                    <span>{hasGeneratedContent ? 'Generated Game / Reading Pack' : 'Game Logic Lab — Interactive Sandbox'}</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    {teachingResult?.content && (
                      <>
                        <button
                          onClick={() => setShowSandboxAlways(!showSandboxAlways)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
                            showSandboxAlways
                              ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          )}
                          title="Toggle between Interactive Sandbox & Generated Result"
                        >
                          <Gamepad2 size={12} />
                          <span>{showSandboxAlways ? 'Show Result' : 'Sandbox View'}</span>
                        </button>

                        <button
                          onClick={handleCopyContent}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
                          title="Copy Content"
                        >
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </>
                    )}

                    <button 
                      onClick={resetSlots}
                      className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors cursor-pointer"
                      title="Reset Slots"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button 
                      onClick={nextChallenge}
                      className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors cursor-pointer"
                      title="Next Word Challenge"
                    >
                      <RotateCw size={14} />
                    </button>
                 </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 relative flex items-center justify-center p-4 lg:p-6 overflow-hidden">
                 {hasGeneratedContent ? (
                   <div className="w-full h-full bg-white rounded-2xl sm:rounded-3xl overflow-y-auto p-6 sm:p-8 shadow-2xl text-slate-900 font-sans custom-scrollbar">
                      <div 
                        style={{
                          fontFamily: '"Patrick Hand", "Comic Neue", cursive, sans-serif',
                          fontSize: '1.25rem',
                          lineHeight: '1.6'
                        }}
                        dangerouslySetInnerHTML={{ __html: teachingResult.content }} 
                      />
                   </div>
                 ) : (
                   <div className="w-full max-w-xl aspect-video sm:aspect-auto sm:min-h-[420px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group flex flex-col justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop" 
                      alt="Game Sandbox" 
                      className="w-full h-full object-cover opacity-35 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" />
                    
                    {/* Sandbox UI Interactive View */}
                    <div className="relative z-10 flex flex-col items-center justify-center gap-6 p-6 text-center">
                       <div className="space-y-1.5">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                              INTERACTIVE SANDBOX PREVIEW
                            </span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            {currentChallenge.hint}
                          </h2>
                       </div>

                       {/* Interactive Letter Slots */}
                       <div className="flex items-center gap-3 sm:gap-4">
                          {slots.map((letter, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSlotClick(idx)}
                              disabled={idx === 0}
                              className={cn(
                                "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center font-black transition-all",
                                idx === 0 
                                  ? "bg-cyan-500/20 border-2 border-cyan-400 text-3xl sm:text-4xl text-white shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                                  : letter
                                  ? "bg-indigo-500/20 border-2 border-indigo-400 text-3xl sm:text-4xl text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer hover:scale-105 active:scale-95"
                                  : "bg-white/5 border-2 border-dashed border-white/20 text-slate-500"
                              )}
                              title={idx > 0 && letter ? "Click to clear this letter" : undefined}
                            >
                              {letter ? (
                                <span>{letter}</span>
                              ) : (
                                <div className="w-6 sm:w-8 h-1 bg-white/20 rounded-full" />
                              )}
                            </button>
                          ))}
                       </div>

                       {/* Success celebration badge */}
                       {isSuccess && (
                         <motion.div 
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs shadow-lg shadow-emerald-500/20"
                         >
                            <Sparkles size={14} className="text-emerald-400 animate-spin" />
                            <span>⭐ Great job! You spelled "{spelledWord}"!</span>
                         </motion.div>
                       )}

                       {/* Clickable Letter Pool */}
                       <div className="flex flex-col items-center gap-2 mt-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tap letters to complete:</span>
                          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                            {currentChallenge.letters.map(letter => (
                              <button 
                                key={letter} 
                                onClick={() => handleLetterClick(letter)}
                                className="w-11 h-11 sm:w-12 sm:h-12 bg-white/10 hover:bg-cyan-500/20 border border-white/20 hover:border-cyan-400 rounded-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md"
                              >
                                 <span className="text-base sm:text-lg font-black text-white">{letter}</span>
                              </button>
                            ))}
                          </div>
                       </div>

                       {/* Challenge Navigation Bar */}
                       <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={resetSlots}
                            className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            onClick={nextChallenge}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <Shuffle size={11} />
                            <span>Next Challenge</span>
                          </button>
                       </div>
                    </div>
                  </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
