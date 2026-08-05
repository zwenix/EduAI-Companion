const fs = require('fs');
let code = fs.readFileSync('src/components/Messenger.tsx', 'utf8');

const targetStr = `      </div>

      {/* RIGHT PANEL: Active Chat/Group Thread */}
      <div className="flex-1 bg-[#0c1024] border border-white/10 rounded-[28px] flex flex-col shadow-2xl relative overflow-hidden min-h-[600px]">`;

const replaceStr = `      </div>

      {/* RIGHT PANEL: Active Chat/Group Thread */}
      <div className="flex-1 bg-[#0c1024] flex flex-col relative min-h-[600px]">`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/Messenger.tsx', code);
