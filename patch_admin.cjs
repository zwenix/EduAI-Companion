const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header card */}
      <div className={cn(
        "relative overflow-hidden rounded-[40px] border border-white/10 p-8 sm:p-10 shadow-2xl transition-all duration-500",
        isDarkMode ? "bg-[#0a0f1e]" : "bg-white"
      )}>
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <ShieldAlert size={160} className="text-brand-cyan" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Activity size={12} className="animate-pulse" />
              <span>EduAI Core Infrastructure</span>
            </div>
            <h1 className={cn(
              "text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight mb-2",
              isDarkMode ? "text-white" : "text-slate-900"
            )}>
              Command Centre
            </h1>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base font-medium">
              Monitor system health, manage infrastructure resource allocation, and debug core AI model responses across the production environment.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
             <button 
               onClick={fetchErrors}
               className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white transition-all hover:bg-white/[0.08]"
               title="Refresh System Data"
             >
               <RefreshCw size={20} className={loading ? "animate-spin text-cyan-400" : ""} />
             </button>
             <button 
               onClick={() => alert("Deployment routine initiated...")}
               className="bg-brand-cyan text-navy-dark px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all cursor-pointer"
             >
               <Server size={18} />
               Deploy Update
             </button>
          </div>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Total Users</p>
            <p className="text-xl font-black text-white font-mono">14.2k</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">API Requests</p>
            <p className="text-xl font-black text-emerald-400 font-mono">1.2M</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Error Rate</p>
            <p className="text-xl font-black text-rose-400 font-mono">0.04%</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Avg Latency</p>
            <p className="text-xl font-black text-amber-400 font-mono">342ms</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-white/[0.03] border border-white/10 rounded-2xl max-w-sm">
        {(['system', 'debug'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer text-center",
              activeTab === tab 
                ? "bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan shadow-[0_0_12px_rgba(34,211,238,0.25)]" 
                : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
            )}
          >
            {tab === 'system' ? 'System Overview' : 'Debug Console'}
          </button>
        ))}
      </div>`;

const replaceStr = `  return (
    <div className="w-full flex justify-center p-2 sm:p-4 pb-20 font-sans">
      <div className="w-full max-w-6xl h-[85vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-5 flex flex-col shadow-xl relative overflow-hidden z-10 text-white">
          <h2 className="text-xl font-display font-black tracking-tight text-white mb-6 flex items-center gap-2">
            <ShieldAlert size={20} className="text-cyan-400" /> Admin
          </h2>
          <div className="space-y-2">
            {[
              { id: 'system', label: 'System Overview', icon: Activity },
              { id: 'debug', label: 'Debug Console', icon: Terminal },
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
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                <p className="text-[10px] text-emerald-500 uppercase font-black mb-1">System Status</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-sm font-black text-white">OPERATIONAL</p>
                </div>
             </div>
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
               <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Error Rate</p>
               <p className="text-xl font-black text-rose-400 font-mono">0.04%</p>
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

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
