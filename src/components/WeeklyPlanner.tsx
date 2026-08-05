import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Filter,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Grid,
  Table,
  Check,
  X,
  Bookmark,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export interface PlannerEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 1=Mon...6=Sat
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "09:30"
  category: 'caps-lesson' | 'assessment' | 'homework' | 'study-group' | 'meeting' | 'school-event';
  role: 'teacher' | 'student' | 'all';
  color?: string;
  createdAt?: string;
}

interface WeeklyPlannerProps {
  isDarkMode: boolean;
  onBack: () => void;
  userRole?: string | null;
}

const CATEGORY_STYLES: Record<string, { label: string; badgeClass: string; bgClass: string; borderClass: string }> = {
  'caps-lesson': {
    label: 'CAPS Lesson',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    bgClass: 'bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/30',
    borderClass: 'border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-900'
  },
  'assessment': {
    label: 'Assessment',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    bgClass: 'bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/30',
    borderClass: 'border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-900'
  },
  'homework': {
    label: 'Homework / Practice',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    bgClass: 'bg-emerald-50/70 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30',
    borderClass: 'border-l-4 border-l-emerald-500 border-emerald-200 dark:border-emerald-900'
  },
  'study-group': {
    label: 'Study Group',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    bgClass: 'bg-purple-50/70 dark:bg-purple-950/20 hover:bg-purple-100/70 dark:hover:bg-purple-900/30',
    borderClass: 'border-l-4 border-l-purple-500 border-purple-200 dark:border-purple-900'
  },
  'meeting': {
    label: 'Meeting',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    bgClass: 'bg-indigo-50/70 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/30',
    borderClass: 'border-l-4 border-l-indigo-500 border-indigo-200 dark:border-indigo-900'
  },
  'school-event': {
    label: 'School Event',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    bgClass: 'bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-900/30',
    borderClass: 'border-l-4 border-l-rose-500 border-rose-200 dark:border-rose-900'
  }
};

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

