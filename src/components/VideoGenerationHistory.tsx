import React, { useState } from 'react';
import { 
  Play, Download, Trash2, RefreshCw, Video, History, Calendar, Sliders, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface VideoItem {
  id: string;
  prompt: string;
  videoUrl: string;
  model: string;
  seed?: number;
  fps?: number;
  createdAt?: {
    seconds?: number;
    nanoseconds?: number;
    toDate?: () => Date;
  } | any;
}

interface VideoGenerationHistoryProps {
  videoHistory: VideoItem[];
  currentVideoUrl?: string;
  onSelectVideo: (video: VideoItem) => void;
  onReGenerateVideo: (video: VideoItem) => void;
  onDeleteVideo: (videoId: string) => Promise<void>;
  isDarkMode: boolean;
}

export default function VideoGenerationHistory({
  videoHistory,
  currentVideoUrl,
  onSelectVideo,
  onReGenerateVideo,
  onDeleteVideo,
  isDarkMode
}: VideoGenerationHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatRelativeTime = (createdAt: any) => {
    if (!createdAt) return "Just now";
    
    let date: Date;
    if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (typeof createdAt === 'string') {
      date = new Date(createdAt);
    } else {
      return "Recently";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCopyPrompt = (promptText: string, id: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this video from your history?")) return;
    setDeletingId(id);
    try {
      await onDeleteVideo(id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (e: React.MouseEvent, url: string, prompt: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      // create safe filename
      const safeName = prompt.slice(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '_') || "ai_video";
      a.download = `${safeName}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const getModelLabel = (model: string) => {
    switch (model) {
      case 'omnihuman-1':
        return 'OmniHuman-1';
      case 'replicate-minimax':
        return 'MiniMax Video';
      case 'replicate-luma':
        return 'Luma Ray';
      default:
        return 'AI Cinematic';
    }
  };

  return (
    <div id="video-generation-history-dashboard" className={cn("w-full mt-12 rounded-3xl p-6 border transition-all", isDarkMode ? "bg-slate-900/40 border-white/10" : "bg-slate-50 border-slate-200")}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <History size={20} />
          </div>
          <div>
            <h2 className={cn("text-lg font-black uppercase tracking-wider", isDarkMode ? "text-white" : "text-slate-800")}>
              Video Generation History
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              OmniHuman & Cinematic Archives
            </p>
          </div>
        </div>
        <div className={cn("text-[10px] font-mono px-3 py-1.5 rounded-full border", isDarkMode ? "bg-white/5 border-white/10 text-slate-400" : "bg-white border-slate-200 text-slate-600")}>
          Total: {videoHistory.length}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {videoHistory.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-dashed", isDarkMode ? "border-white/10 bg-white/5 text-slate-500" : "border-slate-300 bg-white text-slate-400")}>
              <Video size={24} />
            </div>
            <h3 className={cn("text-sm font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
              No generated videos yet
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Your generated cinematic assets and motion loops will be saved securely in this history panel.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoHistory.map((video) => {
              const isActive = currentVideoUrl === video.videoUrl;
              return (
                <motion.div
                  key={video.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "group flex flex-col justify-between rounded-2xl border overflow-hidden transition-all duration-300 shadow-md",
                    isActive 
                      ? "ring-2 ring-indigo-500 bg-indigo-500/[0.02]" 
                      : isDarkMode 
                        ? "bg-slate-900 border-white/5 hover:border-white/10" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                  )}
                >
                  {/* Top section: Preview thumbnail & play trigger */}
                  <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => onSelectVideo(video)}>
                    {video.videoUrl ? (
                      <video 
                        src={video.videoUrl} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        muted
                        playsInline
                        loop
                        onMouseOver={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseOut={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center">
                        <Video size={32} />
                      </div>
                    )}
                    
                    {/* Active playing border overlay or play button */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                        <Play size={18} className="fill-current ml-0.5 text-white" />
                      </div>
                    </div>

                    {isActive && (
                      <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-md">
                        Active Preview
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md font-mono">
                      {getModelLabel(video.model)}
                    </div>
                  </div>

                  {/* Body section: prompt and config info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-400">
                          {formatRelativeTime(video.createdAt)}
                        </span>
                      </div>

                      <p 
                        className={cn(
                          "text-xs leading-relaxed font-medium line-clamp-3 mb-4 cursor-pointer hover:underline transition-colors",
                          isDarkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-indigo-600"
                        )}
                        title="Click to copy full prompt"
                        onClick={() => handleCopyPrompt(video.prompt, video.id)}
                      >
                        "{video.prompt}"
                      </p>
                    </div>

                    {/* Metadata & Actions row */}
                    <div className="space-y-3.5 pt-3.5 border-t border-dashed border-slate-200 dark:border-white/5">
                      {/* Technical specifications */}
                      {video.model === 'omnihuman-1' && (video.seed !== undefined || video.fps !== undefined) && (
                        <div className="flex flex-wrap gap-2">
                          {video.seed !== undefined && (
                            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono", isDarkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600")}>
                              <Sliders size={10} className="opacity-60" />
                              Seed: {video.seed}
                            </div>
                          )}
                          {video.fps !== undefined && (
                            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono", isDarkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600")}>
                              FPS: {video.fps}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons bar */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectVideo(video)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all",
                              isActive 
                                ? "bg-indigo-600 text-white cursor-default" 
                                : isDarkMode 
                                  ? "bg-white/5 text-slate-300 hover:bg-white/10" 
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            )}
                          >
                            <Play size={10} className="fill-current" />
                            {isActive ? 'Playing' : 'View'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onReGenerateVideo(video)}
                            title="Pre-populate parameters and reload generator"
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all",
                              isDarkMode 
                                ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" 
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            )}
                          >
                            <RefreshCw size={10} />
                            Load parameters
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleDownload(e, video.videoUrl, video.prompt)}
                            title="Download video file"
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              isDarkMode ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            )}
                          >
                            <Download size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyPrompt(video.prompt, video.id)}
                            title="Copy prompt text"
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              isDarkMode ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            )}
                          >
                            {copiedId === video.id ? <Check size={14} className="text-emerald-500" /> : <ExternalLink size={14} />}
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === video.id}
                            onClick={(e) => handleDelete(e, video.id)}
                            title="Delete video from history"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
