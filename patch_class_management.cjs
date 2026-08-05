const fs = require('fs');
let code = fs.readFileSync('src/components/ClassManagement.tsx', 'utf8');

// Add MessageSquare to imports
if (!code.includes('MessageSquare')) {
  code = code.replace("Sparkles, Check", "Sparkles, Check, MessageSquare");
}

const targetStr = `  return (
    <div className="space-y-8 pb-10">
      {/* Cosmic Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-cyan-500/30 p-8 sm:p-10 shadow-2xl text-center">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={140} className="text-cyan-400" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles size={14} className="animate-spin" />
          <span>Administrative Center</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-display tracking-tight mb-3">
          ✨ Classes & Learners ✨
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-medium">
          Organize classes, manage learner profiles, import rosters, and structure active study groups inside a centralized DBE & CAPS-focused ecosystem.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <div className="bg-white/[0.05] border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Learners:</span>
            <span className="text-lg font-black text-cyan-400 font-mono">{students.length}</span>
          </div>
          <div className="bg-white/[0.05] border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Classes:</span>
            <span className="text-lg font-black text-white font-mono">{classes.length}</span>
          </div>
          <div className="bg-white/[0.05] border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Groups:</span>
            <span className="text-lg font-black text-purple-400 font-mono">{studyGroups.length}</span>
          </div>
        </div>
      </div>

      {/* Glassmorphic Tab Selector Navigation */}
      <div className="flex p-1.5 bg-white/[0.02] border border-white/10 rounded-2xl max-w-md">
        {(['learners', 'classes', 'study_groups'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer text-center",
              activeTab === tab 
                ? "bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan shadow-[0_0_12px_rgba(34,211,238,0.25)]" 
                : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
            )}
          >
            {tab === 'learners' ? 'Learners' : tab === 'classes' ? 'Classes' : 'Study Groups'}
          </button>
        ))}
      </div>`;

const replaceStr = `  return (
    <div className="w-full flex justify-center p-2 sm:p-4 pb-20 font-sans">
      <div className="w-full max-w-6xl h-[85vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-5 flex flex-col shadow-xl relative overflow-hidden z-10">
          <h2 className="text-xl font-display font-black tracking-tight text-white mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" /> Admin
          </h2>
          <div className="space-y-2">
            {(['learners', 'classes', 'study_groups'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  activeTab === tab 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                {tab === 'learners' ? <Users size={18} /> : tab === 'classes' ? <GraduationCap size={18} /> : <MessageSquare size={18} />}
                {tab === 'learners' ? 'Learners' : tab === 'classes' ? 'Classes' : 'Study Groups'}
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-6 space-y-3">
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
               <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Total Learners</p>
               <p className="text-xl font-black text-cyan-400 font-mono">{students.length}</p>
             </div>
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
               <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Active Classes</p>
               <p className="text-xl font-black text-white font-mono">{classes.length}</p>
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: Content */}
        <div className="flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden text-slate-100">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(20,25,50,0.4)_0%,rgba(12,16,36,0)_100%)]">`;

code = code.replace(targetStr, replaceStr);

const targetEndStr = `    </div>
  );
}`;

const replaceEndStr = `          </div>
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(targetEndStr, replaceEndStr);

fs.writeFileSync('src/components/ClassManagement.tsx', code);
