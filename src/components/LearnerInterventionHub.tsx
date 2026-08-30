import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Brain, 
  Sparkles, 
  FileText, 
  Calendar, 
  Upload, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  Target, 
  Award, 
  Clock, 
  Copy, 
  Trash2, 
  UserCheck, 
  FileSpreadsheet, 
  RefreshCcw, 
  Lightbulb, 
  Check, 
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  Zap,
  HelpCircle
} from 'lucide-react';
import { generateEducationalContent } from '../services/geminiService';
import bgInterventionSupport from '../assets/images/intervention_support_bg_1786952984.jpg';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const overlayTeachersToolbox = bgInterventionSupport;

interface LearnerInterventionProfile {
  id: string;
  learnerName: string;
  grade: string;
  subject: string;
  siasLevel: string; // Level 1 (Classroom), Level 2 (SBST), Level 3 (District)
  homeLanguage: string;
  loltLanguage: string;
  barrierDescription: string;
  presetTags: string[];
  academicRecordsSummary?: string;
  uploadedFileName?: string;
  targetGoal: string;
  accommodations: string[];
  durationWeeks: number;
  sessionsPerWeek: number;
  createdAt: string;
  generatedContentHtml?: string;
  status: 'Active' | 'Under Review' | 'Completed';
  progressPercentage: number;
}

interface LearnerInterventionHubProps {
  isDarkMode?: boolean;
  onNavigateTab?: (tabId: string) => void;
  triggerToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LearnerInterventionHub: React.FC<LearnerInterventionHubProps> = ({
  isDarkMode = true,
  onNavigateTab,
  triggerToast
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'wizard' | 'quick-load' | 'library' | 'exercises' | 'timetable'>('wizard');

  // Wizard State (Steps 1 to 5)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    learnerName: '',
    grade: 'Grade 4',
    subject: 'Mathematics',
    siasLevel: 'Level 2 (SBST Remedial Support)',
    homeLanguage: 'isiZulu',
    loltLanguage: 'English',
    barrierDescription: '',
    presetTags: [] as string[],
    academicRecordsText: '',
    uploadedFileName: '',
    targetGoal: 'Improve baseline calculation speed and word problem comprehension to achieve 50%+ in Term 3.',
    accommodations: ['Extra Time (15 mins/hr)', 'Visual Flashcards & Step-by-Step Exemplars', 'Simplified Language & Bilingual Key Words'],
    durationWeeks: 6,
    sessionsPerWeek: 3
  });

  // Quick Load Natural Language Description State
  const [quickPromptText, setQuickPromptText] = useState<string>('');

  // AI Generation Loading & Output State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgressMsg, setGenerationProgressMsg] = useState<string>('');
  const [currentGeneratedPackage, setCurrentGeneratedPackage] = useState<LearnerInterventionProfile | null>(null);

  // Saved Intervention Profiles Storage
  const [savedProfiles, setSavedProfiles] = useState<LearnerInterventionProfile[]>(() => {
    try {
      const stored = localStorage.getItem('eduai_learner_interventions');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse saved interventions:', e);
    }
    return [
      {
        id: 'inter-001',
        learnerName: 'Sipho Ndlovu',
        grade: 'Grade 4',
        subject: 'Mathematics',
        siasLevel: 'Level 2 (SBST Support)',
        homeLanguage: 'isiZulu',
        loltLanguage: 'English',
        barrierDescription: 'Struggles with multi-digit subtraction and word problems due to English vocabulary comprehension gaps. High motivation when using visual number lines.',
        presetTags: ['Dyscalculia / Number Concept Gaps', 'Language Barrier (EAL)'],
        targetGoal: 'Master 3-digit subtraction with regrouping and solve 2-step word problems.',
        accommodations: ['Extra Time (15 mins)', 'Visual Number Line & Manipulatives', 'Bilingual Glossary'],
        durationWeeks: 6,
        sessionsPerWeek: 3,
        createdAt: new Date().toLocaleDateString('en-ZA'),
        status: 'Active',
        progressPercentage: 45
      },
      {
        id: 'inter-002',
        learnerName: 'Keira van der Merwe',
        grade: 'Grade 3',
        subject: 'English FAL',
        siasLevel: 'Level 1 (Classroom Support)',
        homeLanguage: 'Afrikaans',
        loltLanguage: 'English',
        barrierDescription: 'Phonological awareness deficits in diphthongs and vowel blends. Reverses "b" and "d" in written exercises.',
        presetTags: ['Phonological / Reading Barrier', 'Fine Motor / Handwriting'],
        targetGoal: 'Identify top 20 vowel blends and construct 5-word phonetically correct sentences.',
        accommodations: ['Dyslexia-friendly Font & Spacing', 'Oral Reading Prompts'],
        durationWeeks: 4,
        sessionsPerWeek: 2,
        createdAt: new Date(Date.now() - 86400000 * 3).toLocaleDateString('en-ZA'),
        status: 'Active',
        progressPercentage: 70
      }
    ];
  });

  // Selected Profile for Detail Viewing
  const [selectedProfile, setSelectedProfile] = useState<LearnerInterventionProfile | null>(null);

