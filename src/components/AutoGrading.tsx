import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Scan, X, RefreshCw, Loader2, FileCheck, Brain, CheckCircle, AlertCircle, ChevronRight, GraduationCap, Download, Printer, UserCircle, Users, Save, Check, FileText, ClipboardList, Bookmark, Plus, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { runOCRAndGrade, runOCRScan } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

import { printContent, downloadAsHTML } from '../lib/printUtils';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

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

  // Firestore integration states
  const [dbAssignments, setDbAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  const [createdContents, setCreatedContents] = useState<any[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; type: string; dataUrl: string }[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  // Load existing assignments created by teachers
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
        setDbAssignments(list);
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

  const handleDownloadPDF = () => {
    downloadAsHTML(contentRef, "EduAI-AutoGrading.html");
  };

  const handleArchive = async () => {
    const data = mode === 'grade' ? result : extractResult;
    if (!data) return;

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
        <p><strong>Feedback:</strong> ${data.feedback}</p>
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

  const handleProcess = async (imageToProcess?: string) => {
    const imgs = imageToProcess ? [imageToProcess] : uploadedFiles.map(f => f.dataUrl);
    if (imgs.length === 0) return;
    
    setIsProcessing(true);
    setGenerationProgress(0);
    setProcessingError(null);
    setResult(null); // Clear previous result
    setExtractResult(null);
    setMode('grade');
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 8) + 2, 95));
    }, 400);

    try {
      const gradingResult = await runOCRAndGrade(imgs, rubric || "Grade accurately based on standard academic quality, checking for correctness, clarity, and completeness.", provider, ocrProvider, ocrLanguage, isHandwritten);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setResult(gradingResult);
        setIsProcessing(false);
      }, 400);
    } catch (error: any) {
      console.error("Processing error:", error);
      clearInterval(progressInterval);
      setProcessingError(error.message || "Neuro-analysis failed. Please check your AI config or try another provider.");
      setIsProcessing(false);
    }
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] text-brand-cyan font-black uppercase tracking-[0.3em] mb-3">Vision AI Laboratory</p>
          <h2 className="text-5xl font-hand text-white">Auto-Grading Studio</h2>
          <p className="text-slate-500 mt-2 max-w-xl text-sm leading-relaxed">
            Upload student assessments or use your camera to instantly extract text, apply custom rubrics, and generate professional feedback.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest pl-1">OCR Language</label>
            <select 
              value={ocrLanguage} 
              onChange={e => setOcrLanguage(e.target.value)}
              className="bg-navy-dark border border-white/10 outline-none text-slate-300 text-xs font-black uppercase tracking-widest py-3 px-4 rounded-2xl [&>option]:bg-slate-900"
            >
              <option value="English">English</option>
              {LANGUAGES.filter(l => l.value !== 'English').map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest pl-1">Handwriting Mode</label>
            <button
              id="toggle-handwritten"
              type="button"
              onClick={() => setIsHandwritten(!isHandwritten)}
              className={`py-3 px-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all h-[42px] flex items-center gap-2 cursor-pointer ${
                isHandwritten 
                  ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-sm shadow-brand-cyan/20' 
                  : 'bg-navy-dark border-white/10 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isHandwritten ? 'bg-brand-cyan animate-pulse' : 'bg-slate-600'}`} />
              {isHandwritten ? 'Handwritten' : 'Printed Text'}
            </button>
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="glass px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all border border-white/5 h-[42px]"
          >
            <Upload size={18} className="text-brand-cyan" />
            Upload Scans
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Input */}
        <div className="lg:col-span-7 space-y-8">
          {uploadedFiles.length === 0 && !isCameraActive ? (
            <button 
              onClick={startCamera}
              className="w-full aspect-[4/3] glass rounded-[48px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center group hover:border-brand-cyan/40 transition-all overflow-hidden relative p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-brand-cyan mb-6 group-hover:scale-110 transition-transform">
                <Camera size={40} />
              </div>
              <h3 className="text-2xl font-hand text-white">Initialize Visual Stream</h3>
              <p className="text-slate-500 text-xs mt-2 uppercase font-black tracking-widest">Click to scan/capture custom student work</p>
              {cameraError && (
                <div className="mt-4 flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest bg-rose-400/10 px-4 py-2 rounded-full border border-rose-400/20">
                  <AlertCircle size={14} />
                  {cameraError}
                </div>
              )}
            </button>
          ) : isCameraActive ? (
            <div className="relative aspect-[4/3] bg-black rounded-[48px] overflow-hidden border border-white/10 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 border-2 border-brand-cyan/20 pointer-events-none rounded-[48px]" />
              
              {/* Enhanced Visual Guides */}
              <div className="absolute inset-8 border-2 border-dashed border-brand-cyan/50 rounded-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-brand-cyan/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[2px] bg-brand-cyan/20 pointer-events-none" />
              
              <div className="absolute top-12 left-12 w-12 h-12 border-t-4 border-l-4 border-brand-cyan pointer-events-none rounded-tl-xl" />
              <div className="absolute top-12 right-12 w-12 h-12 border-t-4 border-r-4 border-brand-cyan pointer-events-none rounded-tr-xl" />
              <div className="absolute bottom-[110px] left-12 w-12 h-12 border-b-4 border-l-4 border-brand-cyan pointer-events-none rounded-bl-xl" />
              <div className="absolute bottom-[110px] right-12 w-12 h-12 border-b-4 border-r-4 border-brand-cyan pointer-events-none rounded-br-xl" />
 
              {/* On-screen Instructions */}
              <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 border border-white/10">
                  <AlertCircle size={16} className="text-brand-cyan" />
                  <span className="text-white text-xs font-medium tracking-wide">Align page. Take multiple shots if needed.</span>
                </div>
              </div>
              
              <div className="absolute bottom-10 inset-x-0 flex justify-center gap-6">
                <button 
                  onClick={stopCamera}
                  className="bg-white/10 backdrop-blur-md text-white p-4 rounded-3xl hover:bg-white/20 transition-all border border-white/10"
                >
                  <X size={24} />
                </button>
                <button 
                  onClick={captureImage}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-navy-dark shadow-2xl active:scale-90 transition-all hover:bg-brand-cyan ring-[10px] ring-white/10"
                >
                  <Camera size={32} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active File Preview Container */}
              <div className="relative aspect-[4/3] glass rounded-[48px] overflow-hidden border border-white/10 shadow-2xl group">
                {uploadedFiles[activePreviewIndex]?.type === 'image' ? (
                  <img 
                    src={uploadedFiles[activePreviewIndex]?.dataUrl} 
                    className="w-full h-full object-cover opacity-90" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/40 p-10">
                    <div className="w-20 h-20 bg-brand-cyan/10 rounded-3xl flex items-center justify-center text-brand-cyan mb-4">
                      {uploadedFiles[activePreviewIndex]?.type === 'pdf' ? (
                        <FileText size={40} />
                      ) : (
                        <ClipboardList size={40} />
                      )}
                    </div>
                    <p className="text-white text-base font-black uppercase tracking-wider text-center max-w-xs truncate">
                      {uploadedFiles[activePreviewIndex]?.name}
                    </p>
                    <p className="text-slate-500 text-[10px] font-mono mt-2 uppercase tracking-widest bg-navy-dark px-3 py-1 rounded-full border border-white/5">
                      {uploadedFiles[activePreviewIndex]?.type?.toUpperCase()} Document
                    </p>
                  </div>
                )}
                
                {/* Reset All Button */}
                <button 
                  onClick={reset}
                  className="absolute top-8 right-8 bg-rose-500/85 text-white p-3 py-2 rounded-2xl hover:bg-rose-600 transition-all shadow-2xl active:scale-95 text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
                >
                  <Trash size={14} />
                  Reset Queue
                </button>
              </div>

              {/* Multipage Thumbnails Carousel & Document Queue */}
              <div className="bg-navy-darker/60 p-4 rounded-3xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] uppercase font-black text-brand-cyan tracking-widest">
                    Uploaded Document Queue ({uploadedFiles.length} page/s or file/s)
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Accepts Multiple Images, PDFs, & DOCX</p>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {uploadedFiles.map((file, idx) => {
                    const isSelected = idx === activePreviewIndex;
                    return (
                      <div 
                        key={file.id}
                        className={`relative group flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                          isSelected ? 'border-brand-cyan ring-2 ring-brand-cyan/25 scale-[0.98]' : 'border-white/10 hover:border-white/30'
                        }`}
                        onClick={() => setActivePreviewIndex(idx)}
                      >
                        {file.type === 'image' ? (
                          <img src={file.dataUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/60 font-black text-[10px] text-slate-400">
                            {file.type === 'pdf' ? <span className="text-rose-400">PDF</span> : <span className="text-blue-400 font-mono">DOCX</span>}
                            <span className="text-[8px] mt-1 text-slate-500 truncate max-w-[80px] p-1">{file.name}</span>
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
                          className="absolute top-1 right-1 bg-black/80 hover:bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                      className="w-24 h-24 flex-shrink-0 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-cyan/40 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={18} className="text-brand-cyan" />
                      <span className="text-[9px] font-black uppercase text-slate-400">Add File</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-24 h-24 flex-shrink-0 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-cyan/40 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Camera size={18} className="text-brand-cyan animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-slate-400">Scan Page</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass p-10 rounded-[44px] border border-white/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-cyan/10 rounded-xl text-brand-cyan">
                <FileCheck size={20} />
              </div>
              <h3 className="text-xl font-hand text-white">Grading Parameters</h3>
            </div>

            {/* Select from Content Archive Vault / Assignments */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">
                Linked Class Assignment
              </label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => {
                  setSelectedAssignmentId(e.target.value);
                  setSelectedSubmission(null);
                  setResult(null);
                }}
                className="w-full bg-navy-dark border border-white/10 outline-none text-slate-300 text-xs font-black uppercase tracking-widest py-3.5 px-4 rounded-2xl [&>option]:bg-slate-900 cursor-pointer"
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
              <label className="text-[10px] uppercase font-black tracking-widest text-[#06b6d4] pl-1 flex items-center gap-1.5">
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
                className="w-full bg-navy-dark border border-white/10 outline-none text-slate-300 text-xs font-black uppercase tracking-widest py-3.5 px-4 rounded-2xl [&>option]:bg-slate-900 cursor-pointer"
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
              <div className="space-y-3 pt-2 bg-slate-900/10 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center pl-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#06b6d4]">
                    Student Submissions ({filteredSubmissions.length})
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Real-time sync</span>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="p-4 bg-navy-dark/40 rounded-2xl text-center border border-dashed border-white/5">
                    <p className="text-xs text-slate-500 font-medium">No students have submitted this task yet.</p>
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
                              ? 'bg-brand-cyan/25 border-brand-cyan/40 text-white'
                              : (isGraded ? 'bg-emerald-950/10 border-emerald-900/25 text-slate-300 hover:bg-white/5' : 'bg-navy-dark/40 border-white/5 text-slate-400 hover:bg-white/5')
                          }`}
                        >
                          <div>
                            <p className="text-xs font-black text-white">{sub.studentName}</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                              {sub.completedOnline ? 'Completed Online' : 'Uploaded Hand-written paper'}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {isGraded ? (
                              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                                Graded: {sub.grade}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-yellow-400 bg-yellow-950/40 px-2 py-0.5 rounded">
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
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">
                Marking Rubric / Memo Notes
              </label>
              <textarea 
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder="Enter your marking rubric, success criteria, or specific student objectives here..."
                className="w-full bg-navy-dark/40 border border-white/10 rounded-[32px] p-8 focus:border-brand-cyan focus:bg-navy-dark outline-none transition-all resize-none text-[15px] text-slate-300 placeholder:text-slate-700 leading-relaxed font-mono h-48 shadow-inner"
              />
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className={`w-full py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs flex flex-col items-center justify-center gap-4 transition-all border ${
                isProcessing ? 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan' : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                {isProcessing ? (
                  <div className="w-full px-8">
                     <div className="flex justify-between items-center w-full mb-3">
                       <span className="flex items-center gap-3"><Loader2 className="animate-spin" size={20} /> Neural Synthesis Active</span>
                       <span>{generationProgress}%</span>
                     </div>
                     <div className="w-full h-1.5 rounded-full overflow-hidden bg-navy-dark/40 border border-white/5 shadow-inner">
                       <div 
                         className="h-full bg-brand-cyan transition-all duration-300"
                         style={{ width: `${generationProgress}%` }}
                       />
                     </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleExtract()} 
                      className="flex items-center gap-2 hover:text-brand-cyan transition-colors bg-white/5 p-3 rounded-xl px-6"
                    >
                      <Scan size={18} /> Extract Text (Scan & Store)
                    </button>
                    <button 
                      onClick={() => handleProcess()} 
                      className="flex items-center gap-2 hover:text-brand-cyan transition-colors bg-brand-cyan text-navy-dark p-3 rounded-xl px-6"
                    >
                      <GraduationCap size={18} /> Autograde
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
                className="space-y-8"
              >
                {/* Result header buttons */}
                <div className="flex justify-end gap-2 mb-6">
                  <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white transition-all tooltip" title="Print Content"><Printer size={18} /></button>
                  <button onClick={handleDownloadPDF} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white transition-all tooltip" title="Download as PDF"><Download size={18} /></button>
                  <button 
                    onClick={handleArchive}
                    className={cn(
                      "transition-all px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2",
                      archiveSuccess ? "bg-emerald-500 text-white" : "bg-brand-cyan hover:bg-cyan-500 text-navy-dark"
                    )}
                  >
                     {archiveSuccess ? <Check size={16} /> : <Save size={16} />}
                     {archiveSuccess ? 'Stored' : 'Save Grading'}
                  </button>
                </div>

                <div className="pb-20 bg-white print:bg-white rounded-[32px] p-6 text-slate-900 printable-doc" ref={contentRef}>
                  {/* Score Card */}
                  <div className="glass !bg-slate-100 p-10 rounded-[48px] border border-black/10 relative overflow-hidden group mb-8">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-cyan/20 rounded-full blur-3xl transition-colors" />
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="w-24 h-24 bg-brand-cyan rounded-3xl flex flex-col items-center justify-center text-navy-dark shadow-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Score</span>
                        <span className="text-4xl font-black">{result.totalScore}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-hand text-slate-900">Grading Complete</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle size={14} className="text-emerald-500" />
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Analysis Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Rubric / Memo Corrections Log */}
                  {result.originalMemoCorrected && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-8 rounded-[40px] mb-8 relative">
                      <div className="absolute top-6 right-6 px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                        AI Corrected Memo
                      </div>
                      <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Brain size={14} />
                        Rubric / Memo Adjustments Report
                      </h4>
                      <p className="text-xs text-slate-700 font-semibold mb-4 bg-white/40 p-4 rounded-2xl border border-black/5 leading-relaxed">
                        {result.memoCorrectionReport || "The original memo had spelling/content omissions or was missing entirely. The AI corrected and streamlined the rubric for optimal auto-grading accuracy."}
                      </p>
                      {result.correctedMemo && (
                        <details className="cursor-pointer group">
                          <summary className="text-[10px] font-black uppercase tracking-widest text-[#06b6d4] select-none outline-none">
                            View Corrected Rubric & Memo Checklist
                          </summary>
                          <pre className="mt-4 p-4 bg-slate-950 text-slate-300 rounded-2xl text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-white/5">
                            {result.correctedMemo}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Feedback Box */}
                  <div className="bg-brand-cyan/10 border border-brand-cyan/30 p-8 rounded-[40px] relative mb-8">
                    <h4 className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] mb-4">Comprehensive Feedback</h4>
                    <div className="text-slate-800 font-medium italic leading-relaxed prose prose-sm max-w-none markdown-body"
                      dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(result.feedback) as string) }}
                    />
                  </div>

                  {/* Question Breakdown */}
                  <div className="glass !bg-slate-50 p-8 rounded-[40px] border border-black/5 mb-8">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Question Breakdown</h4>
                    <div className="space-y-4">
                      {result.marksPerQuestion?.map((mark: string, i: number) => (
                        <div key={i} className="flex gap-4 items-start p-4 bg-white/60 rounded-2xl border border-black/5">
                          <div className="w-8 h-8 rounded-xl bg-navy-dark flex items-center justify-center text-[10px] font-black text-brand-cyan shrink-0">
                            {i+1}
                          </div>
                          <p className="text-sm text-slate-700 font-medium pt-1 leading-relaxed">
                            {mark}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extracted Text */}
                  <div className="glass !bg-slate-50 p-8 rounded-[40px] border border-black/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">RAW DATA EXTRACTION</h4>
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-inner">
                      <p className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
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
                className="space-y-8"
              >
                {/* Result header buttons */}
                <div className="flex justify-end gap-2 mb-6">
                  <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white transition-all tooltip" title="Print Content"><Printer size={18} /></button>
                  <button onClick={handleDownloadPDF} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white transition-all tooltip" title="Download as PDF"><Download size={18} /></button>
                  <button 
                    onClick={handleArchive}
                    className={cn(
                      "transition-all px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2",
                      archiveSuccess ? "bg-emerald-500 text-white" : "bg-brand-cyan hover:bg-cyan-500 text-navy-dark"
                    )}
                  >
                     {archiveSuccess ? <Check size={16} /> : <Save size={16} />}
                     {archiveSuccess ? 'Archived' : 'Archive Document'}
                  </button>
                </div>

                 <div className="pb-20 bg-white print:bg-white rounded-[32px] p-6 text-slate-900 printable-doc" ref={contentRef}>
                  <div className="glass !bg-slate-50 p-8 rounded-[40px] border border-black/5">
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-4">
                      <FileCheck className="text-brand-cyan" size={28} />
                      <h3 className="text-2xl font-hand text-slate-900">Scanned Content</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-inner">
                      <div className="prose prose-sm max-w-none text-slate-800">
                         {/* Use simple rendering for OCR data, no markdown interpretation to prevent breaks, just pre-wrap */}
                         <p className="font-mono whitespace-pre-wrap text-sm leading-relaxed">{extractResult.extractedText}</p>
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
                className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 glass rounded-[48px] border border-white/5"
              >
                <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center text-slate-700 mb-8 border border-white/10">
                  <Brain size={40} />
                </div>
                <h3 className="text-3xl font-hand text-slate-300 mb-4">Awaiting Signal</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                  Provide an assessment scan and a custom rubric to initialize the automated grading engine.
                </p>
                <div className="mt-10 flex flex-col gap-4 w-full">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-cyan/20 w-1/3 rounded-full animate-pulse" />
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-cyan/20 w-2/3 rounded-full animate-pulse delay-75" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
