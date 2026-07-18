import React, { useRef, useState, useEffect } from 'react';
import splashVideo from '../assets/splash.mp4';

interface SplashScreenProps {
  onVideoEnd?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onVideoEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Fallback timer: if the browser blocks autoplay and the user is totally idle,
  // we transition after several seconds so the app remains perfectly functional.
  useEffect(() => {
    let fallbackTimer: NodeJS.Timeout;
    if (videoError) {
      fallbackTimer = setTimeout(() => {
        if (onVideoEnd) {
          onVideoEnd();
        }
      }, 3000);
    }

    const timer = setTimeout(() => {
      if (onVideoEnd && !videoError) {
        onVideoEnd();
      }
    }, 6000);

    // Try to trigger video play on mount
    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        console.warn("Autoplay block or delay:", err);
      });
    }

    return () => {
      clearTimeout(timer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [onVideoEnd, videoError]);

  const handleEnded = () => {
    if (onVideoEnd) {
      onVideoEnd();
    }
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
        <div className="relative w-full h-full flex items-center justify-center bg-[#92cbfa]">
          <video
            ref={videoRef}
            src={splashVideo}
            autoPlay
            playsInline
            muted
            onEnded={handleEnded}
            onError={() => {
              console.error("Error loading splash.mp4, calling fallback");
              setVideoError(true);
            }}
            className="w-full h-full object-contain max-w-full max-h-full cursor-pointer"
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current.play().catch(console.error);
                } else {
                  videoRef.current.muted = !videoRef.current.muted;
                  setIsMuted(videoRef.current.muted);
                }
              }
            }}
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
          className="w-full h-full flex flex-col items-center justify-center p-6 cursor-pointer text-center space-y-6"
          onClick={() => onVideoEnd && onVideoEnd()}
        >
          {/* Animated Logo Container */}
          <div className="relative flex items-center justify-center w-28 h-28 rounded-[28px] bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-pulse">
            <span className="text-white text-4xl font-sans font-black tracking-tighter">Edu</span>
            <div className="absolute -inset-1.5 rounded-[32px] border-2 border-cyan-400/30 animate-spin [animation-duration:8s]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-wide font-display uppercase">
              EduAI Companion
            </h1>
            <p className="text-slate-400 font-mono text-xs tracking-widest uppercase">
              South African CAPS Smart Suite
            </p>
          </div>

          {/* Loading Indicator */}
          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Optimizing Workspace Assets
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onVideoEnd) onVideoEnd();
            }}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/20 rounded-full font-mono text-xs uppercase tracking-wider transition-all"
          >
            Enter Dashboard ➔
          </button>
        </div>
      )}
    </div>
  );
};
