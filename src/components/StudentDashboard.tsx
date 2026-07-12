import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Target, BookOpen, CheckCircle, Flame, Star, Brain, Play, Check, Heart, MessageCircle, Printer, Camera, Upload, Loader2, AlertCircle, RefreshCw, Eye, GripVertical, ArrowUp, ArrowDown, Move, Activity, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { StudentDoc, MilestoneTask, IdpModel, Subject } from '../types';
import { logStudentActivity } from '../lib/activityLogger';
import LoadingMascot from './LoadingMascot';
import StudentAITutorBubble from './StudentAITutorBubble';
import { runTextGrade, runOCRAndGrade } from '../services/unifiedAiService';
import { marked } from 'marked';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');


export default function StudentDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrateTaskId, setCelebrateTaskId] = useState<number | null>(null);

  // Assignment states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [myStudyGroupIds, setMyStudyGroupIds] = useState<string[]>([]);
  
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [solvingMode, setSolvingMode] = useState<'online' | 'ocr'>('online');
  const [onlineAnswers, setOnlineAnswers] = useState('');
  const [ocrImage, setOcrImage] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingError, setGradingError] = useState('');
  const [gradingResult, setGradingResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }
      
      const email = user?.email || localStorage.getItem('userEmail') || '';
      
      if (!email) {
        if (!user) {
          setLoading(false);
        }
        return;
      }

      // Query for students matching account email
      const q = query(collection(db, 'students'), where('email', '==', email.toLowerCase().trim()));
      
      unsubscribeSnap = onSnapshot(q, async (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data() as StudentDoc;
          const studentId = docSnap.id;
          const studentData = { ...data, id: studentId };

          // Process active logon streak calculation
          const todayStr = new Date().toISOString().split('T')[0]; // Local YYYY-MM-DD
          let currentStreak = studentData.streak || 7; // Default or saved value
          let lastActive = studentData.lastActiveDate;

          if (!lastActive) {
            // New student, first initialization
            try {
              await updateDoc(doc(db, 'students', studentId), {
                lastActiveDate: todayStr,
                streak: currentStreak
              });
            } catch (e) {
              console.warn("Error updating user initial lastActive", e);
            }
          } else if (lastActive !== todayStr) {
            const lastActiveDateObj = new Date(lastActive);
            const todayDateObj = new Date(todayStr);
            const diffTime = Math.abs(todayDateObj.getTime() - lastActiveDateObj.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let streakUpdateNeeded = false;
            if (diffDays === 1) {
              currentStreak += 1;
              streakUpdateNeeded = true;
            } else if (diffDays > 1) {
              currentStreak = 1;
              streakUpdateNeeded = true;
            }

            if (streakUpdateNeeded) {
              try {
                await updateDoc(doc(db, 'students', studentId), {
                  lastActiveDate: todayStr,
                  streak: currentStreak
                });
              } catch (e) {
                console.warn("Error updating user current streak", e);
              }
            }
          }

          setStudent(studentData);
          setLoading(false);
        } else {
          // Fallback or dynamic student document creation
          const fallbackId = user?.uid || 'sibu-dube-id';
          const fallbackName = user?.displayName || 'Sibusiso Dube';
          const fallbackEmail = email.toLowerCase().trim();

          const defaultIdp: IdpModel = {
            strengths: [
              "Analytical mind and strong curiosity in Physical Sciences.",
              "Excellent project and lab submission consistency."
            ],
            weaknesses: [
              "Needs extra attention on complex algebra word problems.",
              "Consolidation of mechanics test concepts to improve overall speed."
            ],
            recommendations: [
              "Use AI Classroom helper for step-by-step guidance on complex chemistry questions.",
              "Attempt 2 mock quizzes on EduAI before the cycle test."
            ],
            actionPlan: [
              { task: "Revise grade syllabus algebra chapters", milestone: "This week", status: "In Progress" },
              { task: "Complete chemistry stoichiometry assessment", milestone: "Next week", status: "Pending" },
              { task: "Do interactive session with AI Math tutor", milestone: "Within 2 weeks", status: "Pending" }
            ]
          };

          const initialStudent: StudentDoc = {
            id: fallbackId,
            name: fallbackName,
            grade: 'Grade 10A',
            email: fallbackEmail,
            status: 'Active',
            lastActiveDate: new Date().toISOString().split('T')[0],
            streak: 1,
            subjects: [
              { name: 'Mathematics', mark: 84, termHistory: [74, 78, 80, 84], assessments: [] },
              { name: 'Physical Sciences', mark: 79, termHistory: [70, 72, 75, 79], assessments: [] },
              { name: 'English First Additional Language', mark: 89, termHistory: [82, 85, 87, 89], assessments: [] }
            ],
            idp: defaultIdp
          };

          try {
            // Persistent default student creation under Firestore
            await setDoc(doc(db, 'students', fallbackId), initialStudent);
            setStudent(initialStudent);
          } catch (err) {
            console.warn("Could not seed default student on Firestore. Defaulting to state.", err);
            setStudent(initialStudent);
          }
          setLoading(false);
        }
      }, (error) => {
        console.error("Student dashboard snapshots error", error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) {
        unsubscribeSnap();
      }
    };
  }, []);

  const [liveStreak, setLiveStreak] = useState(1);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragoverIndex, setDragoverIndex] = useState<number | null>(null);

  const DEFAULT_WIDGET_ORDER = useMemo(() => [
    'progress-charts',
    'upcoming-assignments',
    'upcoming-missions',
    'recent-activities',
    'parent-motivation'
  ], []);

  const currentOrder = useMemo(() => {
    if (student && student.widgetOrder && student.widgetOrder.length > 0) {
      return student.widgetOrder;
    }
    return DEFAULT_WIDGET_ORDER;
  }, [student, DEFAULT_WIDGET_ORDER]);

  const handleSaveWidgetOrder = async (newOrder: string[]) => {
    if (!student?.id) return;
    try {
      setStudent(prev => prev ? { ...prev, widgetOrder: newOrder } : null);
      await updateDoc(doc(db, 'students', student.id), {
        widgetOrder: newOrder
      });
    } catch (err) {
      console.warn("Failed saving widget reorder:", err);
    }
  };

  const handleResetWidgetOrder = () => {
    handleSaveWidgetOrder(DEFAULT_WIDGET_ORDER);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...currentOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      handleSaveWidgetOrder(newOrder);
    }
  };

  // Record login activity once resolved
  useEffect(() => {
    if (student?.id) {
      logStudentActivity(student.id, 'login', 'Logged in to classroom portal');
    }
  }, [student?.id]);

  // Subscribe dynamically to activity logs to calculate streak in real time
  useEffect(() => {
    if (!student?.id) return;

    const q = query(
      collection(db, 'activity_logs'),
      where('studentId', '==', student.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uniqueDates = new Set<string>();
      const rawLogs: any[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        rawLogs.push({ id: doc.id, ...data });
        if (data.timestamp) {
          uniqueDates.add(data.timestamp);
        }
      });

      // Sort and slice top 5 logs
      rawLogs.sort((a, b) => {
        const t1 = a.createdAt?.seconds || 0;
        const t2 = b.createdAt?.seconds || 0;
        return t2 - t1;
      });
      setRecentLogs(rawLogs.slice(0, 5));

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let streakCount = 0;
      const todayHasActivity = uniqueDates.has(todayStr);
      const yesterdayHasActivity = uniqueDates.has(yesterdayStr);

      if (todayHasActivity || yesterdayHasActivity) {
        let dateToCheck = todayHasActivity ? new Date() : yesterday;
        while (true) {
          const checkStr = dateToCheck.toISOString().split('T')[0];
          if (uniqueDates.has(checkStr)) {
            streakCount++;
            dateToCheck.setDate(dateToCheck.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        streakCount = 1;
      }

      const finalStreak = Math.max(1, streakCount);
      setLiveStreak(finalStreak);

      // Back-sync computed streak to the student doc if differs
      if (student.streak !== finalStreak) {
        updateDoc(doc(db, 'students', student.id), { streak: finalStreak }).catch(console.warn);
      }
    });

    return () => unsubscribe();
  }, [student?.id, student?.streak]);

  useEffect(() => {
    if (!student?.id) return;

    // Load Assignments
    const qAssignments = query(collection(db, 'assignments'));
    const unsubAssignments = onSnapshot(qAssignments, (snapshot) => {
      setAssignments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Error loading assignments", error));

    // Load Student Submissions
    const qSubmissions = query(collection(db, 'submissions'), where('studentId', '==', student.id));
    const unsubSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      setSubmissions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Error loading submissions", error));

    // Load Study Groups containing this student
    const qGroups = query(collection(db, 'study_groups'), where('members', 'array-contains', student.id));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setMyStudyGroupIds(snapshot.docs.map(d => d.id));
    }, (error) => console.error("Error loading groups", error));

    return () => {
      unsubAssignments();
      unsubSubmissions();
      unsubGroups();
    };
  }, [student?.id]);

  const myAssignments = useMemo(() => {
    if (!student) return [];
    return assignments.filter(item => {
      if (item.assigneeType === 'student' && item.assigneeId === student.id) return true;
      if (item.assigneeType === 'class' && item.assigneeId === student.grade) return true;
      if (item.assigneeType === 'group' && myStudyGroupIds.includes(item.assigneeId)) return true;
      return false;
    });
  }, [assignments, student, myStudyGroupIds]);

  // Compute dynamic stats from DB
  const stats = useMemo(() => {
    if (!student) {
      return {
        masteryScore: '0%',
        modulesComplete: '0',
        streak: '1',
        level: 1,
        xp: 0,
        missions: [] as MilestoneTask[]
      };
    }

    // Average mark corresponding to subjects and assessments
    const subjects = student.subjects || [];
    let totalMarksSum = 0;
    let totalSubjectsCount = 0;

    subjects.forEach(sub => {
      const assessmentsList = sub.assessments || [];
      const subMark = assessmentsList.length > 0
        ? Math.round(assessmentsList.reduce((sum, a) => sum + a.score, 0) / assessmentsList.length)
        : sub.mark;
      totalMarksSum += subMark;
      totalSubjectsCount++;
    });

    const avgMastery = totalSubjectsCount > 0 
      ? Math.round(totalMarksSum / totalSubjectsCount)
      : 84;

    const actionPlan = student.idp?.actionPlan || [];
    const completedCount = actionPlan.filter(task => task.status === 'Completed').length;
    
    // Derived level and progress based on streak + completed projects
    const totalWeight = (liveStreak * 10) + (completedCount * 30);
    const level = Math.max(1, Math.floor(totalWeight / 40) + 1);
    const xp = totalWeight % 100;

    return {
      masteryScore: `${avgMastery}%`,
      modulesComplete: `${completedCount}`,
      streak: `${liveStreak}`,
      level,
      xp,
      missions: actionPlan
    };
  }, [student, liveStreak]);

  // Click handler to toggle status of mission
  const handleToggleMission = async (index: number) => {
    if (!student || !student.idp) return;

    const updatedPlan = { ...student.idp };
    const task = updatedPlan.actionPlan[index];
    
    if (task) {
      const prevStatus = task.status;
      const nextStatus = prevStatus === 'Completed' ? 'Pending' : 'Completed';
      task.status = nextStatus;

      if (nextStatus === 'Completed') {
        setCelebrateTaskId(index);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#eab308', '#ec4899', '#a855f7', '#10b981']
        });
        setTimeout(() => setCelebrateTaskId(null), 2500);
        logStudentActivity(student.id, 'task_completed', `Completed mission task: ${task.task}`);
      } else {
        logStudentActivity(student.id, 'task_completed', `Reopened mission task: ${task.task}`);
      }

      try {
        await updateDoc(doc(db, 'students', student.id), {
          idp: updatedPlan
        });
      } catch (err) {
        console.error("Error setting mission task status", err);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOcrImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrintAssignment = () => {
    if (!selectedAssignment) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedAssignment.title}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body { padding: 40px; font-family: system-ui, sans-serif; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="max-w-4xl mx-auto">
              <div class="border-b-2 pb-4 mb-6">
                <span class="text-xs uppercase font-extrabold tracking-widest text-[#06b6d4]">${selectedAssignment.subject} • Class ${selectedAssignment.grade}</span>
                <h1 class="text-3xl font-black mt-1">${selectedAssignment.title}</h1>
                <p class="text-xs text-gray-400 mt-2">Assigned by: ${selectedAssignment.teacherName} • Subject Assessment</style>
              </div>
              <div class="prose max-w-none mt-6">
                ${selectedAssignment.content}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !student) return;
    
    // Validations
    if (solvingMode === 'online' && !onlineAnswers.trim()) {
      alert("Please enter our typed answers before submitting!");
      return;
    }
    if (solvingMode === 'ocr' && !ocrImage) {
      alert("Please upload/capture an image of your hand-written sheet first!");
      return;
    }

    setIsGrading(true);
    setGradingError('');
    setGradingResult(null);

    try {
      let aiResult: any;

      if (solvingMode === 'online') {
        const resp = await runTextGrade(
          onlineAnswers,
          selectedAssignment.memo || 'No memo. Use general academic guidelines.',
          selectedAssignment.rubric || 'Strict compliance check',
          'English'
        );
        aiResult = resp;
      } else {
        const resp = await runOCRAndGrade(
          ocrImage,
          selectedAssignment.rubric || 'Grade accurately based on standard academic quality checking correctness.',
          'gemini',
          'gemini',
          'English'
        );
        aiResult = resp;
      }

      if (!aiResult || (!aiResult.totalScore && !aiResult.grade)) {
        throw new Error("Could not extract score or feedback from AI. Please try writing answers more clearly.");
      }

      const totalScore = aiResult.totalScore || aiResult.grade || "7/10";
      const feedback = aiResult.feedback || "Good effort!";
      const marksPerQuestion = aiResult.marksPerQuestion || [];

      // Parse score matching
      const scoreMatch = totalScore.match(/(\d+)\s*\/\s*(\d+)/);
      let percentage = 75; // fallback
      if (scoreMatch) {
         const obtained = parseInt(scoreMatch[1]);
         const total = parseInt(scoreMatch[2]);
         if (total > 0) percentage = Math.round((obtained / total) * 100);
      } else {
         const pctMatch = totalScore.match(/(\d+)\s*%/);
         if (pctMatch) percentage = parseInt(pctMatch[1]);
      }

      // 1. Save submission document to Firestore
      const subId = 'submission_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
      await setDoc(doc(db, 'submissions', subId), {
        id: subId,
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        teacherId: selectedAssignment.teacherId,
        status: 'graded',
        submittedAt: new Date().toISOString(),
        completedOnline: solvingMode === 'online',
        answersText: solvingMode === 'online' ? onlineAnswers : '(OCR Uploaded Sheet)',
        uploadedImage: solvingMode === 'ocr' ? ocrImage : null,
        grade: totalScore,
        percentageScore: percentage,
        feedback: feedback,
        marksPerQuestion: marksPerQuestion,
        markedBy: 'AI'
      });

      // 2. Notify Teacher
      const teachNotifId = 'notif_sub_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
      await setDoc(doc(db, 'notifications', teachNotifId), {
        title: '📝 Student Graded Submission',
        message: `Student ${student.name} submitted and got ${totalScore} (${percentage}%) for "${selectedAssignment.title}".`,
        read: false,
        userId: selectedAssignment.teacherId,
        submissionId: subId,
        createdAt: serverTimestamp()
      });

      // 3. Update learner profile subjects list
      const updatedSubjects = (student.subjects || []).map(sub => {
         if (sub.name.toLowerCase().trim() === (selectedAssignment.subject || 'Mathematics').toLowerCase().trim()) {
           const existingAssessments = sub.assessments || [];
           return {
             ...sub,
             assessments: [
               ...existingAssessments,
               {
                 title: selectedAssignment.title,
                 score: percentage,
                 date: new Date().toISOString().split('T')[0]
               }
             ]
           };
         }
         return sub;
      });

      await updateDoc(doc(db, 'students', student.id), {
        subjects: updatedSubjects
      });

      // Success celebrations
      setGradingResult({
        totalScore,
        feedback,
        marksPerQuestion,
        percentage
      });
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#22c55e', '#a855f7', '#06b6d4', '#eab308']
      });

      logStudentActivity(student.id, 'task_completed', `Completed & Graded assignment: ${selectedAssignment.title} (Score: ${totalScore})`);
      
    } catch (err: any) {
      console.error("Grading failed", err);
      setGradingError(err.message || "An unexpected error occurred during grading. Please submit again.");
    } finally {
      setIsGrading(false);
    }
  };

  if (loading) {
    return (
      <LoadingMascot 
        message="Opening your classroom portal..." 
        subtitle="Unfolding custom curriculum, maps, and active badges" 
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Banner */}
      <div className={cn(
        "relative rounded-[40px] p-8 lg:p-12 overflow-hidden text-white flex flex-col justify-end min-h-[300px] border shadow-2xl transition-all duration-300",
        isDarkMode ? "glass-neon-card animate-neon-pulse-cyan border-brand-cyan/20 bg-slate-950/45" : "bg-slate-900 border-slate-800"
      )}>
         <div className="absolute top-0 right-0 p-8 opacity-10 hidden sm:block pointer-events-none">
           <Brain size={250} className={cn(isDarkMode && "icon-glow-cyan text-brand-cyan")} />
         </div>
         {isDarkMode && (
           <>
             <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-brand-cyan/10 blur-3xl pointer-events-none" />
             <div className="absolute right-1/4 bottom-0 w-40 h-40 rounded-full bg-brand-pink/10 blur-3xl pointer-events-none" />
           </>
         )}
         
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent pointer-events-none" />

         <div className="relative z-10">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs sm:text-sm font-bold mb-6 shadow-sm",
              isDarkMode ? "border-brand-green/30 bg-brand-green/10 text-brand-green" : "border-white/20 bg-white/10 text-emerald-300"
            )}>
              <Star size={16} className={cn("animate-pulse", isDarkMode ? "text-brand-yellow icon-glow-yellow" : "text-brand-yellow")} /> Welcome back, {student?.name || 'Discovery Cadet'}! 🚀
            </motion.div>
            <h1 className={cn(
              "text-3xl sm:text-5xl lg:text-7xl font-hand tracking-wide leading-tight mb-4 drop-shadow-md",
              isDarkMode ? "text-white text-glow-cyan" : "text-white"
            )}>
              Ready for your <span className="text-brand-cyan text-glow-cyan">next mission?</span>
            </h1>
            
            <div className="flex items-center gap-4 mt-4 sm:mt-6 max-w-lg">
              <div className={cn(
                "flex-1 h-3 sm:h-4 rounded-full overflow-hidden border",
                isDarkMode ? "bg-slate-950/60 border-white/10" : "bg-white/20 border-white/10"
              )}>
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${stats.xp}%` }}
                   transition={{ duration: 1.5, type: 'spring' }}
                   className={cn(
                     "h-full rounded-full",
                     isDarkMode ? "bg-brand-yellow shadow-[0_0_15px_rgba(255,223,64,0.7)]" : "bg-yellow-400 shadow-[0_0_15px_#facc15]"
                   )}
                 />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-white whitespace-nowrap uppercase tracking-widest">Level {stats.level} • {stats.xp}%</span>
            </div>
            <p className="text-sm sm:text-lg text-slate-300 font-medium mt-3 sm:mt-4">
              Your learning path is glowing! <span className={cn(
                "font-black inline-block animate-bounce ml-1",
                isDarkMode ? "text-brand-pink text-glow-pink" : "text-yellow-400"
              )}>{stats.streak} Day Streak! 🔥</span>
            </p>
          </div>
      </div>

      {/* Numerical Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
         {[
           { label: 'Mastery Score', value: stats.masteryScore, icon: Target, color: 'text-brand-green', glow: 'green', border: 'hover-neon-green hover:shadow-[0_0_15px_rgba(0,255,159,0.25)]' },
           { label: 'Modules Complete', value: stats.modulesComplete, icon: CheckCircle, color: 'text-brand-cyan', glow: 'cyan', border: 'hover-neon-cyan hover:shadow-[0_0_15px_rgba(0,179,255,0.25)]' },
           { label: 'Current Streak', value: stats.streak, icon: Flame, color: 'text-brand-pink', glow: 'pink', border: 'hover-neon-pink hover:shadow-[0_0_15px_rgba(255,0,212,0.25)]' }
         ].map((stat, i) => (
           <div 
             key={i} 
             className={cn(
               "p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between transition-all border duration-300",
               isDarkMode 
                 ? `glass-neon-card border-white/5 ${stat.border}` 
                 : "bg-white border-slate-200 shadow-sm hover:scale-[1.02]"
             )}
           >
              <div>
                <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{stat.label}</p>
                <h3 className={cn(
                  "text-2xl sm:text-3xl font-hand mt-0.5 sm:mt-1",
                  isDarkMode ? `text-white text-glow-${stat.glow}` : "text-slate-900"
                )}>{stat.value}</h3>
              </div>
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center",
                isDarkMode 
                  ? "bg-slate-950/45 border-white/10" 
                  : "bg-slate-50 border-slate-100",
                stat.color
              )}>
                <stat.icon size={20} className={isDarkMode ? `icon-glow-${stat.glow}` : ""} />
              </div>
           </div>
         ))}
      </div>

      {/* Dashboard Customization Control Panel */}
      <div className={cn(
        "p-4 rounded-[24px] border flex flex-col sm:flex-row justify-between items-center gap-4",
        isDarkMode ? "glass-neon-card border-white/5" : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <Move className="text-indigo-500 shrink-0" size={16} />
          <span className={cn("text-xs font-bold", isDarkMode ? "text-slate-300" : "text-slate-500")}>
            Customize Dashboard: Drag-and-drop the headers or use the <ArrowUp className="inline" size={12}/> <ArrowDown className="inline" size={12}/> buttons to arrange widgets!
          </span>
        </div>
        <button
          onClick={handleResetWidgetOrder}
          className={cn(
            "text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all border-0 cursor-pointer shadow-sm",
            isDarkMode ? "primary-neon-btn-cyan text-slate-950 font-black" : "bg-indigo-600 hover:bg-indigo-500 text-white"
          )}
        >
          Reset Layout
        </button>
      </div>

      {/* Dynamic customizable widgets container */}
      <div className="space-y-6 sm:space-y-8">
        {currentOrder.map((widgetId, index) => {
          const isDragged = draggedIndex === index;
          const isDragover = dragoverIndex === index;

          let widgetContent: React.ReactNode = null;

          if (widgetId === 'progress-charts') {
            const subjectsData = student?.subjects || [];
            const mathSub = subjectsData.find(s => s.name.toLowerCase().includes('math'));
            const physSub = subjectsData.find(s => s.name.toLowerCase().includes('phys'));
            const engSub = subjectsData.find(s => s.name.toLowerCase().includes('english') || s.name.toLowerCase().includes('efal'));

            const mathHistory = mathSub?.termHistory || [74, 78, 80, mathSub?.mark || 84];
            const physHistory = physSub?.termHistory || [70, 72, 75, physSub?.mark || 79];
            const engHistory = engSub?.termHistory || [82, 85, 87, engSub?.mark || 89];

            const performanceData = [
              { name: 'Term 1', 'Mathematics': mathHistory[0] || 74, 'Physical Sciences': physHistory[0] || 70, 'English': engHistory[0] || 82 },
              { name: 'Term 2', 'Mathematics': mathHistory[1] || 78, 'Physical Sciences': physHistory[1] || 72, 'English': engHistory[1] || 85 },
              { name: 'Term 3', 'Mathematics': mathHistory[2] || 80, 'Physical Sciences': physHistory[2] || 75, 'English': engHistory[2] || 87 },
              { name: 'Term 4', 'Mathematics': mathHistory[3] || 84, 'Physical Sciences': physHistory[3] || 79, 'English': engHistory[3] || 89 }
            ];

            widgetContent = (
              <div className={cn(
                "p-8 rounded-[36px] shadow-sm space-y-4 border",
                isDarkMode ? "glass-neon-card animate-neon-pulse-green border-brand-green/15" : "bg-white border border-slate-200"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={cn("text-2xl font-hand", isDarkMode ? "text-white text-glow-cyan" : "text-slate-900")}>Academic Growth Charts</h3>
                    <p className="text-xs text-slate-400 mt-1">Live subject performance trends over the academic terms</p>
                  </div>
                  <Activity className={cn("text-brand-green animate-pulse", isDarkMode && "icon-glow-green")} size={24} />
                </div>
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMath" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00B3FF" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00B3FF" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPhys" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00FF9F" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00FF9F" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF00D4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#FF00D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                      <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#94a3b8'} fontSize={10} tickLine={false} />
                      <YAxis stroke={isDarkMode ? '#94a3b8' : '#94a3b8'} fontSize={10} tickLine={false} domain={[50, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', borderRadius: '12px' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="Mathematics" stroke="#00B3FF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMath)" />
                      <Area type="monotone" dataKey="Physical Sciences" stroke="#00FF9F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPhys)" />
                      <Area type="monotone" dataKey="English" stroke="#FF00D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEng)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          } else if (widgetId === 'recent-activities') {
            widgetContent = (
              <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm space-y-5`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-2xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Recent Live Feed</h3>
                    <p className="text-xs text-slate-400 mt-1">Real-time chronicle of your study sessions and achievements</p>
                  </div>
                  <Clock className="text-emerald-500 animate-spin-slow" size={24} />
                </div>
                <div className="space-y-4">
                  {recentLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No recent activity logged yet. Complete tasks to light up your feed!</p>
                  ) : (
                    recentLogs.map((log) => {
                      let LogIcon = Flame;
                      let logColor = 'bg-yellow-500/10 text-yellow-500';
                      if (log.activityType === 'task_completed') {
                        LogIcon = CheckCircle;
                        logColor = 'bg-indigo-500/10 text-indigo-500';
                      } else if (log.activityType === 'practice_attempt') {
                        LogIcon = Target;
                        logColor = 'bg-emerald-500/10 text-emerald-500';
                      } else if (log.activityType === 'ai_chat') {
                        LogIcon = Brain;
                        logColor = 'bg-cyan-500/10 text-cyan-500';
                      }
                      
                      return (
                        <div key={log.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                          <div className={`w-9 h-9 rounded-xl ${logColor} flex items-center justify-center shrink-0`}>
                            <LogIcon size={16} />
                          </div>
                          <div className="space-y-0.5">
                            <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{log.description}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{log.timestamp} • Active Session</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          } else if (widgetId === 'upcoming-assignments') {
            widgetContent = (
              <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
                 <div className="flex justify-between items-center mb-6">
                   <div>
                     <h3 className={`text-2xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Teacher Assigned Tasks</h3>
                     <p className="text-xs text-slate-400 mt-1">Assessments and worksheets from your teachers</p>
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full animate-pulse">
                     Homework
                   </span>
                 </div>

                 {myAssignments.length === 0 ? (
                   <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200">
                     <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-2 animate-bounce" />
                     <p className="text-slate-500 font-medium text-sm">No homework assignments from your teachers yet!</p>
                     <p className="text-xs text-slate-400 mt-0.5">Your dashboard is up to date.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {myAssignments.map((assignment) => {
                       const submission = submissions.find(s => s.assignmentId === assignment.id);
                       const isCompleted = !!submission;

                       return (
                         <div
                           key={assignment.id}
                           className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                             isCompleted
                               ? 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30'
                               : (isDarkMode ? 'bg-white/5 border-white/10 hover:border-indigo-400' : 'bg-white border-slate-200 hover:border-indigo-400')
                           } shadow-sm group relative overflow-hidden`}
                         >
                           <div>
                             <div className="flex justify-between items-start gap-2 mb-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-[#06b6d4] bg-cyan-100/50 dark:bg-cyan-950 px-2 py-0.5 rounded-md">
                                 {assignment.subject}
                               </span>
                               {isCompleted ? (
                                 <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                                   <CheckCircle size={10} /> Graded: {submission.grade}
                                 </span>
                               ) : (
                                 <span className="text-[9px] font-mono font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-950 px-2 py-0.5 rounded-md">
                                   Incomplete
                                 </span>
                               )}
                             </div>

                             <h4 className={`font-bold text-base mt-2 line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                               {assignment.title}
                             </h4>
                             <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                               {assignment.contentType} • Assigned by {assignment.teacherName}
                             </p>
                           </div>

                           <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-transparent">
                             <span className="text-[10px] font-mono text-slate-400 font-medium">
                               {assignment.createdAt ? new Date(assignment.createdAt.seconds * 1000 || assignment.createdAt).toLocaleDateString() : 'Active'}
                             </span>

                             <button
                               onClick={() => {
                                 setSelectedAssignment(assignment);
                                 setOnlineAnswers('');
                                 setOcrImage('');
                                 setGradingResult(submission || null);
                                 setGradingError('');
                                 setSolvingMode('online');
                               }}
                               className={`px-4 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all border-0 cursor-pointer ${
                                 isCompleted
                                   ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                   : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                               }`}
                             >
                               {isCompleted ? 'View Graded' : 'Solve & Hand-In'}
                             </button>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
              </div>
            );
          } else if (widgetId === 'upcoming-missions') {
            const QUEST_THEMES = [
              { name: "Galaxy Guardians", tag: "Mathematics", icon: "🌌", gradient: "from-fuchsia-500 to-purple-600", glow: "shadow-[0_0_15px_rgba(217,70,239,0.5)]", baseProgress: 70 },
              { name: "Code Wizards", tag: "Physical Sciences", icon: "🔮", gradient: "from-cyan-400 to-blue-500", glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]", baseProgress: 45 },
              { name: "Dino Discoveries", tag: "English EFAL", icon: "🦖", gradient: "from-yellow-400 to-amber-500", glow: "shadow-[0_0_15px_rgba(234,179,8,0.5)]", baseProgress: 15 },
              { name: "Planet Pioneers", tag: "Social Sciences", icon: "🌍", gradient: "from-emerald-400 to-green-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]", baseProgress: 0 }
            ];

            widgetContent = (
              <div className={`${isDarkMode ? 'glass bg-slate-900/60 border border-white/10' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
                 <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-2xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Active Quests</h3>
                    <span className="text-xs font-black uppercase tracking-widest text-[#06b6d4] bg-cyan-100 dark:bg-cyan-950/50 px-3 py-1 rounded-full animate-pulse">Personalized Map</span>
                 </div>
                 
                 <div className="space-y-6">
                    {stats.missions.map((m, i) => {
                      const completed = m.status === 'Completed';
                      const theme = QUEST_THEMES[i % QUEST_THEMES.length];
                      const progressValue = completed ? 100 : theme.baseProgress;

                      return (
                        <div 
                          key={i} 
                          onClick={() => handleToggleMission(i)}
                          className={`p-5 rounded-[24px] border transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                            completed
                            ? (isDarkMode ? 'border-emerald-500/30 bg-emerald-950/10 opacity-80' : 'border-emerald-200 bg-emerald-50/50 opacity-80')
                            : (isDarkMode ? 'border-white/15 bg-slate-950/40 hover:border-brand-cyan/60 hover:bg-slate-950/60' : 'border-slate-150 bg-slate-50 hover:border-brand-cyan/40 hover:bg-slate-50/80')
                          } shadow-sm`}
                        >
                           {celebrateTaskId === i && (
                             <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none animate-ping"></div>
                           )}
                           
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white/5 border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} shrink-0`}>
                                  {theme.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                      {theme.name}
                                    </h4>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      {theme.tag}
                                    </span>
                                  </div>
                                  <p className={`text-sm font-bold mb-3 ${completed ? 'line-through text-slate-400' : (isDarkMode ? 'text-slate-200' : 'text-slate-700')}`}>
                                    {m.task}
                                  </p>
                                  
                                  {/* Progress bar container */}
                                  <div className="space-y-1.5 w-full">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      <span>Quest Progress</span>
                                      <span className={completed ? 'text-emerald-400 font-black' : ''}>
                                        {progressValue}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressValue}%` }}
                                        transition={{ duration: 0.8 }}
                                        className={`h-full rounded-full bg-gradient-to-r ${completed ? 'from-emerald-400 to-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : `${theme.gradient} ${theme.glow}`}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-end shrink-0 gap-3">
                               <div className="text-right hidden md:block">
                                 <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Milestone</span>
                                 <span className="text-xs font-bold underline text-brand-cyan">{m.milestone}</span>
                               </div>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleToggleMission(i);
                                 }}
                                 className={`shadow-lg border p-2.5 rounded-full transition-all group-hover:scale-110 active:scale-95 ${
                                   completed
                                   ? 'bg-emerald-500 border-emerald-600 text-white'
                                   : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-indigo-600/20'
                                 }`}
                               >
                                 {completed ? <Check size={18} className="stroke-[3.5]" /> : <Play size={18} className="fill-current ml-0.5"/>}
                               </button>
                             </div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            );
          } else if (widgetId === 'parent-motivation') {
            widgetContent = (
              <div>
                {student?.idp?.parentNote ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-[28px] border-2 bg-gradient-to-tr ${
                      isDarkMode 
                        ? 'from-[#3B0764]/40 via-[#1E1B4B]/30 to-[#030712]/50 border-purple-500/20 shadow-purple-950/20' 
                        : 'from-pink-50 via-purple-50 to-indigo-50 border-purple-200/55 shadow-purple-100/50'
                    } border-solid shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-purple-400">
                      <Heart size={140} className="fill-current" />
                    </div>
                    <div className={`p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shrink-0 flex items-center justify-center`}>
                      <Heart size={26} className="fill-current animate-pulse text-red-500" />
                    </div>
                    <div className="space-y-1.5 z-10">
                      <h4 className={`text-xs font-black uppercase tracking-widest ${
                        isDarkMode ? 'text-purple-300' : 'text-purple-500'
                      }`}>
                        Message from Parent/Guardian
                      </h4>
                      <p className={`text-base sm:text-lg font-hand leading-relaxed italic ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        "{student.idp.parentNote}"
                      </p>
                      {student.idp.parentNoteTimestamp && (
                        <p className="text-[9px] font-mono font-bold text-slate-500 mr-auto">
                          Received: {new Date(student.idp.parentNoteTimestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className={`p-6 rounded-[28px] border-2 bg-gradient-to-tr ${
                    isDarkMode 
                      ? 'from-indigo-950/30 to-slate-950/40 border-indigo-500/10 shadow-sm' 
                      : 'from-blue-50/50 to-indigo-50/50 border-indigo-100 shadow-sm'
                  } border-solid flex items-center gap-4 relative overflow-hidden`}>
                    <div className="p-4 bg-indigo-500/10 rounded-2xl shrink-0 flex items-center justify-center text-indigo-500">
                      <Star size={24} className="fill-current animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">AI Tutor Sparks</h4>
                      <p className={`text-sm sm:text-base font-hand leading-relaxed italic ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} mt-1`}>
                        "Believe in your learning journey! Every question asked is a step closer to deep mastery." — Sparky 🪄
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={widgetId}
              draggable={true}
              onDragStart={(e) => {
                setDraggedIndex(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragoverIndex(index);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragoverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== index) {
                  const newOrder = [...currentOrder];
                  const [removed] = newOrder.splice(draggedIndex, 1);
                  newOrder.splice(index, 0, removed);
                  handleSaveWidgetOrder(newOrder);
                }
                setDraggedIndex(null);
                setDragoverIndex(null);
              }}
              className={`transition-all duration-300 ${
                isDragged ? 'opacity-40 scale-95 shadow-inner' : ''
              } ${
                isDragover ? 'border-2 border-dashed border-indigo-500 scale-[1.01] rounded-[36px] bg-indigo-500/5' : ''
              } relative group/widget`}
            >
              {/* Drag controller handle bar overlays */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1 opacity-0 group-hover/widget:opacity-100 transition-opacity bg-slate-100/90 dark:bg-slate-900/90 rounded-full px-3 py-1 shadow-sm border border-slate-200/50 dark:border-white/5">
                <GripVertical size={12} className="text-slate-400 cursor-grab active:cursor-grabbing shrink-0 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-500 select-none uppercase tracking-widest hidden sm:inline mr-1">Reorder</span>
                
                {index > 0 && (
                  <button
                    onClick={() => moveWidget(index, 'up')}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 border-0 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp size={10} />
                  </button>
                )}
                {index < currentOrder.length - 1 && (
                  <button
                    onClick={() => moveWidget(index, 'down')}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 border-0 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown size={10} />
                  </button>
                )}
              </div>

              {widgetContent}
            </div>
          );
        })}
      </div>
      
      {/* SOLVER & GRADER MODAL DIALOG */}
      <AnimatePresence>
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`w-full max-w-5xl rounded-[2rem] shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[80vh] overflow-hidden ${
                isDarkMode ? 'bg-navy-dark text-white border border-slate-800' : 'bg-white text-slate-800 border border-slate-100'
              }`}
            >
              {/* Left Side: Assignment Content & Resource Panel */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                      {selectedAssignment.subject} • Class Assignment
                    </span>
                    <button
                      onClick={handlePrintAssignment}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950 px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                    >
                      <Printer size={14} /> Print / Save PDF
                    </button>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black mb-2">{selectedAssignment.title}</h1>
                  <p className="text-xs text-slate-400 mb-6">Assigned by {selectedAssignment.teacherName} • Objective: Grade obtained tracks in your record.</p>

                  {/* Render HTML Content */}
                  <div className="prose prose-sm max-w-none dark:prose-invert markdown-body select-text mb-6">
                    {selectedAssignment.content && selectedAssignment.content.trim().startsWith('<') ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedAssignment.content }} />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: marked.parse(selectedAssignment.content || '') as string }} />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl mt-4">
                  <p className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedAssignment.id} • Memo notes and rubrics compiled by teacher are attached for autograding.
                  </p>
                </div>
              </div>

              {/* Right Side: Solve Online or Scan OCR */}
              <div className={`w-full md:w-[400px] overflow-y-auto p-6 md:p-8 flex flex-col justify-between ${
                isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'
              }`}>
                {/* Header close */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black">Submit Responses</h3>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 border-0 cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {isGrading ? (
                  /* Loading Autograder Screen */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
                    <Loader2 size={44} className="animate-spin text-indigo-500 mb-4" />
                    <h4 className="text-base font-black">AI Autograder Working...</h4>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                      Gemini is scanning your submissions, matching them against the teacher's memo & rubric guidelines, and computing your mark...
                    </p>
                  </div>
                ) : gradingResult ? (
                  /* Autograded Result Display */
                  <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
                    <div className="p-6 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white text-center shadow-lg relative overflow-hidden">
                      <p className="text-[10px] uppercase font-black tracking-widest text-emerald-100">Grade Obtained</p>
                      <h2 className="text-4xl font-hand mt-1 font-bold">{gradingResult.totalScore || gradingResult.grade}</h2>
                      {gradingResult.percentage !== undefined && (
                        <p className="text-xs text-emerald-500 bg-white font-extrabold px-3 py-1 rounded-full inline-block mt-3 shadow-md">
                          Score: {gradingResult.percentage}%
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-1">Constructive Feedback</span>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {gradingResult.feedback}
                        </p>
                      </div>

                      {gradingResult.marksPerQuestion && gradingResult.marksPerQuestion.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-2">Question Breakdown</span>
                          <div className="space-y-1.5">
                            {gradingResult.marksPerQuestion.map((q: string, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 py-1 border-b border-dashed border-slate-100 dark:border-slate-700 last:border-0">
                                <span>{q}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedAssignment(null)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest border-0 cursor-pointer mt-4"
                    >
                      Awesome, Got It!
                    </button>
                  </div>
                ) : (
                  /* Main Solve Forms */
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Solve Modes */}
                      <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl mb-6">
                        <button
                          onClick={() => setSolvingMode('online')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border-0 cursor-pointer transition-all ${
                            solvingMode === 'online'
                              ? 'bg-white dark:bg-slate-700 text-navy-dark dark:text-white shadow-sm'
                              : 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          Type Answers
                        </button>
                        <button
                          onClick={() => setSolvingMode('ocr')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border-0 cursor-pointer transition-all ${
                            solvingMode === 'ocr'
                              ? 'bg-white dark:bg-slate-700 text-navy-dark dark:text-white shadow-sm'
                              : 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          Print & Scan OCR
                        </button>
                      </div>

                      {/* Online Solver Inputs */}
                      {solvingMode === 'online' ? (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">Your Typed Solutions</label>
                            <textarea
                              rows={10}
                              value={onlineAnswers}
                              onChange={(e) => setOnlineAnswers(e.target.value)}
                              placeholder="Type your answers clearly here... e.g.:
1.1 x = 5
1.2 y = 12 (since triangle is right-angled)
2.1 Photosynthesis is the process by which plants use sunlight..."
                              className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 resize-none"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Print and Hand-written uploads */
                        <div className="space-y-5">
                          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 rounded-xl leading-relaxed">
                            <span className="text-[9px] uppercase font-black text-indigo-500 tracking-widest block mb-1">Hand-Write Submission Guide</span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Write answers on paper by hand, then snap a clear photo and drag, drop, or select the photo below! The AI will OCR-read and grade your handwriting.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-500 block">Capture or Upload Sheet</span>
                            
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                              className="hidden"
                            />

                            {ocrImage ? (
                              <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-[180px] flex items-center justify-center">
                                <img src={ocrImage} className="max-h-full object-contain" alt="OCR Preview" />
                                <button
                                  onClick={() => setOcrImage('')}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 text-white border-0 cursor-pointer hover:bg-slate-900"
                                >
                                  Retake
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer text-center bg-white dark:bg-slate-800 transition-colors"
                              >
                                <Upload size={24} className="text-slate-400 mb-2" />
                                <span className="text-xs font-bold text-slate-500">Pick Photo / Scan Image</span>
                                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, or Camera Shot</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {gradingError && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 text-red-500" />
                          <span>{gradingError}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => setSelectedAssignment(null)}
                        className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-xs font-bold cursor-pointer text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitAssignment}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-widest border-0 cursor-pointer shadow-md"
                      >
                        Submit Grader
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Floating 'Ask AI Tutor' Chat Bubble */}
      <StudentAITutorBubble isDarkMode={isDarkMode} student={student} />
    </div>
  );
}
