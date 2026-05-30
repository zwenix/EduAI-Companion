/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  Mic, 
  Plus, 
  Scan, 
  Settings, 
  Users,
  Search,
  Bell,
  ChevronRight,
  ClipboardCheck,
  TrendingUp,
  FileBarChart,
  Brain,
  Send,
  Moon,
  Sun,
  Layout,
  Library,
  Video,
  FileCode,
  Compass,
  HelpCircle,
  Archive,
  UserCircle,
  Image,
  FlaskConical,
  Palette,
  Sparkles,
  Menu,
  X,
  Zap,
  School,
  Home,
  ArrowLeft,
  LogOut,
  RefreshCcw,
  UserCheck,
  Cloud,
  CloudDownload,
  Wifi,
  Check,
  Smartphone,
  Download,
  Accessibility,
  Eye,
  Contrast,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { marked } from 'marked';
import ContentCreator from './components/ContentCreator';
import Messenger from './components/Messenger';
import ProgressReports from './components/ProgressReports';
import AutoGrading from './components/AutoGrading';
import ContentArchive from './components/ContentArchive';
import AITutorPage from './components/AITutorPage';
import ClassManagement from './components/ClassManagement';
import { SplashScreen } from './components/SplashScreen';
import RoleSelection from './components/RoleSelection';
import LoginPage from './components/LoginPage';
import Logo from './components/Logo';
import NotificationsDropdown from './components/NotificationsDropdown';
import StudentPractice from './components/StudentPractice';
import StudentNotes from './components/StudentNotes';
import StudentDashboard from './components/StudentDashboard';
import StudentPortfolio from './components/StudentPortfolio';
import CurriculumSuite from './components/CurriculumSuite';
import ParentDashboard from './components/ParentDashboard';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/Settings';
import Helpdesk from './components/Helpdesk';
import CategoryOverview from './components/CategoryOverview';
import { auth, db } from './lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, isDarkMode }: { icon: any, label: string, active?: boolean, onClick: () => void, collapsed: boolean, isDarkMode?: boolean }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`flex items-center w-full gap-3 px-4 py-3 rounded-[20px] transition-all duration-300 text-sm font-bold group ${
      active 
      ? `bg-brand-cyan text-white shadow-lg shadow-cyan-500/30 scale-[1.02]` 
      : `${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'} border border-transparent hover:scale-100`
    } ${collapsed ? 'justify-center !px-0' : 'justify-start'}`}
  >
    <Icon size={22} className={`${active ? 'text-white' : `group-hover:${isDarkMode ? 'text-white' : 'text-slate-900'}`} transition-colors shrink-0 ${active && 'animate-bounce'}`} style={{ animationDuration: '2s' }} />
    <AnimatePresence>
      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="truncate whitespace-nowrap overflow-hidden text-left font-sans"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);

const LandingPage = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00d2ff] via-[#3a7bd5] to-[#8e44ad] relative overflow-hidden flex flex-col font-sans animate-fadeInZoom">
      {/* Subtle Star Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Sparkles className="absolute top-20 left-10 text-white/30 w-10 h-10 animate-float" style={{ animationDelay: '0s' }} />
        <Sparkles className="absolute top-40 right-20 text-white/30 w-14 h-14 animate-float" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute bottom-1/3 left-1/4 text-white/20 w-8 h-8 animate-float" style={{ animationDelay: '2s' }} />
        <Sparkles className="absolute top-1/2 right-1/4 text-white/20 w-12 h-12 animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", type: "spring", stiffness: 120 }}
        className="h-24 px-6 lg:px-12 flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-[30px] border border-white/30 kid-shadow">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-display font-bold tracking-wide text-white">
            EduAI <span className="text-brand-yellow">Companion</span>
          </span>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
          <button onClick={onEnter} className="hidden sm:block text-white font-bold hover:text-brand-yellow transition-colors font-display text-lg">
            Sign In
          </button>
          <button 
            onClick={onEnter}
            className="bg-brand-yellow hover:bg-[#ffdf40] text-slate-800 px-8 py-3 rounded-[30px] font-display font-bold text-lg transition-all kid-shadow-hover active:scale-95 border-2 border-[#fdbb2d]/50"
          >
            Get Started!
          </button>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 pt-10 pb-20 relative z-10 flex flex-col lg:flex-row items-center gap-12">
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="flex-1 text-center lg:text-left"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/40 px-5 py-2.5 rounded-full mb-6 text-sm font-bold text-white kid-shadow uppercase tracking-wider"
          >
             <Sparkles size={18} className="text-brand-yellow" /> 
             The Smartest Way to Learn!
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[1.1] drop-shadow-lg font-display"
          >
            Learning is an <br />
            <span className="text-brand-yellow relative inline-block drop-shadow-md">
              Adventure!
              <motion.svg 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                className="absolute -bottom-2 lg:-bottom-4 left-0 w-full h-4 lg:h-6 text-brand-yellow drop-shadow-md" 
                viewBox="0 0 200 20" 
                preserveAspectRatio="none"
              >
                <path d="M0,10 Q25,20 50,10 T100,10 T150,10 T200,10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </motion.svg>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-xl lg:text-2xl text-blue-50/90 mb-10 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed drop-shadow-sm font-sans"
          >
            Magic lesson plans, super homework help, and your very own AI robot tutor! 🚀
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto bg-brand-yellow hover:bg-[#ffdf40] text-slate-800 px-10 py-5 rounded-[36px] font-display font-black text-xl transition-all kid-shadow-hover active:scale-95 flex items-center justify-center gap-3 border-4 border-white/20"
            >
              Start My Adventure <ChevronRight strokeWidth={4} />
            </button>
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-4 border-white/40 text-white px-10 py-5 rounded-[36px] font-display font-bold text-xl transition-all backdrop-blur-md flex items-center justify-center kid-shadow-hover"
            >
              Log In
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Image / Illustration Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="flex-1 relative w-full max-w-lg lg:max-w-none"
        >
          <div className="relative rounded-[48px] overflow-hidden shadow-2xl kid-shadow border-8 border-white/20 aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-white/10 backdrop-blur-sm animate-float">
             <img 
               src="https://i.ibb.co/CsvbkGYG/landing-image.jpg" 
               alt="Classroom adventure" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#3a7bd5]/60 to-transparent pointer-events-none" />
          </div>
          
          {/* Floating Badge */}
          <motion.div 
            animate={{ y: [-15, 15, -15], rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute -bottom-8 -right-8 lg:bottom-4 lg:-right-8 w-36 h-36 lg:w-44 lg:h-44 bg-brand-pink rounded-full shadow-2xl flex items-center justify-center border-8 border-white z-20 kid-shadow"
          >
            <p className="text-white font-display font-black text-center text-lg lg:text-xl leading-tight">
              100% Fun <br/> <span className="text-2xl lg:text-3xl">🎉</span>
            </p>
          </motion.div>

          {/* Second Floating Badge */}
          <motion.div 
            animate={{ y: [15, -15, 15], rotate: [5, -5, 5] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 lg:top-10 lg:-left-10 w-24 h-24 lg:w-28 lg:h-28 bg-brand-cyan rounded-full shadow-2xl flex items-center justify-center border-6 border-white z-20 kid-shadow"
          >
            <p className="text-white font-display font-black text-center text-3xl lg:text-4xl">
              🚀
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-md font-display">Your Super Powers! 🦸‍♂️</h2>
          <p className="text-xl text-blue-100 font-bold max-w-2xl mx-auto drop-shadow-sm">Everything you need to be a top student or a master teacher, all powered by magic AI.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Magic Lessons", desc: "Create amazing lesson plans in a flash! Perfect for any subject.", icon: Zap, bg: "bg-orange-500", shadow: "shadow-orange-500/40" },
            { title: "Super Worksheets", desc: "Fun worksheets and exercises that you'll actually love doing!", icon: Palette, bg: "bg-brand-pink", shadow: "shadow-pink-500/40" },
            { title: "Smart Bot Tutor", desc: "Ask your friendly AI tutor anything, anytime! It never sleeps.", icon: Brain, bg: "bg-brand-cyan", shadow: "shadow-cyan-500/40" },
            { title: "Instant Grades", desc: "Get your results and helpful tips right away. No more waiting!", icon: Sparkles, bg: "bg-brand-yellow", shadow: "shadow-yellow-500/40" },
            { title: "Skill Tracker", desc: "Watch your skills grow like a rocket ship! reach for the stars.", icon: TrendingUp, bg: "bg-brand-green", shadow: "shadow-green-500/40" },
            { title: "Cool Posters", desc: "Make beautiful posters for your room or classroom.", icon: Image, bg: "bg-brand-purple", shadow: "shadow-purple-500/40" },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              className="bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-[40px] p-8 text-center hover:bg-white/30 transition-all kid-shadow-hover transform hover:-translate-y-2 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-150`}></div>
              <div className={`w-20 h-20 mx-auto rounded-[28px] flex items-center justify-center mb-6 ${feature.bg} text-white shadow-xl ${feature.shadow} border-4 border-white/20 rotate-3 group-hover:rotate-0 transition-all`}>
                <feature.icon size={40} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 font-display">{feature.title}</h3>
              <p className="text-base text-blue-50 leading-relaxed font-bold">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <footer className="mt-auto px-6 lg:px-12 py-8 bg-black/20 border-t border-white/10 text-center lg:text-left flex flex-col lg:flex-row justify-between items-center gap-4 text-sm font-bold text-white/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 opacity-80" />
          <span className="font-display text-lg">EduAI <span className="text-brand-yellow">Companion</span></span>
        </div>
        <p>© 2026 EduAI Companion. Built with 💖</p>
      </footer>
    </div>
  );
};

