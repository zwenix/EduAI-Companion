import React from 'react';
import { motion } from 'motion/react';
import EllyMascot from './Mascot';

interface LoadingMascotProps {
  message?: string;
  subtitle?: string;
  isFullHeight?: boolean;
}

export default function LoadingMascot({
  message = "Opening learning portal...",
  subtitle = "Preparing your interactive space",
  isFullHeight = true
}: LoadingMascotProps) {
  const [isMuted, setIsMuted] = React.useState(() => localStorage.getItem('eduai_sound_muted') === 'true');

  React.useEffect(() => {
    const handleAccessibilityChange = () => {
      setIsMuted(localStorage.getItem('eduai_sound_muted') === 'true');
    };
    window.addEventListener('eduai_accessibility_change', handleAccessibilityChange);
    return () => {
      window.removeEventListener('eduai_accessibility_change', handleAccessibilityChange);
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${isFullHeight ? 'min-h-[450px] w-full' : 'py-12'}`}>
      
      {/* Container with interactive floating buddy */}
      <div className="relative mb-6">
        
        {/* Glow behind the mascot */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-2xl ${isMuted ? 'opacity-30' : 'animate-pulse'} pointer-events-none`} />

        {/* Float & Bob Animation Wrapper */}
        <motion.div
          animate={isMuted ? {} : {
            y: [0, -12, 0],
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 w-28 h-28 flex items-center justify-center cursor-pointer"
        >
          {/* Elly 2.0 — the shared EduAI mascot (same buddy as the AI Tutor) */}
          <EllyMascot className="w-full h-full" animated={!isMuted} />

          {/* Sparkles rotating around head */}
          {!isMuted && (
            <>
              <div className="absolute top-2 left-2 text-yellow-400 text-xs animate-spin" style={{ animationDuration: '8s' }}>✨</div>
              <div className="absolute bottom-2 right-2 text-pink-400 text-xs animate-spin" style={{ animationDuration: '5s' }}>🌟</div>
            </>
          )}
        </motion.div>

        {/* Shadow that grows/shrinks matching bobbing */}
        <div className={`w-16 h-2 bg-black/30 rounded-full mx-auto blur-md mt-1 ${isMuted ? '' : 'animate-[pulse_2s_infinite]'}`} />
      </div>

      {/* Main Messages */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 bg-clip-text text-transparent italic drop-shadow-sm font-hand">
          {message}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-400 uppercase tracking-widest font-black font-sans leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Modern fluid wave-bar indicator */}
      <div className="w-48 h-1.5 bg-slate-800/95 rounded-full mt-6 overflow-hidden border border-white/5 relative">
        {!isMuted ? (
          <motion.div
            animate={{
              left: ["-100%", "100%"]
            }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "easeInOut"
            }}
            className="absolute h-full w-24 bg-gradient-to-r from-transparent via-brand-cyan to-transparent rounded-full"
          />
        ) : (
          <div className="absolute h-full w-full bg-brand-cyan/40" />
        )}
      </div>

      {/* Ambient tip generator below the visual block */}
      <p className="text-[10px] text-slate-500 italic mt-6 font-mono tracking-wide">
        🤖 EduAI Companion tip: Consistency unlocks double-XP and higher grade achievements!
      </p>
    </div>
  );
}
