import React, { useState } from 'react';
import { Headphones, LifeBuoy, Book, MessageCircle, Mail, ExternalLink, ChevronRight, Search } from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface HelpdeskProps {
  isDarkMode: boolean;
}

export default function Helpdesk({ isDarkMode }: HelpdeskProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: "How do I add students to a class?", a: "Navigate to Class Management, select your class, and click 'Add Student' in the top right corner." },
    { q: "The AI Tutor gave an incorrect answer, what do I do?", a: "You can click the 'Report' button next to the message, or adjust your AI Provider settings in the top navigation bar to try a different model." },
    { q: "How does Scan & Autograde work?", a: "Take a clear picture of the student's work and upload it. ensure you've provided an accurate rubric for the model to follow." },
    { q: "Where can I find earlier lesson plans?", a: "All generated content is automatically saved in the 'Content Archive' tab on the left sidebar." }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className={cn(
        "flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-10 rounded-[3rem] text-white transition-all",
        isDarkMode ? "bg-gradient-to-br from-navy-dark via-slate-900 to-brand-cyan/20 border border-white/5" : "bg-gradient-to-br from-[#1E293B] to-[#334155] shadow-2xl"
      )}>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/20">
            <LifeBuoy className="w-4 h-4 text-brand-cyan" />
            Support Matrix
          </div>
          <h1 className="text-4xl md:text-5xl font-hand">Need Assistance?</h1>
          <p className="text-slate-300 max-w-xl text-lg font-medium">Access our neural knowledge base or reach out to human technical support.</p>
        </div>
        <div className="w-full md:w-auto mt-4 md:mt-0 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Query knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Options */}
        <div className="space-y-6">
          <div className={cn(
            "p-8 rounded-[42px] border transition-all group cursor-pointer",
            isDarkMode ? "glass hover:bg-white/10" : "bg-white border-slate-200 shadow-sm hover:shadow-xl"
          )}>
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", isDarkMode ? "text-white" : "text-slate-900")}>Live Interface</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Direct neural link with our support team. Available Mon-Fri, 8am-5pm CAT.</p>
            <button className="text-blue-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group-hover:gap-3 transition-all">
              Initialize Link <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className={cn(
            "p-8 rounded-[42px] border transition-all group cursor-pointer",
            isDarkMode ? "glass hover:bg-white/10" : "bg-white border-slate-200 shadow-sm hover:shadow-xl"
          )}>
            <div className="w-16 h-16 bg-brand-yellow/10 text-brand-yellow rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", isDarkMode ? "text-white" : "text-slate-900")}>Message Packet</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Send a detailed asynchronous report. 24 hour response target.</p>
            <button className="text-brand-yellow font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group-hover:gap-3 transition-all">
              Transmit Packet <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="md:col-span-2 space-y-8">
          <div className="flex items-center gap-3 mb-2 px-4 text-slate-500">
            <Book size={20} />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Frequent Queries</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())).map((faq, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-8 rounded-[48px] border transition-all",
                  isDarkMode ? "glass hover:bg-white/10" : "bg-white border-slate-200 shadow-sm hover:shadow-lg"
                )}
              >
                <h4 className={cn("font-bold mb-3 text-xl font-hand", isDarkMode ? "text-white" : "text-slate-900")}>{faq.q}</h4>
                <p className="text-slate-500 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
            {faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className={cn("p-12 text-center rounded-[48px] border", isDarkMode ? "bg-white/5 border-white/5 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400")}>
                No data matching "{searchQuery}" found in knowledge matrix.
              </div>
            )}
          </div>

          <div className={cn(
            "pt-4 flex flex-col sm:flex-row justify-between items-center p-8 rounded-[42px] border",
            isDarkMode ? "bg-brand-cyan/5 border-brand-cyan/10 text-white" : "bg-slate-50 border-slate-100"
          )}>
            <div className="mb-4 sm:mb-0">
              <h4 className="font-bold">Neural Documentation</h4>
              <p className="text-xs text-slate-500">Access complete platform guides and CAPS directives.</p>
            </div>
            <button className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95",
              isDarkMode ? "bg-brand-cyan text-navy-dark shadow-lg shadow-cyan-500/20" : "bg-white border border-slate-200 text-slate-700 shadow-sm"
            )}>
              Access Docs <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

