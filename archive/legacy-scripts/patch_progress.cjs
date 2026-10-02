const fs = require('fs');
let code = fs.readFileSync('src/components/ProgressReports.tsx', 'utf8');

const targetStr = `    <div className="space-y-8 pb-20 custom-scrollbar font-sans text-slate-100">
      {/* Dynamic Notifications Banner */}
      <AnimatePresence>
        {showSyncSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 px-6 py-4 rounded-3xl border border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-3 font-semibold text-sm cursor-pointer"
            onClick={() => setShowSyncSuccess(false)}
          >
            <CheckCircle className="text-slate-950 scale-110" size={20} />
            <div>
              <p className="font-bold">Sync Completed!</p>
              <p className="text-xs text-slate-900 opacity-90">{currentStudent.name}'s latest report was dispatched to parent dashboards.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cosmic Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-cyan-500/30 p-8 sm:p-10 shadow-2xl text-center">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={140} className="text-cyan-400" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles size={14} className="animate-spin" />
          <span>Analytics Cognitive Centre</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-display tracking-tight mb-3">
          ✨ Analytics & Reports ✨
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-medium">
          Audit class academic stats, review student performance dossiers, and produce AI-driven Individual Development Plans.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button 
            onClick={() => setActiveTab('overview')}
            className={\`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg \${
              activeTab === 'overview' ? 'bg-brand-cyan text-navy-dark shadow-cyan-500/20' : 'bg-slate-900/80 text-slate-300 hover:text-white border border-white/10'
            }\`}
          >
            <TrendingUp size={14} />
            <span>Class Overview</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('idp');
              if (currentStudent && currentStudent.subjects.length > 0) {
                setSelectedSubjectName(currentStudent.subjects[0].name);
              }
            }}
            className={\`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg \${
              activeTab === 'idp' ? 'bg-brand-cyan text-navy-dark shadow-cyan-500/20' : 'bg-slate-900/80 text-slate-300 hover:text-white border border-white/10'
            }\`}
          >
            <Brain size={14} />
            <span>Individual IDP Lab</span>
          </button>
        </div>
      </div>`;

const replaceStr = `    <div className="w-full flex justify-center p-2 sm:p-4 pb-20 font-sans">
      <div className="w-full max-w-6xl h-[85vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-5 flex flex-col shadow-xl relative overflow-hidden z-10">
          <h2 className="text-xl font-display font-black tracking-tight text-white mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" /> Analytics
          </h2>
          <div className="space-y-2">
            <button onClick={() => setActiveTab('overview')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm \${activeTab === 'overview' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}\`}>
              <TrendingUp size={18} />
              Class Overview
            </button>
            <button onClick={() => { setActiveTab('idp'); if(currentStudent && currentStudent.subjects.length > 0) setSelectedSubjectName(currentStudent.subjects[0].name); }} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm \${activeTab === 'idp' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}\`}>
              <Brain size={18} />
              Individual IDP Lab
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Content */}
        <div className="flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden text-slate-100">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(20,25,50,0.4)_0%,rgba(12,16,36,0)_100%)]">
            
            {/* Dynamic Notifications Banner */}
            <AnimatePresence>
              {showSyncSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 px-6 py-4 rounded-3xl border border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-3 font-semibold text-sm cursor-pointer"
                  onClick={() => setShowSyncSuccess(false)}
                >
                  <CheckCircle className="text-slate-950 scale-110" size={20} />
                  <div>
                    <p className="font-bold">Sync Completed!</p>
                    <p className="text-xs text-slate-900 opacity-90">{currentStudent.name}'s latest report was dispatched to parent dashboards.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/ProgressReports.tsx', code);
