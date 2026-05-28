import React from 'react';
import { motion } from 'motion/react';

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
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${isFullHeight ? 'min-h-[450px] w-full' : 'py-12'}`}>
      
      {/* Container with interactive floating buddy */}
      <div className="relative mb-6">
        
        {/* Glow behind the mascot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Float & Bob Animation Wrapper */}
        <motion.div
          animate={{
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
          {/* Adorable SVG Mascot Drawing */}
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_8px_24px_rgba(6,182,212,0.3)]">
            {/* Left and Right Antenna/Ears */}
            <path d="M 30,52 Q 20,40 18,30" stroke="url(#mascotGradient)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 90,52 Q 100,40 102,30" stroke="url(#mascotGradient)" strokeWidth="4" strokeLinecap="round" fill="none" />
            
            {/* Soft pulse circles on ends of antenna */}
            <circle cx="18" cy="30" r="5" fill="#eab308" className="animate-ping origin-center" style={{ transformOrigin: '18px 30px' }} />
            <circle cx="18" cy="30" r="5" fill="#eab308" />
            
            <circle cx="102" cy="30" r="5" fill="#ec4899" className="animate-ping origin-center" style={{ transformOrigin: '102px 30px' }} />
            <circle cx="102" cy="30" r="5" fill="#ec4899" />

            {/* Main Robot Head */}
            <rect x="25" y="45" width="70" height="55" rx="20" fill="#0f172a" stroke="url(#mascotGradient)" strokeWidth="5" />
            
            {/* Face screen panel */}
            <rect x="33" y="52" width="54" height="40" rx="12" fill="#1e293b" />

            {/* Friendly Display Screen Eyes */}
            {/* Left Eye */}
            <g>
              <ellipse cx="48" cy="68" rx="6" ry="7" fill="#06b6d4" />
              <circle cx="46" cy="65" r="2" fill="white" />
              {/* Eye blinking overlay with keyframe anim */}
              <ellipse cx="48" cy="68" rx="6" ry="1" fill="#1e293b" className="animate-[bounce_3s_infinite]" />
            </g>

            {/* Right Eye */}
            <g>
              <ellipse cx="72" cy="68" rx="6" ry="7" fill="#06b6d4" />
              <circle cx="70" cy="65" r="2" fill="white" />
              {/* Eye blinking overlay with keyframe anim */}
              <ellipse cx="72" cy="68" rx="6" ry="1" fill="#1e293b" className="animate-[bounce_3s_infinite]" />
            </g>

            {/* Cute Cheek Blushes */}
            <circle cx="40" cy="78" r="3" fill="#ec4899" opacity="0.6" />
            <circle cx="80" cy="78" r="3" fill="#ec4899" opacity="0.6" />

            {/* Digital Mouth smile indicator */}
            <path d="M 54,78 Q 60,83 66,78" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="mascotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Sparkles rotating around head */}
          <div className="absolute top-2 left-2 text-yellow-400 text-xs animate-spin" style={{ animationDuration: '8s' }}>✨</div>
          <div className="absolute bottom-2 right-2 text-pink-400 text-xs animate-spin" style={{ animationDuration: '5s' }}>🌟</div>
        </motion.div>

        {/* Shadow that grows/shrinks matching bobbing */}
        <div className="w-16 h-2 bg-black/30 rounded-full mx-auto blur-md animate-[pulse_2s_infinite] mt-1" />
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
      <div className="w-48 h-1.5 bg-slate-800/80 rounded-full mt-6 overflow-hidden border border-white/5 relative">
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
      </div>

      {/* Ambient tip generator below the visual block */}
      <p className="text-[10px] text-slate-500 italic mt-6 font-mono tracking-wide">
        🤖 EduAI Companion tip: Consistency unlocks double-XP and higher grade achievements!
      </p>
    </div>
  );
}
