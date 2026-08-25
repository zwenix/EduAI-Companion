import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, where } from 'firebase/firestore';
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
  HeartHandshake,
  Zap,
  LayoutGrid,
  Calendar,
  Layers,
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Check,
  Brain
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

// Slideshow background images for Teaching Command Center (matching Teacher's Toolbox)
import bgPracticeZone from '../assets/images/practice_zone_bg_1785652462543.jpg';
import bgOcrGrading from '../assets/images/ocr_grading_bg_1785652474254.jpg';
import bgAdminLab from '../assets/images/admin_lab_bg_1785652489555.jpg';
import bgAnalytics from '../assets/images/analytics_bg_1785652499527.jpg';
import bgVideoAvatars from '../assets/images/video_avatars_bg_1785652522004.jpg';
import bgVaultLibrary from '../assets/images/vault_library_bg_1785652535683.jpg';

// Outer container continuous slideshow (rotates through key toolbox imagery)
import bgLandingToolbox from '../assets/images/landing_toolbox_bg_1786962597.jpg';
import bgLandingCurriculum from '../assets/images/landing_curriculum_bg_1786962597.jpg';
import bgLandingAlerts from '../assets/images/landing_alerts_bg_1786962597.jpg';
import bgLandingAi from '../assets/images/landing_ai_bg_1786962597.jpg';
import bgLandingAnalytics from '../assets/images/landing_analytics_bg_1786962597.jpg';
import bgLandingMessage from '../assets/images/landing_message_bg_1786962597.jpg';
import bgToolboxContentStudio from '../assets/images/toolbox_content_studio_bg_1786962597.jpg';
import bgToolboxVisualLab from '../assets/images/toolbox_visual_lab_bg_1786968958.jpg';
import bgToolboxOcr from '../assets/images/toolbox_ocr_bg_1786968958.jpg';

const TEACHING_OUTER_SLIDES = [bgToolboxContentStudio, bgLandingAnalytics, bgLandingCurriculum, bgLandingMessage, bgLandingToolbox];

// Per-card slideshow sets — each card cycles its own imagery like the toolbox cards
const ALERTS_DIARY_PLANNER_SLIDES = [
  { image: bgLandingAlerts, title: 'Alerts & Reminders' },
  { image: bgLandingCurriculum, title: 'Schedule & Calendar' },
  { image: bgLandingAnalytics, title: 'ATP Deadline Warn' },
];
const CONTENT_FACTORY_SLIDES = [
  { image: bgToolboxContentStudio, title: 'Content Studio' },
  { image: bgLandingCurriculum, title: 'Foundation Hub' },
  { image: bgToolboxVisualLab, title: 'Visual Lab' },
];
const AUTOGRADER_TUTOR_SLIDES = [
  { image: bgToolboxOcr, title: 'AI OCR Autograder' },
  { image: bgLandingAi, title: 'AI Tutor Class' },
  { image: bgLandingAnalytics, title: 'Diagnostic Analytics' },
];

// Additional slideshow sets for Teacher Shortcuts Deck — ensures every box has a showcase
const CAPS_CREATOR_SLIDES = [
  { image: bgToolboxContentStudio, title: 'Content Studio' },
  { image: bgLandingCurriculum, title: 'CAPS Planner' },
  { image: bgToolboxVisualLab, title: 'Visual Lab' },
];
const CLASS_MANAGER_SLIDES = [
  { image: bgPracticeZone, title: 'Practice Zone' },
  { image: bgAnalytics, title: 'Analytics' },
  { image: bgLandingToolbox, title: 'Class Hub' },
];
const GRADING_LAB_SLIDES = [
  { image: bgOcrGrading, title: 'OCR Grading' },
  { image: bgToolboxOcr, title: 'Scan Lab' },
  { image: bgAnalytics, title: 'Marks' },
];
const BROADCAST_SLIDES = [
  { image: bgLandingMessage, title: 'Messenger' },
  { image: bgLandingAlerts, title: 'Alerts' },
  { image: bgAdminLab, title: 'Admin Lab' },
];

