import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  HOW_TO_CATEGORIES,
  HOW_TO_FAQS,
  HOW_TO_GUIDES,
  type HowToCategory,
  type HowToGuide,
} from '../data/howToGuides';

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
  } catch {
    /* ignore quota */
  }
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

export default function Helpdesk({ isDarkMode, initialPane = 'howtos', onNavigate }: HelpdeskProps) {
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

  useEffect(() => {
    setActiveTab(initialPane);
  }, [initialPane]);

  const query = searchQuery.trim().toLowerCase();

  const filteredGuides = useMemo(() => {
    return HOW_TO_GUIDES.filter((guide) => {
      if (category !== 'all' && guide.category !== category) return false;
      if (!query) return true;
      const hay = [
        guide.title,
        guide.subtitle,
        guide.what,
        guide.tip,
        ...guide.steps.map((s) => `${s.title} ${s.body}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    });
  }, [category, query]);

  const filteredFaqs = useMemo(() => {
    if (!query) return HOW_TO_FAQS;
    return HOW_TO_FAQS.filter((faq) =>
      `${faq.q} ${faq.a} ${faq.tags}`.toLowerCase().includes(query)
    );
  }, [query]);

  const openGuide: HowToGuide | undefined =
    filteredGuides.find((g) => g.id === openGuideId) || filteredGuides[0];

  useEffect(() => {
    if (!openGuide) {
      setOpenGuideId(null);
      setIsPlaying(false);
      return;
    }
    if (!filteredGuides.some((g) => g.id === openGuideId)) {
      setOpenGuideId(openGuide.id);
      setStepIndex(0);
      setIsPlaying(false);
    }
  }, [filteredGuides, openGuide, openGuideId]);

  useEffect(() => {
    if (!isPlaying || !openGuide) return;
    if (stepIndex >= openGuide.steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, openGuide.steps.length - 1));
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [isPlaying, stepIndex, openGuide]);

  const selectGuide = (id: string) => {
    setOpenGuideId(id);
    setStepIndex(0);
    setIsPlaying(false);
    setActiveTab('howtos');
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
    window.setTimeout(() => setTicketSent(false), 4000);
  };

  const navBtn = (id: Pane, label: string, Icon: typeof BookOpen) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer',
        activeTab === id
          ? 'bg-[#1a142c] text-white border border-cyan-500/30 shadow-lg'
          : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
      )}
    >
      <Icon size={16} className={activeTab === id ? 'text-cyan-400' : 'text-slate-400'} />
      <span>{label}</span>
    </button>
  );

  const currentStep = openGuide?.steps[stepIndex];
  const stepCount = openGuide?.steps.length ?? 0;

  return (
    <div className="full-bleed-page w-full h-full min-h-0 p-1 sm:p-1 lg:p-2">
      <div className="w-full h-full min-h-0 overflow-hidden bg-[#0c1024] rounded-2xl flex flex-col md:flex-row relative">
        <div className="w-full md:w-64 bg-[#141a2e] border-r border-cyan-500/10 flex flex-col pt-6 pb-6 shadow-xl shrink-0 z-10">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <LifeBuoy size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-cyan-400 font-black tracking-widest text-xs leading-tight">HOW-TO</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase">Self-serve clips</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            {navBtn('howtos', 'Walkthrough clips', Clapperboard)}
            {navBtn('faqs', 'Knowledge Base', BookOpen)}
            {navBtn('contact', 'Contact Support', MessageCircle)}
            {navBtn('tickets', `My Tickets${tickets.length ? ` (${tickets.length})` : ''}`, Mail)}
          </div>

          <div className="px-4 mt-auto pt-6 border-t border-white/5 space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
              Open a clip. Follow the steps. Jump into the real tool.
            </p>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-br from-[#0c1024] to-[#0a0e1c] p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="text-left">
              <h1 className="text-cyan-400 font-black tracking-widest text-sm uppercase mb-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse rounded-full" />
                Help &amp; Support
              </h1>
              <h2 className="text-white font-display text-3xl font-black tracking-tight">
                See how EduAI works
              </h2>
              <p className="text-slate-400 font-medium text-sm mt-2 max-w-2xl">
                Short walkthrough clips for Content Studio, the Learner Intervention Hub, the CAPS weekly calendar, Messenger, and the rest of the classroom — so you can do it yourself.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <input
                type="text"
                placeholder="Search how-tos — calendar, SIAS, messenger, OCR…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-medium"
              />
            </div>

            {activeTab === 'howtos' && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {HOW_TO_CATEGORIES.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setCategory(chip.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer',
                        category === chip.id
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {openGuide && (
                  <div className="rounded-[28px] overflow-hidden border border-cyan-500/20 bg-[#141a2e] shadow-2xl">
                    <div className="relative h-44 sm:h-56 overflow-hidden">
                      <img
                        src={openGuide.image}
                        alt=""
                        className="w-full h-full object-cover landing-bg-drift"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141a2e] via-[#141a2e]/45 to-transparent" />
                      <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r', CATEGORY_ACCENT[openGuide.category])}>
                              Walkthrough clip
                            </span>
                            <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                              <Clock size={11} /> {openGuide.minutes}
                            </span>
                          </div>
                          <h3 className="text-white font-display text-xl sm:text-2xl font-black leading-tight">
                            {openGuide.title}
                          </h3>
                          <p className="text-slate-300 text-xs mt-1">{openGuide.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPlaying((play) => !play)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-[#071018] text-[11px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                            {isPlaying ? 'Pause clip' : 'Play clip'}
                          </button>
                          {openGuide.openTab && onNavigate && (
                            <button
                              type="button"
                              onClick={() => goToFeature(openGuide.openTab)}
                              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider cursor-pointer"
                            >
                              {openGuide.openLabel || 'Open feature'}
                              <ArrowUpRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-7 space-y-5">
                      <p className="text-slate-300 text-sm leading-relaxed">{openGuide.what}</p>

                      <div className="flex items-center gap-2">
                        {openGuide.steps.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setStepIndex(idx);
                              setIsPlaying(false);
                            }}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition-all cursor-pointer',
                              idx === stepIndex ? 'bg-cyan-400' : idx < stepIndex ? 'bg-cyan-700' : 'bg-white/10'
                            )}
                            aria-label={`Step ${idx + 1}`}
                          />
                        ))}
                      </div>

                      {currentStep && (
                        <div className="rounded-2xl border border-white/10 bg-[#0b101c] p-5">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                              Step {stepIndex + 1} of {stepCount}
                            </span>
                            <Sparkles size={14} className="text-amber-300" />
                          </div>
                          <h4 className="text-white font-bold text-lg mb-2">{currentStep.title}</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">{currentStep.body}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={stepIndex === 0}
                          onClick={() => {
                            setIsPlaying(false);
                            setStepIndex((prev) => Math.max(0, prev - 1));
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ChevronLeft size={14} /> Previous
                        </button>
                        <button
                          type="button"
                          disabled={stepIndex >= stepCount - 1}
                          onClick={() => {
                            setIsPlaying(false);
                            setStepIndex((prev) => Math.min(stepCount - 1, prev + 1));
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          Next step <ChevronRight size={14} />
                        </button>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
                        <Lightbulb size={16} className="text-amber-300 shrink-0 mt-0.5" />
                        <p className="text-amber-100/90 text-xs leading-relaxed">
                          <span className="font-black uppercase tracking-wider text-amber-300">Tip · </span>
                          {openGuide.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-white font-display font-black text-lg mb-3">All clips</h3>
                  {filteredGuides.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border bg-white/5 border-white/5 text-slate-500 text-sm">
                      No walkthrough matches “{searchQuery}”.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredGuides.map((guide) => {
                        const selected = openGuide?.id === guide.id;
                        return (
                          <button
                            key={guide.id}
                            type="button"
                            onClick={() => selectGuide(guide.id)}
                            className={cn(
                              'text-left rounded-2xl overflow-hidden border transition-all cursor-pointer group',
                              selected
                                ? 'border-cyan-400/50 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
                                : 'border-white/8 hover:border-cyan-500/30'
                            )}
                          >
                            <div className="relative h-28 overflow-hidden">
                              <img src={guide.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1024] to-transparent" />
                              <span className="absolute bottom-2 left-3 text-[10px] font-black text-white/80 flex items-center gap-1">
                                <Play size={10} /> {guide.minutes}
                              </span>
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
                    <button
                      key={faq.q}
                      type="button"
                      onClick={() => setOpenFaq(expanded ? null : i)}
                      className="w-full text-left p-5 rounded-2xl bg-[#141a2e] border border-white/5 shadow-xl hover:border-cyan-500/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-sm text-white flex items-start gap-2">
                          <CircleHelp size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                          {faq.q}
                        </h4>
                        <ChevronRight
                          size={16}
                          className={cn('text-slate-500 shrink-0 transition-transform', expanded && 'rotate-90 text-cyan-400')}
                        />
                      </div>
                      {expanded && (
                        <p className="text-slate-400 leading-relaxed text-xs mt-3 pl-6">{faq.a}</p>
                      )}
                    </button>
                  );
                })}
                {filteredFaqs.length === 0 && (
                  <div className="p-8 text-center rounded-2xl border bg-white/5 border-white/5 text-slate-500 text-sm">
                    No answers matching “{searchQuery}”.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 rounded-2xl bg-[#141a2e] border border-white/5 p-6">
                  <h3 className="text-white font-display font-black text-xl mb-1">Send a support note</h3>
                  <p className="text-slate-400 text-xs mb-5">
                    Saved on this device as a ticket. Check How-To clips first — most classroom questions are answered there.
                  </p>
                  <form onSubmit={submitTicket} className="space-y-3">
                    <input
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Subject — e.g. Calendar not showing CAPS lessons"
                      className="w-full px-4 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50"
                      required
                    />
                    <input
                      type="email"
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      placeholder="Your email (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="What were you trying to do? Which page?"
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl bg-[#0b101c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                      required
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#071018] text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      <Send size={14} /> Send ticket
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl bg-[#141a2e] border border-white/5 p-5">
                    <MessageCircle size={20} className="text-cyan-400 mb-3" />
                    <h4 className="text-white font-bold mb-1">Try a clip first</h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-3">
                      Content creation, SIAS intervention, calendar scheduling and Messenger each have a step-by-step clip.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('howtos')}
                      className="text-cyan-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 cursor-pointer"
                    >
                      Open walkthroughs <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="rounded-2xl bg-[#141a2e] border border-white/5 p-5">
                    <ExternalLink size={20} className="text-brand-yellow mb-3" />
                    <h4 className="text-white font-bold mb-1">Jump into the tool</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Every clip has an Open Feature button that takes you to the live page — Content Studio, Weekly Planner, Intervention Hub, Messenger, and more.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-4">
                {ticketSent && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm">
                    <CheckCircle2 size={16} /> Ticket saved on this device.
                  </div>
                )}
                {tickets.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl border border-white/5 bg-[#141a2e] text-slate-400 text-sm">
                    No tickets yet. Send a note from Contact Support if a walkthrough does not cover your question.
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="p-5 rounded-2xl bg-[#141a2e] border border-white/5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h4 className="text-white font-bold text-sm">{ticket.subject}</h4>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                      <p className="text-[10px] text-slate-500 mt-3 font-mono">
                        {new Date(ticket.createdAt).toLocaleString('en-ZA')}
                        {ticket.email ? ` · ${ticket.email}` : ''}
                      </p>
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
