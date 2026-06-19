import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Target, BookOpen, CheckCircle, Flame, Star, Brain, Play, Check, Heart, MessageCircle, Printer, Camera, Upload, Loader2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
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
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
          uniqueDates.add(data.timestamp);
        }
      });

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
    <div className="space-y-6 sm:space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-6 sm:p-10 rounded-[28px] sm:rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col justify-end min-h-[260px] sm:min-h-[350px]">
         <div className="absolute top-0 right-0 p-8 opacity-20 hidden sm:block">
           <Brain size={250} />
         </div>
         <div className="relative z-10">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-bold text-yellow-300 mb-4 shadow-sm">
              <Star size={16} className="animate-pulse text-brand-yellow" /> Welcome back, {student?.name || 'Discovery Cadet'}! 🚀
            </motion.div>
            <h2 className="text-3xl sm:text-5xl lg:text-7xl font-hand mb-2 tracking-wide text-white drop-shadow-lg leading-tight">Ready for your <br/> next mission?</h2>
            
            <div className="flex items-center gap-4 mt-4 sm:mt-6">
              <div className="flex-1 bg-white/20 h-3 sm:h-4 rounded-full overflow-hidden border border-white/10">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${stats.xp}%` }}
                   transition={{ duration: 1.5, type: 'spring' }}
                   className="h-full bg-yellow-400 shadow-[0_0_15px_#facc15]" 
                 />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-white whitespace-nowrap uppercase tracking-widest">Level {stats.level} • {stats.xp}%</span>
            </div>
            <p className="text-sm sm:text-lg text-blue-100 font-medium mt-3 sm:mt-4">
              Your learning path is glowing! <span className="text-yellow-400 font-black inline-block animate-bounce ml-1">{stats.streak} Day Streak! 🔥</span>
            </p>
          </div>
      </div>

      {/* Numerical Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
         {[
           { label: 'Mastery Score', value: stats.masteryScore, icon: Target, color: 'text-emerald-500' },
           { label: 'Modules Complete', value: stats.modulesComplete, icon: CheckCircle, color: 'text-indigo-500' },
           { label: 'Current Streak', value: stats.streak, icon: Flame, color: 'text-yellow-500' }
         ].map((stat, i) => (
           <div key={i} className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all`}>
              <div>
                <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                <h3 className={`text-2xl sm:text-3xl font-hand mt-0.5 sm:mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} border flex flex-col items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
           </div>
         ))}
      </div>

      {/* Parent Motivation Note Card (If Provided) */}
      {student?.idp?.parentNote && (
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
      )}

      {/* Teacher Assigned Homework / Assessments Vault */}
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

      {/* Upcoming Missions (Interactive Tasks) */}
      <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-8 rounded-[36px] shadow-sm`}>
         <div className="flex justify-between items-center mb-6">
            <h3 className={`text-2xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Upcoming Tasks & Missions</h3>
            <span className="text-xs font-black uppercase tracking-widest text-[#06b6d4] bg-cyan-100 dark:bg-cyan-950 px-3 py-1 rounded-full animate-pulse">Personalized Map</span>
         </div>
         
         <div className="space-y-4">
            {stats.missions.map((m, i) => {
              const completed = m.status === 'Completed';
              return (
                <div 
                  key={i} 
                  onClick={() => handleToggleMission(i)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer shadow-sm relative overflow-hidden ${
                    completed
                    ? (isDarkMode ? 'border-emerald-500/30 bg-emerald-505/10 bg-white/5 opacity-75' : 'border-emerald-200 bg-emerald-50/50 opacity-75')
                    : (isDarkMode ? 'border-white/10 bg-white/5 hover:border-brand-cyan' : 'border-slate-100 bg-slate-50 hover:border-brand-cyan')
                  }`}
                >
                   {celebrateTaskId === i && (
                     <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none animate-ping"></div>
                   )}
                   
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${
                        completed 
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-indigo-100 text-indigo-500'
                      }`}>
                        {completed ? <CheckCircle size={20}/> : <BookOpen size={20}/>}
                      </div>
                      <div>
                        <h4 className={`font-bold transition-all ${
                          completed 
                          ? 'line-through text-slate-400' 
                          : (isDarkMode ? 'text-white' : 'text-slate-700')
                        }`}>{m.task}</h4>
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Target: <span className="font-bold underline text-cyan-500">{m.milestone}</span> • <span className="uppercase tracking-wider font-extrabold text-[10px]">{m.status}</span>
                        </p>
                      </div>
                   </div>
                   
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       handleToggleMission(i);
                     }}
                     className={`shadow-lg border p-2.5 rounded-full transition-all group-hover:scale-110 active:scale-95 ${
                       completed
                       ? 'bg-emerald-500 border-emerald-600 text-white'
                       : (isDarkMode ? 'bg-white/10 border-white/20 text-slate-300 hover:text-brand-cyan hover:border-brand-cyan' : 'bg-white border-slate-200 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan')
                     }`}
                   >
                     {completed ? <Check size={20} className="stroke-[3.5]" /> : <Play size={20} className="fill-current"/>}
                   </button>
                </div>
              );
            })}
         </div>
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
