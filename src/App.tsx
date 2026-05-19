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
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import ParentDashboard from './components/ParentDashboard';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/Settings';
import Helpdesk from './components/Helpdesk';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, isDarkMode }: { icon: any, label: string, active?: boolean, onClick: () => void, collapsed: boolean, isDarkMode?: boolean }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`flex items-center ${collapsed ? 'justify-center w-12 h-12 mx-auto px-0 py-0' : 'w-full gap-3 px-3 py-2.5'} rounded-2xl transition-all duration-300 text-sm font-medium group ${
      active 
      ? `bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]` 
      : `${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`
    }`}
  >
    <Icon size={20} className={`${active ? 'text-brand-cyan' : `group-hover:${isDarkMode ? 'text-white' : 'text-slate-900'}`} transition-colors shrink-0`} />
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
);

const LandingPage = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0EA5E9] via-[#3B82F6] to-[#312E81] relative overflow-hidden flex flex-col font-sans">
      {/* Subtle Star Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Sparkles className="absolute top-20 left-10 text-white/20 w-8 h-8" />
        <Sparkles className="absolute top-40 right-20 text-white/20 w-12 h-12" />
        <Sparkles className="absolute bottom-1/3 left-1/4 text-white/10 w-6 h-6" />
        <Sparkles className="absolute top-1/2 right-1/4 text-white/10 w-10 h-10" />
      </div>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-24 px-6 lg:px-12 flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-hand tracking-wide text-white">
            EduAI <span className="text-yellow-400">Companion</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onEnter} className="text-white font-semibold hover:text-yellow-200 transition-colors">
            Sign In
          </button>
          <button 
            onClick={onEnter}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-yellow-400/20 active:scale-95"
          >
            Get Started
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md outline outline-1 outline-white/20 px-4 py-2 rounded-full mb-6 text-sm font-semibold text-white"
          >
             <Sparkles size={16} className="text-yellow-400" /> 
             The Smartest Way to Learn!
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-md"
          >
            Learning is an <br />
            <span className="text-yellow-400 relative inline-block">
              Adventure!
              <motion.svg 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                className="absolute -bottom-2 lg:-bottom-4 left-0 w-full h-4 lg:h-6 text-yellow-400" 
                viewBox="0 0 200 20" 
                preserveAspectRatio="none"
              >
                <path d="M0,10 Q25,20 50,10 T100,10 T150,10 T200,10" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </motion.svg>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg lg:text-xl text-blue-50/90 mb-10 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed drop-shadow-sm"
          >
            Magic lesson plans, super homework help, and your very own AI robot tutor! 🚀
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-yellow-400/30 active:scale-95 flex items-center justify-center gap-2"
            >
              Start My Adventure &rarr;
            </button>
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto bg-transparent border-2 border-white/30 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all backdrop-blur-md flex items-center justify-center"
            >
              Sign In
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Image / Illustration Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 relative w-full max-w-lg lg:max-w-none"
        >
          <div className="relative rounded-[40px] overflow-hidden shadow-2xl aspect-[4/5] sm:aspect-square lg:aspect-[4/5]">
             <img 
               src="https://i.ibb.co/CsvbkGYG/landing-image.jpg" 
               alt="Classroom adventure" 
               className="w-full h-full object-cover transition-opacity duration-500"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#3B82F6]/50 to-transparent pointer-events-none" />
          </div>
          
          {/* Floating Badge */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -bottom-6 -right-6 lg:bottom-10 lg:-right-10 w-32 h-32 lg:w-40 lg:h-40 bg-[#00BCD4] rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20 backdrop-blur-sm z-20"
          >
            <p className="text-white font-bold text-center text-sm lg:text-lg leading-tight">
              100% Fun <br/> Learning! 🎉
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">Your Super Powers! 🦸‍♂️</h2>
          <p className="text-lg text-blue-100 font-medium max-w-2xl mx-auto drop-shadow-sm">Everything you need to be a top student or a master teacher, all powered by magic AI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Magic Lessons", desc: "Create amazing lesson plans in a flash! Perfect for any subject.", icon: Zap, bg: "bg-orange-500/20 text-orange-400" },
            { title: "Super Worksheets", desc: "Fun worksheets and exercises that you'll actually love doing!", icon: Palette, bg: "bg-pink-500/20 text-pink-400" },
            { title: "Smart Bot Tutor", desc: "Ask your friendly AI tutor anything, anytime! It never sleeps.", icon: Brain, bg: "bg-blue-400/20 text-blue-400" },
            { title: "Instant Grades", desc: "Get your results and helpful tips right away. No more waiting!", icon: Sparkles, bg: "bg-yellow-400/20 text-yellow-400" },
            { title: "Skill Tracker", desc: "Watch your skills grow like a rocket ship! 🚀", icon: TrendingUp, bg: "bg-emerald-500/20 text-emerald-400" },
            { title: "Cool Posters", desc: "Make beautiful posters for your room or classroom.", icon: Image, bg: "bg-purple-500/20 text-purple-400" },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center hover:bg-white/20 transition-colors shadow-xl shadow-black/5"
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 ${feature.bg}`}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-blue-100/90 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <footer className="mt-auto px-6 lg:px-12 py-10 bg-[#1e1b4b]/50 border-t border-white/10 text-center lg:text-left flex flex-col lg:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
        <div className="flex items-center gap-2">
          <Logo className="w-5 h-5 grayscale opacity-50" />
          <span>EduAI <span className="text-yellow-400/50">Companion</span></span>
        </div>
        <p>© 2026 EduAI Companion. All rights reserved by Zwelakhe Msuthu - Owner & Developer</p>
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Dialog States
  const [activeCreatorTab, setActiveCreatorTab] = useState<string | null>(null);



  const changeTab = (newTab: string) => {
    setPreviousTabs(prev => [...prev, activeTab]);
    setActiveTab(newTab);
    setActiveCreatorTab(null);
  };

  const goBack = () => {
    setActiveCreatorTab(null);
    if (previousTabs.length > 0) {
      const newHistory = [...previousTabs];
      const prev = newHistory.pop();
      setPreviousTabs(newHistory);
      if (prev) setActiveTab(prev);
    } else {
      setActiveTab('dashboard');
    }
  };

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
    // Artificial splash delay
    const timer = setTimeout(() => {
      setIsRefreshing(false);
    }, 2500);
    return () => clearTimeout(timer);
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
        setShowLogin(false);
        setNeedsRoleSetup(true);
        setShowDashboard(true);
      }}
      onSignUpClick={() => {
        setShowLogin(false);
        setNeedsRoleSetup(true);
        setShowDashboard(true);
      }}
    />;
  }

  if (needsRoleSetup) {
    return <RoleSelection 
      onComplete={(role) => {
        setUserRole(role);
        setNeedsRoleSetup(false);
      }}
      onBack={() => {
        setShowDashboard(false);
        setNeedsRoleSetup(false);
      }}
    />;
  }

  return (
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

      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-[50]"
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
        className={`${isDarkMode ? 'bg-[#0B1122]' : 'bg-white shadow-xl'} border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200'} h-full flex flex-col ${isSidebarOpen || isMobile ? 'p-6' : 'py-6 px-3 lg:px-4'} fixed lg:relative shrink-0 z-[60] lg:z-40 overflow-hidden`}
      >
        <div className={`flex items-center ${isSidebarOpen || isMobile ? 'justify-between mb-10 px-2 min-w-[230px]' : 'justify-center mb-10 min-w-0'}`}>
          <div className={`flex items-center ${isSidebarOpen || isMobile ? 'gap-3' : 'justify-center w-full'}`}>
            <Logo />
            {(isSidebarOpen || isMobile) && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`font-hand text-2xl tracking-widest whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              >
                EduAI Companion
              </motion.h1>
            )}
          </div>
          {isMobile && (
            <button onClick={() => setMobileSidebarOpen(false)} className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}>
              <X size={24} />
            </button>
          )}
        </div>

        <nav className="flex-1 min-h-0 space-y-2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(function() {
            if (userRole === 'student') {
              return [
                { icon: LayoutDashboard, label: 'Dashboard', active: activeTab === 'dashboard' && activeCreatorTab === null, id: 'dashboard' },
                { icon: Brain, label: 'AI Tutor', active: activeTab === 'ai-tutor' && activeCreatorTab === null, id: 'ai-tutor' },
                { icon: ClipboardCheck, label: 'Practice & Exercises', active: activeTab === 'student-practice' && activeCreatorTab === null, id: 'student-practice' },
                { icon: BookOpen, label: 'Study Notes & Revision', active: activeTab === 'student-notes' && activeCreatorTab === null, id: 'student-notes' },
                { icon: TrendingUp, label: 'My Progress', active: activeTab === 'reports' && activeCreatorTab === null, id: 'reports' },
                { icon: UserCircle, label: 'My Portfolio', active: activeTab === 'portfolios' && activeCreatorTab === null, id: 'portfolios' },
                { icon: MessageSquare, label: 'Chat', active: activeTab === 'messenger' && activeCreatorTab === null, id: 'messenger' },
              ];
            }
            if (userRole === 'parent') {
              return [
                { icon: LayoutDashboard, label: 'Dashboard', active: activeTab === 'dashboard' && activeCreatorTab === null, id: 'dashboard' },
                { icon: TrendingUp, label: "Child's Progress", active: activeTab === 'reports' && activeCreatorTab === null, id: 'reports' },
                { icon: MessageSquare, label: 'Teacher Communicator', active: activeTab === 'messenger' && activeCreatorTab === null, id: 'messenger' },
                { icon: FileText, label: 'Assignments & Timetable', active: activeTab === 'portfolios' && activeCreatorTab === null, id: 'portfolios' },
              ];
            }
            if (userRole === 'admin') {
              return [
                { icon: LayoutDashboard, label: 'Dashboard', active: activeTab === 'dashboard' && activeCreatorTab === null, id: 'dashboard' },
                { icon: School, label: 'School Management', active: activeTab === 'class-management' && activeCreatorTab === null, id: 'class-management' },
                { icon: FileText, label: 'Official Correspondence', active: activeCreatorTab !== null, id: 'teaching' },
                { icon: Archive, label: 'Content Archive', active: activeTab === 'archive' && activeCreatorTab === null, id: 'archive' },
                { icon: TrendingUp, label: 'Reports & Analytics', active: activeTab === 'reports' && activeCreatorTab === null, id: 'reports' },
              ];
            }
            // default teacher
            return [
              { icon: LayoutDashboard, label: 'Dashboard', active: activeTab === 'dashboard' && activeCreatorTab === null, id: 'dashboard' },
              { icon: FlaskConical, label: 'Content Creator Studio', active: activeCreatorTab !== null, id: 'teaching' },
              { icon: Archive, label: 'Content Archive', active: activeTab === 'archive' && activeCreatorTab === null, id: 'archive' },
              { icon: Brain, label: 'AI Tutor', active: activeTab === 'ai-tutor' && activeCreatorTab === null, id: 'ai-tutor' },
              { icon: Scan, label: 'Scan & Autograde', active: activeTab === 'ocr' && activeCreatorTab === null, id: 'ocr' },
              { icon: TrendingUp, label: 'Progress Reports', active: activeTab === 'reports' && activeCreatorTab === null, id: 'reports' },
              { icon: MessageSquare, label: 'Communicator & Messenger', active: activeTab === 'messenger' && activeCreatorTab === null, id: 'messenger' },
              { icon: UserCircle, label: 'Portfolios', active: activeTab === 'portfolios' && activeCreatorTab === null, id: 'portfolios' },
              { icon: Users, label: 'Class & Student Management', active: activeTab === 'class-management' && activeCreatorTab === null, id: 'class-management' },
              { icon: Settings, label: 'Settings', active: activeTab === 'settings' && activeCreatorTab === null, id: 'settings' },
              { icon: HelpCircle, label: 'Helpdesk & Technical Support', active: activeTab === 'helpdesk' && activeCreatorTab === null, id: 'helpdesk' },
            ];
          })().map((item) => (
            <SidebarItem 
              key={item.id}
              icon={item.icon} 
              label={item.label} 
              active={item.active} 
              isDarkMode={isDarkMode}
              onClick={() => {
                if (['teaching', 'grade1'].includes(item.id)) {
                  setActiveCreatorTab(item.id);
                } else if (item.id === 'ai-tutor') {
                  changeTab('ai-tutor');
                } else if (item.id === 'ocr') {
                  changeTab('ocr');
                } else if (item.id === 'settings') {
                  changeTab('settings');
                } else if (item.id === 'helpdesk') {
                  changeTab('helpdesk');
                } else {
                  changeTab(item.id);
                }
                if (isMobile) setMobileSidebarOpen(false);
              }} 
              collapsed={!isSidebarOpen && !isMobile}
            />
          ))}
        </nav>

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
                <option value="gemini-imagen">IMG: Gemini Imagen 3</option>
                <option value="alibaba-qwen-image">IMG: Qwen-Image 2.0</option>
                <option value="huggingface">IMG: FLUX.1 (HF)</option>
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
                <option value="elevenlabs">TTS: ElevenLabs HD</option>
                <option value="huggingface">TTS: HuggingFace MMS</option>
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
              <option value="llama-primary">Llama 3.3 70B (Primary)</option>
              <option value="alibaba-qwen">Alibaba Qwen-Plus (Reasoning)</option>
              <option value="alibaba-deepseek">Alibaba DeepSeek V3 (Coding)</option>
              <option value="gemini">Gemini 3 Flash (Fallback)</option>
            </select>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-white/5 text-brand-yellow hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-all`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
                <div className={`flex flex-col md:flex-row justify-between items-center ${isDarkMode ? 'glass' : 'bg-white border border-slate-200 shadow-sm'} p-8 rounded-[36px] gap-6`}>
                  <div>
                    <h3 className={`text-4xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Teacher Console</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Manage and generate your educational resources.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveCreatorTab('teaching')}
                      className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Plus size={18} /> Content Creator Studio
                    </button>
                    <button 
                      onClick={() => setActiveTab('archive')}
                      className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] border ${isDarkMode ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-600'} transition-all`}
                    >
                       View Archive
                    </button>
                  </div>
                </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      {[
                        { label: 'Learners', value: '1,248', change: '+12%', icon: Users, color: 'text-brand-cyan', glow: 'shadow-cyan-500/20' },
                        { label: 'Graded', value: '432', change: '+5%', icon: ClipboardCheck, color: 'text-purple-400', glow: 'shadow-purple-500/20' },
                        { label: 'Generated', value: '86', change: '+24%', icon: FileText, color: 'text-brand-yellow', glow: 'shadow-yellow-500/20' },
                        { label: 'Sessions', value: '15.4k', change: '+18%', icon: MessageSquare, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' }
                      ].map((stat, i) => (
                        <div 
                          key={`stat-${i}`} 
                          className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200 shadow-sm'} p-5 lg:p-7 rounded-[28px] lg:rounded-[32px]`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.color} p-2 rounded-xl bg-white/5 border border-white/10 ${stat.glow} shadow-lg`}>
                              <stat.icon size={20} />
                            </div>
                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                              {stat.change}
                            </span>
                          </div>
                          <p className={`text-[9px] uppercase font-black tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                          <h3 className={`text-3xl lg:text-4xl font-hand mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
                        </div>
                      ))}
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                      <div className="lg:col-span-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                          {[
                            { title: "Content Creator Studio", desc: "Lessons, Plans & Assessments.", color: 'text-cyan-400', icon: FlaskConical, id: 'teaching' },
                            { title: "Content Archive", desc: "Posters, Cards & Displays.", color: 'text-purple-400', icon: Archive, id: 'archive' },
                            { title: "AI Tutor", desc: "Interactive intelligence.", color: 'text-brand-yellow', icon: Brain, id: 'ai-tutor' },
                            { title: "Scan & Autograde", desc: "Automated vision grading.", color: 'text-rose-400', icon: Scan, id: 'ocr' },
                            { title: "Progress Reports", desc: "Track student performance.", color: 'text-red-400', icon: TrendingUp, id: 'reports' },
                            { title: "Communicator & Messenger", desc: "School connection hub.", color: 'text-indigo-400', icon: MessageSquare, id: 'messenger' },
                            { title: "Portfolios", desc: "Student work portfolio.", color: 'text-amber-400', icon: UserCircle, id: 'portfolios' },
                            { title: "Class & Student Management", desc: "Manage your learners.", color: 'text-indigo-400', icon: Users, id: 'class-management' },
                            { title: "Settings", desc: "Account & App preferences.", color: 'text-slate-400', icon: Settings, id: 'settings' },
                            { title: "Helpdesk", desc: "Technical Support & FAQ.", color: 'text-blue-400', icon: HelpCircle, id: 'helpdesk' },
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
                              className={`group ${isDarkMode ? 'glass hover:bg-white/10' : 'bg-white border border-slate-200 hover:border-brand-cyan shadow-sm'} p-6 lg:p-8 rounded-[36px] lg:rounded-[42px] transition-all text-left relative overflow-hidden backdrop-blur-xl`}
                            >
                              <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-[20px] lg:rounded-[24px] flex items-center justify-center mb-4 lg:mb-6 bg-white/5 border border-white/10 ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                                <item.icon size={isMobile ? 26 : 32} />
                              </div>
                              <h4 className={`text-xl lg:text-2xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                              <p className={`text-[11px] lg:text-[12px] font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'} mt-1`}>{item.desc}</p>
                              
                              <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-all">
                                <Plus size={18} className={item.color} />
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
                  <ProgressReports />
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
                  />
                ) : activeTab === 'helpdesk' ? (
                  <Helpdesk isDarkMode={isDarkMode} />
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
    </div>
  );
}
