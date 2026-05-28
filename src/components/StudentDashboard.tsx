import React, { useState, useEffect, useMemo } from 'react';
import { Target, BookOpen, CheckCircle, Flame, Star, Brain, Play, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, setDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { StudentDoc, MilestoneTask, IdpModel, Subject } from '../types';
import { logStudentActivity } from '../lib/activityLogger';
import LoadingMascot from './LoadingMascot';


export default function StudentDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrateTaskId, setCelebrateTaskId] = useState<number | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    const email = user?.email || localStorage.getItem('userEmail') || 'sibu.dube@school.za';

    // Query for students matching account email
    const q = query(collection(db, 'students'), where('email', '==', email));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
        const fallbackEmail = email;

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

    return () => unsubscribe();
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
    </div>
  );
}
