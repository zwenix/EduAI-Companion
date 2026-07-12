import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// ==========================================
// Hand-crafted High-Contrast Inline SVG Icons
// ==========================================

const PlusIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SparklesIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" />
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
  </svg>
);

const MegaphoneIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 11h3a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    <path d="M8 12h9.4a2 2 0 0 1 1.7 1l2.4 4.1a1 1 0 0 1-.8 1.5H11.6" />
    <path d="M12.4 12V4.1a1 1 0 0 1 1.6-.8l4.1 3.5a2 2 0 0 1 .1 3" />
  </svg>
);

const TrendingUpIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ChevronRightIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const BellIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const CheckCircleIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertTriangleIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CalendarIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserPlusIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const BlocksIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const LibraryIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m16 6 4 14" />
    <path d="M12 6v14" />
    <path d="M8 8v12" />
    <path d="M4 4v16" />
  </svg>
);

const UsersIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TrophyIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
  </svg>
);

const XIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const RocketIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 3.5-2 3.5s2.24-.5 3.5-2" />
    <path d="M12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    <path d="M19 5c-2.43 2.43-3.8 5.8-4.43 7.57-.63 1.77-2.12 3.26-3.89 3.89-1.77.63-5.14 2-7.57 4.43" />
    <path d="m10 6 2 2" />
    <path d="m14 10 2 2" />
    <path d="M15 9h.01" />
  </svg>
);

// ==========================================
// Component Definition
// ==========================================

