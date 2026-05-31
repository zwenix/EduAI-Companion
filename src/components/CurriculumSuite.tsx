import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Trophy, Compass, Plus, Search, Calendar, ChevronRight, FileText, 
  Settings, CheckCircle, Sparkles, AlertCircle, ShoppingBag, ListTodo, Users, 
  Map, Award, Flame, Star, ShieldAlert, Check, HelpCircle, Download, FilePlus
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { educationalData, getSubjects, getTopics } from '../lib/educational-data';
import confetti from 'canvas-confetti';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface QuestionItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  question: string;
  answer: string;
  marks: number;
}

const QUESTION_BANK: QuestionItem[] = [
  {
    id: 'q1',
    subject: 'Mathematics',
    topic: 'Patterns, Functions and Algebra: Factorization',
    difficulty: 'Medium',
    question: 'Factorise completely the following algebraic trinomial: x² - 5x - 24',
    answer: 'x² - 5x - 24 = (x - 8)(x + 3)',
    marks: 3
  },
  {
    id: 'q2',
    subject: 'Mathematics',
    topic: 'Patterns, Functions and Algebra: Fractions',
    difficulty: 'Challenging',
    question: 'Simplify the following: (2x² - 8) / (x - 2)',
    answer: '2(x² - 4) / (x - 2) = 2(x - 2)(x + 2) / (x - 2) = 2(x + 2) = 2x + 4',
    marks: 4
  },
  {
    id: 'q3',
    subject: 'Natural Sciences',
    topic: 'Planet Earth and Beyond: Planet Earth',
    difficulty: 'Easy',
    question: 'Identify the gas that is most abundant inside Earth\'s atmosphere.',
    answer: 'Nitrogen (~78%)',
    marks: 1
  },
  {
    id: 'q4',
    subject: 'Natural Sciences',
    topic: 'Energy and Change: Electromagnetic circuits',
    difficulty: 'Medium',
    question: 'State Ohm\'s Law and describe the mathematical ratio between electrical potential difference, current, and resistance.',
    answer: 'Ohm\'s Law states that current through a conductor is directly proportional to potential difference across it, provided temperature remains constant. R = V / I.',
    marks: 4
  },
  {
    id: 'q5',
    subject: 'English Home Language',
    topic: 'Language Structures: Parts of Speech',
    difficulty: 'Medium',
    question: 'Convert the following passive statement into active voice sentence: "The homework was completed by Sibusiso."',
    answer: 'Sibusiso completed the homework.',
    marks: 2
  },
  {
    id: 'q6',
    subject: 'Mathematics',
    topic: 'Calculus: Derivatives',
    difficulty: 'Challenging',
    question: 'Determine the derivative of f(x) = 3x² - 5x + 12 from first principles.',
    answer: 'f\'(x) = lim[h->0](f(x+h)-f(x))/h = ... = 6x - 5',
    marks: 6
  }
];

interface LeaderboardUser {
  name: string;
  points: number;
  level: number;
  streak: number;
  avatar: string;
  isSelf?: boolean;
}

interface PointItem {
  id: string;
  name: string;
  cost: number;
  desc: string;
  icon: any;
  category: 'avatar' | 'token' | 'privilege';
  claimed?: boolean;
}

