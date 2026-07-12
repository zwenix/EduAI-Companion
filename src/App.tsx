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
import StudentPortfolio from './components/StudentPortfolio';
import CurriculumSuite from './components/CurriculumSuite';
import ParentDashboard from './components/ParentDashboard';
import ReaderModeModal from './components/ReaderModeModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { patchOklchForHtml2canvas } from './lib/pdfHelper';
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

const categoryIconsMap: Record<string, string> = {
  'teacher-dashboard-menu': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGGuKWRly4nhnBYri8gDVnI3-wO6fOy2YvyxVYw33oY9TQIieHaugj35F8COMT0VgMDYSMyL6U1C8dsfqDYSG4H6SmMg_OzpeIOehNE412TwoFHPF2hdVRbTeVisi7zS0K2knn6fuv0oL08FFj3LAUOX_EcTEC_Cu40ngevo0bYf_qUwDWmcmTvrUH1TmHfsqWKUyuMhvv9uOLoUM6jceHwZV__Fsbe4stb8WeyexqKUUobimeBQGg5w',
  'lesson-planning': 'https://lh3.googleusercontent.com/aida-public/AB6AXuANc3c_lgt81zqEC4B1u8RrslxLMjp9n7ONiPBTG_bJgHibibQ14DlWaP50jgDoZ-dmljIdt1u23bGmxiAL4Wtj7R8clreqp9lsZHHuGrXYiVoUyGSYGyGX8APIFfXPkL0DHgKEPxl5QEEzj3bmrEs4eoRfC7GUstEWpTJADLReGSq1YHPHPVWLm02d9d7jKMGqpTeYObz7ElOwrjlCSVecgMLrC0RUjdMHzEbOclXApXLJ-y5b12kdeA',
  'intelligence-ai': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOucOGfvc7dNNfUMza0gqBNI5tD56aSYNC2qA0NwhEc9bbhlaQ0vmgAI6HCiu4TpSgrGSj94Yjb1tz443tMfNY6NXFggvHYnBX7CT2IUgMum_jwYp-FLBmxHA11G0lN2Px6jgYi-i0oO6jMvlLbloiqeopJ0jHQkGZx5ygwE7Z-9mH6NL__69-YUUd2DBrXUdE2oRQJrh3bttyYuhkOSm4E4AT9wedtJWoB51oiqOd4zCo96pFHM3KSA',
  'class-management': 'https://lh3.googleusercontent.com/aida-public/AB6AXuArUcKc1czBA3RvnErre7vSOMptRHVJu1GRUaQnmMS7nRCRZCuVI1KznUhgkHXRQBKehRk53Yxw2kg8WsOL_ANari75xDgn6PR91KgyMSj-iwhxuvJeq5q9dCxHdu0u7RoNPVLIs7fFpxBtfYtW3Csmbz4c00N7Nl41yVLIMdB6u4kW045EDQWanBq1QF6QpPXoHzTbVbi55UaGBJz3xH4rUfxH7F2NXZyXXJHlFVhFSeFvHMyaIn9a4Q'
};

