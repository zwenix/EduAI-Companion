import React, { useState, useRef } from 'react';
import { Camera, Upload, Scan, X, RefreshCw, Loader2, FileCheck, Brain, CheckCircle, AlertCircle, ChevronRight, GraduationCap, Download, Printer, UserCircle, Users, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { runOCRAndGrade, runOCRScan } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';

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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [archiveSuccess, setArchiveSuccess] = useState(false);

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

  const handleArchive = () => {
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
      const existing = JSON.parse(localStorage.getItem('eduai_archive') || '[]');
      localStorage.setItem('eduai_archive', JSON.stringify([newItem, ...existing]));
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
    const img = imageToProcess || capturedImage;
    if (!img) return;
    
    setIsProcessing(true);
    setProcessingError(null);
    setResult(null); 
    setExtractResult(null);
    setMode('extract');
    try {
      const resp = await runOCRScan(img, provider, ocrProvider, ocrLanguage);
      setExtractResult(resp);
    } catch (error: any) {
      console.error("Extraction error:", error);
      setProcessingError(error.message || "Extraction failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async (imageToProcess?: string) => {
    const img = imageToProcess || capturedImage;
    if (!img) return;
    
    setIsProcessing(true);
    setProcessingError(null);
    setResult(null); // Clear previous result
    setExtractResult(null);
    setMode('grade');
    try {
      const gradingResult = await runOCRAndGrade(img, rubric || "Grade accurately based on standard academic quality, checking for correctness, clarity, and completeness.", provider, ocrProvider, ocrLanguage);
      setResult(gradingResult);
    } catch (error: any) {
      console.error("Processing error:", error);
      setProcessingError(error.message || "Neuro-analysis failed. Please check your AI config or try another provider.");
    } finally {
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
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setExtractResult(null);
    setRubric('');
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
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="glass px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all border border-white/5 h-[42px]"
          >
            <Upload size={18} className="text-brand-cyan" />
            Upload Scan
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Input */}
        <div className="lg:col-span-7 space-y-8">
          {!capturedImage && !isCameraActive ? (
            <button 
              onClick={startCamera}
              className="w-full aspect-[4/3] glass rounded-[48px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center group hover:border-brand-cyan/40 transition-all overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-brand-cyan mb-6 group-hover:scale-110 transition-transform">
                <Camera size={40} />
              </div>
              <h3 className="text-2xl font-hand text-white">Initialize Visual Stream</h3>
              <p className="text-slate-500 text-xs mt-2 uppercase font-black tracking-widest">Click to activate camera hardware</p>
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
                  <span className="text-white text-xs font-medium tracking-wide">Align document within the frame. Ensure good lighting.</span>
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
            <div className="relative aspect-[4/3] glass rounded-[48px] overflow-hidden border border-white/10 shadow-2xl group">
              <img src={capturedImage!} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-navy-dark/20 group-hover:bg-transparent transition-colors" />
              <button 
                onClick={reset}
                className="absolute top-8 right-8 bg-brand-cyan text-navy-dark p-4 rounded-3xl hover:bg-cyan-500 transition-all shadow-2xl active:scale-95"
              >
                <RefreshCw size={24} />
              </button>
            </div>
          )}

          <div className="glass p-10 rounded-[44px] border border-white/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-cyan/10 rounded-xl text-brand-cyan">
                <FileCheck size={20} />
              </div>
              <h3 className="text-xl font-hand text-white">Grading Parameters</h3>
            </div>
            
            <textarea 
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              placeholder="Enter your marking rubric, success criteria, or specific student objectives here..."
              className="w-full bg-navy-dark/40 border border-white/10 rounded-[32px] p-8 focus:border-brand-cyan focus:bg-navy-dark outline-none transition-all resize-none text-[15px] text-slate-300 placeholder:text-slate-700 leading-relaxed font-mono h-48 shadow-inner"
            />
            
            {capturedImage && (
              <div className={`w-full py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs flex flex-col items-center justify-center gap-4 transition-all border ${
                isProcessing ? 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan' : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                {isProcessing ? (
                  <div className="flex items-center gap-3"><Loader2 className="animate-spin" size={20} /> Neural Synthesis Active</div>
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

                  {/* Feedback Box */}
                  <div className="bg-brand-cyan/10 border border-brand-cyan/30 p-8 rounded-[40px] relative mb-8">
                    <h4 className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] mb-4">Comprehensive Feedback</h4>
                    <div className="text-slate-800 font-medium italic leading-relaxed prose prose-sm max-w-none markdown-body"
                      dangerouslySetInnerHTML={{ __html: marked.parse(result.feedback) as string }}
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
