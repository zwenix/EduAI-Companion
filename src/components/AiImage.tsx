import React, { useState } from 'react';
import { ImageIcon, Loader2, RefreshCw, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiImageProps {
  prompt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export default function AiImage({ prompt, className = '', aspectRatio = 'square' }: AiImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const encodedPrompt = encodeURIComponent(prompt);
  // Using Pollinations.ai for free runtime image generation - using the direct image API
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${retryCount}`;

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]'
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(false);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-100 border border-slate-200 group ${aspectClasses[aspectRatio]} ${className}`}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm"
          >
            <Loader2 className="w-8 h-8 text-brand-cyan animate-spin mb-2" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Generating Visual...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <img 
        src={imageUrl} 
        alt={prompt}
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        referrerPolicy="no-referrer"
      />

      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
        <p className="text-[10px] text-white/80 line-clamp-1 pr-4">{prompt}</p>
        <div className="flex gap-2">
          <button 
            onClick={handleRetry}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-md transition-all"
            title="Regenerate"
          >
            <RefreshCw size={14} />
          </button>
          <a 
            href={imageUrl} 
            download="generated-image.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-brand-cyan text-navy-dark rounded-lg transition-all"
            title="Download"
          >
            <Download size={14} />
          </a>
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-6 text-center">
          <ImageIcon size={32} className="mb-2 opacity-20" />
          <p className="text-xs font-bold">Visualization Failed</p>
          <button 
            onClick={handleRetry}
            className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-cyan hover:underline"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
