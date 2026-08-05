const fs = require('fs');
let code = fs.readFileSync('src/components/CurriculumSuite.tsx', 'utf8');

// Add CalendarDays to imports
if (!code.includes('CalendarDays')) {
  code = code.replace("Settings, CheckCircle", "Settings, CheckCircle, CalendarDays");
}

const targetStr = `  return (
    <div className={\`space-y-6 sm:space-y-8 animate-in fade-in duration-500\`}>
      {/* Dynamic Nav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Compass className="text-brand-cyan" size={24} />
          <h2 className={\`text-xl sm:text-2xl font-hand uppercase tracking-wider \${isDarkMode ? 'text-white' : 'text-slate-900'}\`}>
            Syllabus & Gamification Hub
          </h2>
        </div>
        
        <div className="flex gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
          {[
            { id: 'curriculum', label: 'CAPS Syllabus Tree', icon: Map },
            { id: 'lessons', label: 'Lesson & Assessment Studio', icon: FilePlus },
            { id: 'gamification', label: 'Achievement Lab', icon: Trophy },
            { id: 'weekly', label: 'Weekly ATP Planner', icon: Calendar }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap cursor-pointer",
                activeTab === tab.id 
                  ? "bg-brand-cyan text-navy-dark shadow-[0_0_12px_rgba(34,211,238,0.3)]" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'curriculum' ? 'CAPS' : tab.id === 'lessons' ? 'Studio' : tab.id === 'gamification' ? 'Awards' : 'ATP'}</span>
            </button>
          ))}
        </div>
      </div>`;

const replaceStr = `  return (
    <div className="w-full flex justify-center p-2 sm:p-4 pb-20 font-sans">
      <div className="w-full max-w-6xl h-[85vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-5 flex flex-col shadow-xl relative overflow-hidden z-10">
          <h2 className="text-xl font-display font-black tracking-tight text-white mb-6 flex items-center gap-2">
            <Compass size={20} className="text-cyan-400" /> Syllabus
          </h2>
          <div className="space-y-2">
            {[
              { id: 'curriculum', label: 'CAPS Syllabus Tree', icon: Map },
              { id: 'lessons', label: 'Lesson Studio', icon: FilePlus },
              { id: 'gamification', label: 'Achievement Lab', icon: Trophy },
              { id: 'weekly', label: 'ATP Planner', icon: CalendarDays }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left",
                  activeTab === tab.id 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-6 space-y-3">
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
               <p className="text-[10px] text-slate-500 uppercase font-black mb-1">XP Points</p>
               <p className="text-xl font-black text-amber-400 font-mono">{points}</p>
             </div>
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
               <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Current Level</p>
               <p className="text-xl font-black text-white font-mono">LVL {userLevel}</p>
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

fs.writeFileSync('src/components/CurriculumSuite.tsx', code);
