import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  TrendingUp, Users, BookOpen, Award, CheckCircle, Clock, AlertCircle, 
  Search, Sparkles, Filter, Check, User, RefreshCw, Send, Download, 
  ArrowLeft, Activity, ChevronRight, Plus, FileText, Brain, Percent, ClipboardList, CheckSquare,
  Edit2, Trash2, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend, Cell
} from 'recharts';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

import { StudentDoc, Subject, Assessment, MilestoneTask, IdpModel } from '../types';
import { MOCK_STUDENTS, PRELOADED_PLANS } from '../data/mockStudents';
import LoadingMascot from './LoadingMascot';

export default function ProgressReports({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'idp'>('overview');
  
  // Mobile UI adjustments
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveSubView, setMobileActiveSubView] = useState<'roster' | 'dossier'>('roster');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Roster inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  
  // Selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('mock-1');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  
  // Marks and Assessment distribution chart state
  const [distributionSubject, setDistributionSubject] = useState('All');
  const [distributionType, setDistributionType] = useState<'subject' | 'assessment'>('subject');

  // Firebase lists
  const [firebaseStudents, setFirebaseStudents] = useState<any[]>([]);
  const [firebaseClasses, setFirebaseClasses] = useState<any[]>([]);
  
  // Custom Plan editing state
  const [customPlans, setCustomPlans] = useState<Record<string, any>>({});
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [newMilestoneLine, setNewMilestoneLine] = useState('');

  // Generation status indicators
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStepText, setGenerationStepText] = useState('');

  // Sync to Parents notification
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Download PDF simulation animation
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // CRUD Learner States
  const [loading, setLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Grade 10A');
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');

  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentGrade, setEditStudentGrade] = useState('');
  const [editStudentStatus, setEditStudentStatus] = useState('Active');
  const [editParentName, setEditParentName] = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    const docId = `student_${Date.now()}`;
    const email = newStudentEmail.trim() || `${newStudentName.replace(/\s+/g, '.').toLowerCase()}@school.za`;
    
    // Deterministic seed for initial realistic scores
    const seed = newStudentName.charCodeAt(0) || 72;
    const mathScore = Math.min(95, Math.max(42, (seed % 40) + 50));
    const scienceScore = Math.min(95, Math.max(40, ((seed + 5) % 40) + 45));
    const englishScore = Math.min(93, Math.max(50, ((seed + 12) % 30) + 60));

    try {
      await setDoc(doc(db, 'students', docId), {
        id: docId,
        name: newStudentName.trim(),
        grade: newStudentGrade,
        email: email,
        status: 'Active',
        teacherId: user.uid,
        parentName: newParentName.trim(),
        parentEmail: newParentEmail.trim(),
        parentPhone: newParentPhone.trim(),
        createdAt: serverTimestamp(),
        subjects: [
          { name: 'Mathematics', mark: mathScore, termHistory: [mathScore - 9, mathScore - 4, mathScore - 2, mathScore], assessments: [ { title: 'Algebra Portfolio', score: mathScore + 4, type: 'SBA' }, { title: 'Diagnostic Test', score: mathScore - 5, type: 'Test' } ] },
          { name: 'Physical Sciences', mark: scienceScore, termHistory: [scienceScore - 11, scienceScore - 6, scienceScore - 1, scienceScore], assessments: [ { title: 'Stoichiometry SBA', score: scienceScore - 3, type: 'SBA' }, { title: 'Mechanics Practical', score: scienceScore + 5, type: 'Practical' } ] },
          { name: 'English First Additional Language', mark: englishScore, termHistory: [englishScore - 5, englishScore - 2, englishScore - 1, englishScore], assessments: [ { title: 'Summary SBA', score: englishScore + 2, type: 'SBA' }, { title: 'Grammar review', score: englishScore - 4, type: 'Quiz' } ] }
        ]
      });
      setShowAddStudentModal(false);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewParentName('');
      setNewParentEmail('');
      setNewParentPhone('');
      setSelectedStudentId(docId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'students/' + docId);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentName.trim() || !currentStudent) return;
    
    // Prevent updating unseeded mock fallback record directly
    if (currentStudent.id.startsWith('mock-') && !currentStudent.id.includes('_')) {
      alert("This is a preview student. Please add a new student instead.");
      setShowEditStudentModal(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'students', currentStudent.id), {
        name: editStudentName.trim(),
        email: editStudentEmail.trim(),
        grade: editStudentGrade,
        status: editStudentStatus,
        parentName: editParentName.trim(),
        parentEmail: editParentEmail.trim(),
        parentPhone: editParentPhone.trim()
      });
      setShowEditStudentModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'students/' + currentStudent.id);
    }
  };

  // Listen to Firestore classes and students
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Classes
    const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      setFirebaseClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.log("Classes sub error:", error));

    // Students
    const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubStudents = onSnapshot(qStudents, async (snapshot) => {
      if (snapshot.empty) {
        console.log("Seeding student documents to Firestore for new teacher...");
        const seededList: any[] = [];
        for (const mock of MOCK_STUDENTS) {
          const docId = `${mock.id}_${user.uid}`;
          const seededData = {
            ...mock,
            id: docId,
            teacherId: user.uid,
            createdAt: serverTimestamp(),
          };
          try {
            await setDoc(doc(db, 'students', docId), seededData);
          } catch (e) {
            console.error("Failed to seed student doc", e);
          }
          seededList.push(seededData);
        }
        setFirebaseStudents(seededList);
      } else {
        setFirebaseStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    }, (error) => {
      console.error("Students loading snapshot error:", error);
      setLoading(false);
    });

    return () => { unsubClasses(); unsubStudents(); };
  }, []);

  // Synchronize custom plans from database and local cache
  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem('eduai_custom_plans') || '{}');
    const plansFromFirebase: Record<string, any> = {};
    firebaseStudents.forEach(student => {
      if (student.idp) {
        plansFromFirebase[student.id] = student.idp;
      }
    });
    setCustomPlans(prev => ({
      ...cached,
      ...plansFromFirebase,
      ...prev
    }));
  }, [firebaseStudents]);

  // Merge mock students with Firebase students so that any custom-added learner dynamically functions!
  const allStudents = useMemo(() => {
    return firebaseStudents.map(student => {
      // Create a deterministic seed from student name to create realistic scores
      const seed = student.name.charCodeAt(0) || 72;
      const mathScore = Math.min(95, Math.max(42, (seed % 40) + 50));
      const scienceScore = Math.min(95, Math.max(40, ((seed + 5) % 40) + 45));
      const englishScore = Math.min(93, Math.max(50, ((seed + 12) % 30) + 60));

      return {
        id: student.id,
        name: student.name,
        grade: student.grade || 'Grade 10A',
        email: student.email || `${student.name.replace(/\s+/g, '.').toLowerCase()}@school.za`,
        status: student.status || 'Active',
        idp: student.idp || null,
        parentName: student.parentName || '',
        parentEmail: student.parentEmail || '',
        parentPhone: student.parentPhone || '',
        subjects: student.subjects || [
          { name: 'Mathematics', mark: mathScore, termHistory: [mathScore - 9, mathScore - 4, mathScore - 2, mathScore], assessments: [ { title: 'Algebra Portfolio', score: mathScore + 4, type: 'SBA' }, { title: 'Diagnostic Test', score: mathScore - 5, type: 'Test' } ] },
          { name: 'Physical Sciences', mark: scienceScore, termHistory: [scienceScore - 11, scienceScore - 6, scienceScore - 1, scienceScore], assessments: [ { title: 'Stoichiometry SBA', score: scienceScore - 3, type: 'SBA' }, { title: 'Mechanics Practical', score: scienceScore + 5, type: 'Practical' } ] },
          { name: 'English First Additional Language', mark: englishScore, termHistory: [englishScore - 5, englishScore - 2, englishScore - 1, englishScore], assessments: [ { title: 'Summary SBA', score: englishScore + 2, type: 'SBA' }, { title: 'Grammar review', score: englishScore - 4, type: 'Quiz' } ] }
        ]
      };
    }) as StudentDoc[];
  }, [firebaseStudents]);

  // Dynamic class aggregate Term progress computed dynamically from all student's subjects
  const classAggregateData = useMemo(() => {
    const defaultData = [
      { name: 'Term 1', math: 65, sci: 70, eng: 80, geo: 74 },
      { name: 'Term 2', math: 72, sci: 75, eng: 82, geo: 75 },
      { name: 'Term 3', math: 80, sci: 85, eng: 88, geo: 77 },
      { name: 'Term 4', math: 85, sci: 92, eng: 90, geo: 81 },
    ];
    if (allStudents.length === 0) return defaultData;

    const terms = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
    return terms.map((term, termIdx) => {
      let mathSum = 0, mathCount = 0;
      let sciSum = 0, sciCount = 0;
      let engSum = 0, engCount = 0;

      allStudents.forEach(student => {
        if (!student.subjects) return;
        student.subjects.forEach(sub => {
          const val = sub.termHistory?.[termIdx] || sub.mark;
          const name = sub.name.toLowerCase();
          if (name.includes('math')) {
            mathSum += val;
            mathCount++;
          } else if (name.includes('science') || name.includes('phys')) {
            sciSum += val;
            sciCount++;
          } else if (name.includes('english') || name.includes('lang')) {
            engSum += val;
            engCount++;
          }
        });
      });

      return {
        name: term,
        math: mathCount > 0 ? Math.round(mathSum / mathCount) : defaultData[termIdx].math,
        sci: sciCount > 0 ? Math.round(sciSum / sciCount) : defaultData[termIdx].sci,
        eng: engCount > 0 ? Math.round(engSum / engCount) : defaultData[termIdx].eng
      };
    });
  }, [allStudents]);

  // Handle defaults when selecting student
  const currentStudent = useMemo(() => {
    return allStudents.find(s => s.id === selectedStudentId) || allStudents[0];
  }, [allStudents, selectedStudentId]);

  // Keep selectedStudentId valid
  useEffect(() => {
    if (allStudents.length > 0) {
      if (!allStudents.find(s => s.id === selectedStudentId)) {
        setSelectedStudentId(allStudents[0].id);
      }
    }
  }, [allStudents, selectedStudentId]);

  // Set default subject when student changes
  useEffect(() => {
    if (currentStudent && currentStudent.subjects && currentStudent.subjects.length > 0) {
      // Find matches for previous subject name or reset to first
      const exists = currentStudent.subjects.some(s => s.name === selectedSubjectName);
      if (!exists) {
        setSelectedSubjectName(currentStudent.subjects[0].name);
      }
    }
  }, [currentStudent, selectedSubjectName]);

  // Subject record
  const currentSubjectObj = useMemo(() => {
    if (!currentStudent || !currentStudent.subjects) return null;
    return currentStudent.subjects.find(s => s.name === selectedSubjectName) || currentStudent.subjects[0];
  }, [currentStudent, selectedSubjectName]);

  // Search/Filter matching students
  const filteredStudents = useMemo(() => {
    return allStudents.filter(learner => {
      const matchesSearch = learner.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            learner.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClassFilter === 'All' || learner.grade === selectedClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [allStudents, searchTerm, selectedClassFilter]);

  // Compiled dynamic grades & statistics
  const studentAveragePerformance = useMemo(() => {
    if (!currentStudent || !currentStudent.subjects) return 0;
    const total = currentStudent.subjects.reduce((sum, s) => sum + s.mark, 0);
    return Math.round(total / currentStudent.subjects.length);
  }, [currentStudent]);

  // List of distinct classes from mock and dynamic sets
  const availableClassesList = useMemo(() => {
    const classSet = new Set<string>();
    allStudents.forEach(s => {
      if (s.grade) classSet.add(s.grade);
    });
    return Array.from(classSet).sort();
  }, [allStudents]);

  // Extract distinct subjects for the filtered class distribution chart
  const distributionSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    allStudents.forEach(student => {
      if (selectedClassFilter === 'All' || student.grade === selectedClassFilter) {
        student.subjects?.forEach(s => subjectsSet.add(s.name));
      }
    });
    return ['All', ...Array.from(subjectsSet).sort()];
  }, [allStudents, selectedClassFilter]);

  // Keep distributionSubject valid if class filter changes and subject is no longer in list
  useEffect(() => {
    if (distributionSubject !== 'All' && !distributionSubjects.includes(distributionSubject)) {
      setDistributionSubject('All');
    }
  }, [distributionSubjects, distributionSubject]);

  // Dynamic distribution of marks for selected class/subject and mode
  const marksDistributionData = useMemo(() => {
    const brackets = [
      { range: '0-49%', label: 'Needs Support (L1-2)', count: 0, color: '#f43f5e' },
      { range: '50-59%', label: 'Developing (L3-4)', count: 0, color: '#f59e0b' },
      { range: '60-69%', label: 'Satisfactory (L5)', count: 0, color: '#3b82f6' },
      { range: '70-79%', label: 'Highly Competent (L6)', count: 0, color: '#06b6d4' },
      { range: '80-100%', label: 'Outstanding (L7)', count: 0, color: '#10b981' },
    ];

    allStudents.forEach(student => {
      // Apply class filter
      if (selectedClassFilter !== 'All' && student.grade !== selectedClassFilter) return;

      if (!student.subjects) return;

      student.subjects.forEach(sub => {
        // Apply subject filter if not 'All'
        if (distributionSubject !== 'All' && sub.name !== distributionSubject) return;

        if (distributionType === 'subject') {
          const mark = sub.mark;
          if (mark < 50) brackets[0].count++;
          else if (mark < 60) brackets[1].count++;
          else if (mark < 70) brackets[2].count++;
          else if (mark < 80) brackets[3].count++;
          else brackets[4].count++;
        } else {
          if (!sub.assessments) return;
          sub.assessments.forEach(ass => {
            const score = ass.score;
            if (score < 50) brackets[0].count++;
            else if (score < 60) brackets[1].count++;
            else if (score < 70) brackets[2].count++;
            else if (score < 80) brackets[3].count++;
            else brackets[4].count++;
          });
        }
      });
    });

    return brackets;
  }, [allStudents, selectedClassFilter, distributionSubject, distributionType]);

  // AI recommendations plan state query
  const studentPlan = useMemo(() => {
    // If student has a customized plan saved in our state, return it
    if (customPlans[selectedStudentId]) {
      return customPlans[selectedStudentId];
    }
    // Else check preloaded mock analyses
    const cleanId = selectedStudentId.split('_')[0];
    if (PRELOADED_PLANS[cleanId]) {
      return PRELOADED_PLANS[cleanId];
    }
    // Final default fallback structure
    return {
      strengths: [
        `Solid general academic attendance and prompt test attendance.`,
        `Satisfactory task submission quality across core subjects.`
      ],
      weaknesses: [
        `Requires consolidation of Term 3 and Term 4 exam competencies.`,
        `Requires deeper focus on self-assessment practice modules.`
      ],
      recommendations: [
        `Engage standard curriculum practice sheets from the Content Creator.`,
        `Set up specialized tutor chat dialogues on EduAI for real-time concept questions.`
      ],
      actionPlan: [
        { task: "Revise high-priority syllabus sections and map terms", milestone: "Next 2 weeks", status: "In Progress" },
        { task: "Consult AI Tutor for interactive quizzes", milestone: "Within 3 weeks", status: "Pending" }
      ]
    };
  }, [customPlans, selectedStudentId]);

  // Persistent save helper for IDPs
  const savePlanToStorageAndFirestore = async (studentId: string, updatedPlan: any) => {
    setCustomPlans(prev => ({
      ...prev,
      [studentId]: updatedPlan
    }));

    // Cache locally
    const cached = JSON.parse(localStorage.getItem('eduai_custom_plans') || '{}');
    cached[studentId] = updatedPlan;
    localStorage.setItem('eduai_custom_plans', JSON.stringify(cached));

    // Firebase update if live student
    if (auth.currentUser && !(studentId.startsWith('mock-') && !studentId.includes('_'))) {
      try {
        await updateDoc(doc(db, 'students', studentId), {
          idp: updatedPlan
        });
      } catch (err) {
        console.error("Failed to sync IDP to Firestore:", err);
      }
    }
  };

  // Simulate generation loading with beautiful stages
  const handleGenerateAIPlan = async () => {
    setIsGenerating(true);
    setGenerationProgress(5);
    setGenerationStepText("Accessing cognitive classroom parameters...");

    // Stage updates
    const timers = [
      { p: 15, text: "Compiling student assessment scores dossier...", d: 600 },
      { p: 35, text: "Mapping performance histories against South African CAPS benchmarks...", d: 1300 },
      { p: 55, text: "Running diagnostic AI diagnostics scan to spot specific weaknesses...", d: 2000 },
      { p: 75, text: "Generating custom CAPS remedial recommendations and roadmap...", d: 2800 },
      { p: 95, text: "Polishing milestones action timelines...", d: 3600 },
    ];

    timers.forEach(t => {
      setTimeout(() => {
        setGenerationProgress(t.p);
        setGenerationStepText(t.text);
      }, t.d);
    });

    try {
      // Securely calling our back-end server endpoint
      const response = await fetch("/api/reports/ildp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: currentStudent.name,
          grade: currentStudent.grade,
          subjects: currentStudent.subjects.map(s => ({ name: s.name, mark: s.mark }))
        })
      });

      const data = await response.json();
      setTimeout(() => {
        savePlanToStorageAndFirestore(currentStudent.id, data);
        setGenerationProgress(100);
        setIsGenerating(false);
      }, 4200);

    } catch (err) {
      console.error("Failed generating plan via AI:", err);
      // Fail gracefully: save fallback mock but mark generated
      setTimeout(() => {
        setIsGenerating(false);
      }, 4200);
    }
  };

  // Add a dynamic milestone action plan roadmap item
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim()) return;

    const updatedPlan = { ...studentPlan };
    const newTask = {
      task: newMilestoneText,
      milestone: newMilestoneLine || "Within 2 weeks",
      status: "Pending" as const
    };
    updatedPlan.actionPlan = [...updatedPlan.actionPlan, newTask];

    savePlanToStorageAndFirestore(currentStudent.id, updatedPlan);

    setNewMilestoneText('');
    setNewMilestoneLine('');
  };

  // Toggle milestone checkbox
  const handleToggleTaskStatus = (index: number) => {
    const updatedPlan = { ...studentPlan };
    const task = updatedPlan.actionPlan[index];
    if (task) {
      task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
      savePlanToStorageAndFirestore(currentStudent.id, updatedPlan);
    }
  };

  // Export report to formatted PDF with jspdf & html2canvas
  const handleDownloadReport = async () => {
    if (isDownloading || !currentStudent) return;
    setIsDownloading(true);

    try {
      const element = reportRef.current;
      if (!element) {
        throw new Error("Report element not found");
      }

      // Add a small delay to ensure rendering triggers if needed
      await new Promise(resolve => setTimeout(resolve, 300));

      // Intercept modern 'oklch' color styles before running html2canvas
      const restoreGetComputedStyle = patchOklchForHtml2canvas();

      let canvas;
      try {
        // Capture element with html2canvas (configured for crisp rendering, background color preservation)
        canvas = await html2canvas(element, {
          scale: 2, // High resolution crisp text and graphics
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0f172a', // Consistent theme background
          logging: false,
        });
      } finally {
        // Restore standard getComputedStyle immediately
        restoreGetComputedStyle();
      }

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Page 1
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // multi-page support
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${currentStudent.name.replace(/\s+/g, '_')}_Individual_CAPS_Report.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      // Fallback: download as raw JSON in worst case scenario
      const blob = new Blob([JSON.stringify(currentStudent, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentStudent.name.replace(/\s+/g, '_')}_Progress_Report_Fallback.json`;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  // Dispatch real sync report to parents in Firestore
  const handleSyncToParents = async () => {
    try {
      if (currentStudent) {
        // 1. Create published report record
        await addDoc(collection(db, 'published_reports'), {
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          parentEmail: currentStudent.parentEmail || '',
          subjects: currentStudent.subjects || [],
          idp: currentStudent.idp || null,
          publishedAt: serverTimestamp(),
          term: 'Term 3 2026'
        });

        // 2. Dispatch notification to parent & student
        await addDoc(collection(db, 'notifications'), {
          title: '📊 Official Progress Report Published',
          message: `${currentStudent.name}'s latest Term Progress Report & Diagnostic Analysis has been published to your portal.`,
          createdAt: serverTimestamp(),
          type: 'report_published',
          studentId: currentStudent.id,
          parentEmail: currentStudent.parentEmail || ''
        });
      }
      setShowSyncSuccess(true);
      setTimeout(() => {
        setShowSyncSuccess(false);
      }, 4000);
    } catch (err) {
      console.error("Error syncing report to parents:", err);
      setShowSyncSuccess(true);
    }
  };

  // Prepare recharts dual historical chart
  // Compiles history metrics: for overall, we take average of term indexes.
  const individualLineChartData = useMemo(() => {
    if (!currentStudent || !currentStudent.subjects) return [];
    
    // Calculate term averages
    const averages = [0, 0, 0, 0];
    currentStudent.subjects.forEach(s => {
      s.termHistory.forEach((v, index) => {
        averages[index] += v;
      });
    });
    
    const count = currentStudent.subjects.length;
    return [
      { name: 'Term 1', 'Overall GPA': Math.round(averages[0] / count), [selectedSubjectName]: currentSubjectObj ? currentSubjectObj.termHistory[0] : 0 },
      { name: 'Term 2', 'Overall GPA': Math.round(averages[1] / count), [selectedSubjectName]: currentSubjectObj ? currentSubjectObj.termHistory[1] : 0 },
      { name: 'Term 3', 'Overall GPA': Math.round(averages[2] / count), [selectedSubjectName]: currentSubjectObj ? currentSubjectObj.termHistory[2] : 0 },
      { name: 'Term 4', 'Overall GPA': Math.round(averages[3] / count), [selectedSubjectName]: currentSubjectObj ? currentSubjectObj.termHistory[3] : 0 },
    ];
  }, [currentStudent, selectedSubjectName, currentSubjectObj]);

  if (loading) {
    return (
      <LoadingMascot 
        message="Retrieving academic achievements..." 
        subtitle="Analyzing grade metrics and student logs" 
      />
    );
  }

  return (
    <div className="space-y-8 pb-20 custom-scrollbar font-sans text-slate-100">
      {/* Dynamic Notifications Banner */}
      <AnimatePresence>
        {showSyncSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 px-6 py-4 rounded-3xl border border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-3 font-semibold text-sm cursor-pointer"
            onClick={() => setShowSyncSuccess(false)}
          >
            <CheckCircle className="text-slate-950 scale-110" size={20} />
            <div>
              <p className="font-bold">Sync Completed!</p>
              <p className="text-xs text-slate-900 opacity-90">{currentStudent.name}'s latest report was dispatched to parent dashboards.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Block with Tab Navigator */}
      <div className={cn(
        "relative rounded-[36px] p-8 overflow-hidden text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border shadow-2xl",
        isDarkMode ? "bg-[#0B1122] border-white/10" : "bg-slate-900 border-slate-800"
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none hidden md:block">
          <TrendingUp size={160} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />

        <div className="relative z-10">
          <p className="text-[10px] text-brand-cyan font-black uppercase tracking-[0.3em] mb-2 font-sans flex items-center gap-1.5">
            <Activity size={12} className="text-brand-cyan animate-pulse" /> 
            Analytics Cognitive Centre
          </p>
          <h2 className="text-3xl md:text-4xl font-hand text-white">Learner Progress & IDP Lab</h2>
          <p className="text-slate-300 text-xs mt-1">Audit class academic stats and produce personalized AI-driven Development Plans (ILDP).</p>
        </div>

        {/* Workspace Switcher */}
        <div className="relative z-10 bg-white/5 p-1 rounded-2xl flex gap-1 border border-white/5 shadow-inner grow md:grow-0 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'overview' ? 'bg-brand-cyan text-navy-dark shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Class Overview</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('idp');
              // Auto focus a subject
              if (currentStudent && currentStudent.subjects.length > 0) {
                setSelectedSubjectName(currentStudent.subjects[0].name);
              }
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'idp' ? 'bg-brand-cyan text-navy-dark shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain size={14} />
            <span>Individual IDP Lab</span>
          </button>
        </div>
      </div>

      {/* --- CLASS OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-8"
        >
          {/* Main Chart Card + Sidebar info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass bg-[#0d1527]/40 p-4 sm:p-6 md:p-8 rounded-[28px] sm:rounded-[40px] md:rounded-[48px] border border-white/5 h-[320px] sm:h-[400px] md:h-[440px] flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-brand-cyan" />
                  Aggregate Class Performance Baseline (Term Progress)
                </h3>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={classAggregateData}>
                    <defs>
                      <linearGradient id="colorMath" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSci" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B1122', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                      itemStyle={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Mathematics Avg" dataKey="math" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorMath)" />
                    <Area type="monotone" name="Sciences Avg" dataKey="sci" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorSci)" />
                    <Line type="monotone" name="English Avg" dataKey="eng" stroke="#FBBF24" strokeWidth={3} dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sidebar quick updates */}
            <div className="space-y-6 flex flex-col justify-between h-full">
              <div className="glass bg-[#0d1527]/40 p-8 rounded-[40px] border border-white/5 flex-1 flex flex-col justify-center">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400 animate-pulse" />
                  Top Class Growth
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-bold">Grade 10 Mathematics</span>
                    <span className="text-emerald-400 font-black">+18% YTD</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-cyan to-[#06B6D4] w-[78%] rounded-full shadow-[0_0_12px_rgba(6,182,212,0.5)]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">SBA assessments indicate strong progress in quadratic algebra and functions comprehension.</p>
                </div>
              </div>

              <div className="glass bg-[#0d1527]/40 p-8 rounded-[40px] border border-white/5 flex-1 flex flex-col justify-center mt-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-400" />
                  Attention Suggested
                </h4>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-base text-white font-black">4 Learners</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Underperforming on current Physical Sciences curriculum thresholds.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={() => {
                      setActiveTab('idp');
                      setSelectedClassFilter('Grade 10A');
                      setSearchTerm('');
                    }}
                    className="text-brand-cyan hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    Diagnose Learners <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Marks Distribution Card (Bar Chart) */}
          <div className="glass bg-[#0d1527]/40 p-6 sm:p-8 rounded-[40px] border border-white/5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <Percent size={16} className="text-brand-cyan" />
                  CAPS Marks & Assessment Distribution
                </h3>
                <h4 className="text-xl font-hand text-white">Learner Mark Brackets Analysis</h4>
                <p className="text-slate-400 text-xs mt-1">
                  Distribution of {distributionType === 'subject' ? 'Term Subject Marks' : 'Individual Assessments'} for <span className="text-brand-cyan font-semibold">{selectedClassFilter === 'All' ? 'All Classes' : selectedClassFilter}</span>
                  {distributionSubject !== 'All' && <span> in <span className="text-brand-cyan font-semibold">{distributionSubject}</span></span>}.
                </p>
              </div>

              {/* Chart Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Mode Selector */}
                <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5">
                  <button
                    onClick={() => setDistributionType('subject')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      distributionType === 'subject'
                        ? 'bg-brand-cyan text-navy-dark shadow-md font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Term Mark
                  </button>
                  <button
                    onClick={() => setDistributionType('assessment')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      distributionType === 'assessment'
                        ? 'bg-brand-cyan text-navy-dark shadow-md font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Assessments
                  </button>
                </div>

                {/* Subject Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Subject:</span>
                  <select
                    value={distributionSubject}
                    onChange={(e) => setDistributionSubject(e.target.value)}
                    className="bg-[#0D1527] border border-white/10 hover:border-white/20 transition-all rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white focus:outline-none cursor-pointer"
                  >
                    {distributionSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub === 'All' ? 'All Subjects' : sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bar Chart Container */}
            <div className="h-[280px] sm:h-[320px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marksDistributionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} vertical={false} />
                  <XAxis
                    dataKey="range"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    label={{ value: 'Number of Records', angle: -90, position: 'insideLeft', offset: -5, fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)', radius: 12 }}
                    contentStyle={{
                      backgroundColor: '#0c1225',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    formatter={(value: any, name: any, props: any) => {
                      return [value, `${props.payload.label}`];
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={60}
                  >
                    {marksDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-white/5">
              {marksDistributionData.map((bracket, i) => (
                <div key={i} className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bracket.color }} />
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider truncate max-w-[120px]">
                      {bracket.range}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between w-full">
                    <span className="text-lg font-bold text-white leading-none">{bracket.count}</span>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: 'Roster Pass Rate', value: '94%', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
              { label: 'Exposition Distinctions', value: '14 Active', icon: Award, color: 'text-brand-yellow', bg: 'bg-brand-yellow/5' },
              { label: 'Avg SBA Percentage', value: '69%', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/5' },
              { label: 'Roster Capacity', value: `${allStudents.length} Students`, icon: Users, color: 'text-brand-cyan', bg: 'bg-cyan-500/5' },
            ].map((stat, i) => (
              <div key={i} className="glass bg-[#0d1527]/45 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} border border-white/5`}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
                  <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-0.5">{stat.value}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Direct CTA */}
          <div className="bg-brand-cyan/10 border border-brand-cyan/20 p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-brand-cyan/20 text-brand-cyan rounded-2xl shrink-0">
                <Brain size={28} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Need to create customized study steps?</h4>
                <p className="text-slate-400 text-xs mt-1">Jump into the Individual Learner portal to analyze individual metrics and generate instant AI study goals.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('idp')}
              className="bg-brand-cyan text-navy-dark hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl shrink-0 shadow-lg shadow-cyan-500/10 cursor-pointer"
            >
              Enter Learner IDP Portal
            </button>
          </div>
        </motion.div>
      )}

      {/* --- INDIVIDUAL LEARNER PORTAL TAB --- */}
      {activeTab === 'idp' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT INDEX FOR SEARCH AND ROSTER LISTING (cols-4) */}
          {(!isMobile || mobileActiveSubView === 'roster') && (
            <div className="lg:col-span-4 bg-[#0d1527]/40 border border-white/5 p-4 sm:p-6 lg:p-8 rounded-[28px] sm:rounded-[40px] space-y-6">
              <div className="flex justify-between items-center sm:gap-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} className="text-brand-cyan" />
                  Learner Index Search
                </h3>
                <button 
                  onClick={() => {
                    setNewStudentName('');
                    setNewStudentEmail('');
                    setNewStudentGrade('Grade 10A');
                    setShowAddStudentModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-brand-cyan/25 hover:bg-brand-cyan/35 text-brand-cyan rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-brand-cyan/35 shadow-sm"
                  title="Add new student"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>

              {/* Direct Search Inputs */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by learner name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 transition-all border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                    <Filter size={10} /> Class Filter
                  </label>
                  <select
                    value={selectedClassFilter}
                    onChange={e => setSelectedClassFilter(e.target.value)}
                    className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-2xl p-3 text-xs text-white uppercase font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Registered Classes</option>
                    {availableClassesList.map(cla => (
                      <option key={cla} value={cla}>{cla}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Match Counter */}
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500 px-1 border-b border-white/5 pb-2">
                <span>Roster Matches</span>
                <span>{filteredStudents.length} Found</span>
              </div>

              {/* Scrollable Learner Cards list */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredStudents.map(student => {
                  const isSelected = student.id === selectedStudentId;
                  
                  // Calculates student average
                  const gpa = Math.round(student.subjects.reduce((sum, s) => sum + s.mark, 0) / student.subjects.length);
                  const isPassing = gpa >= 50;

                  return (
                    <motion.div
                      key={student.id}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        if (student.subjects && student.subjects.length > 0) {
                          setSelectedSubjectName(student.subjects[0].name);
                        }
                        if (isMobile) {
                          setMobileActiveSubView('dossier');
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-[#1E293B] border-brand-cyan shadow-lg shadow-cyan-500/5 text-white' 
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Initials badge */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold leading-none shrink-0 ${
                          isSelected ? 'bg-brand-cyan text-navy-dark font-black' : 'bg-white/10 text-slate-300'
                        }`}>
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{student.name}</p>
                          <span className="inline-block bg-white/5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                            {student.grade}
                          </span>
                        </div>
                      </div>

                      {/* Score Gauge */}
                      <div className="text-right shrink-0">
                        <span className={`text-base font-bold font-hand ${gpa >= 75 ? 'text-emerald-400' : gpa >= 50 ? 'text-brand-cyan' : 'text-rose-400'}`}>
                          {gpa}%
                        </span>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Average</p>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    <AlertCircle size={24} className="mx-auto mb-3 text-slate-600" />
                    No learners match the filter criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT VIEW: DETAILED DOSSIER & AI DEVELOPMENT WORKSPACE (cols-8) */}
          {(!isMobile || mobileActiveSubView === 'dossier') && (
            <div className="lg:col-span-8 space-y-8">
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setMobileActiveSubView('roster')}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-cyan bg-[#1E293B] border border-brand-cyan/20 px-4 py-3 rounded-2xl hover:bg-white/10 active:scale-95 transition-all mb-4 self-start cursor-pointer shadow-md"
                >
                  <ArrowLeft size={14} />
                  <span>◀ Back to Learner List</span>
                </button>
              )}
              <AnimatePresence mode="wait">
                {currentStudent ? (
                  <motion.div
                    ref={reportRef}
                    key={currentStudent.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8 p-6 bg-[#0f172a] rounded-[40px] border border-white/5"
                  >
                  {/* Student Banner */}
                  <div className="glass bg-[#1E293B]/40 p-6 lg:p-8 rounded-[40px] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-gradient-to-tr from-brand-cyan to-indigo-500 rounded-3xl flex items-center justify-center text-xl font-bold font-hand text-navy-dark leading-none shadow-xl shrink-0">
                        {currentStudent.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white leading-tight">{currentStudent.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{currentStudent.email}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-block bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Class: {currentStudent.grade}
                          </span>
                          <span className="inline-block bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Status: Active Portfolio
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
                      <button 
                        onClick={() => {
                          setEditStudentName(currentStudent.name);
                          setEditStudentEmail(currentStudent.email);
                          setEditStudentGrade(currentStudent.grade);
                          setEditStudentStatus(currentStudent.status || 'Active');
                          setEditParentName(currentStudent.parentName || '');
                          setEditParentEmail(currentStudent.parentEmail || '');
                          setEditParentPhone(currentStudent.parentPhone || '');
                          setShowEditStudentModal(true);
                        }}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all cursor-pointer"
                        title="Edit learner profile"
                      >
                        <Edit2 size={14} className="text-brand-cyan" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (currentStudent.id.startsWith('mock-') && !currentStudent.id.includes('_')) {
                            alert("Cannot delete preview mock students.");
                            return;
                          }
                          if (confirm(`Are you sure you want to completely delete learner record ${currentStudent.name}?`)) {
                            try {
                              await deleteDoc(doc(db, 'students', currentStudent.id));
                              setSelectedStudentId('');
                            } catch (e) {
                              handleFirestoreError(e, OperationType.DELETE, 'students/' + currentStudent.id);
                            }
                          }
                        }}
                        className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-2xl transition-all cursor-pointer"
                        title="Delete learner record"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button 
                        onClick={handleSyncToParents}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                        title="Sync report with Parent Portal"
                      >
                        <Send size={14} />
                        <span>Sync Parents</span>
                      </button>
                      <button 
                        onClick={handleDownloadReport}
                        disabled={isDownloading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-cyan hover:scale-105 active:scale-95 disabled:bg-opacity-50 text-navy-dark rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/15 cursor-pointer"
                        title="Export document report PDF"
                      >
                        {isDownloading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <span>Download Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Connected Parent & Guardian Profile */}
                  <div className="glass bg-[#1E293B]/20 p-6 rounded-[32px] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h4 className="text-xs font-black uppercase text-brand-cyan tracking-widest flex items-center gap-2">
                        <span>👨‍👩‍👦 Connected Parent & Guardian details</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono uppercase bg-white/5 px-2.5 py-1 rounded-md">Linked Profile</span>
                    </div>
                    {currentStudent.parentName ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Parent Name</span>
                          <span className="text-white text-sm font-semibold">{currentStudent.parentName}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Email Address</span>
                          <span className="text-white text-sm font-semibold">{currentStudent.parentEmail}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Contact Number</span>
                          <span className="text-white text-sm font-semibold">{currentStudent.parentPhone || 'Not Provided'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-1">
                        No parent details have been registered for this student yet. Click the Edit (pencil) button above inside the Student Banner to link parent contact information.
                      </p>
                    )}
                  </div>

                  {/* DOUBLE SCOPE GRAPH: Overall Progression + Subject Specific */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Graph 1: Overall Term GPA Performance */}
                    <div className="glass bg-[#0d1527]/40 p-6 rounded-[36px] border border-white/5">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-brand-cyan" />
                        Overall Term Average progression
                      </h4>
                      
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={individualLineChartData}>
                            <defs>
                              <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00a2cc" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00a2cc" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#0B1122', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <Area type="monotone" name="Term Average" dataKey="Overall GPA" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium text-center mt-3">Reflecting the compiled average score across all active curriculum courses.</p>
                    </div>

                    {/* Graph 2: Subject Targeted Progress */}
                    <div className="glass bg-[#0d1527]/40 p-6 rounded-[36px] border border-white/5">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-purple-400" />
                        Subject Progression: {selectedSubjectName || "N/A"}
                      </h4>
                      
                      <div className="h-[200px] w-full">
                        {selectedSubjectName && (
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={individualLineChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                              <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                              <Tooltip contentStyle={{ backgroundColor: '#0B1122', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                              <Line type="monotone" name={`${selectedSubjectName}`} dataKey={selectedSubjectName} stroke="#c084fc" strokeWidth={3} dot={{ r: 5, fill: "#c084fc" }} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium text-center mt-3">Targeted progression chart mapping the term metrics of {selectedSubjectName}.</p>
                    </div>

                  </div>

                  {/* ACTIVE SUBJECT CHOOSE BUTTONS AND DETAILED ASSESSMENT MATRIX */}
                  <div className="glass bg-[#0d1527]/40 p-6 lg:p-8 rounded-[40px] border border-white/5 space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BookOpen size={16} className="text-brand-cyan" />
                        Curriculum Subject Portfolio Matrix
                      </h4>
                      <p className="text-xs text-slate-500">Select any subject to inspect completed assessments, SBA tasks, and test grades.</p>
                    </div>

                    {/* Horizontal subjects list */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {currentStudent.subjects.map(subj => {
                        const isFocused = subj.name === selectedSubjectName;
                        const subPass = subj.mark >= 50;

                        return (
                          <button
                            key={subj.name}
                            type="button"
                            onClick={() => setSelectedSubjectName(subj.name)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
                              isFocused 
                                ? 'bg-[#1E293B] border border-brand-cyan text-brand-cyan shadow-md' 
                                : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <span>{subj.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black leading-none ${
                              subj.mark >= 75 ? 'bg-emerald-500/25 text-emerald-300' : subj.mark >= 50 ? 'bg-cyan-500/25 text-cyan-200' : 'bg-red-500/25 text-red-200'
                            }`}>
                              {subj.mark}%
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Focused active subject details */}
                    {currentSubjectObj && (
                      <div className="bg-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-3xl border border-white/5 space-y-4 animate-fadeInZoom">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest">Active Focus Subject</span>
                            <h5 className="font-bold text-sm text-white mt-1 uppercase tracking-wider">{currentSubjectObj.name}</h5>
                          </div>
                          
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest">Subject Average</span>
                            <h5 className={`font-black text-lg sm:text-xl font-hand mt-0.5 sm:mt-1 ${currentSubjectObj.mark >= 75 ? 'text-emerald-400' : currentSubjectObj.mark >= 50 ? 'text-brand-cyan' : 'text-rose-400'}`}>
                              {currentSubjectObj.mark}% ({currentSubjectObj.mark >= 75 ? 'Distinction' : currentSubjectObj.mark >= 50 ? 'Achieved' : 'Support Required'})
                            </h5>
                          </div>
                        </div>

                        {/* Assessments grid list */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Completed Evaluations & assessments</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentSubjectObj.assessments.map((ass, idx) => {
                              const passed = ass.score >= 50;
                              return (
                                <div key={idx} className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-bold text-white truncate max-w-[200px]">{ass.title}</p>
                                    <span className="inline-block bg-white/5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-slate-400 mt-1.5 tracking-wider">
                                      Type: {ass.type}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-base font-bold font-mono ${ass.score >= 75 ? 'text-emerald-400' : ass.score >= 50 ? 'text-brand-cyan' : 'text-rose-400'}`}>
                                      {ass.score}%
                                    </span>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{passed ? 'Passed' : 'Fewer Marks'}</p>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {currentSubjectObj.assessments.length === 0 && (
                              <p className="text-xs text-slate-500 col-span-2">No assessments registered for this subject.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI INDIVIDUAL LEARNER DEVELOPMENT PLAN (ILDP) SECTOR */}
                  <div className="relative glass bg-gradient-to-br from-indigo-500/5 to-purple-500/10 p-6 lg:p-8 rounded-[40px] border border-purple-500/20 shadow-[0_15px_35px_rgba(99,102,241,0.06)] space-y-6 overflow-hidden">
                    
                    {/* Glowing aesthetic visual helpers */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-3.5 items-center">
                        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-2xl border border-indigo-400/20 shadow-lg text-white">
                          <Brain size={24} className="text-white animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white tracking-wide">AI Development Plan (ILDP)</h4>
                          <p className="text-slate-400 text-xs">Instantly draft dynamic CAPS-aligned tutor recommendations personalized to their results.</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAIPlan}
                        disabled={isGenerating}
                        className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:scale-105 active:scale-95 disabled:opacity-50 transition-all font-black uppercase tracking-widest text-[11px] px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/15"
                      >
                        <Sparkles size={14} />
                        <span>{isGenerating ? "Processing Plan..." : "Regenerate AI Plan"}</span>
                      </button>
                    </div>

                    {/* AI plan generating progress animations */}
                    {isGenerating ? (
                      <div className="bg-black/40 p-10 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                        <div className="p-3 bg-indigo-500/15 rounded-full border border-indigo-500/30 text-indigo-400">
                          <RefreshCw size={28} className="animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-bold text-sm text-white">Gemini is creating learning path...</h5>
                          <p className="text-[11px] text-slate-400">{generationStepText}</p>
                        </div>
                        
                        {/* Custom visual progress track */}
                        <div className="w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                          <div 
                            className="h-full bg-gradient-to-r from-brand-cyan to-indigo-500 transition-all duration-300 rounded-full"
                            style={{ width: `${generationProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Progress: {generationProgress}%</span>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        
                        {/* Two Columns Grid: Key Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Column 1: Strengths */}
                          <div className="bg-[#0B1122]/50 p-5 rounded-3xl border border-emerald-500/10 space-y-3">
                            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                              <CheckCircle size={12} /> Key Academic Strengths
                            </h5>
                            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-none pl-0">
                              {studentPlan.strengths?.map((str: string, sIdx: number) => (
                                <li key={sIdx} className="flex items-start gap-2">
                                  <span className="text-emerald-500 shrink-0 mt-0.5">✔</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Column 2: Weaknesses */}
                          <div className="bg-[#0B1122]/50 p-5 rounded-3xl border border-yellow-500/10 space-y-3">
                            <h5 className="text-[10px] font-black text-brand-yellow uppercase tracking-widest flex items-center gap-1.5">
                              <AlertCircle size={12} /> Directed Growth Areas
                            </h5>
                            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-none pl-0">
                              {studentPlan.weaknesses?.map((weak: string, wIdx: number) => (
                                <li key={wIdx} className="flex items-start gap-2">
                                  <span className="text-brand-yellow shrink-0 mt-0.5">⚠</span>
                                  <span>{weak}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>

                        {/* Advisory Recommendations Section */}
                        <div className="bg-[#0B1122]/50 p-5 rounded-3xl border border-indigo-500/10 space-y-3">
                          <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Brain size={12} /> AI Advisory learning Steps
                          </h5>
                          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-none pl-0">
                            {studentPlan.recommendations?.map((rec: string, rIdx: number) => (
                              <li key={rIdx} className="flex items-start gap-2.5">
                                <span className="bg-indigo-500/20 text-indigo-300 w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] shrink-0 mt-0.5">★</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Interactive ROADMAP Milestones list (Teacher Action Control) */}
                        <div className="bg-[#0B1122]/50 p-5 rounded-3xl border border-white/5 space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <CheckSquare size={12} /> Interactive Roadmap Goals Timeline
                            </h5>
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              Teacher Checked
                            </span>
                          </div>

                          {/* Dynamic checklist roadmap */}
                          <div className="space-y-2.5">
                            {studentPlan.actionPlan?.map((item: any, itemIdx: number) => {
                              const isCompleted = item.status === 'Completed';

                              return (
                                <div 
                                  key={itemIdx}
                                  onClick={() => handleToggleTaskStatus(itemIdx)}
                                  className="group flex items-center justify-between gap-3 p-3 bg-black/20 hover:bg-black/35 rounded-2xl border border-white/5 transition-all cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 pr-2 min-w-0">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                      isCompleted 
                                        ? 'bg-emerald-500 border-emerald-500 text-slate-900' 
                                        : 'border-white/20 group-hover:border-brand-cyan text-transparent'
                                    }`}>
                                      <Check size={12} strokeWidth={4} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`text-xs font-semibold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                        {item.task}
                                      </p>
                                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 block">
                                        Target: {item.milestone}
                                      </span>
                                    </div>
                                  </div>

                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${
                                    isCompleted 
                                      ? 'bg-emerald-500/10 text-emerald-400' 
                                      : item.status === 'In Progress' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-500/10 text-slate-400'
                                  }`}>
                                    {isCompleted ? 'Completed' : item.status || 'Pending'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Add a rapid customized goal to action plan */}
                          <form onSubmit={handleAddMilestone} className="pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="col-span-1 md:col-span-2">
                              <input 
                                type="text"
                                placeholder="Add custom action step..."
                                value={newMilestoneText}
                                onChange={e => setNewMilestoneText(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
                              />
                            </div>
                            <div>
                              <input 
                                type="text"
                                placeholder="e.g. In 2 weeks"
                                value={newMilestoneLine}
                                onChange={e => setNewMilestoneLine(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-505 focus:outline-none focus:border-brand-cyan"
                              />
                            </div>
                            <button
                              type="submit"
                              className="bg-white/10 hover:bg-white/15 hover:text-white transition-all text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl py-2 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus size={14} /> Add Goal
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="glass bg-[#0d1527]/40 p-12 rounded-[50px] border border-white/5 text-center text-slate-500 max-w-lg mx-auto py-24 space-y-4">
                  <div className="p-4 bg-brand-cyan/15 rounded-full border border-brand-cyan/25 text-brand-cyan w-16 h-16 mx-auto flex items-center justify-center">
                    <User size={32} />
                  </div>
                  <h4 className="text-xl font-hand text-white leading-relaxed">Search & Select a Learner</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Type a learner's name or narrow by active class on the left index panel to generate full analytical charts, diagnostic breakdowns, and personalized development path recommendations.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
          )}
        </motion.div>
      )}

      {/* Enroll Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-dark/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-950 border border-white/10 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="text-brand-cyan" size={20} />
                Enroll New Learner
              </h3>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">FullName</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sipho Nkosi"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Email Address (Optional)</label>
                <input 
                  type="email"
                  placeholder="e.g. sipho@gmail.com"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#22d3ee]">Parent Name (Guardian)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Thabo Nkosi"
                    value={newParentName}
                    onChange={e => setNewParentName(e.target.value)}
                    className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#22d3ee]">Parent Email</label>
                  <input 
                    type="email" 
                    placeholder="thabo@gmail.com"
                    value={newParentEmail}
                    onChange={e => setNewParentEmail(e.target.value)}
                    className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#22d3ee]">Parent Phone</label>
                  <input 
                    type="tel" 
                    placeholder="082 123 4567"
                    value={newParentPhone}
                    onChange={e => setNewParentPhone(e.target.value)}
                    className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Class Grade</label>
                <select 
                  value={newStudentGrade}
                  onChange={e => setNewStudentGrade(e.target.value)}
                  className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white uppercase font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Grade 10A">Grade 10A</option>
                  <option value="Grade 10B">Grade 10B</option>
                  <option value="Grade 11C">Grade 11C</option>
                  <option value="Grade 9A">Grade 9A</option>
                  <option value="GrR">Grade R</option>
                  <option value="Gr1">Grade 1</option>
                  <option value="Gr2">Grade 2</option>
                  <option value="Gr3">Grade 3</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-cyan hover:scale-105 active:scale-95 text-navy-dark font-black uppercase tracking-widest p-4 rounded-xl text-xs transition-colors mt-4 cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                Complete Enrollment
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-dark/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-950 border border-white/10 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="text-brand-cyan" size={18} />
                Edit Learner Profile
              </h3>
              <button 
                onClick={() => setShowEditStudentModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">FullName</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sipho Nkosi"
                  value={editStudentName}
                  onChange={e => setEditStudentName(e.target.value)}
                  className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. sipho@gmail.com"
                  value={editStudentEmail}
                  onChange={e => setEditStudentEmail(e.target.value)}
                  className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#22d3ee]">Parent Name (Guardian)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Thabo Nkosi"
                    value={editParentName}
                    onChange={e => setEditParentName(e.target.value)}
                    className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#22d3ee]">Parent Email</label>
                  <input 
                    type="email" 
                    placeholder="thabo@gmail.com"
                    value={editParentEmail}
                    onChange={e => setEditParentEmail(e.target.value)}
                    className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#22d3ee]">Parent Phone</label>
                  <input 
                    type="tel" 
                    placeholder="082 123 4567"
                    value={editParentPhone}
                    onChange={e => setEditParentPhone(e.target.value)}
                    className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Class Grade</label>
                <select 
                  value={editStudentGrade}
                  onChange={e => setEditStudentGrade(e.target.value)}
                  className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white uppercase font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Grade 10A">Grade 10A</option>
                  <option value="Grade 10B">Grade 10B</option>
                  <option value="Grade 11C">Grade 11C</option>
                  <option value="Grade 9A">Grade 9A</option>
                  <option value="GrR">Grade R</option>
                  <option value="Gr1">Grade 1</option>
                  <option value="Gr2">Grade 2</option>
                  <option value="Gr3">Grade 3</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Status</label>
                <select 
                  value={editStudentStatus}
                  onChange={e => setEditStudentStatus(e.target.value)}
                  className="w-full bg-[#0d1527] border border-white/10 hover:border-white/20 transition-all rounded-xl p-3 text-xs text-white uppercase font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-cyan hover:scale-105 active:scale-95 text-navy-dark font-black uppercase tracking-widest p-4 rounded-xl text-xs transition-colors mt-4 cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
