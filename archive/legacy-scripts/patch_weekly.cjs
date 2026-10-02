const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyPlanner.tsx', 'utf8');

// Add cn if missing or ensure it works
if (!code.includes('const cn =')) {
  code = code.replace("export interface PlannerEvent", "const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');\n\nexport interface PlannerEvent");
}

const targetStr = `  return (
    <div className={\`min-h-screen \${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'} pb-16\`}>
      {/* Top Banner */}
      <div className={\`\${isDarkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'} shadow-sm\`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className={\`p-2 rounded-xl transition-colors \${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }\`}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <CalendarIcon className="w-7 h-7 text-cyan-500" />
                    Weekly Planner Grid
                  </h1>
                  <span className={\`text-xs font-semibold px-2.5 py-0.5 rounded-full \${
                    userRole === 'student'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                      : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300'
                  }\`}>
                    {userRole === 'student' ? 'Student Timetable' : 'Teacher CAPS Schedule'}
                  </span>
                </div>
                <p className={\`text-sm mt-0.5 \${isDarkMode ? 'text-gray-400' : 'text-gray-600'}\`}>
                  Live synced with Firestore — organize weekly lessons, assessments, and study groups.
                </p>
              </div>
            </div>

            {/* Actions / View Mode Toggle / Add Event */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* View Mode Switcher */}
              <div className={\`flex items-center p-1 rounded-xl border \${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
              }\`}>
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all \${
                    viewMode === 'columns'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }\`}
                >
                  <Grid className="w-4 h-4" />
                  Day Columns
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all \${
                    viewMode === 'table'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }\`}
                >
                  <Table className="w-4 h-4" />
                  List View
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className={\`flex items-center gap-1 px-3 py-1.5 rounded-xl border \${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                }\`}>
                  <button onClick={handlePrevWeek} className="p-1 hover:text-cyan-500 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold min-w-[140px] text-center">
                    {weekRangeLabel}
                  </span>
                  <button onClick={handleNextWeek} className="p-1 hover:text-cyan-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setNewEvent({
                      title: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      startTime: '08:00',
                      endTime: '09:00',
                      category: 'caps-lesson',
                      role: userRole === 'student' ? 'student' : 'teacher'
                    });
                    setIsModalOpen(true);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

const replaceStr = `  return (
    <div className="w-full flex justify-center p-2 sm:p-4 pb-20 font-sans">
      <div className="w-full max-w-6xl h-[85vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-5 flex flex-col shadow-xl relative overflow-hidden z-10 text-white">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer">
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-display font-black tracking-tight text-white flex items-center gap-2">
              <CalendarIcon size={20} className="text-cyan-400" /> Planner
            </h2>
          </div>
          
          <div className="space-y-4">
             <div>
                <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">View Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setViewMode('columns')} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-[10px] font-bold uppercase", viewMode === 'columns' ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-white/[0.02] border-transparent text-slate-400 hover:text-white")}>
                    <Grid size={18} /> Columns
                  </button>
                  <button onClick={() => setViewMode('table')} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-[10px] font-bold uppercase", viewMode === 'table' ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-white/[0.02] border-transparent text-slate-400 hover:text-white")}>
                    <Table size={18} /> List
                  </button>
                </div>
             </div>
             
             <div>
                <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Controls</p>
                <button onClick={() => { setEditingEvent(null); setNewEvent({ title: '', description: '', date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '09:00', category: 'caps-lesson', role: userRole === 'student' ? 'student' : 'teacher' }); setIsModalOpen(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer">
                  <Plus size={16} /> Add Event
                </button>
             </div>
          </div>
          
          <div className="mt-auto pt-6 space-y-3">
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Current Week</p>
                <div className="flex items-center justify-between gap-1 mt-1">
                   <button onClick={handlePrevWeek} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors">
                      <ChevronLeft size={14} />
                   </button>
                   <p className="text-[10px] font-bold text-white text-center leading-tight">{weekRangeLabel}</p>
                   <button onClick={handleNextWeek} className="p-1 text-slate-400 hover:text-cyan-400 transition-colors">
                      <ChevronRight size={14} />
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: Content */}
        <div className="flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden text-slate-100">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(20,25,50,0.4)_0%,rgba(12,16,36,0)_100%)]">`;

code = code.replace(targetStr, replaceStr);

const targetEndStr = `    </div>
  );
};`;

const replaceEndStr = `          </div>
        </div>
      </div>
    </div>
  );
};`;

code = code.replace(targetEndStr, replaceEndStr);

fs.writeFileSync('src/components/WeeklyPlanner.tsx', code);
