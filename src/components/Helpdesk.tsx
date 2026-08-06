
import React, { useState } from 'react';
import { Headphones, LifeBuoy, Book, MessageCircle, Mail, ExternalLink, ChevronRight, Search, Power, Settings as IconSettings, Shield, Bell, User, X } from 'lucide-react';
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface HelpdeskProps {
  isDarkMode: boolean;
}

export default function Helpdesk({ isDarkMode }: HelpdeskProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('support');

  const faqs = [
    { q: "How do I add students to a class?", a: "Navigate to Class Management, select your class, and click 'Add Student' in the top right corner." },
    { q: "The AI Tutor gave an incorrect answer, what do I do?", a: "You can click the 'Report' button next to the message, or adjust your AI Provider settings in the top navigation bar to try a different model." },
    { q: "How does Scan & Autograde work?", a: "Take a clear picture of the student's work and upload it. ensure you've provided an accurate rubric for the model to follow." },
    { q: "Where can I find earlier lesson plans?", a: "All generated content is automatically saved in the 'Content Archive' tab on the left sidebar." }
  ];

  return (
    <div className="w-full h-full">
      <div className="w-full overflow-hidden bg-[#0c1024] rounded-2xl flex flex-col md:flex-row relative" style={{ height: 'calc(100dvh - 130px)' }}>
        
        {/* Sidebar portion of the Support modal */}
        <div className="w-full md:w-64 bg-[#141a2e] border-r border-cyan-500/10 flex flex-col pt-6 pb-6 shadow-xl shrink-0 z-10">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <LifeBuoy size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-cyan-400 font-black tracking-widest text-xs leading-tight">SUPPORT</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase">Assistance Center</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            <button
              onClick={() => setActiveTab('support')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer",
                activeTab === 'support' ? "bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg" : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Headphones size={16} className={activeTab === 'support' ? "text-cyan-400" : "text-slate-400"} />
              <span>Contact Support</span>
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer",
                activeTab === 'faqs' ? "bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg" : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Book size={16} className={activeTab === 'faqs' ? "text-cyan-400" : "text-slate-400"} />
              <span>Knowledge Base</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer",
                activeTab === 'tickets' ? "bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg" : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Mail size={16} className={activeTab === 'tickets' ? "text-cyan-400" : "text-slate-400"} />
              <span>My Tickets</span>
            </button>
          </div>
          
          <div className="px-4 mt-auto pt-6 border-t border-white/5 space-y-2">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-all">
              <ExternalLink size={14} /> Documentation
            </button>
          </div>
        </div>

        {/* Right Column Content Area */}
        <div className="flex-1 bg-gradient-to-br from-[#0c1024] to-[#0a0e1c] p-6 sm:p-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            
            <div className="mb-10 text-left">
              <h1 className="text-cyan-400 font-black tracking-widest text-sm uppercase mb-1 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse rounded-full" /> Assistance</h1>
              <h2 className="text-white font-display text-3xl font-black tracking-tight">SUPPORT COMMAND</h2>
              <p className="text-slate-400 font-medium text-sm mt-2">Access our neural knowledge base or reach out to human technical support.</p>
            </div>

            {activeTab === 'support' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Interface */}
                <div className="bg-[#141a2e] border border-white/5 rounded-2xl p-6 shadow-xl text-left group cursor-pointer hover:border-cyan-500/30 transition-all">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-blue-500/20">
                    <MessageCircle size={24} />
                  </div>
                  <h3 className="text-white font-bold mb-3 text-lg">Live Interface</h3>
                  <p className="text-slate-400 text-xs mb-6 leading-relaxed">Direct neural link with our support team. Available Mon-Fri, 8am-5pm CAT.</p>
                  <button className="text-blue-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group-hover:gap-3 transition-all">
                    Initialize Link <ChevronRight size={14} />
                  </button>
                </div>

                {/* Message Packet */}
                <div className="bg-[#141a2e] border border-white/5 rounded-2xl p-6 shadow-xl text-left group cursor-pointer hover:border-brand-yellow/30 transition-all">
                  <div className="w-12 h-12 bg-brand-yellow/10 text-brand-yellow rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-brand-yellow/20">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-white font-bold mb-3 text-lg">Message Packet</h3>
                  <p className="text-slate-400 text-xs mb-6 leading-relaxed">Send a detailed asynchronous report. 24 hour response target.</p>
                  <button className="text-brand-yellow font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group-hover:gap-3 transition-all">
                    Transmit Packet <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Query knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-medium"
                  />
                </div>
                
                <div className="space-y-4 text-left">
                  {faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())).map((faq, i) => (
                    <div 
                      key={i} 
                      className="p-6 rounded-2xl bg-[#141a2e] border border-white/5 shadow-xl hover:border-cyan-500/20 transition-all"
                    >
                      <h4 className="font-bold mb-2 text-sm text-white">{faq.q}</h4>
                      <p className="text-slate-400 leading-relaxed text-xs">{faq.a}</p>
                    </div>
                  ))}
                  {faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="p-8 text-center rounded-2xl border bg-white/5 border-white/5 text-slate-500 text-sm">
                      No data matching "{searchQuery}" found in knowledge matrix.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
