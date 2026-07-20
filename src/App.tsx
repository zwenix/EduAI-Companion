/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  Sliders,
  MoreHorizontal,
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
  Blocks,
  ToyBrick,
  Smile,
  Award,
  Menu,
  X,
  AlertTriangle,
  Zap,
  School,
  Home,
  Calendar,
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
  VolumeX,
  Baby,
  Puzzle,
  Sprout,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { marked } from 'marked';
import { replaceImagePlaceholders } from './lib/imageReplacer';
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
import LandingPage from './components/LandingPage';
import Logo from './components/Logo';
import NotificationsDropdown from './components/NotificationsDropdown';
import StudentPractice from './components/StudentPractice';
import StudentNotes from './components/StudentNotes';
import CollaborativeWorkspace from './components/CollaborativeWorkspace';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AlertsPage from './components/AlertsPage';
import StudentPortfolio from './components/StudentPortfolio';
import CurriculumSuite from './components/CurriculumSuite';
import ParentDashboard from './components/ParentDashboard';
import ReaderModeModal from './components/ReaderModeModal';
import { TeacherPlanner } from './components/TeacherPlanner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { patchOklchForHtml2canvas } from './lib/pdfHelper';
import {
  IconHome,
  IconClassrooms,
  IconCurriculum,
  SmartBotTutorIcon,
  IconAnalytics,
  IconSettings,
  IconHelpSupport,
  IconLogout,
  IconMagicPlanner,
  IconResources,
  MagicLessonsIcon,
  ProgressTrophiesIcon,
  QuizQuestsIcon,
  SuperWorksheetsIcon,
  CreativeCanvasIcon
} from './components/LocalIcons';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/Settings';
import Helpdesk from './components/Helpdesk';
import CategoryOverview from './components/CategoryOverview';
import IllustrationLibrary from './components/IllustrationLibrary';
import { cleanTextForSpeech } from './services/ttsService';
import { auth, db } from './lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { MOCK_STUDENTS } from './data/mockStudents';
import axios from 'axios';
import { 
  AreaChart, Area, 
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const SidebarItem = ({ id, icon: Icon, label, active, onClick, collapsed, isDarkMode, themeMode }: { id?: string, icon: any, label: string, active?: boolean, onClick: () => void, collapsed: boolean, isDarkMode?: boolean, themeMode?: string }) => {
  const displayLabel = id === 'teacher-dashboard-menu' && label !== 'Home' ? 'Teachers Office' : label;

  return (
    <button
      onClick={onClick}
      title={collapsed ? displayLabel : undefined}
      className={cn(
        "flex items-center w-full gap-3.5 transition-all duration-300 relative cursor-pointer border-0 outline-none group",
        collapsed ? "justify-center p-1.5 rounded-xl" : "p-2 px-3.5 rounded-xl mb-1",
        active 
          ? isDarkMode
            ? "bg-white/[0.08] text-cyan-400 font-black border-l-4 border-cyan-400 rounded-l-none rounded-r-2xl shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] text-glow-cyan"
            : "bg-cyan-500/10 text-cyan-700 font-black border-l-4 border-cyan-500 rounded-l-none rounded-r-2xl"
          : isDarkMode 
            ? "text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-2xl font-semibold" 
            : themeMode === 'peach'
              ? "text-[#431407]/75 hover:text-[#431407] hover:bg-[#431407]/5 rounded-2xl font-semibold"
              : "text-slate-500 hover:text-cyan-600 hover:bg-cyan-500/5 rounded-2xl font-semibold"
      )}
    >
      <Icon 
        size={collapsed ? 18 : 19} 
        className={cn(
          "shrink-0 transition-transform duration-300 group-hover:scale-110",
          active 
            ? isDarkMode ? "text-cyan-400 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "text-cyan-600" 
            : isDarkMode 
              ? "text-slate-400 group-hover:text-slate-200" 
              : themeMode === 'peach'
                ? "text-[#431407]/75 group-hover:text-[#431407]"
                : "text-slate-500 group-hover:text-cyan-600"
        )} 
      />
      
      {!collapsed && (
        <span className="font-sans text-xs font-semibold text-left flex-1 flex items-center justify-between gap-2 overflow-hidden truncate">
          <span className="truncate">{displayLabel}</span>
        </span>
      )}

      {/* Animated Sparkles for Intelligence AI */}
      {!collapsed && id === 'intelligence-ai' && (
        <>
          <span className="sparkle-twinkle text-[9px]" style={{ top: '6px', right: '14px' }}>✦</span>
          <span className="sparkle-twinkle text-[12px]" style={{ top: '16px', right: '-2px' }}>✧</span>
          <span className="sparkle-twinkle text-[7px]" style={{ bottom: '8px', right: '8px' }}>✦</span>
        </>
      )}
    </button>
  );
};

// Inline LandingPage removed in favor of imported component from './components/LandingPage'

import { useAi, AIProvider as AIProviderType } from './contexts/AiContext';

export default function App() {
  const { provider, setProvider, ttsProvider, setTtsProvider, ocrProvider, setOcrProvider, imageProvider, setImageProvider } = useAi();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Leo');
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
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'peach'>(() => {
    const saved = localStorage.getItem('eduai_theme_mode');
    if (saved === 'dark' || saved === 'light' || saved === 'peach') return saved;
    return 'dark';
  });
  const isDarkMode = themeMode === 'dark';
  const setIsDarkMode = (val: boolean) => {
    const mode = val ? 'dark' : 'light';
    setThemeMode(mode);
    localStorage.setItem('eduai_theme_mode', mode);
  };
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [headerCabinetOpen, setHeaderCabinetOpen] = useState(false);

  // Real-time device clock for sidebar
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Teacher Dashboard students & aggregates
  const [dashboardStudents, setDashboardStudents] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || userRole !== 'teacher') return;

    const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      if (!snapshot.empty) {
        setDashboardStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setDashboardStudents([]);
      }
    }, (error) => {
      console.warn("Dashboard real-time students subscription issue:", error);
    });

    return () => unsubStudents();
  }, [userRole]);

  const computedStudents = useMemo(() => {
    if (dashboardStudents.length === 0) {
      return MOCK_STUDENTS;
    }
    return dashboardStudents.map(student => {
      const seed = student.name.charCodeAt(0) || 72;
      const mathScore = Math.min(95, Math.max(42, (seed % 40) + 50));
      const scienceScore = Math.min(95, Math.max(40, ((seed + 5) % 40) + 45));
      const englishScore = Math.min(93, Math.max(50, ((seed + 12) % 30) + 60));

      return {
        id: student.id,
        name: student.name,
        grade: student.grade || 'Grade 10A',
        status: student.status || 'Active',
        subjects: student.subjects || [
          { name: 'Mathematics', mark: mathScore, termHistory: [mathScore - 9, mathScore - 4, mathScore - 2, mathScore], assessments: [ { title: 'Algebra Portfolio', score: mathScore + 4, type: 'SBA' }, { title: 'Diagnostic Test', score: mathScore - 5, type: 'Test' } ] },
          { name: 'Physical Sciences', mark: scienceScore, termHistory: [scienceScore - 11, scienceScore - 6, scienceScore - 1, scienceScore], assessments: [ { title: 'Stoichiometry SBA', score: scienceScore - 3, type: 'SBA' }, { title: 'Mechanics Practical', score: scienceScore + 5, type: 'Practical' } ] },
          { name: 'English First Additional Language', mark: englishScore, termHistory: [englishScore - 5, englishScore - 2, englishScore - 1, englishScore], assessments: [ { title: 'Summary SBA', score: englishScore + 2, type: 'SBA' }, { title: 'Grammar review', score: englishScore - 4, type: 'Quiz' } ] }
        ]
      };
    });
  }, [dashboardStudents]);

  // Aggregate current term subject average
  const dashboardSubjectAverages = useMemo(() => {
    const subjectSums: Record<string, { sum: number; count: number }> = {};
    computedStudents.forEach(student => {
      if (student.subjects) {
        student.subjects.forEach((sub: any) => {
          let normalized = sub.name;
          if (sub.name.includes('Math')) normalized = 'Mathematics';
          else if (sub.name.includes('Science') || sub.name.includes('Phys')) normalized = 'Sciences';
          else if (sub.name.includes('English') || sub.name.includes('Language') || sub.name.includes('Literacy')) normalized = 'Languages';
          
          if (!subjectSums[normalized]) {
            subjectSums[normalized] = { sum: 0, count: 0 };
          }
          subjectSums[normalized].sum += sub.mark;
          subjectSums[normalized].count += 1;
        });
      }
    });

    const keys = Object.keys(subjectSums);
    if (keys.length === 0) {
      return [
        { name: 'Mathematics', average: 74 },
        { name: 'Sciences', average: 69 },
        { name: 'Languages', average: 77 }
      ];
    }

    return keys.map(key => ({
      name: key,
      average: Math.round(subjectSums[key].sum / subjectSums[key].count)
    }));
  }, [computedStudents]);

  // Historical progress trends for classroom
  const dashboardTermProgress = useMemo(() => {
    const terms = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
    return terms.map((term, termIdx) => {
      let mathSum = 0, mathCount = 0;
      let sciSum = 0, sciCount = 0;
      let langSum = 0, langCount = 0;

      computedStudents.forEach(student => {
        if (!student.subjects) return;
        student.subjects.forEach((sub: any) => {
          const val = sub.termHistory?.[termIdx] || sub.mark;
          const name = sub.name.toLowerCase();
          if (name.includes('math')) {
            mathSum += val;
            mathCount++;
          } else if (name.includes('science') || name.includes('phys')) {
            sciSum += val;
            sciCount++;
          } else {
            langSum += val;
            langCount++;
          }
        });
      });

      return {
        name: term,
        'Mathematics': mathCount > 0 ? Math.round(mathSum / mathCount) : 65 + (termIdx * 4),
        'Sciences': sciCount > 0 ? Math.round(sciSum / sciCount) : 60 + (termIdx * 5),
        'Languages': langCount > 0 ? Math.round(langSum / langCount) : 70 + (termIdx * 3),
      };
    });
  }, [computedStudents]);
  
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [dyslexiaEnabled, setDyslexiaEnabled] = useState(() => localStorage.getItem('eduai_dyslexia') === 'true');
  const [magnifyEnabled, setMagnifyEnabled] = useState(() => localStorage.getItem('eduai_magnify') === 'true');
  const [highContrastEnabled, setHighContrastEnabled] = useState(() => localStorage.getItem('eduai_high_contrast') === 'true');
  const [soundMuted, setSoundMuted] = useState(() => localStorage.getItem('eduai_sound_muted') === 'true');
  const [utilityDrawerOpen, setUtilityDrawerOpen] = useState(false);
  const [modelStatus, setModelStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [modelStatusError, setModelStatusError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState<Record<string, number | 'failed'>>({});

  const runAutoOptimize = async () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setOptimizationStats({});
    triggerToast("Initiating regional model speed diagnostic...", "info");
    
    const candidates = [
      { id: 'gemini', label: 'Gemini 3.5' },
      { id: 'nvidia-nemotron', label: 'Nemotron-3 550B' },
      { id: 'groq-qwen', label: 'Qwen 3.6 27B' }
    ];

    const results: Record<string, number | 'failed'> = {};

    const testPromises = candidates.map(async (candidate) => {
      const startTime = performance.now();
      try {
        const testMsg = [{ role: 'user', content: 'Say "OK"' }];
        const res = await axios.post(`/api/ai/${candidate.id}`, {
          messages: testMsg,
          temperature: 0.1,
          max_completion_tokens: 3
        });
        
        if (res.data && res.data.choices && res.data.choices[0]?.message?.content) {
          const duration = Math.round(performance.now() - startTime);
          results[candidate.id] = duration;
        } else {
          results[candidate.id] = 'failed';
        }
      } catch (err) {
        console.warn(`Speed test failed for ${candidate.id}:`, err);
        results[candidate.id] = 'failed';
      }
    });

    await Promise.allSettled(testPromises);

    setOptimizationStats(results);
    setIsOptimizing(false);

    let fastestId: string | null = null;
    let minLatency = Infinity;

    for (const key of Object.keys(results)) {
      const lat = results[key];
      if (typeof lat === 'number' && lat < minLatency) {
        minLatency = lat;
        fastestId = key;
      }
    }

    if (fastestId) {
      const fastestName = candidates.find(c => c.id === fastestId)?.label || fastestId;
      setProvider(fastestId as any);
      triggerToast(`⚡ Optimization complete! Auto-selected ${fastestName} (${minLatency}ms latency in your region).`, 'success');
    } else {
      triggerToast("⚠️ Diagnostic completed, but all regional requests timed out or failed. Please check your API keys.", "error");
    }
  };

  const checkModelConnection = async (selectedProvider: string) => {
    setModelStatus('checking');
    setModelStatusError(null);
    try {
      const testMsg = [{ role: 'user', content: 'Say "connected"' }];
      const res = await axios.post(`/api/ai/${selectedProvider}`, {
        messages: testMsg,
        temperature: 0.1,
        max_completion_tokens: 10
      });
      if (res.data && res.data.choices && res.data.choices[0]?.message?.content) {
        setModelStatus('connected');
      } else {
        setModelStatus('error');
        setModelStatusError('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error testing model connection:', err);
      const errMsg = err.response?.data?.error?.message || err.message || 'Connection failed';
      setModelStatus('error');
      setModelStatusError(errMsg);
    }
  };

  useEffect(() => {
    if (utilityDrawerOpen) {
      checkModelConnection(provider);
    }
  }, [provider, utilityDrawerOpen]);

  const speakText = (text: string) => {
    if (localStorage.getItem('eduai_sound_muted') === 'true') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (!text) return;
      const sanitized = cleanTextForSpeech(text);
      if (!sanitized) return;
      const utterance = new SpeechSynthesisUtterance(sanitized);
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
  const [isOfflineReaderOpen, setIsOfflineReaderOpen] = useState(false);
  const [selectedOfflineMaterial, setSelectedOfflineMaterial] = useState<any>(null);
  const [isOfflineListCollapsed, setIsOfflineListCollapsed] = useState(false);
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

  // Global keyboard listener for Ctrl+1 through Ctrl+7 navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl key is pressed (or Meta/Cmd key for macOS) and NOT Shift/Alt/Option
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        // Only run if the active element is not a text input or editor
        const activeElement = document.activeElement;
        if (activeElement) {
          const tagName = activeElement.tagName.toLowerCase();
          const isEditable = activeElement.getAttribute('contenteditable') === 'true';
          if (
            tagName === 'input' ||
            tagName === 'textarea' ||
            isEditable
          ) {
            return;
          }
        }

        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 7) {
          e.preventDefault();
          const targetIndex = num - 1;
          const categories = getSidebarCategories(userRole);
          if (categories && categories[targetIndex]) {
            const cat = categories[targetIndex];
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
            triggerToast(`Navigated to ${cat.label}`, "info");
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userRole]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstallable, setIsAppInstallable] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [pwaBannerDismissed, setPwaBannerDismissed] = useState(() => {
    return localStorage.getItem('eduai_pwa_banner_dismissed') === 'true';
  });
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'error' }>({ show: false, message: '', type: 'info' });
  const [apiBlockedAlert, setApiBlockedAlert] = useState<{
    provider: string;
    url?: string;
    isBlockedByClient: boolean;
    message: string;
    isServerError?: boolean;
    statusCode?: number;
    serverErrorDetails?: string;
  } | null>(null);

  useEffect(() => {
    const onApiError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail) {
        const detail = customEvent.detail;
        if (detail.provider && detail.provider.toLowerCase() !== 'gemini') {
          triggerToast(`Optional API ${detail.provider} is not configured or blocked. Seamlessly falling back to Gemini...`, 'info');
        } else {
          setApiBlockedAlert(detail);
        }
      }
    };
    window.addEventListener('api-blocked-or-unreachable', onApiError);
    return () => window.removeEventListener('api-blocked-or-unreachable', onApiError);
  }, []);

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
      const { collection, getDocs, query, limit, where } = await import('firebase/firestore');
      
      let fetchedItems: any[] = [];
      try {
        const q = query(
          collection(db, 'created_content'), 
          where('teacherId', '==', auth.currentUser?.uid || ''), 
          limit(15)
        );
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
    
    if (r === 'teacher') {
      return [
        { id: 'teacher-dashboard-menu', label: 'Teachers Office', icon: IconHome },
        { id: 'lesson-planning', label: 'Edu-Tools Hub', icon: IconCurriculum },
        { id: 'intelligence-ai', label: 'Intelligent AI', icon: SmartBotTutorIcon },
        { id: 'class-management', label: 'Classes & Learners', icon: IconClassrooms },
        { id: 'class-analytics', label: 'Analytics', icon: IconAnalytics },
        { id: 'student-class-management', label: 'Message & Collaborate', icon: IconClassrooms },
        { id: 'system-support', label: 'Settings', icon: IconSettings },
      ];
    }
    
    return [
      { id: 'teacher-dashboard-menu', label: firstLabel, icon: IconHome },
      { id: 'lesson-planning', label: 'Edu-Tools Hub', icon: IconCurriculum },
      { id: 'intelligence-ai', label: 'Intelligence AI', icon: SmartBotTutorIcon },
      { id: 'class-management', label: 'Classes & Learners', icon: IconClassrooms },
      { id: 'class-analytics', label: 'Analytics & Reports', icon: IconAnalytics },
      { id: 'student-class-management', label: 'Chat & Messenger', icon: IconClassrooms },
      { id: 'system-support', label: 'System support', icon: IconSettings },
    ];
  };

  const sidebarCategories = getSidebarCategories(userRole);

  const getSubTabsForCategory = (catId: string, role: string | null) => {
    const r = role || 'teacher';
    if (r === 'student') {
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Student Dashboard', icon: IconHome }
          ];
        case 'lesson-planning':
          return [
            { id: 'student-notes', label: 'Study & Revision Notes', icon: IconCurriculum }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI Tutor Helpers', icon: SmartBotTutorIcon }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'My Progress Analytics', icon: ProgressTrophiesIcon },
            { id: 'portfolios', label: 'My Portfolio', icon: SuperWorksheetsIcon },
            { id: 'curriculum', label: 'CAPS & Gamification Hub', icon: QuizQuestsIcon }
          ];
        case 'class-management':
          return [
            { id: 'dashboard', label: 'Class Overview', icon: IconClassrooms }
          ];
        case 'student-class-management':
          return [
            { id: 'student-practice', label: 'Practice Zone', icon: SmartBotTutorIcon },
            { id: 'collaborative-workspace', label: 'Collaborative Workspace', icon: IconClassrooms },
            { id: 'messenger', label: 'Chat & Friends', icon: IconClassrooms }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: IconSettings },
            { id: 'helpdesk', label: 'Help', icon: IconHelpSupport },
            { id: 'faq', label: 'Support', icon: IconHelpSupport }
          ];
        default:
          return [];
      }
    } else if (r === 'parent') {
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Parent Dashboard Hub', icon: IconHome }
          ];
        case 'lesson-planning':
          return [];
        case 'intelligence-ai':
          return [
            { id: 'dashboard', label: 'AI Classroom Updates', icon: SmartBotTutorIcon }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: "My Child's Progress", icon: ProgressTrophiesIcon },
            { id: 'portfolios', label: 'Assignments & Portfolios', icon: SuperWorksheetsIcon }
          ];
        case 'class-management':
          return [
            { id: 'dashboard', label: 'Class Overview', icon: IconClassrooms }
          ];
        case 'student-class-management':
          return [
            { id: 'messenger', label: 'Teacher Chat & Contacts', icon: IconClassrooms }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: IconSettings },
            { id: 'helpdesk', label: 'Help', icon: IconHelpSupport },
            { id: 'faq', label: 'Support', icon: IconHelpSupport }
          ];
        default:
          return [];
      }
    } else if (r === 'admin') {
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Admin Dashboard Hub', icon: IconHome }
          ];
        case 'lesson-planning':
          return [
            { id: 'archive', label: 'Database Content Archive', icon: IconResources }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI System Controls', icon: SmartBotTutorIcon },
            { id: 'ocr', label: 'OCR Grading Logs', icon: QuizQuestsIcon }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'School Analytics & Stats', icon: ProgressTrophiesIcon }
          ];
        case 'class-management':
          return [
            { id: 'class-management', label: 'Classrooms Manager', icon: IconClassrooms }
          ];
        case 'student-class-management':
          return [
            { id: 'dashboard', label: 'Students Overview', icon: IconClassrooms }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: IconSettings },
            { id: 'helpdesk', label: 'Help', icon: IconHelpSupport },
            { id: 'faq', label: 'Support', icon: IconHelpSupport }
          ];
        default:
          return [];
      }
    } else {
      // Default: Teacher
      switch (catId) {
        case 'teacher-dashboard-menu':
          return [
            { id: 'dashboard', label: 'Teacher Dashboard', icon: IconHome }
          ];
        case 'lesson-planning':
          return [
            { id: 'teaching', label: 'Content Factory', icon: CreativeCanvasIcon },
            { id: 'archive', label: 'Content Archive Storage', icon: IconResources },
            { id: 'illustrations', label: 'Illustration Library', icon: CreativeCanvasIcon }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI Tutor Support', icon: SmartBotTutorIcon },
            { id: 'ocr', label: "Teacher's Auto-Grading Lab", icon: SuperWorksheetsIcon }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'Progress Reports', icon: ProgressTrophiesIcon },
            { id: 'portfolios', label: 'Learner Personal Portfolios', icon: SuperWorksheetsIcon },
            { id: 'curriculum', label: 'CAPS & Gamification Hub', icon: QuizQuestsIcon }
          ];
        case 'class-management':
          return [
            { id: 'class-management', label: 'Class Management', icon: IconClassrooms }
          ];
        case 'student-class-management':
          return [
            { id: 'messenger', label: 'Communicator Hub Chat', icon: IconClassrooms }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: IconSettings },
            { id: 'helpdesk', label: 'Help', icon: IconHelpSupport },
            { id: 'faq', label: 'Support', icon: IconHelpSupport }
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

  const getPageTitle = () => {
    if (activeCreatorTab) {
      switch (activeCreatorTab) {
        case 'teaching':
          return 'Content Studio';
        case 'visual':
          return 'Visual Lab';
        case 'video':
          return 'Video Lab';
        case 'admin':
          return 'Admin Lab';
        case 'grade1':
          return 'Foundation Hub';
        default:
          return activeCreatorTab.charAt(0).toUpperCase() + activeCreatorTab.slice(1);
      }
    }

    if (categoryOverviewActive) {
      const cat = sidebarCategories.find(c => c.id === categoryOverviewActive);
      if (cat) return cat.label;
    }

    switch (activeTab) {
      case 'dashboard':
        return userRole === 'teacher' ? 'Home' : userRole === 'student' ? 'Student Dashboard' : userRole === 'parent' ? 'Parent Dashboard' : 'Admin Dashboard';
      case 'teaching':
        return 'Lesson Planner';
      case 'alerts':
        return 'Alerts & Reminders';
      case 'archive':
        return 'Content Archive';
      case 'planner':
        return "Teacher's Planner & Diary";
      case 'reports':
        return 'Galaxy Analytics';
      case 'class-management':
        return 'Classes & Learners';
      case 'settings':
        return 'Settings';
      case 'ai-tutor':
        return 'Intelligent AI';
      case 'ocr':
        return "Teacher's Auto-Grading Lab";
      case 'messenger':
        return 'Message & Collaborate';
      case 'video':
        return 'Video Lab Studio';
      default:
        for (const cat of sidebarCategories) {
          const subTabs = getSubTabsForCategory(cat.id, userRole);
          const tab = subTabs.find(t => t.id === activeTab);
          if (tab) return tab.label;
        }
        return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    }
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
            const role = data.role || 'teacher';
            const name = data.name || user.displayName || user.email?.split('@')[0] || 'Leo';
            setUserName(name);
            localStorage.setItem(`userRole_${user.uid}`, role);
            setUserRole(role);
            setShowDashboard(true);
            setShowLogin(false);
          } else {
            setUserName(user.displayName || user.email?.split('@')[0] || 'Leo');
            // Logged in but needs role setup
            setNeedsRoleSetup(true);
            setShowDashboard(true);
            setShowLogin(false);
          }
        } catch (err) {
          console.warn("Error fetching user role on startup (offline fallback active):", err);
          // If Firestore is offline or setup is failing, fall back to last cached role or default
          const cachedRole = localStorage.getItem(`userRole_${user.uid}`) || 'teacher';
          setUserRole(cachedRole);
          setUserName(user.displayName || user.email?.split('@')[0] || 'Leo');
          setShowDashboard(true);
          setShowLogin(false);
          triggerToast("Operating in offline/cached mode. Cloud database is temporarily unreachable.", "info");
        }
      } else {
        // Not logged in or logged out
        setShowDashboard(false);
        setUserRole(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isRefreshing) {
    return <SplashScreen onVideoEnd={() => setIsRefreshing(false)} />;
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
          }).catch((err) => {
            console.warn("Offline during login role fetch, falling back to cached role:", err);
            const cachedRole = localStorage.getItem(`userRole_${user.uid}`);
            if (cachedRole) {
              setUserRole(cachedRole);
              setNeedsRoleSetup(false);
            } else {
              setNeedsRoleSetup(true);
            }
            setShowDashboard(true);
            setShowLogin(false);
            triggerToast("Offline mode. Loaded local cached profile settings.", "info");
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
            // Immediately store in local cache to protect against offline loss
            localStorage.setItem(`userRole_${user.uid}`, role);
            
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              // Create user profile with required createdAt timestamp
              await setDoc(userRef, {
                role: role,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } else {
              // Update existing profile role
              await updateDoc(userRef, {
                role: role,
                updatedAt: serverTimestamp()
              });
            }
          } catch (err) {
            console.warn("Offline: Saved role locally, but could not sync to cloud database:", err);
            triggerToast("Saved profile settings locally. Cloud sync pending.", "info");
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
    <MotionConfig reducedMotion="never">
      <div className={`flex h-screen ${isDarkMode ? 'bg-[#050a18]' : themeMode === 'peach' ? 'bg-[#efe8d9] peach-theme' : 'bg-slate-50'} font-sans selection:bg-brand-cyan/30 overflow-hidden transition-colors duration-500`}>
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

      {/* Sidebar Base Placeholder on Desktop to prevent page content starting at 0 */}
      {!isMobile && (
        <div className={cn("shrink-0 transition-all duration-300", isSidebarOpen ? "w-[256px]" : "w-[100px]")} />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? 240 : (isSidebarOpen ? 240 : 84),
          x: isMobile ? (isMobileSidebarOpen ? 0 : -240) : 0
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={cn(
          "flex flex-col py-8 px-4 fixed left-4 top-4 bottom-4 shrink-0 z-[60] shadow-2xl transition-all duration-300 border rounded-[32px] h-[calc(100vh-2rem)] overflow-hidden",
          isDarkMode 
            ? "bg-[#0d1225]/45 border-white/10 text-white backdrop-blur-2xl" 
            : themeMode === 'peach'
              ? "bg-[#efe8d9]/75 border-[#dcd4c3] text-[#431407] backdrop-blur-2xl"
              : "bg-white/75 border-slate-200 text-slate-800 backdrop-blur-2xl"
        )}
      >
        {isDarkMode && <div className="sidebar-glow-highlight" />}

        {/* Center-aligned Animated Logo & Compact Header */}
        <div className="flex flex-col mb-8 relative shrink-0">
          <div className="flex items-center justify-between w-full relative px-1">
            <div className="flex items-center gap-2.5">
              {/* Animated Logo */}
              <Logo className="w-8 h-8 shrink-0" />
              
              {(isSidebarOpen || isMobile) && (
                <div className="flex flex-col text-left animate-fadeIn">
                  <span className={cn(
                    "text-xl font-display font-black tracking-tight leading-none text-white drop-shadow-[0_0_15px_rgba(0,225,255,0.4)]"
                  )}>Edu<span className="text-[#00ff9f]">AI</span></span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 leading-none">Lead Navigator</span>
                </div>
              )}
            </div>

            {/* Collapse button on the right hand side of logo/name */}
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className={cn(
                  "p-1 rounded-lg transition-all border outline-none cursor-pointer flex items-center justify-center shrink-0 ml-1.5",
                  isDarkMode
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400/30 text-slate-300 hover:text-cyan-400"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                )}
                title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                {isSidebarOpen ? (
                  <ChevronLeft size={14} strokeWidth={3} />
                ) : (
                  <ChevronRight size={14} strokeWidth={3} />
                )}
              </button>
            )}

            {isMobile && (
              <button 
                onClick={() => setMobileSidebarOpen(false)} 
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isDarkMode ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 min-h-0 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 relative z-10">
          {sidebarCategories.map((cat) => {
            const collapsed = !isSidebarOpen && !isMobile;
            const active = activeCategory === cat.id;

            return (
              <SidebarItem 
                key={cat.id}
                id={cat.id}
                icon={cat.icon} 
                label={cat.label} 
                active={active} 
                isDarkMode={isDarkMode}
                themeMode={themeMode}
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

        {/* Sliding Pill Theme Toggle at the bottom */}
        {(isSidebarOpen || isMobile) && (
          <div className="mt-auto px-4 mb-4 shrink-0 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Night Vision</span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-11 h-6 rounded-full bg-slate-950/80 border border-white/15 p-0.5 relative cursor-pointer transition-colors duration-300 flex items-center shrink-0"
              title="Toggle Dark/Light Mode"
            >
              <div 
                className={cn(
                  "w-4.5 h-4.5 rounded-full bg-[#00ff9f] shadow-[0_0_10px_rgba(0,255,159,0.8)] transition-all duration-300 transform",
                  isDarkMode ? "translate-x-5" : "translate-x-0"
                )} 
              />
            </button>
          </div>
        )}

        {/* BEGIN: User Profile Section */}
        <div className="mt-auto shrink-0 mb-4 px-1" data-purpose="user-profile-card">
          <button
            onClick={() => {
              setActiveCategory('system-support');
              const subTabs = getSubTabsForCategory('system-support', userRole);
              if (subTabs.length > 0) {
                changeTab('settings');
              }
              if (isMobile) setMobileSidebarOpen(false);
            }}
            title={(!isSidebarOpen && !isMobile) ? (userName || 'Profile') : undefined}
            className={cn(
              "flex items-center w-full gap-3 transition-all duration-300 relative cursor-pointer border-0 outline-none group",
              (!isSidebarOpen && !isMobile) ? "justify-center p-2 rounded-xl" : "p-3 px-4 rounded-2xl",
              activeCategory === 'system-support' && activeTab === 'settings'
                ? isDarkMode
                  ? "bg-white/[0.08] text-cyan-400 font-black border-l-4 border-cyan-400 rounded-l-none rounded-r-2xl text-glow-cyan"
                  : "bg-cyan-500/10 text-cyan-700 font-black border-l-4 border-cyan-500 rounded-l-none rounded-r-2xl"
                : isDarkMode 
                  ? "text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-2xl font-semibold" 
                  : themeMode === 'peach'
                    ? "text-[#431407]/75 hover:text-[#431407] hover:bg-[#431407]/5 rounded-2xl font-semibold"
                    : "text-slate-500 hover:text-cyan-600 hover:bg-cyan-500/5 rounded-2xl font-semibold"
            )}
          >
            <div className="relative shrink-0 w-6 h-6">
              <div className="w-full h-full rounded-full overflow-hidden border border-emerald-500 shadow-sm">
                <img 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC84-NEFvwZ7DJM6n9YadrglDB8eRZh5QhtpIKevJPmkMBaZ3RkjJ9cIZKMDhDdhi3Fm2vPK5KwuuIpM9M0T1QWfIrr9FYQZDoWaA5vG-P0gwhFLuHvW-kHBMutdlciDTTSzWc4OgZqI2wnPR8TKZEQ2JwrAhN01mVbao5KXaNjC2TkVtzJ_KpaSWV8kvi3RcI2ij0P6uiU4J4MCueD2QLas3WSqTUUAQPuhOnbmyer0gb5k78eHF-Eew" 
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/100/10b981/ffffff?text=${encodeURIComponent((userName || 'ZH').substring(0,2).toUpperCase())}`;
                  }}
                />
              </div>
              <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            
            {(isSidebarOpen || isMobile) && (
              <span className="font-sans text-xs font-semibold text-left flex-1 flex flex-col justify-center min-w-0">
                <span className={cn(
                  "truncate font-bold leading-tight",
                  isDarkMode ? "text-white" : "text-slate-900"
                )}>{userName || 'Zwelakhe Hsuthu'}</span>
                <span className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">
                  {userRole === 'student' ? 'Explorer' : userRole === 'parent' ? 'Guardian' : 'Master Tutor'}
                </span>
              </span>
            )}
          </button>
        </div>
        {/* END: User Profile Section */}
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-[#0d0e1b] dark-theme' : themeMode === 'peach' ? 'bg-[#efe8d9] peach-theme' : 'bg-slate-50'} transition-colors duration-500`}>
        {isDarkMode && (
          <div className="dashboard-bg-container" data-purpose="mock-dashboard-layers">
            <div className="bg-blur-card bg-blur-card-1"></div>
            <div className="bg-blur-card bg-blur-card-2"></div>
            <div className="bg-blur-card bg-blur-card-3"></div>
            <div className="bg-blur-card bg-blur-card-4"></div>
            <div className="bg-blur-card bg-blur-card-5"></div>
          </div>
        )}
        {/* Header */}
        <header 
          className={`sticky top-0 left-0 right-0 h-20 border-b ${isDarkMode ? 'border-white/5 bg-[#050a18]/90' : themeMode === 'peach' ? 'border-[#dcd4c3] bg-[#efe8d9]/90' : 'border-slate-200 bg-slate-50/90'} backdrop-blur-md px-4 lg:px-8 flex items-center justify-between shrink-0 z-50 transition-colors duration-500`}
        >
          {/* Left Side: Navigation (Home & Back Buttons) */}
          <div className="flex items-center gap-3">
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
              onClick={() => { 
                setActiveTab('dashboard'); 
                setActiveCreatorTab(null); 
                setCategoryOverviewActive(null);
                setActiveCategory('teacher-dashboard-menu');
              }}
              className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-600'} transition-all`}
              title="Teachers Office"
            >
              <IconHome size={18} />
            </button>

            {/* Page/Branding Title */}
            <div className="flex items-center ml-2 border-l border-white/10 pl-4 py-1">
              <span className={cn(
                "font-display font-black tracking-tight text-xs sm:text-base lg:text-lg",
                isDarkMode ? "text-white text-glow-cyan animate-fade-in" : "text-slate-800"
              )}>
                {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Right Side: Profile dropdown, notifications, day/night & settings drawer */}
          <div className="flex items-center gap-2 lg:gap-3">
            {userRole === 'teacher' ? (
              <>
                {/* Search the galaxy */}
                <div className="hidden md:flex items-center relative mr-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search the galaxy..."
                    className={cn(
                      "pl-10 pr-4 py-2 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-40 lg:w-48 border transition-all",
                      isDarkMode 
                        ? "bg-[#0b1122]/80 border-white/5 text-white" 
                        : "bg-slate-100 border-slate-200 text-slate-800"
                    )}
                  />
                </div>

                {/* + New Mission button */}
                <button
                  onClick={() => {
                    setActiveCategory('content-creator-menu');
                    setActiveCreatorTab('teaching');
                    setActiveTab('teaching');
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full font-display font-black text-xs tracking-wide bg-gradient-to-r from-cyan-500 to-indigo-500 hover:to-indigo-600 shadow-md shadow-cyan-500/10 active:scale-95 transition-all text-white border-none cursor-pointer outline-none mr-2"
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>New Mission</span>
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center mr-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                  EduAI Space
                </span>
              </div>
            )}

            {/* Accessibility Helpers Expandable Bar Button */}
            <button
              onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${
                isAccessibilityOpen 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : (isDarkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-205 border border-slate-200/55 shadow-sm')
              }`}
              title={isAccessibilityOpen ? "Hide Accessibility" : "Show Accessibility"}
            >
              <Accessibility size={18} />
            </button>

            {/* Expandable settings drawer trigger button */}
            <button
              onClick={() => setUtilityDrawerOpen(!utilityDrawerOpen)}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${
                utilityDrawerOpen 
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30' 
                  : (isDarkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-205 border border-slate-200/55 shadow-sm')
              }`}
              title={utilityDrawerOpen ? "Hide AI Engines" : "Show AI Engines"}
            >
              <Sliders size={18} />
            </button>

            {/* Theme Mode Dropdown Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                  themeMode === 'dark' 
                    ? 'bg-white/5 text-brand-yellow hover:bg-white/10' 
                    : themeMode === 'peach'
                      ? 'bg-[#ffebe5] text-orange-602 hover:bg-[#ffdacc] border border-orange-200/40'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/50 shadow-sm'
                }`}
                title="Change UI Theme Mode"
              >
                {themeMode === 'dark' ? <Moon size={18} /> : themeMode === 'peach' ? <Palette size={18} /> : <Sun size={18} />}
              </button>

              <AnimatePresence>
                {isThemeMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-y-0 right-0 mt-3 w-40 rounded-2xl shadow-2xl border p-1.5 z-50 transition-colors ${
                        isDarkMode 
                          ? 'bg-slate-800 border-white/10 text-white shadow-black/80' 
                          : themeMode === 'peach'
                            ? 'bg-[#efe8d9] border-[#dcd4c3] text-[#431407] shadow-orange-950/20'
                            : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/80'
                      }`}
                    >
                      <button 
                        onClick={() => {
                          setThemeMode('light');
                          localStorage.setItem('eduai_theme_mode', 'light');
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                          themeMode === 'light' 
                            ? 'bg-brand-cyan text-white shadow-lg shadow-cyan-500/20' 
                            : isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Sun size={15} /> Light Mode
                      </button>
                      
                      <button 
                        onClick={() => {
                          setThemeMode('dark');
                          localStorage.setItem('eduai_theme_mode', 'dark');
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left mt-1 ${
                          themeMode === 'dark' 
                            ? 'bg-brand-cyan text-white shadow-lg shadow-cyan-500/20' 
                            : isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Moon size={15} /> Dark Mode
                      </button>

                      <button 
                        onClick={() => {
                          setThemeMode('peach');
                          localStorage.setItem('eduai_theme_mode', 'peach');
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left mt-1 ${
                          themeMode === 'peach' 
                            ? 'bg-[#ff7c5c] text-white shadow-lg shadow-[#ff7c5c]/30' 
                            : isDarkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-[#fff0eb] text-orange-600'
                        }`}
                      >
                        <Palette size={15} /> Peach Mode
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications Dropdown */}
            <NotificationsDropdown isDarkMode={isDarkMode} />

            {/* Profile Dropdown */}
            <div className="relative">
              {userRole === 'teacher' ? (
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all border shrink-0",
                    isDarkMode 
                      ? "bg-[#0b1122]/80 border-white/5 hover:border-brand-cyan/30 shadow-2xl" 
                      : "bg-white border-slate-200 hover:border-brand-cyan shadow-sm"
                  )}
                  title="Profile Settings"
                >
                  <div className="w-8 h-8 rounded-full border border-brand-cyan/20 overflow-hidden shrink-0 flex items-center justify-center bg-[#00d2ff]/10 text-[#00d2ff] font-black text-xs">
                    {localStorage.getItem('eduai_user_photo') ? (
                      <img src={localStorage.getItem('eduai_user_photo')!} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (localStorage.getItem('eduai_user_name') || 'Commander Sarah').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className={cn("text-xs font-black tracking-tight leading-none", isDarkMode ? "text-white" : "text-slate-900")}>
                      {localStorage.getItem('eduai_user_name') || 'Commander Sarah'}
                    </span>
                    <span className={cn("text-[9px] font-bold mt-1 tracking-wider uppercase leading-none", isDarkMode ? "text-cyan-400 text-glow-cyan" : "text-cyan-600")}>
                      GRADE 5 SPECIALIST
                    </span>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-[10px] lg:rounded-[14px] ${isDarkMode ? 'bg-slate-800 border border-white/5 shadow-2xl hover:border-brand-cyan/50' : 'bg-white shadow-xl hover:border-brand-cyan'} flex items-center justify-center text-xs lg:text-sm font-black text-brand-cyan shrink-0 overflow-hidden transition-all`}
                  title="Profile Settings"
                >
                  {localStorage.getItem('eduai_user_photo') ? (
                    <img src={localStorage.getItem('eduai_user_photo')!} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (localStorage.getItem('eduai_user_name') || 'SM').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                </button>
              )}

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
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
                    
                    <div className="p-2 space-y-1 font-sans">
                      <button 
                        onClick={() => { changeTab('settings'); setIsProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <IconSettings size={16} /> My Settings
                      </button>
                      <button 
                        onClick={() => { setNeedsRoleSetup(true); setIsProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <UserCheck size={16} /> Switch Role
                      </button>
                      <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <RefreshCcw size={16} /> Switch User
                      </button>
                      <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`} />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left hover:bg-red-500/10 text-red-500"
                      >
                        <IconLogout size={16} /> Log Out
                      </button>
                    </div>
                  </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        {/* Horizontal Accessibility Helpers Sliding Panel */}
        <AnimatePresence>
          {isAccessibilityOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`w-full border-b shrink-0 z-40 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900 border-white/5 text-white' 
                  : themeMode === 'peach'
                    ? 'bg-[#f7eedf] border-[#dcd4c3] text-[#431407]'
                    : 'bg-slate-50 border-slate-200 text-slate-805'
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-black text-[10px] tracking-widest uppercase">
                    HELPERS
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider font-display">Accessibility & System</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 w-full md:w-auto">
                  {/* Dyslexia Mode Toggle */}
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-none">Dyslexia Font</div>
                      <div className="text-[9px] opacity-65">Easy-reading</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !dyslexiaEnabled;
                        setDyslexiaEnabled(val);
                        localStorage.setItem('eduai_dyslexia', String(val));
                        window.dispatchEvent(new Event('eduai_accessibility_change'));
                      }}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ml-1 shrink-0 ${dyslexiaEnabled ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${dyslexiaEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Text Magnifier Toggle */}
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-none">Magnify Text</div>
                      <div className="text-[9px] opacity-65">Enlarged visibility</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !magnifyEnabled;
                        setMagnifyEnabled(val);
                        localStorage.setItem('eduai_magnify', String(val));
                        window.dispatchEvent(new Event('eduai_accessibility_change'));
                      }}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ml-1 shrink-0 ${magnifyEnabled ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${magnifyEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* High Contrast Mode Toggle */}
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-none">High Contrast</div>
                      <div className="text-[9px] opacity-65">Optimal layouts</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !highContrastEnabled;
                        setHighContrastEnabled(val);
                        localStorage.setItem('eduai_high_contrast', String(val));
                        window.dispatchEvent(new Event('eduai_accessibility_change'));
                      }}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ml-1 shrink-0 ${highContrastEnabled ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${highContrastEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Mute toggle */}
                  <div className="flex items-center gap-2 text-left">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${soundMuted ? 'bg-brand-pink animate-pulse' : 'bg-brand-green'}`} />
                    <div>
                      <div className="text-xs font-bold leading-none">Mute Sounds</div>
                      <div className="text-[9px] opacity-65">Stop narrator</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !soundMuted;
                        setSoundMuted(val);
                        localStorage.setItem('eduai_sound_muted', String(val));
                        window.dispatchEvent(new Event('eduai_accessibility_change'));
                      }}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ml-1 shrink-0 ${soundMuted ? 'bg-brand-cyan' : 'bg-slate-500/30'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${soundMuted ? 'translate-x-4.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Speak Description helper */}
                  <button
                    type="button"
                    onClick={() => speakText("Accessibility helpers bar is active. You can choose to enable dyslexia friendly mode, text magnification, high contrast font weights, or mute all voice alerts.")}
                    className="py-1 px-3 ml-2 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all border border-brand-cyan/20"
                  >
                    🔊 Hear Guide
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating AI Options Dropdown underneath Profile/Avatar on the right hand side */}
        <AnimatePresence>
          {utilityDrawerOpen && (
            <>
              {/* Overlay Backdrop to close drop-down on click away */}
              <div className="fixed inset-0 z-40" onClick={() => setUtilityDrawerOpen(false)} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-4 top-[84px] w-80 max-w-[calc(100vw-32px)] rounded-[22px] shadow-2xl border p-5 z-50 flex flex-col ${
                  isDarkMode 
                    ? 'bg-slate-900/98 border-white/10 text-white shadow-black/80' 
                    : themeMode === 'peach'
                      ? 'bg-[#efe8d9] border-[#dcd4c3] text-[#431407] shadow-orange-950/20'
                      : 'bg-white border-slate-205 text-slate-800 shadow-slate-200/80'
                } backdrop-blur-md`}
              >
                {/* Header inside the popover */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-500/10">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-brand-cyan" />
                    <div className="text-left">
                      <h3 className="font-display font-black text-sm">AI Options</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-brand-cyan' : 'text-slate-500'}`}>
                        Engine Configuration
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUtilityDrawerOpen(false)}
                    className={`p-1.5 rounded-lg transition-all ${
                      isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Dropdowns list */}
                <div className="py-3 space-y-4">
                  {/* Primary Text Engine */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider">Primary Text Engine</label>
                      <div className="flex items-center gap-1.5">
                        {modelStatus === 'checking' && (
                          <div className="flex items-center gap-1">
                            <RefreshCcw className="w-2.5 h-2.5 text-amber-500 animate-spin" />
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Checking</span>
                          </div>
                        )}
                        {modelStatus === 'connected' && (
                          <button 
                            onClick={() => checkModelConnection(provider)}
                            title="Re-test model response"
                            className="flex items-center gap-1 hover:opacity-80 transition-all cursor-pointer border-none bg-transparent p-0 outline-none"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Connected</span>
                          </button>
                        )}
                        {modelStatus === 'error' && (
                          <button 
                            onClick={() => checkModelConnection(provider)}
                            className="flex items-center gap-1 hover:opacity-80 transition-all cursor-pointer border-none bg-transparent p-0 outline-none"
                            title={`${modelStatusError || "API key or network error."} Click to retry check.`}
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 animate-pulse"></span>
                            </span>
                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Offline</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select 
                          value={provider} 
                          onChange={(e) => setProvider(e.target.value as any)}
                          className={`w-full text-xs font-bold uppercase tracking-wide px-3 py-2.5 rounded-xl outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-slate-800 border border-white/10 text-brand-cyan hover:border-brand-cyan/50 focus:border-brand-cyan [&>option]:bg-slate-800 [&>option]:text-brand-cyan' 
                              : themeMode === 'peach'
                                ? 'bg-[#f7eedb] border-[#dcd4c3] text-[#431407] hover:border-[#ff7c5c] focus:border-[#ff7c5c] [&>option]:bg-[#f7eedb]'
                                : 'bg-slate-50 border border-slate-200 text-slate-705 hover:border-brand-cyan/50 focus:border-brand-cyan shadow-sm [&>option]:bg-white'
                          }`}
                        >
                          <option value="gemini">Gemini (Primary - Recommended)</option>
                          <option value="nvidia-nemotron">NVIDIA Nemotron-3 550B (NVIDIA Integration)</option>
                          <option value="groq-qwen">Qwen3.6 27B (Groq Alternative)</option>
                        </select>
                      </div>
                      <button
                        onClick={runAutoOptimize}
                        disabled={isOptimizing}
                        title="Auto-Optimize: Run regional speed test across all models"
                        className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
                          isOptimizing ? 'animate-pulse opacity-80' : ''
                        } ${
                          isDarkMode 
                            ? 'bg-slate-800 border-white/10 text-amber-400 hover:border-amber-400/50 hover:bg-slate-750' 
                            : themeMode === 'peach'
                              ? 'bg-[#f7eedb] border-[#dcd4c3] text-amber-600 hover:border-[#ff7c5c] hover:bg-[#efe5d0]'
                              : 'bg-slate-50 border-slate-200 text-amber-500 hover:border-brand-cyan/50 hover:bg-slate-100 shadow-sm'
                        }`}
                      >
                        <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-spin text-amber-500' : ''}`} />
                      </button>
                      <div 
                        className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border ${
                          isDarkMode 
                            ? 'bg-slate-850 border-white/10 text-brand-cyan' 
                            : themeMode === 'peach'
                              ? 'bg-[#f0e6d2] border-[#dcd4c3] text-[#431407]'
                              : 'bg-slate-50 border-slate-200 text-slate-705'
                        }`}
                        title={
                          modelStatus === 'checking' 
                            ? 'Checking connectivity...' 
                            : modelStatus === 'connected' 
                              ? 'Successfully connected and responding! Click status label above to re-test.' 
                              : `${modelStatusError || "API connection failed. Please check credentials."} Click status label above to retry.`
                        }
                      >
                        {modelStatus === 'checking' && (
                          <RefreshCcw className="w-4 h-4 text-amber-500 animate-spin" />
                        )}
                        {modelStatus === 'connected' && (
                          <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </div>
                        )}
                        {modelStatus === 'error' && (
                          <div className="relative flex h-3 w-3 cursor-help">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 animate-pulse"></span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Latency results summary */}
                    {Object.keys(optimizationStats).length > 0 && (
                      <div className="mt-2.5 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-500/10 text-[10px] space-y-1 animate-fadeInZoom">
                        <div className="font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                          <span>Regional Latency Results</span>
                          <span className="text-[9px] font-bold text-amber-500 lowercase">fastest selected</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                          {['gemini', 'nvidia-nemotron', 'groq-qwen'].map((pId) => {
                            const lat = optimizationStats[pId];
                            const name = pId === 'gemini' ? 'Gemini' : pId === 'nvidia-nemotron' ? 'Nemotron' : 'Qwen';
                            const isCurrent = provider === pId;
                            return (
                              <div 
                                key={pId} 
                                className={`flex flex-col p-1.5 rounded-lg border ${
                                  isCurrent 
                                    ? isDarkMode
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                      : 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-black/5 dark:bg-white/5 border-transparent'
                                }`}
                              >
                                <span className="font-bold text-[9px] truncate opacity-80">{name}</span>
                                <span className={lat === 'failed' ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                  {lat === 'failed' ? 'Offline' : `${lat}ms`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OCR Engine */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-black uppercase tracking-wider block">OCR Vision Engine</label>
                    <select 
                      value={ocrProvider}
                      onChange={(e) => setOcrProvider(e.target.value as any)}
                      className={`w-full text-xs font-bold px-3 py-2.5 rounded-xl outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-800 border border-white/10 text-emerald-400 focus:border-emerald-500 [&>option]:bg-slate-800' 
                          : themeMode === 'peach'
                            ? 'bg-[#f7eedb] border-[#dcd4c3] text-emerald-700 focus:border-[#ff7c5c] [&>option]:bg-[#f7eedb]'
                            : 'bg-slate-50 border border-slate-205 text-slate-705 focus:border-emerald-500 shadow-sm'
                      }`}
                    >
                      <option value="gemini">Gemini OCR Vision (Multimodal)</option>
                      <option value="ocrspace">OCR Space Engine</option>
                    </select>
                  </div>

                  {/* Creative Image Generator */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-black uppercase tracking-wider block">Creative Image Generator</label>
                    <select 
                      value={imageProvider}
                      onChange={(e) => setImageProvider(e.target.value as any)}
                      className={`w-full text-xs font-bold px-3 py-2.5 rounded-xl outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-800 border border-white/10 text-orange-400 focus:border-orange-500 [&>option]:bg-slate-800' 
                          : themeMode === 'peach'
                            ? 'bg-[#f7eedb] border-[#dcd4c3] text-orange-700 focus:border-[#ff7c5c] [&>option]:bg-[#f7eedb]'
                            : 'bg-slate-50 border border-slate-200 text-slate-705 focus:border-orange-500 shadow-sm'
                      }`}
                    >
                      <option value="gemini-imagen">Google Imagen 3 (Default)</option>
                      <option value="perchance">Perchance AI (Secondary)</option>
                      <option value="pollinations">Pollinations AI (Tertiary)</option>
                    </select>
                  </div>

                  {/* Voice Synthesis Engine */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-black uppercase tracking-wider block">Voice Synthesis Engine</label>
                    <select 
                      value={ttsProvider}
                      onChange={(e) => setTtsProvider(e.target.value as any)}
                      className={`w-full text-xs font-bold px-3 py-2.5 rounded-xl outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-800 border border-white/10 text-purple-400 focus:border-purple-500 [&>option]:bg-slate-800' 
                          : themeMode === 'peach'
                            ? 'bg-[#f7eedb] border-[#dcd4c3] text-purple-700 focus:border-[#ff7c5c] [&>option]:bg-[#f7eedb]'
                            : 'bg-slate-50 border border-slate-200 text-slate-705 focus:border-purple-500 shadow-sm'
                      }`}
                    >
                      <option value="groq-whisper">Groq Whisper Voice (Default)</option>
                      <option value="browser">Native Browser Voice (Free/Offline)</option>
                      <option value="google-tts">Standard Google Cloud Speech</option>
                      <option value="huggingface">Hugging Face Local Audio</option>
                    </select>
                  </div>
                </div>

                {/* Core label footer */}
                <div className={`p-3 text-center text-[9px] font-bold tracking-widest rounded-xl mt-1 ${
                  isDarkMode ? 'bg-slate-950/40 text-white/20' : 'bg-slate-50 text-slate-400'
                }`}>
                  EDUAI CORE CONSOLE · v1.4.0
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                    if (['teaching', 'grade1', 'admin', 'visual', 'video'].includes(tabId)) {
                      setActiveCreatorTab(tabId);
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
                <TeacherDashboard 
                  isDarkMode={isDarkMode} 
                  onNavigate={(tabId, categoryId) => {
                    if (categoryId) {
                      setActiveCategory(categoryId);
                    }
                    if (tabId === 'edu-tools-hub' || tabId === 'lesson-planning-landing') {
                      setActiveCategory('lesson-planning');
                      setCategoryOverviewActive('lesson-planning');
                    } else if (tabId === 'teaching') {
                      setActiveCreatorTab('teaching');
                      setActiveTab('teaching');
                    } else {
                      setCategoryOverviewActive(null);
                      changeTab(tabId);
                    }
                  }}
                  triggerToast={triggerToast}
                />
              )

                ) : activeTab === 'alerts' ? (
                  <AlertsPage 
                    isDarkMode={isDarkMode} 
                    onNavigate={(tabId, categoryId) => {
                      if (categoryId) {
                        setActiveCategory(categoryId);
                      }
                      if (tabId === 'edu-tools-hub' || tabId === 'lesson-planning-landing') {
                        setActiveCategory('lesson-planning');
                        setCategoryOverviewActive('lesson-planning');
                      } else if (tabId === 'teaching') {
                        setActiveCreatorTab('teaching');
                        setActiveTab('teaching');
                      } else {
                        setCategoryOverviewActive(null);
                        changeTab(tabId);
                      }
                    }}
                    triggerToast={triggerToast}
                  />
                ) : activeTab === 'messenger' ? (
                  <Messenger />
                ) : activeTab === 'reports' ? (
                  userRole === 'parent' ? (
                    <ParentDashboard isDarkMode={isDarkMode} />
                  ) : (
                    <ProgressReports isDarkMode={isDarkMode} />
                  )
                ) : activeTab === 'class-management' ? (
                  <ClassManagement isDarkMode={isDarkMode} />
                ) : activeTab === 'ocr' ? (
                  <AutoGrading />
                ) : activeTab === 'archive' ? (
                  <ContentArchive />
                ) : activeTab === 'planner' ? (
                  <TeacherPlanner isDarkMode={isDarkMode} onBack={() => setActiveTab('dashboard')} />
                ) : activeTab === 'illustrations' ? (
                  <IllustrationLibrary isDarkMode={isDarkMode} />
                ) : activeTab === 'ai-tutor' ? (
                  <AITutorPage onBack={() => setActiveTab('dashboard')} />
                ) : activeTab === 'student-practice' ? (
                  <StudentPractice isDarkMode={isDarkMode} />
                ) : activeTab === 'collaborative-workspace' ? (
                  <CollaborativeWorkspace isDarkMode={isDarkMode} />
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
                    <h3 className={`text-2xl font-black font-display ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Content Factory</h3>
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
                        { q: "🤖 Which AI model powers the tutoring system?", a: "EduAI is powered by advanced multi-model intelligence, featuring state-of-the-art models like Google Gemini, Hugging Face Qwen 3.5, and Groq Llama 4 Scout. These models offer ultra-fast localized explanations, using rands (R), local currencies, and South African historical/geographic contexts." },
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
          onClick={() => {
            setActiveTab('ai-tutor');
            setActiveCategory('intelligence-ai');
          }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:scale-110 active:scale-95 transition-all z-50 group border-none cursor-pointer"
          style={{ boxShadow: '0 0 35px rgba(6,182,212,1)' }}
          title="Ask AI Tutor"
        >
          <img 
            alt="Chat" 
            className="w-10 h-10 opacity-95 group-hover:rotate-6 transition-transform" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7zewRMyV--kCZaHJSO_9x4qxRG3o69WfH4n9leN13ztwgzvFzeOJQYDn6jpdMAoXYrBxfDCl29siyH7vDmw68cTdENIjUO-r06T5MTNnFzbOSuE4tPHDtv1ci1c1jh1fmU0nkqEcnEMXr_tgOu0CCS5xi1xseKuCGk8aU9ebquaZXWwLaa-uyXygeY1pkCoMNpfcvnLrO-fz73IT66HLSczmeQ9_IQdzQKXK3xIFk3X8k0zPFzAXBeg" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
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
            isSidebarOpen={isSidebarOpen}
            userName={userName}
            userRole={userRole}
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

      {/* Cloud & AI API Blockage Alert Warning */}
      <AnimatePresence>
        {apiBlockedAlert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-[28px] p-6 shadow-2xl border ${
                isDarkMode ? 'bg-[#1e293b] border-rose-500/30' : 'bg-white border-rose-200'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 text-rose-500">
                  <div className="p-3 bg-rose-500/10 rounded-2xl shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-black font-display tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {apiBlockedAlert.isBlockedByClient 
                        ? 'API Request Blocked' 
                        : (apiBlockedAlert.isServerError 
                            ? `Server Error (${apiBlockedAlert.statusCode || 500})` 
                            : 'API Unreachable')}
                    </h3>
                    <p className="text-xs font-black uppercase tracking-wider text-rose-500 font-display">
                      Provider: {apiBlockedAlert.provider}
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isDarkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-rose-50/50 text-slate-600 border border-rose-100'}`}>
                  {apiBlockedAlert.message}
                </div>

                {apiBlockedAlert.isServerError && apiBlockedAlert.serverErrorDetails && (
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-[10px] uppercase font-black tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Server Response Detail</span>
                    <pre className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-mono rounded-xl max-h-[140px] overflow-y-auto whitespace-pre-wrap break-all">
                      {apiBlockedAlert.serverErrorDetails}
                    </pre>
                  </div>
                )}

                <div className="flex flex-col gap-2 text-xs">
                  <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recommended Solutions:</span>
                  {apiBlockedAlert.isServerError ? (
                    <ul className={`list-disc list-inside space-y-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <li>Verify your <b>GEMINI_API_KEY</b>, <b>HUGGINGFACE_API_KEY</b>, or <b>GROQ_API_KEY</b> is correctly declared in settings or server config.</li>
                      <li>Consult the <b>Debug Console</b> in the Admin Dashboard to review real-time network request payloads.</li>
                      <li>Confirm that the server is not throttled, and that the specified AI model is supported.</li>
                    </ul>
                  ) : (
                    <ul className={`list-disc list-inside space-y-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <li><b>Disable Ad-Blockers</b> (e.g., uBlock Origin, AdBlock Plus) for this site.</li>
                      <li>If on <b>Brave Browser</b>, lower shields or whitelist the API domains.</li>
                      <li>Verify your local firewall or network DNS filter policies doesn't block out external AI APIs.</li>
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setApiBlockedAlert(null)}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  Understood & Close
                </button>
              </div>
            </motion.div>
          </div>
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
                <div className={`w-full md:w-80 flex-col shrink-0 border-r transition-all duration-305 ${
                  isOfflineListCollapsed ? 'hidden' : 'flex'
                } ${
                  selectedOfflineMaterial ? 'hidden md:flex' : 'flex'
                } ${
                  isDarkMode ? 'border-white/5 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
                }`}>
                  <div className="p-4 border-b border-inherit shrink-0 flex items-center justify-between">
                    <p className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Offline Archive
                    </p>
                    <button
                      onClick={() => setIsOfflineListCollapsed(true)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-cyan transition-all rounded-lg cursor-pointer border-0 outline-none flex items-center justify-center"
                      title="Collapse sidebar"
                    >
                      <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                  
                  <div className="p-4 border-b border-inherit shrink-0">
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
                          const isSelected = selectedOfflineMaterial?.id === item.id;

                          return (
                            <motion.button
                              key={item.id || idx}
                              onClick={() => setSelectedOfflineMaterial(item)}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(idx * 0.05, 0.45) }}
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
                            </motion.button>
                          );
                        });
                      } catch {
                        return <p className="text-xs text-center text-rose-500 p-4">Error parsing system cache.</p>;
                      }
                    })()}
                  </div>
                </div>

                {/* Right Panel: Content Viewer & Features */}
                <div className={`flex-1 min-h-0 flex-col bg-slate-50/10 ${selectedOfflineMaterial ? 'flex' : 'hidden md:flex'}`}>
                  {selectedOfflineMaterial ? (
                    <div className="flex-1 min-h-0 flex flex-col">
                      {/* Sub-Header bar for the reader */}
                      <div className={`p-4 border-b ${isDarkMode ? 'border-white/5 bg-slate-900/20' : 'border-slate-100 bg-white shadow-sm'} shrink-0 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between`}>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* Back Button for mobile */}
                          <button
                            onClick={() => setSelectedOfflineMaterial(null)}
                            className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-cyan transition-all rounded-lg cursor-pointer border-0 outline-none flex items-center justify-center"
                            title="Back to material list"
                          >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                          </button>

                          {/* Expand Button for desktop */}
                          {isOfflineListCollapsed && (
                            <button
                              onClick={() => setIsOfflineListCollapsed(false)}
                              className="hidden md:flex mr-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-500 dark:text-slate-400 hover:text-brand-cyan transition-all rounded-lg cursor-pointer border-0 outline-none items-center justify-center animate-pulse"
                              title="Show material list"
                            >
                              <ChevronRight size={18} strokeWidth={2.5} />
                            </button>
                          )}
                          
                          <div>
                            <h3 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                              {selectedOfflineMaterial.title}
                            </h3>
                            <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                              {selectedOfflineMaterial.subject} • {selectedOfflineMaterial.contentType} • Offline Copy
                            </p>
                          </div>
                        </div>

                        {/* Speech, PDF, and Reader action bar */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Reader mode triggers fullscreen overlay */}
                          <button
                            onClick={() => setIsOfflineReaderOpen(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none border-0 shadow-sm shadow-cyan-500/10"
                            title="Open in fullscreen distraction-free reader layout"
                          >
                            <Eye size={11} strokeWidth={2.5} /> Reader Mode
                          </button>

                          {/* PDF compilation of local copy block content */}
                          <button
                            onClick={async () => {
                              try {
                                triggerToast("Creating PDF of cached material...", "info");
                                const containerDiv = document.createElement('div');
                                containerDiv.style.padding = '40px';
                                containerDiv.style.width = '800px';
                                containerDiv.style.backgroundColor = 'white';
                                containerDiv.style.color = 'black';
                                containerDiv.style.position = 'absolute';
                                containerDiv.style.left = '-9999px';

                                const tEl = document.createElement('h1');
                                tEl.innerText = selectedOfflineMaterial.title;
                                tEl.style.fontSize = '24px';
                                tEl.style.marginBottom = '15px';
                                document.title = selectedOfflineMaterial.title;
                                containerDiv.appendChild(tEl);

                                const metadataEl = document.createElement('p');
                                metadataEl.innerText = `${selectedOfflineMaterial.subject} • Grade ${selectedOfflineMaterial.grade || '10'} • Offline Study Notes`;
                                metadataEl.style.fontSize = '12px';
                                metadataEl.style.color = '#555';
                                metadataEl.style.marginBottom = '25px';
                                containerDiv.appendChild(metadataEl);

                                const txtEl = document.createElement('div');
                                txtEl.style.fontSize = '13px';
                                txtEl.style.lineHeight = '1.6';
                                txtEl.innerHTML = replaceImagePlaceholders(marked.parse(selectedOfflineMaterial.content || '') as string);
                                containerDiv.appendChild(txtEl);

                                document.body.appendChild(containerDiv);

                                const restoreStyle = patchOklchForHtml2canvas();
                                let canvas;
                                try {
                                  canvas = await html2canvas(containerDiv, { scale: 1.5 });
                                } finally {
                                  restoreStyle();
                                  document.body.removeChild(containerDiv);
                                }

                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF({
                                  orientation: 'portrait',
                                  unit: 'px',
                                  format: 'a4'
                                });

                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                                let heightLeft = pdfHeight;
                                let position = 0;

                                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                                heightLeft -= pdf.internal.pageSize.getHeight();

                                while (heightLeft >= 0) {
                                  position = heightLeft - pdfHeight;
                                  pdf.addPage();
                                  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                                  heightLeft -= pdf.internal.pageSize.getHeight();
                                }

                                pdf.save(`${selectedOfflineMaterial.title.replace(/\s+/g, '_')}_Offline_Draft.pdf`);
                                triggerToast("PDF downloaded!", "success");
                              } catch (err) {
                                console.error(err);
                                triggerToast("PDF export failed.", "error");
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none border-0"
                            title="Export outline lessons copy to local pdf"
                          >
                            <Download size={11} strokeWidth={2.5} /> Export PDF
                          </button>

                          {/* Speech synthesis offline read aloud button */}
                          <button
                            onClick={() => {
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                // Clean HTML, styling, markdown tags robustly
                                const stripped = cleanTextForSpeech(selectedOfflineMaterial.content).substring(0, 750); // safety length
                                const utterance = new SpeechSynthesisUtterance(stripped);
                                utterance.rate = 1.0;
                                utterance.pitch = 1.0;
                                window.speechSynthesis.speak(utterance);
                                triggerToast("🔊 Reading summary aloud...", "info");
                              } else {
                                triggerToast("Speech Synthesis is not supported in this environment.", "error");
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none border-0"
                            title="Generate text-to-speech reading off the cached lesson notes"
                          >
                            <Mic size={11} strokeWidth={2.5} /> Speak
                          </button>
                        </div>
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
                            __html: replaceImagePlaceholders(marked.parse(selectedOfflineMaterial.content || '*No content available for this study guide. Try sync again.*') as string)
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                      <div className="p-4 bg-brand-cyan/10 text-brand-cyan rounded-full animate-pulse mb-4">
                        <BookOpen size={36} />
                      </div>
                      <h4 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        Vault Ready for Study
                      </h4>
                      <p className={`text-xs max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-2`}>
                        Select any downloaded CAPS syllabus content on the left pane to begin reviewing with high-contrast formatting!
                      </p>
                      {isOfflineListCollapsed && (
                        <button
                          onClick={() => setIsOfflineListCollapsed(false)}
                          className="mt-5 px-4.5 py-2 bg-brand-cyan hover:bg-brand-cyan/80 text-white font-black text-xs uppercase tracking-wide rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-cyan/10 hover:scale-[1.03] active:scale-[0.97] transition-all border-0 outline-none"
                        >
                          <ChevronRight size={14} strokeWidth={2.5} /> Show Study Materials List
                        </button>
                      )}
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

        {/* Fullscreen Offline Material Reader Mode overlay */}
        {selectedOfflineMaterial && (
          <ReaderModeModal 
            isOpen={isOfflineReaderOpen}
            onClose={() => setIsOfflineReaderOpen(false)}
            title={selectedOfflineMaterial.title || 'Syllabus Note Guide'}
            content={selectedOfflineMaterial.content || ''}
            subject={selectedOfflineMaterial.subject}
            grade={selectedOfflineMaterial.grade}
          />
        )}

        {/* Real-time hand-drawn displacement filters defs block (invisible) */}
        <svg xmlns="http://www.w3.org/2000/svg" className="hidden" style={{ display: 'none', width: 0, height: 0 }}>
          <defs>
            <filter id="sketchy-hand-drawn-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="sketchy-hand-drawn-filter-active">
              <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
      </div>
    </MotionConfig>
  );
}