// Helper to get Monday of a given date's week
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to format Date to YYYY-MM-DD
function formatDateISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to generate 7 days from Monday to Sunday
function getWeekDays(startOfWeek: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// Default events to seed if Firestore is empty
function createDefaultWeekEvents(mondayDate: Date): Omit<PlannerEvent, 'id'>[] {
  const mon = formatDateISO(mondayDate);
  const tueDate = new Date(mondayDate); tueDate.setDate(tueDate.getDate() + 1);
  const tue = formatDateISO(tueDate);
  const wedDate = new Date(mondayDate); wedDate.setDate(wedDate.getDate() + 2);
  const wed = formatDateISO(wedDate);
  const thuDate = new Date(mondayDate); thuDate.setDate(thuDate.getDate() + 3);
  const thu = formatDateISO(thuDate);
  const friDate = new Date(mondayDate); friDate.setDate(friDate.getDate() + 4);
  const fri = formatDateISO(friDate);

  return [
    {
      title: 'CAPS Mathematics: 3D Shapes & Fractions',
      description: 'Term 3 CAPS Foundation Phase math block. Introduce shape faces and fraction models with visual blocks.',
      date: mon,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:30',
      category: 'caps-lesson',
      role: 'all',
      createdAt: new Date().toISOString()
    },
    {
      title: 'English HL: Phonics & Reading Circle',
      description: 'Guided reading groups A and B. Phonics mapping for ch/sh/th digraphs.',
      date: mon,
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '11:00',
      category: 'caps-lesson',
      role: 'all',
      createdAt: new Date().toISOString()
    },
    {
      title: 'Student Homework: Fractions Practice Worksheet',
      description: 'Complete page 14 in the CAPS Math Practice Workbook.',
      date: tue,
      dayOfWeek: 2,
      startTime: '14:00',
      endTime: '15:00',
      category: 'homework',
      role: 'student',
      createdAt: new Date().toISOString()
    },
    {
      title: 'Diagnostic Math Baseline Assessment',
      description: 'Short 20-minute diagnostic check on currency and simple word problems.',
      date: wed,
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '10:00',
      category: 'assessment',
      role: 'all',
      createdAt: new Date().toISOString()
    },
    {
      title: 'SGB Curricular Alignment Meeting',
      description: 'Quarterly review of CAPS lesson compliance across grade 3 classrooms.',
      date: thu,
      dayOfWeek: 4,
      startTime: '14:30',
      endTime: '15:30',
      category: 'meeting',
      role: 'teacher',
      createdAt: new Date().toISOString()
    },
    {
      title: 'Peer Study Group: Science & Nature',
      description: 'Collaborative project discussion on indigenous South African plants and habitats.',
      date: fri,
      dayOfWeek: 5,
      startTime: '11:00',
      endTime: '12:00',
      category: 'study-group',
      role: 'all',
      createdAt: new Date().toISOString()
    }
  ];
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  isDarkMode,
  onBack,
  userRole = 'teacher'
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'columns' | 'matrix'>('columns');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'my-role' | 'all'>('my-role');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | null>(null);
  const [formState, setFormState] = useState<{
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    category: PlannerEvent['category'];
    role: PlannerEvent['role'];
  }>({
    title: '',
    description: '',
    date: formatDateISO(new Date()),
    startTime: '08:00',
    endTime: '09:00',
    category: 'caps-lesson',
    role: userRole === 'student' ? 'student' : 'all'
  });

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  // Subscribe to Firestore planner_events
  useEffect(() => {
    setLoading(true);
    setError(null);
    const q = query(collection(db, 'planner_events'), orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is completely empty, let's seed default events for a rich experience
          try {
            const batch = writeBatch(db);
            const defaultEvents = createDefaultWeekEvents(currentWeekStart);
            const seededList: PlannerEvent[] = [];
            for (const item of defaultEvents) {
              const docRef = doc(collection(db, 'planner_events'));
              batch.set(docRef, item);
              seededList.push({
                id: docRef.id,
                ...item
              });
            }
            await batch.commit();
            setEvents(seededList);
          } catch (seedErr) {
            console.error('Failed to seed default events:', seedErr);
            setEvents([]);
          }
        } else {
          const list: PlannerEvent[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              title: data.title || 'Untitled Event',
              description: data.description || '',
              date: data.date || formatDateISO(new Date()),
              dayOfWeek: typeof data.dayOfWeek === 'number' ? data.dayOfWeek : new Date(data.date).getDay(),
              startTime: data.startTime || '08:00',
              endTime: data.endTime || '09:00',
              category: data.category || 'caps-lesson',
              role: data.role || 'all',
              createdAt: data.createdAt
            });
          });
          setEvents(list);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setError('Could not connect to live Firestore events. Displaying offline cache.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentWeekStart]);

  // Filter events for the current week and criteria
  const filteredEvents = useMemo(() => {
    const weekStartStr = formatDateISO(weekDays[0]);
    const weekEndStr = formatDateISO(weekDays[6]);

    return events.filter((ev) => {
      // Must fall in current week range
      if (ev.date < weekStartStr || ev.date > weekEndStr) return false;

      // Category filter
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;

      // Role filter
      if (selectedRoleFilter === 'my-role') {
        if (userRole === 'student') {
          return ev.role === 'student' || ev.role === 'all';
        } else {
          return ev.role === 'teacher' || ev.role === 'all';
        }
      }
      return true;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, weekDays, selectedCategory, selectedRoleFilter, userRole]);

  // Handle open modal for add/edit
  const handleOpenModal = (event?: PlannerEvent, defaultDateStr?: string, defaultTime?: string) => {
    if (event) {
      setEditingEvent(event);
      setFormState({
        title: event.title,
        description: event.description || '',
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        category: event.category,
        role: event.role
      });
    } else {
      setEditingEvent(null);
      setFormState({
        title: '',
        description: '',
        date: defaultDateStr || formatDateISO(new Date()),
        startTime: defaultTime || '08:00',
        endTime: defaultTime ? `${String(Number(defaultTime.split(':')[0]) + 1).padStart(2, '0')}:00` : '09:00',
        category: 'caps-lesson',
        role: userRole === 'student' ? 'student' : 'all'
      });
    }
    setIsModalOpen(true);
  };

  // Save event to Firestore
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.date) return;

    const targetDate = new Date(formState.date);
    const dayOfWeek = targetDate.getDay(); // 0-6

    const eventData = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      date: formState.date,
      dayOfWeek,
      startTime: formState.startTime,
      endTime: formState.endTime,
      category: formState.category,
      role: formState.role,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'planner_events', editingEvent.id), eventData);
      } else {
        await addDoc(collection(db, 'planner_events'), eventData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving event to Firestore:', err);
      alert('Could not save event to Firestore. Please try again.');
    }
  };

  // Delete event from Firestore
  const handleDeleteEvent = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Delete this planner event from Firestore?')) return;

    try {
      await deleteDoc(doc(db, 'planner_events', id));
      if (isModalOpen && editingEvent?.id === id) {
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event from Firestore.');
    }
  };

  // Week navigation
  const handlePrevWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() - 7);
    setCurrentWeekStart(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const isCurrentWeek = useMemo(() => {
    const todayMon = getStartOfWeek(new Date());
    return todayMon.getTime() === currentWeekStart.getTime();
  }, [currentWeekStart]);

  const weekHeaderLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('en-ZA', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-ZA', { month: 'short' });
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }, [weekDays]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'} pb-16`}>
      {/* Top Banner */}
      <div className={`${isDarkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <CalendarIcon className="w-7 h-7 text-cyan-500" />
                    Weekly Planner Grid
                  </h1>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    userRole === 'student'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                      : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300'
                  }`}>
                    {userRole === 'student' ? 'Student Timetable' : 'Teacher CAPS Schedule'}
                  </span>
                </div>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Live synced with Firestore — organize weekly lessons, assessments, and study groups.
                </p>
              </div>
            </div>

            {/* Actions / View Mode Toggle / Add Event */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* View Mode Switcher */}
              <div className={`flex items-center p-1 rounded-xl border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'columns'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Day Columns
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'matrix'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Time Table
                </button>
              </div>

              {/* Role filter button */}
              <button
                type="button"
                onClick={() => setSelectedRoleFilter(prev => prev === 'my-role' ? 'all' : 'my-role')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedRoleFilter === 'my-role'
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {userRole === 'student' ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                {selectedRoleFilter === 'my-role' 
                  ? (userRole === 'student' ? 'My Student Events' : 'My Teacher Events') 
                  : 'Showing All Roles'}
              </button>

              {/* Add Event Button */}
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>
          </div>

          {/* Week Selector Bar & Categories */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Week navigation arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' 
                    : 'border-gray-300 bg-white hover:bg-gray-100'
                }`}
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isCurrentWeek
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Current Week
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' 
                    : 'border-gray-300 bg-white hover:bg-gray-100'
                }`}
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="ml-2 text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {weekHeaderLabel}
              </span>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'bg-gray-200/70 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                All Categories ({events.length})
              </button>
              {Object.entries(CATEGORY_STYLES).map(([catKey, style]) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === catKey
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-200/70 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-amber-700 dark:text-amber-300 hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Syncing weekly events from Firestore...</p>
            </div>
          </div>
        ) : viewMode === 'columns' ? (
          /* =============================================================
             VIEW MODE 1: DAY COLUMNS GRID (Monday to Sunday)
             ============================================================= */
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((dayDate, colIdx) => {
              const dayStr = formatDateISO(dayDate);
              const dayName = dayDate.toLocaleDateString('en-ZA', { weekday: 'short' });
              const dayNum = dayDate.getDate();
              const todayFlag = formatDateISO(new Date()) === dayStr;
              const dayEvents = filteredEvents.filter(ev => ev.date === dayStr);

              return (
                <div
                  key={dayStr}
                  className={`flex flex-col rounded-2xl border transition-all ${
                    todayFlag
                      ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/10 shadow-md ring-2 ring-cyan-500/30'
                      : isDarkMode
                        ? 'border-gray-800 bg-gray-900/60'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between ${
                    todayFlag
                      ? 'bg-cyan-500 text-white border-cyan-600'
                      : isDarkMode
                        ? 'border-gray-800 bg-gray-900'
                        : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black uppercase tracking-wide ${
                        todayFlag ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {dayName}
                      </span>
                      <span className={`text-base font-black px-2 py-0.5 rounded-lg ${
                        todayFlag
                          ? 'bg-white/20 text-white'
                          : isDarkMode
                            ? 'bg-gray-800 text-gray-200'
                            : 'bg-gray-200 text-gray-800'
                      }`}>
                        {dayNum}
                      </span>
                    </div>
                    {todayFlag && (
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-white text-cyan-600 shadow-xs">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Events List for this day */}
                  <div className="p-2.5 flex-1 flex flex-col gap-2.5 min-h-[260px]">
                    {dayEvents.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                        <CalendarIcon className="w-7 h-7 text-gray-300 dark:text-gray-700 mb-1" />
                        <p className="text-xs text-gray-400 font-medium">No events scheduled</p>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(undefined, dayStr)}
                          className="mt-2.5 text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>
                    ) : (
                      dayEvents.map((ev) => {
                        const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES['caps-lesson'];
                        return (
                          <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleOpenModal(ev)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${style.bgClass} ${style.borderClass}`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-cyan-500" />
                                {ev.startTime} - {ev.endTime}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badgeClass}`}>
                                {style.label}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1.5 line-clamp-2">
                              {ev.title}
                            </h4>
                            {ev.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {ev.description}
                              </p>
                            )}
                            <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between text-[11px] text-gray-500">
                              <span className="capitalize font-medium">
                                {ev.role === 'all' ? 'All Roles' : `${ev.role} only`}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteEvent(ev.id, e)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Delete event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}

                    {/* Footer add button per column */}
                    <button
                      type="button"
                      onClick={() => handleOpenModal(undefined, dayStr)}
                      className="mt-auto w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 text-xs font-semibold text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to {dayName}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =============================================================
             VIEW MODE 2: TIMETABLE MATRIX GRID (Hours x Days)
             ============================================================= */
          <div className={`rounded-2xl border overflow-hidden shadow-sm ${
            isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className={isDarkMode ? 'bg-gray-800/80 border-b border-gray-800' : 'bg-gray-100 border-b border-gray-200'}>
                    <th className="p-3.5 text-left text-xs font-black uppercase text-gray-500 w-24 border-r border-gray-200 dark:border-gray-800">
                      Time Slot
                    </th>
                    {weekDays.map((dayDate) => {
                      const dayStr = formatDateISO(dayDate);
                      const dayName = dayDate.toLocaleDateString('en-ZA', { weekday: 'short' });
                      const dayNum = dayDate.getDate();
                      const todayFlag = formatDateISO(new Date()) === dayStr;
                      return (
                        <th
                          key={dayStr}
                          className={`p-3.5 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-800 ${
                            todayFlag ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-black' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-xs font-black uppercase">{dayName}</span>
                            <span className="text-sm font-black px-1.5 py-0.5 rounded-lg bg-gray-200 dark:bg-gray-700">
                              {dayNum}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {TIME_SLOTS.map((timeSlot) => {
                    const slotHour = Number(timeSlot.split(':')[0]);
                    return (
                      <tr key={timeSlot} className="group">
                        {/* Time Slot Header */}
                        <td className={`p-3 text-xs font-bold whitespace-nowrap border-r border-gray-200 dark:border-gray-800 ${
                          isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {timeSlot} - {String(slotHour + 1).padStart(2, '0')}:00
                        </td>

                        {/* Cells for each Day */}
                        {weekDays.map((dayDate) => {
                          const dayStr = formatDateISO(dayDate);
                          const matchingEvents = filteredEvents.filter((ev) => {
                            if (ev.date !== dayStr) return false;
                            const evHour = Number(ev.startTime.split(':')[0]);
                            return evHour === slotHour;
                          });

                          return (
                            <td
                              key={dayStr}
                              onClick={() => {
                                if (matchingEvents.length === 0) {
                                  handleOpenModal(undefined, dayStr, timeSlot);
                                }
                              }}
                              className={`p-2 border-r last:border-r-0 border-gray-200 dark:border-gray-800 align-top h-24 transition-colors ${
                                matchingEvents.length === 0
                                  ? 'hover:bg-cyan-50/40 dark:hover:bg-cyan-950/10 cursor-pointer'
                                  : ''
                              }`}
                            >
                              {matchingEvents.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {matchingEvents.map((ev) => {
                                    const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES['caps-lesson'];
                                    return (
                                      <div
                                        key={ev.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenModal(ev);
                                        }}
                                        className={`p-2 rounded-lg border text-left cursor-pointer shadow-xs transition-transform hover:scale-[1.02] ${style.bgClass} ${style.borderClass}`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[11px] font-black tracking-tight">
                                            {ev.startTime}-{ev.endTime}
                                          </span>
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${style.badgeClass}`}>
                                            {style.label}
                                          </span>
                                        </div>
                                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-2">
                                          {ev.title}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* =============================================================
          MODAL: ADD / EDIT PLANNER EVENT
          ============================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden ${
                isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      {editingEvent ? 'Edit Weekly Event' : 'New Weekly Event'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Syncs to Firestore `/planner_events`
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    placeholder="e.g. CAPS Math: Grade 3 Measurement & Length"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Category & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value as PlannerEvent['category'] })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    >
                      {Object.entries(CATEGORY_STYLES).map(([catKey, style]) => (
                        <option key={catKey} value={catKey}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Target Role
                    </label>
                    <select
                      value={formState.role}
                      onChange={(e) => setFormState({ ...formState, role: e.target.value as PlannerEvent['role'] })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Roles (Teachers & Students)</option>
                      <option value="teacher">Teacher Only</option>
                      <option value="student">Student Only</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formState.date}
                      onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formState.startTime}
                      onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formState.endTime}
                      onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Description & Resources
                  </label>
                  <textarea
                    rows={3}
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Enter lesson goals, CAPS workbook page references, or meeting notes..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    {editingEvent && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(editingEvent.id)}
                        className="px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Event
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                      {editingEvent ? 'Save Changes' : 'Create Event'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
