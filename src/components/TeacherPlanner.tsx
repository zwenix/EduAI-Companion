import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  FileText,
  UserCheck,
  Award,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface PlannerEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  timeSlot: string; // e.g. "08:00 - 09:00"
  category: 'caps-lesson' | 'assessment' | 'parent-meeting' | 'school-event';
  description: string;
}

interface TeacherPlannerProps {
  isDarkMode: boolean;
  onBack: () => void;
}

// Preloaded CAPS timeline items to populate the calendar
const INITIAL_EVENTS: PlannerEvent[] = [
  {
    id: 'ev-1',
    date: new Date().toISOString().split('T')[0], // Today
    title: 'CAPS Mathematics: 3D Objects & Fractions',
    timeSlot: '08:00 - 09:30',
    category: 'caps-lesson',
    description: 'Introducing 3D shape attributes and foundational fractions using visual aids. Focus on Grade 3 CAPS Workbook Term 3.'
  },
  {
    id: 'ev-2',
    date: new Date().toISOString().split('T')[0], // Today
    title: 'Diagnostic Math Assessment: Term 3 Baseline',
    timeSlot: '11:00 - 12:00',
    category: 'assessment',
    description: 'Diagnose learning barriers regarding addition, subtraction, and simple currency representations.'
  },
  {
    id: 'ev-3',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    title: 'CAPS English HL: Phonics & Reading Groups',
    timeSlot: '09:30 - 10:30',
    category: 'caps-lesson',
    description: 'Interactive phonics sound mapping (sh/ch/th) and shared reading activities with low-level reader groups.'
  },
  {
    id: 'ev-4',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    title: 'SGB Curricular Review Meeting',
    timeSlot: '14:30 - 16:00',
    category: 'school-event',
    description: 'Quarterly review of CAPS lesson compliance and assessment schedules across foundation phases.'
  },
  {
    id: 'ev-5',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // In 2 days
    title: 'Parent-Teacher Consultations: Grade 3A',
    timeSlot: '13:00 - 15:30',
    category: 'parent-meeting',
    description: 'Individual progress sharing and developmental goal alignment for selected learners.'
  }
];

