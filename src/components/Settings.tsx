import { NotificationManager } from '../lib/notifications/NotificationManager';
import React, { useState, useEffect } from 'react';
import { 
  Bell, Shield, Key, Moon, Sun, 
  Monitor, Save, AlertCircle, User, CreditCard, 
  Database, Activity, Lock, Mail, Phone, Globe,
  Trash2, Plus, Smartphone, Download, Palette, Link as LinkIcon, Edit2, Camera
} from 'lucide-react';
import { IconSettings, IconLogout } from './LocalIcons';
import { useAi } from '../contexts/AiContext';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';
import ProfileSettings from './ProfileSettings';
import PasswordSecurity from './PasswordSecurity';

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
  userRole?: string;
  /** Which subtab to open on mount / when the value changes (e.g. 'security'). */
  initialSection?: string;
}

export default function Settings({ 
  isDarkMode, 
  setIsDarkMode, 
  onLogout, 
  onSwitchRole, 
  onSwitchUser,
  isAppInstallable = false,
  installPWAApp,
  isAlreadyInstalled = false,
  userRole,
  initialSection
}: SettingsProps) {
  const { provider, ocrProvider, ttsProvider, imageProvider, setProvider, setOcrProvider, setTtsProvider, setImageProvider } = useAi();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [viewMode, setViewMode] = useState<'dashboard' | 'advanced'>('dashboard');
  
  const [fullName, setFullName] = useState(() => localStorage.getItem('eduai_user_name') || 'Dr. Sarah Mkize');
  const [school, setSchool] = useState(() => localStorage.getItem('eduai_user_school') || 'Houghton Academy');
  const [phone, setPhone] = useState(() => localStorage.getItem('eduai_user_phone') || '+27 72 000 0000');
  const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('eduai_user_job') || 'Professional Educator');
  const [photoUrl, setPhotoUrl] = useState(() => localStorage.getItem('eduai_user_photo') || '');
  const [profileEmail, setProfileEmail] = useState('');
  
  // Adaptive Learning & Grade Settings
  const [gradeLevel, setGradeLevel] = useState('Grade 10');
  const [learningPreference, setLearningPreference] = useState('Visual');

  // Parents Link child forms
  const [childEmailToLink, setChildEmailToLink] = useState('');
  const [linkMessage, setLinkMessage] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkedChildrenList, setLinkedChildrenList] = useState<any[]>([]);
  
  // Children accessibility preferences controls
  const [dyslexiaTheme, setDyslexiaTheme] = useState(() => localStorage.getItem('eduai_dyslexia') === 'true');
  const [readSpeed, setReadSpeed] = useState(() => Number(localStorage.getItem('eduai_read_speed') || '1.0'));
  const [dyscalculiaHelp, setDyscalculiaHelp] = useState(() => localStorage.getItem('eduai_dyscalculia') === 'true');
  
  const [activeSubTab, setActiveSubTab] = useState(initialSection || 'personal');
  const [isLoading, setIsLoading] = useState(true);

  // Deep-link support: when the app shell asks for a section (e.g. the
  // header profile menu's "Password & Security"), switch to it even if
  // Settings is already mounted.
  useEffect(() => {
    if (initialSection) setActiveSubTab(initialSection);
  }, [initialSection]);

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
            if (data.gradeLevel) setGradeLevel(data.gradeLevel);
            if (data.learningPreference) setLearningPreference(data.learningPreference);
            
            // Sync accessibility from DB if keys present
            if (data.dyslexiaTheme !== undefined) {
              setDyslexiaTheme(data.dyslexiaTheme);
              localStorage.setItem('eduai_dyslexia', String(data.dyslexiaTheme));
            }
            if (data.readSpeed !== undefined) {
              setReadSpeed(data.readSpeed);
              localStorage.setItem('eduai_read_speed', String(data.readSpeed));
            }
            if (data.dyscalculiaHelp !== undefined) {
              setDyscalculiaHelp(data.dyscalculiaHelp);
              localStorage.setItem('eduai_dyscalculia', String(data.dyscalculiaHelp));
            }
          }

          // If current role is parent, let's load linked children
          if (userRole === 'parent' || userRole === 'Parent') {
            const childrenQuery = query(
              collection(db, 'students'), 
              where('parentEmail', '==', auth.currentUser.email?.toLowerCase().trim())
            );
            const childrenSnap = await getDocs(childrenQuery);
            const list = childrenSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLinkedChildrenList(list);
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
  }, [userRole]);

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
      const userPayload = {
        name: fullName,
        email: profileEmail || auth.currentUser.email || '',
        school: school,
        jobTitle: jobTitle,
        phone: phone,
        photoUrl: photoUrl,
        gradeLevel: gradeLevel,
        learningPreference: learningPreference,
        dyslexiaTheme: dyslexiaTheme,
        readSpeed: readSpeed,
        dyscalculiaHelp: dyscalculiaHelp,
        updatedAt: serverTimestamp()
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, userPayload);
      } else {
        await setDoc(docRef, {
          ...userPayload,
          role: userRole || 'teacher', // fallback role
          createdAt: serverTimestamp()
        });
      }

      // If user is a student/learner, search for their record in 'students' and align it too
      if (userRole === 'student' || userRole === 'learner') {
        const sQuery = query(collection(db, 'students'), where('email', '==', auth.currentUser.email?.toLowerCase().trim()));
        const sSnap = await getDocs(sQuery);
        if (!sSnap.empty) {
          const studentDocId = sSnap.docs[0].id;
          await updateDoc(doc(db, 'students', studentDocId), {
            name: fullName,
            grade: gradeLevel,
            updatedAt: serverTimestamp()
          });
        }
      }

      alert('Personal and Adaptive Profile details saved successfully to Firebase.');
    } catch (error) {
       console.error("Firebase update failed", error);
       alert('Personal details failed to save to Firebase.');
       handleFirestoreError(error, OperationType.WRITE, 'users/' + auth.currentUser.uid);
    }
  };

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childEmailToLink.trim() || !auth.currentUser?.email) return;
    setIsLinking(true);
    setLinkMessage('');
    try {
      const emailSearch = childEmailToLink.trim().toLowerCase();
      const q = query(collection(db, 'students'), where('email', '==', emailSearch));
      const sSnap = await getDocs(q);
      
      if (sSnap.empty) {
        // Create an empty template student record linked to key parent so it activates
        const docId = `student_${Date.now()}`;
        await setDoc(doc(db, 'students', docId), {
          id: docId,
          name: childEmailToLink.split('@')[0],
          grade: 'Grade 10',
          email: emailSearch,
          status: 'Active',
          teacherId: 'unassigned',
          parentName: fullName,
          parentEmail: auth.currentUser.email.toLowerCase().trim(),
          parentPhone: phone,
          createdAt: serverTimestamp(),
          subjects: [
            { name: 'Mathematics', mark: 65, termHistory: [55, 60, 65], assessments: [] },
            { name: 'Physical Sciences', mark: 70, termHistory: [60, 65, 70], assessments: [] },
            { name: 'English First Additional Language', mark: 72, termHistory: [68, 70, 72], assessments: [] }
          ]
        });
        setLinkMessage(`A new profile template was created and linked to your parent account for: ${emailSearch}`);
      } else {
        const studentDocId = sSnap.docs[0].id;
        await updateDoc(doc(db, 'students', studentDocId), {
          parentEmail: auth.currentUser.email.toLowerCase().trim(),
          parentName: fullName,
          parentPhone: phone,
          updatedAt: serverTimestamp()
        });
        setLinkMessage(`Successfully linked student profile for: ${emailSearch}!`);
      }
      setChildEmailToLink('');
      // Update list
      const q2 = query(collection(db, 'students'), where('parentEmail', '==', auth.currentUser.email.toLowerCase().trim()));
      const cSnap = await getDocs(q2);
      setLinkedChildrenList(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error("Linking failed", err);
      setLinkMessage(`Failed to link: ${err.message || String(err)}`);
    } finally {
      setIsLinking(false);
    }
  };

  const triggerImageUpload = () => {
    const url = prompt('Enter image URL for profile picture (or leave blank for initials):', photoUrl);
    if (url !== null) {
      setPhotoUrl(url);
    }
  };

  const subTabs = [
    { id: 'personal', label: 'Profile Settings', icon: User },
    { id: 'accessibility', label: 'Accessibility', icon: Palette },
    { id: 'security', label: 'Password & Security', icon: Lock },
    { id: 'ai', label: 'AI Configuration', icon: Activity },
    { id: 'pwa', label: 'App Install (PWA)', icon: Smartphone },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
    { id: 'codebase', label: 'Codebase Spec', icon: Database },
  ];

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading settings...</div>;
  }
  return (
    <div className="full-bleed-page w-full h-full min-h-0 font-sans p-1 sm:p-1 lg:p-2">
      <div className="w-full h-full min-h-0 overflow-hidden bg-[#0c1024] rounded-2xl flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 bg-[#141a2e] border-r border-cyan-500/10 flex flex-col pt-6 pb-6 shadow-xl shrink-0 z-10 text-white">
          <div className="px-6 mb-8 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <IconSettings size={20} className="text-cyan-400" />
             </div>
             <div>
                <h2 className="text-cyan-400 font-black tracking-widest text-xs leading-tight uppercase">Settings</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase">Commander</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            {subTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left",
                  activeSubTab === tab.id 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-auto px-4 pt-6 space-y-3">
             <button onClick={() => setViewMode(viewMode === 'dashboard' ? 'advanced' : 'dashboard')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                {viewMode === 'dashboard' ? 'Advanced Mode' : 'Dashboard View'}
             </button>
          </div>
        </div>

        {/* RIGHT PANEL: Content */}
        <div className="flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden text-slate-100">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(20,25,50,0.4)_0%,rgba(12,16,36,0)_100%)]">
             {activeSubTab === 'personal' && (
                <div id="section-profile" className="space-y-8 animate-in fade-in duration-500">
                   {/* Profile content - keeping original logic but wrapped */}
                   <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                      <div className="relative group">
                         <div className="w-32 h-32 rounded-[40px] overflow-hidden border-2 border-brand-cyan/30 shadow-2xl relative">
                            {photoUrl ? (
                               <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full bg-gradient-to-br from-navy-dark to-slate-900 flex items-center justify-center text-4xl font-black text-brand-cyan">
                                  {fullName.split(' ').map(n => n[0]).join('')}
                               </div>
                            )}
                            <button onClick={triggerImageUpload} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest">
                               Change
                            </button>
                         </div>
                         <div className="absolute -bottom-2 -right-2 bg-brand-cyan text-navy-dark p-2 rounded-xl shadow-lg border border-white/20">
                            <Camera size={16} />
                         </div>
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-white mb-2">{fullName}</h3>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {userRole} Account • South Africa
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Full Identity</label>
                         <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Communication Link</label>
                         <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" />
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'accessibility' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h2 className="text-3xl font-black text-white">Visual & Accessibility</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4">
                         <div className="flex justify-between items-center">
                            <div>
                               <h4 className="font-bold text-white">Environment Theme</h4>
                               <p className="text-xs text-slate-500">Toggle high-contrast dark mode interface.</p>
                            </div>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("w-14 h-8 rounded-full relative transition-all duration-300", isDarkMode ? "bg-brand-cyan" : "bg-slate-700")}>
                               <div className={cn("absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md", isDarkMode ? "left-7" : "left-1")} />
                            </button>
                         </div>
                      </div>
                      <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4 opacity-60">
                         <div className="flex justify-between items-center">
                            <div>
                               <h4 className="font-bold text-white">Screen Reader Support</h4>
                               <p className="text-xs text-slate-500">Enable optimized ARIA labels.</p>
                            </div>
                            <button className="w-14 h-8 rounded-full bg-slate-700 relative">
                               <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white/20" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {/* Keeping other tabs simpler for now or mapping them if I can find them */}
             {activeSubTab === 'security' && (
                <PasswordSecurity isDarkMode={isDarkMode} />
             )}

             {activeSubTab === 'ai' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">AI Configuration</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-6">
                      <div>
                         <h4 className="text-white font-bold text-base mb-1">Text Generation Engine</h4>
                         <p className="text-slate-400 text-xs mb-4">Primary reasoning and lesson authoring engine. Alternative models fall back to Gemini automatically.</p>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-4 rounded-2xl border border-brand-cyan/40 bg-brand-cyan/10 flex items-start gap-3">
                               <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-black text-xs shrink-0">1</div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-white font-bold text-xs">Gemini 3.7 Flash</span>
                                     <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">Primary</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">CAPS Lesson Planning, Auto-Grading & Voice Tutor</p>
                               </div>
                            </div>
                            <div className="p-4 rounded-2xl border border-white/10 bg-navy-dark/40 flex items-start gap-3">
                               <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs shrink-0">2</div>
                               <div>
                                  <span className="text-white font-bold text-xs">NVIDIA Nemotron 49B</span>
                                  <p className="text-[10px] text-slate-400 mt-1">Llama 3.3 Nemotron Super • Fallback: Gemini</p>
                               </div>
                            </div>
                            <div className="p-4 rounded-2xl border border-white/10 bg-navy-dark/40 flex items-start gap-3">
                               <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-black text-xs shrink-0">3</div>
                               <div>
                                  <span className="text-white font-bold text-xs">NVIDIA Nemotron Ultra 550B</span>
                                  <p className="text-[10px] text-slate-400 mt-1">Nemotron 3 Ultra 550B • Fallback: Gemini</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                         <h4 className="text-white font-bold text-base mb-1">Creative Image Generator</h4>
                         <p className="text-slate-400 text-xs mb-4">Pick your preferred image engine. The selected model is tried first; the others form an automatic fallback chain so a blocked provider never leaves blank placeholders.</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { id: 'perchance', name: 'Perchance AI', tag: 'Primary', dotBg: 'bg-amber-500/20', dotText: 'text-amber-400', activeBorder: 'border-amber-500/40 bg-amber-500/10', desc: 'Fast stylised images · Pollinations / Qwen fallback' },
                              { id: 'qwen', name: 'Qwen-Image (NVIDIA NIM)', tag: 'Premium SA', dotBg: 'bg-orange-500/20', dotText: 'text-orange-400', activeBorder: 'border-orange-500/40 bg-orange-500/10', desc: 'Qwen-Image via NVIDIA NIM · SA-context, superior text rendering' },
                              { id: 'gemini-imagen', name: 'Google Imagen 3', tag: 'Secondary', dotBg: 'bg-sky-500/20', dotText: 'text-sky-400', activeBorder: 'border-sky-500/40 bg-sky-500/10', desc: 'Google Imagen / Gemini · Pollinations fallback' },
                              { id: 'pollinations', name: 'Pollinations AI', tag: 'Fallback', dotBg: 'bg-pink-500/20', dotText: 'text-pink-400', activeBorder: 'border-pink-500/40 bg-pink-500/10', desc: 'Free open-source flux/turbo models' },
                            ].map((opt: any) => {
                              const isSel = imageProvider === opt.id || (opt.id === 'qwen' && imageProvider === 'qwen-image');
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setImageProvider(opt.id)}
                                  className={`p-4 rounded-2xl border flex items-start gap-3 text-left transition-all cursor-pointer ${isSel ? opt.activeBorder : 'border-white/10 bg-[#0a1226]/60 hover:border-white/25'}`}
                                >
                                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isSel ? opt.dotBg : 'bg-white/5'} ${isSel ? opt.dotText : 'text-slate-500'}`}>
                                      {isSel ? '✓' : '○'}
                                   </div>
                                   <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                         <span className="text-white font-bold text-xs">{opt.name}</span>
                                         <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${isSel ? `${opt.dotBg} ${opt.dotText}` : 'bg-white/10 text-slate-400'}`}>{opt.tag}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                                   </div>
                                </button>
                              );
                            })}
                         </div>
                         <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                            <strong className="text-cyan-400">Qwen-Image (NVIDIA NIM)</strong> uses <code className="font-mono text-cyan-300">qwen/qwen-image</code> on NVIDIA's hosted inference endpoint and produces premium SA-context enhanced educational illustrations with better text rendering and cultural accuracy.
                         </p>
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'billing' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">Neural Link Subscription</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 flex justify-between items-center">
                      <div>
                         <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-1">Active Tier</p>
                         <p className="text-2xl font-black text-white uppercase">Premium Scholar</p>
                      </div>
                      <div className="text-right">
                         <p className="text-brand-cyan font-black text-xl">R249 / month</p>
                         <p className="text-slate-500 text-[10px] font-bold uppercase">Next billing: Oct 12, 2026</p>
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'codebase' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">Core Specifications</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-4">
                      <p className="text-slate-400 text-sm leading-relaxed">
                         EduAI Companion is a high-fidelity learning management system built with React, Vite, and Tailwind CSS. 
                         It utilizes Gemini models for advanced CAPS content generation and auto-grading.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400">Framework: React 18+</div>
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400">Styling: Tailwind CSS</div>
                      </div>
                   </div>
                </div>
             )}
          </div>
          
          <div className="p-6 border-t border-white/5 flex justify-end gap-4 bg-[#0c1024]/50 backdrop-blur-md">
             <button className="px-6 py-3 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-all">Discard</button>
             <button className="px-8 py-3 rounded-2xl bg-brand-cyan text-navy-dark font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
