import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  Blocks, 
  Palette, 
  Smile, 
  Award, 
  ToyBrick, 
  BookOpen, 
  Play, 
  Compass, 
  GraduationCap, 
  LineChart, 
  Layers, 
  ExternalLink,
  Laptop,
  ArrowRight,
  Orbit,
  Star,
  Users,
  Zap,
  Volume2,
  VolumeX,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import ContentSlideshow from './ContentSlideshow';
import {
  MagicLessonsIcon,
  SuperWorksheetsIcon,
  SmartBotTutorIcon,
  QuizQuestsIcon,
  ProgressTrophiesIcon,
  CreativeCanvasIcon
} from './LocalIcons';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; speed: number }[]>([]);
  const [activeLessonPhase, setActiveLessonPhase] = useState<'engage' | 'explore' | 'evaluate'>('engage');
  const [hoveredPlanet, setHoveredPlanet] = useState<number | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);
  const [interactiveMascotHover, setInteractiveMascotHover] = useState(false);
  const [soundMuted, setSoundMuted] = useState(true);

  useEffect(() => {
    // Generate random stars for background
    const newStars = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1.2,
      delay: Math.random() * 5,
      speed: Math.random() * 4 + 2,
    }));
    setStars(newStars);
  }, []);

  // Simple feedback audio function
  const playSfx = (type: 'hover' | 'click' | 'power') => {
    if (soundMuted) return;
    try {
      const frequencies = { hover: 300, click: 600, power: 800 };
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type === 'power' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(frequencies[type], ctx.currentTime);
      
      if (type === 'power') {
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.35);
      }
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Ignored
    }
  };

  const handlePlanetClick = (index: number) => {
    playSfx('power');
    setSelectedPlanet(index);
    setTimeout(() => {
      onEnter();
    }, 800);
  };

  return (
    <div className="min-h-screen cinematic-neon-bg relative overflow-x-hidden flex flex-col font-sans text-white select-none">
      {/* 3D Perspective Floor Grid */}
      <div className="perspective-grid" />

      {/* Futuristic Grid Overlay Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-35" />

      {/* Floating Stars particles */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [0.15, 0.9, 0.15],
            y: [0, -15, 0],
          }}
          transition={{
            duration: star.speed,
            repeat: Infinity,
            ease: "easeInOut",
            delay: star.delay,
          }}
        />
      ))}

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] bg-brand-cyan/15 rounded-full blur-[130px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[35%] right-[8%] w-[500px] h-[500px] bg-brand-pink/15 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[10%] left-[25%] w-[480px] h-[480px] bg-brand-green/12 rounded-full blur-[130px] pointer-events-none mix-blend-screen" />

      {/* Top Navigation Header */}
      <motion.nav 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", type: "spring", stiffness: 100 }}
        className="h-24 px-6 lg:px-12 flex items-center justify-between relative z-20 max-w-7xl mx-auto w-full border-b border-white/5"
      >
        <div 
          onClick={() => playSfx('hover')}
          className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-[30px] border border-white/10 shadow-[0_0_20px_rgba(0,179,255,0.15)] cursor-pointer hover:border-brand-cyan/40 transition-all duration-300"
        >
          <Logo className="w-9 h-9 filter drop-shadow-[0_0_8px_rgba(0,179,255,0.4)]" />
          <span className="text-xl md:text-2xl font-display font-black tracking-tight text-white">
            EduAI <span className="text-brand-cyan text-glow-cyan font-display">Companion</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-6">
          <button 
            onClick={() => setSoundMuted(!soundMuted)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
            title={soundMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-brand-cyan icon-glow-cyan" />}
          </button>

          <button 
            onClick={() => { playSfx('click'); onEnter(); }} 
            className="hidden sm:block text-slate-300 font-bold hover:text-[#00B3FF] hover:text-glow-cyan transition-all font-display text-base tracking-wide"
          >
            Sign In
          </button>
          
          <button 
            onClick={() => { playSfx('power'); onEnter(); }}
            className="primary-neon-btn-cyan px-7 sm:px-9 py-3 rounded-[30px] font-display font-black text-sm tracking-wider cursor-pointer uppercase shadow-[0_0_15px_rgba(0,179,255,0.3)] hover:shadow-[0_0_25px_rgba(0,179,255,0.6)]"
          >
            Get Started!
          </button>
        </div>
      </motion.nav>

      {/* Immersive Hero Section */}
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 pt-14 pb-20 relative z-20 flex flex-col lg:flex-row items-center gap-14 lg:gap-8">
        
        {/* Left Side: Copywriting */}
        <motion.div
           initial={{ opacity: 0, x: -40 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="flex-1 text-center lg:text-left relative"
        >
          {/* Tagline Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: "spring" }}
            onClick={() => playSfx('hover')}
            className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full mb-6 text-xs font-black text-brand-green tracking-widest uppercase shadow-[0_0_15px_rgba(0,255,159,0.15)] cursor-pointer hover:border-brand-green/30"
          >
             <Sparkles size={14} className="text-brand-green icon-glow-green animate-pulse" /> 
             <span>Learning is an Adventure!</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-white mb-6 leading-[1.05] tracking-tight"
          >
            Unlock Your <br />
            <span className="text-brand-cyan text-glow-cyan">Super Powers</span> & <br />
            <span className="text-brand-yellow relative inline-block drop-shadow-[0_0_15px_rgba(255,223,64,0.35)] mt-1.5 font-display">
              Grade Galaxies!
              <motion.svg 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.7, ease: "easeInOut" }}
                className="absolute -bottom-3 left-0 w-full h-4 text-brand-yellow" 
                viewBox="0 0 200 20" 
                preserveAspectRatio="none"
              >
                <path d="M0,10 Q25,20 50,10 T100,10 T150,10 T200,10" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </motion.svg>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed font-sans"
          >
            Magic curriculum-aligned lesson plans, hyper-engaging homework tools, and your very own interactive AI robot tutor. Grade R-12 excellence unchained! 🚀
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button 
              onClick={() => { playSfx('power'); onEnter(); }}
              className="w-full sm:w-auto primary-neon-btn-green px-10 py-4.5 rounded-[36px] font-display font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <span>Launch Universe</span> 
              <ChevronRight strokeWidth={3} className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => { playSfx('click'); onEnter(); }}
              className="w-full sm:w-auto glass-neon-btn px-10 py-4.5 rounded-[36px] font-display font-bold text-base transition-all flex items-center justify-center cursor-pointer tracking-wide"
            >
              <Users size={18} className="mr-2 text-brand-cyan" />
              <span>Enter Portals</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Right Side: Holographic Mascot Preview (Interactive astronaut robot) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="flex-1 relative w-full max-w-md lg:max-w-none flex items-center justify-center"
        >
          {/* Circular Hologram Platform Grid */}
          <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 -bottom-6 animate-pulse blur-sm" />
          <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-dashed border-brand-cyan/40 -bottom-3 animate-spin-slow" />
          <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-brand-cyan/10 -bottom-1 blur-md" />

          {/* Glowing Vertical Scan beam */}
          <div className="absolute w-40 h-[280px] bg-gradient-to-t from-brand-cyan/20 to-transparent -bottom-2 z-10 clip-path-beam animate-pulse pointer-events-none" />

          {/* Direct Interactive Showcase Display */}
          <motion.div
            className="relative z-10 w-full max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-full rounded-[32px] overflow-hidden glass-neon-card shadow-[0_0_50px_rgba(0,179,255,0.2)] border-brand-cyan/40 p-1.5 relative">
              <ContentSlideshow />
            </div>
          </motion.div>

            {/* Float Badge 1: Streaks */}
            <motion.div 
              animate={{ y: [-6, 6, -6], rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
              className="absolute -bottom-4 -right-4 bg-brand-pink/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-white/20 z-20 flex items-center gap-1.5"
            >
              <Zap size={14} className="text-brand-yellow icon-glow-yellow fill-brand-yellow animate-bounce" />
              <span className="text-white font-display font-black text-xs uppercase tracking-wider">
                STREAK: 5🔥
              </span>
            </motion.div>

            {/* Float Badge 2: AI Status */}
            <motion.div 
              animate={{ y: [6, -6, 6], rotate: [5, -5, 5] }}
              transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 border border-brand-cyan/40 rounded-2xl shadow-lg z-20 flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-ping" />
              <span className="text-brand-cyan font-mono text-[10px] font-bold uppercase tracking-widest">
                AI BOT READY
              </span>
            </motion.div>
          </motion.div>
        </div>

      {/* Grade Galaxy Selection Section (3 Giant Planets) */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 relative z-20 border-t border-white/5">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan mb-3 inline-block">
            Grade Galaxies
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-tight">
            Choose Your <span className="text-brand-cyan text-glow-cyan font-display">Grade Planet</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mt-2 font-medium">
            Step onto a virtual coordinate calibrated specifically to Grade R through 12. Fun curriculum modules await!
          </p>
        </div>

        {/* The Planets Galaxy Ring */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Orbital path lines crossing the page back */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 pointer-events-none" />
          <div className="hidden md:block absolute top-[45%] left-[10%] right-[10%] h-36 border border-white/[0.03] rounded-[100%] transform -rotate-6 z-0 pointer-events-none" />

          {[
            { 
              id: 0,
              title: "The Little Explorers", 
              grades: "Grade R - 3", 
              desc: "Interactive visual quests, spelling trace-and-write, counting balloons, and matching phonics labs.",
              icon: "🐻🧑‍🚀", 
              color: "#00FF9F", 
              textGlow: "text-glow-green", 
              glowClass: "hover:shadow-[0_0_30px_rgba(0,255,159,0.5),inset_0_0_15px_rgba(0,255,159,0.2)]",
              border: "hover:border-[#00FF9F] border-brand-green/20",
              planetGradient: "from-brand-green via-emerald-800 to-slate-950",
              ringStyle: "border-[#00FF9F]/30 animate-spin-slow",
              avatarImg: "https://i.ibb.co/CsvbkGYG/landing-image.jpg"
            },
            { 
              id: 1,
              title: "The Quest Seekers", 
              grades: "Grade 4 - 7", 
              desc: "Gamified reward achievements, structured history quizzes, science lab builders, and creative reading guides.",
              icon: "🤖🚀", 
              color: "#00B3FF", 
              textGlow: "text-glow-cyan", 
              glowClass: "hover:shadow-[0_0_30px_rgba(0,179,255,0.5),inset_0_0_15px_rgba(0,179,255,0.2)]",
              border: "hover:border-[#00B3FF] border-brand-cyan/20",
              planetGradient: "from-brand-cyan via-blue-900 to-slate-950",
              ringStyle: "border-[#00B3FF]/30 animate-reverse-spin",
              avatarImg: "https://i.ibb.co/CsvbkGYG/landing-image.jpg"
            },
            { 
              id: 2,
              title: "The Master Minds", 
              grades: "Grade 8 - 12", 
              desc: "Formal caps revision papers, chemistry workspace, formula sheets, diagnostic test grids, and direct AI marking.",
              icon: "👽📚", 
              color: "#FF00D4", 
              textGlow: "text-glow-pink", 
              glowClass: "hover:shadow-[0_0_30px_rgba(255,0,212,0.5),inset_0_0_15px_rgba(255,0,212,0.2)]",
              border: "hover:border-[#FF00D4] border-brand-pink/20",
              planetGradient: "from-brand-pink via-purple-900 to-slate-950",
              ringStyle: "border-[#FF00D4]/30 animate-spin-slow",
              avatarImg: "https://i.ibb.co/CsvbkGYG/landing-image.jpg"
            },
          ].map((galaxy) => {
            const isHovered = hoveredPlanet === galaxy.id;
            const isSelected = selectedPlanet === galaxy.id;

            return (
              <motion.div 
                key={galaxy.id}
                onMouseEnter={() => { setHoveredPlanet(galaxy.id); playSfx('hover'); }}
                onMouseLeave={() => setHoveredPlanet(null)}
                onClick={() => handlePlanetClick(galaxy.id)}
                className={`group glass-neon-card p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-500 border ${galaxy.border} ${galaxy.glowClass} ${
                  isSelected ? 'scale-95 border-white shadow-[0_0_40px_white]' : 'relative z-10'
                }`}
                animate={{
                  y: isHovered ? -12 : 0,
                  scale: isSelected ? 0.95 : isHovered ? 1.03 : 1
                }}
              >
                {/* 3D-like Planet Sphere with Orbital Ring */}
                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                  
                  {/* Swirling Orbital Ring */}
                  <div className={`absolute inset-0 border-[2px] rounded-full transform -rotate-[35deg] scale-135 pointer-events-none ${galaxy.ringStyle}`} />
                  
                  {/* Planet core shadow & gradients */}
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${galaxy.planetGradient} shadow-inner relative overflow-hidden flex items-center justify-center border border-white/10`}>
                    {/* Planet Surface details */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
                    <div className="absolute w-6 h-3 bg-white/15 rounded-full top-6 left-5 blur-sm transform -rotate-12" />
                    <div className="absolute w-12 h-6 bg-black/30 rounded-full bottom-4 right-3 blur-xs transform -rotate-12" />
                    
                    {/* Planet Emoji Icon */}
                    <span className="text-4xl z-10 filter drop-shadow-md select-none group-hover:scale-115 transition-transform duration-300">{galaxy.icon}</span>
                  </div>
                </div>

                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg mb-3 bg-white/5 border border-white/10`} style={{ color: galaxy.color }}>
                  {galaxy.grades}
                </span>

                <h3 className="text-xl font-display font-black text-white mb-3 group-hover:text-white transition-colors">
                  {galaxy.title}
                </h3>
                
                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6 px-2 flex-1">
                  {galaxy.desc}
                </p>

                <div 
                  className={`mt-auto px-5 py-2 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    isHovered ? 'bg-white/10 border-white text-white' : 'border-white/15 text-slate-400'
                  }`}
                >
                  <span>Launch Planet</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Teacher Magic Studio Layout Section (Bento Grid) */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 relative z-20 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Mock Workspace Simulator */}
          <div className="lg:col-span-5 w-full">
            <div className="glass-neon-card p-6 border-white/10 bg-slate-950/50 relative overflow-hidden shadow-[0_0_40px_rgba(255,0,212,0.15)] rounded-3xl animate-neon-pulse-pink">
              
              {/* Simulator Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-brand-pink icon-glow-pink" />
                  <span className="text-xs font-black tracking-wider uppercase text-slate-200 font-display">AI Lesson Architect Simulator</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Tablet Content Screen */}
              <div className="text-left bg-slate-950/75 rounded-2xl p-5 border border-white/5 min-h-[310px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-pink bg-brand-pink/10 px-2.5 py-1 rounded border border-brand-pink/15">
                      Interactive Planner
                    </span>
                    <span className="text-[10px] font-mono text-brand-pink font-bold">MODE: MAGIC</span>
                  </div>
                  
                  <h4 className="text-xl font-display font-black text-white leading-tight mb-2">
                    AI Magic Lesson Plan
                  </h4>
                  <p className="text-xs text-slate-400 font-sans mb-5">
                    Target Subject: Grade 10 Physical Sciences · Newton's Laws
                  </p>

                  {/* Interactive Timeline Tabs */}
                  <div className="space-y-3">
                    {[
                      { id: 'engage', label: 'Engage: Interactive Quiz', detail: 'Instant gamified buzzer quiz to test prior dynamics knowledge.' },
                      { id: 'explore', label: 'Explore: VR Gravity Journey', detail: 'Immersive simulated space gravity mechanics explorer.' },
                      { id: 'evaluate', label: 'Evaluate: AI Formative grading', detail: 'Instant diagnostic feedback rubric grading SBA.' }
                    ].map((phase) => (
                      <div 
                        key={phase.id}
                        onClick={() => { setActiveLessonPhase(phase.id as any); playSfx('click'); }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          activeLessonPhase === phase.id
                            ? 'bg-brand-pink/10 border-brand-pink shadow-[0_0_15px_rgba(255,0,212,0.3)]'
                            : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            activeLessonPhase === phase.id ? 'text-brand-pink font-display' : 'text-slate-400'
                          }`}>
                            {phase.label}
                          </span>
                          <div className={`w-1.5 h-1.5 rounded-full ${activeLessonPhase === phase.id ? 'bg-brand-pink animate-pulse' : 'bg-transparent'}`} />
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-normal">
                          {phase.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-5">
                  <span className="text-[10px] font-mono text-brand-green">PLANNER ACTIVE</span>
                  <button 
                    onClick={() => { playSfx('power'); onEnter(); }}
                    className="px-3 py-1.5 bg-[#FF00D4]/10 hover:bg-[#FF00D4]/20 text-brand-pink border border-brand-pink/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <span>Launch Editor</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Side: Showcase copy & 3 Bento grid feature items */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-lg bg-brand-pink/10 text-brand-pink mb-2.5 inline-block">
              Teacher Magic
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-tight mb-4">
              Unlock AI-Powered <span className="text-brand-pink text-glow-pink font-display">Magic Studio</span>
            </h2>
            <p className="text-base text-slate-300 font-sans leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Transform lesson planning, diagnostic analytics trackers, and exam preparation guides in seconds. Tailored explicitly to teachers' workloads.
            </p>

            {/* Bento Grid Features */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  title: "AI Lesson Architect", 
                  desc: "Instantly generate personalized, CAPS curriculum-aligned lesson plans with full step-by-step scripts.",
                  glow: "hover-neon-pink border-brand-pink/25",
                  icon: Blocks,
                  iconColor: "text-brand-pink icon-glow-pink"
                },
                { 
                  title: "Insight Galaxy", 
                  desc: "Visualize detailed classroom mark sheets and identify lesson gaps automatically.",
                  glow: "hover-neon-cyan border-brand-cyan/25",
                  icon: LineChart,
                  iconColor: "text-brand-cyan icon-glow-cyan"
                },
                { 
                  title: "Resource Summoner", 
                  desc: "Generate custom revision worksheets, formal rubrics, and diagnostic memo answer guides instantly.",
                  glow: "hover-neon-green border-brand-green/25",
                  icon: Layers,
                  iconColor: "text-brand-green icon-glow-green"
                }
              ].map((card, i) => {
                const CardIcon = card.icon;
                return (
                  <div 
                    key={i}
                    onClick={() => { playSfx('click'); onEnter(); }}
                    className={`glass-neon-card p-5 border flex gap-4 items-start text-left cursor-pointer transition-all ${card.glow}`}
                  >
                    <div className="w-12 h-12 bg-slate-900/60 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                      <CardIcon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-white mb-1">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 font-sans leading-normal">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-5 mt-8 justify-center lg:justify-start">
              <button 
                onClick={() => { playSfx('click'); onEnter(); }}
                className="text-xs font-black uppercase tracking-wider text-brand-pink hover:text-pink-400 transition-colors flex items-center gap-1.5 focus:outline-none"
              >
                <span>Explore All Features</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-500" />
              <button 
                onClick={() => { playSfx('power'); onEnter(); }}
                className="text-xs font-black uppercase tracking-wider text-brand-cyan hover:text-cyan-400 transition-colors flex items-center gap-1.5 focus:outline-none"
              >
                <span>Get Started for Free</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Your Super Powers Capability Cards Grid */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 relative z-20 border-t border-white/5">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-lg bg-brand-yellow/10 text-brand-yellow mb-3 inline-block">
            Comprehensive Suite
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-glow-pink">
            Your <span className="text-brand-pink font-display">Super Powers!</span> 🦸‍♂️
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mt-2 font-medium">
            Everything you need to be a high-scoring student or a master teacher, all powered by our next-gen educational engine.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Magic Lessons", desc: "Create amazing lesson plans in a flash! Perfect for any subject or grade band.", icon: MagicLessonsIcon, glow: "hover-neon-pink border-brand-pink/20", iconBg: "text-brand-pink icon-glow-pink" },
            { title: "Super Worksheets", desc: "Fun interactive worksheets and exercises that you'll actually love solving!", icon: SuperWorksheetsIcon, glow: "hover-neon-green border-brand-green/20", iconBg: "text-brand-green icon-glow-green" },
            { title: "Smart Bot Tutor", desc: "Ask your friendly AI astronaut tutor anything, anytime! It has answers for everything.", icon: SmartBotTutorIcon, glow: "hover-neon-cyan border-brand-cyan/20", iconBg: "text-brand-cyan icon-glow-cyan" },
            { title: "Instant Grades", desc: "Get diagnostic grading scores and feedback tips instantly. No more waiting!", icon: QuizQuestsIcon, glow: "hover-neon-pink border-brand-pink/20", iconBg: "text-brand-pink icon-glow-pink" },
            { title: "Skill Tracker", desc: "Watch your knowledge level grow like a rocket ship! Reach the top scores.", icon: ProgressTrophiesIcon, glow: "hover-neon-green border-brand-green/20", iconBg: "text-brand-green icon-glow-green" },
            { title: "Cool Posters", desc: "Produce beautifully illustrated study summary posters for your bedroom or classroom.", icon: CreativeCanvasIcon, glow: "hover-neon-cyan border-brand-cyan/20", iconBg: "text-brand-cyan icon-glow-cyan" },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
              onClick={() => { playSfx('click'); onEnter(); }}
              className={`group glass-neon-card p-8 text-center cursor-pointer border transition-all duration-300 ${feature.glow}`}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-slate-900/60 border border-white/10 group-hover:scale-110 transition-transform">
                <feature.icon className={`w-8 h-8 ${feature.iconBg}`} />
              </div>
              <h3 className="text-xl font-display font-black text-white mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Futuristic Interactive Footer */}
      <footer className="mt-auto px-6 lg:px-12 py-10 bg-slate-950/90 border-t border-white/5 text-center lg:text-left flex flex-col lg:flex-row justify-between items-center gap-6 text-sm font-bold text-slate-400 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(0,179,255,0.4)]" />
          <span className="text-lg font-display font-black tracking-tight text-white">
            EduAI <span className="text-brand-cyan text-glow-cyan font-display">Companion</span>
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs uppercase tracking-wider font-bold">
          <button onClick={() => { playSfx('click'); onEnter(); }} className="hover:text-white transition-colors">Lesson Studio</button>
          <button onClick={() => { playSfx('click'); onEnter(); }} className="hover:text-white transition-colors">AI Tutor</button>
          <button onClick={() => { playSfx('click'); onEnter(); }} className="hover:text-white transition-colors">Grading Lab</button>
          <button onClick={() => { playSfx('click'); onEnter(); }} className="hover:text-white transition-colors">Student Portal</button>
        </div>
        <p className="text-xs font-sans">© 2026 EduAI Companion. Powered by Cinematic Neon Grid.</p>
      </footer>
    </div>
  );
}
