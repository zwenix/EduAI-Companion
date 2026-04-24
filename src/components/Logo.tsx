import React from 'react';
import { Brain } from 'lucide-react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-purple-500 to-yellow-400 rounded-full blur-sm opacity-60 animate-pulse"></div>
      <div className="relative w-full h-full bg-[#0B1120] rounded-full border border-white/20 flex items-center justify-center overflow-hidden">
        <img 
          src="https://i.ibb.co/tTc5gG5k/eduaicompanion-logo2-preview-1772467621580-2-preview-1772473153046.png" 
          alt="EduAI Companion Logo"
          className="w-[90%] h-[90%] object-contain drop-shadow-md"
        />
      </div>
    </div>
  );
}
