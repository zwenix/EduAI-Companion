import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import splashVideo from '../assets/splash.mp4';

interface SplashScreenProps {
  onVideoEnd?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onVideoEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Splendid 10-second timer that guarantees the splash screen stays active 
  // for exactly 10 seconds to allow assets and services to prepare,
  // showing either the premium video or the beautifully animated fallback.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    }, 5000); // Set to play/display for exactly 5 seconds

    // Try to trigger video play on mount
    const loadTimer = setTimeout(() => {
      if (!videoRef.current || videoRef.current.readyState < 3) {
        console.warn("Video taking too long to load, but we'll wait for the element's error event.");
      }
    }, 5000);

    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        console.warn("Initial autoplay attempt:", err);
      });
    }

    return () => {
      clearTimeout(loadTimer);
    };
  }, [onVideoEnd]);

  const handleEnded = () => {
    // If the video ended naturally but we want to play for 10 seconds, 
    // let loop handle the visual, and let the timer handle the transition.
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex h-screen w-screen items-center justify-center select-none overflow-hidden"
      style={{ backgroundColor: '#0e152e' }} // Deep premium navy background matching the app's aesthetic
    >
      {!videoError ? (
        <div className="relative w-full h-full flex items-center justify-center bg-[#0e152e]">
          <video
            ref={videoRef}
            src={splashVideo}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            preload="auto"
            onCanPlay={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {
                  console.warn("Autoplay blocked, user interaction required");
                });
              }
            }}
            onError={(e) => {
              console.error("Splash video element fatal error:", e.currentTarget.error?.message);
              setVideoError(true);
            }}
            className="w-full h-full object-contain max-w-full max-h-full cursor-pointer"
          />

          {/* Video Control Buttons Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              id="splash_mute_btn"
              onClick={toggleMute}
              className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white text-xs font-semibold rounded-full backdrop-blur-sm transition-all focus:outline-none"
            >
              {isMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
            <button
              id="splash_skip_btn"
              onClick={handleSkip}
              className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white text-xs font-semibold rounded-full backdrop-blur-sm transition-all focus:outline-none"
            >
              Skip Video ➔
            </button>
          </div>
        </div>
      ) : (
        <div 
          id="splash_fallback_container"
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden cursor-pointer"
          style={{ backgroundColor: '#0e152e' }}
          onClick={() => onVideoEnd && onVideoEnd()}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center"
          >
            {/* Decorative ambient glow */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full animate-pulse scale-150" />
            
            <div className="relative mb-10 p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-md shadow-[0_0_80px_rgba(52,211,153,0.15)] ring-1 ring-white/10">
              <GraduationCap className="w-28 h-28 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
            </div>
            
            <div className="text-center space-y-5 relative z-10">
              <h1 className="text-6xl font-black tracking-tighter text-white">
                Edu<span className="text-emerald-400">AI</span>
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-emerald-400/50 to-emerald-400 rounded-full" />
                <p className="text-emerald-400 font-bold uppercase tracking-[0.4em] text-[10px]">
                  Excellence Redefined
                </p>
                <div className="h-0.5 w-16 bg-gradient-to-l from-transparent via-emerald-400/50 to-emerald-400 rounded-full" />
              </div>
            </div>

            <div className="mt-16 flex flex-col items-center gap-6">
              <div className="flex gap-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                    className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  />
                ))}
              </div>
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onVideoEnd) onVideoEnd();
                }}
                className="group relative px-8 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Launch Environment <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </span>
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
