const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Identify the start and end of the return statement
const startMatch = code.match(/return \(/);
const startIndex = startMatch.index;

// We want to replace from line 267 to the end.
// Let's find where return ( starts
const lines = code.split('\n');
let returnLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (') && i > 250) {
    returnLineIndex = i;
    break;
  }
}

if (returnLineIndex !== -1) {
  const head = lines.slice(0, returnLineIndex).join('\n');
  
  const newReturn = `  return (
    <div className="w-full flex justify-center p-2 sm:p-4 pb-20 font-sans">
      <div className="w-full max-w-6xl h-[85vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 bg-[#141a2e] border-r border-cyan-500/10 flex flex-col pt-6 pb-6 shadow-xl shrink-0 z-10 text-white">
          <div className="px-6 mb-8 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <IconSettings size={20} className="text-cyan-400" />
             </div>
             <div>
                <h2 className="text-cyan-400 font-black tracking-widest text-xs leading-tight uppercase">Settings</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase">Commander</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            {subTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left",
                  activeSubTab === tab.id 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-auto px-4 pt-6 space-y-3">
             <button onClick={() => setViewMode(viewMode === 'dashboard' ? 'advanced' : 'dashboard')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                {viewMode === 'dashboard' ? 'Advanced Mode' : 'Dashboard View'}
             </button>
          </div>
        </div>

        {/* RIGHT PANEL: Content */}
        <div className="flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden text-slate-100">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(20,25,50,0.4)_0%,rgba(12,16,36,0)_100%)]">
             {activeSubTab === 'personal' && (
                <div id="section-profile" className="space-y-8 animate-in fade-in duration-500">
                   {/* Profile content - keeping original logic but wrapped */}
                   <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                      <div className="relative group">
                         <div className="w-32 h-32 rounded-[40px] overflow-hidden border-2 border-brand-cyan/30 shadow-2xl relative">
                            {photoUrl ? (
                               <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full bg-gradient-to-br from-navy-dark to-slate-900 flex items-center justify-center text-4xl font-black text-brand-cyan">
                                  {fullName.split(' ').map(n => n[0]).join('')}
                               </div>
                            )}
                            <button onClick={triggerImageUpload} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest">
                               Change
                            </button>
                         </div>
                         <div className="absolute -bottom-2 -right-2 bg-brand-cyan text-navy-dark p-2 rounded-xl shadow-lg border border-white/20">
                            <Camera size={16} />
                         </div>
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-white mb-2">{fullName}</h3>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {userRole} Account • South Africa
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Full Identity</label>
                         <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Communication Link</label>
                         <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" />
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'accessibility' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h2 className="text-3xl font-black text-white">Visual & Accessibility</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4">
                         <div className="flex justify-between items-center">
                            <div>
                               <h4 className="font-bold text-white">Environment Theme</h4>
                               <p className="text-xs text-slate-500">Toggle high-contrast dark mode interface.</p>
                            </div>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("w-14 h-8 rounded-full relative transition-all duration-300", isDarkMode ? "bg-brand-cyan" : "bg-slate-700")}>
                               <div className={cn("absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md", isDarkMode ? "left-7" : "left-1")} />
                            </button>
                         </div>
                      </div>
                      <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4 opacity-60">
                         <div className="flex justify-between items-center">
                            <div>
                               <h4 className="font-bold text-white">Screen Reader Support</h4>
                               <p className="text-xs text-slate-500">Enable optimized ARIA labels.</p>
                            </div>
                            <button className="w-14 h-8 rounded-full bg-slate-700 relative">
                               <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white/20" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {/* Keeping other tabs simpler for now or mapping them if I can find them */}
             {activeSubTab === 'security' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">Security Matrix</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-4">
                      <p className="text-slate-400 text-sm">Update your authentication credentials and manage active sessions across devices.</p>
                      <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">Change Secret Key</button>
                   </div>
                </div>
             )}

             {activeSubTab === 'ai' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">AI Configuration</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-4">
                      <p className="text-slate-400 text-sm">Configure primary LLM providers and pedagogical alignment constraints.</p>
                      <div className="flex items-center gap-4 p-4 bg-navy-dark/50 rounded-2xl border border-white/5">
                         <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">G</div>
                         <div>
                            <p className="text-white font-bold text-sm">Gemini 3.6 Flash</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">Active Provider</p>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'billing' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">Neural Link Subscription</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 flex justify-between items-center">
                      <div>
                         <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-1">Active Tier</p>
                         <p className="text-2xl font-black text-white uppercase">Premium Scholar</p>
                      </div>
                      <div className="text-right">
                         <p className="text-brand-cyan font-black text-xl">R249 / month</p>
                         <p className="text-slate-500 text-[10px] font-bold uppercase">Next billing: Oct 12, 2026</p>
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'codebase' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">Core Specifications</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-4">
                      <p className="text-slate-400 text-sm leading-relaxed">
                         EduAI Companion is a high-fidelity learning management system built with React, Vite, and Tailwind CSS. 
                         It utilizes Gemini models for advanced CAPS content generation and auto-grading.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400">Framework: React 18+</div>
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400">Styling: Tailwind CSS</div>
                      </div>
                   </div>
                </div>
             )}
          </div>
          
          <div className="p-6 border-t border-white/5 flex justify-end gap-4 bg-[#0c1024]/50 backdrop-blur-md">
             <button className="px-6 py-3 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-all">Discard</button>
             <button className="px-8 py-3 rounded-2xl bg-brand-cyan text-navy-dark font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync('src/components/Settings.tsx', head + newReturn);
} else {
  console.error("Could not find return line");
}
