const fs = require('fs');

const file = 'src/components/ContentCreator.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
               <div className={cn("p-10 rounded-[48px] border shadow-inner", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-200 border-slate-300")}>
                 <Eye size={80} className={isDarkMode ? "text-slate-600" : "text-slate-400"} />
               </div>
               <div>
                  <h3 className={cn("text-3xl lg:text-4xl font-hand", isDarkMode ? "text-slate-500" : "text-slate-600")}>Preview Stream Inactive</h3>
                  <p className={cn("mt-4 max-w-sm mx-auto font-medium text-sm", isDarkMode ? "text-slate-600" : "text-slate-500")}>Synchronize parameters on the left and initialize generation to view the live preview board.</p>
               </div>
             </div>
           )}`;

const newStr = `           ) : (
             <div className="w-full h-full flex flex-col pt-4">
               <div className={cn("max-w-4xl w-full mx-auto p-8 lg:p-12 rounded-[32px] border shadow-sm flex flex-col gap-8 transition-all duration-500", isDarkMode ? "bg-white/5 border-white/5 shadow-none" : "bg-white border-slate-200")}>
                 
                 {/* Header Area */}
                 <div className="space-y-4">
                   <div className="flex flex-wrap gap-2">
                     <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", t_grade ? "bg-indigo-500/10 text-indigo-500" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500")}>
                       {t_grade || "Grade Pending"}
                     </span>
                     <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", t_subject ? "bg-indigo-500/10 text-indigo-500" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500")}>
                       {t_subject || "Subject Pending"}
                     </span>
                     <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", t_type ? "bg-indigo-500/10 text-indigo-500" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500")}>
                       {t_type || "Lesson Plan"}
                     </span>
                   </div>
                   
                   <h1 className={cn("text-3xl lg:text-5xl font-bold font-hand leading-tight transition-colors duration-500", t_topic ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-700")}>
                     {t_topic ? (t_topics.includes(t_topic) ? t_topic : t_topic) : "Awaiting Topic Configuration..."}
                   </h1>
                 </div>

                 {/* Skeleton Body */}
                 <div className="space-y-6 opacity-60">
                    <div className="flex flex-col gap-3">
                      <div className={cn("h-4 w-3/4 rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-full rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-5/6 rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
                       <div className={cn("h-24 rounded-2xl flex flex-col justify-center items-center text-center p-4", isDarkMode ? "bg-white/5" : "bg-slate-50")}>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest mb-2", isDarkMode ? "text-slate-600" : "text-slate-400")}>Objectives</span>
                          <div className={cn("h-2 w-1/2 rounded-full", isDarkMode ? "bg-white/10" : "bg-slate-200")} />
                       </div>
                       <div className={cn("h-24 rounded-2xl flex flex-col justify-center items-center text-center p-4", isDarkMode ? "bg-white/5" : "bg-slate-50")}>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest mb-2", isDarkMode ? "text-slate-600" : "text-slate-400")}>Materials</span>
                          <div className={cn("h-2 w-1/2 rounded-full", isDarkMode ? "bg-white/10" : "bg-slate-200")} />
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6">
                      <div className={cn("h-4 w-1/4 rounded-full mb-2", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-full rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                      <div className={cn("h-4 w-11/12 rounded-full", isDarkMode ? "bg-white/5" : "bg-slate-100")} />
                    </div>
                 </div>

                 <div className={cn("mt-auto pt-10 text-center text-xs font-medium", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                   {t_topic && t_grade && t_subject ? "Configuration complete. Ready to generate." : "Please complete the configuration in the left panel to begin."}
                 </div>
               </div>
             </div>
           )}`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log("Replaced successfully");
} else {
  console.log("Could not find string");
}
