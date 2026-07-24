import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Scan, X, RefreshCw, Loader2, FileCheck, Brain, CheckCircle, AlertCircle, ChevronRight, GraduationCap, Download, Printer, UserCircle, Users, Save, Check, FileText, ClipboardList, Bookmark, Plus, Trash, Zap, Sparkles, Search, FileSpreadsheet, Layers, Eye, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { runOCRAndGrade, runOCRScan } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, where, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

import { printContent, downloadAsHTML, downloadAsPDF } from '../lib/printUtils';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const parseScoreToPercentage = (scoreStr: string) => {
  if (!scoreStr) return 0;
  const matchSlash = scoreStr.match(/(\d+)\s*\/\s*(\d+)/);
  if (matchSlash) {
    const num = parseFloat(matchSlash[1]);
    const den = parseFloat(matchSlash[2]);
    return den > 0 ? (num / den) * 100 : 0;
  }
  const matchPct = scoreStr.match(/(\d+)\s*%/);
  if (matchPct) {
    return parseFloat(matchPct[1]);
  }
  const numOnly = parseFloat(scoreStr);
  if (!isNaN(numOnly)) return numOnly;
  return 0;
};

const LANGUAGES = [
  { value: 'English',   label: 'English' },
  { value: 'Spanish',   label: 'Spanish' },
  { value: 'French',    label: 'French' },
  { value: 'German',    label: 'German' },
  { value: 'isiZulu',   label: 'isiZulu' },
  { value: 'isiXhosa',  label: 'isiXhosa' },
  { value: 'Afrikaans', label: 'Afrikaans' },
];

