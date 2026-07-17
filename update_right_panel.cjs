const fs = require('fs');

const file = 'src/components/ContentCreator.tsx';
let content = fs.readFileSync(file, 'utf8');

// We want to add a header to the Right Preview Panel
const rightPanelStartStr = `<div id="preview-panel" className="w-full lg:flex-1 bg-navy-dark/40 lg:overflow-y-auto p-4 sm:p-8 lg:p-12 scrollbar-hide relative lg:h-full">`;

const replacementStr = `<div id="preview-panel" className="w-full lg:flex-1 bg-slate-50 dark:bg-navy-dark/40 lg:overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide relative lg:h-full flex flex-col">
          {/* Persistent Right Panel Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
            <h3 className="text-xl font-hand font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Eye size={20} className="text-indigo-500" />
              Live Preview Board
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full shadow-sm">
              <span className={cn("w-2 h-2 rounded-full animate-pulse", isLoading ? "bg-amber-400" : hasResult ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600")} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {isLoading ? "Streaming Generation" : hasResult ? "Generation Complete" : "Awaiting Parameters"}
              </span>
            </div>
          </div>
          
          <div className="flex-1 relative">
`;

let contentArr = content.split(rightPanelStartStr);

if (contentArr.length === 2) {
  content = contentArr[0] + replacementStr + contentArr[1].replace(
    // Also we need to close the extra <div className="flex-1 relative"> at the end of the right panel
    `}
        </div>
      </div>
    )}
  </div>`,
    `}
          </div>
        </div>
      </div>
    )}
  </div>`
  );

  // Update empty state (Neural Preview)
  const emptyStateOld = `<div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
               <div className="bg-white/5 p-10 rounded-[48px] border border-white/5">
                 <Eye size={100} className="text-slate-600" />
               </div>
               <div>
                  <h3 className="text-5xl font-hand text-slate-800">Neural Preview</h3>
                  <p className="text-slate-700 mt-4 max-w-sm mx-auto font-medium">Synchronize parameters on the left to initialize the preview stream.</p>
               </div>
             </div>`;
  const emptyStateNew = `<div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
               <div className="bg-slate-200 dark:bg-white/5 p-10 rounded-[48px] border border-slate-300 dark:border-white/5 shadow-inner">
                 <Eye size={80} className="text-slate-400 dark:text-slate-600" />
               </div>
               <div>
                  <h3 className="text-3xl lg:text-4xl font-hand text-slate-600 dark:text-slate-500">Preview Stream Inactive</h3>
                  <p className="text-slate-500 dark:text-slate-600 mt-4 max-w-sm mx-auto font-medium text-sm">Synchronize parameters on the left and initialize generation to view the live preview board.</p>
               </div>
             </div>`;
  
  content = content.replace(emptyStateOld, emptyStateNew);

  fs.writeFileSync(file, content);
  console.log("Replacement successful");
} else {
  console.log("Could not find right panel start", contentArr.length);
}
