const fs = require('fs');

const file = 'src/components/ContentCreator.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `className="w-full lg:flex-1 bg-slate-50 dark:bg-navy-dark/40 lg:overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide relative lg:h-full flex flex-col"`,
  `className={cn("w-full lg:flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide relative lg:h-full flex flex-col", isDarkMode ? "bg-navy-dark/40" : "bg-slate-50")}`
);

content = content.replace(
  `className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-white/10 shrink-0"`,
  `className={cn("flex justify-between items-center mb-6 pb-4 border-b shrink-0", isDarkMode ? "border-white/10" : "border-slate-200")}`
);

content = content.replace(
  `className="text-xl font-hand font-bold text-slate-800 dark:text-white flex items-center gap-2"`,
  `className={cn("text-xl font-hand font-bold flex items-center gap-2", isDarkMode ? "text-white" : "text-slate-800")}`
);

content = content.replace(
  `className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full shadow-sm"`,
  `className={cn("flex items-center gap-2 px-3 py-1 rounded-full shadow-sm border", isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200")}`
);

content = content.replace(
  `className={cn("w-2 h-2 rounded-full animate-pulse", isLoading ? "bg-amber-400" : hasResult ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600")}`,
  `className={cn("w-2 h-2 rounded-full animate-pulse", isLoading ? "bg-amber-400" : hasResult ? "bg-emerald-400" : (isDarkMode ? "bg-slate-600" : "bg-slate-300"))}`
);

content = content.replace(
  `className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"`,
  `className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? "text-slate-400" : "text-slate-500")}`
);

content = content.replace(
  `className="bg-slate-200 dark:bg-white/5 p-10 rounded-[48px] border border-slate-300 dark:border-white/5 shadow-inner"`,
  `className={cn("p-10 rounded-[48px] border shadow-inner", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-200 border-slate-300")}`
);

content = content.replace(
  `className="text-slate-400 dark:text-slate-600"`,
  `className={isDarkMode ? "text-slate-600" : "text-slate-400"}`
);

content = content.replace(
  `className="text-3xl lg:text-4xl font-hand text-slate-600 dark:text-slate-500"`,
  `className={cn("text-3xl lg:text-4xl font-hand", isDarkMode ? "text-slate-500" : "text-slate-600")}`
);

content = content.replace(
  `className="text-slate-500 dark:text-slate-600 mt-4 max-w-sm mx-auto font-medium text-sm"`,
  `className={cn("mt-4 max-w-sm mx-auto font-medium text-sm", isDarkMode ? "text-slate-600" : "text-slate-500")}`
);


fs.writeFileSync(file, content);
console.log("Replacement successful");