export default function AutoGrading() {
  const { provider, ocrProvider } = useAi();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [extractResult, setExtractResult] = useState<{ extractedText: string } | null>(null);
  const [rubric, setRubric] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<'grade' | 'extract'>('grade');
  const [ocrLanguage, setOcrLanguage] = useState('English');
  const [isHandwritten, setIsHandwritten] = useState(true);

  // Unified Teacher's Auto-Grading Lab Navigation
  const [labActiveTab, setLabActiveTab] = useState<'grade' | 'notifications' | 'history'>('grade');

  // AI-Generation options and notification pop-ups
  const [autoGenerateRubric, setAutoGenerateRubric] = useState(true);
  const [transientWarning, setTransientWarning] = useState<string | null>(null);

  // Bulk content uploading
  const [gradingScope, setGradingScope] = useState<'single' | 'bulk'>('single');
  const [bulkStatus, setBulkStatus] = useState<{[key: string]: { status: 'Draft' | 'Processing' | 'Graded' | 'Error', score?: string, feedback?: string, studentId?: string, extractedText?: string, studentName?: string, fileName?: string }}>({});

  // Toast / Status helpers
  const [localToast, setLocalToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'error' }>({ show: false, message: '', type: 'info' });
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setLocalToast({ show: true, message, type });
    setTimeout(() => {
      setLocalToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // Firestore integration states
  const [dbAssignments, setDbAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('unassigned');

  // Database lists
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [labReports, setLabReports] = useState<any[]>([]);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [selectedReportDetail, setSelectedReportDetail] = useState<any | null>(null);

  const handleReattributeReport = async (repId: string, stuId: string) => {
    try {
      const matchStu = dbStudents.find(s => s.id === stuId);
      if (!matchStu) return;
      
      const reportRef = doc(db, 'auto_grading_reports', repId);
      await updateDoc(reportRef, {
        studentId: stuId,
        studentName: matchStu.name
      });

      const targetReport = labReports.find(r => r.id === repId);
      if (targetReport) {
        await saveAcademicRecord(stuId, targetReport.assignmentTitle, targetReport.totalScore, targetReport.feedback);
      }
      triggerToast(`Successfully assigned paper to ${matchStu.name} and registered grades inside student portfolio!`, 'success');
    } catch (err) {
      console.warn("Could not reattribute report (handled):", err);
    }
  };

  const [createdContents, setCreatedContents] = useState<any[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; type: string; dataUrl: string }[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  // End of grading period Tuning Parameters
  const [behavioralAspects, setBehavioralAspects] = useState<string[]>([]);
  const [adjustLateSubmission, setAdjustLateSubmission] = useState(false);
  const [editableFeedback, setEditableFeedback] = useState('');

  // Comment Bank
  const [commentBank, setCommentBank] = useState<any[]>(() => {
    const cached = localStorage.getItem('gradebook_comment_bank');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [
      { id: '1', title: 'Outstanding Concept Mastery', text: 'Demonstrates exceptional critical thinking and deep conceptual understanding. Written responses are precise, fully detailed, and follow structured logical pathways.', rating: 'A' },
      { id: '2', title: 'Proficient with Minor Slips', text: 'Great overall effort. Minor computational or structural omissions detected. A careful final proofread of calculations is advised.', rating: 'B' },
      { id: '3', title: 'Partial Evidence / Steps Needed', text: 'Good starting response. However, to achieve full points, please document complete supporting steps and explicit calculations.', rating: 'C' },
      { id: '4', title: 'Support & Guidance Recommended', text: 'Some misunderstanding of core topics detected. Additional interactive practice sessions and closer review of foundational concepts are recommended.', rating: 'D/F' },
      { id: '5', title: 'Exceptional Work Effort', text: 'The student displayed great care, meticulous attention to detail, and neatly presented writing. Outstanding focus!', rating: 'Effort' }
    ];
  });
  const [commentSearch, setCommentSearch] = useState('');

  // Set editable feedback on result load or direct student select
  useEffect(() => {
    if (result) {
      setEditableFeedback(result.feedback || '');
    }
  }, [result]);

  // Load existing assignments + Seed CAPS test items if blank
  useEffect(() => {
    let active = true;
    let unsub: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (active) setDbAssignments([]);
        if (unsub) {
          unsub();
          unsub = null;
        }
        return;
      }
      
      const q = query(collection(db, 'assignments'));
      unsub = onSnapshot(q, (snapshot) => {
        if (!active) return;
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (list.length === 0) {
          // Pre-populate realistic practice assignments
          const seedAssignments = [
            {
              id: 'practice_math_1',
              title: 'Mathematics Term 2: Fractions & Percentages Test',
              subject: 'Mathematics',
              grade: 'Grade 7',
              rubric: `Question 1: Calculate 3/4 + 1/2. Answer must show LCD of 4 and be 5/4 or 1 1/4. [5 Marks]\nQuestion 2: Convert 0.85 to a percentage. Answer must be 85% with steps of multiplying by 100. [5 Marks]\nQuestion 3: Problem solving - A shirt costs R200 and has a 15% discount. What is the sales price? Answer must be R170 (R200 - R30). [10 Marks]`,
              memo: `Test Memorandum:\nQ1: LCD = 4 (1 mark), convert 1/2 to 2/4 (1 mark), 3/4 + 2/4 = 5/4 (2 marks), convert to 1 1/4 (1 mark). Total: 5.\nQ2: 0.85 * 100% (2 marks), 85% (3 marks). Total: 5.\nQ3: 15/100 * R200 = R30 discount (5 marks), R200 - R30 = R170 final price (5 marks). Total: 10.`
            },
            {
              id: 'practice_science_2',
              title: 'Natural Sciences Grade 8: Chemical Reactions SBA',
              subject: 'Natural Sciences',
              grade: 'Grade 8',
              rubric: `Question 1: State the Law of Conservation of Mass in your own words. Mass cannot be created or destroyed, atoms are rearranged. [5 Marks]\nQuestion 2: Balance the chemical equation: H2 + O2 -> H2O. Steps: 2H2 + O2 -> 2H2O. [5 Marks]\nQuestion 3: Explain the difference between reactants and products. Reactants are starting items on left, products are end items on right. [10 Marks]`,
              memo: `SBA Memo:\nQ1: Stating mass remains constant (3 marks), atoms rearrange (2 marks). Total: 5.\nQ2: Balanced equation 2H2 + O2 -> 2H2O (5 marks, deduct 1 point for incorrect coefficient). Total: 5.\nQ3: Reactants definition (5 marks), products definition (5 marks). Total: 10.`
            },
            {
              id: 'practice_english_3',
              title: 'English Grade 9: Narrative Essay Creative Writing',
              subject: 'English',
              grade: 'Grade 9',
              rubric: `Structure: Introduction, Body paragraphs, Conclusion. [5 Marks]\nContent & Plot: Original plot, clear climax, and creative settings. [10 Marks]\nGrammar & Spelling: Proper spelling, grammatical tenses, sentence structure. [10 Marks]`,
              memo: `Rubric Memorandum:\nStructure: Clear cohesive paragraphs (5 marks).\nContent: Strong plot and character development (5 marks), coherent setting (5 marks). Total: 10.\nLanguage: Accurate grammar (5 marks), stellar spelling and punctuation (5 marks). Total: 10.`
            }
          ];
          setDbAssignments(seedAssignments);
        } else {
          setDbAssignments(list);
        }
      }, (err) => {
        console.warn("Error loading assignments in AutoGrading (handled):", err);
      });
    });

    return () => {
      active = false;
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, []);

  // Sync enrolled students of this teacher
  useEffect(() => {
    let active = true;
    let unsub: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (active) setDbStudents([]);
        if (unsub) {
          unsub();
          unsub = null;
        }
        return;
      }
      
      const q = query(collection(db, 'students'), where('teacherId', '==', user.uid));
      unsub = onSnapshot(q, (snapshot) => {
        if (!active) return;
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbStudents(list);
      }, (err) => {
        console.warn("Error loading students in AutoGrading (handled):", err);
      });
    });

    return () => {
      active = false;
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, []);

  // Sync saved Historical Auto-Graded Content Reports
  useEffect(() => {
    let active = true;
    let unsub: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (active) setLabReports([]);
        if (unsub) {
          unsub();
          unsub = null;
        }
        return;
      }
      
      const q = query(collection(db, 'auto_grading_reports'), where('teacherId', '==', user.uid));
      unsub = onSnapshot(q, (snapshot) => {
        if (!active) return;
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLabReports(list);
      }, (err) => {
        console.warn("Error loading auto_grading_reports (handled):", err);
      });
    });

    return () => {
      active = false;
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, []);

  // Sync teacher's personal Created Content Vault (rubrics/memos generated in Content Studio)
  useEffect(() => {
    let active = true;
    let unsub: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (active) setCreatedContents([]);
        if (unsub) {
          unsub();
          unsub = null;
        }
        return;
      }
      
      const q = query(collection(db, 'created_content'), where('teacherId', '==', user.uid));
      unsub = onSnapshot(q, (snapshot) => {
        if (!active) return;
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCreatedContents(list);
      }, (err) => {
        console.warn("Error loading created_content in AutoGrading (handled):", err);
      });
    });

    return () => {
      active = false;
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, []);

  // Sync submissions
  useEffect(() => {
    let active = true;
    let unsub: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (active) setAllSubmissions([]);
        if (unsub) {
          unsub();
          unsub = null;
        }
        return;
      }
      
      const cachedRole = localStorage.getItem(`userRole_${user.uid}`) || 'teacher';
      
      let q;
      if (cachedRole === 'student') {
        q = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
      } else {
        q = query(collection(db, 'submissions'), where('teacherId', '==', user.uid));
      }
      
      unsub = onSnapshot(q, (snapshot) => {
        if (!active) return;
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSubmissions(list);
      }, (err) => {
        console.warn("Error loading submissions in AutoGrading (handled):", err);
      });
    });

    return () => {
      active = false;
      unsubscribeAuth();
      if (unsub) unsub();
    };
  }, []);

  // Filter submissions when selectedAssignmentId changes
  useEffect(() => {
    if (!selectedAssignmentId) {
      setFilteredSubmissions([]);
      return;
    }
    const filtered = allSubmissions.filter(s => s.assignmentId === selectedAssignmentId);
    setFilteredSubmissions(filtered);

    // Auto prepopulate rubric corresponding to selected assignment
    const chosen = dbAssignments.find(a => a.id === selectedAssignmentId);
    if (chosen) {
      setRubric(chosen.rubric || '');
    }
  }, [selectedAssignmentId, allSubmissions, dbAssignments]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream, videoRef.current]);

  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handlePrint = () => {
    printContent(contentRef, "EduAI-AutoGrading");
  };

  const handleDownloadPDF = async () => {
    await downloadAsPDF(contentRef, "EduAI-AutoGrading-Report.pdf");
  };

  const handleArchive = async () => {
    const data = mode === 'grade' ? result : extractResult;
    if (!data) return;

    // Save grades back to firebase submissions if matching student submission is active
    if (selectedSubmission && mode === 'grade') {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
          status: 'graded',
          grade: result.totalScore,
          feedback: editableFeedback,
          marksPerQuestion: result.marksPerQuestion,
          answersText: result.extractedText || ''
        });
      } catch (err) {
        console.warn("Could not save to remote submissions collection (handled):", err);
      }
    }

    const newItem = {
      id: Date.now().toString(),
      title: mode === 'grade' ? 'Grading Report' : 'Text Extraction',
      subject: 'Assessment',
      grade: 'N/A',
      contentType: mode === 'grade' ? 'Grading' : 'OCR Scan',
      isSystem: false,
      createdAt: new Date().toISOString(),
      content: mode === 'extract' ? `<p class="font-mono whitespace-pre-wrap">${data.extractedText}</p>` : `
        <h3>Overall Score: ${data.totalScore}</h3>
        <p><strong>Feedback:</strong> ${editableFeedback}</p>
        <h4>Question Breakdown:</h4>
        <ul>${data.marksPerQuestion?.map((m: string) => `<li>${m}</li>`).join('')}</ul>
      `
    };

    try {
      const { saveStudyNote } = await import('../lib/offlineDB');
      await saveStudyNote(newItem);
      setArchiveSuccess(true);
      setTimeout(() => setArchiveSuccess(false), 2000);
    } catch (e) {
      console.error('Archive error:', e);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Camera access denied. Please check site permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const handleExtract = async (imageToProcess?: string) => {
    const imgs = imageToProcess ? [imageToProcess] : uploadedFiles.map(f => f.dataUrl);
    if (imgs.length === 0) return;
    
    setIsProcessing(true);
    setGenerationProgress(0);
    setProcessingError(null);
    setResult(null); 
    setExtractResult(null);
    setMode('extract');
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 15) + 5, 95));
    }, 300);

    try {
      const resp = await runOCRScan(imgs, provider, ocrProvider, ocrLanguage, isHandwritten);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setExtractResult(resp);
        setIsProcessing(false);
      }, 300);
    } catch (error: any) {
      console.error("Extraction error:", error);
      clearInterval(progressInterval);
      setProcessingError(error.message || "Extraction failed.");
      setIsProcessing(false);
    }
  };

  const rubricFileInputRef = useRef<HTMLInputElement>(null);

  const handleRubricFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      triggerToast(`Uploading and analyzing Memorandum & Rubric document: ${file.name}...`, 'info');
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = atob(dataUrl.split(',')[1]);
          setRubric(text);
          triggerToast("Memo & Rubric loaded successfully!", "success");
        } else {
          try {
            const scanResult = await runOCRScan([dataUrl], provider, ocrProvider, ocrLanguage, false);
            if (scanResult && scanResult.extractedText) {
              setRubric(scanResult.extractedText);
              triggerToast("Memorandum & Rubric extracted from file successfully!", "success");
            } else {
              triggerToast("Could not extract clean criteria. Inputting file name fallback.", "error");
              setRubric(`Extracted from ${file.name}: ` + file.name);
            }
          } catch (err: any) {
            console.warn("Rubric OCR extraction failed:", err);
            triggerToast("Extraction limited - check OCR config.", "error");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAcademicRecord = async (stuId: string, titleName: string, scoreStr: string, feedbackText: string) => {
    try {
      const targetStudent = dbStudents.find(s => s.id === stuId);
      if (!targetStudent) return;

      const scorePct = parseScoreToPercentage(scoreStr);
      const existingSubjects = targetStudent.subjects || [];
      const currentSubjectName = dbAssignments.find(a => a.id === selectedAssignmentId)?.subject || 'General';
      const updatedSubjects = [...existingSubjects];
      const newAssessment = {
        title: titleName || 'AutoGraded Assessment',
        score: scorePct,
        type: 'Test',
        date: new Date().toLocaleDateString()
      };

      const subIndex = updatedSubjects.findIndex((s: any) => (s.name || '').toLowerCase() === currentSubjectName.toLowerCase());
      if (subIndex > -1) {
        const sub = updatedSubjects[subIndex];
        const updatedAssessments = [...(sub.assessments || []), newAssessment];
        const averagePct = Math.round(updatedAssessments.reduce((acc: number, cur: any) => acc + (cur.score || 0), 0) / updatedAssessments.length);
        updatedSubjects[subIndex] = {
          ...sub,
          assessments: updatedAssessments,
          mark: averagePct
        };
      } else {
        updatedSubjects.push({
          name: currentSubjectName,
          mark: scorePct,
          termHistory: [scorePct],
          assessments: [newAssessment]
        });
      }

      // Enrich individual student IDP
      const existingIdp = targetStudent.idp || { strengths: [], weaknesses: [], recommendations: [], actionPlan: [] };
      const sentences = feedbackText.split(/[.!\n]+/).map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(s => s.length > 10);
      const inferredStrengths = sentences.filter(s => s.toLowerCase().includes('good') || s.toLowerCase().includes('excellent') || s.toLowerCase().includes('neat') || s.toLowerCase().includes('correct') || s.toLowerCase().includes('great')).slice(0, 3);
      const inferredWeaknesses = sentences.filter(s => s.toLowerCase().includes('need') || s.toLowerCase().includes('incorrect') || s.toLowerCase().includes('mistake') || s.toLowerCase().includes('improve') || s.toLowerCase().includes('re-evaluate')).slice(0, 3);

      const finalIdp = {
        ...existingIdp,
        strengths: Array.from(new Set([...(existingIdp.strengths || []), ...inferredStrengths])),
        weaknesses: Array.from(new Set([...(existingIdp.weaknesses || []), ...inferredWeaknesses])),
        recommendations: Array.from(new Set([...(existingIdp.recommendations || []), "Review feedback items on student portal and attend targeted practice loop sessions."])),
        actionPlan: existingIdp.actionPlan || []
      };

      await updateDoc(doc(db, 'students', stuId), {
        subjects: updatedSubjects,
        idp: finalIdp,
        lastActiveDate: new Date().toISOString()
      });
      triggerToast(`Registered mark securely under ${targetStudent.name}'s official gradebook profile and updated their individual support plan!`, 'success');
    } catch (err) {
      console.warn("Could not save to student records (handled):", err);
    }
  };

  const handleProcess = async (imageToProcess?: string) => {
    const imgs = imageToProcess ? [imageToProcess] : uploadedFiles.map(f => f.dataUrl);
    if (imgs.length === 0) return;
    
    setIsProcessing(true);
    setGenerationProgress(0);
    setProcessingError(null);
    setResult(null); // Clear previous result
    setExtractResult(null);
    setMode('grade');

    let finalRubric = rubric;
    const isSystemGenerated = !rubric.trim() && autoGenerateRubric;

    if (isSystemGenerated) {
      finalRubric = "SYSTEM_GENERATED: Automatically extract standard CAPS marking rubrics, memorandums, and correct answer checklists from this student response. Evaluate accuracy, handwriting neatness and award final marks accordingly.";
      
      // Trigger the 6-second transient warning
      setTransientWarning("No Memo & Rubric uploaded. The submission will be Auto-Graded using a system-generated Memo & Rubric.");
      setTimeout(() => {
        setTransientWarning(null);
      }, 6000);
    }
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 8) + 2, 95));
    }, 450);

    try {
      const gradingResult = await runOCRAndGrade(
        imgs, 
        finalRubric || "Grade accurately based on standard academic quality, checking for correctness, clarity, and completeness.", 
        provider, 
        ocrProvider, 
        ocrLanguage, 
        isHandwritten,
        behavioralAspects,
        adjustLateSubmission
      );
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Perform auto-detection of Student Name from extracted text or feedback commentary
      let detectedStuId = selectedStudentId;
      const ocrSearchSpace = ((gradingResult.extractedText || '') + ' ' + (gradingResult.feedback || '')).toLowerCase();
      
      if (detectedStuId === 'unassigned') {
        // Advanced multi-pass fuzzy matching
        const matchStu = dbStudents.find(s => {
          const nameLower = s.name.toLowerCase();
          const parts = nameLower.split(' ');
          
          // 1. Exact full name match
          if (ocrSearchSpace.includes(nameLower)) return true;
          
          // 2. Parts match (Surname + First Name or vice versa)
          if (parts.length >= 2) {
            const first = parts[0];
            const last = parts[parts.length - 1];
            if (ocrSearchSpace.includes(first) && ocrSearchSpace.includes(last)) return true;
          }
          
          // 3. Initials match (e.g. "J. Smith")
          const initials = parts.map(p => p[0]).join('');
          if (parts.length >= 2 && ocrSearchSpace.includes(`${parts[0][0]}. ${parts[parts.length-1]}`)) return true;
          
          return false;
        });

        if (matchStu) {
          detectedStuId = matchStu.id;
        }
      }

      const activeAssObj = dbAssignments.find(a => a.id === selectedAssignmentId);
      const assTitle = activeAssObj ? activeAssObj.title : 'Evaluation Exercise';

      // Assemble premium report card log file for storage
      const repId = 'rep_' + Date.now().toString();
      const reportLogPayload = {
        id: repId,
        teacherId: auth.currentUser?.uid || 'guest_teacher',
        teacherName: auth.currentUser?.displayName || 'Teacher',
        assignmentId: selectedAssignmentId || '',
        assignmentTitle: assTitle,
        studentId: detectedStuId,
        studentName: detectedStuId === 'unassigned' ? 'Learner Name not detected automatically' : (dbStudents.find(s => s.id === detectedStuId)?.name || 'Learner'),
        fileName: uploadedFiles.map(f => f.name).join(', ') || 'PaperSubmission.jpeg',
        extractedText: gradingResult.extractedText || '',
        totalScore: gradingResult.totalScore || 'N/A',
        marksPerQuestion: gradingResult.marksPerQuestion || [],
        feedback: gradingResult.feedback || '',
        behavioralAspects: behavioralAspects,
        createdAt: new Date().toISOString()
      };

      // 1. Write completed report log document to auto_grading_reports collection
      try {
        await setDoc(doc(db, 'auto_grading_reports', repId), reportLogPayload);
      } catch (logErr) {
        console.warn("Could not write record block to auto_grading_reports collection (handled):", logErr);
      }

      // 2. Dispatch real-time server notification
      try {
        const notifId = 'notif_' + Date.now().toString();
        const baseMessage = `Auto-grading completed for ${reportLogPayload.fileName || 'submission'}. Achieved Score: ${reportLogPayload.totalScore}.`;
        
        // Notify Teacher
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: auth.currentUser?.uid || 'guest_teacher',
          title: "Grading Task Completed 🎉",
          message: baseMessage + (detectedStuId === 'unassigned' ? ` Report needs manual learner assignment.` : ` Results assigned to ${reportLogPayload.studentName}.`),
          reportData: {
            reportId: repId,
            extractedText: gradingResult.extractedText || '',
            feedback: gradingResult.feedback || ''
          },
          read: false,
          createdAt: serverTimestamp()
        });

        // Notify Student (if detected)
        if (detectedStuId && detectedStuId !== 'unassigned') {
          const stuNotifId = 'notif_stu_' + Date.now().toString();
          await setDoc(doc(db, 'notifications', stuNotifId), {
            id: stuNotifId,
            userId: detectedStuId,
            title: "New Graded Assessment 📝",
            message: `Your ${assTitle} has been graded by EduAI. Score: ${gradingResult.totalScore}. Check your portfolio for details.`,
            reportId: repId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      } catch (notifErr) {
        console.warn("Could not dispatch alert notifications (handled):", notifErr);
      }

      // 3. Dispatch gradebook changes back to matching student's active caps score sheet
      if (detectedStuId && detectedStuId !== 'unassigned') {
        await saveAcademicRecord(detectedStuId, assTitle, gradingResult.totalScore, gradingResult.feedback || '');
      }

      setTimeout(() => {
        setResult(gradingResult);
        setIsProcessing(false);
        triggerToast("Assessment graded successfully and registered to Lab history!", "success");
      }, 400);

    } catch (error: any) {
      console.error("Processing error:", error);
      clearInterval(progressInterval);
      setProcessingError(error.message || "Neuro-analysis failed. Please check your AI config or try another provider.");
      setIsProcessing(false);
    }
  };

  const runBulkAutoGrading = async () => {
    if (uploadedFiles.length === 0) return;
    setIsProcessing(true);
    setProcessingError(null);
    setResult(null);

    triggerToast(`Starting sequential bulk auto-grading for ${uploadedFiles.length} uploaded files...`, 'info');

    // Initialize statuses
    const initialStatus = { ...bulkStatus };
    uploadedFiles.forEach(f => {
      if (!initialStatus[f.id]) {
        initialStatus[f.id] = { status: 'Draft', studentId: 'unassigned' };
      }
    });
    setBulkStatus(initialStatus);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      setBulkStatus(prev => ({
        ...prev,
        [file.id]: { ...prev[file.id], status: 'Processing' }
      }));

      let finalRubric = rubric;
      const isSystemGenerated = !rubric.trim() && autoGenerateRubric;

      if (isSystemGenerated && i === 0) {
        setTransientWarning("No Memo & Rubric uploaded. The submission will be Auto-Graded using a system-generated Memo & Rubric.");
        setTimeout(() => {
          setTransientWarning(null);
        }, 6000);
      }

      try {
        const gradingResult = await runOCRAndGrade(
          [file.dataUrl],
          finalRubric || "Evaluate objectively based on standard memo rules.",
          provider,
          ocrProvider,
          ocrLanguage,
          isHandwritten,
          behavioralAspects,
          adjustLateSubmission
        );

        // Name detection
        let detectedStuId = bulkStatus[file.id]?.studentId || 'unassigned';
        const ocrSearchSpace = ((gradingResult.extractedText || '') + ' ' + (gradingResult.feedback || '')).toLowerCase();

        if (detectedStuId === 'unassigned') {
          const matchStu = dbStudents.find(s => ocrSearchSpace.includes(s.name.toLowerCase()) || s.name.split(' ').some(part => part.length > 2 && ocrSearchSpace.includes(part.toLowerCase())));
          if (matchStu) {
            detectedStuId = matchStu.id;
          }
        }

        const activeAssObj = dbAssignments.find(a => a.id === selectedAssignmentId);
        const assTitle = activeAssObj ? activeAssObj.title : 'Evaluation Exercise';

        // Write report card history log
        const repId = 'rep_' + Date.now().toString() + '_' + i;
        const reportLogPayload = {
          id: repId,
          teacherId: auth.currentUser?.uid || 'guest_teacher',
          assignmentId: selectedAssignmentId || '',
          assignmentTitle: assTitle,
          studentId: detectedStuId,
          studentName: detectedStuId === 'unassigned' ? 'Learner Name not detected automatically' : (dbStudents.find(s => s.id === detectedStuId)?.name || 'Learner'),
          fileName: file.name,
          extractedText: gradingResult.extractedText || '',
          totalScore: gradingResult.totalScore || 'N/A',
          marksPerQuestion: gradingResult.marksPerQuestion || [],
          feedback: gradingResult.feedback || '',
          behavioralAspects: behavioralAspects,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'auto_grading_reports', repId), reportLogPayload);

        // Dispatch alert notification
        const notifId = 'notif_' + Date.now().toString() + '_' + i;
        const baseMessage = `Auto-grading completed for ${file.name}. Suggested Score: ${gradingResult.totalScore}.`;
        const actionMessage = detectedStuId === 'unassigned' 
          ? ` Report needs manual learner assignment.`
          : ` Results assigned to ${dbStudents.find(s => s.id === detectedStuId)?.name || 'Learner'}.`;
        
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: auth.currentUser?.uid || 'guest_teacher',
          title: "Grading Task Completed 🎉",
          message: baseMessage + actionMessage,
          reportData: {
            extractedText: gradingResult.extractedText || '',
            feedback: gradingResult.feedback || '',
            marksPerQuestion: gradingResult.marksPerQuestion || []
          },
          read: false,
          createdAt: serverTimestamp()
        });

        // Record learner's mark
        if (detectedStuId && detectedStuId !== 'unassigned') {
          await saveAcademicRecord(detectedStuId, assTitle, gradingResult.totalScore, gradingResult.feedback || '');
        }

        setBulkStatus(prev => ({
          ...prev,
          [file.id]: {
            ...prev[file.id],
            status: 'Graded',
            score: gradingResult.totalScore,
            feedback: gradingResult.feedback || '',
            extractedText: gradingResult.extractedText || '',
            studentId: detectedStuId,
            studentName: detectedStuId === 'unassigned' ? 'Learner Name not detected automatically' : (dbStudents.find(s => s.id === detectedStuId)?.name || 'Learner'),
            fileName: file.name
          }
        }));

      } catch (error: any) {
        console.warn(`Bulk item error ${file.name}:`, error);
        setBulkStatus(prev => ({
          ...prev,
          [file.id]: { ...prev[file.id], status: 'Error' }
        }));
      }
    }

    setIsProcessing(false);
    triggerToast("All bulk submissions processed and results submitted to Student profiles!", "success");
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        
        const newFile = {
          id: `raw-captured-${Date.now()}`,
          name: `Camera Snapshot ${uploadedFiles.length + 1}.jpeg`,
          type: 'image',
          dataUrl
        };
        const updated = [...uploadedFiles, newFile];
        setUploadedFiles(updated);
        setActivePreviewIndex(updated.length - 1);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newItems: typeof uploadedFiles = [];
      let loadedCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          let fileType = 'image';
          if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            fileType = 'pdf';
          } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc') || file.type.includes('word') || file.type.includes('officedocument')) {
            fileType = 'docx';
          }
          
          newItems.push({
            id: `upload-${Date.now()}-${i}-${Math.random()}`,
            name: file.name,
            type: fileType,
            dataUrl
          });
          
          loadedCount++;
          if (loadedCount === files.length) {
            const updated = [...uploadedFiles, ...newItems];
            setUploadedFiles(updated);
            setActivePreviewIndex(updated.length - 1);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const reset = () => {
    setUploadedFiles([]);
    setActivePreviewIndex(0);
    setCapturedImage(null);
    setResult(null);
    setExtractResult(null);
    setRubric('');
    setSelectedAssignmentId('');
    setSelectedContentId('');
    setIsCameraActive(false);
    setMode('grade');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Premium Notification Toast alerts */}
      <AnimatePresence>
        {localToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 px-6 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs uppercase font-black tracking-widest ${
              localToast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' :
              localToast.type === 'error' ? 'bg-rose-500/15 border-rose-500 text-rose-400' :
              'bg-brand-cyan/15 border-brand-cyan text-brand-cyan'
            }`}
          >
            <CheckCircle size={16} />
            <span>{localToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6-Second System Warning Pop-Up */}
      <AnimatePresence>
        {transientWarning && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#001730] border-2 border-amber-500/50 text-amber-300 p-5 px-8 rounded-3xl shadow-2xl flex items-center gap-4 max-w-sm text-center flex-col md:flex-row md:text-left"
          >
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500 shrink-0">
              <AlertCircle size={22} className="animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Attention Educator</p>
              <p className="text-xs font-semibold leading-relaxed">{transientWarning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1033] via-[#080b22] to-[#111640] border-2 border-indigo-500/30 rounded-[32px] p-6 sm:p-8 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              <span>AI Vision & Auto-Grading Laboratory</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-cyan-300 tracking-tight">
              Teacher's Auto-Grading Lab
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              A unified, premium visual studio for testing, bulk processing, and persistently logging student assessment scripts against standard academic rubrics or AI-crafted Memorandums.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex flex-col grow sm:grow-0">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-1 tracking-widest pl-1">OCR Language</label>
              <select 
                value={ocrLanguage} 
                onChange={e => setOcrLanguage(e.target.value)}
                className="bg-slate-900/90 border border-indigo-500/30 text-slate-200 text-xs font-bold uppercase tracking-wider py-2.5 px-3.5 rounded-xl outline-none focus:border-cyan-400 [&>option]:bg-slate-900 transition-all"
              >
                <option value="English">English</option>
                {LANGUAGES.filter(l => l.value !== 'English').map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col grow sm:grow-0">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-1 tracking-widest pl-1">Script Type</label>
              <button
                id="toggle-handwritten"
                type="button"
                onClick={() => setIsHandwritten(!isHandwritten)}
                className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all h-[38px] flex items-center gap-2 cursor-pointer ${
                  isHandwritten 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                    : 'bg-slate-900/90 border-indigo-500/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isHandwritten ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                {isHandwritten ? 'Handwritten' : 'Printed Text'}
              </button>
            </div>

            <div className="flex flex-col grow sm:grow-0 self-end">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] h-[38px] cursor-pointer active:scale-95"
              >
                <Upload size={16} />
                <span>Upload Scans</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*,application/pdf,.pdf,.docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                multiple
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unified Teacher's Auto-Grading Lab Navigation tabs */}
      <div className="bg-slate-900/90 border border-indigo-500/30 p-1.5 rounded-2xl flex flex-wrap gap-2 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <button
          type="button"
          onClick={() => setLabActiveTab('grade')}
          className={`flex-1 min-w-[180px] px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
            labActiveTab === 'grade'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-indigo-500/10'
          }`}
        >
          <Scan size={16} className={labActiveTab === 'grade' ? 'text-slate-950' : 'text-cyan-400'} />
          <span>Scan & Grade Desk</span>
        </button>
        <button
          type="button"
          onClick={() => setLabActiveTab('notifications')}
          className={`flex-1 min-w-[180px] px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 relative ${
            labActiveTab === 'notifications'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-indigo-500/10'
          }`}
        >
          <Brain size={16} className={labActiveTab === 'notifications' ? 'text-white' : 'text-purple-400'} />
          <span>Alert Hub & Live Feed</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
        <button
          type="button"
          onClick={() => setLabActiveTab('history')}
          className={`flex-1 min-w-[180px] px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
            labActiveTab === 'history'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-indigo-500/10'
          }`}
        >
          <ClipboardList size={16} className={labActiveTab === 'history' ? 'text-slate-950' : 'text-amber-400'} />
          <span>Archived Reports Vault ({labReports.length})</span>
        </button>
      </div>

      {labActiveTab === 'grade' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Input */}
        <div className="lg:col-span-7 space-y-8">
          {uploadedFiles.length === 0 && !isCameraActive ? (
            <button 
              onClick={startCamera}
              className="w-full aspect-[4/3] bg-gradient-to-b from-indigo-950/40 to-slate-900/80 rounded-[32px] border-2 border-dashed border-cyan-500/30 flex flex-col items-center justify-center group hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all overflow-hidden relative p-8 text-center cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-400/30 rounded-3xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Camera size={40} />
              </div>
              <h3 className="text-2xl font-display font-black text-white tracking-tight">Initialize Visual Stream</h3>
              <p className="text-cyan-300/80 text-xs mt-2 uppercase font-mono font-bold tracking-widest">Click to scan/capture custom student work</p>
              {cameraError && (
                <div className="mt-4 flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest bg-rose-500/15 px-4 py-2 rounded-full border border-rose-500/30">
                  <AlertCircle size={14} />
                  {cameraError}
                </div>
              )}
            </button>
          ) : isCameraActive ? (
            <div className="relative aspect-[4/3] bg-black rounded-[32px] overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 border-2 border-cyan-400/30 pointer-events-none rounded-[32px]" />
              
              {/* Enhanced Visual Guides */}
              <div className="absolute inset-8 border-2 border-dashed border-cyan-400/60 rounded-2xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-cyan-400/30 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[2px] bg-cyan-400/30 pointer-events-none" />
              
              <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-cyan-400 pointer-events-none rounded-tl-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-cyan-400 pointer-events-none rounded-tr-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              <div className="absolute bottom-[100px] left-10 w-12 h-12 border-b-4 border-l-4 border-cyan-400 pointer-events-none rounded-bl-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              <div className="absolute bottom-[100px] right-10 w-12 h-12 border-b-4 border-r-4 border-cyan-400 pointer-events-none rounded-br-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]" />

              {/* On-screen Instructions */}
              <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-slate-950/80 backdrop-blur-md px-6 py-2.5 rounded-full flex items-center gap-3 border border-cyan-500/30 shadow-lg">
                  <AlertCircle size={16} className="text-cyan-400 animate-pulse" />
                  <span className="text-cyan-200 text-xs font-mono font-bold tracking-wide">Align assessment script within target frame.</span>
                </div>
              </div>
              
              <div className="absolute bottom-8 inset-x-0 flex justify-center items-center gap-6">
                <button 
                  onClick={stopCamera}
                  className="bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white p-3.5 rounded-2xl hover:bg-slate-800 transition-all border border-indigo-500/30 cursor-pointer"
                >
                  <X size={22} />
                </button>
                <button 
                  onClick={captureImage}
                  className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-90 transition-all hover:scale-105 ring-4 ring-cyan-400/30 cursor-pointer"
                >
                  <Camera size={28} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active File Preview Container */}
              <div className="relative aspect-[4/3] bg-slate-950/80 rounded-[32px] overflow-hidden border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(0,0,0,0.4)] group">
                {uploadedFiles[activePreviewIndex]?.type === 'image' ? (
                  <img 
                    src={uploadedFiles[activePreviewIndex]?.dataUrl} 
                    className="w-full h-full object-cover opacity-95" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 p-10">
                    <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-400/30 rounded-3xl flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                      {uploadedFiles[activePreviewIndex]?.type === 'pdf' ? (
                        <FileText size={40} />
                      ) : (
                        <ClipboardList size={40} />
                      )}
                    </div>
                    <p className="text-white text-base font-black tracking-wider text-center max-w-xs truncate">
                      {uploadedFiles[activePreviewIndex]?.name}
                    </p>
                    <p className="text-cyan-300 text-[10px] font-mono mt-2 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-cyan-500/30">
                      {uploadedFiles[activePreviewIndex]?.type?.toUpperCase()} Document
                    </p>
                  </div>
                )}
                
                {/* Reset All Button */}
                <button 
                  onClick={reset}
                  className="absolute top-6 right-6 bg-rose-500/90 text-white px-4 py-2 rounded-xl hover:bg-rose-600 transition-all shadow-lg active:scale-95 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash size={14} />
                  Reset Queue
                </button>
              </div>

              {/* Multipage Thumbnails Carousel & Document Queue */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-widest">
                    Uploaded Document Queue ({uploadedFiles.length} page/s or file/s)
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">Accepts Images, PDFs, & DOCX</p>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {uploadedFiles.map((file, idx) => {
                    const isSelected = idx === activePreviewIndex;
                    return (
                      <div 
                        key={file.id}
                        className={`relative group flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                          isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-[0.98]' : 'border-indigo-500/20 hover:border-indigo-500/40'
                        }`}
                        onClick={() => setActivePreviewIndex(idx)}
                      >
                        {file.type === 'image' ? (
                          <img src={file.dataUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 font-bold text-[10px] text-slate-300">
                            {file.type === 'pdf' ? <span className="text-rose-400">PDF</span> : <span className="text-blue-400 font-mono">DOCX</span>}
                            <span className="text-[8px] mt-1 text-slate-400 truncate max-w-[80px] p-1">{file.name}</span>
                          </div>
                        )}
                        
                        {/* Remove item button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = uploadedFiles.filter(item => item.id !== file.id);
                            setUploadedFiles(updated);
                            setActivePreviewIndex(prev => Math.max(0, Math.min(prev, updated.length - 1)));
                          }}
                          className="absolute top-1 right-1 bg-slate-950/80 hover:bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Append scan/upload button in thumbnail row */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 flex-shrink-0 rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-cyan-400 bg-indigo-500/5 hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={18} className="text-cyan-400" />
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-300">Add File</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-24 h-24 flex-shrink-0 rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-cyan-400 bg-indigo-500/5 hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Camera size={18} className="text-cyan-400 animate-pulse" />
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-300">Scan Page</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Specialized Bulk Processing Controller */}
              {uploadedFiles.length > 1 && (
                <div className="bg-slate-900/90 p-6 rounded-2xl border border-indigo-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider">Bulk Auto-Grading Control Panel</h4>
                      <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">Assign students to specific pages or use the engine to automatically map names from raw transcript contents.</p>
                    </div>

                    <button
                      type="button"
                      onClick={runBulkAutoGrading}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-40"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                      Execute Bulk Run
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {uploadedFiles.map((file) => {
                      const fileStatus = bulkStatus[file.id] || { status: 'Draft', studentId: 'unassigned' };
                      return (
                        <div key={file.id} className="p-3 bg-slate-950/60 border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-200 block truncate max-w-[200px]" title={file.name}>
                              {file.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {fileStatus.status === 'Draft' && <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Draft</span>}
                              {fileStatus.status === 'Processing' && <span className="text-[10px] font-mono font-bold uppercase text-purple-400 animate-pulse">Running OCR...</span>}
                              {fileStatus.status === 'Graded' && <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">Graded: {fileStatus.score}</span>}
                              {fileStatus.status === 'Error' && <span className="text-[10px] font-mono font-bold uppercase text-rose-400">Processing Error</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-400 uppercase">Map Learner:</span>
                            <select
                              value={fileStatus.studentId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkStatus(prev => {
                                  const current = prev[file.id] || { status: 'Draft', studentId: 'unassigned' };
                                  return {
                                    ...prev,
                                    [file.id]: {
                                      ...current,
                                      studentId: val
                                    }
                                  };
                                });
                              }}
                              className="bg-slate-900 border border-indigo-500/30 text-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg outline-none cursor-pointer [&>option]:bg-slate-900"
                            >
                              <option value="unassigned">Auto-detect from page</option>
                              {dbStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-indigo-950/80 border-2 border-indigo-500/30 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_0_25px_rgba(99,102,241,0.2)]">
            <div className="flex items-center gap-3 mb-2 border-b border-indigo-500/20 pb-4">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-cyan-400">
                <FileCheck size={20} />
              </div>
              <h3 className="text-xl font-display font-black text-white">Grading Parameters</h3>
            </div>
                     {/* Select from Content Archive Vault / Assignments */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-300 pl-1">
                Linked Class Assignment
              </label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => {
                  setSelectedAssignmentId(e.target.value);
                  setSelectedSubmission(null);
                  setResult(null);
                }}
                className="w-full bg-slate-900 border border-indigo-500/30 outline-none text-slate-200 text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl focus:border-cyan-400 [&>option]:bg-slate-900 cursor-pointer transition-all"
              >
                <option value="">-- Or select an assigned task (Autofills Memo & Rubric) --</option>
                {dbAssignments.map(asg => (
                  <option key={asg.id} value={asg.id}>
                    {asg.title} ({asg.subject} • {asg.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* Load Memo/Rubric from Personal Created Content Vault */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-400 pl-1 flex items-center gap-1.5">
                <Bookmark size={12} />
                Load Rubric/Memo from Teacher Content Vault
              </label>
              <select
                value={selectedContentId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedContentId(val);
                  if (val) {
                    const chosenContent = createdContents.find(c => c.id === val);
                    if (chosenContent) {
                      const parts = [];
                      if (chosenContent.rubric) parts.push(`[Rubric]\n${chosenContent.rubric}`);
                      if (chosenContent.memo) parts.push(`[Memo]\n${chosenContent.memo}`);
                      if (chosenContent.content) parts.push(`[Content Details]\n${chosenContent.content}`);
                      setRubric(parts.filter(Boolean).join("\n\n"));
                    }
                  }
                }}
                className="w-full bg-slate-900 border border-indigo-500/30 outline-none text-slate-200 text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl focus:border-cyan-400 [&>option]:bg-slate-900 cursor-pointer transition-all"
              >
                <option value="">-- Or Select from Created Content Vault --</option>
                {createdContents.map(cnt => (
                  <option key={cnt.id} value={cnt.id}>
                    {cnt.title || cnt.topic} ({cnt.contentType || 'Materials'} • {cnt.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* If has linked assignment and submissions, show students submissions queue */}
            {selectedAssignmentId && (
              <div className="space-y-3 pt-2 bg-slate-950/60 p-4 rounded-2xl border border-indigo-500/20">
                <div className="flex justify-between items-center pl-1">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-400">
                    Student Submissions ({filteredSubmissions.length})
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Real-time sync</span>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="p-4 bg-slate-900/40 rounded-xl text-center border border-dashed border-indigo-500/20">
                    <p className="text-xs text-slate-400 font-medium">No students have submitted this task yet.</p>
                  </div>
                ) : (
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {filteredSubmissions.map(sub => {
                      const isGraded = sub.status === 'graded';
                      const isChosen = selectedSubmission?.id === sub.id;

                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubmission(sub);
                            if (sub.uploadedImage) {
                              setUploadedFiles([{
                                id: `sub-img-${sub.id}`,
                                name: `${sub.studentName} Submitted Page.jpeg`,
                                type: 'image',
                                dataUrl: sub.uploadedImage
                              }]);
                              setActivePreviewIndex(0);
                            } else {
                              setUploadedFiles([]);
                            }
                            if (sub.grade) {
                              setResult({
                                totalScore: sub.grade,
                                feedback: sub.feedback || 'No feedback found.',
                                marksPerQuestion: sub.marksPerQuestion || [],
                                extractedText: sub.answersText || '(RAW answers uploaded)'
                              });
                            }
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isChosen
                              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                              : (isGraded ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-200 hover:bg-slate-800/50' : 'bg-slate-900/60 border-indigo-500/20 text-slate-300 hover:bg-slate-800/50')
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{sub.studentName}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {sub.completedOnline ? 'Completed Online' : 'Uploaded Hand-written paper'}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {isGraded ? (
                              <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                                Graded: {sub.grade}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-300">
                  Marking Rubric / Memo Notes
                </label>
                
                {autoGenerateRubric && !rubric.trim() && (
                  <span className="text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                     AI Synthesis Active
                  </span>
                )}
              </div>
              <textarea 
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder="Enter your marking rubric guidelines or leave blank with the AI toggle enabled to generate one automatically..."
                className="w-full bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 focus:border-cyan-400 outline-none transition-all resize-none text-xs text-slate-200 placeholder:text-slate-600 leading-relaxed font-mono h-40 shadow-inner"
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => rubricFileInputRef.current?.click()}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-indigo-500/30 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all grow cursor-pointer"
                >
                  <Upload size={14} className="text-cyan-400" />
                  Upload Memo / Rubric file
                </button>
                <input
                  type="file"
                  ref={rubricFileInputRef}
                  onChange={handleRubricFileUpload}
                  className="hidden"
                  accept="image/*,application/pdf,.txt"
                />

                <button
                  type="button"
                  onClick={() => {
                    setAutoGenerateRubric(!autoGenerateRubric);
                    triggerToast(!autoGenerateRubric ? "AI auto-generation enabled for missing rubrics!" : "AI auto-generation disabled.", "info");
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 grow cursor-pointer ${
                    autoGenerateRubric
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                      : 'bg-slate-900 border-indigo-500/30 text-slate-400'
                  }`}
                >
                  <Brain size={14} className={autoGenerateRubric ? "text-purple-400 animate-pulse" : "text-slate-500"} />
                  {autoGenerateRubric ? "Active: AI Generate if blank" : "AI generator disabled"}
                </button>
              </div>
            </div>

            {/* Report Card Tuning Parameters (Behavioral Dimensions) */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-indigo-500/20 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain size={16} className="text-cyan-400" />
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">Report Card Behavioral Tuning</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'Focus & Work Effort', desc: 'Assess neatness, completeness and diligence' },
                  { value: 'Critical Thinking & Logic', desc: 'Evaluate reasoning depth and working steps' },
                  { value: 'Handwriting Presentation', desc: 'Determine letterform tidiness and organization' },
                  { value: 'Time-management & Efficiency', desc: 'Address response conciseness' }
                ].map(item => {
                  const isChecked = behavioralAspects.includes(item.value);
                  return (
                    <label 
                      key={item.value} 
                      className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col gap-1 ${
                        isChecked 
                          ? 'bg-cyan-500/15 border-cyan-400/50 text-white' 
                          : 'bg-slate-900/60 border-indigo-500/20 text-slate-400 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setBehavioralAspects(prev => prev.filter(v => v !== item.value));
                            } else {
                              setBehavioralAspects(prev => [...prev, item.value]);
                            }
                          }}
                          className="accent-cyan-400 shrink-0"
                        />
                        <span className="text-xs font-bold leading-none">{item.value}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium pl-5">{item.desc}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-300">Resubmission / Late Catchup</span>
                  <p className="text-[9px] text-slate-400 font-mono">Include catch-up encouragement</p>
                </div>
                <input
                  type="checkbox"
                  checked={adjustLateSubmission}
                  onChange={(e) => setAdjustLateSubmission(e.target.checked)}
                  className="w-10 h-6 shrink-0 rounded-full appearance-none bg-slate-800 checked:bg-cyan-400 border-2 border-slate-700 relative transition-colors cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] checked:before:translate-x-4 before:transition-transform"
                />
              </div>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className={`w-full py-5 rounded-2xl font-black uppercase tracking-wider text-xs flex flex-col items-center justify-center gap-4 transition-all border ${
                isProcessing ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300' : 'bg-slate-950/60 border-indigo-500/20 text-slate-300'
              }`}>
                {isProcessing ? (
                  <div className="w-full px-6">
                     <div className="flex justify-between items-center w-full mb-2">
                       <span className="flex items-center gap-2 text-xs font-mono"><Loader2 className="animate-spin text-cyan-400" size={16} /> Neural Synthesis Active</span>
                       <span className="text-xs font-mono">{generationProgress}%</span>
                     </div>
                     <div className="w-full h-2 rounded-full overflow-hidden bg-slate-900 border border-cyan-500/30 shadow-inner">
                       <div 
                         className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                         style={{ width: `${generationProgress}%` }}
                       />
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 w-full p-2">
                    <button 
                      type="button"
                      onClick={() => handleExtract()} 
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-slate-200 p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Scan size={16} className="text-cyan-400" /> Extract Text
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleProcess()} 
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 p-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
                    >
                      <GraduationCap size={16} /> Autograde
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* End-of-Term Report Card Gradebook Sync & Export Panel */}
          {selectedAssignmentId && filteredSubmissions.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-indigo-950/80 border-2 border-indigo-500/30 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_0_25px_rgba(99,102,241,0.2)]">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-400/30 rounded-xl text-purple-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black text-white">End-of-Period Gradebook Export</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-0.5">Report Card Synopsis</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Student,Grade,Status,Report Comment\n"
                      + filteredSubmissions.map(s => `"${s.studentName}","${s.grade || 'Pending'}","${s.status || 'pending'}","${(s.feedback || 'Incomplete grading progress.').replace(/"/g, '""')}"`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `class_gradebook_${selectedAssignmentId}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>

              {(() => {
                const gradedList = filteredSubmissions.filter(s => s.grade);
                const averagepct = gradedList.length > 0 
                  ? (gradedList.reduce((acc, curr) => acc + parseScoreToPercentage(curr.grade), 0) / gradedList.length).toFixed(1)
                  : "0.0";
                  
                const level7 = gradedList.filter(s => parseScoreToPercentage(s.grade) >= 80).length;
                const level5_6 = gradedList.filter(s => { const p = parseScoreToPercentage(s.grade); return p >= 60 && p < 80; }).length;
                const level3_4 = gradedList.filter(s => { const p = parseScoreToPercentage(s.grade); return p >= 40 && p < 60; }).length;
                const level1_2 = gradedList.filter(s => parseScoreToPercentage(s.grade) < 40).length;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-navy-darker/60 p-4 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">Class Average</span>
                        <span className="text-2xl font-black text-brand-cyan mt-1">{averagepct}%</span>
                      </div>
                      <div className="bg-navy-darker/60 p-4 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">Finalized Grades</span>
                        <span className="text-2xl font-black text-purple-400 mt-1">{gradedList.length} / {filteredSubmissions.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 bg-navy-darker/40 border border-white/5 rounded-2xl">
                      <div className="flex justify-between items-center text-[9px] uppercase text-slate-500 font-black">
                        <span>Grades Distribution Band</span>
                        <span>Level Counts</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                        <div className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-[10px] font-bold text-emerald-400">Level 7 (80%+)</span>
                          <div className="h-2 rounded bg-slate-800 grow overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded" style={{ width: `${filteredSubmissions.length > 0 ? (level7/filteredSubmissions.length)*100 : 0}%` }} />
                          </div>
                          <span className="w-4 text-right text-[10px] font-bold">{level7}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-[10px] font-bold text-blue-400">Level 5-6 (60-79%)</span>
                          <div className="h-2 rounded bg-slate-800 grow overflow-hidden">
                            <div className="h-full bg-blue-500 rounded" style={{ width: `${filteredSubmissions.length > 0 ? (level5_6/filteredSubmissions.length)*100 : 0}%` }} />
                          </div>
                          <span className="w-4 text-right text-[10px] font-bold">{level5_6}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-[10px] font-bold text-yellow-400">Level 3-4 (40-59%)</span>
                          <div className="h-2 rounded bg-slate-800 grow overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded" style={{ width: `${filteredSubmissions.length > 0 ? (level3_4/filteredSubmissions.length)*100 : 0}%` }} />
                          </div>
                          <span className="w-4 text-right text-[10px] font-bold">{level3_4}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-[10px] font-bold text-rose-400">Level 1-2 (&lt;40%)</span>
                          <div className="h-2 rounded bg-slate-800 grow overflow-hidden">
                            <div className="h-full bg-rose-500 rounded" style={{ width: `${filteredSubmissions.length > 0 ? (level1_2/filteredSubmissions.length)*100 : 0}%` }} />
                          </div>
                          <span className="w-4 text-right text-[10px] font-bold">{level1_2}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {filteredSubmissions.map(sub => {
                        const rawSc = sub.grade || '';
                        const commentTxt = sub.feedback ? (sub.feedback.split(".")[0] + ".") : "Pending grading evaluation.";
                        return (
                          <div key={sub.id} className="p-3 bg-navy-darker/50 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white truncate">{sub.studentName}</span>
                                {rawSc && (
                                  <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                                    {rawSc}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-slate-500 truncate italic mt-0.5">"{commentTxt}"</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${sub.studentName} • Grade: ${rawSc || 'Pending'} • ${commentTxt}`);
                                alert(`Copied report-card synopsis for ${sub.studentName}!`);
                              }}
                              className="text-[10px] px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg text-slate-400 font-bold hover:text-white uppercase tracking-wider shrink-0 transition-all active:scale-95"
                            >
                              Copy
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {processingError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] flex items-start gap-4 text-red-400"
              >
                <AlertCircle size={24} className="shrink-0 mt-1" />
                <div>
                  <h4 className="font-hand text-xl text-white mb-1">System Error</h4>
                  <p className="text-sm font-medium">{processingError}</p>
                </div>
              </motion.div>
            )}
            
            {mode === 'grade' && result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Result header buttons */}
                <div className="flex justify-end items-center gap-2 mb-4">
                  <button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 p-3 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer" title="Print Content"><Printer size={18} /></button>
                  <button onClick={handleDownloadPDF} className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 p-3 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer" title="Download as PDF"><Download size={18} /></button>
                  <button 
                    onClick={handleArchive}
                    className={cn(
                      "transition-all px-5 py-3 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer shadow-lg",
                      archiveSuccess ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    )}
                  >
                     {archiveSuccess ? <Check size={16} /> : <Save size={16} />}
                     {archiveSuccess ? 'Stored' : 'Save Grading'}
                  </button>
                </div>

                <div className="pb-12 bg-gradient-to-br from-[#0c1033] via-[#080b22] to-[#111640] border-2 border-indigo-500/30 rounded-[32px] p-6 sm:p-8 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.2)] printable-doc print:bg-white print:text-black print:border-none print:p-0 print:shadow-none" ref={contentRef}>
                  {/* Score Card */}
                  <div className="bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 border-2 border-cyan-400/40 p-6 sm:p-8 rounded-3xl relative overflow-hidden group mb-6 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl transition-colors pointer-events-none" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex flex-col items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)] shrink-0">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">Score</span>
                        <span className="text-3xl sm:text-4xl font-black">{result.totalScore}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black text-white tracking-tight">Grading Complete</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle size={16} className="text-emerald-400" />
                          <span className="text-xs text-cyan-300 font-mono font-bold uppercase tracking-wider">Analysis Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Rubric / Memo Corrections Log */}
                  {result.originalMemoCorrected && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl mb-6 relative">
                      <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                        AI Corrected Memo
                      </div>
                      <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Brain size={16} />
                        Rubric / Memo Adjustments Report
                      </h4>
                      <p className="text-xs text-slate-300 font-medium mb-3 bg-slate-950/60 p-4 rounded-xl border border-amber-500/20 leading-relaxed">
                        {result.memoCorrectionReport || "The original memo had spelling/content omissions or was missing entirely. The AI corrected and streamlined the rubric for optimal auto-grading accuracy."}
                      </p>
                      {result.correctedMemo && (
                        <details className="cursor-pointer group">
                          <summary className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 select-none outline-none">
                            View Corrected Rubric & Memo Checklist
                          </summary>
                          <pre className="mt-3 p-4 bg-slate-950 text-slate-300 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-indigo-500/20">
                            {result.correctedMemo}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Comprehensive Editable Feedback Box & Comment Bank Helper */}
                  <div className="bg-slate-950/80 border border-cyan-500/30 p-6 rounded-3xl relative mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Report-Card Comment Editor</h4>
                      <span className="text-[9px] text-cyan-300 uppercase font-mono font-bold tracking-widest bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.5 rounded">Interactive Editor</span>
                    </div>

                    <textarea
                      value={editableFeedback}
                      onChange={(e) => setEditableFeedback(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500/30 rounded-xl p-4 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400 leading-relaxed min-h-[160px] resize-y mb-4 shadow-inner"
                      placeholder="Customize your student comments here before finalizing grading report..."
                    />

                    {/* Clean Formatted Markdown Output Preview */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-dashed border-indigo-500/30">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">Rendered Output Preview:</span>
                      <div className="text-slate-200 text-xs leading-relaxed prose prose-invert prose-sm max-w-none markdown-body"
                        dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(editableFeedback) as string) }}
                      />
                    </div>
                  </div>

                  {/* Interactive Report-Card Comment Bank Helper Module */}
                  <div className="bg-slate-950/80 border border-indigo-500/30 p-6 rounded-3xl mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-0.5">Interactive Comment Bank</h4>
                        <p className="text-[11px] text-slate-400 font-medium">Quickly insert professional report-card comments</p>
                      </div>
                      <button
                        onClick={() => {
                          const commentName = prompt("Enter a brief title for this saved comment template (e.g., 'Outstanding Logic'):");
                          if (commentName) {
                            const newCommentItem = {
                              id: `custom-${Date.now()}`,
                              title: commentName,
                              text: editableFeedback,
                              rating: 'My Saved Comment'
                            };
                            const updatedBank = [newCommentItem, ...commentBank];
                            setCommentBank(updatedBank);
                            localStorage.setItem('gradebook_comment_bank', JSON.stringify(updatedBank));
                          }
                        }}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        <Plus size={14} /> Save Feedback to Bank
                      </button>
                    </div>

                    {/* Search Comment Bank templates */}
                    <input
                      type="text"
                      value={commentSearch}
                      onChange={(e) => setCommentSearch(e.target.value)}
                      placeholder="Filter commentary templates..."
                      className="w-full bg-slate-900 border border-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 mb-4 font-medium"
                    />

                    <div className="grid grid-cols-1 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {commentBank
                        .filter(item => item.title.toLowerCase().includes(commentSearch.toLowerCase()) || item.text.toLowerCase().includes(commentSearch.toLowerCase()))
                        .map((comment) => (
                          <div 
                            key={comment.id}
                            className="p-3.5 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-indigo-500/20 cursor-pointer transition-all hover:border-cyan-400/50 group"
                            onClick={() => {
                              const action = confirm(`Do you want to APPEND this comment to the editor?\n\n"${comment.text}"`);
                              if (action) {
                                setEditableFeedback(prev => prev ? `${prev}\n\n${comment.text}` : comment.text);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="text-white text-xs font-bold group-hover:text-cyan-300 transition-colors">{comment.title}</span>
                              <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">{comment.rating}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">{comment.text}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Question Breakdown */}
                  <div className="bg-slate-950/80 border border-indigo-500/30 p-6 rounded-3xl mb-6">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">Question Breakdown</h4>
                    <div className="space-y-3">
                      {result.marksPerQuestion?.map((mark: string, i: number) => (
                        <div key={i} className="flex gap-3 items-start p-3.5 bg-slate-900/80 rounded-xl border border-indigo-500/20">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-xs font-mono font-black text-cyan-300 shrink-0">
                            {i+1}
                          </div>
                          <p className="text-xs text-slate-200 font-medium pt-1 leading-relaxed">
                            {mark}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extracted Text */}
                  <div className="bg-slate-950/80 border border-indigo-500/30 p-6 rounded-3xl">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">RAW DATA EXTRACTION</h4>
                    <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/20">
                      <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {result.extractedText}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'extract' && extractResult && (
              <motion.div 
                key="extract"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Result header buttons */}
                <div className="flex justify-end gap-2 mb-4">
                  <button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 p-3 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer" title="Print Content"><Printer size={18} /></button>
                  <button onClick={handleDownloadPDF} className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 p-3 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer" title="Download as PDF"><Download size={18} /></button>
                  <button 
                    onClick={handleArchive}
                    className={cn(
                      "transition-all px-5 py-3 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer shadow-lg",
                      archiveSuccess ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    )}
                  >
                     {archiveSuccess ? <Check size={16} /> : <Save size={16} />}
                     {archiveSuccess ? 'Archived' : 'Archive Document'}
                  </button>
                </div>

                 <div className="pb-12 bg-gradient-to-br from-[#0c1033] via-[#080b22] to-[#111640] border-2 border-indigo-500/30 rounded-[32px] p-6 sm:p-8 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.2)] printable-doc print:bg-white print:text-black print:border-none print:p-0 print:shadow-none" ref={contentRef}>
                  <div className="bg-slate-950/80 border border-indigo-500/30 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4 border-b border-indigo-500/20 pb-4">
                      <FileCheck className="text-cyan-400" size={24} />
                      <h3 className="text-xl font-display font-black text-white">Scanned Content</h3>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/20">
                      <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                         <p className="font-mono whitespace-pre-wrap text-xs leading-relaxed">{extractResult.extractedText}</p>
                      </div>
                    </div>
                  </div>
                 </div>
              </motion.div>
            )}

            {!result && !extractResult && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-indigo-950/80 border-2 border-indigo-500/30 rounded-[32px] shadow-[0_0_25px_rgba(99,102,241,0.2)]"
              >
                <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-400/30 rounded-3xl flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  <Brain size={36} />
                </div>
                <h3 className="text-2xl font-display font-black text-white mb-2">Awaiting Visual Stream</h3>
                <p className="text-slate-400 max-w-xs mx-auto text-xs leading-relaxed">
                  Provide an assessment scan and a custom rubric to initialize the automated grading engine.
                </p>
                <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-indigo-500/20">
                    <div className="h-full bg-cyan-400/30 w-1/3 rounded-full animate-pulse" />
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-indigo-500/20">
                    <div className="h-full bg-cyan-400/30 w-2/3 rounded-full animate-pulse delay-75" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* Computed Filtered Historical Reports Log */}
      {(() => {
        const filteredReports = labReports.filter(report => {
          const sQuery = archiveSearchQuery.toLowerCase();
          return (
            (report.studentName || '').toLowerCase().includes(sQuery) ||
            (report.assignmentTitle || '').toLowerCase().includes(sQuery) ||
            (report.fileName || '').toLowerCase().includes(sQuery)
          );
        });

        return (
          <>
            {/* ALERT HUB & LIVE FEED TAB */}
            {labActiveTab === 'notifications' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-indigo-950/80 border-2 border-indigo-500/30 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_0_35px_rgba(99,102,241,0.2)]"
              >
                <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-4">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-cyan-400">
                    <Brain size={22} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black text-white">Teacher Alert Hub & Live Feed</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-0.5">Real-time educational evaluation logging</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {labReports.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-indigo-500/20 text-slate-400 font-medium text-xs">
                      Awaiting live workspace events. Try executing any grading tasks to pop-up live logs!
                    </div>
                  ) : (
                    labReports.map((item, idx) => (
                      <div key={item.id || idx} className="p-4 sm:p-5 bg-slate-950/80 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-cyan-400/50 transition-all">
                        <div className="space-y-1 grow">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Completed Auto-Grading Task</span>
                          </div>
                          <p className="text-xs font-bold text-slate-200">
                            Grade reported for <span className="text-cyan-400 font-bold">{item.studentName}</span>: Achieved Score of <span className="text-emerald-400 font-mono font-bold">{item.totalScore}</span>
                          </p>
                          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 uppercase">
                            <span>Task: {item.assignmentTitle}</span>
                            <span>•</span>
                            <span>File: {item.fileName}</span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setLabActiveTab('history');
                            setSelectedReportDetail(item);
                          }}
                          className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all block shrink-0 cursor-pointer"
                        >
                          Analyze Log Report
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* PERSISTENT HISTORICAL ARCHIVE VAULT TAB */}
            {labActiveTab === 'history' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="space-y-8"
              >
                {/* Archive Directory list */}
                <div className="bg-gradient-to-br from-slate-900/90 via-[#0d1230] to-indigo-950/80 border-2 border-indigo-500/30 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_0_35px_rgba(99,102,241,0.2)]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-500/20 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-500/10 border border-purple-400/30 rounded-xl text-purple-400">
                        <ClipboardList size={22} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black text-white">Archived Reports Vault</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-0.5">Educator's Gradebook database ledger</p>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Search reports by student name or task..."
                      value={archiveSearchQuery}
                      onChange={(e) => setArchiveSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-indigo-500/30 outline-none text-slate-200 text-xs px-4 py-2.5 rounded-xl w-full md:w-80 font-mono focus:border-cyan-400 transition-all"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-indigo-500/20 bg-slate-950/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-indigo-500/20 text-slate-300 font-mono text-[9px] uppercase tracking-wider [&>th]:p-3.5">
                          <th>Registered Learner</th>
                          <th>Task / Assignment Name</th>
                          <th>Suggested Score</th>
                          <th>Scanned Document Context</th>
                          <th>Graded On</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-500/10">
                        {filteredReports.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-mono text-xs">
                              No active reports found in ledger directory.
                            </td>
                          </tr>
                        ) : (
                          filteredReports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-900/60 transition-colors [&>td]:p-3.5">
                              <td>
                                {report.studentId === 'unassigned' ? (
                                  <div className="space-y-1.5 max-w-[200px]">
                                    <span className="text-amber-400 font-mono text-[10px] font-bold block animate-pulse">Learner Name not detected automatically</span>
                                    <select
                                      value={report.studentId}
                                      onChange={async (e) => {
                                        const newStuId = e.target.value;
                                        if (newStuId !== 'unassigned') {
                                          await handleReattributeReport(report.id, newStuId);
                                        }
                                      }}
                                      className="bg-slate-900 text-[10px] text-slate-200 border border-indigo-500/30 rounded-lg px-2 py-1 outline-none font-bold cursor-pointer [&>option]:bg-slate-950"
                                    >
                                      <option value="unassigned">Assign manual learner...</option>
                                      {dbStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-cyan-500/10 border border-cyan-400/30 rounded-full flex items-center justify-center text-cyan-300 text-[10px] uppercase font-mono font-bold">
                                      {report.studentName?.slice(0, 2)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-white block text-xs">{report.studentName}</span>
                                      <span className="text-[9px] text-slate-400 font-mono block">Enrolled Learner</span>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td>
                                <span className="font-bold text-slate-200 block text-xs">{report.assignmentTitle}</span>
                                <span className="text-[9px] text-slate-400 font-mono block truncate max-w-[150px]">{report.fileName}</span>
                              </td>
                              <td>
                                <span className="bg-cyan-500/10 border border-cyan-400/30 px-2.5 py-1 rounded-full text-cyan-300 font-mono font-bold text-xs">
                                  {report.totalScore}
                                </span>
                              </td>
                              <td>
                                <span className="text-[10px] text-slate-400 line-clamp-2 max-w-[180px] font-mono leading-relaxed bg-slate-900 p-2 rounded-lg border border-indigo-500/20">
                                  {report.extractedText || 'No scanning history text recorded.'}
                                </span>
                              </td>
                              <td className="text-slate-400 font-mono text-[9px] uppercase">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </td>
                              <td className="text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReportDetail(report)}
                                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                                  >
                                    Inspect Result
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm("Delete this grading report permanently?")) {
                                        await deleteDoc(doc(db, 'auto_grading_reports', report.id));
                                        triggerToast("Report deleted successfully from history ledger.", "success");
                                      }
                                    }}
                                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-2 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected archive report inspection modal */}
                <AnimatePresence>
                  {selectedReportDetail && (
                    <motion.div 
                      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="bg-gradient-to-br from-slate-900 via-[#0a0f2b] to-indigo-950 border-2 border-indigo-500/40 rounded-[32px] w-full max-w-4xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.3)] relative scrollbar-thin">
                        <button 
                          type="button"
                          onClick={() => setSelectedReportDetail(null)}
                          className="absolute top-6 right-6 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-full transition-all cursor-pointer border border-indigo-500/30"
                        >
                          <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-4">
                          <div className="p-2.5 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-cyan-400">
                            <FileCheck size={22} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-display font-black text-white">Report Insight Inspector</h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-0.5">Assigned Student: {selectedReportDetail.studentName}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-950/80 p-4 border border-indigo-500/20 rounded-2xl flex flex-col justify-center">
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider">Achieved Score</span>
                            <span className="text-2xl font-mono font-black text-cyan-300 mt-1">{selectedReportDetail.totalScore}</span>
                          </div>
                          <div className="bg-slate-950/80 p-4 border border-indigo-500/20 rounded-2xl flex flex-col justify-center col-span-2">
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider">Task Scope Reference</span>
                            <span className="text-xs font-bold text-white mt-1 truncate">{selectedReportDetail.assignmentTitle}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-slate-950/90 rounded-2xl p-6 text-slate-100 border border-indigo-500/30">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-500/20">
                              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Diagnostic Feedback Report</h4>
                              <span className="text-[9px] font-mono text-slate-400">South African CAPS evaluation criteria</span>
                            </div>
                            <div 
                              className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed [&>h3]:text-cyan-300 [&>h3]:text-base [&>h3]:font-black [&>p]:mb-3 text-xs"
                              dangerouslySetInnerHTML={{ __html: (marked.parse(selectedReportDetail.feedback || 'No remarks recorded.') as string) }}
                            />
                          </div>

                          {selectedReportDetail.marksPerQuestion && selectedReportDetail.marksPerQuestion.length > 0 && (
                            <div className="bg-slate-950/80 p-5 border border-indigo-500/20 rounded-2xl space-y-3">
                              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">Itemized Question Scoring</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[140px] overflow-y-auto pr-1">
                                {selectedReportDetail.marksPerQuestion.map((q: string, idx: number) => (
                                  <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-indigo-500/20 flex gap-2">
                                    <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">{idx+1}</span>
                                    <p className="text-xs text-slate-200 font-medium">{q}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-slate-950/60 p-5 border border-indigo-500/20 rounded-2xl space-y-2">
                            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">RAW FILE TRANSCRIPT</h4>
                            <div className="bg-slate-900 p-3.5 rounded-xl max-h-[140px] overflow-y-auto border border-indigo-500/20">
                              <p className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedReportDetail.extractedText || "No context scanned."}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-indigo-500/20">
                          <button 
                            type="button"
                            onClick={() => setSelectedReportDetail(null)}
                            className="bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 px-5 py-2.5 rounded-xl text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Close Inspector
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        );
      })()}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