  // Search & Filter in Library
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');

  // Dedicated Exercise Generator State
  const [exerciseSubject, setExerciseSubject] = useState<string>('Mathematics');
  const [exerciseGrade, setExerciseGrade] = useState<string>('Grade 4');
  const [exerciseTopic, setExerciseTopic] = useState<string>('Fractions & Parts of a Whole');
  const [exerciseDifficulty, setExerciseDifficulty] = useState<'Remedial Foundation' | 'Guided Practice' | 'Extension Challenge'>('Remedial Foundation');
  const [exerciseHtml, setExerciseHtml] = useState<string>('');
  const [isGeneratingExercise, setIsGeneratingExercise] = useState<boolean>(false);

  // Persist intervention profiles so they appear on the teacher dashboard +
  // can be surfaced to learners & parents. Loads on mount, saves on change.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'learner_interventions'), where('teacherId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) return;
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() })) as LearnerInterventionProfile[];
      if (remote.length > 0) {
        setSavedProfiles(remote);
      }
    }, (err) => console.warn('Intervention Firestore load fail:', err));
    return () => unsub();
  }, []);

  // Save profiles to localStorage + Firestore whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('eduai_learner_interventions', JSON.stringify(savedProfiles));
    } catch (e) {
      console.error('Failed to store interventions:', e);
    }
    const user = auth.currentUser;
    if (!user) return;
    // Write each profile to Firestore (idempotent, additive — never deletes remote).
    savedProfiles.forEach(async (p) => {
      try {
        await setDoc(doc(db, 'learner_interventions', p.id), {
          ...p,
          teacherId: user.uid,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('Intervention Firestore save fail:', e);
      }
    });
  }, [savedProfiles]);

  // Preset Barrier Tags Options
  const presetBarrierOptions = [
    { tag: 'Phonological / Reading Barrier', icon: BookOpen, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { tag: 'Dyscalculia / Number Concept Gaps', icon: Target, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    { tag: 'Language Barrier (EAL / LOLT Gap)', icon: MessageSquare, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { tag: 'Attention / Focus / ADHD Needs', icon: Zap, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { tag: 'Fine Motor / Handwriting / Speed', icon: Layers, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { tag: 'Gifted / Needs Academic Extension', icon: Award, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    { tag: 'Emotional / Exam Anxiety / Confidence', icon: HeartHandshake, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
    { tag: 'Auditory / Visual Processing Barrier', icon: ShieldAlert, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' }
  ];

  // Accommodations Options
  const accommodationOptions = [
    'Extra Time (15 mins per hour)',
    'Visual Flashcards & Step-by-Step Exemplars',
    'Simplified Language & Bilingual Key Word Prompts',
    'Oral Reading / Text-to-Speech Support',
    'Chunked Tasks (Short 10-minute activity bursts)',
    'Enlarged Print / High-Contrast Worksheets',
    'Manipulatives & Concrete Counting Aids',
    'Scaffolded Answer Sheets & Fill-in-the-Blanks'
  ];

  const handleToggleTag = (tag: string) => {
    setFormData(prev => {
      const exists = prev.presetTags.includes(tag);
      const updatedTags = exists 
        ? prev.presetTags.filter(t => t !== tag)
        : [...prev.presetTags, tag];
      return { ...prev, presetTags: updatedTags };
    });
  };

  const handleToggleAccommodation = (acc: string) => {
    setFormData(prev => {
      const exists = prev.accommodations.includes(acc);
      const updated = exists 
        ? prev.accommodations.filter(a => a !== acc)
        : [...prev.accommodations, acc];
      return { ...prev, accommodations: updated };
    });
  };

  // Mock File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        uploadedFileName: file.name,
        academicRecordsText: `[Extracted from ${file.name}]: Term 1 Mark: 34% (Below CAPS target). Identified Gaps: Basic operations, word problem translations, unit conversions. Diagnostic Note: High effort, needs visual scaffolding.`
      }));
      if (triggerToast) triggerToast(`Uploaded & parsed ${file.name}`, 'success');
    }
  };

  // Execute AI Learner Intervention Generation
  const handleGenerateInterventionPackage = async (source: 'wizard' | 'quick-prompt') => {
    setIsGenerating(true);
    setGenerationProgressMsg('Analyzing diagnostic profile & CAPS learning barriers...');

    const learnerName = source === 'wizard' ? (formData.learnerName || 'Learner A') : 'Learner Profile';
    const grade = source === 'wizard' ? formData.grade : 'Grade 4-7';
    const subject = source === 'wizard' ? formData.subject : 'General Subject';

    try {
      setTimeout(() => setGenerationProgressMsg('Constructing Individualized Learning Plan (ILP / IDP)...'), 1500);
      setTimeout(() => setGenerationProgressMsg('Designing scaffolded remedial exercises & marking memo...'), 3000);
      setTimeout(() => setGenerationProgressMsg('Formatting 6-Week intervention schedule & SBST log...'), 4500);

      const promptDetails = source === 'wizard'
        ? `
          LEARNER INTERVENTION SPECIFICATIONS:
          - Learner Name / Identifier: ${formData.learnerName || 'Learner A'}
          - Grade: ${formData.grade}
          - Subject: ${formData.subject}
          - SIAS Support Level: ${formData.siasLevel}
          - Home Language: ${formData.homeLanguage} | LOLT: ${formData.loltLanguage}
          - Specific Learner Barrier Description: ${formData.barrierDescription || 'General learning deficit in foundational concepts.'}
          - Identified Tags/Barriers: ${formData.presetTags.join(', ') || 'None specified'}
          - Academic Records Summary: ${formData.academicRecordsText || 'No formal records uploaded.'}
          - Target Mastery Goal: ${formData.targetGoal}
          - Preferred Accommodations: ${formData.accommodations.join(', ')}
          - Duration: ${formData.durationWeeks} Weeks (${formData.sessionsPerWeek} sessions per week)
        `
        : `
          NATURAL LANGUAGE LEARNER DESCRIPTION & INTERVENTION REQUEST:
          "${quickPromptText}"
          Generate a complete, CAPS-compliant, highly structured learner intervention package.
        `;

      const aiPrompt = `
        You are an expert Educational Diagnostician, Inclusive Education Specialist, and CAPS Curriculum Consultant for South African schools (Department of Basic Education / SBST).
        Create a comprehensive, 100% complete, professional, beautifully styled HTML Learner Intervention Package based on the following details:
        
        ${promptDetails}

        STRICT STRUCTURAL REQUIREMENTS (DO NOT TRUNCATE OR OMIT ANY SECTION):
        Produce a beautifully styled, high-contrast HTML document with Tailwind CSS classes. Use crisp colored banners, rounded cards, clean tables, and clear visual hierarchy.

        SECTION 1: OFFICIAL INDIVIDUALIZED LEARNING PLAN (ILP / IDP)
        - Header Banner: "SOUTH AFRICAN DBE / SBST INDIVIDUALIZED LEARNING PLAN (2026)"
        - Learner Profile Summary Card (Name, Grade, Subject, SIAS Support Level, Home Language, LOLT)
        - Diagnostic Barrier & Gap Analysis (Core conceptual bottlenecks & CAPS alignment)
        - SMART Learning Objectives (Measurable outcomes for Weeks 1 to ${formData.durationWeeks || 6})
        - Classroom Accommodations & Differentiated Teaching Strategies (Specific guidance for classroom teachers)

        SECTION 2: TARGETED REMEDIAL EXERCISES & PRACTICE WORKSHEET
        - Header Badge: "NAME: ____________________  DATE: ____________________  SCORE: [ _____ / 20 MARKS ]"
        - Level 1: Foundation Anchor & Guided Exemplar (Worked example with visual cues)
        - Level 2: Scaffolded Practice Drills (4-6 structured questions with step-by-step hints)
        - Level 3: Independent Mastery Test (4-6 assessment questions with clear mark allocations e.g. [2 Marks])
        - Complete Diagnostic Answer Key & Marking Memo (With step-by-step breakdown)

        SECTION 3: WEEK-BY-WEEK INTERVENTION SCHEDULE & TIMETABLE
        - Structured Table covering Week 1 to Week ${formData.durationWeeks || 6}
        - Columns: Week, Focus Area & CAPS Sub-topic, Weekly Action Activity, Success Criteria, Milestone Checklist
        - Session Frequency: ${formData.sessionsPerWeek || 3} times per week (20 mins per session)

        SECTION 4: SBST LOG & PARENT COMMUNICATION GUIDE
        - School-Based Support Team (SBST) Formative Progress Log
        - Empathetic, jargon-free Home Support Guide for Parents (Actionable 10-minute home games or exercises)

        Design with Tailwind CSS classes (e.g. bg-slate-900, text-cyan-400, border-cyan-500/30, rounded-2xl, p-6, shadow-lg). Ensure high text contrast!
      `;

      const htmlResult = await generateEducationalContent('Complete Learner Intervention Package', aiPrompt);

      const newProfile: LearnerInterventionProfile = {
        id: `inter-${Date.now()}`,
        learnerName: source === 'wizard' ? (formData.learnerName || 'New Learner') : 'Extracted Learner Profile',
        grade,
        subject,
        siasLevel: source === 'wizard' ? formData.siasLevel : 'Level 2 (SBST Support)',
        homeLanguage: source === 'wizard' ? formData.homeLanguage : 'English',
        loltLanguage: source === 'wizard' ? formData.loltLanguage : 'English',
        barrierDescription: source === 'wizard' ? formData.barrierDescription : quickPromptText.slice(0, 150) + '...',
        presetTags: source === 'wizard' ? formData.presetTags : ['Custom Intervention'],
        targetGoal: source === 'wizard' ? formData.targetGoal : 'Achieve curriculum benchmark.',
        accommodations: source === 'wizard' ? formData.accommodations : ['Custom Accommodations'],
        durationWeeks: source === 'wizard' ? formData.durationWeeks : 6,
        sessionsPerWeek: source === 'wizard' ? formData.sessionsPerWeek : 3,
        createdAt: new Date().toLocaleDateString('en-ZA'),
        generatedContentHtml: htmlResult,
        status: 'Active',
        progressPercentage: 0
      };

      setCurrentGeneratedPackage(newProfile);
      setSavedProfiles(prev => [newProfile, ...prev]);
      setSelectedProfile(newProfile);

      if (triggerToast) triggerToast('🎉 Learner Intervention Package generated & saved!', 'success');
    } catch (err: any) {
      console.error('Failed to generate intervention package:', err);
      if (triggerToast) triggerToast('Failed to generate intervention. Please check connection.', 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgressMsg('');
    }
  };

  // Generate Standalone Exercise
  const handleGenerateStandaloneExercise = async () => {
    setIsGeneratingExercise(true);
    try {
      const prompt = `
        Generate a CAPS-aligned, highly engaging ${exerciseDifficulty} Worksheet and Practice Drill Set for ${exerciseGrade} ${exerciseSubject} on the topic "${exerciseTopic}".
        Format as clean HTML with Tailwind CSS. Include:
        1. Student Header (Name, Date, Score Card /15)
        2. Brief Concept Visual Recap / Tip
        3. 5-8 Scaffolded Exercises mapped to ${exerciseDifficulty}
        4. Complete Teacher Marking Memo / Answer Key at the end
      `;
      const result = await generateEducationalContent('Targeted Remedial Exercise', prompt);
      setExerciseHtml(result);
      if (triggerToast) triggerToast('Targeted Exercise generated successfully!', 'success');
    } catch (e) {
      console.error('Error generating exercise:', e);
      if (triggerToast) triggerToast('Error generating exercise.', 'error');
    } finally {
      setIsGeneratingExercise(false);
    }
  };

  // Print Document Handler
  const handlePrintPackage = (htmlContent?: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const contentToPrint = htmlContent || selectedProfile?.generatedContentHtml || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Learner Intervention Package - EduAI Companion</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { background: white !important; color: black !important; font-family: sans-serif; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 p-8">
          <div class="max-w-4xl mx-auto space-y-6">
            ${contentToPrint}
          </div>
          <script>
            setTimeout(() => { window.print(); }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Saved Profiles
  const filteredProfiles = savedProfiles.filter(p => {
    const matchesSearch = p.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.grade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'All' || p.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 font-sans p-3 lg:p-6 ${
      isDarkMode ? 'bg-[#070d19] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP HERO BANNER & PORTAL NAVIGATION */}
        <div className={`relative overflow-hidden rounded-[32px] p-6 lg:p-8 border shadow-2xl transition-all ${
          isDarkMode
            ? 'bg-[radial-gradient(ellipse_at_top,rgba(20,28,70,0.9)_0%,rgba(8,11,34,1)_100%)] border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-slate-100'
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800 shadow-slate-200'
        }`}>
          {/* Background Overlay & Ambient Glows */}
          <div 
            className="absolute inset-0 pointer-events-none z-0 opacity-25 mix-blend-overlay bg-cover bg-center" 
            style={{ backgroundImage: `url(${overlayTeachersToolbox})` }} 
          />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 backdrop-blur-md text-xs font-bold uppercase tracking-widest font-display">
                <HeartHandshake size={15} className="text-amber-400 animate-pulse" />
                <span>DBE SIAS & CAPS Inclusive Education Portal</span>
              </div>
              <div className="text-xs text-amber-300/80 font-mono font-bold tracking-wider uppercase">
                Official School-Based Support Team (SBST) Suite
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <h1 className="text-3xl lg:text-5xl font-black font-display tracking-tight text-amber-300 drop-shadow-[0_0_25px_rgba(252,211,77,0.5)] flex items-center gap-3">
                  <span>Learner Intervention Hub</span>
                  <Sparkles size={30} className="text-amber-300 animate-pulse" />
                </h1>
                <p className="text-xs lg:text-sm text-slate-300 leading-relaxed font-medium">
                  Diagnose student learning barriers, generate CAPS-aligned Individualized Learning Plans (ILPs), scaffolded remedial exercises, and actionable intervention timetables.
                </p>
              </div>

              {/* Quick Action Button */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    setActiveTab('wizard');
                    setWizardStep(1);
                    setSelectedProfile(null);
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider font-display shadow-[0_0_25px_rgba(252,211,77,0.4)] hover:shadow-[0_0_35px_rgba(252,211,77,0.7)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-amber-200/50 cursor-pointer"
                >
                  <Plus size={18} strokeWidth={3} />
                  <span>New Learner Wizard</span>
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION PILLS */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('wizard')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  activeTab === 'wizard'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <Brain size={15} />
                <span>1. Guided Intervention Wizard</span>
              </button>

              <button
                onClick={() => setActiveTab('quick-load')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  activeTab === 'quick-load'
                    ? 'bg-purple-500 text-white border-purple-400 font-extrabold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <MessageSquare size={15} />
                <span>2. Natural Language Quick-Load</span>
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  activeTab === 'library'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <UserCheck size={15} />
                <span>3. Intervention Library ({savedProfiles.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('exercises')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  activeTab === 'exercises'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <Layers size={15} />
                <span>4. Exercise Generator</span>
              </button>

              <button
                onClick={() => setActiveTab('timetable')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  activeTab === 'timetable'
                    ? 'bg-indigo-500 text-white border-indigo-400 font-extrabold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <Calendar size={15} />
                <span>5. Schedule & SBST Log</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN DISPLAY AREA */}

        {/* LOADING OVERLAY WHEN AI GENERATING */}
        {isGenerating && (
          <div className={`p-10 rounded-[32px] border text-center space-y-6 animate-pulse ${
            isDarkMode ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-white border-slate-300 shadow-xl'
          }`}>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-spin">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black font-display text-cyan-400">EduAI Engine Synthesizing Learner Intervention Package</h3>
              <p className="text-sm font-semibold text-slate-300">{generationProgressMsg}</p>
            </div>
            <div className="w-full max-w-md mx-auto bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full w-3/4 animate-pulse" />
            </div>
          </div>
        )}

        {/* TAB 1: GUIDED INTERVENTION WIZARD */}
        {!isGenerating && activeTab === 'wizard' && !selectedProfile && (
          <div className={`p-6 lg:p-8 rounded-[32px] border transition-all ${
            isDarkMode ? 'bg-[#0a1224]/90 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'
          }`}>

            {/* WIZARD STEP HEADER STEPPER */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black font-display flex items-center gap-2">
                    <Brain className="text-cyan-400" size={22} />
                    <span>Guided Learner Profile Wizard</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Follow the 5 steps to compile a tailored diagnostic profile and AI intervention package.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Step {wizardStep} of 5
                </span>
              </div>

              {/* Progress Bar */}
              <div className="grid grid-cols-5 gap-2">
                {[
                  { step: 1, label: 'Context' },
                  { step: 2, label: 'Barriers' },
                  { step: 3, label: 'Records' },
                  { step: 4, label: 'Goals' },
                  { step: 5, label: 'Generate' }
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setWizardStep(s.step)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                      wizardStep === s.step
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow'
                        : wizardStep > s.step
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {s.step}. {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 1: CONTEXT & LEARNER DETAILS */}
            {wizardStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-3">
                  <Lightbulb size={18} className="shrink-0 text-cyan-400" />
                  <span>Start by entering basic learner identifier details, CAPS grade level, subject, and SIAS support tier.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Learner Name / Alias <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sipho M. or Learner 104"
                      value={formData.learnerName}
                      onChange={(e) => setFormData({ ...formData, learnerName: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900/90 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Grade Level <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Target Subject <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {['Mathematics', 'English FAL', 'English HL', 'isiZulu HL', 'Afrikaans FAL', 'Natural Sciences', 'Social Sciences', 'Life Skills / Life Orientation', 'Physical Sciences', 'Accounting', 'Mathematical Literacy'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      SIAS Support Tier
                    </label>
                    <select
                      value={formData.siasLevel}
                      onChange={(e) => setFormData({ ...formData, siasLevel: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="Level 1 (Classroom Support)">Level 1 - General Teacher Classroom Differentiation</option>
                      <option value="Level 2 (SBST Remedial Support)">Level 2 - School-Based Support Team (SBST) Targeted Plan</option>
                      <option value="Level 3 (District Special Needs Support)">Level 3 - District / Specialized Inclusive Education Unit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Home Language
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. isiZulu, Sepedi, Afrikaans"
                      value={formData.homeLanguage}
                      onChange={(e) => setFormData({ ...formData, homeLanguage: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      LOLT (Language of Learning)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. English"
                      value={formData.loltLanguage}
                      onChange={(e) => setFormData({ ...formData, loltLanguage: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider font-display flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Next: Describe Barriers</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DIAGNOSTIC & BARRIER DESCRIPTION */}
            {wizardStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-3">
                  <Brain size={18} className="shrink-0 text-purple-400" />
                  <span>Describe the learner in words or select preset diagnostic barrier tags below.</span>
                </div>

                {/* Preset Tag Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Click to Add Identified Learning Barriers / Tags
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {presetBarrierOptions.map((opt) => {
                      const isSelected = formData.presetTags.includes(opt.tag);
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.tag}
                          onClick={() => handleToggleTag(opt.tag)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? `${opt.color} font-extrabold shadow-md ring-1 ring-cyan-400`
                              : isDarkMode ? 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon size={15} className="shrink-0" />
                            <span className="truncate">{opt.tag}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rich Natural Language Description Textbox */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Detailed Learner Description & Assistance Needed <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Describe what sort of learner you are dealing with... E.g. Sipho is bright in oral class discussions but struggles severely when reading multi-step word problems independently. He tends to rush through calculation steps, skips place values, and gets frustrated during quiet individual seatwork..."
                    value={formData.barrierDescription}
                    onChange={(e) => setFormData({ ...formData, barrierDescription: e.target.value })}
                    className={`w-full p-4 rounded-2xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed ${
                      isDarkMode ? 'bg-slate-900 border-white/15 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider font-display flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Next: Upload Records</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ACADEMIC RECORDS & DOCUMENTS */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
                  <Upload size={18} className="shrink-0 text-emerald-400" />
                  <span>Upload academic report cards, diagnostic assessment PDFs, or test score images to enrich the AI analysis.</span>
                </div>

                {/* Upload Drag Drop Zone */}
                <div className={`p-8 rounded-3xl border-2 border-dashed text-center space-y-4 transition-all ${
                  isDarkMode ? 'border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-950/20' : 'border-cyan-300 bg-cyan-50/50 hover:bg-cyan-50'
                }`}>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <FileSpreadsheet size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Upload Assessment Reports or Test Images</h4>
                    <p className="text-xs text-slate-400 mt-1">Supports PDF, CSV, PNG, JPG (e.g. Term 1 Report Card, Diagnostic Test Answer Sheet)</p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md">
                    <Upload size={15} />
                    <span>Choose File</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {formData.uploadedFileName && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 size={14} />
                      <span>{formData.uploadedFileName} loaded</span>
                    </div>
                  )}
                </div>

                {/* Manual Record Text Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Or Manually Type / Edit Academic Marks & Records
                  </label>
                  <textarea
                    rows={4}
                    placeholder="E.g. Term 1 Maths: 38% (Level 2), Term 2 Diagnostic Quiz: 42%. Weaknesses noted in place value and carrying over numbers..."
                    value={formData.academicRecordsText}
                    onChange={(e) => setFormData({ ...formData, academicRecordsText: e.target.value })}
                    className={`w-full p-4 rounded-2xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider font-display flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Next: Goals & Accommodations</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: GOALS & ACCOMMODATIONS */}
            {wizardStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-3">
                  <Target size={18} className="shrink-0 text-indigo-400" />
                  <span>Specify the target mastery outcomes, duration, and preferred classroom accommodations.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Target Mastery Goal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.targetGoal}
                    onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Accommodations Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Select Classroom Accommodations & Differentiated Tools
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {accommodationOptions.map((acc) => {
                      const isSelected = formData.accommodations.includes(acc);
                      return (
                        <button
                          key={acc}
                          onClick={() => handleToggleAccommodation(acc)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-extrabold shadow-sm'
                              : isDarkMode ? 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{acc}</span>
                          {isSelected && <Check size={14} className="text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration and Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Intervention Duration (Weeks)
                    </label>
                    <select
                      value={formData.durationWeeks}
                      onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value={4}>4 Weeks (Short Diagnostic Cycle)</option>
                      <option value={6}>6 Weeks (Standard CAPS Intervention)</option>
                      <option value={8}>8 Weeks (Extended Support Plan)</option>
                      <option value={12}>12 Weeks (Full Term SBST Plan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Session Frequency
                    </label>
                    <select
                      value={formData.sessionsPerWeek}
                      onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value) })}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value={2}>2x 20-min sessions / week</option>
                      <option value={3}>3x 20-min sessions / week</option>
                      <option value={4}>4x 15-min sessions / week</option>
                      <option value={5}>Daily 10-min practice bursts</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    onClick={() => setWizardStep(5)}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider font-display flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Next: Review & Launch</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & AI GENERATION */}
            {wizardStep === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-3">
                  <Sparkles size={18} className="shrink-0 text-cyan-400" />
                  <span>Review your input specification. Clicking Launch will synthesize the ILP, Exercises, and Schedule.</span>
                </div>

                {/* Summary Card */}
                <div className={`p-6 rounded-2xl border space-y-4 ${
                  isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-lg font-black text-cyan-400 font-display">{formData.learnerName || 'Unspecified Learner'}</h4>
                      <p className="text-xs text-slate-400">{formData.grade} • {formData.subject} • {formData.siasLevel}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                      Ready to Generate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Barrier Description:</span>
                      <p className="text-slate-200 leading-relaxed font-medium">{formData.barrierDescription || 'None provided.'}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Selected Barrier Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {formData.presetTags.length > 0 ? (
                          formData.presetTags.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">None selected</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Target Mastery Goal:</span>
                      <p className="text-slate-200 font-medium">{formData.targetGoal}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Accommodations & Schedule:</span>
                      <p className="text-slate-200 font-medium">{formData.durationWeeks} Weeks ({formData.sessionsPerWeek}x/week) • {formData.accommodations.length} accommodations set</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    onClick={() => handleGenerateInterventionPackage('wizard')}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider font-display flex items-center gap-3 cursor-pointer shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles size={20} className="animate-spin" />
                    <span>Launch AI Intervention Package Generator</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: NATURAL LANGUAGE QUICK LOAD */}
        {!isGenerating && activeTab === 'quick-load' && !selectedProfile && (
          <div className={`p-6 lg:p-8 rounded-[32px] border transition-all ${
            isDarkMode ? 'bg-[#0a1224]/90 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black font-display flex items-center gap-2 text-purple-400">
                  <MessageSquare size={22} />
                  <span>Natural Language Learner Quick-Load</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Type or paste a paragraph describing the learner, their academic background, test scores, and intervention needs. EduAI will parse the text and generate the entire plan!</p>
              </div>

              {/* Sample Quick Prompt Presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Or Click a Sample Learner Scenario:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setQuickPromptText('Thabo is a Grade 4 Mathematics learner who struggles with multi-digit carrying and word problems because English is his second language. He performs well with visual number lines and concrete counters. Need a 6-week remedial plan with 3 sessions/week focusing on addition/subtraction word problems.')}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs text-slate-300 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-cyan-400 block mb-1">📋 Grade 4 Maths Word Problems</span>
                    <span className="text-[11px] opacity-80 line-clamp-2">Thabo struggles with multi-digit carrying and word problems due to English FAL...</span>
                  </button>

                  <button
                    onClick={() => setQuickPromptText('Lesedi is a Grade 3 English FAL learner with phonological awareness deficits in diphthongs and vowel blends. Reverses letters b and d. Needs a 4-week phonics intervention with dyslexia-friendly worksheets.')}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs text-slate-300 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-purple-400 block mb-1">📋 Grade 3 Phonics & Letter Reversal</span>
                    <span className="text-[11px] opacity-80 line-clamp-2">Lesedi has phonological awareness deficits in diphthongs and reverses b/d...</span>
                  </button>

                  <button
                    onClick={() => setQuickPromptText('Sipho in Grade 7 Natural Sciences understands energy transfer concepts during discussions but scores 35% on written exam papers due to processing speed and anxiety. Needs oral reading accommodations and a 6-week science study guide with flashcards.')}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs text-slate-300 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-emerald-400 block mb-1">📋 Grade 7 Science Exam Anxiety</span>
                    <span className="text-[11px] opacity-80 line-clamp-2">Sipho scores 35% on written papers due to processing speed and test anxiety...</span>
                  </button>
                </div>
              </div>

              {/* Natural Language Text Box */}
              <div>
                <textarea
                  rows={8}
                  placeholder="Type or paste the learner profile description here in your own words... Include grade, subject, specific difficulties, strengths, test marks, and requested intervention support..."
                  value={quickPromptText}
                  onChange={(e) => setQuickPromptText(e.target.value)}
                  className={`w-full p-4 rounded-2xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed ${
                    isDarkMode ? 'bg-slate-900 border-white/15 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end">
                <button
                  disabled={!quickPromptText.trim()}
                  onClick={() => handleGenerateInterventionPackage('quick-prompt')}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider font-display flex items-center gap-3 cursor-pointer shadow-xl shadow-purple-500/25 transition-all"
                >
                  <Sparkles size={20} />
                  <span>Generate Complete Intervention Package</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INTERVENTION LIBRARY & ACTIVE ILPS */}
        {!isGenerating && activeTab === 'library' && !selectedProfile && (
          <div className="space-y-6">

            {/* Filter Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDarkMode ? 'bg-[#0a1224] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search learner name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                {['All', 'Mathematics', 'English FAL', 'Natural Sciences'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                      selectedSubjectFilter === sub
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards Grid */}
            {filteredProfiles.length === 0 ? (
              <div className="p-12 text-center space-y-3 rounded-3xl border border-dashed border-white/10">
                <UserCheck size={40} className="mx-auto text-slate-500" />
                <h4 className="text-base font-bold text-slate-300">No Learner Interventions Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Click "New Learner Wizard" above to construct a new diagnostic profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProfiles.map((p) => (
                  <div
                    key={p.id}
                    className={`p-6 rounded-3xl border transition-all space-y-4 hover:border-cyan-500/40 relative group ${
                      isDarkMode ? 'bg-[#0a1224]/90 border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                          {p.siasLevel}
                        </span>
                        <h3 className="text-lg font-black font-display text-white mt-1.5">{p.learnerName}</h3>
                        <p className="text-xs text-slate-400 font-medium">{p.grade} • {p.subject} • Created {p.createdAt}</p>
                      </div>

                      <button
                        onClick={() => {
                          setSavedProfiles(prev => prev.filter(x => x.id !== p.id));
                          if (triggerToast) triggerToast('Intervention profile deleted', 'info');
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete profile"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-medium">
                      {p.barrierDescription}
                    </p>

                    {/* Preset tags */}
                    <div className="flex flex-wrap gap-1">
                      {p.presetTags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-2 border-t border-white/10">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Intervention Progress</span>
                        <span className="text-cyan-400">{p.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full transition-all duration-500"
                          style={{ width: `${p.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setSelectedProfile(p)}
                        className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider font-display flex items-center justify-center gap-2 cursor-pointer shadow"
                      >
                        <BookOpen size={14} />
                        <span>View Full ILP Package</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TARGETED EXERCISE GENERATOR */}
        {!isGenerating && activeTab === 'exercises' && !selectedProfile && (
          <div className={`p-6 lg:p-8 rounded-[32px] border transition-all space-y-6 ${
            isDarkMode ? 'bg-[#0a1224]/90 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div>
              <h2 className="text-xl font-black font-display flex items-center gap-2 text-amber-400">
                <Layers size={22} />
                <span>On-Demand Remedial & Extension Exercise Generator</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Generate diagnostic worksheets, step-by-step scaffolded practice cards, or extension challenges tailored for specific learning tiers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Subject</label>
                <select
                  value={exerciseSubject}
                  onChange={(e) => setExerciseSubject(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English FAL">English FAL</option>
                  <option value="Natural Sciences">Natural Sciences</option>
                  <option value="Social Sciences">Social Sciences</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Grade</label>
                <select
                  value={exerciseGrade}
                  onChange={(e) => setExerciseGrade(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  {['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Topic</label>
                <input
                  type="text"
                  value={exerciseTopic}
                  onChange={(e) => setExerciseTopic(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Scaffolding Tier</label>
                <select
                  value={exerciseDifficulty}
                  onChange={(e) => setExerciseDifficulty(e.target.value as any)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="Remedial Foundation">Level 1 - Remedial Foundation (Visual Cues)</option>
                  <option value="Guided Practice">Level 2 - Guided Practice (Step-by-Step Drills)</option>
                  <option value="Extension Challenge">Level 3 - Extension Challenge (Deep Thinking)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                disabled={isGeneratingExercise}
                onClick={handleGenerateStandaloneExercise}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider font-display flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles size={16} />
                <span>{isGeneratingExercise ? 'Generating Exercises...' : 'Generate Target Exercise Set'}</span>
              </button>
            </div>

            {/* Generated Exercise Output */}
            {exerciseHtml && (
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Generated Exercise Preview</h3>
                  <button
                    onClick={() => handlePrintPackage(exerciseHtml)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Printer size={14} /> Print / Export PDF
                  </button>
                </div>

                <div 
                  className={`p-6 rounded-2xl border max-h-[500px] overflow-y-auto ${
                    isDarkMode ? 'bg-slate-900 border-white/10 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  dangerouslySetInnerHTML={{ __html: exerciseHtml }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TIMETABLE & SBST LOG */}
        {!isGenerating && activeTab === 'timetable' && !selectedProfile && (
          <div className={`p-6 lg:p-8 rounded-[32px] border transition-all space-y-6 ${
            isDarkMode ? 'bg-[#0a1224]/90 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div>
              <h2 className="text-xl font-black font-display flex items-center gap-2 text-indigo-400">
                <Calendar size={22} />
                <span>School-Based Support Team (SBST) Timetable & Tracking Log</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Schedule intervention slots, log formative milestone check-ins, and manage SBST case reviews.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border space-y-2 ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Active Case Files</span>
                  <Award size={18} className="text-cyan-400" />
                </div>
                <h3 className="text-2xl font-black text-white font-display">{savedProfiles.length} Learners</h3>
                <p className="text-[11px] text-slate-400">Enrolled under SBST intervention monitoring.</p>
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Weekly Session Slots</span>
                  <Clock size={18} className="text-amber-400" />
                </div>
                <h3 className="text-2xl font-black text-white font-display">8 Sessions / Wk</h3>
                <p className="text-[11px] text-slate-400">Allocated during morning reading & study periods.</p>
              </div>

              <div className={`p-5 rounded-2xl border space-y-2 ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Parent Updates Pending</span>
                  <MessageSquare size={18} className="text-purple-400" />
                </div>
                <h3 className="text-2xl font-black text-white font-display">2 Feedback Notes</h3>
                <p className="text-[11px] text-slate-400">Ready for home support dispatch.</p>
              </div>
            </div>

            {/* Weekly Timetable Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Weekly Intervention Session Calendar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => (
                  <div key={day} className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-cyan-400 uppercase font-display">{day}</span>
                      <span className="text-[10px] text-slate-500 font-bold">20 min</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {idx % 2 === 0 ? (
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 space-y-1">
                          <span className="font-bold block">Sipho N. (Maths)</span>
                          <span className="text-[10px] text-slate-400 block">Number line subtraction drill</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 space-y-1">
                          <span className="font-bold block">Keira v. (Phonics)</span>
                          <span className="text-[10px] text-slate-400 block">Vowel blend flashcard practice</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SELECTED PROFILE FULL PACKAGE VIEW MODAL / DETAIL */}
        {selectedProfile && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Control */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-white/10">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Library
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintPackage(selectedProfile.generatedContentHtml)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider font-display flex items-center gap-2 cursor-pointer shadow"
                >
                  <Printer size={16} /> Print / Export PDF
                </button>
              </div>
            </div>

            {/* Render HTML content if generated, or generate on the fly */}
            {selectedProfile.generatedContentHtml ? (
              <div 
                className={`p-8 rounded-[32px] border space-y-6 ${
                  isDarkMode ? 'bg-[#0a1224] border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}
                dangerouslySetInnerHTML={{ __html: selectedProfile.generatedContentHtml }}
              />
            ) : (
              <div className="p-12 text-center space-y-4 rounded-3xl border border-dashed border-white/10">
                <Brain size={40} className="mx-auto text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Generate Full Package for {selectedProfile.learnerName}</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">Click below to synthesize the complete ILP, remedial exercises, and 6-week schedule using Gemini AI.</p>
                <button
                  onClick={() => handleGenerateInterventionPackage('wizard')}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Synthesize Full Package Now
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