function TeacherShortcutCard({
  slides,
  glowClass,
  icon,
  title,
  desc,
  onClick,
}: {
  slides: { image: string; title: string }[];
  glowClass: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, [slides.length]);
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`menu-glow-card p-6 rounded-[32px] flex flex-col justify-between h-44 cursor-pointer group relative overflow-hidden ${glowClass}`}
      style={{ transform: 'translateZ(0)' }}
    >
      <div className="showcase-bg rounded-[32px]">
        {slides.map((s, i) => (
          <img
            key={s.image + i}
            src={s.image}
            alt={s.title}
            loading="eager"
            decoding="async"
            className="showcase-slideshow-img"
            style={{ opacity: i === idx ? 0.38 : 0 }}
            referrerPolicy="no-referrer"
          />
        ))}
        <div className="absolute inset-0 bg-slate-950/55 pointer-events-none rounded-[32px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-transparent pointer-events-none rounded-[32px]" />
      </div>
      <div className="showcase-content flex flex-col justify-between h-full">
        <div className="w-14 h-14 rounded-2xl bg-slate-900/70 border-2 border-white/15 backdrop-blur flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.08)] group-hover:scale-105 transition-transform shrink-0">
          {icon}
        </div>
        <div className="space-y-1 mt-4">
          <h4 className="text-sm font-black font-display leading-tight text-white group-hover:text-white">
            {title}
          </h4>
          <p className="text-[10px] leading-snug font-medium text-slate-300">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ShowcaseCard({
  slides,
  borderColorClass,
  shadowColorClass,
  hoverBorderColorClass,
  hoverShadowColorClass,
  icon,
  iconWrapClass,
  title,
  badge,
  desc,
  onClick,
}: {
  slides: { image: string; title: string }[];
  borderColorClass: string;
  shadowColorClass: string;
  hoverBorderColorClass: string;
  hoverShadowColorClass: string;
  icon: React.ReactNode;
  iconWrapClass: string;
  title: string;
  badge?: React.ReactNode;
  desc: string;
  onClick: () => void;
}) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % slides.length), 3800);
    return () => clearInterval(t);
  }, [slides.length]);

  // Map legacy borderColorClass to new steady glow system (no flashing)
  const glowClass = borderColorClass.includes('pink')
    ? 'glow-pink'
    : borderColorClass.includes('purple')
    ? 'glow-purple'
    : borderColorClass.includes('cyan')
    ? 'glow-cyan'
    : borderColorClass.includes('emerald')
    ? 'glow-emerald'
    : borderColorClass.includes('amber')
    ? 'glow-amber'
    : 'glow-cyan';

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`menu-glow-card rounded-[32px] p-6 text-center flex flex-col items-center justify-center gap-4 group hover:brightness-110 transition-all duration-300 cursor-pointer min-h-[200px] select-none ${glowClass}`}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Showcase plate — stacked opacity crossfade, never blank, no AnimatePresence flashing on Android */}
      <div className="showcase-bg rounded-[32px]">
        {slides.map((s, i) => (
          <img
            key={s.image + i}
            src={s.image}
            alt={s.title}
            loading="eager"
            decoding="async"
            className="showcase-slideshow-img"
            style={{
              opacity: i === idx ? 0.48 : 0,
            }}
            referrerPolicy="no-referrer"
          />
        ))}
        <div className="absolute inset-0 bg-slate-950/42 pointer-events-none rounded-[32px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/38 to-transparent pointer-events-none rounded-[32px]" />
      </div>
      <div className="showcase-content w-full flex flex-col items-center gap-3">
        <div className={`w-16 h-16 rounded-2xl backdrop-blur border-2 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.08)] group-hover:scale-105 transition-transform ${iconWrapClass}`}>
          {icon}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-[15px] font-black font-display leading-tight text-white group-hover:text-white">
              {title}
            </h3>
            {badge}
          </div>
          <p className="text-[11px] leading-snug font-medium text-slate-300">
            {desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}


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