export const TeacherPlanner: React.FC<TeacherPlannerProps> = ({ isDarkMode, onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<PlannerEvent[]>(() => {
    const saved = localStorage.getItem('eduai_planner_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [diaryNotes, setDiaryNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('eduai_planner_diary');
    return saved ? JSON.parse(saved) : {
      [new Date().toISOString().split('T')[0]]: 'Classes were very engaged today during the fractions lesson. Learner Sipho needs additional reading support in phonics group B. Plan diagnostic worksheets.'
    };
  });

  const [currentNote, setCurrentNote] = useState('');
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<PlannerEvent, 'id' | 'date'>>({
    title: '',
    timeSlot: '08:00 - 09:00',
    category: 'caps-lesson',
    description: ''
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('eduai_planner_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('eduai_planner_diary', JSON.stringify(diaryNotes));
  }, [diaryNotes]);

  // Load note for selected date
  useEffect(() => {
    setCurrentNote(diaryNotes[selectedDateStr] || '');
  }, [selectedDateStr, diaryNotes]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectDay = (day: number) => {
    const d = new Date(year, month, day);
    // Adjust timezone offsets for YYYY-MM-DD
    const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDateStr(localDateStr);
  };

  const handleSaveDiary = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setDiaryNotes(prev => ({
        ...prev,
        [selectedDateStr]: currentNote
      }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const eventToAdd: PlannerEvent = {
      ...newEvent,
      id: 'ev-' + Date.now(),
      date: selectedDateStr
    };

    setEvents(prev => [...prev, eventToAdd]);
    setIsNewEventModalOpen(false);
    setNewEvent({
      title: '',
      timeSlot: '08:00 - 09:00',
      category: 'caps-lesson',
      description: ''
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
  };

  // Filter events for selected day
  const selectedDayEvents = events.filter(ev => ev.date === selectedDateStr);

  // Helper to check if a calendar date has events
  const getEventsForDateStr = (dateStr: string) => {
    return events.filter(ev => ev.date === dateStr);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar cells builder
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12 border border-white/5 opacity-20 bg-slate-900/10" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = selectedDateStr === dateStr;
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const dayEvents = getEventsForDateStr(dateStr);

    days.push(
      <button
        key={`day-${d}`}
        onClick={() => selectDay(d)}
        className={`h-14 border border-white/5 flex flex-col items-center justify-between p-1.5 transition-all relative cursor-pointer hover:bg-slate-800/40 ${
          isSelected 
            ? 'bg-gradient-to-tr from-cyan-600/30 to-indigo-600/30 border-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.25)]' 
            : isToday 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
              : 'bg-slate-950/20'
        }`}
      >
        <span className={`text-xs font-bold ${isToday ? 'text-amber-400' : isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
          {d}
        </span>

        {/* Categories markers */}
        <div className="flex gap-1 justify-center mt-1 w-full flex-wrap overflow-hidden max-h-[14px]">
          {dayEvents.slice(0, 3).map((ev) => {
            let color = 'bg-cyan-400';
            if (ev.category === 'assessment') color = 'bg-rose-500';
            else if (ev.category === 'school-event') color = 'bg-emerald-500';
            else if (ev.category === 'parent-meeting') color = 'bg-amber-500';
            return (
              <span 
                key={ev.id} 
                className={`w-1.5 h-1.5 rounded-full ${color} shadow-[0_0_4px_currentColor]`}
                title={ev.title}
              />
            );
          })}
          {dayEvents.length > 3 && (
            <span className="text-[7px] text-slate-400 font-black">+</span>
          )}
        </div>
      </button>
    );
  }

  const categoryLabels = {
    'caps-lesson': { name: 'CAPS Lesson', color: 'bg-indigo-500/15 border-indigo-400 text-indigo-300' },
    'assessment': { name: 'Assessment', color: 'bg-rose-500/15 border-rose-400 text-rose-300' },
    'parent-meeting': { name: 'Parent Meeting', color: 'bg-amber-500/15 border-amber-400 text-amber-300' },
    'school-event': { name: 'School Event', color: 'bg-emerald-500/15 border-emerald-400 text-emerald-300' }
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-white p-6 md:p-8 space-y-6">
      
      {/* Visual Header Banner */}
      <div className="relative p-6 md:p-8 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-r from-emerald-900/40 via-[#0a0f24] to-indigo-950/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="space-y-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white transition-all w-fit cursor-pointer border border-white/5"
          >
            <ArrowLeft size={14} /> Back to Office
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-display uppercase">
                Teacher's Planner & Diary
              </h1>
              <p className="text-slate-400 text-xs font-mono tracking-widest uppercase">
                CAPS Curricular Scheduler & Lesson Logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/5 text-center min-w-[100px]">
            <span className="block text-xl font-black text-emerald-400">
              {events.length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Total Items
            </span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/5 text-center min-w-[100px]">
            <span className="block text-xl font-black text-indigo-400">
              {Object.keys(diaryNotes).length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Diary Logs
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Calendar & Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[32px] border border-white/5 bg-[#0c1225]/90 p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-2xl rounded-full" />
            
            {/* Month Control Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon size={16} className="text-cyan-400" />
                {monthNames[month]} {year}
              </h2>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekdays Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-[10px] font-black uppercase text-slate-500 tracking-wider py-1 font-mono">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days}
            </div>

            {/* Category Legends */}
            <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CAPS Lesson</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Meetings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">School Events</span>
              </div>
            </div>
          </div>

          {/* Quick Stats & Alerts Info Panel */}
          <div className="rounded-[24px] border border-white/5 bg-slate-900/30 p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-400" />
              CAPS ATP Synchronization Alert
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              You are currently aligned with <strong className="text-emerald-400">Term 3 Week 5</strong>. 
              The curriculum database lists 2 pending baseline reviews before the week closes. Ensure Grade 3 mathematics objectives are logged.
            </p>
          </div>
        </div>

        {/* Right Column: Daily Schedules & Diary Notes (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Day Scheduler Panel */}
          <div className="rounded-[32px] border border-white/5 bg-[#0c1225]/90 p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase block font-bold">
                  Schedule for
                </span>
                <h3 className="text-lg font-black text-white font-display uppercase tracking-wide">
                  {new Date(selectedDateStr).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              
              <button
                onClick={() => setIsNewEventModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
              >
                <Plus size={14} /> Add Event
              </button>
            </div>

            {/* List of Events */}
            <div className="space-y-4">
              {selectedDayEvents.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mx-auto">
                    <Clock size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Scheduled Activities</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    Click the "Add Event" button to schedule CAPS lessons, assessments, reviews, or parent consultations.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {selectedDayEvents.map((ev) => {
                    const labelMeta = categoryLabels[ev.category];
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:bg-slate-950/70 transition-all flex items-start gap-4"
                      >
                        {/* Bullet / Icon */}
                        <div className={`mt-0.5 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest shrink-0 ${labelMeta.color}`}>
                          {labelMeta.name}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-black text-white truncate font-display">
                              {ev.title}
                            </h4>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Delete event"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Clock size={12} className="text-slate-500" />
                            {ev.timeSlot}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Daily Personal Diary & Reflection Notes */}
          <div className="rounded-[32px] border border-white/5 bg-[#0c1225]/90 p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase block font-bold">
                  Daily Log
                </span>
                <h3 className="text-lg font-black text-white font-display uppercase tracking-wide">
                  Teacher's Diary & Reflection Notes
                </h3>
              </div>
              <Save size={18} className="text-indigo-400/50" />
            </div>

            <p className="text-[11px] text-slate-400 leading-snug mb-4 font-medium">
              Record daily achievements, challenges, specific student development logs, or school reminders. Logs are saved locally.
            </p>

            <div className="space-y-4">
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Type your daily notes, student tracking points, or CAPS reminders here..."
                rows={5}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/20 font-medium leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  {currentNote.length} characters written
                </span>
                
                <button
                  onClick={handleSaveDiary}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle size={14} className="text-emerald-300" />
                      Saved Entry!
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Diary Entry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* New Event Dialog Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0c1225] p-6 shadow-2xl space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full" />
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">New Activity</span>
                <h3 className="text-base font-black text-white font-display uppercase tracking-wide">Schedule New Event</h3>
              </div>
              <button 
                onClick={() => setIsNewEventModalOpen(false)}
                className="p-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="rotate-90" size={16} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Event Title / CAPS Topic</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. CAPS Math: Addition & Subtraction"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400/40"
                />
              </div>

              {/* Time Slot & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Time Slot</label>
                  <select
                    value={newEvent.timeSlot}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, timeSlot: e.target.value }))}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400/40"
                  >
                    <option value="08:00 - 09:00">08:00 - 09:00</option>
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:00 - 12:00">11:00 - 12:00</option>
                    <option value="12:00 - 13:00">12:00 - 13:00</option>
                    <option value="13:00 - 14:00">13:00 - 14:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                    <option value="15:00 - 16:00">15:00 - 16:00</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400/40"
                  >
                    <option value="caps-lesson">CAPS Lesson</option>
                    <option value="assessment">Assessment</option>
                    <option value="parent-meeting">Parent Meeting</option>
                    <option value="school-event">School Event</option>
                  </select>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Activity Description / Lesson Objectives</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter lesson goals, required material, or focus pupils..."
                  rows={3}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400/40 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Schedule Event
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