interface TeacherDashboardProps {
  isDarkMode: boolean;
  onNavigate: (tabId: string, categoryId?: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function TeacherDashboard({ isDarkMode, onNavigate, triggerToast }: TeacherDashboardProps) {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Handle Global Broadcast sending to Firestore notifications
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setIsSending(true);
    try {
      const user = auth.currentUser;
      const userName = localStorage.getItem('eduai_user_name') || 'Commander Sarah';
      
      // We will create a notification for students or parent channels
      await addDoc(collection(db, 'notifications'), {
        title: '🚀 Galactic Transmission',
        message: `${userName}: "${broadcastMessage.trim()}"`,
        createdAt: serverTimestamp(),
        read: false,
        userId: user?.uid || 'broadcast', // Global or teacher's associated class
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
    <div className={cn("space-y-8 select-none transition-all duration-300", !isDarkMode && "text-slate-800")}>
      
      {/* 1. Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-[28px] p-6 lg:p-8 overflow-hidden border shadow-2xl transition-all duration-300",
          isDarkMode 
            ? "bg-[#0b1122]/90 border-white/5 shadow-cyan-500/5 text-white" 
            : "bg-white border-slate-200 text-slate-800 shadow-lg shadow-slate-100"
        )}
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none hidden md:block">
          <RocketIcon size={120} className={cn(isDarkMode && "text-brand-cyan")} />
        </div>
        <div className="relative z-10">
          <h2 className={cn(
            "text-xl lg:text-2xl font-display font-black tracking-tight mb-2",
            isDarkMode ? "text-white" : "text-slate-900"
          )}>
            Good morning, Commander!
          </h2>
          <p className={cn(
            "text-xs lg:text-sm leading-relaxed max-w-2xl font-semibold",
            isDarkMode ? "text-slate-400" : "text-slate-600"
          )}>
            The Voyager Class is performing at <span className={cn("font-black text-emerald-400 text-glow-green", !isDarkMode && "text-emerald-600")}>92% efficiency</span>. 4 new missions are ready for deployment today.
          </p>
        </div>
      </motion.div>

      {/* 2. Primary Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Create New Lesson */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          onClick={() => onNavigate('teaching', 'content-creator-menu')}
          className={cn(
            "p-6 rounded-[28px] border cursor-pointer transition-all duration-300 relative group overflow-hidden",
            isDarkMode 
              ? "bg-[#0b1122]/80 border-emerald-500/25 hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] text-white" 
              : "bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-lg text-slate-800"
          )}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-transform group-hover:scale-110",
              isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                : "bg-emerald-50 border-emerald-200 text-emerald-600"
            )}>
              <PlusIcon size={24} />
            </div>
            <div>
              <h3 className={cn("text-base lg:text-lg font-display font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                Create New Lesson
              </h3>
            </div>
          </div>
          <p className={cn(
            "text-xs font-semibold leading-relaxed",
            isDarkMode ? "text-slate-400" : "text-slate-500"
          )}>
            Forge a new educational quest with AI-powered assets.
          </p>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
            <ChevronRightIcon size={18} />
          </div>
        </motion.div>

        {/* Auto-Grade */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          onClick={() => onNavigate('ocr', 'intelligence-ai')}
          className={cn(
            "p-6 rounded-[28px] border cursor-pointer transition-all duration-300 relative group overflow-hidden",
            isDarkMode 
              ? "bg-[#0b1122]/80 border-cyan-500/25 hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] text-white" 
              : "bg-white border-slate-200 hover:border-cyan-500/50 hover:shadow-lg text-slate-800"
          )}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-transform group-hover:scale-110",
              isDarkMode 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                : "bg-cyan-50 border-cyan-200 text-cyan-600"
            )}>
              <SparklesIcon size={22} />
            </div>
            <div>
              <h3 className={cn("text-base lg:text-lg font-display font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                Auto-Grade
              </h3>
            </div>
          </div>
          <p className={cn(
            "text-xs font-semibold leading-relaxed",
            isDarkMode ? "text-slate-400" : "text-slate-500"
          )}>
            Instantly process mission results and provide feedback.
          </p>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500">
            <ChevronRightIcon size={18} />
          </div>
        </motion.div>

        {/* Global Broadcast */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          onClick={() => setIsBroadcastModalOpen(true)}
          className={cn(
            "p-6 rounded-[28px] border cursor-pointer transition-all duration-300 relative group overflow-hidden",
            isDarkMode 
              ? "bg-[#0b1122]/80 border-pink-500/25 hover:border-pink-500/60 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] text-white" 
              : "bg-white border-slate-200 hover:border-pink-500/50 hover:shadow-lg text-slate-800"
          )}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-transform group-hover:scale-110",
              isDarkMode 
                ? "bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]" 
                : "bg-pink-50 border-pink-200 text-pink-600"
            )}>
              <MegaphoneIcon size={22} />
            </div>
            <div>
              <h3 className={cn("text-base lg:text-lg font-display font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                Global Broadcast
              </h3>
            </div>
          </div>
          <p className={cn(
            "text-xs font-semibold leading-relaxed",
            isDarkMode ? "text-slate-400" : "text-slate-500"
          )}>
            Send an emergency transmission to all class members.
          </p>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-pink-500">
            <ChevronRightIcon size={18} />
          </div>
        </motion.div>
      </div>

      {/* 3. Main Split View Grid (Left: Charts/Map, Right: Alerts & Shortcuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Class Pulse & Progress Map */}
        <div className="lg:col-span-7 space-y-8 flex flex-col justify-between animate-fade-in">
          
          {/* Class Pulse Chart */}
          <div className={cn(
            "p-6 lg:p-8 rounded-[28px] border flex flex-col h-[320px] justify-between shadow-sm transition-all duration-300",
            isDarkMode ? "bg-[#0b1122]/60 border-white/5" : "bg-white border-slate-200"
          )}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <TrendingUpIcon size={18} className={cn(isDarkMode ? "text-brand-cyan" : "text-cyan-500")} />
                <h4 className={cn("text-base lg:text-lg font-display font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                  Class Pulse
                </h4>
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                isDarkMode ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"
              )}>
                DAILY VIEW
              </span>
            </div>

            {/* Custom Bar Columns to perfectly recreate the image */}
            <div className="flex-1 flex items-end justify-between px-2 lg:px-4 gap-3 lg:gap-5 h-full">
              {[
                { label: 'Mon', h: '40%', active: false },
                { label: 'Tue', h: '55%', active: false },
                { label: 'Wed', h: '90%', active: true }, // Wed is highlighted in the screenshot
                { label: 'Thu', h: '50%', active: false },
                { label: 'Fri', h: '70%', active: false },
                { label: 'Sat', h: '35%', active: false },
                { label: 'Sun', h: '45%', active: false }
              ].map((bar, i) => (
                <div key={`pulse-${i}`} className="flex-1 flex flex-col items-center h-full justify-end gap-2 group cursor-pointer">
                  {/* The bar container */}
                  <div className="w-full relative h-full flex items-end rounded-full overflow-visible">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: bar.h }}
                      transition={{ type: 'spring', damping: 15, delay: i * 0.05 }}
                      className={cn(
                        "w-full rounded-t-2xl rounded-b-md transition-all duration-300 relative",
                        bar.active 
                          ? (isDarkMode 
                              ? "bg-gradient-to-t from-cyan-600/20 via-cyan-500/60 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] border-t border-cyan-300" 
                              : "bg-cyan-500 shadow-lg shadow-cyan-500/20")
                          : (isDarkMode 
                              ? "bg-gradient-to-t from-[#0e172e] to-slate-800 border border-white/5 hover:border-white/10" 
                              : "bg-slate-100 hover:bg-slate-200")
                      )}
                    >
                      {/* Active glowing cap */}
                      {bar.active && isDarkMode && (
                        <span className="absolute -top-1 left-0 right-0 h-1 bg-cyan-200 rounded-full blur-[2px] animate-pulse" />
                      )}
                    </motion.div>
                  </div>
                  {/* Label */}
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    bar.active 
                      ? (isDarkMode ? "text-cyan-400 text-glow-cyan" : "text-cyan-600")
                      : (isDarkMode ? "text-slate-500" : "text-slate-400")
                  )}>
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Voyager Progress Map */}
          <div className={cn(
            "p-6 lg:p-8 rounded-[28px] border flex flex-col justify-between shadow-sm transition-all duration-300 h-[320px]",
            isDarkMode ? "bg-[#0b1122]/60 border-white/5" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-6">
              <RocketIcon size={18} className={cn(isDarkMode ? "text-pink-400" : "text-pink-500")} />
              <h4 className={cn("text-base lg:text-lg font-display font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                Voyager Progress Map
              </h4>
            </div>

            {/* curvaceous SVG route map with nodes */}
            <div className="flex-1 w-full relative">
              <svg className="w-full h-full min-h-[160px]" viewBox="0 0 500 160" preserveAspectRatio="none">
                <defs>
                  {/* Line Gradient */}
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="33%" stopColor="#10b981" />
                    <stop offset="66%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>

                  {/* Glow Filters */}
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Main curvy path */}
                <path 
                  d="M 40,120 C 120,40 180,140 240,110 C 300,80 340,30 380,90 C 410,130 430,120 460,70" 
                  fill="none" 
                  stroke="url(#mapGradient)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  className={isDarkMode ? "drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]" : ""}
                />

                {/* Milestones circles inside SVG */}
                {/* Node 1: Launch Pad (Blue) */}
                <g className="cursor-pointer group">
                  <circle cx="40" cy="120" r="10" fill="#0c1328" stroke="#3b82f6" strokeWidth="3" filter="url(#glow-blue)" />
                  <circle cx="40" cy="120" r="4" fill="#3b82f6" />
                  <text x="40" y="145" textAnchor="middle" fill={isDarkMode ? "#94a3b8" : "#475569"} className="text-[9px] font-black uppercase tracking-wider">
                    Launch Pad
                  </text>
                </g>

                {/* Node 2: Math Nebula (Green) */}
                <g className="cursor-pointer group">
                  <circle cx="160" cy="98" r="10" fill="#0c1328" stroke="#10b981" strokeWidth="3" />
                  <circle cx="160" cy="98" r="4" fill="#10b981" />
                  <text x="160" y="120" textAnchor="middle" fill={isDarkMode ? "#94a3b8" : "#475569"} className="text-[9px] font-black uppercase tracking-wider">
                    Math Nebula
                  </text>
                </g>

                {/* Node 3: Grammar Galaxy (Pink) */}
                <g className="cursor-pointer group">
                  <circle cx="310" cy="85" r="10" fill="#0c1328" stroke="#ec4899" strokeWidth="3" />
                  <circle cx="310" cy="85" r="4" fill="#ec4899" />
                  <text x="310" y="108" textAnchor="middle" fill={isDarkMode ? "#94a3b8" : "#475569"} className="text-[9px] font-black uppercase tracking-wider">
                    Grammar Galaxy
                  </text>
                </g>

                {/* Node 4: Final Frontier (Cyan) */}
                <g className="cursor-pointer group">
                  <circle cx="460" cy="70" r="10" fill="#0c1328" stroke="#06b6d4" strokeWidth="3" />
                  <circle cx="460" cy="70" r="4" fill="#06b6d4" />
                  <text x="460" y="95" textAnchor="middle" fill={isDarkMode ? "#94a3b8" : "#475569"} className="text-[9px] font-black uppercase tracking-wider">
                    Final Frontier
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side: Mission Alerts & Quick Shortcuts */}
        <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
          
          {/* Mission Alerts */}
          <div className={cn(
            "p-6 lg:p-8 rounded-[28px] border flex flex-col shadow-sm transition-all duration-300 h-[380px] overflow-hidden",
            isDarkMode ? "bg-[#0b1122]/60 border-white/5" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-2.5 mb-6 shrink-0">
              <BellIcon size={18} className={cn(isDarkMode ? "text-brand-pink" : "text-pink-500")} />
              <h4 className={cn("text-base lg:text-lg font-display font-black", isDarkMode ? "text-white" : "text-slate-900")}>
                Mission Alerts
              </h4>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {[
                { 
                  title: 'Leo completed Mission 4', 
                  desc: 'Stellar performance!', 
                  time: '2 mins ago', 
                  border: 'border-l-emerald-500', 
                  icon: CheckCircleIcon, 
                  color: 'text-emerald-400 bg-emerald-500/10' 
                },
                { 
                  title: 'Fractions Alert', 
                  desc: '5 students struggling with Module 2.3', 
                  time: '15 mins ago', 
                  border: 'border-l-pink-500', 
                  icon: AlertTriangleIcon, 
                  color: 'text-pink-400 bg-pink-500/10' 
                },
                { 
                  title: 'Planning Meeting', 
                  desc: 'Today at 14:00 • Term 2 Voyager Strategy', 
                  time: '14:00 Today', 
                  border: 'border-l-blue-500', 
                  icon: CalendarIcon, 
                  color: 'text-blue-400 bg-blue-500/10' 
                },
                { 
                  title: 'New Recruit', 
                  desc: 'Ava joined the classroom', 
                  time: '1 hour ago', 
                  border: 'border-l-cyan-500', 
                  icon: UserPlusIcon, 
                  color: 'text-cyan-400 bg-cyan-500/10' 
                }
              ].map((alert, idx) => (
                <div 
                  key={`alert-${idx}`} 
                  className={cn(
                    "p-3 rounded-xl border border-l-[4px] flex items-start gap-3 transition-all hover:scale-[1.01] duration-200",
                    isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-slate-50 border-slate-100",
                    alert.border
                  )}
                >
                  <div className={cn("p-2 rounded-lg shrink-0", alert.color)}>
                    <alert.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h5 className={cn("text-xs font-black truncate", isDarkMode ? "text-white" : "text-slate-800")}>
                        {alert.title}
                      </h5>
                      <span className={cn("text-[9px] font-bold whitespace-nowrap shrink-0", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                        {alert.time}
                      </span>
                    </div>
                    <p className={cn("text-[11px] font-semibold mt-0.5 leading-snug", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                      {alert.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className={cn(
            "p-6 lg:p-8 rounded-[28px] border flex flex-col shadow-sm transition-all duration-300 h-[260px] justify-between",
            isDarkMode ? "bg-[#0b1122]/60 border-white/5" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <BlocksIcon size={18} className={cn(isDarkMode ? "text-brand-cyan" : "text-cyan-500")} />
              <h4 className={cn("text-xs uppercase font-black tracking-wider", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                Quick Shortcuts
              </h4>
            </div>

            {/* 3x2 Grid of shortcuts */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { label: 'Planner', icon: SparklesIcon, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40', tab: 'teaching', cat: 'content-creator-menu' },
                { label: 'Wizard', icon: SparklesIcon, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40', tab: 'ai-tutor', cat: 'intelligence-ai' },
                { label: 'Tracker', icon: TrendingUpIcon, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40', tab: 'reports', cat: 'class-analytics' },
                { label: 'Library', icon: LibraryIcon, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40', tab: 'archive', cat: 'lesson-planning' },
                { label: 'Portal', icon: UsersIcon, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40', tab: 'class-management', cat: 'class-management' },
                { label: 'Rewards', icon: TrophyIcon, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40', tab: 'curriculum', cat: 'class-analytics' }
              ].map((sc, idx) => (
                <button
                  key={`sc-${idx}`}
                  onClick={() => onNavigate(sc.tab, sc.cat)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                    isDarkMode ? "bg-[#0b1122]/40" : "bg-slate-50",
                    sc.color
                  )}
                >
                  <sc.icon size={14} className="shrink-0" />
                  <span>{sc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Global Broadcast Overlay Modal */}
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
              className={cn(
                "w-full max-w-md rounded-3xl p-6 border shadow-2xl relative z-10",
                isDarkMode ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
              )}
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 transition-colors"
              >
                <XIcon size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl">
                  <MegaphoneIcon size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-display font-black">Global Broadcast</h4>
                  <p className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    Send an emergency orbital broadcast to all cadets.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className={cn("text-[10px] font-black uppercase tracking-wider block mb-1.5", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    Transmission Message
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="E.g. Attention Cadets! Prepare for the Fractions module exploration launch tomorrow morning at 08:00 UTC."
                    required
                    rows={4}
                    className={cn(
                      "w-full rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none transition-all",
                      isDarkMode ? "bg-slate-950 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      isDarkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    )}
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
                    <SendIcon size={12} />
                    <span>{isSending ? 'Sending...' : 'Broadcast'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
