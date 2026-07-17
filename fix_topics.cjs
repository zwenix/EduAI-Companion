const fs = require('fs');

const file = 'src/components/ContentCreator.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Concept / Topic</label>
                          <Textarea 
                            placeholder="e.g. Discuss the role of ATP in cellular processes and how it relates to broader energy cycles in ecosystems." 
                            value={t_topic} 
                            onChange={(e: any) => setT_Topic(e.target.value)} 
                            isDarkMode={isDarkMode} 
                            className="h-24 text-xs resize-none w-full" 
                          />
                        </div>`;

const newStr = `                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Concept / Topic</label>
                          <div className="flex flex-wrap gap-2">
                            {t_topics.length > 0 ? (
                              t_topics.slice(0, 4).map((t: string) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setT_Topic(t)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all border text-left",
                                    t_topic === t 
                                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                  )}
                                >
                                  {t}
                                </button>
                              ))
                            ) : (
                              <div className="text-[10px] text-slate-500">Select subject first</div>
                            )}
                            {t_topics.length > 4 && (
                              <div className="w-full">
                                <Select value={t_topics.includes(t_topic) ? t_topic : ""} onValueChange={setT_Topic} placeholder="More topics..." isDarkMode={isDarkMode}>
                                  {(close: any) => t_topics.slice(4).map((t: string) => (
                                    <SelectItem key={t} onClick={() => { setT_Topic(t); close(); }} active={t_topic === t} isDarkMode={isDarkMode}>{t}</SelectItem>
                                  ))}
                                </Select>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Or Custom Topic</label>
                            <Textarea 
                              placeholder="e.g. Discuss the role of ATP in cellular processes and how it relates to broader energy cycles in ecosystems." 
                              value={t_topics.includes(t_topic) ? '' : t_topic} 
                              onChange={(e: any) => setT_Topic(e.target.value)} 
                              isDarkMode={isDarkMode} 
                              className="h-20 text-xs resize-none w-full" 
                            />
                          </div>
                        </div>`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log("Replaced successfully");
} else {
  console.log("Could not find string");
}

