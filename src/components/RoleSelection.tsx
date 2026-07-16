import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ToyBrick, 
  Heart, 
  Puzzle, 
  Loader2, 
  Sparkles, 
  Rocket, 
  Navigation, 
  Orbit, 
  ChevronRight, 
  UserCheck, 
  Star,
  Users,
  Settings,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Role = 'teacher' | 'student' | 'parent' | 'admin';

interface RoleSelectionProps {
  onComplete: (role: Role) => void;
  onBack: () => void;
}

export default function RoleSelection({ onComplete, onBack }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedGalaxy, setSelectedGalaxy] = useState<string | null>(null);
  const [step, setStep] = useState<'role' | 'galaxy'>('role');
  const [showAltPortals, setShowAltPortals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate random stars for background
    const newStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1.2,
      delay: Math.random() * 3,
    }));
    setStars(newStars);
  }, []);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role === 'student') {
      setTimeout(() => {
        setStep('galaxy');
      }, 350);
    }
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    
    setLoading(true);
    if (selectedRole === 'student' && selectedGalaxy) {
      localStorage.setItem('eduai_student_galaxy', selectedGalaxy);
    }
    
    setTimeout(() => {
      onComplete(selectedRole);
    }, 600);
  };

  return (
    <main className="min-h-screen cinematic-neon-bg px-4 sm:px-6 py-10 text-white flex flex-col justify-center relative overflow-hidden font-sans select-none">
      {/* 3D Perspective Floor Grid */}
      <div className="perspective-grid" />

      {/* Background Star Particles */}
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
            opacity: [0.15, 0.85, 0.15],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 2.5 + star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 relative z-10">
        
        <AnimatePresence mode="wait">
          {step === 'role' ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              {/* Top Banner Tag */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 rounded-full border border-yellow-400 bg-yellow-400/10 backdrop-blur-md px-5 py-2 text-xs font-black text-yellow-300 mb-4 shadow-[0_0_15px_rgba(250,204,21,0.2)] tracking-widest uppercase font-mono"
              >
                <Sparkles className="h-4 w-4 icon-glow-yellow animate-pulse" />
                <span>EduAI Role Selector</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-display font-black text-center tracking-tight text-white mb-2 leading-none">
                Choose Your <span className="text-brand-pink text-glow-pink">Portal</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 text-center font-medium max-w-xl mb-12">
                Select your designated portal coordinate to enter the immersive EduAI Companion environment.
              </p>

              {/* Comprehensive 4-Column Responsive Grid Portals */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
                
                {/* 1. Student Portal Orb */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -4 }}
                  onClick={() => handleRoleSelect('student')}
                  className={`group rounded-[40px] p-6 border cursor-pointer transition-all duration-300 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[410px] ${
                    selectedRole === 'student'
                      ? 'bg-brand-pink/15 border-brand-pink shadow-[0_0_40px_rgba(255,0,212,0.45),inset_0_0_15px_rgba(255,0,212,0.2)]'
                      : 'bg-white/[0.02] border-white/10 hover:border-brand-pink/40 hover:bg-white/[0.05] hover:shadow-[0_0_25px_rgba(255,0,212,0.25)]'
                  }`}
                >
                  {/* Swirling double orbital rings */}
                  <div className="absolute w-48 h-48 rounded-full border border-brand-pink/15 animate-spin-slow scale-110 top-5 pointer-events-none" />
                  <div className="absolute w-36 h-36 rounded-full border border-dashed border-brand-cyan/15 animate-reverse-spin scale-100 top-10 pointer-events-none" />

                  {/* Mascot Sphere */}
                  <div className="w-28 h-28 rounded-full bg-slate-900/60 border border-white/15 flex items-center justify-center mb-5 relative overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-pink/20 to-transparent pointer-events-none" />
                    <ToyBrick className="w-12 h-12 text-brand-pink icon-glow-pink" />
                    {/* Mascot character emoji floating inside */}
                    <span className="absolute text-2xl top-4 right-4 animate-bounce">👩‍🚀</span>
                    <span className="absolute bottom-2 text-[8px] font-mono font-bold uppercase tracking-wider text-brand-pink bg-brand-pink/10 px-2 py-0.5 rounded border border-brand-pink/20">
                      CADET
                    </span>
                  </div>

                  <div className="relative z-10 flex-grow flex flex-col justify-center">
                    <h2 className="font-display text-xl font-black mb-1.5 text-white group-hover:text-glow-pink transition-all">
                      Student Portal
                    </h2>
                    <p className="text-[11px] text-slate-300 font-sans max-w-xs leading-relaxed">
                      Start your learning adventure! Play curriculum levels, chat with your friendly AI tutor, and solve galaxy quizzes.
                    </p>
                  </div>

                  {/* Portal Button */}
                  <div className={`mt-6 w-full py-3.5 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 shrink-0 ${
                    selectedRole === 'student'
                      ? 'primary-neon-btn-pink border-transparent'
                      : 'border-brand-pink/35 text-brand-pink bg-brand-pink/5 hover:bg-brand-pink/10'
                  }`}>
                    <Rocket size={14} className="animate-bounce" />
                    <span>I am a Student</span>
                  </div>
                </motion.div>

                {/* 2. Teacher Portal Orb */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -4 }}
                  onClick={() => handleRoleSelect('teacher')}
                  className={`group rounded-[40px] p-6 border cursor-pointer transition-all duration-300 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[410px] ${
                    selectedRole === 'teacher'
                      ? 'bg-brand-green/15 border-brand-green shadow-[0_0_40px_rgba(0,255,159,0.45),inset_0_0_15px_rgba(0,255,159,0.2)]'
                      : 'bg-white/[0.02] border-white/10 hover:border-brand-green/40 hover:bg-white/[0.05] hover:shadow-[0_0_25px_rgba(0,255,159,0.25)]'
                  }`}
                >
                  {/* Swirling double orbital rings */}
                  <div className="absolute w-48 h-48 rounded-full border border-brand-green/15 animate-spin-slow scale-110 top-5 pointer-events-none" />
                  <div className="absolute w-36 h-36 rounded-full border border-dashed border-brand-yellow/15 animate-reverse-spin scale-100 top-10 pointer-events-none" />

                  {/* Mascot Sphere */}
                  <div className="w-28 h-28 rounded-full bg-slate-900/60 border border-white/15 flex items-center justify-center mb-5 relative overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/20 to-transparent pointer-events-none" />
                    <GraduationCap className="w-12 h-12 text-brand-green icon-glow-green" />
                    {/* Mascot character emoji floating inside */}
                    <span className="absolute text-2xl top-4 right-4 animate-pulse">🧙‍♀️</span>
                    <span className="absolute bottom-2 text-[8px] font-mono font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                      WIZARD
                    </span>
                  </div>

                  <div className="relative z-10 flex-grow flex flex-col justify-center">
                    <h2 className="font-display text-xl font-black mb-1.5 text-white group-hover:text-glow-green transition-all">
                      Teacher Portal
                    </h2>
                    <p className="text-[11px] text-slate-300 font-sans max-w-xs leading-relaxed">
                      Design magic lesson plans, generate diagnostic print worksheets, track classroom marks, and summon slides.
                    </p>
                  </div>

                  {/* Portal Button */}
                  <div className={`mt-6 w-full py-3.5 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 shrink-0 ${
                    selectedRole === 'teacher'
                      ? 'primary-neon-btn-green border-transparent'
                      : 'border-brand-green/35 text-brand-green bg-brand-green/5 hover:bg-brand-green/10'
                  }`}>
                    <Sparkles size={14} />
                    <span>I am a Teacher</span>
                  </div>
                </motion.div>

                {/* 3. Parent Portal Orb */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -4 }}
                  onClick={() => handleRoleSelect('parent')}
                  className={`group rounded-[40px] p-6 border cursor-pointer transition-all duration-300 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[410px] ${
                    selectedRole === 'parent'
                      ? 'bg-brand-cyan/15 border-brand-cyan shadow-[0_0_40px_rgba(0,179,255,0.45),inset_0_0_15px_rgba(0,179,255,0.2)]'
                      : 'bg-white/[0.02] border-white/10 hover:border-brand-cyan/40 hover:bg-white/[0.05] hover:shadow-[0_0_25px_rgba(0,179,255,0.25)]'
                  }`}
                >
                  {/* Swirling double orbital rings */}
                  <div className="absolute w-48 h-48 rounded-full border border-brand-cyan/15 animate-spin-slow scale-110 top-5 pointer-events-none" />
                  <div className="absolute w-36 h-36 rounded-full border border-dashed border-brand-pink/15 animate-reverse-spin scale-100 top-10 pointer-events-none" />

                  {/* Mascot Sphere */}
                  <div className="w-28 h-28 rounded-full bg-slate-900/60 border border-white/15 flex items-center justify-center mb-5 relative overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/20 to-transparent pointer-events-none" />
                    <Heart className="w-12 h-12 text-brand-cyan icon-glow-cyan" />
                    {/* Mascot character emoji floating inside */}
                    <span className="absolute text-2xl top-4 right-4 animate-pulse">👼</span>
                    <span className="absolute bottom-2 text-[8px] font-mono font-bold uppercase tracking-wider text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
                      GUARDIAN
                    </span>
                  </div>

                  <div className="relative z-10 flex-grow flex flex-col justify-center">
                    <h2 className="font-display text-xl font-black mb-1.5 text-white group-hover:text-glow-cyan transition-all">
                      Parent Portal
                    </h2>
                    <p className="text-[11px] text-slate-300 font-sans max-w-xs leading-relaxed">
                      Monitor learning journeys, track real-time milestone completions, check diagnostic reports, and guide development.
                    </p>
                  </div>

                  {/* Portal Button */}
                  <div className={`mt-6 w-full py-3.5 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 shrink-0 ${
                    selectedRole === 'parent'
                      ? 'primary-neon-btn-cyan border-transparent'
                      : 'border-brand-cyan/35 text-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/10'
                  }`}>
                    <ShieldCheck size={14} />
                    <span>I am a Parent</span>
                  </div>
                </motion.div>

                {/* 4. Admin Portal Orb */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -4 }}
                  onClick={() => handleRoleSelect('admin')}
                  className={`group rounded-[40px] p-6 border cursor-pointer transition-all duration-300 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[410px] ${
                    selectedRole === 'admin'
                      ? 'bg-brand-yellow/15 border-brand-yellow shadow-[0_0_40px_rgba(255,223,64,0.45),inset_0_0_15px_rgba(255,223,64,0.2)]'
                      : 'bg-white/[0.02] border-white/10 hover:border-brand-yellow/40 hover:bg-white/[0.05] hover:shadow-[0_0_25px_rgba(255,223,64,0.25)]'
                  }`}
                >
                  {/* Swirling double orbital rings */}
                  <div className="absolute w-48 h-48 rounded-full border border-brand-yellow/15 animate-spin-slow scale-110 top-5 pointer-events-none" />
                  <div className="absolute w-36 h-36 rounded-full border border-dashed border-brand-green/15 animate-reverse-spin scale-100 top-10 pointer-events-none" />

                  {/* Mascot Sphere */}
                  <div className="w-28 h-28 rounded-full bg-slate-900/60 border border-white/15 flex items-center justify-center mb-5 relative overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-yellow/20 to-transparent pointer-events-none" />
                    <Settings className="w-12 h-12 text-brand-yellow icon-glow-yellow" />
                    {/* Mascot character emoji floating inside */}
                    <span className="absolute text-2xl top-4 right-4 animate-bounce">👑</span>
                    <span className="absolute bottom-2 text-[8px] font-mono font-bold uppercase tracking-wider text-brand-yellow bg-brand-yellow/10 px-2 py-0.5 rounded border border-brand-yellow/20">
                      OVERSEER
                    </span>
                  </div>

                  <div className="relative z-10 flex-grow flex flex-col justify-center">
                    <h2 className="font-display text-xl font-black mb-1.5 text-white group-hover:text-glow-yellow transition-all">
                      Admin Portal
                    </h2>
                    <p className="text-[11px] text-slate-300 font-sans max-w-xs leading-relaxed">
                      Manage school coordinates, oversee teacher resources, inspect CAPS curriculum mapping, and configure academy nodes.
                    </p>
                  </div>

                  {/* Portal Button */}
                  <div className={`mt-6 w-full py-3.5 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 shrink-0 ${
                    selectedRole === 'admin'
                      ? 'bg-brand-yellow text-slate-950 font-black border-transparent shadow-[0_0_15px_rgba(255,223,64,0.5)] hover:shadow-[0_0_25px_rgba(255,223,64,0.75)] hover:bg-yellow-300'
                      : 'border-brand-yellow/35 text-brand-yellow bg-brand-yellow/5 hover:bg-brand-yellow/10'
                  }`}>
                    <UserCheck size={14} />
                    <span>I am an Admin</span>
                  </div>
                </motion.div>

              </section>

            </motion.div>
          ) : (
            <motion.div
              key="galaxy-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400 bg-cyan-400/10 backdrop-blur-md px-5 py-2 text-xs font-black text-cyan-300 mb-4 shadow-[0_0_15px_rgba(0,179,255,0.2)] tracking-widest uppercase font-mono"
              >
                <Orbit className="h-4 w-4 icon-glow-cyan animate-spin-slow" />
                <span>Grade Galaxy Selector</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-display font-black text-center tracking-tight text-white mb-2 leading-none">
                Choose Your <span className="text-brand-cyan text-glow-cyan">Galaxy</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 text-center font-medium max-w-xl mb-10">
                Select your student learning planet to calibrate curriculum parameters.
              </p>

              {/* Galaxies Grid */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
                {[
                  {
                    id: 'explorers',
                    title: 'The Little Explorers',
                    grades: 'Grade R - 3',
                    desc: 'Interactive visual quests, phonics spelling games, trace tracing, and counting balloon puzzles.',
                    icon: '🐻🧑‍🚀',
                    colorClass: 'text-brand-green',
                    bgGlow: 'hover:shadow-[0_0_25px_rgba(0,255,159,0.45),inset_0_0_12px_rgba(0,255,159,0.2)]',
                    borderColor: 'border-brand-green/20 hover:border-brand-green/50',
                    activeColor: 'border-brand-green',
                    gradient: 'from-brand-green via-emerald-800 to-slate-950'
                  },
                  {
                    id: 'seekers',
                    title: 'The Quest Seekers',
                    grades: 'Grade 4 - 7',
                    desc: 'Gamified reward achievements, structured history logs, simulated science lab builders, and reading cards.',
                    icon: '🤖🚀',
                    colorClass: 'text-brand-cyan',
                    bgGlow: 'hover:shadow-[0_0_25px_rgba(0,179,255,0.45),inset_0_0_12px_rgba(0,179,255,0.2)]',
                    borderColor: 'border-brand-cyan/20 hover:border-brand-cyan/50',
                    activeColor: 'border-brand-cyan',
                    gradient: 'from-brand-cyan via-blue-900 to-slate-950'
                  },
                  {
                    id: 'masterminds',
                    title: 'The Master Minds',
                    grades: 'Grade 8 - 12',
                    desc: 'Formal South African CAPS test sheets, exam revision guides, chemistry calculations, and instant marking grids.',
                    icon: '👽📚',
                    colorClass: 'text-brand-pink',
                    bgGlow: 'hover:shadow-[0_0_25px_rgba(255,0,212,0.45),inset_0_0_12px_rgba(255,0,212,0.2)]',
                    borderColor: 'border-brand-pink/20 hover:border-brand-pink/50',
                    activeColor: 'border-brand-pink',
                    gradient: 'from-brand-pink via-purple-900 to-slate-950'
                  }
                ].map((galaxy) => {
                  const active = selectedGalaxy === galaxy.id;
                  return (
                    <motion.button
                      key={galaxy.id}
                      type="button"
                      onClick={() => setSelectedGalaxy(galaxy.id)}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group flex flex-col items-center text-center rounded-[32px] p-6 transition-all duration-300 outline-none relative overflow-hidden backdrop-blur-md border ${
                        active 
                          ? `bg-white/10 ${galaxy.activeColor} ${galaxy.bgGlow}`
                          : `bg-white/[0.02] ${galaxy.borderColor}`
                      }`}
                    >
                      {/* Galaxy Emoji Avatar Sphere */}
                      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 border border-white/5 rounded-full scale-110 pointer-events-none" />
                        <div className={`w-18 h-18 rounded-full bg-gradient-to-tr ${galaxy.gradient} flex items-center justify-center shadow-md`}>
                          <span className="text-3xl filter drop-shadow-md">{galaxy.icon}</span>
                        </div>
                      </div>
                      
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 bg-white/5 border border-white/10 ${galaxy.colorClass}`}>
                        {galaxy.grades}
                      </span>

                      <h2 className="font-display text-lg font-black tracking-wide mb-2 text-white">
                        {galaxy.title}
                      </h2>
                      
                      <p className="text-xs text-slate-300 leading-relaxed font-sans px-2">
                        {galaxy.desc}
                      </p>

                      <div className={`mt-5 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all ${
                        active
                          ? 'bg-white/10 border-white text-white'
                          : 'border-white/15 text-white/50 group-hover:text-white'
                      }`}>
                        {active ? 'Selected' : 'Select Planet'}
                      </div>
                    </motion.button>
                  );
                })}
              </section>

              <button
                type="button"
                onClick={() => setStep('role')}
                className="mt-8 text-xs font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1.5 focus:outline-none font-mono"
              >
                <ChevronLeft size={14} />
                <span>Back to Portals</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-6"
        >
          <motion.button
            whileHover={(selectedRole && (selectedRole !== 'student' || selectedGalaxy)) && !loading ? { scale: 1.02 } : {}}
            whileTap={(selectedRole && (selectedRole !== 'student' || selectedGalaxy)) && !loading ? { scale: 0.98 } : {}}
            type="button"
            onClick={handleContinue}
            disabled={loading || !selectedRole || (selectedRole === 'student' && !selectedGalaxy)}
            className={`group inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-black transition-all shadow-[0_10px_25px_rgba(0,0,0,0.35)] disabled:opacity-40 disabled:cursor-not-allowed ${
              selectedRole === 'student' 
                ? 'primary-neon-btn-pink' 
                : selectedRole === 'teacher'
                ? 'primary-neon-btn-green'
                : selectedRole === 'parent'
                ? 'primary-neon-btn-cyan'
                : 'primary-neon-btn-cyan'
            }`}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Rocket className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
            <span>
              {selectedRole === 'student' && !selectedGalaxy ? 'Select a Galaxy Planet' : selectedRole ? 'Start Adventure!' : 'Select a Portal'}
            </span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/5 hover:border-white/40 shadow-lg"
          >
            <ChevronLeft size={16} />
            <span>Go Back</span>
          </motion.button>
        </motion.div>

      </div>
    </main>
  );
}
