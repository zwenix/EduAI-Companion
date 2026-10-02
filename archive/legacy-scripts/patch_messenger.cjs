const fs = require('fs');
let code = fs.readFileSync('src/components/Messenger.tsx', 'utf8');

const targetStr = `    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Cosmic Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-cyan-500/30 p-8 sm:p-10 shadow-2xl text-center">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={140} className="text-cyan-400" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles size={14} className="animate-spin" />
          <span>EduAI Collaboration Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-display tracking-tight mb-3">
          ✨ Messages & Collaboration ✨
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-medium">
          Connect in real-time with teachers, parents, and students across classrooms, discussion groups, and direct messaging channels.
        </p>
      </div>

      <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-220px)] flex flex-col lg:flex-row gap-6 text-white font-sans">
      
      {/* LEFT PANEL: Chats & Groups */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-[#0c1024] border border-white/10 rounded-[28px] p-5 flex flex-col shadow-2xl relative overflow-hidden">`;

const replaceStr = `    <div className="w-full flex justify-center p-2 sm:p-4 pb-20">
      <div className="w-full max-w-6xl h-[75vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
      
      {/* LEFT PANEL: Chats & Groups */}
      <div className="w-full md:w-80 xl:w-96 shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-5 flex flex-col shadow-xl relative overflow-hidden z-10">`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/Messenger.tsx', code);
