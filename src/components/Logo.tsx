import React from 'react';
import { Brain } from 'lucide-react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <img 
        src="https://i.ibb.co/tTc5gG5k/eduai-company-logo2-preview-177246762158%200-2-preview-177247315%203046.png" 
        alt="EduAI Companion Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
