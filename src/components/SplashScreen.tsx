import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import splashVideoUrl from '../assets/splash.mp4';

interface SplashScreenProps {
  onVideoEnd?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onVideoEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Store onVideoEnd in a ref to keep it stable and prevent resetting of the timer
  const onVideoEndRef = useRef(onVideoEnd);
  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
  }, [onVideoEnd]);

  // Splendid timer that guarantees the splash screen transitions appropriately (11 seconds)
  useEffect(() => {
    if (videoError) {
      const errorTimer = setTimeout(() => {
        onVideoEndRef.current?.();
      }, 1500);
      return () => clearTimeout(errorTimer);
    }

    const timer = setTimeout(() => {
      onVideoEndRef.current?.();
    }, 11000); 

    const video = videoRef.current;
    if (video && !videoError) {
      video.defaultMuted = true;
      video.muted = isMuted;
      video.playsInline = true;
      video.loop = true;

      const safePlay = () => {
        if (!videoRef.current) return;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // Silently attach gesture listener if autoplay is restricted by browser policy
            if (err.name !== 'AbortError') {
              const playOnInteract = () => {
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(() => {});
                }
                window.removeEventListener('click', playOnInteract);
                window.removeEventListener('touchstart', playOnInteract);
                window.removeEventListener('keydown', playOnInteract);
              };
              window.addEventListener('click', playOnInteract);
              window.addEventListener('touchstart', playOnInteract);
              window.addEventListener('keydown', playOnInteract);
            }
          });
        }
      };

      safePlay();
    }

    return () => {
      clearTimeout(timer);
    };
  }, [videoError, isMuted]);

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
      style={{ backgroundColor: '#0e152e' }}
    >
      {!videoError ? (
        <div 
          className="relative w-full h-full flex items-center justify-center bg-[#0e152e]"
          onClick={() => {
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }}
        >
            <video
              ref={videoRef}
              src={splashVideoUrl || '/splash.mp4'}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              webkit-playsinline="true"
              preload="auto"
              onError={(e) => {
                console.warn("Splash video element non-fatal fallback triggered:", e.currentTarget.error?.message);
                // Try fallback path if imported url failed
                if (videoRef.current && videoRef.current.src !== window.location.origin + '/splash.mp4') {
                  videoRef.current.src = '/splash.mp4';
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                } else {
                  setVideoError(true);
                }
              }}
              className="w-full h-full object-cover max-w-full max-h-full cursor-pointer"
            >
              <source src={splashVideoUrl} type="video/mp4" />
              <source src="/splash.mp4" type="video/mp4" />
            </video>

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
            
            <div className="relative mb-10 p-6 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-md shadow-[0_0_80px_rgba(52,211,153,0.15)] ring-1 ring-white/10 flex items-center justify-center">
              <Logo className="w-28 h-28 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
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
