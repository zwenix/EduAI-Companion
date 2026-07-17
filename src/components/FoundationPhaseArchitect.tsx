import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Loader2
} from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface FoundationPhaseArchitectProps {
  isDarkMode?: boolean;
  teachingResult?: any;
  isLoading?: boolean;
  onGenerate?: () => void;
  grade?: string;
  onGradeChange?: (g: string) => void;
  language?: string;
  onLanguageChange?: (l: string) => void;
}

export default function FoundationPhaseArchitect({ 
  isDarkMode = true, 
  teachingResult, 
  isLoading, 
  onGenerate,
  grade = "Grade 2",
  onGradeChange,
  language = "English",
  onLanguageChange
}: FoundationPhaseArchitectProps) {
  const [difficulty, setDifficulty] = useState<'linear' | 'adaptive' | 'stepped'>('adaptive');
  const [goals, setGoals] = useState(['Phonetic Blending', 'Sight Words', 'CVC Patterns']);
  const [genProgress, setGenProgress] = useState(teachingResult ? 100 : 0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setGenProgress(prev => Math.min(prev + Math.floor(Math.random() * 5), 95));
      }, 500);
      return () => clearInterval(interval);
    } else if (teachingResult) {
      setGenProgress(100);
    }
  }, [isLoading, teachingResult]);

  const removeGoal = (goal: string) => {
    setGoals(goals.filter(g => g !== goal));
  };

  const addGoal = () => {
    const newGoal = prompt("Enter new learning goal:");
    if (newGoal) setGoals([...goals, newGoal]);
  };

  return (
    <div className="flex flex-col gap-6 p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
            <BookOpen size={12} />
            <span>CURRICULUM ARCHITECT</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Core Mechanics</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]", isLoading ? "bg-amber-400 animate-pulse" : "bg-cyan-400")} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isLoading ? 'Architecting Logic...' : 'Draft Auto-Saved'}
              </span>
           </div>
           <button 
             onClick={onGenerate}
             disabled={isLoading}
             className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group disabled:opacity-50"
           >
              {isLoading ? (
                <Loader2 size={14} className="text-cyan-400 animate-spin" />
              ) : (
                <Play size={14} className="text-slate-400 group-hover:text-cyan-400 fill-current group-hover:scale-110 transition-all" />
              )}
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {isLoading ? 'Generating' : 'Test Game'}
              </span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1">
        {/* Left Column: Parameters */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Global Parameters */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl">
             <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-4">
              <Settings2 size={14} className="text-cyan-400" />
              <span>Global Parameters</span>
            </div>

            <div className="space-y-6">
              {/* Difficulty Curve */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Difficulty Curve</label>
                 <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-2xl border border-white/5">
                    {(['linear', 'adaptive', 'stepped'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setDifficulty(mode)}
                        className={cn(
                          "py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                          difficulty === mode 
                            ? "bg-cyan-500/20 text-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] border border-cyan-400/20"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Vocabulary Level */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Vocabulary Level</label>
                 <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={() => onGradeChange?.("Grade R")}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400"
                    >
                       <RotateCcw size={16} />
                    </button>
                    <div className="flex-1 h-10 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl">
                       <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{grade}</span>
                    </div>
                    <button 
                      onClick={() => onGradeChange?.("Grade 3")}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400"
                    >
                       <Plus size={16} />
                    </button>
                 </div>
              </div>

              {/* Interaction Mode */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interaction Mode</label>
                 <div className="relative">
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-black/40 hover:bg-black/50 border border-white/5 rounded-xl text-left transition-all group">
                       <span className="text-xs font-bold text-slate-300">Drag and Drop</span>
                       <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                    </button>
                 </div>
              </div>
            </div>
          </div>

          {/* Learning Goals */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-xl flex-1">
             <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-4">
              <Sparkles size={14} className="text-purple-400" />
              <span>Learning Goals</span>
            </div>

            <div className="flex flex-wrap gap-2">
               {goals.map(goal => (
                 <div key={goal} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl group hover:border-white/20 transition-all">
                    <span className="text-[10px] font-bold text-slate-300">{goal}</span>
                    <button onClick={() => removeGoal(goal)} className="text-slate-500 hover:text-rose-400 transition-colors">
                       <X size={12} />
                    </button>
                 </div>
               ))}
               <button onClick={addGoal} className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 hover:bg-cyan-500/20 transition-all">
                  <Plus size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Goal</span>
               </button>
            </div>

            <div className="mt-auto">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <FlaskConical size={12} className="text-cyan-400" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Generating Logic...</span>
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
           <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] p-1 flex flex-col overflow-hidden shadow-2xl relative">
              {/* Header */}
              <div className="flex items-center justify-between p-4 px-6 border-b border-white/5">
                 <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                    <FlaskConical size={14} className="text-purple-400" />
                    <span>Game Logic Lab</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="text-slate-500 hover:text-white transition-colors"><RotateCcw size={16} /></button>
                    <button className="text-slate-500 hover:text-white transition-colors"><RotateCw size={16} /></button>
                 </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8">
                 {teachingResult ? (
                   <div className="w-full h-full bg-white rounded-3xl overflow-y-auto p-8 shadow-2xl text-slate-800 font-sans custom-scrollbar">
                      <div dangerouslySetInnerHTML={{ __html: teachingResult.content }} />
                   </div>
                 ) : (
                   <div className="w-full max-w-lg aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
                    <img 
                      src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop" 
                      alt="Game Sandbox" 
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                    
                    {/* Sandbox UI Placeholder */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-6 text-center">
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">SANDBOX PREVIEW</span>
                          <h2 className="text-3xl font-black text-white tracking-tight">Spell the word</h2>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-white/5 border-2 border-cyan-400 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                             <span className="text-4xl font-black text-white">C</span>
                          </div>
                          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                             <div className="w-8 h-1 bg-white/20 rounded-full" />
                          </div>
                          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                             <div className="w-8 h-1 bg-white/20 rounded-full" />
                          </div>
                       </div>

                       <div className="grid grid-cols-4 gap-4 mt-8">
                          {['A', 'T', 'O', 'P'].map(letter => (
                            <button key={letter} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:border-cyan-400/50 transition-all active:scale-95">
                               <span className="text-lg font-black text-slate-300">{letter}</span>
                            </button>
                          ))}
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
