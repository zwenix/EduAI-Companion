import React, { useState, useEffect } from 'react';
import { 
  Bell, Shield, Key, Moon, Sun, 
  Monitor, Save, AlertCircle, User, CreditCard, 
  Database, Activity, Lock, Mail, Phone, Globe,
  Trash2, Plus, Smartphone, Download, Palette, Link as LinkIcon
} from 'lucide-react';
import { IconSettings, IconLogout } from './LocalIcons';
import { useAi } from '../contexts/AiContext';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';
import ProfileSettings from './ProfileSettings';

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
  userRole
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
            grade: gradeLevel
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
          parentPhone: phone
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
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'ai', label: 'AI Configuration', icon: Activity },
    { id: 'pwa', label: 'App Install (PWA)', icon: Smartphone },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
    { id: 'codebase', label: 'Codebase Spec', icon: Database },
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
            <IconSettings className={cn("w-8 h-8", isDarkMode ? "text-brand-cyan" : "text-brand-cyan/80")} />
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
              <IconSettings size={18} />
              Switch User
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all">
              <IconLogout size={18} />
              Logout Session
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeSubTab === 'personal' && (
            <div className="space-y-8">
              <ProfileSettings
                fullName={fullName}
                setFullName={setFullName}
                photoUrl={photoUrl}
                setPhotoUrl={setPhotoUrl}
                gradeLevel={gradeLevel}
                setGradeLevel={setGradeLevel}
                school={school}
                setSchool={setSchool}
                jobTitle={jobTitle}
                setJobTitle={setJobTitle}
                phone={phone}
                setPhone={setPhone}
                profileEmail={profileEmail}
                setProfileEmail={setProfileEmail}
                userRole={userRole || 'teacher'}
                isDarkMode={isDarkMode}
                onSave={handleSavePersonal}
              />

              {/* Linking Child form (Parent Mode) */}
              {(userRole === 'parent' || userRole === 'Parent') && (
                <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-10", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-cyan/10 rounded-xl text-brand-cyan">
                      <LinkIcon size={20} />
                    </div>
                    <div>
                      <h4 className={cn("text-base font-bold", isDarkMode ? "text-white" : "text-slate-800")}>Link Children Dashboard Profiles</h4>
                      <p className="text-xs text-slate-500">Add child accounts to monitor performance and view dynamic CAPS reports.</p>
                    </div>
                  </div>

                  <form onSubmit={handleLinkChild} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="email" 
                      value={childEmailToLink}
                      onChange={(e) => setChildEmailToLink(e.target.value)}
                      placeholder="sibu.dube@school.za"
                      className={cn("flex-grow px-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    />
                    <button 
                      type="submit" 
                      disabled={isLinking}
                      className="px-6 py-4 bg-brand-cyan hover:bg-cyan-500 text-navy-dark rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isLinking ? "Searching..." : "Link Profile"}
                    </button>
                  </form>
                  {linkMessage && (
                    <p className={cn("text-xs font-bold mt-2", linkMessage.startsWith("Error") ? "text-rose-400" : "text-brand-cyan")}>
                      {linkMessage}
                    </p>
                  )}

                  {/* List of currently linked children */}
                  <div className="mt-6 space-y-3">
                    <h5 className={cn("text-[10px] font-black uppercase tracking-wider", isDarkMode ? "text-slate-500" : "text-slate-600")}>Linked Children Logs ({linkedChildrenList.length})</h5>
                    {linkedChildrenList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No children profiles are currently linked. Enter their school emails above to begin.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {linkedChildrenList.map(child => (
                          <div 
                            key={child.id}
                            className={cn("p-4 rounded-2xl border flex justify-between items-center", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}
                          >
                            <div>
                              <p className={cn("font-bold text-sm", isDarkMode ? "text-white" : "text-slate-800")}>{child.name}</p>
                              <p className="text-[10px] text-slate-500">{child.email} • {child.grade}</p>
                            </div>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/10">
                              Linked
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                      <option value="gemini">Gemini (Primary - Recommended)</option>
                      <option value="groq-gpt-oss">GPT OSS 120B (Groq Alternative)</option>
                      <option value="groq-qwen">Qwen3.6 27B (Groq Alternative)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Visual Fabrication Unit</label>
                    <select 
                      value={imageProvider}
                      onChange={(e) => setImageProvider(e.target.value as any)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    >
                      <option value="gemini-imagen">Google Imagen 3 (Default)</option>
                      <option value="perchance">Perchance AI (Secondary)</option>
                      <option value="pollinations">Pollinations AI (Tertiary)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">OCR / Vision Processor</label>
                    <select 
                      value={ocrProvider}
                      onChange={(e) => setOcrProvider(e.target.value as any)}
                      className={cn("w-full px-5 py-4 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-cyan", isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                    >
                      <option value="gemini">Gemini Flash (Vision)</option>
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
                      <option value="groq-whisper">Groq Whisper (whisper-large-v3-turbo - Default)</option>
                      <option value="browser">Browser Core HD (Free)</option>
                      <option value="google-tts">Google TTS (Free)</option>
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

          {activeSubTab === 'accessibility' && (
             <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-8", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm")}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-cyan-500/10 rounded-2xl text-brand-cyan animate-pulse">
                    <Palette size={24} />
                  </div>
                  <div>
                    <h2 className={cn("text-2xl font-bold font-hand", isDarkMode ? "text-white" : "text-slate-900")}>Child Accessibility Settings</h2>
                    <p className="text-sm text-slate-500">Enable features to enhance reading, focus, and interaction comfort.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Dyslexia-Friendly Mode */}
                  <div className={cn("p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-transform", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200")}>
                    <div className="space-y-1">
                      <p className={cn("font-bold text-base", isDarkMode ? "text-white" : "text-slate-900")}>📖 Dyslexia-Friendly Font & Spacing</p>
                      <p className="text-xs text-slate-500 max-w-lg">
                        Converts all system typography into high-contrast sans-serif format with enlarged character tracking and loose word gaps. Perfect for developing readers.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const newVal = !dyslexiaTheme;
                        setDyslexiaTheme(newVal);
                        localStorage.setItem('eduai_dyslexia', String(newVal));
                        window.dispatchEvent(new Event('eduai_accessibility_change'));
                      }}
                      className={cn(
                        "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest cursor-pointer border transition-all active:scale-95 duration-200",
                        dyslexiaTheme 
                          ? "bg-brand-cyan text-slate-950 border-brand-cyan shadow-lg shadow-cyan-500/20" 
                          : (isDarkMode ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100")
                      )}
                    >
                      {dyslexiaTheme ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  {/* Dyscalculia Assist */}
                  <div className={cn("p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-transform", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200")}>
                    <div className="space-y-1">
                      <p className={cn("font-bold text-base", isDarkMode ? "text-white" : "text-slate-900")}>🔢 Dyscalculia Multi-Colored Numbers</p>
                      <p className="text-xs text-slate-500 max-w-lg">
                        Wraps critical numbers and math outputs into rainbow color tags to suppress numerical anxiety and improve segment calculations.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const newVal = !dyscalculiaHelp;
                        setDyscalculiaHelp(newVal);
                        localStorage.setItem('eduai_dyscalculia', String(newVal));
                        window.dispatchEvent(new Event('eduai_accessibility_change'));
                      }}
                      className={cn(
                        "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest cursor-pointer border transition-all active:scale-95 duration-200",
                        dyscalculiaHelp 
                          ? "bg-brand-cyan text-slate-950 border-brand-cyan shadow-lg shadow-cyan-500/20" 
                          : (isDarkMode ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100")
                      )}
                    >
                      {dyscalculiaHelp ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  {/* Speech Reading Velocity */}
                  <div className={cn("p-6 rounded-3xl border space-y-4", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200")}>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className={cn("font-bold text-base", isDarkMode ? "text-white" : "text-slate-900")}>🗣️ TTS Voice Read-Aloud Speed</p>
                        <p className="text-xs text-slate-500">
                          Controls the pronunciation reading speed of the live AI TTS tutor voice for simpler comprehension.
                        </p>
                      </div>
                      <span className="font-mono text-xs font-black text-brand-cyan bg-brand-cyan/10 px-3 py-1.5 rounded-xl border border-brand-cyan/25">
                        {readSpeed.toFixed(1)}x Velocity
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1.8" 
                      step="0.1" 
                      value={readSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setReadSpeed(val);
                        localStorage.setItem('eduai_read_speed', String(val));
                        window.dispatchEvent(new Event('eduai_accessibility_change'));
                      }}
                      className="w-full accent-brand-cyan cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>🐢 Super Slow (0.5x)</span>
                      <span>Ordinary (1.0x)</span>
                      <span>🐆 Fast (1.8x)</span>
                    </div>
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

          {activeSubTab === 'codebase' && (
             <div className={cn("rounded-[48px] p-8 lg:p-12 space-y-8", isDarkMode ? "glass" : "bg-white border border-slate-200 shadow-sm animate-pop-in")}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-cyan/10 rounded-2xl text-brand-cyan">
                         <Database size={24} />
                      </div>
                      <div>
                        <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Codebase Specifications</h2>
                        <p className="text-sm text-slate-500">Core architectural maps, key files, and pedagogical goals.</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 text-brand-cyan rounded-full text-[10px] font-black tracking-widest uppercase border border-brand-cyan/20">
                     Active Repository
                   </div>
                </div>

                {/* Purpose section */}
                <div className={cn("p-6 md:p-8 rounded-[36px] border space-y-3", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200")}>
                  <h3 className={cn("text-lg font-bold flex items-center gap-2", isDarkMode ? "text-white" : "text-slate-900")}>
                    🚀 Core Platform Purpose
                  </h3>
                  <p className={cn("text-sm leading-relaxed", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    <strong className="text-brand-cyan font-bold">EduAI Companion</strong> is an intelligent, CAPS-aligned educational workspace engineered specifically for personalized learning plans, lesson generation, auto-grading, and AI tutoring.
                    It aligns directly with South African school calendars, WCED ATP guidelines, and Bloom's Taxonomy, providing complete, rich, non-truncated content for educators, learners, parents, and system administrators.
                  </p>
                </div>

                {/* Critical Files section */}
                <div className="space-y-4">
                  <h3 className={cn("text-lg font-bold px-2", isDarkMode ? "text-white" : "text-slate-900")}>
                    📂 Critical Codebase Components
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "server.ts",
                        desc: "Backend entry point. Manages API routes, serving Vite development assets, registering OmniHuman-1 Gradio streaming, and proxying Groq models.",
                        badge: "CJS/ESM Bundle",
                        color: "from-brand-cyan/15 to-transparent border-brand-cyan/20"
                      },
                      {
                        title: "src/App.tsx",
                        desc: "Core routing controller. Governs role workflows (Teacher, Student, Parent, Admin), visual themes, navigation drawers, and state.",
                        badge: "Main Interface",
                        color: "from-brand-pink/15 to-transparent border-brand-pink/20"
                      },
                      {
                        title: "src/components/ContentCreator.tsx",
                        desc: "Generates high-fidelity CAPS lesson plans, diagnostic worksheets, study notes, structured exams, rubrics, and educational posters.",
                        badge: "Authoring",
                        color: "from-brand-yellow/15 to-transparent border-brand-yellow/20"
                      },
                      {
                        title: "src/components/AutoGrading.tsx",
                        desc: "Processes submitted worksheets, applying optical character recognition and scoring criteria from standard diagnostic rubrics.",
                        badge: "OCR Grading",
                        color: "from-brand-green/15 to-transparent border-brand-green/20"
                      },
                      {
                        title: "src/services/unifiedAiService.ts",
                        desc: "Core dispatcher for AI OCR and grading completions. Maps models directly, enforcing CAPS-aligned prompt constraints.",
                        badge: "Proxy Service",
                        color: "from-brand-purple/15 to-transparent border-brand-purple/20"
                      },
                      {
                        title: "/AGENTS.md",
                        desc: "Enforces strict project rules, model mapping identifiers (such as openai/gpt-oss-120b), and formatting criteria.",
                        badge: "System Rules",
                        color: "from-slate-500/10 to-transparent border-slate-500/20"
                      }
                    ].map((file, i) => (
                      <div key={i} className={cn("p-5 rounded-3xl border bg-gradient-to-br flex flex-col justify-between gap-3", file.color)}>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className={cn("font-mono font-bold text-sm", isDarkMode ? "text-white" : "text-slate-900")}>{file.title}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{file.badge}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{file.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Goals section */}
                <div className="space-y-4">
                  <h3 className={cn("text-lg font-bold px-2", isDarkMode ? "text-white" : "text-slate-900")}>
                    🎯 Curricular & Technical Goals
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        title: "100% CAPS Alignment",
                        desc: "Guarantees complete coverage of WCED subject time limits, term structures (1-4), ATP directives, and Bloom's cognitive taxonomy depths.",
                        icon: "🇿🇦"
                      },
                      {
                        title: "Accessibility Assists",
                        desc: "Enhances student outcomes using active Dyslexia reader mode styling, Dyscalculia rainbow number tagging, and vocal TTS narration speeds.",
                        icon: "🎨"
                      },
                      {
                        title: "Resilient Execution",
                        desc: "Utilizes robust HTML-tag repair parsers and fail-safe local video libraries to maintain perfect operation during latency or queue delays.",
                        icon: "⚡"
                      }
                    ].map((goal, i) => (
                      <div key={i} className={cn("p-6 rounded-3xl border flex flex-col gap-3", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200")}>
                        <div className="text-2xl">{goal.icon}</div>
                        <div>
                          <h4 className={cn("font-bold text-sm mb-1", isDarkMode ? "text-white" : "text-slate-900")}>{goal.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{goal.desc}</p>
                        </div>
                      </div>
                    ))}
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