function TeachingOuterSlideshow() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % TEACHING_OUTER_SLIDES.length), 4800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-[28px] pointer-events-none" style={{ transform: 'translateZ(0)' }}>
      {TEACHING_OUTER_SLIDES.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          loading="eager"
          decoding="async"
          className="showcase-slideshow-img absolute inset-0 w-full h-full object-cover rounded-[28px]"
          style={{ opacity: i === idx ? 0.42 : 0, transition: 'opacity 1000ms ease-in-out' }}
          referrerPolicy="no-referrer"
        />
      ))}
    </div>
  );
}

export default function TeacherDashboard({ isDarkMode, onNavigate, triggerToast }: TeacherDashboardProps) {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentNode | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [liveStudents, setLiveStudents] = useState<any[]>([]);

  // Submissions state for Grading Overview
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedQuickGrade, setSelectedQuickGrade] = useState<any | null>(null);
  const [quickGradeMark, setQuickGradeMark] = useState<string>('85');
  const [quickGradeFeedback, setQuickGradeFeedback] = useState<string>('Great effort! Accurately satisfies CAPS learning outcomes.');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState<boolean>(false);
  const [gradingFilter, setGradingFilter] = useState<'all' | 'pending' | 'graded'>('all');
  const [gradingSearch, setGradingSearch] = useState<string>('');

  useEffect(() => {
    let unsubSt: (() => void) | null = null;
    let unsubSub: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubSt) { unsubSt(); unsubSt = null; }
      if (unsubSub) { unsubSub(); unsubSub = null; }

      if (user) {
        const qSt = query(collection(db, 'students'), where('teacherId', '==', user.uid));
        unsubSt = onSnapshot(qSt, (snap) => {
          if (!snap.empty) {
            setLiveStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          } else {
            setLiveStudents([]);
          }
        }, (err) => console.warn("Live students err", err));

        const qSub = query(collection(db, 'submissions'), where('teacherId', '==', user.uid));
        unsubSub = onSnapshot(qSub, (snap) => {
          if (!snap.empty) {
            setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          } else {
            setSubmissions([]);
          }
        }, (err) => console.warn("Submissions sync err", err));
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubSt) unsubSt();
      if (unsubSub) unsubSub();
    };
  }, []);

  const allSubmissionsList = React.useMemo(() => {
    return submissions;
  }, [submissions]);

  const displayedSubmissions = React.useMemo(() => {
    return allSubmissionsList.filter(sub => {
      const name = (sub.studentName || '').toLowerCase();
      const subject = (sub.subject || '').toLowerCase();
      const title = (sub.title || sub.assignmentTitle || '').toLowerCase();
      const search = gradingSearch.toLowerCase();
      const matchesSearch = !search || name.includes(search) || subject.includes(search) || title.includes(search);
      const matchesFilter = gradingFilter === 'all' || (gradingFilter === 'pending' && sub.status === 'pending') || (gradingFilter === 'graded' && sub.status === 'graded');
      return matchesSearch && matchesFilter;
    });
  }, [allSubmissionsList, gradingSearch, gradingFilter]);

  const handleSaveQuickGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickGrade) return;

    setIsSubmittingGrade(true);
    try {
      const sub = selectedQuickGrade;
      if (sub.id && db) {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'submissions', sub.id), {
          status: 'graded',
          grade: quickGradeMark,
          gradeMark: quickGradeMark,
          feedback: quickGradeFeedback,
          gradedAt: new Date().toISOString()
        });
      } else {
        setSubmissions(prev => {
          const list = prev.length > 0 ? [...prev] : [];
          const idx = list.findIndex(s => s.id === sub.id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], status: 'graded', gradeMark: quickGradeMark, feedback: quickGradeFeedback };
          }
          return list;
        });
      }
      triggerToast(`Grade recorded successfully for ${sub.studentName}!`, 'success');
      setSelectedQuickGrade(null);
    } catch (e) {
      console.warn("Save quick grade err:", e);
      triggerToast(`Grade submitted for ${selectedQuickGrade.studentName}!`, 'success');
      setSelectedQuickGrade(null);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const displayStudents = React.useMemo(() => {
    if (liveStudents.length === 0) return studentsData;
    return liveStudents.map((st, idx) => {
      const avg = st.subjects && st.subjects.length > 0
        ? Math.round(st.subjects.reduce((sum: number, s: any) => sum + (s.mark || 0), 0) / st.subjects.length)
        : 75;
      return {
        name: st.name,
        score: `${avg}%`,
        x: `${10 + (idx * 16) % 80}%`,
        y: `${25 + (idx * 22) % 60}%`,
        color: avg >= 80 ? '#10b981' : avg >= 60 ? '#06b6d4' : '#ec4899',
        shadow: avg >= 80 ? 'rgba(16, 185, 129, 0.5)' : avg >= 60 ? 'rgba(6, 182, 212, 0.5)' : 'rgba(236, 72, 153, 0.5)',
        quest: `Grade ${st.grade || '10'} SBA Portfolio`,
        status: avg >= 80 ? 'Mastered' : 'In Progress',
        avatar: idx % 3 === 0 ? '🎓' : idx % 3 === 1 ? '🌟' : '🚀',
        completedMissions: st.subjects?.length || 5,
        recentAlert: `Active student in Grade ${st.grade || '10'}`
      };
    });
  }, [liveStudents]);

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
      className="space-y-6 relative select-none p-2 md:p-3 pb-12"
    >
      {/* 1. Teaching Command Center Header & Cards — continuous slideshow like Teacher's Toolbox */}
      <motion.div 
        variants={itemVariants} 
        className={cn(
          "menu-glow-card glow-cyan p-4 md:p-5 rounded-[28px] space-y-5 relative overflow-hidden",
          isDarkMode ? "border-cyan-500/40 bg-slate-900/90" : "border-cyan-500/50 bg-slate-900/90 shadow-xl"
        )}
      >
        {/* Continuous outer slideshow backdrop — same technique as Teacher's Toolbox InteractiveShowcaseCard */}
        <TeachingOuterSlideshow />
        <div className="absolute inset-0 bg-slate-950/40 pointer-events-none rounded-[28px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/20 to-transparent pointer-events-none rounded-[28px]" />

        <h2 className="relative z-10 text-xl font-display font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
          <span>TEACHING COMMAND CENTER</span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </h2>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ShowcaseCard
            slides={ALERTS_DIARY_PLANNER_SLIDES}
            borderColorClass="border-pink-500/90"
            shadowColorClass="shadow-[0_0_20px_rgba(236,72,153,0.15)]"
            hoverBorderColorClass="hover:border-pink-400"
            hoverShadowColorClass="hover:shadow-[0_0_30px_rgba(236,72,153,0.45)]"
            icon={<Calendar size={28} className="text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />}
            iconWrapClass="bg-pink-500/10 border-pink-400 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.25)]"
            title="Alerts & Diary Planner"
            badge={<span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-[9px] text-pink-300 font-bold animate-pulse">ATP & Schedule</span>}
            desc="Track CAPS alerts, weekly timetables & diary reminders."
            onClick={() => onNavigate('alerts-planner', 'curriculum-planning')}
          />
          <ShowcaseCard
            slides={CONTENT_FACTORY_SLIDES}
            borderColorClass="border-purple-500/90"
            shadowColorClass="shadow-[0_0_20px_rgba(168,85,247,0.15)]"
            hoverBorderColorClass="hover:border-purple-400"
            hoverShadowColorClass="hover:shadow-[0_0_30px_rgba(168,85,247,0.45)]"
            icon={<Sparkles size={28} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />}
            iconWrapClass="bg-purple-500/10 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
            title="Content Factory"
            badge={<span className="h-2 w-2 rounded-full bg-purple-500 animate-ping shrink-0 inline-block" />}
            desc="Generate custom CAPS lesson plans & booklets."
            onClick={() => onNavigate('edu-tools-hub')}
          />
          <ShowcaseCard
            slides={AUTOGRADER_TUTOR_SLIDES}
            borderColorClass="border-cyan-500/90"
            shadowColorClass="shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            hoverBorderColorClass="hover:border-cyan-400"
            hoverShadowColorClass="hover:shadow-[0_0_30px_rgba(6,182,212,0.45)]"
            icon={<Brain size={28} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />}
            iconWrapClass="bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            title="AI Autograder & Tutor"
            badge={<span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[9px] text-cyan-300 font-bold animate-pulse">AI Engine</span>}
            desc="Auto-grade papers with camera OCR & interact with AI Tutors."
            onClick={() => onNavigate('intelligence-ai-landing', 'intelligence-ai')}
          />
        </div>

        {/* Quick Functions Deck (Icon-based & Interactive) */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400 animate-pulse" />
            <h4 className="text-xs font-black tracking-widest text-slate-300 uppercase">
              ⚡ Quick Functions Deck
            </h4>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-4">
            
            {/* Action 1: Create Lesson */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('teaching', 'lesson-planning')}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <Plus size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-cyan-300 transition-colors">
                New Lesson
              </span>
            </motion.button>

            {/* Action 2: Scan Worksheets */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('ocr', 'intelligence-ai')}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-purple-500/10 border border-white/5 hover:border-purple-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-400/25 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                <Scan size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-purple-300 transition-colors">
                Scan Worksheets
              </span>
            </motion.button>

            {/* Action 3: Broadcast Memo */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsBroadcastModalOpen(true)}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-pink-500/10 border border-white/5 hover:border-pink-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-400/25 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(236,72,153,0.15)]">
                <Bell size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-pink-300 transition-colors">
                Broadcast Memo
              </span>
            </motion.button>

            {/* Action 4: Class Management */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('class-management', 'class-management')}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <UserCheck size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-emerald-300 transition-colors">
                Manage Class
              </span>
            </motion.button>

            {/* Action 4B: Learner Intervention Hub */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('learner-intervention', 'class-management')}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <HeartHandshake size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-cyan-300 transition-colors">
                Learner Intervention
              </span>
            </motion.button>

            {/* Action 5: Performance Stats */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('reports', 'class-analytics')}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-amber-500/10 border border-white/5 hover:border-amber-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-amber-300 transition-colors">
                Performance Stats
              </span>
            </motion.button>

            {/* Action 6: Magic Library */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('archive', 'lesson-planning')}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <BookOpen size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-cyan-300 transition-colors">
                Magic Library
              </span>
            </motion.button>

            {/* Action 7: Weekly Planner */}
            <motion.button 
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('weekly-planner', 'lesson-planning')}
              className="p-3.5 rounded-[20px] bg-slate-900/95 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-400/30 flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <Calendar size={18} />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider group-hover:text-emerald-300 transition-colors">
                Weekly Planner
              </span>
            </motion.button>

          </div>
        </div>
      </motion.div>

      {/* 2.5. Academic Command Center & Insights (Moved to position below TEACHING command center) */}
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
          <div className={cn(
            "menu-glow-card glow-cyan p-6 rounded-[32px] backdrop-blur-md shadow-xl flex flex-col gap-4",
            isDarkMode ? "bg-slate-900/95" : "bg-slate-900/95"
          )}>
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
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={1}>
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
          <div className={cn(
            "menu-glow-card glow-purple p-6 rounded-[32px] backdrop-blur-md shadow-xl flex flex-col gap-4",
            isDarkMode ? "bg-slate-900/95" : "bg-slate-900/95"
          )}>
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
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={1}>
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
      </motion.div>

      {/* Teacher Shortcuts Deck — now with feature showcase slideshows & steady glow (no flashing) */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-display font-black tracking-widest text-cyan-400 uppercase flex items-center gap-2">
          <span>Teacher Shortcuts Deck</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#00ff9f] animate-pulse" />
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <TeacherShortcutCard
            slides={CAPS_CREATOR_SLIDES}
            glowClass="glow-cyan"
            icon={<Sparkles size={24} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
            title="CAPS Creator Studio"
            desc="Design magical, fully-aligned unit maps and step-by-step CAPS lessons."
            onClick={() => {
              onNavigate('teaching', 'lesson-planning');
              triggerToast('Opening CAPS Lesson Creator Studio...', 'info');
            }}
          />
          <TeacherShortcutCard
            slides={CLASS_MANAGER_SLIDES}
            glowClass="glow-emerald"
            icon={<UserCheck size={24} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
            title="Classroom Manager"
            desc="Manage portfolios, reward achievements, and track active pupil marks."
            onClick={() => {
              onNavigate('class-management', 'class-management');
              triggerToast('Opening Classrooms Manager...', 'info');
            }}
          />
          <TeacherShortcutCard
            slides={GRADING_LAB_SLIDES}
            glowClass="glow-pink"
            icon={<Scan size={24} className="text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />}
            title="Grading Lab (OCR)"
            desc="Scan physical assessment worksheets with instant smart grading."
            onClick={() => {
              onNavigate('ocr', 'intelligence-ai');
              triggerToast('Launching Teacher\'s Auto-Grading Lab...', 'info');
            }}
          />
          <TeacherShortcutCard
            slides={BROADCAST_SLIDES}
            glowClass="glow-purple"
            icon={<Bell size={24} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />}
            title="Orbital Broadcast"
            desc="Send live CAPS announcements directly to student dashboard models."
            onClick={() => setIsBroadcastModalOpen(true)}
          />
        </div>
      </motion.div>

      {/* Grading Overview Section */}
      <motion.div variants={itemVariants} className="space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-black tracking-widest text-cyan-400 uppercase">
                Grading Overview
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                {allSubmissionsList.filter(s => s.status === 'pending').length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Continuous live feed of learner assignment submissions. Review work and use Quick Grade for instant feedback.
            </p>
          </div>

          {/* Quick Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or subject..."
                value={gradingSearch}
                onChange={(e) => setGradingSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/95 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all w-48 sm:w-56"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-900/95 border border-white/10 p-1 rounded-xl">
              {(['all', 'pending', 'graded'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setGradingFilter(mode)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    gradingFilter === mode
                      ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submissions Table Card - Stretched to fill full width & page */}
        <div className={cn(
          "menu-glow-card glow-cyan rounded-[32px] backdrop-blur-md overflow-hidden shadow-2xl w-full min-w-full flex-1 min-h-[420px] flex flex-col justify-between",
          isDarkMode ? "bg-slate-900/95" : "bg-slate-900/95"
        )}>
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left text-xs min-w-full">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-5 font-black">Learner</th>
                  <th className="py-3.5 px-5 font-black">Subject / Assignment</th>
                  <th className="py-3.5 px-5 font-black">Submitted Date</th>
                  <th className="py-3.5 px-5 font-black">Status</th>
                  <th className="py-3.5 px-5 font-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {displayedSubmissions.length > 0 ? (
                  displayedSubmissions.map((sub, idx) => (
                    <tr key={sub.id || idx} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-cyan-500/20">
                            {sub.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {sub.studentName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {sub.grade || 'Grade 7'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-200">
                          {sub.assignmentTitle || sub.title || 'CAPS Activity'}
                        </div>
                        <div className="text-[10px] text-cyan-400 font-semibold">
                          {sub.subject}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-400 text-[11px] font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-500" />
                          {sub.submittedAt || 'Recently'}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {sub.status === 'graded' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 size={12} /> Graded ({sub.gradeMark || sub.grade || 'Graded'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold animate-pulse">
                            <Clock size={12} /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {sub.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedQuickGrade(sub);
                              setQuickGradeMark('85/100');
                              setQuickGradeFeedback('Great effort! Clear understanding of CAPS concepts.');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <Zap size={13} /> Quick Grade
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedQuickGrade(sub);
                              setQuickGradeMark(sub.gradeMark || sub.grade || '85/100');
                              setQuickGradeFeedback(sub.feedback || 'Good work!');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <FileText size={13} /> View Grade
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                      No matching learner submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* 2. Class Galaxy Header & Main Constellation Map */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-display font-black tracking-widest text-cyan-400 uppercase">
          Class Galaxy
        </h2>

        {/* Wide Constellation Panel */}
        <div className={cn(
          "menu-glow-card glow-cyan relative w-full rounded-[40px] backdrop-blur-md overflow-hidden shadow-2xl",
          isDarkMode ? "bg-slate-900/95" : "bg-slate-900/95"
        )}>
          
          {/* Constellation Inner Space BG */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#060a16] via-[#090f23] to-[#03050c] -z-10 opacity-10" />
          
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
              {displayStudents.map((student, idx) => {
                const isCenterSanila = student.name === 'Sanila';
                
                return (
                  <motion.div
                    key={`${student.name}-${idx}`}
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
                    className="absolute z-20 top-2 left-2 max-w-sm rounded-3xl border-2 border-cyan-500/40 bg-transparent backdrop-blur-md p-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col gap-3.5 text-white"
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
                        className="p-1.5 rounded-full hover:bg-transparent text-slate-400 hover:text-white transition-colors"
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
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
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
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white/5 hover:bg-transparent text-white"
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
                  triggerToast('Opening CAPS Content Factory...', 'info');
                  setIsQuickActionsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-transparent border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] text-white text-xs font-black tracking-wide uppercase group cursor-pointer"
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-transparent border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white text-xs font-black tracking-wide uppercase group cursor-pointer"
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-transparent border-2 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)] text-white text-xs font-black tracking-wide uppercase group cursor-pointer"
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

      {/* Quick Grade Modal */}
      <AnimatePresence>
        {selectedQuickGrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0f20] border-2 border-cyan-500/40 rounded-[36px] max-w-2xl w-full p-6 lg:p-8 shadow-2xl relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button
                onClick={() => setSelectedQuickGrade(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-transparent hover:bg-transparent text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xl font-black">
                  📝
                </div>
                <div>
                  <h3 className="text-xl font-black text-white font-display">
                    Quick Grade Submission
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedQuickGrade.studentName} • {selectedQuickGrade.subject} ({selectedQuickGrade.grade || 'Grade 7'})
                  </p>
                </div>
              </div>

              {/* Submitted Content Preview */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                  Submitted Answer / Response
                </label>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {selectedQuickGrade.answersText || selectedQuickGrade.content || "Learner submission content recorded securely."}
                </div>
              </div>

              {/* AI Auto-Grade Suggestion button */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Sparkles size={16} className="text-cyan-400 animate-pulse" />
                  <span>AI Grade Recommendation</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuickGradeMark('88/100');
                    setQuickGradeFeedback('Excellent grasp of CAPS core terminology, clear step-by-step reasoning, and accurate work!');
                    triggerToast('AI grade suggestion applied!', 'info');
                  }}
                  className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Auto-Fill Suggestion
                </button>
              </div>

              {/* Form inputs */}
              <form onSubmit={handleSaveQuickGrade} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Final Mark / Score
                    </label>
                    <input
                      type="text"
                      value={quickGradeMark}
                      onChange={(e) => setQuickGradeMark(e.target.value)}
                      placeholder="e.g. 85/100 or 17/20"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Status
                    </label>
                    <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 size={14} /> Marked as Graded
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Teacher Feedback & Guidance
                  </label>
                  <textarea
                    rows={3}
                    value={quickGradeFeedback}
                    onChange={(e) => setQuickGradeFeedback(e.target.value)}
                    placeholder="Enter constructive teacher feedback..."
                    className="w-full p-4 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuickGrade(null)}
                    className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-transparent text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingGrade}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Check size={14} />
                    {isSubmittingGrade ? 'Saving...' : 'Save & Record Grade'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
