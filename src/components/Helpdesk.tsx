import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LifeBuoy,
  BookOpen,
  MessageCircle,
  Mail,
  Search,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  Clock,
  Lightbulb,
  Send,
  CheckCircle2,
  CircleHelp,
  Clapperboard,
  ArrowUpRight,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HOW_TO_CATEGORIES,
  HOW_TO_FAQS,
  HOW_TO_GUIDES,
  CLIP_SECONDS_PER_STEP,
  type HowToCategory,
  type HowToGuide,
} from '../data/howToGuides';
import ContentSlideshow from './ContentSlideshow';
import bgHelpdesk from '../assets/images/helpdesk_bg_1786975832.jpg';
import imgContent from '../assets/images/howto_content_studio_1787492001.jpg';
import imgCalendar from '../assets/images/howto_calendar_1787492001.jpg';
import imgMessenger from '../assets/images/howto_messenger_1787492001.jpg';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const TICKET_KEY = 'eduai_support_tickets';

type Pane = 'howtos' | 'faqs' | 'contact' | 'tickets';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  email: string;
  createdAt: string;
  status: 'open' | 'sent';
}

interface HelpdeskProps {
  isDarkMode: boolean;
  initialPane?: Pane;
  onNavigate?: (tabId: string) => void;
}

function loadTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(TICKET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: SupportTicket[]) {
  try {
    localStorage.setItem(TICKET_KEY, JSON.stringify(tickets));
  } catch {}
}

const CATEGORY_ACCENT: Record<HowToCategory, string> = {
  start: 'from-amber-400 to-orange-500',
  create: 'from-pink-500 to-fuchsia-500',
  learners: 'from-cyan-400 to-blue-500',
  plan: 'from-violet-400 to-indigo-500',
  message: 'from-emerald-400 to-teal-500',
  assess: 'from-orange-400 to-amber-500',
  settings: 'from-slate-300 to-cyan-400',
};

