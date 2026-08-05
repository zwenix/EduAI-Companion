const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const targetStart = `{viewMode === 'dashboard' ? (`;
const targetEnd = `) : null}`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newDashboard = `{viewMode === 'dashboard' ? (
        <div className="w-full flex justify-center p-2 sm:p-4 pb-20">
          <div className="w-full max-w-5xl h-[75vh] rounded-[32px] overflow-hidden bg-[#0c1024] border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col md:flex-row relative">
            
            {/* Sidebar portion of the Settings modal */}
            <div className="w-full md:w-64 bg-[#141a2e] border-r border-cyan-500/10 flex flex-col pt-6 pb-6 shadow-xl shrink-0 z-10">
              <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <IconSettings size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-cyan-400 font-black tracking-widest text-xs leading-tight">COMMANDER</h2>
                  <p className="text-slate-400 font-bold text-[10px] uppercase">Sector 7-G</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => document.getElementById('section-profile')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg text-left cursor-pointer"
                >
                  <User size={16} className="text-cyan-400" />
                  <span>Profile Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('section-security')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 text-left transition-colors cursor-pointer"
                >
                  <Shield size={16} className="text-slate-400" />
                  <span>Account Security</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('section-notifications')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 text-left transition-colors cursor-pointer"
                >
                  <Bell size={16} className="text-slate-400" />
                  <span>Notification Preferences</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('advanced')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 text-left transition-colors cursor-pointer"
                >
                  <IconSettings size={16} className="text-slate-400" />
                  <span>Platform Settings</span>
                </button>
              </div>

              {/* System Actions */}
              <div className="px-4 mt-auto pt-6 border-t border-white/5 space-y-2">
                 <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all">
                    <Power size={14} /> System Logout
                 </button>
              </div>
            </div>

            {/* Right Column Content Area */}
            <div className="flex-1 bg-gradient-to-br from-[#0c1024] to-[#0a0e1c] p-6 sm:p-10 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                 
                 <div className="mb-10 text-left">
                   <h1 className="text-cyan-400 font-black tracking-widest text-sm uppercase mb-1 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse rounded-full" /> Command</h1>
                   <h2 className="text-white font-display text-3xl font-black tracking-tight">PLATFORM CONFIGURATION</h2>
                   <p className="text-slate-400 font-medium text-sm mt-2">Adjust system parameters, visual interfaces, and mission defaults.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="col-span-1 space-y-6">
                        {/* Profile Management Card */}
                        <div id="section-profile" className="bg-[#141a2e] border border-white/5 rounded-2xl p-6 shadow-xl">
                          <h3 className="text-cyan-400 font-bold mb-6 text-left flex items-center gap-2 text-xs tracking-widest uppercase">
                            <User size={16} /> Profile Management
                          </h3>
                          <div className="flex flex-col items-center">
                            <img 
                              src={photoUrl || "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=300&q=80"} 
                              alt={fullName} 
                              className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)] mb-4"
                            />
                            <div className="text-center w-full space-y-4">
                               <div className="text-left">
                                 <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Full Name</label>
                                 <input 
                                   type="text" 
                                   value={fullName} 
                                   onChange={e => setFullName(e.target.value)} 
                                   className="bg-[#0b101c] border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-medium w-full focus:outline-none focus:border-cyan-500 transition-colors shadow-inner" 
                                 />
                               </div>
                               <div className="text-left">
                                 <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Title</label>
                                 <input 
                                   type="text" 
                                   value={jobTitle} 
                                   onChange={e => setJobTitle(e.target.value)} 
                                   className="bg-[#0b101c] border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-medium w-full focus:outline-none focus:border-cyan-500 transition-colors shadow-inner" 
                                 />
                               </div>
                            </div>
                            <button 
                              type="button"
                              onClick={triggerImageUpload} 
                              className="bg-white/5 border border-white/10 text-white font-semibold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 mt-6 w-full hover:bg-white/10 transition-all cursor-pointer shadow-md"
                            >
                              <Edit2 size={14} />
                              <span>Edit Avatar</span>
                            </button>
                          </div>
                        </div>

                        {/* AI Processing Quota Card (Mock) */}
                        <div className="bg-[#141a2e] border border-white/5 rounded-2xl p-6 shadow-xl">
                          <h3 className="text-cyan-400 font-bold mb-4 text-left flex items-center gap-2 text-xs tracking-widest uppercase">
                            <Activity size={16} /> AI Processing Quota
                          </h3>
                          <div className="space-y-3">
                             <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Compute Cycles</span>
                                <span className="text-cyan-400">74%</span>
                             </div>
                             <div className="w-full bg-[#0b101c] rounded-full h-1.5 border border-white/5">
                                <div className="bg-cyan-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: '74%' }}></div>
                             </div>
                             <p className="text-[9px] text-slate-500 text-left mt-2">Cycles reset in 12 hours.</p>
                          </div>
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="col-span-1 space-y-6">
                        {/* Interface Parameters */}
                        <div className="bg-[#141a2e] border border-white/5 rounded-2xl p-6 shadow-xl text-left">
                          <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 text-xs tracking-widest uppercase">
                            <Eye size={16} /> Interface Parameters
                          </h3>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between group">
                                <div>
                                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors block">Night Vision</span>
                                  <span className="text-[9px] text-slate-500">Reduce retinal fatigue</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsDarkMode(!isDarkMode)}
                                  className={\`w-10 h-5 rounded-full transition-colors p-1 flex items-center cursor-pointer \${
                                    isDarkMode ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                                  }\`}
                                >
                                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                                </button>
                             </div>
                          </div>
                        </div>

                        {/* Account Security */}
                        <div id="section-security" className="bg-[#141a2e] border border-white/5 rounded-2xl p-6 shadow-xl text-left">
                          <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 text-xs tracking-widest uppercase">
                            <Shield size={16} /> Security Protocols
                          </h3>
                          <div className="divide-y divide-white/5">
                            <div className="py-3 flex items-center justify-between group cursor-pointer transition-all">
                              <span className="text-xs font-semibold text-slate-300 group-hover:text-white">Password</span>
                              <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded">••••••••</span>
                            </div>
                            <div className="py-3 flex items-center justify-between group cursor-pointer transition-all">
                              <span className="text-xs font-semibold text-slate-300 group-hover:text-white">2FA</span>
                              <span className="text-[9px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                            </div>
                          </div>
                        </div>

                        {/* Notification Preferences */}
                        <div id="section-notifications" className="bg-[#141a2e] border border-white/5 rounded-2xl p-6 shadow-xl text-left">
                          <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 text-xs tracking-widest uppercase">
                            <Bell size={16} /> Mission Directives
                          </h3>
                          <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">Email Comm-Link</span>
                              <input 
                                type="checkbox" 
                                checked={emailAlerts} 
                                onChange={e => setEmailAlerts(e.target.checked)} 
                                className="rounded bg-[#0b101c] border-white/10 text-cyan-500 w-4 h-4 focus:ring-0 cursor-pointer accent-cyan-500" 
                              />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">Tactical Push</span>
                              <input 
                                type="checkbox" 
                                checked={notifications} 
                                onChange={async (e) => {
                                  const checked = e.target.checked;
                                  setNotifications(checked);
                                  if (checked) await NotificationManager.init();
                                }} 
                                className="rounded bg-[#0b101c] border-white/10 text-cyan-500 w-4 h-4 focus:ring-0 cursor-pointer accent-cyan-500" 
                              />
                            </label>
                          </div>
                        </div>

                    </div>
                 </div>

              </div>
            </div>

          </div>
        </div>
      ) : null}`;

  code = code.substring(0, startIndex) + newDashboard + code.substring(endIndex + targetEnd.length);
  // Also remove the "Cosmic Header Banner" since it doesn't fit the new modal look.
  const bannerStart = code.indexOf(`{/* Cosmic Header Banner */}`);
  const bannerEnd = code.indexOf(`{viewMode === 'dashboard'`);
  if (bannerStart !== -1 && bannerEnd !== -1) {
     code = code.substring(0, bannerStart) + code.substring(bannerEnd);
  }
  
  fs.writeFileSync('src/components/Settings.tsx', code);
  console.log('Success');
} else {
  console.log('Target not found');
}