export default function CurriculumSuite({ isDarkMode, userRole }: { isDarkMode: boolean; userRole: string | null }) {
  const [currentTab, setCurrentTab] = useState<'curriculum' | 'lessons' | 'gamification'>('curriculum');
  const [selectedPhase, setSelectedPhase] = useState<string>('FET Phase');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Profile loading state
  const [studentDoc, setStudentDoc] = useState<any | null>(null);
  const [points, setPoints] = useState<number>(350);
  const [userLevel, setUserLevel] = useState<number>(3);
  const [userXp, setUserXp] = useState<number>(40);
  const [streakDays, setStreakDays] = useState<number>(5);

  // Lesson Planner state
  const [lessons, setLessons] = useState<any[]>([]);
  const [newLesson, setNewLesson] = useState({
    title: '',
    topic: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    resources: 'Revision Guide v1'
  });

  // Load lessons dynamically from Firestore / localStorage
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const email = auth.currentUser?.email?.toLowerCase().trim();
        if (email) {
          const q = query(collection(db, 'lessons'), where('userEmail', '==', email));
          const snap = await getDocs(q);
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setLessons(list);
        } else {
          const local = localStorage.getItem('eduai_lessons');
          if (local) {
            setLessons(JSON.parse(local));
          } else {
            setLessons([
              {
                id: 'sample_1',
                title: 'Introduction to Fractions',
                topic: 'Fractions & Percentages',
                date: new Date().toISOString().split('T')[0],
                notes: 'Focus on understanding numerator and denominator concepts.',
                resources: 'Interactive Workbook v1.pdf',
                phase: 'Intermediate Phase',
                subject: 'Mathematics'
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading lessons from Firestore", err);
      }
    };
    fetchLessons();
  }, []);

  // Assessment Builder state
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionItem[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState<string>('Weekly Quick Assessment');

  // Load profile metrics from database for gamification sync
  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          const email = auth.currentUser.email?.toLowerCase().trim() || '';
          const q = query(collection(db, 'students'), where('email', '==', email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docRef = snap.docs[0];
            const data = docRef.data();
            setStudentDoc({ id: docRef.id, ...data });
            if (data.points !== undefined) setPoints(data.points);
            else setPoints(350); // Default points shop cache 
            if (data.streak !== undefined) setStreakDays(data.streak);
            if (data.level !== undefined) setUserLevel(data.level);
            if (data.xp !== undefined) setUserXp(data.xp);
          }
        } catch (err) {
          console.error("Error loading user profile inside CurriculumSuite:", err);
        }
      }
    };
    fetchProfile();
  }, []);

  // Sync points back to Firestore helper
  const handleUpdatePoints = async (newVal: number, xpDelta = 10) => {
    setPoints(newVal);
    let nextXp = userXp + xpDelta;
    let nextLevel = userLevel;
    if (nextXp >= 100) {
      nextXp = nextXp % 100;
      nextLevel += 1;
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#22d3ee', '#fbbf24', '#818cf8', '#34d399']
      });
    }
    setUserXp(nextXp);
    setUserLevel(nextLevel);

    if (studentDoc?.id) {
      try {
        await updateDoc(doc(db, 'students', studentDoc.id), {
          points: newVal,
          xp: nextXp,
          level: nextLevel
        });
      } catch (err) {
        console.warn("Could not sync points/xp to DB", err);
      }
    }
  };

  // Quests
  const [quests, setQuests] = useState([
    { id: 'q_1', task: 'Complete a continuous math challenge', xp: 45, completed: false },
    { id: 'q_2', task: 'Revise 2 CAPS Natural Sciences subtopics', xp: 30, completed: false },
    { id: 'q_3', task: 'Assemble a printable worksheet from Question Bank', xp: 50, completed: false },
  ]);

  const handleCompleteQuest = (id: string, xpValue: number) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
    handleUpdatePoints(points + xpValue, xpValue);
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#06b6d4', '#10b981']
    });
  };

  // Points Shop items static definitions
  const [shopItems, setShopItems] = useState<PointItem[]>([
    { id: 'shop_1', name: 'Mascot Golden Crown', cost: 120, desc: 'Unlocks a sparkling crown for your digital helper avatar.', icon: Trophy, category: 'avatar' },
    { id: 'shop_2', name: 'Homework Waiver Slip', cost: 300, desc: 'Digital token approved by teachers for a single extra assignment extension.', icon: FileText, category: 'token' },
    { id: 'shop_3', name: 'Direct AI Booster Pad', cost: 150, desc: 'Unlocks unlimited double-length conversations with your personal tutor.', icon: Sparkles, category: 'privilege' },
    { id: 'shop_4', name: 'SBA Mock Quiz Pass', cost: 200, desc: 'Unlocks formal Diagnostic mock exam papers complete with memorandums.', icon: CheckCircle, category: 'token' },
  ]);

  const handleBuyShopItem = (item: PointItem) => {
    if (points >= item.cost) {
      const nextPoints = points - item.cost;
      handleUpdatePoints(nextPoints, 0);
      setShopItems(prev => prev.map(p => p.id === item.id ? { ...p, claimed: true } : p));
      confetti({
        particleCount: 80,
        spread: 70,
        colors: ['#f59e0b', '#3b82f6']
      });
    } else {
      alert("Insufficient points! Finish your daily quests or study with the AI Tutor to earn more points.");
    }
  };

  // Curriculum database organized hierarchies
  const syllabusHierarchy = useMemo(() => {
    return {
      'Foundation Phase': {
        'Mathematics': ['Numbers and Relationships', 'Geometric Patterns', '2D Shapes', 'Measurement & Time', 'Sorting Objects'],
        'Home Language': ['Sounds and Phonemes', 'Letter-Sound Phonics', 'Forming Letters', 'Simple Sentences'],
        'Life Skills': ['Personal Well-being', 'Drawing and Painting', 'Gross Motor Skills']
      },
      'Intermediate Phase': {
        'Mathematics': ['Common Fractions', 'Number Patterns', '3D Objects', 'Length & Perimeter', 'Interpreting Bar Graphs'],
        'Social Sciences': ['Map Skills', 'Physical Features of SA', 'Ancient Civilizations'],
        'Natural Sciences and Technology': ['Plants and Animals', 'Properties of Materials', 'Energy for Life', 'The Solar System']
      },
      'Senior Phase': {
        'Mathematics': ['Exponents & Equations', 'Functions & Graphs', 'Geometry of 2D Shapes', 'Probability'],
        'Economic and Management Sciences': ['Needs and Wants', 'Budgets and Saving', 'Starting a Business'],
        'Technology': ['Forces and Materials', 'Levers and Gears', 'Electrical Circuits']
      },
      'FET Phase': {
        'Mathematics': ['Algebra & Trinomials', 'Functions, Parabolas', 'Trigonometry & Ratios', 'Probability & Stats'],
        'Physical Sciences': ['Vectors & 1D Motion', 'Waves & Sound Refraction', 'Periodic Table Basics', 'Stoichiometry'],
        'Life Sciences': ['Chemistry of Cells', 'Molecules to Organs', 'Genetics & RNA Transcription', 'Biodiversity']
      }
    };
  }, []);

  const availableSubjects = useMemo(() => {
    const list = syllabusHierarchy[selectedPhase as keyof typeof syllabusHierarchy] || {};
    return Object.keys(list);
  }, [selectedPhase, syllabusHierarchy]);

  const availableTopics = useMemo(() => {
    const list = syllabusHierarchy[selectedPhase as keyof typeof syllabusHierarchy] || {};
    return (list[selectedSubject as keyof typeof list] as string[]) || [];
  }, [selectedPhase, selectedSubject, syllabusHierarchy]);

  // Vetted Resource Library structured data
  const VETTED_RESOURCES = [
    { title: 'Algebra Factoring Cheat Sheet', subject: 'Mathematics', desc: 'Summary of Difference of Two Squares & Trinomial groupings with worked out CAPS solutions.', linkText: 'Interactive PDF Note' },
    { title: 'Properties of Materials Practical Guide', subject: 'Natural Sciences', desc: 'Laboratory helper defining solid states, liquids, gases, and atomic structures.', linkText: 'Virtual Lab Worksheet' },
    { title: 'Phonics Letter-Sound Activity Chart', subject: 'Home Language', desc: 'A workbook complete with alphabet graphics, vowel combinations, and spelling cards.', linkText: 'Printable Poster' },
    { title: 'Electromagnetic Field Theory Workbook', subject: 'Physical Sciences', desc: 'Series of 15 diagnostic exercises on circuits, resistors, and electrical flows.', linkText: 'Assessment Note' }
  ];

  // Filtered vetted resources
  const matchedResources = VETTED_RESOURCES.filter(r => r.subject === selectedSubject || selectedSubject === 'All');

  // Save lesson planner handler
  const handleAddLesson = async () => {
    if (!newLesson.title || !newLesson.topic) return;
    const email = auth.currentUser?.email?.toLowerCase().trim() || 'guest';
    const item = {
      title: newLesson.title,
      topic: newLesson.topic,
      date: newLesson.date,
      notes: newLesson.notes,
      resources: newLesson.resources,
      phase: selectedPhase,
      subject: selectedSubject,
      userEmail: email,
      createdAt: new Date().toISOString()
    };

    try {
      if (auth.currentUser) {
        const docRef = await addDoc(collection(db, 'lessons'), item);
        const savedItem = { id: docRef.id, ...item };
        setLessons(prev => [savedItem, ...prev]);
      } else {
        const savedItem = { id: `lesson_${Date.now()}`, ...item };
        const nextLessons = [savedItem, ...lessons];
        setLessons(nextLessons);
        localStorage.setItem('eduai_lessons', JSON.stringify(nextLessons));
      }
    } catch (err) {
      console.error("Error saving lesson:", err);
      const savedItem = { id: `lesson_${Date.now()}`, ...item };
      const nextLessons = [savedItem, ...lessons];
      setLessons(nextLessons);
      localStorage.setItem('eduai_lessons', JSON.stringify(nextLessons));
    }

    setNewLesson({
      title: '',
      topic: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      resources: 'Revision Guide v1'
    });
    confetti({
      particleCount: 40,
      spread: 50
    });
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      if (auth.currentUser && !lessonId.toString().startsWith('sample_') && !lessonId.toString().startsWith('lesson_')) {
        await deleteDoc(doc(db, 'lessons', lessonId));
      }
    } catch (err) {
      console.warn("Could not delete lesson from cloud, updating local view", err);
    }
    const nextLessons = lessons.filter(l => l.id !== lessonId);
    setLessons(nextLessons);
    localStorage.setItem('eduai_lessons', JSON.stringify(nextLessons));
  };

  // Assessment question list
  const handleToggleQuestion = (q: QuestionItem) => {
    if (selectedQuestions.some(item => item.id === q.id)) {
      setSelectedQuestions(selectedQuestions.filter(item => item.id !== q.id));
    } else {
      setSelectedQuestions([...selectedQuestions, q]);
    }
  };

  // Total assessment marks
  const totalAssessmentMarks = selectedQuestions.reduce((acc, q) => acc + q.marks, 0);

  // Leaderboard mock players rosters
  const LEADERBOARD_ROSTER: LeaderboardUser[] = [
    { name: 'Lerato Molefe', points: 410, level: 4, streak: 9, avatar: '🦊' },
    { name: 'Jaden Naidoo', points: 380, level: 3, streak: 7, avatar: '🐼' },
    { name: 'Sibusiso Dube', points: points, level: userLevel, streak: streakDays, avatar: '🐯', isSelf: true },
    { name: 'Chloe Peters', points: 290, level: 3, streak: 4, avatar: '🐰' },
    { name: 'Amara Adebayo', points: 250, level: 2, streak: 3, avatar: '🐣' }
  ];

  const sortedLeaderboard = useMemo(() => {
    return [...LEADERBOARD_ROSTER].sort((a, b) => b.points - a.points);
  }, [points, userLevel, streakDays]);

  return (
    <div className={`space-y-6 sm:space-y-8 animate-in fade-in duration-500`}>
      {/* Dynamic Nav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Compass className="text-brand-cyan" size={24} />
          <h2 className={`text-xl sm:text-2xl font-hand uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Syllabus & Gamification Hub
          </h2>
        </div>
        
        <div className="flex gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
          {[
            { id: 'curriculum', label: 'CAPS Syllabus Tree', icon: Map },
            { id: 'lessons', label: 'Lesson & Assessment Studio', icon: FilePlus },
            { id: 'gamification', label: 'Gamification & Rewards', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                currentTab === tab.id 
                  ? "bg-brand-cyan text-navy-dark shadow-lg shadow-cyan-500/20" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CURRICULUM SYLLABUS TAB */}
      {currentTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left selectors sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
              <h3 className={`text-sm font-black uppercase tracking-wider text-cyan-400`}>CAPS Educational Phases</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Select a curriculum phase to map exact national standards.</p>
              
              <div className="flex flex-col gap-2 pt-2">
                {['Foundation Phase', 'Intermediate Phase', 'Senior Phase', 'FET Phase'].map(phase => (
                  <button
                    key={phase}
                    onClick={() => {
                      setSelectedPhase(phase);
                      const subs = Object.keys(syllabusHierarchy[phase as keyof typeof syllabusHierarchy]);
                      if (subs.length > 0) {
                        setSelectedSubject(subs[0]);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all font-bold text-xs uppercase tracking-wider",
                      selectedPhase === phase 
                        ? (isDarkMode ? 'bg-brand-cyan/15 border-brand-cyan text-white' : 'bg-cyan-50 border-cyan-200 text-cyan-900')
                        : (isDarkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100')
                    )}
                  >
                    <span>{phase}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Dropdown list */}
            {availableSubjects.length > 0 && (
              <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
                <h3 className={`text-sm font-black uppercase tracking-wider text-indigo-400`}>Subject Selection</h3>
                <div className="flex flex-wrap gap-2 pt-2">
                  {availableSubjects.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={cn(
                        "px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                        selectedSubject === sub
                          ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md' : 'bg-indigo-50 border-indigo-200 text-indigo-900')
                          : (isDarkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-100 text-slate-600 hover:bg-slate-200')
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Topic Hierarchy & Resource Library Display */}
          <div className="lg:col-span-2 space-y-8">
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] text-brand-cyan uppercase tracking-widest font-black">{selectedPhase}</span>
                  <h3 className={`text-2xl font-hand mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedSubject} Curriculum Topics Hierarchy
                  </h3>
                </div>
                <span className="text-xs font-black uppercase text-[#10b981] bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/20">
                  Standard Compliant
                </span>
              </div>

              {/* Live hierarchy list */}
              <div className="space-y-4">
                {availableTopics.map((topic, index) => (
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border flex items-center gap-4 ${
                      isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center font-bold text-xs text-teal-400">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {topic}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">
                        National Curriculum Outcome (SBA Map Item)
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Vetted CAPS Resource Library */}
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-hand mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Vetted Educational Resource Library
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedResources.map((res, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      isDarkMode ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-[8px] tracking-widest uppercase font-black text-brand-cyan mb-1.5 block">
                        Vetted • {res.subject}
                      </span>
                      <h4 className={`text-sm font-black leading-snug ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {res.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {res.desc}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => alert(`Launching resource file: ${res.title}. High-resolution printable copy downloaded to system.`)}
                      className="mt-4 inline-flex items-center gap-1.5 text-[9px] uppercase font-black tracking-wider text-indigo-400 hover:text-indigo-300 w-fit cursor-pointer"
                    >
                      <Download size={12} />
                      <span>{res.linkText}</span>
                    </button>
                  </div>
                ))}
                
                {matchedResources.length === 0 && (
                  <p className="p-4 text-center text-slate-500 text-xs col-span-2">
                    No vetted files available for selected subject. Select another curriculum item.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER LESSONS & ASSESSMENT PLANNER */}
      {currentTab === 'lessons' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left pane: Add and planner schedule list */}
          <div className="xl:col-span-1 space-y-6">
            <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
              <h3 className={`text-sm font-black uppercase tracking-wider text-cyan-400`}>Lesson Scheduler & Planner</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Schedule curriculum lectures linked directly to active CAPS outcomes to ensure syllabus pacing.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Lesson Plan Title
                  </label>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                    placeholder="e.g. Intro to Quadratics"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-cyan border ${
                      isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Select Target Syllabus Topic
                  </label>
                  <select
                    value={newLesson.topic}
                    onChange={e => setNewLesson({...newLesson, topic: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-cyan border ${
                      isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="">-- Choose CAPS topic --</option>
                    {availableTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={newLesson.date}
                    onChange={e => setNewLesson({...newLesson, date: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-cyan border ${
                      isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Pedagogical Notes
                  </label>
                  <textarea
                    rows={3}
                    value={newLesson.notes}
                    placeholder="Describe main goals, pacing, and exit tickets."
                    onChange={e => setNewLesson({...newLesson, notes: e.target.value})}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-cyan border resize-none ${
                      isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddLesson}
                  disabled={!newLesson.title || !newLesson.topic}
                  className="w-full py-3 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-[1.01] active:scale-95 duration-200 transition-all shadow-md disabled:opacity-50"
                >
                  Schedule Lesson Plan
                </button>
              </div>
            </div>
          </div>

          {/* Right Pane: Lesson Planner List / Assessment Builder */}
          <div className="xl:col-span-2 space-y-8">
            {/* Scheduled lessons list */}
            {lessons.length > 0 && (
              <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-hand mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Upcoming Scheduled Lesson Plans
                </h3>
                <div className="space-y-4">
                  {lessons.map(lesson => (
                    <div 
                      key={lesson.id}
                      className={`p-4 rounded-2xl border flex items-start justify-between ${
                        isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-cyan-100 dark:bg-cyan-950 text-cyan-600 px-2 py-0.5 rounded">
                            {lesson.subject}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">{lesson.date}</span>
                        </div>
                        <h4 className={`text-base font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{lesson.title}</h4>
                        <p className="text-xs text-indigo-400 font-semibold mt-1">CAPS Mapping: {lesson.topic}</p>
                        {lesson.notes && <p className="text-xs text-slate-500 mt-2 leading-relaxed italic">"{lesson.notes}"</p>}
                      </div>
                      <button 
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors p-1"
                      >
                        <ShieldAlert size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehensive CAPS Assessment & Exam Builder */}
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} space-y-6`}>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Question Item Assembler</span>
                <h3 className={`text-2xl font-hand mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  CAPS Vetted Question Bank Builder
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Assemble standardized assessments by adding questions from our vetted academic repository. Toggle items to generate print-ready papers.
                </p>
              </div>

              {/* Assessment details settings inputs */}
              <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Assessment Document Title</label>
                  <input
                    type="text"
                    value={assessmentTitle}
                    onChange={e => setAssessmentTitle(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-xs border ${
                      isDarkMode ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 bg-indigo-505 bg-indigo-500/10 px-4 py-2 border border-indigo-500/20 rounded-lg shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Standard Sum:</span>
                  <span className="text-xs font-black text-white">{totalAssessmentMarks} Marks ({selectedQuestions.length} Items Selected)</span>
                </div>
                {selectedQuestions.length > 0 && (
                  <button
                    onClick={() => {
                      alert(`Continuous assessment test paper completed successfully! Generated document: "${assessmentTitle}" compiled with high-resolution templates.`);
                      setSelectedQuestions([]);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-indigo-550/30 shrink-0 cursor-pointer"
                  >
                    Compile Assessment
                  </button>
                )}
              </div>

              {/* Selection questions grid */}
              <div className="space-y-4">
                {QUESTION_BANK.filter(q => q.subject === selectedSubject || selectedSubject === 'Mathematics').map(q => {
                  const isSelected = selectedQuestions.some(item => item.id === q.id);
                  return (
                    <div 
                      key={q.id}
                      onClick={() => handleToggleQuestion(q)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected 
                        ? (isDarkMode ? 'bg-indigo-550/10 border-indigo-500/40' : 'bg-indigo-50 border-indigo-200')
                        : (isDarkMode ? 'bg-slate-950 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-200 hover:border-slate-300')
                      }`}
                    >
                      <button 
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-indigo-500 border-indigo-600 text-white' : 'border-slate-450'
                        }`}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </button>
                      <div className="flex-1 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[9px] uppercase tracking-widest font-black ${
                            q.difficulty === 'Challenging' ? 'text-rose-400' : q.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {q.difficulty} • {q.marks} Marks
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{q.subject}</span>
                        </div>
                        <p className={`font-bold text-sm leading-snug ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          {q.question}
                        </p>
                        <p className="text-[10px] text-slate-500 italic mt-2">
                          Output Memoranda: "{q.answer}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAMIFICATION & REWARDS ARENA */}
      {currentTab === 'gamification' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Quest dashboard & Points Wallet */}
          <div className="lg:col-span-1 space-y-6">
            {/* XP and status shield card */}
            <div className="p-6 rounded-[28px] bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 text-white border border-indigo-500/20 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-10 pointer-events-none text-white">
                <Trophy size={180} />
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/10 px-2.5 py-1 rounded-full text-indigo-200">
                    Active Student Vault
                  </span>
                  <h3 className="text-3xl font-hand uppercase tracking-wider mt-2">Learner Rank</h3>
                  <p className="text-sm text-indigo-200 font-bold">Level {userLevel} Super Cadet</p>
                </div>
                <div className="bg-yellow-400/20 border border-yellow-400/30 px-3 py-1.5 rounded-xl flex items-center gap-1">
                  <Star size={14} className="fill-current text-yellow-300" />
                  <span className="text-xs font-black text-yellow-250 text-yellow-300">{points} PTS</span>
                </div>
              </div>

              {/* XP progression bar */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-indigo-200 mb-1">
                  <span>XP Progress</span>
                  <span>{userXp}% to Level {userLevel + 1}</span>
                </div>
                <div className="bg-white/20 h-3 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-yellow-400 animate-pulse" style={{ width: `${userXp}%` }} />
                </div>
              </div>

              {/* Streak Calendar counter widget */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="text-yellow-400 fill-current animate-bounce" size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">{streakDays} Day Practice Streak</h4>
                    <p className="text-[10px] text-indigo-200">Keep studying daily for double rewards!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily micro quests */}
            <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
              <h3 className={`text-sm font-black uppercase tracking-wider text-cyan-400`}>Daily Learning Quests</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete diagnostic activities to earn points and level up your classroom capabilities.
              </p>
              
              <div className="space-y-3 pt-2">
                {quests.map(quest => (
                  <div 
                    key={quest.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      quest.completed 
                        ? 'opacity-60 bg-emerald-500/5 border-emerald-500/20' 
                        : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100')
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${quest.completed ? 'line-through text-slate-500' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>
                        {quest.task}
                      </p>
                      <span className="text-[9px] font-black uppercase text-brand-cyan tracking-wider mt-1 block">
                        +{quest.xp} Points Shop XP
                      </span>
                    </div>
                    {quest.completed ? (
                      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <button
                        onClick={() => handleCompleteQuest(quest.id, quest.xp)}
                        className="p-1 px-2.5 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-black uppercase text-[8px] tracking-wider rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Points Shop & Interactive Leaderboard */}
          <div className="lg:col-span-2 space-y-8">
            {/* Point shop cards */}
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} space-y-6`}>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-400">Classroom Rewards Store</span>
                <h3 className={`text-2xl font-hand mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Virtual Points Shop
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Claim authentic academic rewards and micro-credentials using your earned continuous study points.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopItems.map(item => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      item.claimed 
                        ? 'opacity-60 bg-emerald-500/5 border-emerald-500/20'
                        : (isDarkMode ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200')
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className={cn("p-2 rounded-lg bg-gradient-to-br", isDarkMode ? 'bg-white/5' : 'bg-white border border-slate-200')}>
                          <item.icon size={18} className="text-yellow-400" />
                        </div>
                        <span className="text-[10px] font-black text-yellow-400">{item.cost} PTS</span>
                      </div>
                      <h4 className={`text-sm font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 lines-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                    
                    <button
                      disabled={item.claimed || points < item.cost}
                      onClick={() => handleBuyShopItem(item)}
                      className={cn(
                        "mt-4 w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                        item.claimed 
                          ? 'border-emerald-600 bg-emerald-600/10 text-emerald-400 disabled:cursor-not-allowed'
                          : points < item.cost 
                            ? 'border-slate-500/20 bg-slate-550/5 text-slate-500 cursor-not-allowed'
                            : 'border-[#22d3ee]/20 bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/25 hover:scale-[1.01] active:scale-95'
                      )}
                    >
                      {item.claimed ? 'Claimed / Active' : points < item.cost ? 'Locked (Low Points)' : 'Claim Reward'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive class-wide leaderboard */}
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} space-y-6`}>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#10b981]">Classroom Standings</span>
                <h3 className={`text-2xl font-hand mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Academic Leaderboard
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Friendly, student-friendly ranking promoting progress, milestones, and healthy homework execution habits.
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-[24px] overflow-hidden p-1">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 uppercase font-black text-[9px] tracking-widest">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Level Rank</th>
                      <th className="p-3">Streak Days</th>
                      <th className="p-3 text-right">Shop Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeaderboard.map((player, idx) => (
                      <tr 
                        key={player.name}
                        className={cn(
                          "transition-all",
                          player.isSelf 
                            ? 'bg-cyan-500/10 border-l-4 border-l-brand-cyan' 
                            : 'border-b border-white/5 last:border-0 hover:bg-white/5'
                        )}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-black">
                            {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{player.avatar}</span>
                            <span className={`font-bold ${player.isSelf ? 'text-brand-cyan' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>
                              {player.name} {player.isSelf && '(Me)'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-400">Level {player.level}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-yellow-500 flex items-center gap-1">
                            <Flame size={12} className="fill-current" />
                            {player.streak}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-extrabold text-cyan-400">{player.points} PTS</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
