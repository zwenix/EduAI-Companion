import re

with open('src/components/StudentNotes.tsx', 'r') as f:
    content = f.read()

new_return = """  return (
    <div className={cn(
      "flex flex-col h-[calc(100vh-100px)] lg:flex-row gap-6 overflow-hidden animate-in fade-in duration-700",
      isDarkMode ? "bg-transparent" : "bg-transparent"
    )}>
      {/* Left Sidebar - Config & History */}
      <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-12 h-full">
        <div className={cn(
          "rounded-[32px] p-6 border-2 space-y-5 shadow-xl relative overflow-hidden",
          isDarkMode ? "bg-[#0d1225]/80 backdrop-blur-md border-indigo-500/20" : "bg-white/90 backdrop-blur-md border-slate-200"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <BookOpen size={100} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
          </div>
          <div className="relative z-10">
            <h2 className={cn("text-2xl font-hand font-bold tracking-wide flex items-center gap-2", isDarkMode ? "text-white" : "text-slate-900")}>
              <BrainCircuit className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} size={24} /> 
              My Class Setup
            </h2>
            <p className={cn("text-xs mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>
              Generate study guides & notes aligned to CAPS.
            </p>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="space-y-1.5">
              <label className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className={cn("w-full p-2.5 rounded-xl border text-sm font-semibold transition-colors", isDarkMode ? 'bg-slate-900/50 border-white/10 text-white focus:border-indigo-500' : 'border-slate-200 bg-slate-50 focus:border-indigo-400')}>
                <option value="Study Notes" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Comprehensive Study Notes</option>
                <option value="Revision Pack" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Revision Pack (Summary + Key Questions)</option>
                <option value="Flashcards Content" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Flashcards (Terms & Definitions)</option>
                <option value="Mind Map Outline" className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Mind Map Outline</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Grade</label>
              <select value={grade} onChange={e => { setGrade(e.target.value); setSubject(''); setTopic(''); }} className={cn("w-full p-2.5 rounded-xl border text-sm font-semibold transition-colors", isDarkMode ? 'bg-slate-900/50 border-white/10 text-white focus:border-indigo-500' : 'border-slate-200 bg-slate-50 focus:border-indigo-400')}>
                {Object.keys(educationalData).map(g => <option key={g} value={g} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>Grade {g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Subject</label>
              {subject === 'Other' ? (
                <input type="text" placeholder="Type custom subject..." onChange={e => setSubject(e.target.value)} className={cn("w-full p-2.5 rounded-xl border text-sm font-semibold transition-colors", isDarkMode ? 'bg-slate-900/50 border-white/10 text-white focus:border-indigo-500' : 'border-slate-200 bg-slate-50 focus:border-indigo-400')} autoFocus />
              ) : (
                <select value={subject} onChange={e => { setSubject(e.target.value); setTopic(''); }} className={cn("w-full p-2.5 rounded-xl border text-sm font-semibold transition-colors", isDarkMode ? 'bg-slate-900/50 border-white/10 text-white focus:border-indigo-500' : 'border-slate-200 bg-slate-50 focus:border-indigo-400')}>
                  <option value="" className={isDarkMode ? 'bg-slate-800' : ''}>Select a subject...</option>
                  {subjects.map(s => <option key={s} value={s} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>{s}</option>)}
                  <option value="Other" className={isDarkMode ? 'bg-slate-800 text-indigo-400 font-bold' : 'text-indigo-600 font-bold'}>+ Custom Subject...</option>
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <label className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? 'text-slate-400' : 'text-slate-500')}>Topic / Focus</label>
              {topic === 'Other' ? (
                <input type="text" placeholder="Type custom topic..." onChange={e => setTopic(e.target.value)} className={cn("w-full p-2.5 rounded-xl border text-sm font-semibold transition-colors", isDarkMode ? 'bg-slate-900/50 border-white/10 text-white focus:border-indigo-500' : 'border-slate-200 bg-slate-50 focus:border-indigo-400')} autoFocus />
              ) : (
                <select value={topic} onChange={e => setTopic(e.target.value)} disabled={!subject} className={cn("w-full p-2.5 rounded-xl border text-sm font-semibold transition-colors", isDarkMode ? 'bg-slate-900/50 border-white/10 text-white focus:border-indigo-500 disabled:opacity-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-400 disabled:opacity-50')}>
                   <option value="" className={isDarkMode ? 'bg-slate-800' : ''}>Select a topic...</option>
                   {topics.map(t => <option key={t} value={t} className={isDarkMode ? 'bg-slate-800 text-white' : ''}>{t}</option>)}
                   <option value="Other" className={isDarkMode ? 'bg-slate-800 text-indigo-400 font-bold' : 'text-indigo-600 font-bold'}>+ Custom Topic...</option>
                </select>
              )}
            </div>
            
            <button onClick={generateNotes} disabled={loading || !subject || !topic} className={cn(
              "w-full font-black text-[11px] uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer transition-all shadow-md hover:shadow-lg",
              isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            )}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
              {loading ? 'Generating...' : `Generate ${format}`}
            </button>
            
            {loading && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1.5 font-bold">
                  <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>Generating Content</span>
                  <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>{progress}%</span>
                </div>
                <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isDarkMode ? 'bg-white/10' : 'bg-slate-200')}>
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        <div className={cn(
          "rounded-[32px] p-6 border-2 space-y-4 shadow-sm flex-1 flex flex-col min-h-0",
          isDarkMode ? "bg-[#0d1225]/50 backdrop-blur-md border-white/5" : "bg-white/60 backdrop-blur-md border-slate-200"
        )}>
          <h3 className={cn("font-bold flex items-center gap-2 text-sm", isDarkMode ? 'text-white' : 'text-slate-800')}>
            <History size={16} className="text-indigo-500" />
            Class Notes Archive
          </h3>
          {historyLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setResult(item.content || item);
                    setGrade(item.grade?.replace('Grade ', '') || '10');
                    setSubject(item.subject || '');
                    setTopic(item.title?.split(': ')[1] || item.title || '');
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-2xl border text-xs transition-all flex flex-col group cursor-pointer shadow-sm hover:shadow-md",
                    isDarkMode 
                      ? 'bg-slate-900/60 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  )}
                >
                  <p className={cn("font-bold truncate text-sm mb-1", isDarkMode ? "text-slate-200 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900")}>
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between w-full">
                    <p className={cn("text-[10px] font-semibold tracking-wide uppercase", isDarkMode ? "text-indigo-400" : "text-indigo-600")}>
                      {item.subject} • {item.grade}
                    </p>
                    <ArrowRight size={12} className={cn("opacity-0 group-hover:opacity-100 transition-opacity shrink-0 animate-bounce", isDarkMode ? "text-indigo-400" : "text-indigo-600")} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className={cn("text-xs italic text-center p-4", isDarkMode ? "text-slate-500" : "text-slate-500")}>
              No historical study materials found. Newly generated materials will automatically populate this cloud archive!
            </p>
          )}
        </div>
      </div>

      {/* Right Main Panel - Results / Preview */}
      <div className={cn(
        "flex-1 rounded-[36px] border-2 shadow-2xl flex flex-col overflow-hidden relative",
        isDarkMode ? "bg-[#0B1122]/90 border-white/10" : "bg-white border-slate-200"
      )}>
        {result ? (
          <div className="flex-1 flex flex-col h-full">
            <div className={cn("p-4 border-b flex gap-2 justify-end flex-wrap items-center bg-black/5", isDarkMode ? "border-white/10" : "border-slate-100")}>
              <h2 className={cn("flex-1 text-xl font-hand font-bold px-2", isDarkMode ? "text-white" : "text-slate-800 truncate")}>
                {topic || 'Class Material'}
              </h2>
              <button 
                onClick={() => setIsReaderOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-black rounded-xl transition-all bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/20"
              >
                <Eye size={14} /> Read Mode
              </button>
              <button 
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-black rounded-xl transition-all bg-slate-800 hover:bg-slate-700 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md"
              >
                <Printer size={14} /> Print A4
              </button>
              <button 
                onClick={handleExportPDF}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider font-black rounded-xl transition-all cursor-pointer",
                  isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-150 hover:bg-slate-200 text-slate-700'
                )}
              >
                <Download size={14} /> PDF
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div ref={printRef} className="max-w-4xl mx-auto">
                <div 
                  className={cn(
                    "prose max-w-none eduai-content font-sans",
                    isDarkMode ? "prose-invert" : ""
                  )}
                  dangerouslySetInnerHTML={{ __html: result }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className={cn("w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl", isDarkMode ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border border-indigo-200 text-indigo-600")}>
              <BookOpen size={48} className="animate-pulse" />
            </div>
            <h3 className={cn("text-3xl lg:text-5xl font-hand tracking-wide mb-4", isDarkMode ? "text-white" : "text-slate-800")}>
              Welcome to My Class
            </h3>
            <p className={cn("max-w-md mx-auto text-sm lg:text-base leading-relaxed", isDarkMode ? "text-slate-400" : "text-slate-500")}>
              Generate beautiful, high-retention study guides, flashcards, and outlines fully aligned to the South African CAPS curriculum.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isReaderOpen && (
           <ReaderModeModal htmlContent={result} isDarkMode={isDarkMode} onClose={() => setIsReaderOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrintModal && (
          <PrintPreviewModal 
            htmlContent={result} 
            isDarkMode={isDarkMode} 
            onClose={() => setShowPrintModal(false)}
            subject={subject}
            grade={grade}
            topic={topic}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
"""

start_idx = content.find('  return (')
if start_idx != -1:
    content = content[:start_idx] + new_return
    with open('src/components/StudentNotes.tsx', 'w') as f:
        f.write(content)
    print("Successfully replaced return block")
else:
    print("Failed to find return block")
