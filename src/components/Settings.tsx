import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Bell, Shield, Key, Moon, Sun, 
  Monitor, Save, AlertCircle, User, CreditCard, 
  Database, Activity, Lock, Mail, Phone, Globe,
  LogOut, Trash2
} from 'lucide-react';
import { useAi } from '../contexts/AiContext';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (dm: boolean) => void;
}

export default function Settings({ isDarkMode, setIsDarkMode }: SettingsProps) {
  const { provider, ocrProvider, ttsProvider, imageProvider, setProvider, setOcrProvider, setTtsProvider, setImageProvider } = useAi();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [fullName, setFullName] = useState('Dr. Sarah Mkize');
  const [school, setSchool] = useState('Houghton Academy');
  const [activeSubTab, setActiveSubTab] = useState('personal');

  const subTabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'ai', label: 'AI Configuration', icon: Activity },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-2">
        <div className="flex items-center gap-4">
          <div className={cn("p-4 rounded-3xl transition-colors", isDarkMode ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200 shadow-sm")}>
            <SettingsIcon className={cn("w-8 h-8", isDarkMode ? "text-brand-cyan" : "text-brand-cyan/80")} />
          </div>
          <div>
            <h1 className={cn("text-3xl lg:text-4xl font-hand", isDarkMode ? "text-white" : "text-slate-900")}>System Configuration</h1>
            <p className={cn("text-sm mt-1", isDarkMode ? "text-slate-500" : "text-slate-500")}>Neural matrix and account preferences.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                activeSubTab === tab.id
                  ? (isDarkMode ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/20" : "bg-brand-cyan text-white shadow-lg")
                  : (isDarkMode ? "text-slate-500 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50")
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
          <div className="pt-8 opacity-50">
            <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all">
              <LogOut size={18} />
              Logout Session
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeSubTab === 'personal' && (
            <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-10", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm")}>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-brand-cyan/20 flex items-center justify-center text-4xl text-brand-cyan font-hand border-2 border-brand-cyan/30">
                    SM
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:bg-slate-50">
                    <Plus size={16} />
                  </button>
                </div>
                <div>
                  <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{fullName}</h2>
                  <p className="text-slate-500">Professional Educator • {school}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn("w-full px-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Institution</label>
                  <input 
                    type="text" 
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className={cn("w-full px-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      value="teacher@houghton.school.za"
                      disabled
                      className={cn("w-full pl-12 pr-5 py-4 rounded-2xl text-sm opacity-50 cursor-not-allowed", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Phone Matrix</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="tel" 
                      placeholder="+27 72 000 0000"
                      className={cn("w-full pl-12 pr-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-6">
                <h3 className={cn("text-xs font-black uppercase tracking-widest", isDarkMode ? "text-slate-400" : "text-slate-500")}>Interface Personalization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsDarkMode(false)}
                    className={cn(
                      "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left",
                      !isDarkMode ? "border-brand-cyan bg-brand-cyan/5" : "border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-yellow">
                      <Sun />
                    </div>
                    <div>
                      <p className={cn("font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Solar Protocol</p>
                      <p className="text-[10px] text-slate-500 font-medium">Standard high-contrast light mode</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setIsDarkMode(true)}
                    className={cn(
                      "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left",
                      isDarkMode ? "border-brand-cyan bg-brand-cyan/10" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="p-3 bg-navy-dark rounded-2xl shadow-sm text-brand-cyan border border-white/10">
                      <Moon />
                    </div>
                    <div>
                      <p className={cn("font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Lunar Protocol</p>
                      <p className="text-[10px] text-slate-500 font-medium">Low-light focused dark interface</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'ai' && (
             <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-8", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm")}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>AI Engine Matrix</h2>
                    <p className="text-sm text-slate-500">Configure default providers for the companion nodes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Universal intelligence (Primary)</label>
                    <select 
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    >
                      <option value="llama-primary">Llama 3.3 70B Versatile (Primary)</option>
                      <option value="gemini">Gemini 2.0 Flash (Fallback)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Visual Fabrication Unit</label>
                    <select 
                      value={imageProvider}
                      onChange={(e) => setImageProvider(e.target.value as any)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    >
                      <option value="pollinations">FLUX.2 [klein] 4B</option>
                      <option value="glm-image">Z-AI CogView</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">OCR / Vision Processor</label>
                    <select 
                      value={ocrProvider}
                      onChange={(e) => setOcrProvider(e.target.value as any)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    >
                      <option value="groq-vision">Llama 3.2 Vision (Primary)</option>
                      <option value="gemini">Gemini Vision (Fallback)</option>
                      <option value="ocrspace">OCR.Space Core</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Vocal Synthesis Engine</label>
                    <select 
                      value={ttsProvider}
                      onChange={(e) => setTtsProvider(e.target.value as any)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    >
                      <option value="browser">Browser Core HD (Free)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10 flex gap-4 text-sm">
                   <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                   <div className="text-blue-500/80">
                     <p className="font-bold mb-1">CAPS Optimization Active</p>
                     <p>Selected models are automatically calibrated for the South African CAPS curriculum and local context processing.</p>
                   </div>
                </div>
             </div>
          )}

          {activeSubTab === 'security' && (
             <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-8", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm")}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Security Perimeter</h2>
                    <p className="text-sm text-slate-500">Manage your credentials and access protocol.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white">
                        G
                      </div>
                      <div>
                        <p className={cn("font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Google Authentication</p>
                        <p className="text-xs text-slate-500">Linked to teacher@houghton.school.za</p>
                      </div>
                    </div>
                    <button className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all", isDarkMode ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500")}>Unlink</button>
                  </div>

                  <div className={cn("p-8 rounded-[36px] space-y-6", isDarkMode ? "bg-white/5" : "bg-slate-50")}>
                    <div className="flex items-center gap-2">
                       <Key size={18} className="text-brand-cyan" />
                       <h3 className={cn("font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Update Neural Access Key</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="password" placeholder="Current Key" className={cn("w-full px-5 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800")} />
                      <input type="password" placeholder="New Neural Key" className={cn("w-full px-5 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800")} />
                    </div>
                    <button className="bg-brand-cyan text-navy-dark px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Rotatate Key</button>
                  </div>
                </div>
             </div>
          )}

          {activeSubTab === 'billing' && (
             <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-8", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm")}>
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Neural Subscription</h2>
                        <p className="text-sm text-slate-500">Management for professional licenses.</p>
                      </div>
                    </div>
                    <div className="bg-brand-cyan/20 text-brand-cyan px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-cyan/20">
                      Standard Plan
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className={cn("p-8 rounded-[40px] border-2 flex flex-col justify-between", isDarkMode ? "bg-brand-cyan/5 border-brand-cyan/20" : "bg-white border-brand-cyan/10 shadow-xl")}>
                     <div>
                       <h3 className={cn("text-xl font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>Pro Educator</h3>
                       <p className="text-sm text-slate-500">Unlimited generation, premium models, and collaborative portals.</p>
                     </div>
                     <div className="mt-8">
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className={cn("text-4xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>R249</span>
                          <span className="text-slate-500 text-sm">/month</span>
                        </div>
                        <button className="w-full bg-brand-cyan text-navy-dark py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 active:scale-95 transition-all">Upgrade Neural Link</button>
                     </div>
                   </div>

                   <div className={cn("p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-6 opacity-60")}>
                     <h3 className={cn("text-xl font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>Current Allocation</h3>
                     <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            <span>Tokens used</span>
                            <span>42%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-cyan w-[42%]"></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            <span>Image Prints</span>
                            <span>15 / 50</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[30%]"></div>
                          </div>
                        </div>
                     </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 p-4">
        <button className={cn("flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95", isDarkMode ? "glass hover:bg-white/10 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50")}>
          Discard Changes
        </button>
        <button className="flex items-center gap-2 px-10 py-4 bg-brand-cyan hover:bg-cyan-500 text-navy-dark rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-cyan-500/30 active:scale-95 transition-all">
          <Save className="w-4 h-4" />
          Synchronize Configuration
        </button>
      </div>
    </div>
  );
}

