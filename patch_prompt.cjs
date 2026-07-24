const fs = require('fs');
let code = fs.readFileSync('src/components/ContentCreator.tsx', 'utf8');

const injection = `
                  {/* Custom Action Prompt Script */}
                  <div className="pt-4 border-t border-white/5 space-y-1.5">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest block ml-1", isDarkMode ? "text-purple-400" : "text-purple-600")}>
                      Action Prompt Script (Optional)
                    </label>
                    <textarea 
                      placeholder="Type your custom instructions here... E.g., Focus specifically on the history of the Khoisan people..."
                      value={activeTab === 'teaching' ? t_customPrompt : activeTab === 'visual' ? v_customPrompt : a_customPrompt}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (activeTab === 'teaching') setT_CustomPrompt(val);
                        else if (activeTab === 'visual') setV_CustomPrompt(val);
                        else setA_CustomPrompt(val);
                      }}
                      className={cn(
                        "w-full h-20 border text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-1 transition-all resize-none",
                        isDarkMode 
                          ? "bg-[#0b1122]/80 border-white/10 text-slate-200 focus:border-purple-400 focus:ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.05)]" 
                          : "bg-white border-slate-200 text-slate-800 focus:border-purple-500 focus:ring-purple-500"
                      )}
                    />
                  </div>
`;

code = code.replace(
  '</AdvancedSection>\n                  )}',
  '</AdvancedSection>\n                  )}\n' + injection
);

fs.writeFileSync('src/components/ContentCreator.tsx', code);
