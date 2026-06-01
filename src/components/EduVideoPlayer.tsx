import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Loader2, Video, Maximize } from 'lucide-react';

// Simplified class merger for independence
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface EduVideoPlayerProps {
  src: string;
  prompt: string;
  isDarkMode?: boolean;
}

export default function EduVideoPlayer({ src, prompt, isDarkMode }: EduVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoError, setIsVideoError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after a period of inactivity
  useEffect(() => {
    let timeout: any;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Play operation failed:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsVideoLoading(false);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = Number(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = Number(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    videoRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
    });
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => console.error("Error exiting fullscreen:", err));
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-3xl border border-indigo-500/20 rounded-3xl overflow-hidden shadow-2xl bg-black relative min-h-[300px] flex flex-col justify-between group"
    >
      {/* Video Content Container */}
      <div className="relative w-full aspect-video flex items-center justify-center bg-zinc-950">
        {isVideoLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 font-medium font-mono uppercase tracking-widest">Loading Media Source...</p>
          </div>
        )}

        {!isVideoError ? (
          <video
            ref={videoRef}
            src={src}
            autoPlay
            loop
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onLoadStart={() => setIsVideoLoading(true)}
            onCanPlay={() => setIsVideoLoading(false)}
            onError={() => {
              setIsVideoError(true);
              setIsVideoLoading(false);
            }}
            className="w-full h-full object-contain cursor-pointer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900 px-6 py-12 text-center select-text">
            <Video size={48} className="mb-4 text-rose-500 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">Video playback unavailable or format not supported.</p>
            <p className="text-xs text-slate-500 mt-2 max-w-md">There might be a connectivity issue, or the video file format is incompatible with your system's playback capabilities.</p>
            <a 
              href={src} 
              target="_blank" 
              rel="noreferrer" 
              className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
            >
              Open Video Direct Link
            </a>
          </div>
        )}

        {/* Large Play/Pause Overlay Centered Button */}
        {!isVideoError && !isVideoLoading && !isPlaying && (
          <button 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 z-10 transition-colors group/play"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
              <Play size={28} className="fill-current ml-1 text-white" />
            </div>
          </button>
        )}
      </div>

      {/* Styled Interactive Control Bar */}
      {!isVideoError && (
        <div 
          className={cn(
            "p-4 border-t transition-all duration-300 z-10 bg-gradient-to-t from-black/90 via-black/85 to-black/40 text-white absolute bottom-0 left-0 right-0",
            showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {/* Progress Seek Slider */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-mono font-bold text-slate-300">
              {formatTime(currentTime)}
            </span>
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="flex-1 h-1 bg-white/20 hover:h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all outline-none"
            />
            <span className="text-[10px] font-mono font-bold text-slate-300">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {/* Play, Pause, Restart, volume */}
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                title={isPlaying ? "Pause" : "Play"}
                className="hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current" />}
              </button>

              <button 
                onClick={handleRestart}
                title="Restart Video"
                className="hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <RotateCcw size={16} />
              </button>

              {/* Volume Controller */}
              <div className="flex items-center gap-2 group/volume">
                <button 
                  onClick={toggleMute}
                  className="hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input 
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest leading-none">
                AI Video Lab
              </span>
              <button 
                onClick={toggleFullscreen}
                title="Fullscreen Toggle"
                className="hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Descriptor Segment under Video element */}
      <div className={cn("p-5 border-t text-center select-text", isDarkMode ? "border-white/10 bg-slate-900/80 text-slate-300" : "border-slate-200 bg-white/80 text-slate-700")}>
        <p className="font-semibold text-[10px] tracking-widest uppercase text-indigo-500 mb-1.5">Generated Video Prompt</p>
        <p className="font-medium text-sm leading-relaxed max-w-2xl mx-auto italic">
          "{prompt}"
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <a 
            href={src} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline flex items-center gap-1.5"
          >
            Open Video Direct Link →
          </a>
        </div>
      </div>
    </div>
  );
}