// Animated showcase card — mirrors Teacher's Toolbox InteractiveShowcaseCard
function HelpdeskShowcaseCard({
  slides,
  borderColorClass,
  shadowColorClass,
  hoverBorderColorClass,
  hoverShadowColorClass,
  glowColorClass,
  onClick,
  children,
}: {
  slides: { image: string; title: string; description: string }[];
  borderColorClass: string;
  shadowColorClass: string;
  hoverBorderColorClass: string;
  hoverShadowColorClass: string;
  glowColorClass: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlideIndex((p) => (p + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const currentSlide = slides[slideIndex];

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`rounded-[32px] border-2 bg-slate-900/90 p-6 md:p-8 text-center flex flex-col items-center justify-between group hover:brightness-110 transition-all duration-300 cursor-pointer relative overflow-hidden h-full min-h-[340px] select-none ${borderColorClass} ${shadowColorClass} ${hoverBorderColorClass} ${hoverShadowColorClass}`}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={slideIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            loading="eager"
            decoding="sync"
            className="w-full h-full object-cover opacity-[0.46] group-hover:opacity-[0.56] filter brightness-[0.98] transition-opacity duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/55 pointer-events-none z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-transparent pointer-events-none z-0" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}

// ── Hero & card slides ────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    title: 'Walkthrough Clips',
    tag: 'SELF-SERVE',
    badgeColor: 'from-cyan-500 to-blue-600',
    description: 'Short, step-by-step clips for Content Studio, Intervention, Calendar, Messenger, Classes, OCR and more — watch then jump straight into the real tool.',
    image: imgContent,
  },
  {
    title: 'Knowledge Base',
    tag: 'CAPS & POPiA',
    badgeColor: 'from-violet-500 to-indigo-600',
    description: 'Searchable answers on CAPS alignment, SIAS levels, calendar vs diary, Messenger privacy, offline use and data protection.',
    image: bgHelpdesk,
  },
  {
    title: 'Contact & Tickets',
    tag: 'HUMAN HELP',
    badgeColor: 'from-emerald-500 to-teal-600',
    description: 'Send a support note that is saved on this device. Every walkthrough has an Open Feature button to take you directly to the live page.',
    image: imgMessenger,
  },
];

const CLIPS_CARD_SLIDES = [
  { image: imgContent, title: 'Content Studio', description: 'Lesson plans, worksheets and memos, step by step.' },
  { image: imgCalendar, title: 'Calendar & Diary', description: 'Plan CAPS weeks, set reminders and log your day.' },
  { image: imgMessenger, title: 'Messenger', description: 'POPIA-safe chats with parents, learners and staff.' },
];

const FAQS_CARD_SLIDES = [
  { image: bgHelpdesk, title: 'CAPS & SIAS', description: 'Curriculum alignment, intervention levels and pacing.' },
  { image: imgMessenger, title: 'Privacy & POPIA', description: 'Who sees what, where messages and data are stored.' },
  { image: imgContent, title: 'Offline & Print', description: 'Keep working when the network drops, then export.' },
];

const CONTACT_CARD_SLIDES = [
  { image: imgMessenger, title: 'Send a note', description: 'Describe what you were doing and which page.' },
  { image: bgHelpdesk, title: 'Saved on device', description: 'Tickets live in your browser on this device.' },
  { image: imgCalendar, title: 'Follow up', description: 'Re-open any ticket from the My Tickets panel.' },
];

const TICKETS_CARD_SLIDES = [
  { image: imgCalendar, title: 'Your history', description: 'Every note you sent, newest first.' },
  { image: bgHelpdesk, title: 'Status & time', description: 'See when each ticket was logged.' },
  { image: imgMessenger, title: 'Resend / follow up', description: 'Jump back to Contact Support anytime.' },
];

// Feature cards for the landing — 2×2 neon glow grid mirroring Teacher's Toolbox
const LANDING_FEATURES: {
  id: Pane;
  badge: string;
  title: string;
  description: string;
  slides: { image: string; title: string; description: string }[];
  accent: string; // text colour for icon
  icon: React.ReactNode;
  pills: { label: string; target: Pane }[];
}[] = [
  {
    id: 'howtos',
    badge: 'Self-serve',
    title: 'Walkthrough Clips',
    description: 'Playable step clips for every hub — watch, follow the steps, then tap Open Feature to jump into the live page.',
    slides: CLIPS_CARD_SLIDES,
    accent: '#22d3ee',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="3" />
        <path d="M7 6l2-3h6l2 3" />
        <polygon points="10 11 16 14 10 17 10 11" fill="currentColor" stroke="none" />
      </svg>
    ),
    pills: [
      { label: '🎬 Play clips', target: 'howtos' },
      { label: '🧭 Open Feature', target: 'howtos' },
    ],
  },
  {
    id: 'faqs',
    badge: 'CAPS & POPiA',
    title: 'Knowledge Base',
    description: 'Searchable answers on SIAS levels, calendar vs diary, Messenger privacy, OCR, offline use and CAPS alignment.',
    slides: FAQS_CARD_SLIDES,
    accent: '#ec4899',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" />
        <path d="M4 16a4 4 0 0 1 4-4h12" />
        <path d="M9 9h6M9 13h4" />
      </svg>
    ),
    pills: [
      { label: '🔎 Search FAQs', target: 'faqs' },
      { label: '🛡️ POPIA & SIAS', target: 'faqs' },
    ],
  },
  {
    id: 'contact',
    badge: 'Human help',
    title: 'Contact Support',
    description: 'Send a note saved on this device. Tell us what you were doing and which page so we can help faster.',
    slides: CONTACT_CARD_SLIDES,
    accent: '#34d399',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
        <path d="M8 11h.01M12 11h.01M16 11h.01" />
      </svg>
    ),
    pills: [
      { label: '✉️ Send a note', target: 'contact' },
      { label: '💬 Live chat soon', target: 'contact' },
    ],
  },
  {
    id: 'tickets',
    badge: 'On device',
    title: 'My Tickets',
    description: 'Review every note you have sent. Tickets stay in your browser on this device so you can follow up any time.',
    slides: TICKETS_CARD_SLIDES,
    accent: '#fbbf24',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
    pills: [
      { label: '📬 View tickets', target: 'tickets' },
      { label: '🔔 Status', target: 'tickets' },
    ],
  },
];

