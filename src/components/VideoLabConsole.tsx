import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Video, 
  Settings2, 
  Maximize2, 
  Play, 
  Circle, 
  MoreHorizontal,
  ChevronRight,
  Plus,
  Loader2,
  X
} from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface RadialDialProps {
  label: string;
  value: number;
  subLabel?: string;
  color?: string;
  onChange?: (val: number) => void;
}

const RadialDial = ({ label, value, subLabel, color = "text-cyan-400" }: RadialDialProps) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-slate-200 tracking-wide">{label}</span>
        {subLabel && <span className="text-[9px] text-slate-500 font-medium">{subLabel}</span>}
      </div>
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className={cn(color, "transition-all duration-500")}
          />
        </svg>
        <div className={cn("absolute w-1 h-1 rounded-full", color, "shadow-[0_0_8px_currentColor]")} 
             style={{ 
               transform: `rotate(${(value / 100) * 360}deg) translateY(-${radius}px)` 
             }} 
        />
      </div>
    </div>
  );
};

interface VideoLabConsoleProps {
  isDarkMode?: boolean;
  videoResult?: any;
  isLoading?: boolean;
  onGenerate?: () => void;
  vid_model?: string;
  setVid_Model?: (val: string) => void;
  vid_prompt?: string;
  setVid_Prompt?: (val: string) => void;
  vid_seed?: number;
  setVid_Seed?: (val: number) => void;
  vid_fps?: number;
  setVid_Fps?: (val: number) => void;
  onBack?: () => void;
  onClose?: () => void;
}

export default function VideoLabConsole({ 
  isDarkMode = true, 
  videoResult, 
  isLoading, 
  onGenerate,
  vid_model = "omnihuman-1",
  setVid_Model,
  vid_prompt = "",
  setVid_Prompt,
  vid_seed = -1,
  setVid_Seed,
  vid_fps = 12,
  setVid_Fps,
  onBack,
  onClose
}: VideoLabConsoleProps) {
  const [recordingProgress, setRecordingProgress] = useState(videoResult ? 100 : 0);
  const [currentTime, setCurrentTime] = useState("14:42:09:12");

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setRecordingProgress(prev => Math.min(prev + Math.floor(Math.random() * 5), 95));
      }, 500);
      return () => clearInterval(interval);
    } else if (videoResult) {
      setRecordingProgress(100);
    }
  }, [isLoading, videoResult]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ":" + Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0'));
    }, 10);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 font-sans overflow-y-auto h-full w-full custom-scrollbar pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-2xl font-black text-white tracking-tight">Video Lab Console</h1>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Session ID: #VL-8924</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>Environment: Simulated Physics</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-brand-cyan border border-brand-cyan/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>← Labs</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">SYS REC</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[11px] font-mono font-bold text-slate-400">{currentTime}</span>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 hover:text-white rounded-full border border-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Close"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Main Viewport */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] overflow-hidden relative group">
            {/* Viewport Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">
                <Video size={12} />
                <span>PREVIEW SIGNAL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase tracking-tighter">4K HDR</span>
                <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase tracking-tighter">60 FPS</span>
              </div>
            </div>

            {/* Placeholder Content for Video Viewport */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {videoResult?.url ? (
                <video 
                  src={videoResult.url} 
                  controls 
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                />
              ) : (
                <>
                  <img 
                    src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop" 
                    alt="Video Lab Backdrop" 
                    className="w-full h-full object-cover opacity-60 mix-blend-screen"
                  />
                  {/* Overlay HUD Graphics */}
                  <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                  
                  {/* UI Elements Simulated */}
                  <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-cyan-400/30 rounded-2xl flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60" />
                    
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-20 h-20 rounded-full border border-cyan-400/40 flex items-center justify-center bg-cyan-400/5 backdrop-blur-sm">
                          <div className="w-12 h-12 rounded-full border-2 border-cyan-400/60 flex items-center justify-center">
                             <Play className={cn("fill-cyan-400 text-cyan-400", isLoading && "animate-pulse")} size={24} />
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest text-glow-cyan">
                         {isLoading ? 'Processing Signal...' : 'AI Direction AURA'}
                       </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Corner Markers */}
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
               <Maximize2 size={16} className="text-slate-400 hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col gap-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-4">
              <Settings2 size={14} className="text-purple-400" />
              <span>Control Board</span>
            </div>

            <div className="flex flex-col gap-5 flex-1 justify-center px-2 overflow-y-auto">
              {/* Model Engine Selector */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-cyan-400 block ml-1">Video Model Engine</label>
                <select 
                  value={vid_model} 
                  onChange={(e) => setVid_Model?.(e.target.value)}
                  className="w-full bg-[#0b1122]/80 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl p-2.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                >
                  <option value="omnihuman-1" className="bg-slate-900">Omnihuman-1 (Gradio Streaming)</option>
                  <option value="replicate-minimax" className="bg-slate-900">Minimax Video</option>
                  <option value="replicate-luma" className="bg-slate-900">Luma Ray</option>
                </select>
              </div>

              {/* Prompt Entry Box */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black uppercase tracking-widest text-purple-400 block ml-1">Action Prompt Script</label>
                <textarea 
                  placeholder="Type your prompt here... E.g., A cinematic shot of a lion roaring in the African savanna..." 
                  value={vid_prompt} 
                  onChange={(e) => setVid_Prompt?.(e.target.value)} 
                  className="w-full h-20 bg-[#0b1122]/80 border border-white/10 text-slate-200 text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all resize-none shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                />
              </div>

              {/* Seed and FPS */}
              {vid_model === 'omnihuman-1' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ml-1">Seed</label>
                    <input 
                      type="number" 
                      value={vid_seed} 
                      onChange={(e) => setVid_Seed?.(Number(e.target.value))} 
                      className="w-full h-9 bg-[#0b1122]/80 border border-white/10 text-slate-250 text-xs font-medium rounded-xl px-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ml-1">FPS ({vid_fps})</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={vid_fps} 
                      onChange={(e) => setVid_Fps?.(Number(e.target.value))} 
                      className="w-full h-9 accent-cyan-400 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div className="h-px bg-white/10 my-1" />

              <RadialDial label="Script Tone" subLabel="Academic - Casual" value={72} color="text-cyan-400" />
              <RadialDial label="Avatar Speed" subLabel="Multiplier: 1.2x" value={45} color="text-purple-400" />
            </div>

            <div className="mt-auto space-y-3 pt-6 border-t border-white/5">
               <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                  <span className="text-xs font-bold text-slate-300">Camera Presets</span>
                  <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
               </button>
               <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                  <span className="text-xs font-bold text-slate-300">Lighting Override</span>
                  <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area with Progress */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col sm:flex-row items-center gap-6 shadow-2xl">
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
               <Circle size={8} className="fill-rose-500 text-rose-500 animate-pulse" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Recording Progress</span>
            </div>
            <span className="text-sm font-black text-cyan-400 font-mono tracking-tighter">{recordingProgress}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${recordingProgress}%` }}
              className="h-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            />
          </div>
        </div>
        
        <button 
          onClick={onGenerate}
          disabled={isLoading}
          className="shrink-0 flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </div>
          <span className="text-xs font-black uppercase tracking-widest">
            {isLoading ? 'Assembling Signal...' : 'Render Final Clip'}
          </span>
        </button>
      </div>
    </div>
  );
}
