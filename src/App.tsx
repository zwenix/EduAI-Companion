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
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ContentCreator from './components/ContentCreator';
import Messenger from './components/Messenger';
import ProgressReports from './components/ProgressReports';
import AutoGrading from './components/AutoGrading';
import ContentArchive from './components/ContentArchive';
import AITutorPage from './components/AITutorPage';
import { SplashScreen } from './components/SplashScreen';
import RoleSelection from './components/RoleSelection';
import Logo from './components/Logo';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick: () => void, collapsed: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-medium group ${
      active 
      ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]' 
      : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={20} className={`${active ? 'text-brand-cyan' : 'group-hover:text-brand-cyan'} transition-colors`} />
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
);

const LandingPage = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-transparent to-purple-900/40 pointer-events-none"></div>
      
      {/* Navbar */}
      <nav className="h-20 px-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-hand text-2xl text-white tracking-widest">EduAI Companion</span>
        </div>
        <button 
          onClick={onEnter}
          className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl text-white mb-6 drop-shadow-2xl">
            Empowering <span className="text-brand-cyan">Education</span> <br /> 
            with <span className="text-brand-yellow underlined decoration-brand-yellow/30">Intelligence</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            The ultimate AI-powered toolkit for South African educators. Generate CAPS aligned materials, 
            grade with OCR, and engage with our interactive AI Tutor.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={onEnter}
              className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-cyan-500/30 active:scale-95"
            >
              Get Started Free
            </button>
            <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm transition-all backdrop-blur-md">
              View Curriculum
            </button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-6xl w-full">
          {[
            { title: "Content Studio", desc: "CAPS aligned in seconds", icon: BookOpen, color: "text-cyan-400" },
            { title: "AI Tutor", desc: "Interactive intelligence", icon: Brain, color: "text-purple-400" },
            { title: "OCR Grading", desc: "Instant paper analysis", icon: Scan, color: "text-yellow-400" },
            { title: "Assessments", desc: "Quizzes & Rubrics", icon: ClipboardCheck, color: "text-red-400" },
            { title: "Communicator", desc: "School connection hub", icon: MessageSquare, color: "text-indigo-400" },
            { title: "Progress Portal", desc: "Track student growth", icon: TrendingUp, color: "text-emerald-400" },
          ].map((card, i) => (
            <motion.div 
              key={`benefit-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="glass p-8 rounded-[32px] text-left group hover:bg-white/10 transition-all cursor-default"
            >
              <div className={`${card.color} mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon size={32} />
              </div>
              <h3 className="text-2xl text-white mb-2">{card.title}</h3>
              <p className="text-sm text-slate-500 tracking-tight">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <footer className="p-8 text-center text-slate-600 text-xs tracking-widest uppercase font-bold">
        © 2024 EduAI Terminal • CAPS Certified Engine
      </footer>
    </div>
  );
};

import { useAi, AIProvider as AIProviderType } from './contexts/AiContext';

export default function App() {
  const { provider, setProvider } = useAi();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Dialog States
  const [activeCreatorTab, setActiveCreatorTab] = useState<string | null>(null);

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

  if (!showDashboard) {
    return <LandingPage onEnter={() => {
      setNeedsRoleSetup(true);
      setShowDashboard(true);
    }} />;
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
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={`${isDarkMode ? 'bg-[#0B1122]' : 'bg-white shadow-xl'} border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200'} h-full flex flex-col p-6 relative shrink-0 z-40 transition-colors duration-500`}
      >
        <div className="flex items-center gap-3 mb-10 overflow-hidden px-2">
          <Logo />
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`font-hand text-2xl tracking-widest whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              EduAI Companion
            </motion.h1>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: activeTab === 'dashboard', id: 'dashboard' },
            { icon: FlaskConical, label: 'Content Creator Studio', active: activeCreatorTab !== null && activeTab === 'dashboard', id: 'teaching' },
            { icon: Users, label: 'Student & Class Management', active: activeTab === 'grade1', id: 'grade1' },
            { icon: TrendingUp, label: 'Progress Reports', active: activeTab === 'reports', id: 'reports' },
            { icon: Brain, label: 'AI Tutor', active: activeTab === 'ai-tutor', id: 'ai-tutor' },
            { icon: MessageSquare, label: 'Communicator & Messenger', active: activeTab === 'messenger', id: 'messenger' },
            { icon: Scan, label: 'OCR - Scan & Autograde', active: activeTab === 'ocr', id: 'ocr' },
            { icon: Archive, label: 'Content Archive', active: activeTab === 'archive', id: 'archive' },
            { icon: UserCircle, label: 'Portfolios', active: activeTab === 'portfolios', id: 'portfolios' },
          ].map((item) => (
            <SidebarItem 
              key={item.id}
              icon={item.icon} 
              label={item.label} 
              active={item.active} 
              onClick={() => {
                if (['teaching'].includes(item.id)) {
                  setActiveCreatorTab(item.id);
                } else if (item.id === 'ai-tutor') {
                  setActiveTab('ai-tutor');
                } else if (item.id === 'ocr') {
                  setActiveTab('ocr');
                } else {
                  setActiveTab(item.id);
                }
              }} 
              collapsed={!isSidebarOpen}
            />
          ))}
        </nav>

        <div className={`mt-auto pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'} space-y-2 overflow-hidden`}>
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            collapsed={!isSidebarOpen}
          />
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`w-full flex items-center justify-center p-3 rounded-2xl ${isDarkMode ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'} transition-colors`}
          >
            <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-[#0F172A]' : 'bg-slate-50'} transition-colors duration-500`}>
        {/* Header */}
        <header className={`h-20 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-200'} px-8 flex items-center justify-between shrink-0 relative z-20`}>
          <h2 className={`text-xl font-hand tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'} truncate max-w-lg`}>
            CAPS Project: <span className="text-brand-cyan underline decoration-brand-cyan/20">All Subjects</span>
          </h2>
          <div className="flex items-center gap-6">
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value as AIProviderType)}
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none transition-all ${
                isDarkMode 
                ? 'bg-white/5 border border-white/10 text-brand-cyan hover:border-brand-cyan/50 focus:border-brand-cyan' 
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-cyan focus:border-brand-cyan shadow-sm'
              }`}
            >
              <option value="gemini">Gemini (Default)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="groq">Groq (Speed)</option>
              <option value="mistral">Mistral</option>
              <option value="anthropic">Claude</option>
              <option value="fireworks">Fireworks</option>
            </select>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full ${isDarkMode ? 'bg-white/5 text-brand-yellow' : 'bg-slate-100 text-slate-600'} hover:scale-110 transition-all`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[14px] ${isDarkMode ? 'bg-slate-800 border border-white/5 shadow-2xl' : 'bg-white shadow-xl'} flex items-center justify-center text-sm font-black text-brand-cyan`}>
                ZW
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {activeTab === 'dashboard' ? (
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

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Learners', value: '1,248', change: '+12%', icon: Users, color: 'text-brand-cyan', glow: 'shadow-cyan-500/20' },
                    { label: 'Graded', value: '432', change: '+5%', icon: ClipboardCheck, color: 'text-purple-400', glow: 'shadow-purple-500/20' },
                    { label: 'Generated', value: '86', change: '+24%', icon: FileText, color: 'text-brand-yellow', glow: 'shadow-yellow-500/20' },
                    { label: 'Sessions', value: '15.4k', change: '+18%', icon: MessageSquare, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={`stat-${i}`} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200 shadow-sm'} p-7 rounded-[32px]`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`${stat.color} p-2.5 rounded-2xl bg-white/5 border border-white/10 ${stat.glow} shadow-lg`}>
                          <stat.icon size={22} />
                        </div>
                        <span className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">
                          {stat.change}
                        </span>
                      </div>
                      <p className={`text-[10px] uppercase font-black tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                      <h3 className={`text-4xl font-hand mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
                    </motion.div>
                  ))}
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { title: "Content Creator Studio", desc: "Lessons, Plans & Assessments.", color: 'text-cyan-400', icon: FlaskConical, id: 'teaching' },
                        { title: "Content Archive", desc: "Posters, Cards & Displays.", color: 'text-purple-400', icon: Archive, id: 'archive' },
                        { title: "AI Tutor", desc: "Interactive intelligence.", color: 'text-brand-yellow', icon: Brain, id: 'ai-tutor' },
                        { title: "Student & Class Management", desc: "Specialized Foundation tools.", color: 'text-emerald-400', icon: Users, id: 'grade1' },
                        { title: "OCR - Scan & Autograde", desc: "Automated vision grading.", color: 'text-rose-400', icon: Scan, id: 'ocr' },
                        { title: "Progress Reports", desc: "Track student performance.", color: 'text-red-400', icon: TrendingUp, id: 'reports' },
                        { title: "Communicator & Messenger", desc: "School connection hub.", color: 'text-indigo-400', icon: MessageSquare, id: 'messenger' },
                        { title: "Portfolios", desc: "Student work portfolio.", color: 'text-amber-400', icon: UserCircle, id: 'portfolios' },
                      ].map((item, i) => (
                        <button 
                          key={`feature-${item.id}-${i}`} 
                          onClick={() => {
                            if (['teaching'].includes(item.id)) {
                              setActiveCreatorTab(item.id);
                            } else {
                              setActiveTab(item.id);
                            }
                          }}
                          className={`group ${isDarkMode ? 'glass hover:bg-white/10' : 'bg-white border border-slate-200 hover:border-brand-cyan shadow-sm'} p-8 rounded-[42px] transition-all text-left relative overflow-hidden backdrop-blur-xl`}
                        >
                          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 bg-white/5 border border-white/10 ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                            <item.icon size={32} />
                          </div>
                          <h4 className={`text-2xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                          <p className={`text-[12px] font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'} mt-1`}>{item.desc}</p>
                          
                          <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-all">
                            <Plus size={20} className={item.color} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'messenger' ? (
              <Messenger />
            ) : activeTab === 'reports' ? (
              <ProgressReports />
            ) : activeTab === 'ocr' ? (
              <AutoGrading />
            ) : activeTab === 'archive' ? (
              <ContentArchive />
            ) : activeTab === 'ai-tutor' ? (
              <AITutorPage />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200 shadow-sm'} p-12 rounded-[48px] text-center min-h-[500px] flex flex-col items-center justify-center`}
              >
                <div className={`w-28 h-28 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'} rounded-[36px] flex items-center justify-center mb-8`}>
                  <Logo className="w-20 h-20" />
                </div>
                <h3 className={`text-4xl font-hand mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>System Offline</h3>
                <p className={`text-slate-500 max-w-sm mx-auto font-medium`}> This module is currently undergoing neural calibration. Please check back after the next CAPS update.</p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-10 bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-cyan-500/30 transition-all active:scale-95"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setActiveTab('ai-tutor')}
        className="fixed bottom-10 right-10 w-20 h-20 bg-brand-cyan rounded-[28px] text-navy-dark shadow-[0_20px_50px_rgba(6,182,212,0.3)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group border-4 border-navy-dark"
      >
        <MessageSquare size={28} className="group-hover:rotate-6 transition-transform" />
      </button>

      {/* App Components */}
      <AnimatePresence>
        {activeCreatorTab && (
          <ContentCreator 
            isOpen={!!activeCreatorTab} 
            initialTab={activeCreatorTab}
            onClose={() => setActiveCreatorTab(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
