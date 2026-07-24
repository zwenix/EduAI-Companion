import React, { useState, useEffect } from 'react';
import { ImageIcon, Loader2, RefreshCw, Download } from 'lucide-react';
import { generateImageWithFallback, enhanceEducationalImagePrompt } from '../lib/imageGeneration';

interface AiImageProps {
  prompt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  grade?: string;
  subject?: string;
  topic?: string;
  isDarkMode?: boolean;
}

export default function AiImage({ 
  prompt, 
  className = '', 
  aspectRatio = 'square',
  grade,
  subject,
  topic,
  isDarkMode = true
}: AiImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [provider, setProvider] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Enhance the prompt if educational context is provided
  const enhancedPrompt = (grade && subject && topic) 
    ? enhanceEducationalImagePrompt(topic, grade, subject, prompt)
    : prompt;

  useEffect(() => {
    let active = true;
    
    const generateImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await generateImageWithFallback({
          prompt: enhancedPrompt,
          aspectRatio,
          seed: retryCount
        });
        
        if (active) {
          setImageUrl(result.url);
          setProvider(result.provider);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Image generation failed:', err);
        if (active) {
          setError(err.message || 'Failed to generate image');
          setIsLoading(false);
        }
      }
    };

    generateImage();
    
    return () => {
      active = false;
    };
  }, [enhancedPrompt, aspectRatio, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eduai-image-${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        relative rounded-2xl overflow-hidden border-2 border-dashed
        ${aspectClasses[aspectRatio]}
        ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-300'}
      `}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-cyan-400 mb-3" size={40} />
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Generating Visual...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Using {provider || 'AI'} provider
            </p>
          </div>
        )}

        {imageUrl && !error && (
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load image');
            }}
            referrerPolicy="no-referrer"
          />
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <ImageIcon className={`mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} size={40} />
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {error}
            </p>
            <button
              onClick={handleRetry}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-medium transition-all"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Provider & AI Model Badge */}
      {provider && !isLoading && !error && (
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-full text-xs text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          AI Model: {provider === 'gemini' ? 'Gemini Imagen-3' : provider === 'perchance' ? 'Perchance / Turbo' : 'Pollinations Flux/Turbo'}
        </div>
      )}

      {/* Download Button */}
      {imageUrl && !isLoading && !error && (
        <button
          onClick={handleDownload}
          className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-xl transition-all"
          title="Download Image"
        >
          <Download size={18} />
        </button>
      )}

      {/* Prompt Display */}
      <div className={`mt-3 p-3 rounded-xl text-xs ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{prompt}</p>
      </div>
    </div>
  );
}
