import React from 'react';
import { Sparkles, BookOpen, Star } from 'lucide-react';

export default function Grade1EnglishGenerator() {
  return (
    <div className="space-y-6">
      <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-brand-yellow/20 p-2 rounded-xl text-brand-yellow">
            <Sparkles size={20} />
          </div>
          <h3 className="text-xl font-hand text-white">Grade 1 Phonics & Reading Pack</h3>
        </div>
        <p className="text-sm text-slate-400 mb-6">Generate integrated reading packs specifically designed for Foundation Phase CAPS requirements.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Weekly Phonics", icon: BookOpen, desc: "Letter sounds and blending activities." },
            { title: "Sight Words", icon: Star, desc: "Flashcards and basic sentence builders." },
          ].map((pack, i) => (
            <button key={i} className="glass p-5 rounded-2xl text-left hover:bg-white/10 transition-all border-white/5">
              <pack.icon className="text-brand-cyan mb-2" size={20} />
              <h4 className="text-white font-bold text-sm">{pack.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{pack.desc}</p>
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-center p-8 opacity-50">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Neural Calibration in Progress</p>
        <p className="text-[10px] text-slate-600 mt-2">More Grade 1 specialized tools are being calculated.</p>
      </div>
    </div>
  );
}