export default function Helpdesk({ initialPane = 'howtos', onNavigate }: HelpdeskProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Pane>(initialPane);
  const [category, setCategory] = useState<HowToCategory | 'all'>('all');
  const [openGuideId, setOpenGuideId] = useState<string | null>(HOW_TO_GUIDES[0]?.id ?? null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [tickets, setTickets] = useState<SupportTicket[]>(() => loadTickets());
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Real video player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setActiveTab(initialPane);
    // When opened from sidebar, show the landing first (like Intelligent AI), not the detail list
    if (initialPane === 'howtos' || initialPane === 'faqs') setShowLanding(true);
  }, [initialPane]);

  const query = searchQuery.trim().toLowerCase();

  const filteredGuides = useMemo(() => {
    return HOW_TO_GUIDES.filter((guide) => {
      if (category !== 'all' && guide.category !== category) return false;
      if (!query) return true;
      const hay = [guide.title, guide.subtitle, guide.what, guide.tip, ...guide.steps.map((s) => `${s.title} ${s.body}`)].join(' ').toLowerCase();
      return hay.includes(query);
    });
  }, [category, query]);

  const filteredFaqs = useMemo(() => {
    if (!query) return HOW_TO_FAQS;
    return HOW_TO_FAQS.filter((faq) => `${faq.q} ${faq.a} ${faq.tags}`.toLowerCase().includes(query));
  }, [query]);

  const openGuide: HowToGuide | undefined = filteredGuides.find((g) => g.id === openGuideId) || filteredGuides[0];

  useEffect(() => {
    if (!openGuide) {
      setOpenGuideId(null);
      setIsPlaying(false);
      return;
    }
    if (!filteredGuides.some((g) => g.id === openGuideId)) {
      setOpenGuideId(openGuide.id);
    }
    // New clip: reset player to the start and force the <video> element to
    // reload its source so the poster → frame 0 transition actually happens.
    setStepIndex(0);
    setIsPlaying(false);
    setVideoProgress(0);
    setVideoDuration(0);
    setVideoReady(false);
    setVideoError(null);
    const t = window.setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        try {
          v.load();
        } catch (e) {
          // some browsers throw if the media isn't attached yet — ignore
        }
      }
    }, 30);
    return () => window.clearTimeout(t);
  }, [openGuide?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const clipSeconds = (openGuide?.steps.length ?? 0) * CLIP_SECONDS_PER_STEP;

  const selectGuide = (id: string) => {
    setOpenGuideId(id);
    setStepIndex(0);
    setIsPlaying(false);
    setVideoProgress(0);
    setActiveTab('howtos');
    setShowLanding(false);
    setTimeout(() => {
      const el = document.getElementById('helpdesk-content-scroll');
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  // ── Real video playback ──────────────────────────────────────────────────
  const toggleClipPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      // Try audible playback first (the clips now ship with an audio track).
      // If the browser blocks it (autoplay policy), fall back to muted once.
      const wasMuted = video.muted;
      video.muted = isMuted;
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {
          setVideoError('Tap the clip to play it.');
        });
      });
      // If the first attempt actually started, sync our muted state back
      if (!video.paused && wasMuted !== isMuted) video.muted = isMuted;
    } else {
      video.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
    if (!next && video.paused) {
      // Unmuting while paused: start the clip so the user hears audio immediately
      video.play().catch(() => {});
    }
  };

  const seekToStep = (idx: number) => {
    const video = videoRef.current;
    if (!openGuide) return;
    const clamped = Math.max(0, Math.min(idx, openGuide.steps.length - 1));
    setStepIndex(clamped);
    if (video && videoDuration > 0) {
      video.currentTime = (clamped / openGuide.steps.length) * videoDuration;
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !openGuide) return;
    if (video.duration > 0) {
      setVideoProgress(video.currentTime / video.duration);
      if (!video.paused) {
        const step = Math.min(Math.floor((video.currentTime / video.duration) * openGuide.steps.length), openGuide.steps.length - 1);
        setStepIndex((prev) => (prev === step ? prev : step));
      }
    }
  };

  const goToFeature = (tabId?: string) => {
    if (!tabId || !onNavigate) return;
    onNavigate(tabId);
  };

  const submitTicket = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    const next: SupportTicket = {
      id: `tkt-${Date.now()}`,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      email: ticketEmail.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    const updated = [next, ...tickets];
    setTickets(updated);
    saveTickets(updated);
    setTicketSubject('');
    setTicketMessage('');
    setTicketEmail('');
    setTicketSent(true);
    setActiveTab('tickets');
    setShowLanding(false);
    window.setTimeout(() => setTicketSent(false), 4000);
  };

  const currentStep = openGuide?.steps[stepIndex];
  const stepCount = openGuide?.steps.length ?? 0;
  const videoPct = videoProgress * 100;

  // ═══════════════════════════════════════════════════════════════════════════
  // LANDING — mirrors the Teacher's Toolbox hub: dim slideshow, amber hero,
  // 7/5 hero split (slideshow + featured card), 2x2 neon showcase cards with
  // custom inline icons and sub-action pills, and a bottom shortcut strip.
  // ═══════════════════════════════════════════════════════════════════════════
  if (showLanding && (activeTab === 'howtos' || activeTab === 'faqs')) {
    return (
      <div className="w-full h-full min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain p-2 sm:p-4">
        <div className="relative p-4 lg:p-6 overflow-hidden rounded-2xl text-white flex flex-col justify-between font-sans min-h-full" style={{ minHeight: 'calc(100dvh - 8rem)' }}>
          {/* Deep cosmic radial base — mirrors Teacher's Toolbox */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.45)_0%,rgba(8,11,34,1)_100%)] pointer-events-none rounded-2xl" />

          {/* Helpdesk background overlay — same treatment as Toolbox plate */}
          <div
            className="absolute inset-0 z-0 opacity-[0.22] pointer-events-none"
            style={{
              backgroundImage: `url(${bgHelpdesk})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Soft ambient radial glows — pink / cyan / emerald */}
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />

          {/* MAIN TITLE SECTION ("Help / Support Desk") */}
          <div className="relative z-10 text-center my-3">
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="text-xl sm:text-2xl font-display font-bold text-slate-100 tracking-tight">Help /</span>
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-amber-300 tracking-tight leading-none drop-shadow-[0_0_25px_rgba(252,211,77,0.6)]">
              Support Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto font-medium">
              Walkthrough Clips • CAPS &amp; POPiA Knowledge Base • Contact Tickets
            </p>
          </div>

          {/* HERO SHOWCASE: slideshow (7) + contact support card (5) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-3 max-w-6xl mx-auto w-full items-stretch">
            {/* LEFT: Interactive help slideshow */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <ContentSlideshow slides={HERO_SLIDES as any} />
            </div>

            {/* RIGHT: Contact Support Featured Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => { setActiveTab('contact'); setShowLanding(false); }}
              className="lg:col-span-5 flex flex-col justify-between p-6 rounded-[32px] bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-emerald-950/80 border-2 border-emerald-500/40 hover:border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:brightness-110 relative overflow-hidden group transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
                    <LifeBuoy size={12} className="text-amber-300" />
                    HUMAN HELP
                  </span>
                  <MessageCircle size={24} className="text-emerald-400 animate-pulse group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div>
                  <h3 className="text-2xl font-display font-black text-white group-hover:text-emerald-200 transition-colors">
                    Contact Support
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    Send a note that is saved on this device. Every walkthrough clip has an Open Feature button that takes you straight to the live page.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Tickets stay on this device</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Jump to the real tool from any clip</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Knowledge base first — most answers are there</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setActiveTab('contact'); setShowLanding(false); }}
                className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-300/40"
              >
                <Send size={16} />
                <span>Open Contact Support</span>
              </button>
            </motion.div>
          </div>

          {/* 2×2 NEON GLOW SHOWCASE CARDS — mirrors Teacher's Toolbox grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto w-full my-4 items-stretch">
            {LANDING_FEATURES.map((feature, idx) => {
              const borderColors = [
                'border-cyan-400/90 hover:border-cyan-300',
                'border-pink-500/90 hover:border-pink-400',
                'border-emerald-400/90 hover:border-emerald-300',
                'border-amber-400/90 hover:border-amber-300',
              ];
              const shadowColors = [
                'shadow-[0_0_30px_rgba(34,211,238,0.35)] hover:shadow-[0_0_50px_rgba(34,211,238,0.65)]',
                'shadow-[0_0_30px_rgba(236,72,153,0.35)] hover:shadow-[0_0_50px_rgba(236,72,153,0.65)]',
                'shadow-[0_0_30px_rgba(52,211,153,0.35)] hover:shadow-[0_0_50px_rgba(52,211,153,0.65)]',
                'shadow-[0_0_30px_rgba(251,191,36,0.35)] hover:shadow-[0_0_50px_rgba(251,191,36,0.65)]',
              ];
              const iconBoxColors = [
                'bg-cyan-500/10 border-cyan-400/50 group-hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]',
                'bg-pink-500/10 border-pink-400/50 group-hover:bg-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.4)] group-hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]',
                'bg-emerald-500/10 border-emerald-400/50 group-hover:bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.4)] group-hover:shadow-[0_0_30px_rgba(52,211,153,0.6)]',
                'bg-amber-500/10 border-amber-400/50 group-hover:bg-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:shadow-[0_0_30px_rgba(251,191,36,0.6)]',
              ];
              const pillColors = [
                'bg-cyan-500/10 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300',
                'bg-pink-500/10 hover:bg-pink-500/30 border-pink-500/40 text-pink-300',
                'bg-emerald-500/10 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300',
                'bg-amber-500/10 hover:bg-amber-500/30 border-amber-500/40 text-amber-300',
              ];

              return (
                <HelpdeskShowcaseCard
                  key={feature.id}
                  slides={feature.slides}
                  borderColorClass={borderColors[idx % 4]}
                  shadowColorClass={shadowColors[idx % 4]}
                  hoverBorderColorClass=""
                  hoverShadowColorClass=""
                  glowColorClass=""
                  onClick={() => { setActiveTab(feature.id); setShowLanding(false); }}
                >
                  <div className="space-y-4 w-full h-full flex flex-col items-center justify-between">
                    <div
                      className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${iconBoxColors[idx % 4]}`}
                      style={{ color: feature.accent }}
                    >
                      {feature.icon}
                    </div>

                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/80 border border-white/15">
                        {feature.badge}
                      </span>
                      <h2 className="text-2xl font-display font-extrabold text-white mt-2 group-hover:text-white transition-colors">
                        {feature.title}
                        {feature.id === 'tickets' && tickets.length ? ` (${tickets.length})` : ''}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mt-2">
                        {feature.description}
                      </p>
                    </div>

                    <div className="pt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                      {feature.pills.map((pill, pi) => (
                        <button
                          key={pi}
                          onClick={(e) => { e.stopPropagation(); setActiveTab(pill.target); setShowLanding(false); }}
                          className={`px-3 py-1.5 rounded-full border text-[11px] font-bold hover:text-white hover:scale-105 transition-all cursor-pointer relative z-20 ${pillColors[idx % 4]}`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </HelpdeskShowcaseCard>
              );
            })}
          </div>

          {/* BOTTOM QUICK SHORTCUTS STRIP */}
          <div className="relative z-10 pt-6 border-t border-emerald-500/20 text-center">
            <p className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest mb-3">
              Support Desk Shortcuts
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
              {[
                { id: 'howtos', label: 'Walkthrough Clips', icon: Clapperboard },
                { id: 'faqs', label: 'Knowledge Base', icon: BookOpen },
                { id: 'contact', label: 'Contact Support', icon: MessageCircle },
                { id: 'tickets', label: 'My Tickets', icon: Mail },
              ].map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => { setActiveTab(tool.id as Pane); setShowLanding(false); }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-600/30 border border-emerald-500/30 hover:border-emerald-400 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ToolIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) { setShowLanding(false); setActiveTab('howtos'); } }}
                  placeholder="Search how-tos — calendar, SIAS, messenger, OCR…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                {HOW_TO_CATEGORIES.filter((c) => c.id !== 'all').slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCategory(c.id as any); setActiveTab('howtos'); setShowLanding(false); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-emerald-400/30 transition-colors cursor-pointer"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETAIL VIEWS — real video clip player + scrollable content on every screen
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="full-bleed-page w-full h-full min-h-0 p-1 sm:p-1 lg:p-2">
      <div className="w-full h-full min-h-0 overflow-hidden bg-[#0c1024] rounded-2xl flex flex-col md:flex-row relative">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 bg-[#141a2e] border-b md:border-b-0 md:border-r border-cyan-500/10 flex flex-col pt-3 pb-3 md:pt-6 md:pb-6 shadow-xl z-10 min-h-0 max-h-[42dvh] md:max-h-none md:h-full">
          <div className="px-5 md:px-6 mb-4 flex items-center gap-3 shrink-0">
            <button onClick={() => setShowLanding(true)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0" title="Back to Help Hub">
              <ChevronLeft size={16} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <LifeBuoy size={20} className="text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-cyan-400 font-black tracking-widest text-xs leading-tight">HOW-TO</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase">Self-serve clips</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-4 space-y-2 custom-scrollbar">
            <button type="button" onClick={() => setActiveTab('howtos')} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer', activeTab === 'howtos' ? 'bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent')}>
              <Clapperboard size={16} className={activeTab === 'howtos' ? 'text-cyan-400' : 'text-slate-400'} /><span>Walkthrough clips</span>
            </button>
            <button type="button" onClick={() => setActiveTab('faqs')} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer', activeTab === 'faqs' ? 'bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent')}>
              <BookOpen size={16} className={activeTab === 'faqs' ? 'text-cyan-400' : 'text-slate-400'} /><span>Knowledge Base</span>
            </button>
            <button type="button" onClick={() => setActiveTab('contact')} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer', activeTab === 'contact' ? 'bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent')}>
              <MessageCircle size={16} className={activeTab === 'contact' ? 'text-cyan-400' : 'text-slate-400'} /><span>Contact Support</span>
            </button>
            <button type="button" onClick={() => setActiveTab('tickets')} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer', activeTab === 'tickets' ? 'bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent')}>
              <Mail size={16} className={activeTab === 'tickets' ? 'text-cyan-400' : 'text-slate-400'} /><span>My Tickets{tickets.length ? ` (${tickets.length})` : ''}</span>
            </button>
          </div>
          <div className="px-3 md:px-4 mt-auto pt-4 border-t border-white/5 shrink-0">
            <button onClick={() => setShowLanding(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer">
              <ArrowUpRight size={14} /> Back to Support Hub
            </button>
          </div>
        </div>

        {/* Content — owns its own scroll on every breakpoint */}
        <div className="flex-1 min-h-0 min-w-0 bg-gradient-to-br from-[#0c1024] to-[#0a0e1c] p-4 sm:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain" id="helpdesk-content-scroll">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="text-left flex items-center justify-between">
              <div>
                <h1 className="text-cyan-400 font-black tracking-widest text-sm uppercase mb-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse rounded-full" /> Help &amp; Support
                </h1>
                <h2 className="text-white font-display text-3xl font-black tracking-tight">
                  {activeTab === 'howtos' ? 'Walkthrough clips' : activeTab === 'faqs' ? 'Knowledge Base' : activeTab === 'contact' ? 'Contact Support' : 'My Tickets'}
                </h2>
                <p className="text-slate-400 font-medium text-sm mt-2 max-w-2xl">
                  {activeTab === 'howtos' ? 'Press play on any clip — it steps through the walkthrough on its own. Pause, scrub, then Open Feature.' : activeTab === 'faqs' ? 'Searchable answers on CAPS, SIAS, calendar, Messenger, offline and POPiA.' : activeTab === 'contact' ? 'Send a note saved on this device.' : 'Tickets saved in your browser.'}
                </p>
              </div>
              <button onClick={() => setShowLanding(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors">
                <ChevronLeft size={14} /> Hub
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
              <input type="text" placeholder="Search how-tos — calendar, SIAS, messenger, OCR…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-10 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-medium" />
            </div>

            {activeTab === 'howtos' && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {HOW_TO_CATEGORIES.map((chip) => (
                    <button key={chip.id} type="button" onClick={() => setCategory(chip.id)} className={cn('px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer', category === chip.id ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/25')}>
                      {chip.label}
                    </button>
                  ))}
                </div>

                {openGuide && (
                  <div className="rounded-[28px] overflow-hidden border border-cyan-500/20 bg-[#141a2e] shadow-2xl">
                    <div className="relative h-56 sm:h-64 overflow-hidden group bg-black">
                      {/* Real playable clip — one segment per step, loops, has audio */}
                      <video
                        key={openGuide.id}
                        ref={videoRef}
                        src={openGuide.video}
                        poster={openGuide.image}
                        className="w-full h-full object-cover"
                        playsInline
                        loop
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          setVideoDuration(e.currentTarget.duration || 0);
                          setVideoReady(true);
                          setVideoError(null);
                        }}
                        onCanPlay={(e) => {
                          setVideoReady(true);
                          setVideoError(null);
                          // If the user already pressed play before the clip
                          // finished loading, honour that intent now.
                          if (isPlaying && e.currentTarget.paused) {
                            e.currentTarget.play().catch(() => {});
                          }
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onError={() => {
                          setVideoReady(true);
                          setVideoError('This clip could not be played. Try again in a moment.');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141a2e] via-transparent to-transparent pointer-events-none" />

                      {/* Mute / unmute control — top-right */}
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 border border-white/15 text-white flex items-center justify-center backdrop-blur-sm transition-all z-10"
                        title={isMuted ? 'Unmute clip' : 'Mute clip'}
                        aria-label={isMuted ? 'Unmute clip' : 'Mute clip'}
                      >
                        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>

                      {/* Play / Pause overlay */}
                      {videoReady ? (
                        <button
                          type="button"
                          onClick={toggleClipPlayback}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 hover:bg-white text-[#0c1024] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all"
                          aria-label={isPlaying ? 'Pause clip' : 'Play clip'}
                        >
                          {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
                        </button>
                      ) : (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white">
                          <Loader2 size={22} className="animate-spin" />
                        </div>
                      )}

                      {/* Inline error note — non-blocking, keeps the play button usable */}
                      {videoError && (
                        <div className="absolute top-3 left-3 right-14 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-100 text-[10px] font-bold backdrop-blur-sm z-10">
                          <AlertCircle size={12} className="shrink-0" />
                          <span className="truncate">{videoError}</span>
                        </div>
                      )}

                      {/* Seekable progress bar (real video timeline) */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 cursor-pointer group/progress"
                        onClick={(e) => {
                          const video = videoRef.current;
                          if (!video || videoDuration <= 0) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                          video.currentTime = ratio * videoDuration;
                          setVideoProgress(ratio);
                        }}
                        title="Seek"
                      >
                        <div className="h-full bg-cyan-400 transition-all" style={{ width: `${videoPct}%` }} />
                      </div>

                      <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
                        <div className="pointer-events-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r', CATEGORY_ACCENT[openGuide.category])}>Walkthrough clip</span>
                            <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1"><Clock size={11} /> {isPlaying ? 'Playing' : 'Paused'}{videoDuration > 0 ? ` · ${Math.round(videoDuration)}s clip` : ''}</span>
                          </div>
                          <h3 className="text-white font-display text-xl sm:text-2xl font-black leading-tight drop-shadow">{openGuide.title}</h3>
                          <p className="text-slate-300 text-xs mt-1">{openGuide.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2 pointer-events-auto">
                          <button type="button" onClick={toggleClipPlayback} className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-[#071018] text-[11px] font-black uppercase tracking-wider cursor-pointer">
                            {isPlaying ? <Pause size={13} /> : <Play size={13} />}{isPlaying ? 'Pause clip' : 'Play clip'}
                          </button>
                          {openGuide.openTab && onNavigate && (
                            <button type="button" onClick={() => goToFeature(openGuide.openTab)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider cursor-pointer">
                              {openGuide.openLabel || 'Open feature'}<ArrowUpRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-7 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-slate-300 text-sm leading-relaxed">{openGuide.what}</p>
                        <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                          <Clapperboard size={11} className="text-cyan-400" />
                          {clipSeconds}s clip · loops · {openGuide.minutes} walkthrough
                        </span>
                      </div>

                      {/* Step scrubber — click a step to jump the video there */}
                      <div className="flex items-center gap-2">
                        {openGuide.steps.map((_, idx) => (
                          <button key={idx} type="button" onClick={() => seekToStep(idx)} className={cn('h-1.5 flex-1 rounded-full transition-all cursor-pointer', idx === stepIndex ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]' : idx < stepIndex ? 'bg-cyan-700' : 'bg-white/10')} aria-label={`Step ${idx + 1}`} title={`Jump to step ${idx + 1}`} />
                        ))}
                      </div>

                      {currentStep && (
                        <div className="rounded-2xl border border-white/10 bg-[#0b101c] p-5 relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-1 bg-cyan-400 transition-all" style={{ width: `${videoPct}%` }} />
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Step {stepIndex + 1} of {stepCount}{isPlaying ? ' • Playing' : ''}</span>
                            <Sparkles size={14} className={isPlaying ? 'text-amber-300 animate-pulse' : 'text-amber-300'} />
                          </div>
                          <h4 className="text-white font-bold text-lg mb-2">{currentStep.title}</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">{currentStep.body}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <button type="button" disabled={stepIndex === 0} onClick={() => seekToStep(stepIndex - 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                          <ChevronLeft size={14} /> Previous
                        </button>
                        <button type="button" disabled={stepIndex >= stepCount - 1} onClick={() => seekToStep(stepIndex + 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                          Next step <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
                        <Lightbulb size={16} className="text-amber-300 shrink-0 mt-0.5" />
                        <p className="text-amber-100/90 text-xs leading-relaxed"><span className="font-black uppercase tracking-wider text-amber-300">Tip · </span>{openGuide.tip}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-white font-display font-black text-lg mb-3">All clips</h3>
                  {filteredGuides.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border bg-white/5 border-white/5 text-slate-500 text-sm">No walkthrough matches “{searchQuery}”.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredGuides.map((guide) => {
                        const selected = openGuide?.id === guide.id;
                        return (
                          <button key={guide.id} type="button" onClick={() => selectGuide(guide.id)} className={cn('text-left rounded-2xl overflow-hidden border transition-all cursor-pointer group', selected ? 'border-cyan-400/50 shadow-[0_0_24px_rgba(34,211,238,0.2)]' : 'border-white/8 hover:border-cyan-500/30')}>
                            <div className="relative h-28 overflow-hidden">
                              <img src={guide.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1024] to-transparent" />
                              <span className="absolute bottom-2 left-3 text-[10px] font-black text-white/80 flex items-center gap-1"><Play size={10} /> {guide.steps.length * CLIP_SECONDS_PER_STEP}s clip</span>
                              {selected && isPlaying && <span className="absolute top-2 right-3 px-2 py-0.5 rounded-full bg-cyan-500 text-[#0c1024] text-[9px] font-black uppercase animate-pulse">Playing</span>}
                            </div>
                            <div className="p-3 bg-[#141a2e]">
                              <h4 className="text-white font-bold text-sm leading-snug">{guide.title}</h4>
                              <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">{guide.subtitle}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="space-y-3">
                {filteredFaqs.map((faq, i) => {
                  const expanded = openFaq === i;
                  return (
                    <button key={faq.q} type="button" onClick={() => setOpenFaq(expanded ? null : i)} className="w-full text-left p-5 rounded-2xl bg-[#141a2e] border border-white/5 shadow-xl hover:border-cyan-500/20 transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-sm text-white flex items-start gap-2"><CircleHelp size={15} className="text-cyan-400 shrink-0 mt-0.5" />{faq.q}</h4>
                        <ChevronRight size={16} className={cn('text-slate-500 shrink-0 transition-transform', expanded && 'rotate-90 text-cyan-400')} />
                      </div>
                      {expanded && <p className="text-slate-400 leading-relaxed text-xs mt-3 pl-6">{faq.a}</p>}
                    </button>
                  );
                })}
                {filteredFaqs.length === 0 && <div className="p-8 text-center rounded-2xl border bg-white/5 border-white/5 text-slate-500 text-sm">No answers matching “{searchQuery}”.</div>}
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 rounded-2xl bg-[#141a2e] border border-white/5 p-6">
                  <h3 className="text-white font-display font-black text-xl mb-1">Send a support note</h3>
                  <p className="text-slate-400 text-xs mb-5">Saved on this device as a ticket. Check How-To clips first — most classroom questions are answered there.</p>
                  <form onSubmit={submitTicket} className="space-y-3">
                    <input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Subject — e.g. Calendar not showing CAPS lessons" className="w-full px-4 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50" required />
                    <input type="email" value={ticketEmail} onChange={(e) => setTicketEmail(e.target.value)} placeholder="Your email (optional)" className="w-full px-4 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50" />
                    <textarea value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="What were you trying to do? Which page?" rows={6} className="w-full px-4 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 resize-none" required />
                    <button type="submit" className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#071018] text-xs font-black uppercase tracking-wider cursor-pointer"><Send size={14} /> Send ticket</button>
                  </form>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl bg-[#141a2e] border border-white/5 p-5">
                    <MessageCircle size={20} className="text-cyan-400 mb-3" /><h4 className="text-white font-bold mb-1">Try a clip first</h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-3">Content creation, SIAS intervention, calendar scheduling and Messenger each have a step-by-step clip.</p>
                    <button type="button" onClick={() => setActiveTab('howtos')} className="text-cyan-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 cursor-pointer">Open walkthroughs <ChevronRight size={14} /></button>
                  </div>
                  <div className="rounded-2xl bg-[#141a2e] border border-white/5 p-5">
                    <ExternalLink size={20} className="text-brand-yellow mb-3" /><h4 className="text-white font-bold mb-1">Jump into the tool</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">Every clip has an Open Feature button that takes you to the live page — Content Studio, Weekly Planner, Intervention Hub, Messenger, and more.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-4">
                {ticketSent && <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm"><CheckCircle2 size={16} /> Ticket saved on this device.</div>}
                {tickets.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl border border-white/5 bg-[#141a2e] text-slate-400 text-sm">No tickets yet. Send a note from Contact Support if a walkthrough does not cover your question.</div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="p-5 rounded-2xl bg-[#141a2e] border border-white/5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h4 className="text-white font-bold text-sm">{ticket.subject}</h4>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">{ticket.status}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                      <p className="text-[10px] text-slate-500 mt-3 font-mono">{new Date(ticket.createdAt).toLocaleString('en-ZA')}{ticket.email ? ` · ${ticket.email}` : ''}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
