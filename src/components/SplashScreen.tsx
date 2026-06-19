import React, { useRef, useState, useEffect } from 'react';

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
    const timer = setTimeout(() => {
      if (onVideoEnd) {
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

    return () => clearTimeout(timer);
  }, [onVideoEnd]);

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
      style={{ backgroundColor: '#92cbfa' }} // Matches the natural background color of the elephant video frame
    >
      {!videoError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src="/splash.mp4"
            autoPlay
            playsInline
            muted
            onEnded={handleEnded}
            onError={() => {
              console.error("Error loading public/splash.mp4, calling fallback");
              setVideoError(true);
              if (onVideoEnd) onVideoEnd();
            }}
            className="w-full h-full object-contain max-w-full max-h-full cursor-pointer"
            onClick={() => {
              // Attempt to play if paused, or toggle mute
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
          className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer"
          onClick={() => onVideoEnd && onVideoEnd()}
        >
          <p className="text-white font-bold text-xl">Loading EduAI Companion...</p>
        </div>
      )}
    </div>
  );
};
