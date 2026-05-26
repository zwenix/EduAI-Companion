import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Bell, Shield, Key, Moon, Sun, 
  Monitor, Save, AlertCircle, User, CreditCard, 
  Database, Activity, Lock, Mail, Phone, Globe,
  LogOut, Trash2, Plus, Smartphone, Download
} from 'lucide-react';
import { useAi } from '../contexts/AiContext';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (dm: boolean) => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
  onSwitchUser?: () => void;
  isAppInstallable?: boolean;
  installPWAApp?: () => void;
  isAlreadyInstalled?: boolean;
}

export default function Settings({ 
  isDarkMode, 
  setIsDarkMode, 
  onLogout, 
  onSwitchRole, 
  onSwitchUser,
  isAppInstallable = false,
  installPWAApp,
  isAlreadyInstalled = false 
}: SettingsProps) {
  const { provider, ocrProvider, ttsProvider, imageProvider, setProvider, setOcrProvider, setTtsProvider, setImageProvider } = useAi();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  const [fullName, setFullName] = useState(() => localStorage.getItem('eduai_user_name') || 'Dr. Sarah Mkize');
  const [school, setSchool] = useState(() => localStorage.getItem('eduai_user_school') || 'Houghton Academy');
  const [phone, setPhone] = useState(() => localStorage.getItem('eduai_user_phone') || '+27 72 000 0000');
  const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('eduai_user_job') || 'Professional Educator');
  const [photoUrl, setPhotoUrl] = useState(() => localStorage.getItem('eduai_user_photo') || '');
  const [profileEmail, setProfileEmail] = useState('');
  
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        setProfileEmail(auth.currentUser.email || '');
        let currentName = auth.currentUser.displayName || fullName;
        let currentPhoto = auth.currentUser.photoURL || photoUrl;
        
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.name) currentName = data.name;
            if (data.school) setSchool(data.school);
            if (data.phone) setPhone(data.phone);
            if (data.jobTitle) setJobTitle(data.jobTitle);
            if (data.photoUrl) currentPhoto = data.photoUrl;
          }
        } catch (error) {
          console.error("Error fetching profile", error);
          handleFirestoreError(error, OperationType.GET, 'users/' + auth.currentUser.uid);
        }
        
        setFullName(currentName);
        setPhotoUrl(currentPhoto);
        
        localStorage.setItem('eduai_user_name', currentName || '');
        localStorage.setItem('eduai_user_photo', currentPhoto || '');
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSavePersonal = async () => {
    if (!auth.currentUser) return;
    
    // Optimistic UI updates
    localStorage.setItem('eduai_user_name', fullName);
    localStorage.setItem('eduai_user_school', school);
    localStorage.setItem('eduai_user_phone', phone);
    localStorage.setItem('eduai_user_job', jobTitle);
    localStorage.setItem('eduai_user_photo', photoUrl);
    
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          name: fullName,
          email: profileEmail,
          school: school,
          jobTitle: jobTitle,
          phone: phone,
          photoUrl: photoUrl,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(docRef, {
          name: fullName,
          email: profileEmail || auth.currentUser.email || '',
          role: 'teacher', // fallback role
          school: school,
          jobTitle: jobTitle,
          phone: phone,
          photoUrl: photoUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      alert('Personal details saved successfully to Firebase.');
    } catch (error) {
       console.error("Firebase update failed", error);
       alert('Personal details failed to save to Firebase.');
       handleFirestoreError(error, OperationType.WRITE, 'users/' + auth.currentUser.uid);
    }
  };
  
  const triggerImageUpload = () => {
    const url = prompt('Enter image URL for profile picture (or leave blank for initials):', photoUrl);
    if (url !== null) {
      setPhotoUrl(url);
    }
  };

  const subTabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'ai', label: 'AI Configuration', icon: Activity },
    { id: 'pwa', label: 'App Install (PWA)', icon: Smartphone },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
  ];

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading settings...</div>;
  }

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
          <div className="pt-8 opacity-50 space-y-2">
            <button onClick={onSwitchRole} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-500/10 transition-all">
              <User size={18} />
              Switch Role
            </button>
            <button onClick={onSwitchUser} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-500/10 transition-all">
              <SettingsIcon size={18} />
              Switch User
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all">
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
                <div className="relative cursor-pointer" onClick={triggerImageUpload}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-brand-cyan/30 shadow-lg" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-brand-cyan/20 flex items-center justify-center text-4xl text-brand-cyan font-hand border-2 border-brand-cyan/30">
                      {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SM'}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:bg-slate-50">
                    <Plus size={16} />
                  </button>
                </div>
                <div>
                  <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>{fullName}</h2>
                  <p className="text-slate-500">{jobTitle} • {school}</p>
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
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Job Title</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="teacher@school.com"
                      className={cn("w-full pl-12 pr-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} 
                    />
                  </div>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Phone Matrix</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27 72 000 0000"
                      className={cn("w-full pl-12 pr-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button onClick={handleSavePersonal} className="flex items-center gap-2 bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-cyan-500/25 transition-all">
                  <Save size={16} /> Save Changes
                </button>
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
                      <option value="alibaba-qwen">Alibaba qwen3.7-max (CAPS Reasoning)</option>
                      <option value="alibaba-deepseek">Alibaba qwen3.6-plus (Reasoning & Coding)</option>
                      <option value="gemini">Gemini 3 Flash (Fallback)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Visual Fabrication Unit</label>
                    <select 
                      value={imageProvider}
                      onChange={(e) => setImageProvider(e.target.value as any)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    >
                      <option value="gemini-imagen">Gemini 2.5 Flash Image (Primary)</option>
                      <option value="huggingface">HuggingFace FLUX.1 (Key Req)</option>
                      <option value="pollinations-schnell">Flux Schnell (Pollinations)</option>
                      <option value="pollinations-turbo">Z-Image Turbo (Pollinations)</option>
                      <option value="pollinations-klein">FLUX.2 Klein 4B (Pollinations)</option>
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
                      <option value="gemini">Gemini 3 Flash (Vision)</option>
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
                      <option value="google-tts">Google TTS (Free)</option>
                      <option value="elevenlabs">ElevenLabs Pro (Key Required)</option>
                      <option value="huggingface">HuggingFace MMS (Free)</option>
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
                        <p className="text-xs text-slate-500">Linked to {profileEmail || 'unknown'}</p>
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

          {activeSubTab === 'pwa' && (
             <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-8", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm")}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-cyan-500/10 rounded-2xl text-brand-cyan">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>EduAI Desktop & Mobile App</h2>
                    <p className="text-sm text-slate-500">Progressive Web App (PWA) installation and offline capabilities.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={cn("p-6 rounded-3xl border text-center flex flex-col justify-between", isDarkMode ? "bg-white/5 border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700")}>
                    <div>
                      <div className="text-3xl mb-2">📡</div>
                      <h4 className={cn("font-bold mb-1", isDarkMode ? "text-white" : "text-slate-900")}>Offline Autonomy</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Cache your study guides, flashcards, generated notes and review materials effortlessly to study without active cellular networks.</p>
                    </div>
                  </div>
                  <div className={cn("p-6 rounded-3xl border text-center flex flex-col justify-between", isDarkMode ? "bg-white/5 border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700")}>
                    <div>
                      <div className="text-3xl mb-2">⚡</div>
                      <h4 className={cn("font-bold mb-1", isDarkMode ? "text-white" : "text-slate-900")}>Speed Boots</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Direct hardware acceleration-grade launching, rendering UI layouts faster and avoiding typical browser address overhead.</p>
                    </div>
                  </div>
                  <div className={cn("p-6 rounded-3xl border text-center flex flex-col justify-between", isDarkMode ? "bg-white/5 border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700")}>
                    <div>
                      <div className="text-3xl mb-2">📱</div>
                      <h4 className={cn("font-bold mb-1", isDarkMode ? "text-white" : "text-slate-900")}>Standalone Mode</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Launches seamlessly in its own secure, edge-to-edge window. Lives on your home screen or dock just like an app store app.</p>
                    </div>
                  </div>
                </div>

                <div className={cn("p-8 rounded-[36px] border space-y-6 flex flex-col md:flex-row items-center justify-between gap-6", isDarkMode ? "bg-white/5 border-white/5" : "bg-[#06b6d4]/5 border-[#06b6d4]/15")}>
                  <div className="space-y-2 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-slate-800")}>Installation Protocol Status</span>
                      {isAlreadyInstalled ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20">
                          ✓ ACTIVE & LINKED
                        </span>
                      ) : isAppInstallable ? (
                        <span className="bg-cyan-500/20 text-brand-cyan text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#06b6d4]/20 animate-pulse">
                          ● READY TO INSTALL
                        </span>
                      ) : (
                        <span className="bg-slate-500/20 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/5">
                          STANDALONE CAPABLE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 max-w-xl">
                      {isAlreadyInstalled 
                        ? "EduAI Companion is already successfully running in standalone mode! Check your app drawer or desktop icons to launch."
                        : isAppInstallable
                        ? "Ready to run natively. Press the trigger button to prompt direct home-screen integration."
                        : "To install EduAI Companion natively from inside this environment, we recommend popping this preview open in a new tab, or choosing 'Add to Home Screen' or 'Install' directly inside your browser settings."}
                    </p>
                  </div>

                  {!isAlreadyInstalled && isAppInstallable && installPWAApp && (
                    <button 
                      onClick={installPWAApp}
                      className="flex items-center gap-2.5 bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-cyan-500/25 active:scale-95 transition-all whitespace-nowrap cursor-pointer border-0 outline-none"
                    >
                      <Download size={16} /> Install Now
                    </button>
                  )}
                </div>

                <div className={cn("p-6 rounded-2xl text-xs space-y-3", isDarkMode ? "bg-white/5" : "bg-slate-50")}>
                  <h4 className={cn("font-bold uppercase tracking-wider text-slate-500 text-[10px]")}>Manual Setup Guide (All Platforms)</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
                    <li><strong className={isDarkMode ? "text-white/80" : "text-slate-700"}>Android (Chrome / Edge)</strong>: Tap the three-dot menu icon in your top right, and search for <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li><strong className={isDarkMode ? "text-white/80" : "text-slate-700"}>iOS iPhone & iPad (Safari)</strong>: Tap the share utility box (square icon with up-arrow) at the screen bottom, scroll, and select <strong>"Add to Home Screen"</strong>.</li>
                    <li><strong className={isDarkMode ? "text-white/80" : "text-slate-700"}>macOS & Windows (Edge / Chrome)</strong>: Press the computer icon with down-arrow popping up right in your URL address bar, or open native browser menus to select <strong>"Install EduAI Companion"</strong>.</li>
                  </ul>
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

