const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newSidebarItem = `const SidebarItem = ({ id, icon: Icon, label, active, onClick, collapsed, isDarkMode, themeMode, role }: { id?: string, icon: any, label: string, active?: boolean, onClick: () => void, collapsed: boolean, isDarkMode?: boolean, themeMode?: string, role?: string | null }) => {
  const displayLabel = id === 'teacher-dashboard-menu' && label !== 'Home' && role !== 'student' ? 'Chalkboard' : label;

  return (
    <button
      onClick={onClick}
      title={collapsed ? displayLabel : undefined}
      className={cn(
        "flex items-center w-full gap-3.5 transition-all duration-300 relative cursor-pointer border-0 outline-none group mb-1.5",
        collapsed ? "justify-center p-3 rounded-2xl" : "p-3 px-4 rounded-2xl",
        active 
          ? "bg-cyan-500/10 text-cyan-400 font-black border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
          : "text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
      )}
    >
      <Icon 
        size={collapsed ? 20 : 18} 
        className={cn(
          "shrink-0 transition-transform duration-300 group-hover:scale-110",
          active ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-300"
        )} 
      />
      
      {!collapsed && (
        <span className="text-[10px] tracking-widest uppercase font-black truncate text-left">
          {displayLabel}
        </span>
      )}
      
      {active && !collapsed && (
         <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      )}
    </button>
  );
};`;

// Replace the whole SidebarItem function
const lines = code.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const SidebarItem =')) {
    start = i;
  }
  if (start !== -1 && lines[i].includes('};') && i > start) {
    // Check if it's the end of SidebarItem
    // The original SidebarItem had sparkles at the end
    if (lines[i-1].includes('</button>')) {
       end = i;
       break;
    }
  }
}

if (start !== -1 && end !== -1) {
  const head = lines.slice(0, start).join('\n');
  const tail = lines.slice(end + 1).join('\n');
  fs.writeFileSync('src/App.tsx', head + '\n' + newSidebarItem + '\n' + tail);
} else {
  console.error("Could not find SidebarItem", start, end);
}