import { useAi, AIProvider as AIProviderType } from './contexts/AiContext';

export default function App() {
  const { provider, setProvider, ttsProvider, setTtsProvider, ocrProvider, setOcrProvider, imageProvider, setImageProvider } = useAi();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previousTabs, setPreviousTabs] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('teacher-dashboard-menu');
  const [categoryOverviewActive, setCategoryOverviewActive] = useState<string | null>(null);
  const [categoryActiveSubTab, setCategoryActiveSubTab] = useState<Record<string, string>>({
    'teacher-dashboard-menu': 'dashboard',
    'lesson-planning': 'teaching',
    'intelligence-ai': 'ai-tutor',
    'class-analytics': 'reports',
    'class-management': 'class-management',
    'student-class-management': 'messenger',
    'system-support': 'settings'
  });
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [dyslexiaEnabled, setDyslexiaEnabled] = useState(() => localStorage.getItem('eduai_dyslexia') === 'true');
  const [magnifyEnabled, setMagnifyEnabled] = useState(() => localStorage.getItem('eduai_magnify') === 'true');
  const [highContrastEnabled, setHighContrastEnabled] = useState(() => localStorage.getItem('eduai_high_contrast') === 'true');
  const [soundMuted, setSoundMuted] = useState(() => localStorage.getItem('eduai_sound_muted') === 'true');

  const speakText = (text: string) => {
    if (localStorage.getItem('eduai_sound_muted') === 'true') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (!text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Dialog States
  const [activeCreatorTab, setActiveCreatorTab] = useState<string | null>(null);

  // --- Offline Sync States for Student Materials & Notes ---
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'error'>(() => {
    return (localStorage.getItem('eduai_sync_status') as any) || 'pending';
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('eduai_last_synced') || 'Never';
  });
  const [syncProgress, setSyncProgress] = useState(0);
  const [isOfflineViewerOpen, setIsOfflineViewerOpen] = useState(false);
  const [selectedOfflineMaterial, setSelectedOfflineMaterial] = useState<any>(null);
  const [offlineSearchQuery, setOfflineSearchQuery] = useState('');
  const [offlineMaterials, setOfflineMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (isOfflineViewerOpen) {
      import('./lib/offlineDB').then(({ getStudyNotes }) => {
        getStudyNotes().then(setOfflineMaterials).catch(console.error);
      });
    }
  }, [isOfflineViewerOpen]);

  useEffect(() => {
    const onTriggerEdit = (e: any) => {
      const { tab } = e.detail || {};
      if (tab) {
        setActiveCreatorTab(tab);
      }
    };
    window.addEventListener('trigger-edit-content', onTriggerEdit);
    return () => window.removeEventListener('trigger-edit-content', onTriggerEdit);
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstallable, setIsAppInstallable] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [pwaBannerDismissed, setPwaBannerDismissed] = useState(() => {
    return localStorage.getItem('eduai_pwa_banner_dismissed') === 'true';
  });
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'error' }>({ show: false, message: '', type: 'info' });

  const installPWAApp = async () => {
    if (!deferredPrompt) {
      triggerToast("Install prompt is not ready yet. Try using your native browser menu to 'Install' or 'Add to Home Screen'.", "info");
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User choice outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setIsAppInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Failed to prompt PWA installation: ", err);
    }
  };

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setSyncToast({ show: true, message, type });
    setTimeout(() => {
      setSyncToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleOfflineSync = async () => {
    setSyncStatus('syncing');
    setSyncProgress(10);
    triggerToast("Initiating secure offline sync...", "info");
    
    // Smooth progress simulation
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.floor(Math.random() * 15) + 8;
      });
    }, 150);

    try {
      const { collection, getDocs, query, limit } = await import('firebase/firestore');
      
      let fetchedItems: any[] = [];
      try {
        const q = query(collection(db, 'created_content'), limit(15));
        const snapshot = await getDocs(q);
        fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Untitled Lesson',
          subject: doc.data().subject || 'General Study',
          grade: doc.data().grade || '10',
          contentType: doc.data().contentType || 'Lesson Plan',
          content: doc.data().content || '',
          createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }));
      } catch (dbErr) {
        console.warn("Could not retrieve classroom contents from FireStore, using secure local fallback", dbErr);
      }

      // Pre-designed high quality CAPS aligned curriculum materials to guarantee offline availability
      const curriculumBackups = [
        {
          id: 'sys-1',
          title: 'Caps Mastery: Core Algebra & Functions',
          subject: 'Mathematics',
          grade: '10',
          contentType: 'Study Notes',
          content: `# CAPS Mathematics - Grade 10: Algebraic Expressions\n\n## 1. Core Objectives\n- Understand operations on polynomials.\n- Learn key factorization schemes: Difference of Two Squares, Trinomials, Grouping.\n- Simplify algebraic fractions with binomial denominators.\n\n## 2. Factorization Guide\n### Difference of Two Squares\n$$a^2 - b^2 = (a-b)(a+b)$$\n\n### Trinomial Factorization\nTo factor $x^2 + bx + c$, locate two numbers that multiply to $c$ and sum to $b$.\n\n*Review exercises in Practice tab to consolidate!*`,
          createdAt: new Date().toISOString()
        },
        {
          id: 'sys-2',
          title: 'Mechanics: Forces & Newton\'s Laws',
          subject: 'Physical Sciences',
          grade: '10',
          contentType: 'Revision Guide',
          content: `# CAPS Physical Sciences - Grade 10: Mechanics\n\n## 1. Newton's First Law (Inertia)\nAn object continues in a state of rest or uniform velocity unless acted upon by a non-zero net force.\n\n## 2. Draw Vector Forces\n- Gravity ($F_g$): Downward pull of the earth.\n- Normal Force ($F_N$): Upward support force perpendicular to surface.\n- Friction ($F_f$): Resistant force counteracting slide motion.`,
          createdAt: new Date().toISOString()
        },
        {
          id: 'sys-3',
          title: 'Cell Biology: Organic Molecules',
          subject: 'Life Sciences',
          grade: '10',
          contentType: 'Study Notes',
          content: `# CAPS Life Sciences - Grade 10: Cells & Molecules\n\n## 1. Organic vs Inorganic Compounds\n- **Inorganic compounds:** Water, mineral salts (do not contain carbon bonded to hydrogen).\n- **Organic compounds:** Carbohydrates, Lipids, Proteins, Nucleic Acids (contain high energy C-H bonds).\n\n## 2. Importance of Water\n- Key universal solvent for metabolic chemical reactions.\n- Formulates medium for transport of digested nutrients.`,
          createdAt: new Date().toISOString()
        }
      ];

      const { saveStudyNote, clearStudyNotes } = await import('./lib/offlineDB');
      await clearStudyNotes();
      
      const finalCache = [...fetchedItems, ...curriculumBackups];
      for (const item of finalCache) {
        await saveStudyNote(item);
      }
      localStorage.setItem('eduai_cached_materials_status', 'idb_migrated');

      
      clearInterval(interval);
      setSyncProgress(100);
      
      const timeStamp = new Date().toLocaleString('en-ZA', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      setTimeout(() => {
        setSyncStatus('synced');
        setLastSyncedTime(timeStamp);
        localStorage.setItem('eduai_sync_status', 'synced');
        localStorage.setItem('eduai_last_synced', timeStamp);
        triggerToast("Sync successful! Lessons cached for offline use.", "success");
      }, 500);

    } catch (err: any) {
      console.error("Offline sync critical failure:", err);
      clearInterval(interval);
      setSyncStatus('error');
      localStorage.setItem('eduai_sync_status', 'error');
      triggerToast("Sync failed. Check connection & try again.", "error");
    }
  };



  const changeTab = (newTab: string) => {
    setPreviousTabs(prev => [...prev, activeTab]);
    setActiveTab(newTab);
    setActiveCreatorTab(null);
    setCategoryOverviewActive(null);
  };

  const goBack = () => {
    setActiveCreatorTab(null);
    setCategoryOverviewActive(null);
    if (previousTabs.length > 0) {
      const newHistory = [...previousTabs];
      const prev = newHistory.pop();
      setPreviousTabs(newHistory);
      if (prev) setActiveTab(prev);
    } else {
      setActiveTab('dashboard');
    }
  };

  const getSidebarCategories = (role: string | null) => {
    const r = role || 'teacher';
    let firstLabel = 'Teacher Dashboard';
    if (r === 'student') firstLabel = 'Student Dashboard';
    else if (r === 'parent') firstLabel = 'Parent Dashboard';
    else if (r === 'admin') firstLabel = 'Admin Dashboard';
    
    return [
      { id: 'teacher-dashboard-menu', label: firstLabel, icon: LayoutDashboard },
      { id: 'lesson-planning', label: 'Lesson planning', icon: BookOpen },
      { id: 'intelligence-ai', label: 'Intelligence AI', icon: Brain },
      { id: 'class-analytics', label: 'Analytics & Reports', icon: TrendingUp },
      { id: 'class-management', label: 'Class management', icon: School },
      { id: 'student-class-management', label: 'Chat & Messenger', icon: MessageSquare },
      { id: 'system-support', label: 'System support', icon: Settings },
    ];
  };

  const sidebarCategories = getSidebarCategories(userRole);

  const getSubTabsForCategory = (catId: string, role: string | null) => {
    const r = role || 'teacher';
    if (r === 'student') {
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard }
          ];
        case 'lesson-planning':
          return [
            { id: 'student-notes', label: 'Study & Revision Notes', icon: BookOpen }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI Tutor Helpers', icon: Brain }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'My Progress Analytics', icon: TrendingUp },
            { id: 'portfolios', label: 'My Portfolio', icon: UserCircle },
            { id: 'curriculum', label: 'CAPS & Gamification Hub', icon: Compass }
          ];
        case 'class-management':
          return [
            { id: 'dashboard', label: 'Class Overview', icon: Users }
          ];
        case 'student-class-management':
          return [
            { id: 'student-practice', label: 'Practice Zone', icon: ClipboardCheck },
            { id: 'messenger', label: 'Chat & Friends', icon: MessageSquare }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'helpdesk', label: 'Help', icon: HelpCircle },
            { id: 'faq', label: 'Support', icon: Accessibility }
          ];
        default:
          return [];
      }
    } else if (r === 'parent') {
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Parent Dashboard Hub', icon: LayoutDashboard }
          ];
        case 'lesson-planning':
          return [];
        case 'intelligence-ai':
          return [
            { id: 'dashboard', label: 'AI Classroom Updates', icon: Brain }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: "My Child's Progress", icon: TrendingUp },
            { id: 'portfolios', label: 'Assignments & Portfolios', icon: FileText }
          ];
        case 'class-management':
          return [
            { id: 'dashboard', label: 'Class Overview', icon: Users }
          ];
        case 'student-class-management':
          return [
            { id: 'messenger', label: 'Teacher Chat & Contacts', icon: MessageSquare }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'helpdesk', label: 'Help', icon: HelpCircle },
            { id: 'faq', label: 'Support', icon: Accessibility }
          ];
        default:
          return [];
      }
    } else if (r === 'admin') {
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Admin Dashboard Hub', icon: LayoutDashboard }
          ];
        case 'lesson-planning':
          return [
            { id: 'archive', label: 'Database Content Archive', icon: Archive }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI System Controls', icon: Brain },
            { id: 'ocr', label: 'OCR Grading Logs', icon: Scan }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'School Analytics & Stats', icon: TrendingUp }
          ];
        case 'class-management':
          return [
            { id: 'class-management', label: 'Classrooms Manager', icon: School }
          ];
        case 'student-class-management':
          return [
            { id: 'dashboard', label: 'Students Overview', icon: UserCircle }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'helpdesk', label: 'Help', icon: HelpCircle },
            { id: 'faq', label: 'Support', icon: Accessibility }
          ];
        default:
          return [];
      }
    } else {
      // Default: Teacher
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard }
          ];
        case 'lesson-planning':
          return [
            { id: 'teaching', label: 'Content Creator Studio', icon: FlaskConical },
            { id: 'archive', label: 'Content Archive Storage', icon: Archive }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI Tutor Support', icon: Brain },
            { id: 'ocr', label: 'Scan & Autograde', icon: Scan }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'Progress Reports', icon: TrendingUp },
            { id: 'portfolios', label: 'Learner Personal Portfolios', icon: UserCircle },
            { id: 'curriculum', label: 'CAPS & Gamification Hub', icon: Compass }
          ];
        case 'class-management':
          return [
            { id: 'class-management', label: 'Class Management', icon: School }
          ];
        case 'student-class-management':
          return [
            { id: 'messenger', label: 'Communicator Hub Chat', icon: MessageSquare }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'helpdesk', label: 'Help', icon: HelpCircle },
            { id: 'faq', label: 'Support', icon: Accessibility }
          ];
        default:
          return [];
      }
    }
  };

  const getCategoryForTab = (tabId: string, role: string | null) => {
    const list = [
      'teacher-dashboard-menu',
      'lesson-planning',
      'intelligence-ai',
      'class-analytics',
      'class-management',
      'student-class-management',
      'system-support'
    ];
    for (const cat of list) {
      const tabs = getSubTabsForCategory(cat, role);
      if (tabs.some(t => t.id === tabId)) {
        return cat;
      }
    }
    return 'teacher-dashboard-menu';
  };

  useEffect(() => {
    const cat = getCategoryForTab(activeTab, userRole);
    setActiveCategory(cat);
    setCategoryActiveSubTab(prev => ({
      ...prev,
      [cat]: activeTab
    }));
  }, [activeTab, userRole]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDashboard(false);
      setShowLogin(false);
      setUserRole(null);
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  useEffect(() => {
    // Check if running in standalone display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsAlreadyInstalled(!!isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsAppInstallable(true);
      console.log('Beforeinstallprompt event triggered and captured');
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsAppInstallable(false);
      setIsAlreadyInstalled(true);
      console.log('PWA app was installed successfully');
      triggerToast("EduAI Companion installed on your device successfully! 🎉", "success");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Synchronize accessibility options across the app viewport
  useEffect(() => {
    const syncAccessibility = () => {
      const dActive = localStorage.getItem('eduai_dyslexia') === 'true';
      if (dActive) {
        document.body.classList.add('dyslexia-font-active');
      } else {
        document.body.classList.remove('dyslexia-font-active');
      }

      const mActive = localStorage.getItem('eduai_magnify') === 'true';
      if (mActive) {
        document.body.classList.add('magnify-text-active');
      } else {
        document.body.classList.remove('magnify-text-active');
      }

      const hActive = localStorage.getItem('eduai_high_contrast') === 'true';
      if (hActive) {
        document.body.classList.add('high-contrast-active');
      } else {
        document.body.classList.remove('high-contrast-active');
      }
    };
    syncAccessibility();
    window.addEventListener('eduai_accessibility_change', syncAccessibility);
    return () => window.removeEventListener('eduai_accessibility_change', syncAccessibility);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      // Removed else branch to preserve user preference or default to false on desktop
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Check if user has an active authenticated session
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserRole(data.role || 'teacher');
            setShowDashboard(true);
            setShowLogin(false);
          } else {
            // Logged in but needs role setup
            setNeedsRoleSetup(true);
            setShowDashboard(true);
            setShowLogin(false);
          }
        } catch (err) {
          console.error("Error fetching user role on startup:", err);
          // If Firestore is offline or setup is failing, fall back to showing dashboard
          setShowDashboard(true);
        }
      } else {
        // Not logged in or logged out
        setShowDashboard(false);
        setUserRole(null);
      }
    });

    const timer = setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (isRefreshing) {
    return <SplashScreen />;
  }

  if (!showDashboard && !showLogin) {
    return <LandingPage onEnter={() => {
      setShowLogin(true);
    }} />;
  }

  if (showLogin) {
    return <LoginPage 
      onSuccess={() => {
        const user = auth.currentUser;
        if (user) {
          // If they successfully logged in and have a role, the onAuthStateChanged will route them.
          // Otherwise, we trigger role selection.
          getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
            if (docSnap.exists()) {
              setUserRole(docSnap.data().role || 'teacher');
              setNeedsRoleSetup(false);
              setShowDashboard(true);
              setShowLogin(false);
            } else {
              setNeedsRoleSetup(true);
              setShowDashboard(true);
              setShowLogin(false);
            }
          }).catch(() => {
            setNeedsRoleSetup(true);
            setShowDashboard(true);
            setShowLogin(false);
          });
        }
      }}
      onSignUpClick={() => {
        // Successful signup, trigger role setup
        setShowLogin(false);
        setNeedsRoleSetup(true);
        setShowDashboard(true);
      }}
    />;
  }

  if (needsRoleSetup) {
    return <RoleSelection 
      onComplete={async (role) => {
        setUserRole(role);
        setNeedsRoleSetup(false);
        const user = auth.currentUser;
        if (user) {
          try {
            await setDoc(doc(db, 'users', user.uid), {
              role: role,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (err) {
            console.error("Error updating role in users collection:", err);
          }
        }
      }}
      onBack={() => {
        setShowDashboard(false);
        setNeedsRoleSetup(false);
      }}
    />;
  }

  return (
    <MotionConfig reducedMotion={soundMuted ? "always" : "user"}>
      <div className={`flex h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-slate-50'} font-sans selection:bg-brand-cyan/30 overflow-hidden transition-colors duration-500`}>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? 280 : (isSidebarOpen ? 280 : 80),
          x: isMobile ? (isMobileSidebarOpen ? 0 : -280) : 0
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={`${isDarkMode ? 'bg-[#0B1122]' : 'bg-white shadow-xl'} border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200'} h-full flex flex-col py-6 px-3 lg:px-4 fixed lg:relative shrink-0 z-[60] lg:z-40 overflow-hidden`}
      >
        <div className={`flex items-center justify-between mb-10 min-w-0 ${isSidebarOpen || isMobile ? 'px-2' : ''}`}>
          <div className="flex items-center gap-3">
            <Logo />
            <AnimatePresence>
              {(isSidebarOpen || isMobile) && (
                <motion.h1 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className={`font-hand text-2xl tracking-widest whitespace-nowrap overflow-hidden ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  EduAI Companion
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
          {isMobile && (
            <button onClick={() => setMobileSidebarOpen(false)} className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}>
              <X size={24} />
            </button>
          )}
        </div>

        <nav className="flex-1 min-h-0 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
          {sidebarCategories.map((cat) => {
            const collapsed = !isSidebarOpen && !isMobile;
            const active = activeCategory === cat.id;

            return (
              <SidebarItem 
                key={cat.id}
                icon={cat.icon} 
                label={cat.label} 
                active={active} 
                isDarkMode={isDarkMode}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const subTabs = getSubTabsForCategory(cat.id, userRole);
                  if (subTabs.length <= 1 || cat.id === 'teacher-dashboard-menu') {
                    setCategoryOverviewActive(null);
                    if (subTabs.length > 0) {
                      const targetSubTab = subTabs[0].id;
                      if (targetSubTab === 'teaching') {
                        setActiveCreatorTab('teaching');
                        setActiveTab('teaching');
                      } else {
                        changeTab(targetSubTab);
                      }
                    }
                  } else {
                    setCategoryOverviewActive(cat.id);
                  }
                  if (isMobile) setMobileSidebarOpen(false);
                }} 
                collapsed={collapsed}
              />
            );
          })}
        </nav>

        {/* PWA Install Promo */}
        {isAppInstallable && (
          <div className="px-3 py-2 shrink-0 flex justify-center">
            {(!isSidebarOpen && !isMobile) ? (
              <button
                onClick={installPWAApp}
                title="Install EduAI Companion Offline App"
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-brand-cyan to-indigo-500 hover:scale-110 active:scale-90 shadow-md shadow-brand-cyan/20 transition-all cursor-pointer border-0 outline-none text-white"
              >
                <Smartphone size={16} className="animate-pulse" />
              </button>
            ) : (
              <button
                onClick={installPWAApp}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2.5xl font-display font-black text-[10px] tracking-wider shadow-md shadow-brand-cyan/15 transform hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r from-brand-cyan to-indigo-500 hover:to-indigo-600 text-white cursor-pointer border-0 outline-none"
              >
                <Smartphone size={14} className="animate-bounce shrink-0" />
                <span>INSTALL OFFLINE APP</span>
              </button>
            )}
          </div>
        )}

        {/* Sync Status Section (Only for Students) */}
        {userRole === 'student' && (
          <div className="my-4 px-1 shrink-0">
            {isSidebarOpen || isMobile ? (
              <div className={`p-4 rounded-[24px] border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900/60 border-white/5 text-slate-300' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2.5 w-2.5">
                      {syncStatus === 'syncing' ? (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      ) : syncStatus === 'synced' ? (
                        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      ) : (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400/55 opacity-75 animate-ping"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        syncStatus === 'syncing' ? 'bg-amber-500' : syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                      }`}></span>
                    </div>
                    <span className="text-xs font-black tracking-tight uppercase">
                      {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Offline Ready' : 'Sync Needed'}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-70 font-mono font-bold">Last: {lastSyncedTime}</span>
                </div>

                {syncStatus === 'syncing' ? (
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3 border border-transparent/5">
                    <motion.div 
                      className="bg-brand-cyan h-full rounded-full" 
                      initial={{ width: '0%' }}
                      animate={{ width: `${syncProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                ) : (
                  <div className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-3 leading-snug`}>
                    Assigned lessons & notes cached securely.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    disabled={syncStatus === 'syncing'}
                    onClick={handleOfflineSync}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-brand-cyan hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCcw size={13} className={`shrink-0 ${syncStatus === 'syncing' && 'animate-spin'}`} />
                    Sync
                  </button>

                  <button
                    onClick={() => setIsOfflineViewerOpen(true)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95 ${
                      isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-brand-cyan border border-brand-cyan/25' 
                        : 'bg-white hover:bg-slate-100 text-brand-cyan border border-brand-cyan/35 shadow-sm'
                    }`}
                  >
                    <BookOpen size={13} className="shrink-0" />
                    Vault
                  </button>
                </div>
              </div>
            ) : (
              // Collapsed Sidebar Compact view
              <div className="flex flex-col items-center gap-4 py-4 rounded-2xl">
                <button
                  onClick={handleOfflineSync}
                  title={`Offline Access Sync (${syncStatus === 'synced' ? 'Ready' : 'Needs Sync'})`}
                  disabled={syncStatus === 'syncing'}
                  className={`p-3 rounded-xl transition-all relative group cursor-pointer ${
                    syncStatus === 'syncing' 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : syncStatus === 'synced' 
                        ? 'bg-emerald-500/10 text-emerald-500 hover:scale-105 hover:bg-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-500 hover:scale-105 hover:bg-rose-500/20'
                  }`}
                >
                  <RefreshCcw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  <span className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full ${
                    syncStatus === 'syncing' ? 'bg-amber-400' : syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-rose-500'
                  }`} />
                </button>

                <button
                  onClick={() => setIsOfflineViewerOpen(true)}
                  title="Offline Lesson Vault"
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isDarkMode ? 'bg-white/5 text-brand-cyan hover:bg-white/10' : 'bg-slate-150 text-brand-cyan hover:bg-slate-200 shadow-sm border border-slate-200'
                  }`}
                >
                  <BookOpen size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`mt-auto pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'} space-y-2 overflow-hidden flex justify-center`}>
          {!isMobile && (
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={`flex items-center justify-center rounded-2xl ${isSidebarOpen ? 'w-full p-3' : 'w-12 h-12'} ${isDarkMode ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'} transition-colors`}
            >
              <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-[#0F172A] dark-theme' : 'bg-slate-50'} transition-colors duration-500`}>
        {/* Header */}
        <header 
          className={`sticky top-0 left-0 right-0 h-20 border-b ${isDarkMode ? 'border-white/5 bg-[#0F172A]/90' : 'border-slate-200 bg-slate-50/90'} backdrop-blur-md px-4 lg:px-8 flex items-center justify-between shrink-0 z-50 transition-colors duration-500`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {isMobile && (
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                <Menu size={20} />
              </button>
            )}
            
            {/* Navigation Buttons */}
            <button 
              onClick={goBack}
              className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-600'} transition-all`}
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <button 
              onClick={() => { setActiveTab('dashboard'); setActiveCreatorTab(null); }}
              className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-600'} transition-all`}
              title="Home"
            >
              <Home size={18} />
            </button>

            <h2 className={`text-lg lg:text-xl font-hand tracking-wide ml-2 ${isDarkMode ? 'text-white' : 'text-slate-900'} truncate hidden sm:block`}>
              CAPS Project: <span className="text-brand-cyan underline decoration-brand-cyan/20">All Subjects</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-5">
            <div className="hidden xl:flex items-center gap-2 mr-2">
              <select 
                value={ocrProvider}
                onChange={(e) => setOcrProvider(e.target.value as any)}
                className={`text-[9px] font-bold tracking-wider px-2 py-1.5 rounded-lg outline-none transition-all ${
                  isDarkMode 
                  ? 'bg-white/5 border border-white/10 text-emerald-400 focus:border-emerald-500 [&>option]:bg-slate-800' 
                  : 'bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 shadow-sm'
                }`}
                title="OCR Engine"
              >
                <option value="gemini">OCR: Gemini 3 Flash</option>
                <option value="groq-vision">OCR: Llama 3.2 Vision</option>
                <option value="ocrspace">OCR: OCR.Space</option>
              </select>

              <select 
                value={imageProvider}
                onChange={(e) => setImageProvider(e.target.value as any)}
                className={`text-[9px] font-bold tracking-wider px-2 py-1.5 rounded-lg outline-none transition-all ${
                  isDarkMode 
                  ? 'bg-white/5 border border-white/10 text-orange-400 focus:border-orange-500 [&>option]:bg-slate-800' 
                  : 'bg-white border border-slate-200 text-slate-600 focus:border-orange-500 shadow-sm'
                }`}
                title="Image Generation Engine"
              >
                <option value="gemini-imagen">IMG: Gemini 2.5 Flash Image</option>
                <option value="wan2.1-t2i-plus">IMG: Alibaba wan2.1-t2i-plus</option>
                <option value="qwen-image-2.0-pro">IMG: Alibaba qwen-image-2.0-pro</option>
                <option value="huggingface">IMG: HF FLUX.1</option>
                <option value="pollinations-schnell">IMG: Flux Schnell</option>
                <option value="pollinations-turbo">IMG: Z-Image Turbo</option>
                <option value="pollinations-klein">IMG: FLUX.2 Klein 4B</option>
              </select>

              <select 
                value={ttsProvider}
                onChange={(e) => setTtsProvider(e.target.value as any)}
                className={`text-[9px] font-bold tracking-wider px-2 py-1.5 rounded-lg outline-none transition-all ${
                  isDarkMode 
                  ? 'bg-white/5 border border-white/10 text-purple-400 focus:border-purple-500 [&>option]:bg-slate-800' 
                  : 'bg-white border border-slate-200 text-slate-600 focus:border-purple-500 shadow-sm'
                }`}
                title="Text-to-Speech Engine"
              >
                <option value="browser">TTS: Browser Core</option>
                <option value="groq-whisper">TTS: Groq Whisper</option>
                <option value="huggingface">TTS: HuggingFace MMS</option>
                <option value="google-tts">TTS: Google TTS</option>
              </select>
            </div>
            
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value as any)}
              className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-2 rounded-xl outline-none transition-all hidden lg:block ${
                isDarkMode 
                ? 'bg-white/5 border border-white/10 text-brand-cyan hover:border-brand-cyan/50 focus:border-brand-cyan [&>option]:bg-slate-800 [&>option]:text-brand-cyan' 
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-cyan focus:border-brand-cyan shadow-sm [&>option]:bg-white [&>option]:text-slate-600'
              }`}
              title="Primary Text Model"
            >
              <option value="llama-primary">Alibaba qwen3.6-plus (Primary)</option>
              <option value="llama-secondary">Alibaba qwen3.7-max (Secondary)</option>
              <option value="gemini">Gemini (Fallback)</option>
            </select>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-brand-yellow hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-all`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Global Sound & Animations Toggle Button for Accessibility */}
            <button 
              onClick={() => {
                const val = !soundMuted;
                setSoundMuted(val);
                localStorage.setItem('eduai_sound_muted', String(val));
                window.dispatchEvent(new Event('eduai_accessibility_change'));
              }}
              className={`p-2 rounded-full transition-all ${
                soundMuted 
                  ? 'bg-red-500/20 text-red-500 border border-red-500/30 ring-4 ring-red-500/20' 
                  : (isDarkMode ? 'bg-white/5 text-emerald-400 hover:bg-white/10' : 'bg-slate-100 text-[#10b981] hover:bg-slate-200')
              }`}
              title={soundMuted ? "Unmute sounds & enable animations" : "Mute all sounds & disable animations"}
            >
              {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Global accessibility settings toggle for High-Contrast Mode */}
            <button 
              onClick={() => {
                const val = !highContrastEnabled;
                setHighContrastEnabled(val);
                localStorage.setItem('eduai_high_contrast', String(val));
                window.dispatchEvent(new Event('eduai_accessibility_change'));
              }}
              className={`p-2 rounded-full transition-all ${
                highContrastEnabled 
                  ? 'bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/30' 
                  : (isDarkMode ? 'bg-white/5 text-brand-pink hover:bg-white/10' : 'bg-slate-100 text-[#ea4335] hover:bg-slate-200')
              }`}
              title="Quick Toggle High-Contrast Mode"
            >
              <Contrast size={18} />
            </button>

            {/* Accessibility Helper Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}
                className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-brand-cyan hover:bg-white/10' : 'bg-slate-100 text-[#00a8cc] hover:bg-slate-200'} transition-all`}
                title="Accessibility Center"
              >
                <Accessibility size={18} />
              </button>

              <AnimatePresence>
                {isAccessibilityOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl border overflow-hidden p-4 ${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'} z-50`}
                  >
                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-dashed border-slate-500/20">
                      <Accessibility className="w-5 h-5 text-brand-cyan animate-pulse" />
                      <h3 className="font-display font-black text-base">Accessibility helpers</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Dyslexia Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm">📖 Dyslexia-Friendly</span>
                          <span className="text-[10px] opacity-60">Easier fonts & line height</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = !dyslexiaEnabled;
                            setDyslexiaEnabled(val);
                            localStorage.setItem('eduai_dyslexia', String(val));
                            window.dispatchEvent(new Event('eduai_accessibility_change'));
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${dyslexiaEnabled ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${dyslexiaEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Text Magnifier Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm">🔍 Magnify Text</span>
                          <span className="text-[10px] opacity-60">Bigger fonts for low sight</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = !magnifyEnabled;
                            setMagnifyEnabled(val);
                            localStorage.setItem('eduai_magnify', String(val));
                            window.dispatchEvent(new Event('eduai_accessibility_change'));
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${magnifyEnabled ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${magnifyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* High Contrast Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm">🌓 High Contrast</span>
                          <span className="text-[10px] opacity-60">Black & yellow text theme</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = !highContrastEnabled;
                            setHighContrastEnabled(val);
                            localStorage.setItem('eduai_high_contrast', String(val));
                            window.dispatchEvent(new Event('eduai_accessibility_change'));
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${highContrastEnabled ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${highContrastEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Global Sound & Animations Mute Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm">🔇 Mute Sounds & Motion</span>
                          <span className="text-[10px] opacity-60 font-sans">Stop voice & animations</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = !soundMuted;
                            setSoundMuted(val);
                            localStorage.setItem('eduai_sound_muted', String(val));
                            window.dispatchEvent(new Event('eduai_accessibility_change'));
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${soundMuted ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${soundMuted ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* TTS Core Narration Button */}
                      <button
                        type="button"
                        onClick={() => speakText("Accessibility helpers center is active. You can choose to enable dyslexia friendly mode, text magnification, or high contrast layout settings. Select your preference by sliding the toggle controls shown.")}
                        className="w-full py-2.5 px-3 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan font-bold text-xs flex items-center justify-center gap-2 transition-all border border-brand-cyan/20"
                      >
                        🔊 Hear Description
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NotificationsDropdown isDarkMode={isDarkMode} />
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-[10px] lg:rounded-[14px] ${isDarkMode ? 'bg-slate-800 border border-white/5 shadow-2xl hover:border-brand-cyan/50' : 'bg-white shadow-xl hover:border-brand-cyan'} flex items-center justify-center text-xs lg:text-sm font-black text-brand-cyan shrink-0 overflow-hidden transition-all`}
              >
                {localStorage.getItem('eduai_user_photo') ? (
                  <img src={localStorage.getItem('eduai_user_photo')!} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (localStorage.getItem('eduai_user_name') || 'SM').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                )}
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'} z-50`}
                  >
                    <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                      <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {localStorage.getItem('eduai_user_name') || 'Student Member'}
                      </p>
                      <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {localStorage.getItem('eduai_user_email') || 'student@eduai.app'}
                      </p>
                      <div className={`mt-2 inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
                        {userRole || 'Teacher'}
                      </div>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => { changeTab('settings'); setIsProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <Settings size={16} /> My Settings
                      </button>
                      <button 
                        onClick={() => { setNeedsRoleSetup(true); setIsProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <UserCheck size={16} /> Switch Role
                      </button>
                      <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <RefreshCcw size={16} /> Switch User
                      </button>
                      <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`} />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-red-500/10 text-red-500"
                      >
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Container with Animations */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto p-4 lg:p-8 custom-scrollbar"
            >
              <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
              {categoryOverviewActive ? (
                <CategoryOverview
                  categoryLabel={sidebarCategories.find(c => c.id === categoryOverviewActive)?.label || ''}
                  categoryIcon={sidebarCategories.find(c => c.id === categoryOverviewActive)?.icon}
                  subTabs={getSubTabsForCategory(categoryOverviewActive, userRole)}
                  isDarkMode={isDarkMode}
                  onSelect={(tabId) => {
                    setCategoryOverviewActive(null);
                    if (tabId === 'teaching') {
                      setActiveCreatorTab('teaching');
                      setActiveTab('teaching');
                    } else {
                      changeTab(tabId);
                    }
                  }}
                />
              ) : (
                <>
                  {(function() {
                    const currentSubTabs = getSubTabsForCategory(activeCategory, userRole);
                    if (currentSubTabs.length <= 1 || activeCategory === 'teacher-dashboard-menu') return null;
                    const catLabel = sidebarCategories.find(c => c.id === activeCategory)?.label || '';
                    return (
                      <div className="flex justify-between items-center mb-6">
                        <button
                          onClick={() => setCategoryOverviewActive(activeCategory)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-[22px] text-xs font-bold transition-all border outline-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                            isDarkMode 
                              ? 'bg-slate-950/40 border-white/5 text-slate-300 hover:text-white hover:bg-[#00d2ff]/10 hover:border-[#00d2ff]/20' 
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:shadow-sm hover:bg-slate-50'
                          }`}
                        >
                          <ArrowLeft size={14} strokeWidth={2.5} />
                          <span>Back to {catLabel} Hub</span>
                        </button>
                      </div>
                    );
                  })()}

                  {activeTab === 'dashboard' ? (
              userRole === 'student' ? (
                <StudentDashboard isDarkMode={isDarkMode} />
              ) : userRole === 'parent' ? (
                <ParentDashboard isDarkMode={isDarkMode} />
              ) : userRole === 'admin' ? (
                <AdminDashboard isDarkMode={isDarkMode} />
              ) : (
                <>
                {/* Action Bar */}
                <div className={`flex flex-col md:flex-row justify-between items-center ${isDarkMode ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-[#fff5ee] border-[#ffebd6] shadow-md'} border p-8 md:p-10 rounded-[40px] gap-6 relative overflow-hidden`}>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-yellow/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-10 w-32 h-32 bg-brand-cyan/20 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10 text-center md:text-left">
                    <h3 className={`text-4xl lg:text-5xl font-display font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Teacher Console 👩‍🏫</h3>
                    <p className={`text-base font-bold ${isDarkMode ? 'text-indigo-200' : 'text-slate-500'} mt-2 max-w-sm`}>Manage and generate magic educational resources.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto">
                    <button 
                      onClick={() => setActiveCreatorTab('teaching')}
                      className="bg-brand-yellow hover:bg-[#ffdf40] text-slate-800 px-8 py-4 rounded-[30px] font-display font-bold text-sm lg:text-base kid-shadow-hover flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto"
                    >
                      <Plus size={20} strokeWidth={3} /> Create Content!
                    </button>
                    <button 
                      onClick={() => setActiveTab('archive')}
                      className={`px-8 py-4 rounded-[30px] font-display font-bold text-sm lg:text-base border-4 ${isDarkMode ? 'border-indigo-400/30 hover:bg-indigo-400/10 text-indigo-100' : 'border-[#ffdf40] hover:bg-[#ffebd6] text-slate-700'} transition-all kid-shadow-hover w-full sm:w-auto flex justify-center`}
                    >
                       View Archive
                    </button>
                  </div>
                </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      {[
                        { label: 'Learners', value: '1,248', change: '+12%', icon: Users, color: 'text-brand-cyan', bg: 'bg-cyan-500/10', glow: 'shadow-cyan-500/20', displayColor: isDarkMode ? 'text-cyan-400' : 'text-cyan-600' },
                        { label: 'Graded', value: '432', change: '+5%', icon: ClipboardCheck, color: 'text-brand-purple', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20', displayColor: isDarkMode ? 'text-purple-400' : 'text-purple-600'  },
                        { label: 'Generated', value: '86', change: '+24%', icon: FileText, color: 'text-brand-yellow', bg: 'bg-yellow-500/10', glow: 'shadow-yellow-500/20', displayColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600' },
                        { label: 'Sessions', value: '15.4k', change: '+18%', icon: MessageSquare, color: 'text-brand-green', bg: 'bg-green-500/10', glow: 'shadow-green-500/20', displayColor: isDarkMode ? 'text-green-400' : 'text-green-600' }
                      ].map((stat, i) => (
                        <div 
                          key={`stat-${i}`} 
                          className={`${isDarkMode ? 'glass border-white/5' : 'bg-white border-2 border-slate-100'} p-6 lg:p-8 rounded-[36px] kid-shadow hover:-translate-y-1 transition-transform`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.color} p-3 rounded-[20px] ${stat.bg} ${stat.glow} shadow-xl`}>
                              <stat.icon size={24} strokeWidth={2.5} />
                            </div>
                            <span className="text-brand-green text-[12px] font-black uppercase tracking-widest bg-brand-green/10 px-2 py-1 rounded-lg">
                              {stat.change}
                            </span>
                          </div>
                          <p className={`text-[11px] uppercase font-bold tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                          <h3 className={`text-3xl lg:text-4xl font-display font-black mt-2 ${stat.displayColor}`}>{stat.value}</h3>
                        </div>
                      ))}
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                      <div className="lg:col-span-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                          {[
                            { title: "Content Creator Studio", desc: "Lessons, Plans & Assessments.", color: 'text-brand-cyan', bg20: 'bg-cyan-500/20', border30: 'border-cyan-500/30', bg10: 'bg-cyan-500/10', icon: FlaskConical, id: 'teaching' },
                            { title: "Content Archive", desc: "Posters, Cards & Displays.", color: 'text-brand-purple', bg20: 'bg-purple-500/20', border30: 'border-purple-500/30', bg10: 'bg-purple-500/10', icon: Archive, id: 'archive' },
                            { title: "AI Tutor", desc: "Interactive intelligence.", color: 'text-brand-yellow', bg20: 'bg-yellow-500/20', border30: 'border-yellow-500/30', bg10: 'bg-yellow-500/10', icon: Brain, id: 'ai-tutor' },
                            { title: "Scan & Autograde", desc: "Automated vision grading.", color: 'text-brand-pink', bg20: 'bg-pink-500/20', border30: 'border-pink-500/30', bg10: 'bg-pink-500/10', icon: Scan, id: 'ocr' },
                            { title: "Progress Reports", desc: "Track student performance.", color: 'text-orange-400', bg20: 'bg-orange-500/20', border30: 'border-orange-500/30', bg10: 'bg-orange-500/10', icon: TrendingUp, id: 'reports' },
                            { title: "Communicator & Messenger", desc: "School connection hub.", color: 'text-indigo-400', bg20: 'bg-indigo-500/20', border30: 'border-indigo-500/30', bg10: 'bg-indigo-500/10', icon: MessageSquare, id: 'messenger' },
                            { title: "Portfolios", desc: "Student work portfolio.", color: 'text-emerald-400', bg20: 'bg-emerald-500/20', border30: 'border-emerald-500/30', bg10: 'bg-emerald-500/10', icon: UserCircle, id: 'portfolios' },
                            { title: "Class & Student Management", desc: "Manage your learners.", color: 'text-blue-400', bg20: 'bg-blue-500/20', border30: 'border-blue-500/30', bg10: 'bg-blue-500/10', icon: Users, id: 'class-management' },
                            { title: "Settings", desc: "Account & App preferences.", color: 'text-slate-400', bg20: 'bg-slate-500/20', border30: 'border-slate-500/30', bg10: 'bg-slate-500/10', icon: Settings, id: 'settings' },
                            { title: "Helpdesk", desc: "Technical Support & FAQ.", color: 'text-indigo-300', bg20: 'bg-indigo-400/20', border30: 'border-indigo-400/30', bg10: 'bg-indigo-400/10', icon: HelpCircle, id: 'helpdesk' },
                          ].map((item, i) => (
                            <button 
                              key={`feature-${item.id}-${i}`} 
                              onClick={() => {
                                if (['teaching', 'grade1'].includes(item.id)) {
                                  setActiveCreatorTab(item.id);
                                } else {
                                  setActiveTab(item.id);
                                }
                              }}
                              className={`group ${isDarkMode ? 'glass hover:bg-white/10' : 'bg-white border-2 border-slate-100'} p-6 lg:p-8 rounded-[40px] transition-all text-left relative overflow-hidden backdrop-blur-xl kid-shadow-hover hover:-translate-y-2 flex flex-col items-center sm:items-start text-center sm:text-left`}
                            >
                              <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-[24px] lg:rounded-[28px] flex items-center justify-center mb-4 lg:mb-6 ${item.bg20} border-4 ${item.border30} ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                                <item.icon size={isMobile ? 32 : 40} strokeWidth={2} />
                              </div>
                              <h4 className={`text-xl lg:text-2xl font-display font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.title}</h4>
                              <p className={`text-xs lg:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-2`}>{item.desc}</p>
                              
                              <div className={`absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all ${item.color} ${item.bg10} p-2 rounded-full`}>
                                <ChevronRight size={24} strokeWidth={3} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )
                ) : activeTab === 'messenger' ? (
                  <Messenger />
                ) : activeTab === 'reports' ? (
                  userRole === 'parent' ? (
                    <ParentDashboard isDarkMode={isDarkMode} />
                  ) : (
                    <ProgressReports />
                  )
                ) : activeTab === 'class-management' ? (
                  <ClassManagement />
                ) : activeTab === 'ocr' ? (
                  <AutoGrading />
                ) : activeTab === 'archive' ? (
                  <ContentArchive />
                ) : activeTab === 'ai-tutor' ? (
                  <AITutorPage />
                ) : activeTab === 'student-practice' ? (
                  <StudentPractice isDarkMode={isDarkMode} />
                ) : activeTab === 'student-notes' ? (
                  <StudentNotes isDarkMode={isDarkMode} />
                ) : activeTab === 'portfolios' ? (
                  <StudentPortfolio isDarkMode={isDarkMode} />
                ) : activeTab === 'curriculum' ? (
                  <CurriculumSuite isDarkMode={isDarkMode} userRole={userRole} />
                ) : activeTab === 'settings' ? (
                  <SettingsPage 
                    isDarkMode={isDarkMode} 
                    setIsDarkMode={setIsDarkMode}
                    onLogout={() => {
                      setShowDashboard(false);
                      setShowLogin(false);
                      setUserRole(null);
                    }}
                    onSwitchRole={() => setNeedsRoleSetup(true)}
                    onSwitchUser={() => {
                      setShowDashboard(false);
                      setShowLogin(true);
                      setUserRole(null);
                    }}
                    isAppInstallable={isAppInstallable}
                    installPWAApp={installPWAApp}
                    isAlreadyInstalled={isAlreadyInstalled}
                    userRole={userRole || 'teacher'}
                  />
                ) : activeTab === 'teaching' ? (
                  <div className={`p-8 rounded-[40px] text-center ${isDarkMode ? 'bg-[#0B1122] border border-white/5 animate-fade-in' : 'bg-white border border-slate-200 shadow-xl'} flex flex-col items-center justify-center min-h-[440px] space-y-6`}>
                    <div className="w-20 h-20 rounded-[28px] bg-brand-cyan/20 text-[#00d2ff] flex items-center justify-center animate-bounce">
                      <FlaskConical size={40} />
                    </div>
                    <h3 className={`text-2xl font-black font-display ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Content Creator Studio</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} max-w-sm leading-relaxed font-semibold`}>
                      The CAPS-aligned AI curriculum content editor is open in a workspace hub overlay. Rubrics, worksheets, and exams are active inside the studio.
                    </p>
                    <button
                      onClick={() => setActiveCreatorTab('teaching')}
                      className="bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-[#0F172A] font-extrabold px-8 py-3.5 rounded-full shadow-lg hover:shadow-cyan-500/20 shadow-cyan-500/10 transition-all font-display hover:scale-105 active:scale-95 border-none outline-none cursor-pointer"
                    >
                      Re-open Creator Studio Overlay
                    </button>
                  </div>
                ) : activeTab === 'helpdesk' ? (
                  <Helpdesk isDarkMode={isDarkMode} />
                ) : activeTab === 'faq' ? (
                  <div className={`p-8 rounded-[40px] ${isDarkMode ? 'bg-slate-900/60 border border-white/5' : 'bg-white border border-slate-200 shadow-xl'}`}>
                    <h2 className="text-3xl font-display font-black mb-2 flex items-center gap-3">
                      <span>🤝 Support & Knowledge Base</span>
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-8 font-medium`}>
                      Find answers to common questions about South African CAPS curriculum coverage and EduAI Companion platform features.
                    </p>
                    
                    <div className="space-y-4">
                      {[
                        { q: "📚 Is the curriculum aligned with South African CAPS standards?", a: "Yes, 100%! All content created, lessons compiled, and rubrics generated map directly with the Department of Basic Education (DBE) South African National Curriculum Assessment Policy Statements (CAPS) requirements across Grades 1 to 12." },
                        { q: "🤖 Which AI model powers the tutoring system?", a: "EduAI is powered by advanced multi-model intelligence, featuring state-of-the-art models like Google Gemini and Qwen. These models offer ultra-fast localized explanations, using rands (R), local currencies, and South African historical/geographic contexts." },
                        { q: "📶 Can I use this application offline?", a: "Absolutely! Simply click on the 'INSTALL OFFLINE APP' button in the sidebar to download our Progressive Web App (PWA). Your downloaded study guides, textbook revisions, and completed portfolio tasks are cached on your local device for instant access without a stable internet connection." },
                        { q: "🛡️ How is my data protected?", a: "We adhere to strict POPIA (Protection of Personal Information Act) regulation compliance. Student assessments or raw photos are processed securely and never shared with third-party advertising engines." }
                      ].map((item, idx) => (
                        <div key={idx} className={`p-6 rounded-[24px] ${isDarkMode ? 'bg-white/5 hover:bg-white/[0.08]' : 'bg-slate-50 hover:bg-slate-100'} transition-all`}>
                          <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} mb-2`}>{item.q}</h4>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-semibold`}>{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : ( 
                  <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200 shadow-sm'} p-12 rounded-[48px] text-center min-h-[500px] flex flex-col items-center justify-center`}>
                    <Logo className="w-40 h-40 mb-8" />
                    <h3 className={`text-4xl font-hand mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Exploring New Worlds!
                    </h3>
                    <p className={`text-slate-500 max-w-sm mx-auto font-medium leading-relaxed`}> 
                      Our robot engineers are currently adding more magic to this module. For now, check out the <span className="text-brand-cyan font-bold">AI Tutor</span> or <span className="text-brand-cyan font-bold">Content Creator</span>! 
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-10">
                      <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-cyan-500/30 transition-all active:scale-95"
                      >
                        Back to HQ
                      </button>
                      <button 
                        onClick={() => setActiveTab('ai-tutor')}
                        className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all"
                      >
                        Talk to Tutor
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button */}
      {!isMobile && (
        <button 
          onClick={() => setActiveTab('ai-tutor')}
          className="fixed bottom-10 right-10 w-20 h-20 bg-brand-cyan rounded-[28px] text-navy-dark shadow-[0_20px_50px_rgba(6,182,212,0.3)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group border-4 border-navy-dark"
        >
          <MessageSquare size={28} className="group-hover:rotate-6 transition-transform" />
        </button>
      )}

      {/* App Components */}
      <AnimatePresence>
        {activeCreatorTab && (
          <ContentCreator 
            isOpen={!!activeCreatorTab} 
            initialTab={activeCreatorTab}
            onClose={() => setActiveCreatorTab(null)} 
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      {/* Offline sync success/error notifications or generic toast */}
      <AnimatePresence>
        {syncToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-10 z-[100] max-w-sm"
          >
            <div className={`p-4 rounded-[20px] shadow-2xl flex items-center gap-3 border ${
              syncToast.type === 'success' 
                ? 'bg-emerald-500 border-emerald-400 text-white' 
                : syncToast.type === 'error'
                  ? 'bg-rose-500 border-rose-400 text-white'
                  : 'bg-[#1e293b] border-slate-700 text-slate-100'
            }`}>
              <div className="p-2 bg-black/10 rounded-xl">
                {syncToast.type === 'success' ? (
                  <Check size={18} />
                ) : syncToast.type === 'error' ? (
                  <X size={18} />
                ) : (
                  <RefreshCcw size={18} className="animate-spin" />
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider font-display text-white">Offline Secure Sync</p>
                <p className="text-sm font-bold opacity-90 text-white">{syncToast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Study Material Vault Modal */}
      <AnimatePresence>
        {isOfflineViewerOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className={`w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border ${
                isDarkMode ? 'bg-[#1E293B] border-white/5' : 'bg-white border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-cyan to-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <CloudDownload size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
                      Lessons & Revision Offline Vault 📚
                    </h2>
                    <p className="text-xs opacity-90 font-bold text-slate-100">
                      All study materials are active completely offline. Keep studying on any device, anywhere!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOfflineViewerOpen(false);
                    setSelectedOfflineMaterial(null);
                    setOfflineSearchQuery('');
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white hover:scale-105 active:scale-95 transition-all rounded-full cursor-pointer border-0 outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body Section */}
              <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: List of Saved Items */}
                <div className={`w-full md:w-80 flex flex-col shrink-0 border-r ${
                  isDarkMode ? 'border-white/5 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
                }`}>
                  <div className="p-4 border-b border-inherit shrink-0">
                    <p className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                      Offline Archive
                    </p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={offlineSearchQuery}
                        placeholder="Search by title or subject..."
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-800 text-white focus:bg-slate-850 border border-white/5' 
                            : 'bg-white text-slate-700 border border-slate-200 focus:border-brand-cyan'
                        }`}
                        onChange={(e) => setOfflineSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div id="offline-list" className="flex-1 overflow-y-auto p-2 space-y-1">
                    {(function() {
                      try {
                        const filtered = offlineMaterials.filter((item: any) => {
                          const query = offlineSearchQuery.toLowerCase().trim();
                          if (!query) return true;
                          const title = (item.title || '').toLowerCase();
                          const subject = (item.subject || '').toLowerCase();
                          return title.includes(query) || subject.includes(query);
                        });

                        if (offlineMaterials.length === 0) {
                          return (
                            <div className="p-6 text-center">
                              <p className="text-xs font-bold text-slate-400">Your Vault is currently empty!</p>
                              <p className="text-[11px] text-slate-500 mt-2">Tap "Sync" in side panel while connected to download lesson contents immediately.</p>
                            </div>
                          );
                        }

                        if (filtered.length === 0) {
                          return (
                            <div className="p-6 text-center">
                              <p className="text-xs font-bold text-slate-400">No cached material matches your search.</p>
                              <p className="text-[11px] text-slate-500 mt-2">Try searching with a different title or subject.</p>
                            </div>
                          );
                        }

                        return filtered.map((item: any, idx: number) => {
                          const isSelected = selectedOfflineMaterial?.id === item.id || (!selectedOfflineMaterial && idx === 0);
                          
                          // Set initial selected item on mount/first view if not set
                          if (!selectedOfflineMaterial && idx === 0) {
                            setSelectedOfflineMaterial(item);
                          }

                          return (
                            <button
                              key={item.id || idx}
                              onClick={() => setSelectedOfflineMaterial(item)}
                              className={`offline-item w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-brand-cyan/15 border-brand-cyan text-brand-cyan shadow-sm font-semibold'
                                  : isDarkMode
                                    ? 'bg-transparent border-transparent text-slate-300 hover:bg-white/5'
                                    : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-200/50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                                  isSelected 
                                    ? 'bg-brand-cyan/25 text-brand-cyan' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>
                                  {item.contentType || 'Study Pack'}
                                </span>
                                <span className="text-[9px] opacity-70 font-mono">Grade {item.grade || '10'}</span>
                              </div>
                              <h4 className="text-xs font-black truncate max-w-[220px]">
                                {item.title || 'Untitled Material'}
                              </h4>
                              <p className="text-[10px] opacity-80 mt-1 font-bold">
                                {item.subject || 'General'}
                              </p>
                            </button>
                          );
                        });
                      } catch {
                        return <p className="text-xs text-center text-rose-500 p-4">Error parsing system cache.</p>;
                      }
                    })()}
                  </div>
                </div>

                {/* Right Panel: Content Viewer & Features */}
                <div className="flex-1 min-h-0 flex flex-col bg-slate-50/10">
                  {selectedOfflineMaterial ? (
                    <div className="flex-1 min-h-0 flex flex-col">
                      {/* Sub-Header bar for the reader */}
                      <div className={`p-4 border-b ${isDarkMode ? 'border-white/5 bg-slate-900/20' : 'border-slate-100 bg-white shadow-sm'} shrink-0 flex items-center justify-between`}>
                        <div>
                          <h3 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {selectedOfflineMaterial.title}
                          </h3>
                          <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                            {selectedOfflineMaterial.subject} • {selectedOfflineMaterial.contentType} • Offline Copy
                          </p>
                        </div>

                        {/* Speech synthesis offline read aloud button */}
                        <button
                          onClick={() => {
                            if ('speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                              // strip markdown to read text nicely
                              const stripped = selectedOfflineMaterial.content
                                .replace(/[#*`_$\-\[\]()]/g, '')
                                .substring(0, 550); // safety length
                              const utterance = new SpeechSynthesisUtterance(stripped);
                              utterance.rate = 1.0;
                              utterance.pitch = 1.0;
                              window.speechSynthesis.speak(utterance);
                              triggerToast("🔊 Reading summary aloud...", "info");
                            } else {
                              triggerToast("Speech Synthesis is not supported in this environment.", "error");
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none border-0"
                          title="Generate text-to-speech reading off the cached lesson notes"
                        >
                          <Mic size={12} strokeWidth={2.5} /> Speak
                        </button>
                      </div>

                      {/* Lesson Reader scroll area */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div 
                          className={`p-6 md:p-10 rounded-[28px] shadow-sm border ${
                            isDarkMode 
                              ? 'bg-[#1E293B] border-white/5 text-slate-100' 
                              : 'bg-white border-slate-100 text-slate-700'
                          } markdown-body`}
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(selectedOfflineMaterial.content || '*No content available for this study guide. Try sync again.*') as string
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="p-4 bg-brand-cyan/10 text-brand-cyan rounded-full animate-pulse mb-4">
                        <BookOpen size={36} />
                      </div>
                      <h4 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        Vault Ready for Study
                      </h4>
                      <p className={`text-xs max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-2`}>
                        Select any downloaded CAPS syllabus content on the left pane to begin reviewing with high-contrast formatting!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Secure Footer */}
              <div className={`p-4 border-t ${
                isDarkMode ? 'border-white/5 bg-slate-950/20 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
              } shrink-0 text-center flex flex-col sm:flex-row items-center justify-between text-[11px] font-bold`}>
                <div className="flex items-center gap-1.5 justify-center">
                  <Wifi size={12} className="text-emerald-500" />
                  <span>Secure Encryption Active (Offline Isolation Protection)</span>
                </div>
                <p className="mt-1 sm:mt-0 font-mono text-[10px]">
                  ID: CACHE_VAULT_{selectedOfflineMaterial?.id || 'GLOBAL_INSTANCE'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}
