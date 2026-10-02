const fs = require('fs');

const file = 'src/components/ContentCreator.tsx';
let content = fs.readFileSync(file, 'utf8');

// The replacement starts around line 1967
const targetStart = `<AnimatePresence mode="wait">
                  {activeTab === 'teaching' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">`;

const replacement = `<AnimatePresence mode="wait">
                  {activeTab === 'teaching' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                      {isLoading && (
                        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 animate-pulse">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-indigo-300">Assembling Lesson...</span>
                            <span className="text-xs font-mono text-indigo-400">{generationProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#0B1122] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                              style={{ width: \`\${generationProgress}%\` }}
                            />
                          </div>
                          <div className="mt-2 text-[10px] text-indigo-300/60 uppercase tracking-widest font-black">
                            Synthesizing core objectives...
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 size={16} className="text-indigo-400" />
                        <span className="text-sm font-black uppercase tracking-widest text-slate-200">Lab Parameters</span>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Audience</label>
                          <Select value={t_grade} onValueChange={setT_Grade} placeholder="Select Grade" isDarkMode={isDarkMode}>
                            {(close: any) => Object.keys(educationalData).map(g => (
                              <SelectItem key={g} onClick={() => { setT_Grade(g); setT_Subject(''); setT_Topic(''); close(); }} active={t_grade === g} isDarkMode={isDarkMode}>{g.includes('Grade') ? g : \`\${g} Grade\`}</SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject Area</label>
                          <div className="flex flex-wrap gap-2">
                            {t_subjects.length > 0 ? (
                              t_subjects.slice(0, 6).map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setT_Subject(s)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                                    t_subject === s 
                                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                  )}
                                >
                                  {s}
                                </button>
                              ))
                            ) : (
                              <div className="text-[10px] text-slate-500">Select audience first</div>
                            )}
                            {t_subjects.length > 6 && (
                              <div className="w-full">
                                <Select value={t_subject} onValueChange={setT_Subject} placeholder="More..." isDarkMode={isDarkMode}>
                                  {(close: any) => t_subjects.slice(6).map(s => (
                                    <SelectItem key={s} onClick={() => { setT_Subject(s); setT_Topic(''); close(); }} active={t_subject === s} isDarkMode={isDarkMode}>{s}</SelectItem>
                                  ))}
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Concept / Topic</label>
                          <Textarea 
                            placeholder="e.g. Discuss the role of ATP in cellular processes and how it relates to broader energy cycles in ecosystems." 
                            value={t_topic} 
                            onChange={(e: any) => setT_Topic(e.target.value)} 
                            isDarkMode={isDarkMode} 
                            className="h-24 text-xs rounded-xl resize-none bg-white/5 border-white/10 placeholder:text-slate-600 text-slate-300 p-3 w-full outline-none focus:border-indigo-500/50" 
                          />
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => setAdvancedSettingsExpanded(!advancedSettingsExpanded)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Settings2 size={12} className={advancedSettingsExpanded ? "text-indigo-400" : ""} />
                            <span>Advanced Settings</span>
                            <ChevronDown size={12} className={cn("transition-transform", advancedSettingsExpanded ? "rotate-180" : "")} />
                          </button>
                        </div>
                      </div>

                      {advancedSettingsExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 border-t border-white/5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Document Type</label>
                            <Select value={t_type} onValueChange={setT_Type} placeholder="Select Type" isDarkMode={isDarkMode}>
                              {(close: any) => ['Lesson Plan', 'Unit Plan', 'Assessment', 'Study Guide'].map(type => (
                                <SelectItem key={type} onClick={() => { setT_Type(type); close(); }} active={t_type === type} isDarkMode={isDarkMode}>{type}</SelectItem>
                              ))}
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Length & Duration</label>
                            <Input 
                              placeholder="45 minutes" 
                              value={t_lengthAndDuration} 
                              onChange={(e: any) => setT_LengthAndDuration(e.target.value)} 
                              isDarkMode={isDarkMode} 
                              className="h-9 text-xs px-3" 
                            />
                          </div>
                          
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                              <label className="text-[10px] font-bold text-slate-300">Include marking memo</label>
                              <Switch checked={t_memo} onCheckedChange={setT_Memo} id="t-memo" isDarkMode={isDarkMode} />
                            </div>
                            <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                              <label className="text-[10px] font-bold text-slate-300">Include rubrics matrix</label>
                              <Switch checked={t_rubric} onCheckedChange={setT_Rubric} id="t-rubric" isDarkMode={isDarkMode} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}`;

const teachingTabEndStr = `                    </motion.div>
                  )}

                  {activeTab === 'visual' && (`;

let startIndex = content.indexOf(targetStart);
let endIndex = content.indexOf(teachingTabEndStr, startIndex) + teachingTabEndStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + replacement + "\n\n                  {activeTab === 'visual' && (" + content.slice(endIndex);
  fs.writeFileSync(file, content);
  console.log("Replacement successful");
} else {
  console.log("Could not find start or end index");
}