const SidebarItem = ({ id, icon: Icon, label, active, onClick, collapsed, isDarkMode, themeMode }: { id?: string, icon: any, label: string, active?: boolean, onClick: () => void, collapsed: boolean, isDarkMode?: boolean, themeMode?: string }) => {
  const imageUrl = id ? categoryIconsMap[id] : undefined;
  const displayLabel = id === 'teacher-dashboard-menu' ? 'Home' : label;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      onClick={onClick}
      title={collapsed ? displayLabel : undefined}
      className={cn(
        "flex items-center w-full gap-4 transition-all duration-300 relative cursor-pointer border outline-none group",
        collapsed ? "justify-center p-2 rounded-2xl border-transparent" : "p-3 rounded-2xl mb-1.5 border-transparent/5",
        active 
          ? isDarkMode 
            ? "bg-brand-cyan/20 text-brand-cyan font-black border-brand-cyan/30 shadow-[0_0_15px_rgba(0,179,255,0.25)] text-glow-cyan" 
            : "bg-brand-cyan/15 text-brand-cyan font-black border-brand-cyan/20"
          : isDarkMode 
            ? "text-slate-300 hover:text-white hover:bg-white/5 font-medium" 
            : themeMode === 'peach'
              ? "text-[#431407]/75 hover:text-[#431407] hover:bg-[#431407]/5 font-medium"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
      )}
    >
      <div className={cn(
        "shrink-0 flex items-center justify-center transition-all duration-300",
        collapsed 
          ? isDarkMode ? "w-10 h-10 bg-white/5 rounded-xl border border-white/5" : "w-10 h-10 bg-slate-100 rounded-xl border border-slate-200"
          : isDarkMode ? "w-11 h-11 bg-white/10 rounded-xl border border-white/10 group-hover:scale-105" : "w-11 h-11 bg-slate-100 rounded-xl border border-slate-200 group-hover:scale-105"
      )}>
        {(imageUrl && !imgFailed) ? (
          <img 
            src={imageUrl} 
            alt={displayLabel} 
            className={cn(
              "object-contain",
              collapsed ? "w-6 h-6" : "w-7 h-7",
              id === 'lesson-planning' ? "filter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" : ""
            )} 
            referrerPolicy="no-referrer"
            onError={() => {
              setImgFailed(true);
            }}
          />
        ) : (
          <Icon 
            size={collapsed ? 20 : 22} 
            className={cn(
              active 
                ? "text-brand-cyan" 
                : isDarkMode 
                  ? "text-slate-300 group-hover:text-white" 
                  : themeMode === 'peach'
                    ? "text-[#431407]/75 group-hover:text-[#431407]"
                    : "text-slate-600 group-hover:text-slate-900"
            )} 
          />
        )}
      </div>
      
      {!collapsed && (
        <span className="font-sans text-[11px] font-black uppercase tracking-wider text-left leading-none flex-1 flex items-center justify-between gap-2 overflow-hidden truncate">
          <span className="truncate">{displayLabel}</span>
          
          {/* Class Management Badge */}
          {id === 'class-management' && (
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_0_10px_rgba(220,38,38,0.8)] border border-white/20 text-white shrink-0">
              3
            </div>
          )}
        </span>
      )}

      {/* Animated Sparkles for Intelligence AI */}
      {!collapsed && id === 'intelligence-ai' && (
        <>
          <span className="sparkle-twinkle text-[10px]" style={{ top: '6px', right: '14px' }}>✦</span>
          <span className="sparkle-twinkle text-[14px]" style={{ top: '16px', right: '-2px' }}>✧</span>
          <span className="sparkle-twinkle text-[8px]" style={{ bottom: '8px', right: '8px' }}>✦</span>
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
      { id: 'groq-gpt-oss', label: 'GPT OSS 120B' },
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
    
    return [
      { id: 'teacher-dashboard-menu', label: firstLabel, icon: GraduationCap },
      { id: 'lesson-planning', label: 'Teachers Magic', icon: Blocks },
      { id: 'intelligence-ai', label: 'Intelligence AI', icon: Sparkles },
      { id: 'class-analytics', label: 'Analytics & Reports', icon: Award },
      { id: 'class-management', label: 'Class management', icon: Users },
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
            { id: 'student-notes', label: 'Study & Revision Notes', icon: GraduationCap }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI Tutor Helpers', icon: Sparkles }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'My Progress Analytics', icon: Award },
            { id: 'portfolios', label: 'My Portfolio', icon: ClipboardCheck },
            { id: 'curriculum', label: 'CAPS & Gamification Hub', icon: Puzzle }
          ];
        case 'class-management':
          return [
            { id: 'dashboard', label: 'Class Overview', icon: Users }
          ];
        case 'student-class-management':
          return [
            { id: 'student-practice', label: 'Practice Zone', icon: Blocks },
            { id: 'collaborative-workspace', label: 'Collaborative Workspace', icon: Users },
            { id: 'messenger', label: 'Chat & Friends', icon: MessageSquare }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'helpdesk', label: 'Help', icon: HelpCircle },
            { id: 'faq', label: 'Support', icon: HelpCircle }
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
            { id: 'dashboard', label: 'AI Classroom Updates', icon: Sparkles }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: "My Child's Progress", icon: Award },
            { id: 'portfolios', label: 'Assignments & Portfolios', icon: Blocks }
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
            { id: 'faq', label: 'Support', icon: HelpCircle }
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
            { id: 'archive', label: 'Database Content Archive', icon: Sprout }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI System Controls', icon: Sparkles },
            { id: 'ocr', label: 'OCR Grading Logs', icon: Puzzle }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'School Analytics & Stats', icon: Award }
          ];
        case 'class-management':
          return [
            { id: 'class-management', label: 'Classrooms Manager', icon: Users }
          ];
        case 'student-class-management':
          return [
            { id: 'dashboard', label: 'Students Overview', icon: Users }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'helpdesk', label: 'Help', icon: HelpCircle },
            { id: 'faq', label: 'Support', icon: HelpCircle }
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
            { id: 'teaching', label: 'Content Creator Studio', icon: Blocks },
            { id: 'archive', label: 'Content Archive Storage', icon: Sprout },
            { id: 'illustrations', label: 'Illustration Library', icon: Palette }
          ];
        case 'intelligence-ai':
          return [
            { id: 'ai-tutor', label: 'AI Tutor Support', icon: Sparkles },
            { id: 'ocr', label: "Teacher's Auto-Grading Lab", icon: ClipboardCheck }
          ];
        case 'class-analytics':
          return [
            { id: 'reports', label: 'Progress Reports', icon: Award },
            { id: 'portfolios', label: 'Learner Personal Portfolios', icon: ClipboardCheck },
            { id: 'curriculum', label: 'CAPS & Gamification Hub', icon: Puzzle }
          ];
        case 'class-management':
          return [
            { id: 'class-management', label: 'Class Management', icon: Users }
          ];
        case 'student-class-management':
          return [
            { id: 'messenger', label: 'Communicator Hub Chat', icon: MessageSquare }
          ];
        case 'system-support':
          return [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'helpdesk', label: 'Help', icon: HelpCircle },
            { id: 'faq', label: 'Support', icon: HelpCircle }
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
          console.error("Error fetching user role on startup:", err);
          // If Firestore is offline or setup is failing, fall back to last cached role or default
          const cachedRole = localStorage.getItem(`userRole_${user.uid}`) || 'teacher';
          setUserRole(cachedRole);
          setUserName(user.displayName || user.email?.split('@')[0] || 'Leo');
          setShowDashboard(true);
          setShowLogin(false);
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
        <div className="w-20 shrink-0 transition-all duration-300" />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? 280 : (isSidebarOpen ? 280 : 80),
          x: isMobile ? (isMobileSidebarOpen ? 0 : -280) : 0
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={cn(
          "h-full flex flex-col py-6 px-3 lg:px-4 fixed left-0 top-0 shrink-0 z-[60] shadow-2xl transition-all duration-300 border-r",
          isSidebarOpen ? "overflow-y-auto" : "overflow-hidden",
          isDarkMode 
            ? "bg-[#050a18]/75 border-white/5 text-white backdrop-blur-2xl" 
            : themeMode === 'peach'
              ? "bg-[#efe8d9]/75 border-[#dcd4c3] text-[#431407] backdrop-blur-2xl"
              : "bg-white/75 border-slate-200 text-slate-800 backdrop-blur-2xl"
        )}
      >
        {isDarkMode && <div className="sidebar-glow-highlight" />}

        {/* Center-aligned Animated Logo & Compact Header */}
        <div className="flex flex-col items-center justify-center mb-6 relative shrink-0">
          <div className="flex items-center justify-center w-full relative">
            <div className="flex justify-center flex-1">
              <Logo className="w-12 h-12" />
            </div>
            {isMobile && (
              <button 
                onClick={() => setMobileSidebarOpen(false)} 
                className={cn(
                  "absolute right-1 p-1.5 rounded-lg transition-all",
                  isDarkMode ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Prominent Sidebar Maximizer/Minimizer button at the top */}
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={cn(
                "mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border outline-none cursor-pointer",
                isDarkMode
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#00d2ff]/30 text-slate-300 hover:text-[#00d2ff]"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
              )}
              title={isSidebarOpen ? "Minimize Sidebar" : "Maximize Sidebar"}
            >
              {isSidebarOpen ? (
                <>
                  <ChevronLeft size={10} strokeWidth={3} />
                  <span>Collapse</span>
                </>
              ) : (
                <ChevronRight size={10} strokeWidth={3} />
              )}
            </button>
          )}
        </div>

        {/* Real-time Digital Clock Widget */}
        {(isSidebarOpen || isMobile) && (
          <div className={cn(
            "mb-4 px-3 py-2 rounded-2xl flex items-center justify-between border select-none shrink-0",
            isDarkMode 
              ? "bg-slate-950/40 border-white/5 text-slate-400" 
              : themeMode === 'peach'
                ? "bg-[#efe8d9]/50 border-[#dcd4c3] text-[#431407]/70"
                : "bg-slate-50 border-slate-100 text-slate-500"
          )}>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black uppercase tracking-wider opacity-60 leading-none">System Time</span>
              <span className="text-xs font-mono font-black mt-0.5 tracking-tight leading-none">
                {currentTime || '00:00:00'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Active</span>
            </div>
          </div>
        )}

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

        {/* BEGIN: User Profile Section */}
        {(isSidebarOpen || isMobile) ? (
          <div className={cn(
            "p-3 mt-auto flex items-center gap-3 mb-4 shrink-0 mx-1 border rounded-[22px]",
            isDarkMode 
              ? "bg-white/5 border-white/10 text-white" 
              : themeMode === 'peach'
                ? "bg-[#efe8d9]/50 border-[#dcd4c3] text-[#431407]"
                : "bg-slate-50 border-slate-200 text-slate-800"
          )} data-purpose="user-profile-card">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-800">
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
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a1b3a]"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className={cn(
                "font-sans font-bold text-sm leading-tight truncate",
                isDarkMode ? "text-white" : "text-slate-900"
              )}>
                {userName || 'Zwelakhe Hsuthu'}
              </span>
              <span className={cn(
                "text-[10px] font-bold font-sans truncate opacity-60",
                isDarkMode ? "text-white/60" : "text-slate-500"
              )}>
                {userRole === 'student' ? 'Level 12: Explorer' : userRole === 'parent' ? 'Level 24: Guardian' : 'Level 94: Master Tutor'}
              </span>
            </div>
          </div>
        ) : (
          /* Compact Avatar for Collapsed Sidebar */
          <div className="mt-auto flex justify-center shrink-0 mb-4">
            <div className="relative group cursor-pointer" title={`${userName || 'Zwelakhe Hsuthu'} (${userRole})`}>
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-800 hover:scale-105 transition-all duration-300">
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
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 border border-[#1a1b3a] rounded-full animate-pulse" />
            </div>
          </div>
        )}
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
              title="Home"
            >
              <Home size={18} />
            </button>
          </div>

          {/* Right Side: Profile dropdown, notifications, day/night & settings drawer */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden md:flex items-center mr-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                EduAI Space
              </span>
            </div>

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
                    
                    <div className="p-2 space-y-1 font-sans">
                      <button 
                        onClick={() => { changeTab('settings'); setIsProfileDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <Settings size={16} /> My Settings
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
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  </motion.div>
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
                          <option value="groq-gpt-oss">GPT OSS 120B (Groq Alternative)</option>
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
                          {['gemini', 'groq-gpt-oss', 'groq-qwen'].map((pId) => {
                            const lat = optimizationStats[pId];
                            const name = pId === 'gemini' ? 'Gemini' : pId === 'groq-gpt-oss' ? 'GPT OSS' : 'Qwen';
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
                  <div className={cn(
                    "relative rounded-[40px] p-8 lg:p-12 overflow-hidden text-white flex flex-col lg:flex-row lg:items-center lg:justify-between min-h-[260px] border shadow-2xl gap-8 mb-6 transition-all duration-300",
                    isDarkMode 
                      ? "glass-neon-card bg-[#0b1122]/75 border-brand-cyan/25" 
                      : themeMode === 'peach'
                        ? "bg-[#efe8d9]/95 border-[#dcd4c3] text-[#431407]"
                        : "bg-slate-900 border-slate-800 text-white"
                  )}>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
                      <GraduationCap size={200} className={cn(isDarkMode && "icon-glow-cyan text-brand-cyan")} />
                    </div>
                    {isDarkMode && (
                      <>
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-brand-cyan/15 blur-3xl pointer-events-none" />
                        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand-pink/15 blur-3xl pointer-events-none" />
                      </>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-slate-900/10 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 max-w-xl">
                      <div className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6 shadow-sm",
                        isDarkMode 
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 animate-pulse" 
                          : "border-[#dcd4c3] bg-[#efe8d9] text-[#431407]"
                      )}>
                        <Plus size={12} className="animate-pulse shrink-0" /> Localized South Africa DBE & CAPS
                      </div>
                      <h1 className={cn(
                        "text-3.5xl lg:text-5.5xl font-display font-black tracking-tight leading-tight mb-4 drop-shadow-md",
                        isDarkMode 
                          ? "text-white text-glow-cyan" 
                          : themeMode === 'peach' ? "text-[#431407]" : "text-white"
                      )}>
                        Teacher <span className={isDarkMode ? "text-brand-cyan text-glow-cyan" : "text-cyan-500"}>Console</span> 👩‍🏫
                      </h1>
                      <p className={cn(
                        "font-medium text-sm lg:text-base leading-relaxed",
                        isDarkMode ? "text-slate-300" : themeMode === 'peach' ? "text-[#431407]/80" : "text-slate-300"
                      )}>
                        Manage localized DBE classrooms, track continuous school-based assessments (SBA), and generate magic CAPS lesson templates in seconds.
                      </p>
                    </div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
                      <button 
                        onClick={() => {
                          setActiveCategory('content-creator-menu');
                          setActiveCreatorTab('teaching');
                          setActiveTab('teaching');
                        }}
                        className={cn(
                          "px-8 py-4 rounded-[30px] font-display font-black text-sm lg:text-base flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto cursor-pointer border-none outline-none shadow-lg",
                          isDarkMode 
                            ? "bg-emerald-500 hover:bg-emerald-400 text-[#0c1424] shadow-emerald-500/15" 
                            : "bg-[#00d2ff] hover:bg-cyan-400 text-slate-900 shadow-cyan-500/15"
                        )}
                      >
                        <Plus size={20} strokeWidth={3} /> Create Content!
                      </button>
                      <button 
                        onClick={() => setActiveTab('archive')}
                        className={cn(
                          "px-8 py-4 rounded-[30px] font-display font-bold text-sm lg:text-base transition-all w-full sm:w-auto flex justify-center items-center gap-2 cursor-pointer border",
                          isDarkMode 
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" 
                            : "bg-slate-800 hover:bg-slate-700 text-white border-transparent"
                        )}
                      >
                        View Archive
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Stats Panel & Live Progress Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-2 mb-8">
                    {/* Left: Dynamic Stats Panel */}
                    <div className="lg:col-span-4 h-full flex flex-col gap-4 justify-between">
                      {[
                        { label: 'Active Learners', value: '38', change: 'DBE Class 7-A', icon: Users, color: 'text-brand-cyan', bg: 'bg-cyan-500/10', displayColor: isDarkMode ? 'text-brand-cyan text-glow-cyan' : 'text-cyan-600', border: 'hover-neon-cyan' },
                        { label: 'SBA Grade Sheets', value: '142', change: 'Term 1 Complete', icon: ClipboardCheck, color: 'text-brand-pink', bg: 'bg-pink-500/10', displayColor: isDarkMode ? 'text-brand-pink text-glow-pink' : 'text-rose-600', border: 'hover-neon-pink' },
                        { label: 'CAPS Drafted', value: '47', change: '+12 This Week', icon: FileText, color: 'text-brand-yellow', bg: 'bg-yellow-500/10', displayColor: isDarkMode ? 'text-brand-yellow' : 'text-amber-600', border: 'hover-neon-yellow' },
                        { label: 'Active Tutoring', value: '24h', change: 'Continuous Sync', icon: MessageSquare, color: 'text-brand-green', bg: 'bg-green-500/10', displayColor: isDarkMode ? 'text-brand-green text-glow-green' : 'text-emerald-600', border: 'hover-neon-green' }
                      ].map((stat, i) => (
                        <div 
                          key={`stat-${i}`} 
                          className={cn(
                            "p-4 lg:p-5 rounded-[30px] transition-all duration-300 h-full flex items-center gap-3.5 border",
                            isDarkMode 
                              ? `glass-neon-card border-white/5 ${stat.border}` 
                              : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                          )}
                        >
                          <div className={cn(stat.color, `p-3 rounded-2xl ${stat.bg} shadow-md shrink-0`)}>
                            <stat.icon size={22} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className={cn(
                                "text-[10px] uppercase font-black tracking-[0.15em] truncate",
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              )}>
                                {stat.label}
                              </p>
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0",
                                isDarkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"
                              )}>
                                {stat.change}
                              </span>
                            </div>
                            <h3 className={`text-xl lg:text-2xl font-display font-black mt-0.5 tracking-tight ${stat.displayColor}`}>
                              {stat.value}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right: Live Recharts Classroom progress tracker */}
                    <div className={cn(
                      "p-6 lg:p-8 rounded-[36px] shadow-sm lg:col-span-8 h-full flex flex-col justify-between border",
                      isDarkMode ? "glass-neon-card border-brand-green/15 bg-[#0b1122]/50" : "bg-white border-slate-200"
                    )}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                          <span className={cn(
                            "text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg",
                            isDarkMode ? 'bg-brand-cyan/20 text-brand-cyan text-glow-cyan' : 'bg-cyan-100 text-cyan-700'
                          )}>
                            SBA Progress Trends (Term-over-Term)
                          </span>
                          <h4 className={cn(
                            "text-xl lg:text-2.5xl font-display font-black mt-2",
                            isDarkMode ? "text-white text-glow-cyan" : "text-slate-800"
                          )}>
                            Classroom Subject Aggregates
                          </h4>
                          <p className={cn(
                            "text-xs font-semibold mt-1",
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          )}>
                            Real-time average marks aggregated directly from student SBA scores (Mathematics, Natural Sciences, Languages).
                          </p>
                        </div>
                        <div className={cn(
                          "flex items-center gap-3 p-1.5 rounded-2xl border",
                          isDarkMode ? "bg-slate-950/40 border-white/5" : "bg-slate-50 border-slate-200 shadow-sm"
                        )}>
                          <span className={cn(
                            "text-xs font-black px-3 py-1 rounded-xl",
                            isDarkMode ? "bg-emerald-500/10 text-emerald-400 text-glow-green" : "bg-emerald-50/10 text-emerald-600"
                          )}>
                            Term 1 SBA View
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        {/* Term-over-Term Trend Chart */}
                        <div className="lg:col-span-2 min-h-[300px]">
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dashboardTermProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorMath" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSci" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2ed573" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#2ed573" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorLang" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#9b59b6" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#9b59b6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                              <XAxis 
                                dataKey="name" 
                                stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
                                fontSize={11} 
                                fontWeight="bold" 
                              />
                              <YAxis 
                                stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
                                fontSize={11} 
                                fontWeight="bold" 
                                domain={[0, 100]} 
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                                  borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                                  borderRadius: '16px',
                                  color: isDarkMode ? '#ffffff' : '#0f172a',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                  fontWeight: 'bold'
                                }} 
                              />
                              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }} />
                              <Area type="monotone" dataKey="Mathematics" stroke="#00d2ff" strokeWidth={3} fillOpacity={1} fill="url(#colorMath)" />
                              <Area type="monotone" dataKey="Sciences" stroke="#2ed573" strokeWidth={3} fillOpacity={1} fill="url(#colorSci)" />
                              <Area type="monotone" dataKey="Languages" stroke="#9b59b6" strokeWidth={3} fillOpacity={1} fill="url(#colorLang)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Current Term Subjects Average Performance List */}
                        <div className={cn(
                          "p-4 rounded-[28px] border flex flex-col justify-between",
                          isDarkMode ? "bg-slate-950/40 border-white/5" : "bg-slate-50 border-slate-100"
                        )}>
                          <div>
                            <h5 className={cn(
                              "text-sm font-display font-black mb-4",
                              isDarkMode ? "text-white" : "text-slate-700"
                            )}>
                              Subject Averages
                            </h5>
                            <div className="space-y-4">
                              {dashboardSubjectAverages.map((sub, idx) => {
                                const colors = [
                                  { text: isDarkMode ? 'text-brand-cyan text-glow-cyan' : 'text-brand-cyan', bg: 'bg-[#00d2ff]/10', bar: 'bg-[#00d2ff]' },
                                  { text: isDarkMode ? 'text-brand-green text-glow-green' : 'text-brand-green', bg: 'bg-[#2ed573]/10', bar: 'bg-[#2ed573]' },
                                  { text: isDarkMode ? 'text-[#9b59b6] text-glow-pink' : 'text-[#9b59b6]', bg: 'bg-[#9b59b6]/10', bar: 'bg-[#9b59b6]' }
                                ];
                                const itemColor = colors[idx % colors.length];

                                return (
                                  <div key={`subavg-${idx}`} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                      <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{sub.name}</span>
                                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider", itemColor.bg, itemColor.text)}>{sub.average}%</span>
                                    </div>
                                    <div className={`h-2.5 w-full rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} overflow-hidden`}>
                                      <div 
                                        className={`h-full rounded-full ${itemColor.bar} transition-all duration-1000`} 
                                        style={{ width: `${sub.average}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                              <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <p className={cn(
                                "text-[10px] font-black uppercase tracking-wider",
                                isDarkMode ? "text-emerald-400" : "text-emerald-700"
                              )}>
                                DBE Synced
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DBE South African Student Class Roster Section */}
                  <div className={cn(
                    "p-6 lg:p-8 rounded-[36px] border mb-8",
                    isDarkMode ? "glass-neon-card bg-[#0b1122]/50 border-white/5" : "bg-white border-slate-200 shadow-sm"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-cyan-500/10 text-[#00d2ff] rounded-lg">
                          Class List
                        </span>
                        <h3 className={cn("text-xl lg:text-2xl font-display font-black mt-1", isDarkMode ? "text-white" : "text-slate-900")}>
                          Continuous Assessment Grade Sheet
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-bold">
                          Monitor individual pupil marks, Term SBA sheets, and assign diagnostic remedial worksheets instantly.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setActiveTab('class-management')}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                            isDarkMode ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                          )}
                        >
                          Manage Class
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={cn("border-b text-[10px] uppercase font-black tracking-wider", isDarkMode ? "border-white/5 text-slate-400" : "border-slate-100 text-slate-500")}>
                            <th className="py-3 px-4">Learner</th>
                            <th className="py-3 px-4">Class</th>
                            <th className="py-3 px-4">Mathematics</th>
                            <th className="py-3 px-4">Natural Sciences</th>
                            <th className="py-3 px-4">Languages</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className={cn("text-xs font-semibold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                          {[
                            { name: "Sipho Nkosi", class: "Grade 7-A", math: "88%", sci: "84%", lang: "91%", color: "text-emerald-500 bg-emerald-500/10" },
                            { name: "Liezel de Wet", class: "Grade 7-A", math: "94%", sci: "92%", lang: "89%", color: "text-[#00d2ff] bg-[#00d2ff]/10" },
                            { name: "Thabo Mbeki", class: "Grade 7-B", math: "72%", sci: "78%", lang: "81%", color: "text-amber-500 bg-amber-500/10" },
                            { name: "Chantal Naidoo", class: "Grade 7-A", math: "64%", sci: "70%", lang: "75%", color: "text-rose-500 bg-rose-500/10" },
                            { name: "Muhammad Cassim", class: "Grade 7-B", math: "81%", sci: "85%", lang: "88%", color: "text-emerald-500 bg-emerald-500/10" }
                          ].map((stu, i) => (
                            <tr key={`stu-${i}`} className={cn("border-b hover:bg-slate-50/50 transition-all", isDarkMode ? "border-white/5 hover:bg-white/5" : "border-slate-100")}>
                              <td className="py-4 px-4 font-bold flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-300">
                                  {stu.name.split(' ').map(n=>n[0]).join('')}
                                </div>
                                <span className={isDarkMode ? "text-white" : "text-slate-900"}>{stu.name}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-black uppercase">
                                  {stu.class}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-mono font-black">{stu.math}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-mono font-black">{stu.sci}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-mono font-black">{stu.lang}</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      setActiveCategory('content-creator-menu');
                                      setActiveCreatorTab('teaching');
                                      setActiveTab('teaching');
                                      triggerToast(`Generating target CAPS lesson plan for ${stu.name}! 📚`, "info");
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-500 rounded-lg text-[10px] font-black uppercase border-none cursor-pointer transition-all"
                                  >
                                    Custom Lesson
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setActiveTab('reports');
                                      triggerToast(`Opening portfolio files for ${stu.name}! 📁`, "info");
                                    }}
                                    className="px-2.5 py-1.5 bg-[#00d2ff]/10 hover:bg-[#00d2ff]/25 text-[#00d2ff] rounded-lg text-[10px] font-black uppercase border-none cursor-pointer transition-all"
                                  >
                                    Portfolio
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Feature Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    <div className="lg:col-span-12">
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {[
                          { title: "Content Creator Studio", desc: "Lessons, Plans & Assessments.", color: 'text-brand-cyan', bg20: 'bg-cyan-500/20', border30: 'border-brand-cyan/20 hover:border-brand-cyan/70 hover:shadow-[0_0_15px_rgba(0,179,255,0.25)]', bg10: 'bg-cyan-500/10', icon: FlaskConical, id: 'teaching', glow: 'cyan' },
                          { title: "Content Archive", desc: "Posters, Cards & Displays.", color: 'text-[#9b59b6]', bg20: 'bg-purple-500/20', border30: 'border-brand-purple/20 hover:border-brand-purple/70 hover:shadow-[0_0_15px_rgba(155,89,182,0.25)]', bg10: 'bg-purple-500/10', icon: Archive, id: 'archive', glow: 'purple' },
                          { title: "Illustration Library", desc: "Store & reuse graphics.", color: 'bg-gradient-to-tr from-pink-400 to-rose-400 bg-clip-text text-transparent', bg20: 'bg-pink-500/20', border30: 'border-brand-pink/20 hover:border-brand-pink/70 hover:shadow-[0_0_15px_rgba(255,0,212,0.25)]', bg10: 'bg-pink-500/10', icon: Image, id: 'illustrations', glow: 'pink' },
                          { title: "AI Tutor", desc: "Interactive intelligence.", color: 'text-brand-yellow', bg20: 'bg-yellow-500/20', border30: 'border-brand-yellow/20 hover:border-brand-yellow/70 hover:shadow-[0_0_15px_rgba(250,204,21,0.25)]', bg10: 'bg-yellow-500/10', icon: Brain, id: 'ai-tutor', glow: 'yellow' },
                          { title: "Scan & Autograde", desc: "Automated vision grading.", color: 'text-brand-pink', bg20: 'bg-pink-500/20', border30: 'border-brand-pink/20 hover:border-brand-pink/70 hover:shadow-[0_0_15px_rgba(255,0,212,0.25)]', bg10: 'bg-pink-500/10', icon: Scan, id: 'ocr', glow: 'pink' },
                          { title: "Progress Reports", desc: "Track student performance.", color: 'text-orange-400', bg20: 'bg-orange-500/20', border30: 'border-orange-500/20 hover:border-orange-500/70 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)]', bg10: 'bg-orange-500/10', icon: TrendingUp, id: 'reports', glow: 'yellow' },
                          { title: "Communicator & Messenger", desc: "School connection hub.", color: 'text-indigo-400', bg20: 'bg-indigo-500/20', border30: 'border-indigo-500/20 hover:border-indigo-500/70 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]', bg10: 'bg-indigo-500/10', icon: MessageSquare, id: 'messenger', glow: 'cyan' },
                          { title: "Collaborative Workspace", desc: "Multiplayer workspace labs.", color: 'text-violet-400', bg20: 'bg-violet-500/20', border30: 'border-violet-500/20 hover:border-violet-500/70 hover:shadow-[0_0_15px_rgba(139,92,246,0.25)]', bg10: 'bg-violet-500/10', icon: Users, id: 'collaborative-workspace', glow: 'purple' },
                          { title: "Portfolios", desc: "Student work portfolio.", color: 'text-emerald-400', bg20: 'bg-emerald-500/20', border30: 'border-brand-green/20 hover:border-brand-green/70 hover:shadow-[0_0_15px_rgba(0,255,159,0.25)]', bg10: 'bg-emerald-500/10', icon: UserCircle, id: 'portfolios', glow: 'green' },
                          { title: "Class & Student Management", desc: "Manage your learners.", color: 'text-blue-400', bg20: 'bg-blue-500/20', border30: 'border-blue-500/20 hover:border-blue-500/70 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]', bg10: 'bg-blue-500/10', icon: Users, id: 'class-management', glow: 'cyan' },
                          { title: "Settings", desc: "Account & App preferences.", color: 'text-slate-400', bg20: 'bg-slate-500/20', border30: 'border-slate-500/20 hover:border-slate-400/70 hover:shadow-[0_0_15px_rgba(148,163,184,0.25)]', bg10: 'bg-slate-500/10', icon: Settings, id: 'settings', glow: 'cyan' },
                          { title: "Helpdesk", desc: "Technical Support & FAQ.", color: 'text-indigo-300', bg20: 'bg-indigo-400/20', border30: 'border-indigo-400/20 hover:border-indigo-400/70 hover:shadow-[0_0_15px_rgba(129,140,248,0.25)]', bg10: 'bg-indigo-400/10', icon: HelpCircle, id: 'helpdesk', glow: 'purple' },
                        ].map((item, i) => (
                          <button 
                            key={`feature-${item.id}-${i}`} 
                            onClick={() => {
                              if (['teaching', 'grade1'].includes(item.id)) {
                                setActiveCategory('content-creator-menu');
                                setActiveCreatorTab('teaching');
                                setActiveTab('teaching');
                              } else {
                                // Map feature key correctly to active categories
                                if (['reports', 'class-management', 'portfolios'].includes(item.id)) {
                                  setActiveCategory('teacher-dashboard-menu');
                                } else if (['archive', 'illustrations'].includes(item.id)) {
                                  setActiveCategory('content-archive-menu');
                                } else if (['ai-tutor', 'collaborative-workspace'].includes(item.id)) {
                                  setActiveCategory('tutoring-workspace-menu');
                                } else if (['ocr'].includes(item.id)) {
                                  setActiveCategory('autograde-vision-menu');
                                } else if (['settings', 'helpdesk'].includes(item.id)) {
                                  setActiveCategory('settings-menu');
                                }
                                setActiveTab(item.id);
                              }
                            }}
                            className={cn(
                              "group p-3.5 sm:p-6 lg:p-8 rounded-[20px] sm:rounded-[40px] transition-all text-left relative overflow-hidden backdrop-blur-xl hover:-translate-y-2 flex flex-col items-center sm:items-start text-center sm:text-left cursor-pointer border",
                              isDarkMode 
                                ? `glass-neon-card ${item.border30}` 
                                : "bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1"
                            )}
                          >
                            <div className={`w-11 h-11 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-[12px] sm:rounded-[24px] lg:rounded-[28px] flex items-center justify-center mb-2.5 sm:mb-4 lg:mb-6 ${item.bg20} border-2 sm:border-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'} ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                              <item.icon size={18} className={cn("sm:w-[32px] sm:h-[32px] lg:w-[40px] lg:h-[40px]", isDarkMode && `icon-glow-${item.glow}`)} strokeWidth={2} />
                            </div>
                            <h4 className={cn(
                              "text-xs sm:text-xl lg:text-2xl font-display font-black line-clamp-1 sm:line-clamp-none",
                              isDarkMode ? "text-white group-hover:text-glow-cyan" : "text-slate-800"
                            )}>{item.title}</h4>
                            <p className={`text-[10px] sm:text-xs lg:text-sm font-medium sm:font-bold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-none`}>{item.desc}</p>
                            
                            <div className={cn(
                              "absolute top-4 right-4 sm:top-6 sm:right-6 opacity-0 sm:group-hover:opacity-100 transition-all p-1.5 sm:p-2 rounded-full hidden sm:block",
                              item.color,
                              item.bg10
                            )}>
                              <ChevronRight size={16} strokeWidth={3} className="sm:w-[24px] sm:h-[24px]" />
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
                    <ProgressReports isDarkMode={isDarkMode} />
                  )
                ) : activeTab === 'class-management' ? (
                  <ClassManagement isDarkMode={isDarkMode} />
                ) : activeTab === 'ocr' ? (
                  <AutoGrading />
                ) : activeTab === 'archive' ? (
                  <ContentArchive />
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
