const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const targetStr = `{viewMode === 'dashboard' ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 relative">
            
            {/* Left Sidebar (~25% / 3 cols) */}`;

const replaceStr = `{viewMode === 'dashboard' ? (
        <div className="w-full flex justify-center p-2 sm:p-4">
          <div className="w-full max-w-5xl rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
            
            {/* Sidebar portion of the Settings modal */}`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/Settings.tsx', code);
