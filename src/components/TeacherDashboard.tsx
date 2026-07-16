import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldAlert, 
  Bell, 
  BookOpen, 
  X, 
  Send,
  Star,
  Sparkles,
  Scan,
  ClipboardCheck,
  Plus,
  Compass,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Zap,
  LayoutGrid,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface TeacherDashboardProps {
  isDarkMode: boolean;
  onNavigate: (tabId: string, categoryId?: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface StudentNode {
  name: string;
  score: string;
  x: string;
  y: string;
  color: string;
  shadow: string;
  quest: string;
  status: string;
  avatar: string;
  completedMissions: number;
  recentAlert: string;
}

const studentsData: StudentNode[] = [
  { 
    name: 'Gerneath', 
    score: '500/30', 
    x: '10%', 
    y: '70%', 
    color: '#06b6d4', 
    shadow: 'rgba(6, 182, 212, 0.5)', 
    quest: 'Introduction to Fractions (CAPS Grade 4)', 
    status: 'In Progress', 
    avatar: '👽',
    completedMissions: 4,
    recentAlert: 'Needs help with denominators'
  },
  { 
    name: 'Merzona', 
    score: '500/50', 
    x: '25%', 
    y: '35%', 
    color: '#10b981', 
    shadow: 'rgba(16, 185, 129, 0.5)', 
    quest: 'Galactic Geometry (CAPS Grade 6)', 
    status: 'Mastered', 
    avatar: '🤖',
    completedMissions: 8,
    recentAlert: 'Perfect accuracy in angles'
  },
  { 
    name: 'Ratnolia', 
    score: '500/30', 
    x: '38%', 
    y: '82%', 
    color: '#3b82f6', 
    shadow: 'rgba(59, 130, 246, 0.5)', 
    quest: 'Nebula Division (CAPS Grade 5)', 
    status: 'Completed', 
    avatar: '🦊',
    completedMissions: 5,
    recentAlert: 'Speed bonus unlocked'
  },
  { 
    name: 'Chrisantha', 
    score: '500/30', 
    x: '45%', 
    y: '40%', 
    color: '#ec4899', 
    shadow: 'rgba(236, 72, 153, 0.5)', 
    quest: 'Star Grammar Voyage (CAPS Grade 3)', 
    status: 'Struggling', 
    avatar: '🦄',
    completedMissions: 3,
    recentAlert: 'Stuck on adjectives'
  },
  { 
    name: 'Sanila', 
    score: '500/30', 
    x: '55%', 
    y: '55%', 
    color: '#10b981', 
    shadow: 'rgba(16, 185, 129, 0.5)', 
    quest: 'Equations Rocketry (CAPS Grade 7)', 
    status: 'Active Now', 
    avatar: '🐱',
    completedMissions: 6,
    recentAlert: 'Streaming live data'
  },
  { 
    name: 'Anlantin', 
    score: '500/50', 
    x: '68%', 
    y: '25%', 
    color: '#f43f5e', 
    shadow: 'rgba(244, 63, 94, 0.5)', 
    quest: 'Atmospheric Physics (CAPS Grade 10)', 
    status: 'Completed', 
    avatar: '🦖',
    completedMissions: 7,
    recentAlert: 'Excellent simulation speed'
  },
  { 
    name: 'Maranetha', 
    score: '500/30', 
    x: '78%', 
    y: '72%', 
    color: '#14b8a6', 
    shadow: 'rgba(20, 184, 166, 0.5)', 
    quest: 'Creative Spelling (CAPS Grade 2)', 
    status: 'In Progress', 
    avatar: '🐼',
    completedMissions: 4,
    recentAlert: 'Active for 20 mins'
  },
  { 
    name: 'Linwirom', 
    score: '500/30', 
    x: '90%', 
    y: '45%', 
    color: '#ec4899', 
    shadow: 'rgba(236, 72, 153, 0.5)', 
    quest: 'Black Hole Coding (CAPS Grade 8)', 
    status: 'Completed', 
    avatar: '🐙',
    completedMissions: 9,
    recentAlert: 'Top of leaderboard'
  }
];

const capsPerformanceData = [
  { name: 'Term 1', 'Mathematics': 72, 'Natural Sciences': 78, 'Languages': 81 },
  { name: 'Term 2', 'Mathematics': 76, 'Natural Sciences': 84, 'Languages': 79 },
  { name: 'Term 3', 'Mathematics': 83, 'Natural Sciences': 80, 'Languages': 85 },
  { name: 'Term 4', 'Mathematics': 88, 'Natural Sciences': 89, 'Languages': 91 },
];

const studentEngagementData = [
  { name: 'Gerneath', completed: 4, active: 2, score: 75 },
  { name: 'Merzona', completed: 8, active: 1, score: 95 },
  { name: 'Ratnolia', completed: 5, active: 3, score: 80 },
  { name: 'Chrisantha', completed: 3, active: 4, score: 62 },
  { name: 'Sanila', completed: 6, active: 2, score: 88 },
  { name: 'Anlantin', completed: 7, active: 1, score: 90 },
  { name: 'Maranetha', completed: 4, active: 3, score: 71 },
  { name: 'Linwirom', completed: 9, active: 1, score: 98 },
];

export default function TeacherDashboard({ isDarkMode, onNavigate, triggerToast }: TeacherDashboardProps) {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentNode | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Stagger variants for entry animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 15 } }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setIsSending(true);
    try {
      const user = auth.currentUser;
      const userName = localStorage.getItem('eduai_user_name') || 'Commander Sarah';
      
      await addDoc(collection(db, 'notifications'), {
        title: '🚀 Galactic Transmission',
        message: `${userName}: "${broadcastMessage.trim()}"`,
        createdAt: serverTimestamp(),
        read: false,
        userId: user?.uid || 'broadcast',
        type: 'broadcast',
        senderName: userName
      });

      triggerToast('Emergency galactic transmission broadcasted successfully! 🛰️', 'success');
      setBroadcastMessage('');
      setIsBroadcastModalOpen(false);
    } catch (err: any) {
      console.error("Error sending broadcast:", err);
      triggerToast('Transmission failed to orbit. Please check your system link.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10 relative select-none p-2 md:p-4 min-h-screen pb-24"
    >
      {/* 1. Daily Overview Header & Cards */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-display font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
          <span>Daily Overview</span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: New Alerts */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.015 }}
            onClick={() => onNavigate('alerts')}
            className="relative p-6 rounded-[32px] border-2 border-pink-500/50 bg-[#0c1225]/85 shadow-[0_0_20px_rgba(236,72,153,0.25)] flex items-center gap-5 overflow-hidden transition-all duration-300 cursor-pointer group"
          >
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-500/10 blur-xl rounded-full" />
            
            {/* Neon Pink Icon Wrapper */}
            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border-2 border-pink-400 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.25)] shrink-0 group-hover:rotate-12 transition-transform">
              <ShieldAlert size={28} className="drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white font-display leading-tight">
                  New Alerts
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-[9px] text-pink-300 font-bold animate-pulse">
                  ATP Warn
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug font-medium">
                Address critical CAPS curriculum warnings and active student learning flags in real-time.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Content Factory */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.015 }}
            onClick={() => onNavigate('edu-tools-hub')}
            className="relative p-6 rounded-[32px] border-2 border-[#a855f7]/60 bg-[#0c1225]/85 shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center gap-5 overflow-hidden transition-all duration-300 cursor-pointer group"
          >
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#a855f7]/10 blur-xl rounded-full" />
            
            {/* Neon Violet Icon Wrapper */}
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border-2 border-purple-400 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles size={28} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white font-display leading-tight">
                  Content Factory
                </h3>
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 leading-snug font-medium">
                Access the Edu-Tools Hub to generate customized CAPS-aligned lesson plans, rubrics, and diagnostic materials.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Magic Library */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.015 }}
            onClick={() => onNavigate('archive', 'lesson-planning')}
            className="relative p-6 rounded-[32px] border-2 border-cyan-500/50 bg-[#0c1225]/85 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-5 overflow-hidden transition-all duration-300 cursor-pointer group"
          >
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-cyan-500/10 blur-xl rounded-full" />
            
            {/* Neon Cyan Icon Wrapper */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0 group-hover:rotate-6 transition-transform">
              <BookOpen size={28} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-white font-display leading-tight">
                Magic Library
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug font-medium">
                Curate and explore your stored history of CAPS-compliant classroom activities and lesson guides.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. Class Galaxy Header & Main Constellation Map */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-display font-black tracking-widest text-cyan-400 uppercase">
          Class Galaxy
        </h2>

        {/* Wide Constellation Panel */}
        <div className="relative w-full rounded-[40px] border border-white/10 bg-[#0d1225]/45 backdrop-blur-md overflow-hidden shadow-2xl">
          
          {/* Constellation Inner Space BG */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#060a16] via-[#090f23] to-[#03050c] -z-10" />
          
          {/* Grid lines inside galaxy box */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Interactive Responsive Wrapper */}
          <div className="overflow-x-auto custom-scrollbar relative py-12 px-6">
            <div className="min-w-[950px] h-[380px] relative">
              
              {/* Backing Curvy Route Path SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 380" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="orbitPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="25%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="75%" stopColor="#ec4899" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Dotted futuristic wave connector */}
                <path 
                  d="M 100,266 C 200,160 210,133 250,133 C 300,133 340,320 380,311 C 410,300 420,180 450,152 C 480,120 520,220 550,209 C 580,195 650,85 680,95 C 720,110 750,285 780,273 C 820,250 870,180 900,171" 
                  fill="none" 
                  stroke="url(#orbitPathGrad)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeDasharray="4,8"
                  filter="url(#glowFilter)"
                  className="animate-pulse"
                />

                <path 
                  d="M 100,266 C 200,160 210,133 250,133 C 300,133 340,320 380,311 C 410,300 420,180 450,152 C 480,120 520,220 550,209 C 580,195 650,85 680,95 C 720,110 750,285 780,273 C 820,250 870,180 900,171" 
                  fill="none" 
                  stroke="url(#orbitPathGrad)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>

              {/* Floating Galaxy Swirl Background Overlays */}
              {/* Swirl 1 - Left */}
              <div className="absolute left-[30%] top-[60%] w-40 h-40 pointer-events-none opacity-40">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-2xl" />
                <svg className="w-full h-full animate-spin" style={{ animationDuration: '30s' }} viewBox="0 0 100 100">
                  <ellipse cx="50" cy="50" rx="40" ry="12" fill="none" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="1.5" transform="rotate(-25 50 50)" />
                  <ellipse cx="50" cy="50" rx="25" ry="6" fill="none" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1" transform="rotate(-25 50 50)" />
                </svg>
              </div>

              {/* Swirl 2 - Right */}
              <div className="absolute left-[65%] top-[10%] w-48 h-48 pointer-events-none opacity-45">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
                <svg className="w-full h-full animate-spin" style={{ animationDuration: '35s' }} viewBox="0 0 100 100">
                  <ellipse cx="50" cy="50" rx="44" ry="16" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" transform="rotate(35 50 50)" />
                  <ellipse cx="50" cy="50" rx="28" ry="8" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" transform="rotate(35 50 50)" />
                </svg>
              </div>

              {/* Interactive Student Stars along the Orbit Path */}
              {studentsData.map((student) => {
                const isCenterSanila = student.name === 'Sanila';
                
                return (
                  <motion.div
                    key={student.name}
                    style={{ left: student.x, top: student.y }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer flex flex-col items-center"
                    whileHover={{ scale: 1.15 }}
                    onClick={() => setSelectedStudent(student)}
                  >
                    {/* Outer glowing pulsing aura */}
                    <div className="absolute -inset-4 rounded-full bg-white/0 group-hover:bg-white/5 transition-all duration-300" />
                    
                    <div className="relative">
                      {/* Ambient color burst glow behind each star */}
                      <div 
                        className="absolute -inset-2 rounded-full blur-[10px] opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"
                        style={{ backgroundColor: student.color }}
                      />
                      
                      {/* Beautiful glowing star */}
                      <Star 
                        size={isCenterSanila ? 40 : 28} 
                        fill={student.color} 
                        className="relative transition-all duration-300"
                        style={{ 
                          color: student.color,
                          filter: `drop-shadow(0 0 10px ${student.color})`
                        }} 
                      />
                    </div>

                    {/* Student Metadata Tag */}
                    <div className="mt-3 text-center pointer-events-none">
                      <span className="block text-xs font-black tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                        {student.name}
                      </span>
                      <span className="block text-[9px] font-bold text-slate-400 mt-0.5 tracking-wider">
                        {student.score}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Float-in Detailed Profile Card when student is clicked */}
              <AnimatePresence>
                {selectedStudent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 12 }}
                    className="absolute z-20 top-2 left-2 max-w-sm rounded-3xl border-2 border-cyan-500/40 bg-[#0d1225]/95 backdrop-blur-md p-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col gap-3.5 text-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3.5">
                        <span className="text-4xl">{selectedStudent.avatar}</span>
                        <div>
                          <h4 className="text-sm font-black text-white">{selectedStudent.name}</h4>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{selectedStudent.status}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedStudent(null)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    <div className="space-y-2.5 border-t border-white/10 pt-3 text-xs font-semibold">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Active Module:</span>
                        <span className="text-white text-right truncate max-w-[170px]">{selectedStudent.quest}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Milestones:</span>
                        <span className="text-white">{selectedStudent.completedMissions} / 10 Completed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Alert Log:</span>
                        <span className="text-amber-400">{selectedStudent.recentAlert}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5 pt-2">
                      <button 
                        onClick={() => {
                          triggerToast(`Awarded motivational star to ${selectedStudent.name}! ⭐`, 'success');
                          setSelectedStudent(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border-2 border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Reward Star
                      </button>
                      <button 
                        onClick={() => {
                          onNavigate('teaching', 'content-creator-menu');
                          setSelectedStudent(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border-2 border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Assign Quest
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </motion.div>

      {/* 2.5. Academic Command Center & Insights */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <h2 className="text-xl font-display font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
            <span>Academic Command Center & Insights</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase text-cyan-300 font-mono tracking-wider">
              Live Metrics
            </span>
          </h2>
          <p className="text-slate-400 text-xs font-semibold">
            Track real-time CAPS milestones and syllabus pacing metrics.
          </p>
        </div>

        {/* Graphs Container Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: CAPS Performance Trends */}
          <div className="p-6 rounded-[32px] border border-white/10 bg-[#0d1225]/70 backdrop-blur-md shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white font-display uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp size={16} className="text-cyan-400" />
                  <span>Syllabus Performance Trends</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Average grade achievements across active learning domains.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                CAPS Compliant
              </span>
            </div>

            {/* Recharts AreaChart */}
            <div className="h-[260px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={capsPerformanceData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMath" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScience" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity="0.4"/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLanguage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity="0.4"/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    domain={[50, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0c1225', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Mathematics" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorMath)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Natural Sciences" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorScience)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Languages" 
                    stroke="#ec4899" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorLanguage)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend Labels */}
            <div className="flex items-center justify-center gap-5 pt-1.5 border-t border-white/5 text-[10px] font-black uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Mathematics</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Natural Sciences</span>
              </div>
              <div className="flex items-center gap-1.5 text-pink-400">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                <span>Languages</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Student Quest Engagement Metrics */}
          <div className="p-6 rounded-[32px] border border-white/10 bg-[#0d1225]/70 backdrop-blur-md shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white font-display uppercase tracking-wide flex items-center gap-2">
                  <UserCheck size={16} className="text-purple-400" />
                  <span>Cadet Milestone Pacing</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Count of completed missions versus active quests per cadet.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                Engagement Sync
              </span>
            </div>

            {/* Recharts BarChart */}
            <div className="h-[260px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={studentEngagementData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0c1225', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="active" fill="#ec4899" radius={[4, 4, 0, 0]} name="Active" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend Labels */}
            <div className="flex items-center justify-center gap-5 pt-1.5 border-t border-white/5 text-[10px] font-black uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span>Completed Missions</span>
              </div>
              <div className="flex items-center gap-1.5 text-pink-400">
                <span className="w-2.5 h-2.5 rounded bg-pink-500" />
                <span>Active Quests</span>
              </div>
            </div>
          </div>

        </div>

        {/* Shortcuts Action Deck Grid */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-display font-black tracking-widest text-purple-400 uppercase flex items-center gap-1.5">
            <Zap size={14} className="animate-bounce" />
            <span>Teacher Shortcuts Deck</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Shortcut 1: CAPS Creator Studio */}
            <button
              onClick={() => {
                onNavigate('teaching', 'lesson-planning');
                triggerToast('Opening CAPS Lesson Creator Studio...', 'info');
              }}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/35 hover:bg-[#0c1225]/80 transition-all text-left flex flex-col justify-between h-32 group cursor-pointer"
            >
              <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/15 group-hover:scale-105 transition-transform shrink-0 self-start">
                <Sparkles size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                  CAPS Creator Studio
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Design magical, fully-aligned unit maps and step guides.
                </p>
              </div>
            </button>

            {/* Shortcut 2: Classroom Manager */}
            <button
              onClick={() => {
                onNavigate('class-management', 'class-management');
                triggerToast('Opening Classrooms Manager...', 'info');
              }}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/35 hover:bg-[#0c1225]/80 transition-all text-left flex flex-col justify-between h-32 group cursor-pointer"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15 group-hover:scale-105 transition-transform shrink-0 self-start">
                <UserCheck size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                  Classroom Manager
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Manage portfolios, reward achievements, and track marks.
                </p>
              </div>
            </button>

            {/* Shortcut 3: Grading Lab */}
            <button
              onClick={() => {
                onNavigate('ocr', 'intelligence-ai');
                triggerToast('Launching Teacher\'s Auto-Grading Lab...', 'info');
              }}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-pink-500/35 hover:bg-[#0c1225]/80 transition-all text-left flex flex-col justify-between h-32 group cursor-pointer"
            >
              <div className="p-2 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/15 group-hover:scale-105 transition-transform shrink-0 self-start">
                <Scan size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">
                  Grading Lab (OCR)
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Scan physical assessments with immediate digital scores.
                </p>
              </div>
            </button>

            {/* Shortcut 4: Orbital Broadcast */}
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-purple-500/35 hover:bg-[#0c1225]/80 transition-all text-left flex flex-col justify-between h-32 group cursor-pointer"
            >
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/15 group-hover:scale-105 transition-transform shrink-0 self-start">
                <Bell size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">
                  Orbital Broadcast
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Send live announcements directly to all cadet modules.
                </p>
              </div>
            </button>

          </div>
        </div>
      </motion.div>

      {/* Futuristic glowing wave curves at the bottom of the landing page */}
      <div className="absolute bottom-0 left-0 w-full h-40 pointer-events-none overflow-hidden -z-20">
        <svg className="absolute bottom-0 left-0 w-[150%] h-48 pointer-events-none opacity-70" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cyberWaveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="65%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cyberWaveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="25%" stopColor="#ec4899" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d="M 0,160 Q 360,70 720,160 T 1440,160" 
            fill="none" 
            stroke="url(#cyberWaveGrad1)" 
            strokeWidth="4" 
            className="animate-pulse"
          />
          <path 
            d="M 0,135 Q 300,195 700,90 T 1440,135" 
            fill="none" 
            stroke="url(#cyberWaveGrad2)" 
            strokeWidth="3" 
            opacity="0.8"
          />
        </svg>
      </div>

      {/* 3. Global Broadcast Overlay Modal */}
      <AnimatePresence>
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsBroadcastModalOpen(false)}
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-[32px] p-6 border-2 border-pink-500/40 bg-slate-900/95 shadow-[0_0_30px_rgba(236,72,153,0.3)] relative z-10 text-white"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl border border-pink-500/20">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-display font-black">Global Broadcast</h4>
                  <p className="text-xs text-slate-400">
                    Send an emergency orbital broadcast to all cadets.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 text-slate-400">
                    Transmission Message
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="E.g. Attention Cadets! Prepare for the Fractions module exploration launch tomorrow morning at 08:00 UTC."
                    required
                    rows={4}
                    className="w-full rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 bg-slate-950 border border-white/10 text-white resize-none transition-all"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white/5 hover:bg-white/10 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !broadcastMessage.trim()}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer text-white",
                      isSending || !broadcastMessage.trim() 
                        ? "bg-slate-700 opacity-50 cursor-not-allowed" 
                        : "bg-pink-500 hover:bg-pink-600 shadow-md shadow-pink-500/20 active:scale-95"
                    )}
                  >
                    <Send size={12} />
                    <span>{isSending ? 'Sending...' : 'Broadcast'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Highly Polished Glowing Floating 'Quick Actions' FAB Menu */}
      <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3.5">
        
        {/* Expanded Actions Stack */}
        <AnimatePresence>
          {isQuickActionsOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              className="flex flex-col gap-3.5 items-end mb-1"
            >
              {/* Action 1: Generate Lesson */}
              <motion.button
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onNavigate('teaching', 'lesson-planning');
                  triggerToast('Opening CAPS Content Creator Studio...', 'info');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0d1225]/95 border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] text-white text-xs font-black tracking-wide uppercase group cursor-pointer"
              >
                <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:rotate-12 transition-transform">
                  <Sparkles size={14} />
                </div>
                <span>Generate Lesson</span>
              </motion.button>

              {/* Action 2: Scan Paper */}
              <motion.button
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onNavigate('ocr', 'intelligence-ai');
                  triggerToast('Launching Teacher\'s Auto-Grading Lab...', 'info');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0d1225]/95 border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white text-xs font-black tracking-wide uppercase group cursor-pointer"
              >
                <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Scan size={14} />
                </div>
                <span>Scan Paper</span>
              </motion.button>

              {/* Action 3: Assign Homework */}
              <motion.button
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onNavigate('class-management', 'class-management');
                  triggerToast('Opening Classrooms Manager to assign homework...', 'info');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0d1225]/95 border-2 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)] text-white text-xs font-black tracking-wide uppercase group cursor-pointer"
              >
                <div className="p-1.5 rounded-xl bg-pink-500/15 text-pink-400 group-hover:-rotate-12 transition-transform">
                  <ClipboardCheck size={14} />
                </div>
                <span>Assign Homework</span>
              </motion.button>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Floating Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: isQuickActionsOpen ? 90 : 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-2xl cursor-pointer relative z-50 text-white transition-colors duration-300",
            isQuickActionsOpen
              ? "bg-pink-500 border-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.5)]"
              : "bg-cyan-500 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)]"
          )}
          title="Quick Actions Command"
        >
          {isQuickActionsOpen ? <X size={24} /> : <Plus size={24} />}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </motion.button>

      </div>

    </motion.div>
  );
}
